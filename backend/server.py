from fastapi import FastAPI, APIRouter, HTTPException, Request
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
import re
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone

try:
    from anthropic import AsyncAnthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False
    AsyncAnthropic = None

from video_engine import generate_listing_video, MUSIC_TRACKS
from email_engine import send_guide_drip, send_pro_welcome, send_email
import stripe as stripe_sdk
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')
MAKE_WEBHOOK_URL = os.environ.get('MAKE_WEBHOOK_URL', '')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
DEFAULT_PROVIDER = "anthropic"
DEFAULT_MODEL = "claude-sonnet-4-5-20250929"

if STRIPE_API_KEY:
    stripe_sdk.api_key = STRIPE_API_KEY

# Server-side fixed pricing — NEVER accept amounts from frontend
PACKAGES = {
    "guide_pdf":   {"amount":  20.00, "currency": "usd", "name": "ListWorks Guide PDF",          "kind": "guide"},
    "pro_month":   {"amount":  49.00, "currency": "usd", "name": "ListGenius Pro — 1 Month",     "kind": "pro"},
    "pro_annual":  {"amount": 470.00, "currency": "usd", "name": "ListGenius Pro — Annual",      "kind": "pro"},
    "lifetime":    {"amount": 299.00, "currency": "usd", "name": "ListWorks Lifetime — All-In",  "kind": "lifetime"},
    "credits_10":  {"amount":   5.00, "currency": "usd", "name": "10 AI Rewrite Credits",        "kind": "credits", "credits": 10},
    "credits_50":  {"amount":  19.00, "currency": "usd", "name": "50 AI Rewrite Credits",        "kind": "credits", "credits": 50},
}

# Free tier: how many free rewrites per anonymous session before paywall
FREE_REWRITES_PER_SESSION = 3

SLACK_WEBHOOK_URL = os.environ.get("SLACK_WEBHOOK_URL", "")

VIDEO_DIR = (ROOT_DIR / "static" / "videos").resolve()
VIDEO_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="ListWorks PRO API")
api_router = APIRouter(prefix="/api")


# ============== MODELS ==============
class RewriteRequest(BaseModel):
    raw_listing: str
    tone: str = "Modern"
    address: Optional[str] = None
    price: Optional[str] = None
    beds: Optional[str] = None
    baths: Optional[str] = None
    sqft: Optional[str] = None
    session_id: Optional[str] = None


class RewriteOutput(BaseModel):
    id: str
    mls: str
    instagram: str
    facebook: str
    headlines: List[str]
    email: str
    listing_strength: float
    strength_reasons: List[str]
    tone: str
    raw_listing: str
    created_at: str


class BatchRewriteRequest(BaseModel):
    listings: List[RewriteRequest]


class BatchRewriteResponse(BaseModel):
    results: List[RewriteOutput]
    success_count: int
    failed_count: int


class TemplateSaveRequest(BaseModel):
    name: str
    tone: str
    is_default: bool = False


class Template(BaseModel):
    id: str
    name: str
    tone: str
    created_at: str


class PhotoAnalyzeRequest(BaseModel):
    image_base64: str
    mime_type: str = "image/jpeg"


class PhotoAnalyzeResponse(BaseModel):
    features: List[str]
    style: str
    suggested_headline: str


class FeedbackRequest(BaseModel):
    email: str
    message: str


class AdvisorMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class AdvisorRequest(BaseModel):
    listing_id: Optional[str] = None
    question: str
    history: List[AdvisorMessage] = []


class AdvisorResponse(BaseModel):
    reply: str


class VideoGenerateRequest(BaseModel):
    listing_id: Optional[str] = None
    photos: List[str]  # base64 or data: URLs
    slides: List[str]
    music_id: str = "cinematic"
    voiceover_audio: Optional[str] = None  # base64 (recorded by agent)
    voiceover_text: Optional[str] = None   # if no audio, generate via TTS
    use_ai_voice: bool = True
    agent_name: Optional[str] = None
    agent_brokerage: Optional[str] = None
    fmt: str = "16:9"  # "16:9" or "9:16"


class VideoGenerateResponse(BaseModel):
    id: str
    url: str
    duration: float
    format: str


class ExpiredListingRequest(BaseModel):
    address: str
    price: Optional[str] = None
    beds: Optional[str] = None
    baths: Optional[str] = None
    sqft: Optional[str] = None
    seller_name: Optional[str] = None
    days_on_market: Optional[str] = None
    original_price: Optional[str] = None
    listing_reason: Optional[str] = None  # "relocating", "priced_too_high", "not_selling", "other"


class ExpiredListingScripts(BaseModel):
    cold_call_script: str
    voicemail_script: str
    text_message: str
    door_knock_script: str


class RedfinImportRequest(BaseModel):
    redfin_url: str


class RedfinPropertyData(BaseModel):
    address: str
    price: Optional[str] = None
    beds: Optional[str] = None
    baths: Optional[str] = None
    sqft: Optional[str] = None
    year_built: Optional[str] = None
    property_type: Optional[str] = None
    lot_size: Optional[str] = None
    parking: Optional[str] = None
    description: Optional[str] = None


# ============== AI HELPERS ==============
TONE_GUIDE = {
    "Luxury": "Refined, aspirational, evocative. Cinematic adjectives. Status, exclusivity, timelessness.",
    "Cozy": "Warm, inviting, family-forward. Comfort, quiet mornings, gathering, home-feel.",
    "Modern": "Clean, confident, design-aware. Architecture, light, lines, lifestyle.",
    "Family": "Friendly, practical, neighborhood-aware. Schools, yard, room to grow, safety.",
    "Investor": "Data-forward, ROI-aware. Cap rate potential, rental comps, location upside, low maintenance.",
}

REWRITE_SYSTEM = """You are ListWorks PRO — a professional real estate copywriter trained
on the official ListWorks framework. Your writing is confident, specific, and
emotionally resonant. You make buyers FEEL something first, then give them facts
to justify that feeling.

═══════════════════════════════════════════════════════════════
THE LISTWORKS 5-PART STRUCTURE (use for MLS, Facebook, Email)
═══════════════════════════════════════════════════════════════
1. THE OPENING HOOK — stops the scroll, earns the read.
2. THE LIFESTYLE PARAGRAPH — sells the LIFE, not the specs.
3. THE FEATURE TRANSLATION LAYER — convert specs into desire using FBF.
4. THE NEIGHBORHOOD & CONTEXT — place the buyer in the world of this home.
5. THE CALL TO ACTION — confidence without begging.

═══════════════════════════════════════════════════════════════
FEATURE → BENEFIT → FEELING (FBF)
═══════════════════════════════════════════════════════════════
Feature: what it has → Benefit: what it does → Feeling: how it feels.
Always write the FEELING.

═══════════════════════════════════════════════════════════════
BUYER TRIGGERS (activate at least one per asset)
═══════════════════════════════════════════════════════════════
Belonging · Status · Safety · Urgency

═══════════════════════════════════════════════════════════════
HARD RULES — DO NOT VIOLATE
═══════════════════════════════════════════════════════════════
BANNED: "Welcome to", "Don't miss", "Must see", "Spacious", "Cozy" (cliché),
"Motivated seller", "Charming", "Nestled", "Won't last", "Priced to sell",
"Call for details".
DO NOT open with the address or property type. No more than 2 adjectives in a row.
No sentence longer than 25 words. Max one exclamation per asset. No bullet points.

═══════════════════════════════════════════════════════════════
OUTPUT — STRICT JSON ONLY (no markdown, no commentary)
═══════════════════════════════════════════════════════════════
{
  "mls": "200-250 words. Full 5-part structure. Flowing paragraphs. Soft confident CTA.",
  "instagram": "100-130 words. Hook line works without image. Conversational. Ends with question or CTA. Final line: 12-15 targeted hashtags separated by spaces.",
  "facebook": "150-180 words. Story-driven, lifestyle-led. Ends with low-pressure CTA.",
  "headlines": [
    "3 scroll-stopping headlines, under 10 words each.",
    "Variation 1 leads with EMOTION.",
    "Variation 2 leads with SPECIFICITY.",
    "Variation 3 leads with URGENCY."
  ],
  "email": "120-160 words. First line: 'Subject: …'. Blank line. Then body. Personal, warm, confident.",
  "listing_strength": 7.4,
  "strength_reasons": [
    "3-4 short reasons explaining the score, citing real elements (e.g. 'Specific neighborhood detail used', 'Clear FBF translation in lifestyle paragraph').",
    "If score is below 9, include 1-2 concrete suggestions to improve it."
  ]
}

The listing_strength is a number 0-10 (one decimal), reflecting how well the SOURCE
input + your output expresses the framework. Be honest — most rewrites land between
6.5 and 8.5. Reserve 9+ for inputs with strong specificity.
"""

EXPIRED_LISTING_SYSTEM = """You are ListWorks PRO — a real estate marketing expert specializing in expired listings.
Your job is to write outreach scripts that get the seller to pick up the phone or agree to a meeting.

══════════════════════════════════════════════════════════════
TONE: Professional, empathetic, confident. Never desperate or pushy.
══════════════════════════════════════════════════════════════

The seller just went through a failed listing attempt. They're likely frustrated, skeptical, and cautious.
Your scripts must:
- Acknowledge their experience without making them feel stupid
- Show you understand their situation
- Offer a clear, low-pressure next step
- NEVER criticize their previous agent
- Use "we" more than "I" to sound like a team

══════════════════════════════════════════════════════════════
SCRIPT TYPES REQUIRED (JSON output)
══════════════════════════════════════════════════════════════
1. COLD CALL SCRIPT: 150-200 words. Opening hook → acknowledge → value proposition → objection handling → CTA.
   Start with their name. Use the address naturally. End with a specific question, not "call me."

2. VOICEMAIL SCRIPT: 30-45 seconds (60-80 words). Hook → context → callback request with specific time.
   Must work as audio only — no context needed. Speak naturally.

3. TEXT MESSAGE: Under 160 characters. Casual but professional. Include address and one key value hook.
   End with a question to trigger response.

4. DOOR KNOCK SCRIPT: 200-250 words. Greeting → acknowledge expired → brief value → ask for 5 min conversation → offer specific time.

HARD RULES:
- Use the seller's name when provided
- Use the property address in every script
- Include days on market if provided to show research
- Never say "expired" negatively — use "previous listing" or "your home was on the market"
- Offer ONE clear next step per script
- No heavy sales language — be a helpful expert, not a closer
- Include your agent name placeholder: [YOUR_NAME]

══════════════════════════════════════════════════════════════
OUTPUT — STRICT JSON ONLY
══════════════════════════════════════════════════════════════
{
  "cold_call_script": "...",
  "voicemail_script": "...",
  "text_message": "...",
  "door_knock_script": "..."
}
"""

REDFIN_IMPORT_SYSTEM = """You are a real estate data extraction assistant. Your job is to extract property details from Redfin listing URLs.

TONE: Accurate, precise, factual. No marketing language.

Extract the following fields from the Redfin listing:
- address: Full street address
- price: Current listing price (just the number with $)
- beds: Number of bedrooms
- baths: Number of bathrooms  
- sqft: Square footage
- year_built: Year built
- property_type: Type (e.g., Single Family, Condo, Townhouse)
- lot_size: Lot size (e.g., 0.25 acres or 10,000 sqft)
- parking: Parking details (e.g., 2-car garage, driveway)
- description: The listing description/remarks from the seller

If a field is not available on the listing, use null or omit it.

HARD RULES:
- Extract ONLY what's visible on the listing page
- Don't make up data
- Price should include $ and commas (e.g., $750,000)
- Beds/baths can be decimals (e.g., 2.5)
- Address should be complete (street, city, state, zip)

OUTPUT — STRICT JSON ONLY:
{
  "address": "...",
  "price": "$...",
  "beds": "...",
  "baths": "...",
  "sqft": "...",
  "year_built": "...",
  "property_type": "...",
  "lot_size": "...",
  "parking": "...",
  "description": "..."
}
"""


def _strip_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?", "", text).strip()
        if text.endswith("```"):
            text = text[:-3].strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        text = text[start:end+1]
    return text


def _build_user_prompt(req: RewriteRequest) -> str:
    tone_desc = TONE_GUIDE.get(req.tone, TONE_GUIDE["Modern"])
    meta = []
    if req.address: meta.append(f"Address: {req.address}")
    if req.price: meta.append(f"Price: {req.price}")
    if req.beds: meta.append(f"Beds: {req.beds}")
    if req.baths: meta.append(f"Baths: {req.baths}")
    if req.sqft: meta.append(f"Sqft: {req.sqft}")
    meta_str = "\n".join(meta) if meta else "No metadata provided."
    return f"""TONE: {req.tone}
TONE GUIDE: {tone_desc}

PROPERTY METADATA:
{meta_str}

RAW / BORING LISTING:
{req.raw_listing}

Now produce the JSON object. JSON only."""


async def call_rewrite_llm(req: RewriteRequest) -> Dict[str, Any]:
    if not EMERGENT_LLM_KEY:
        raise HTTPException(500, "LLM key missing")

    if not HAS_ANTHROPIC:
        raise HTTPException(500, "anthropic package not installed")

    client = AsyncAnthropic(api_key=EMERGENT_LLM_KEY)
    user_text = _build_user_prompt(req)

    response = client.messages.create(
        model=DEFAULT_MODEL,
        max_tokens=1024,
        system=REWRITE_SYSTEM,
        messages=[{"role": "user", "content": user_text}],
    )
    cleaned = _strip_json(response.content[0].text)
    try:
        data = json.loads(cleaned)
    except Exception as e:
        logging.exception("JSON parse failed")
        raise HTTPException(500, f"AI returned invalid JSON: {str(e)[:120]}")

    headlines = data.get("headlines", [])
    if isinstance(headlines, str):
        headlines = [h.strip("- •*").strip() for h in headlines.split("\n") if h.strip()]
    headlines = [h.strip() for h in headlines if h.strip()][:3]

    reasons = data.get("strength_reasons", [])
    if isinstance(reasons, str):
        reasons = [r.strip() for r in reasons.split("\n") if r.strip()]

    try:
        strength = float(data.get("listing_strength", 7.0))
    except (TypeError, ValueError):
        strength = 7.0
    strength = max(0.0, min(10.0, round(strength, 1)))

    return {
        "mls": data.get("mls", "").strip(),
        "instagram": data.get("instagram", "").strip(),
        "facebook": data.get("facebook", "").strip(),
        "headlines": headlines,
        "email": data.get("email", "").strip(),
        "listing_strength": strength,
        "strength_reasons": [r for r in reasons if isinstance(r, str)][:5],
    }


# ============== RATE LIMITING + BOT PROTECTION ==============
_free_rewrites_per_session: Dict[str, int] = {}
_rate_limit_log: Dict[str, list] = {}
_rate_limit_lock = asyncio.Lock()


async def _is_rate_limited(session_id: str, endpoint: str, limit: int = 20, window: int = 60) -> bool:
    """Block if an IP/session exceeds `limit` requests to `endpoint` within `window` seconds."""
    if not session_id:
        return False
    key = f"{session_id}:{endpoint}"
    now = datetime.now(timezone.utc)
    cutoff = now.timestamp() - window

    async with _rate_limit_lock:
        timestamps = _rate_limit_log.get(key, [])
        timestamps = [t for t in timestamps if t > cutoff]
        if len(timestamps) >= limit:
            _rate_limit_log[key] = timestamps
            return True
        timestamps.append(now.timestamp())
        _rate_limit_log[key] = timestamps
        return False


def _is_bot_request(request: Request, session_id: str) -> tuple[bool, str]:
    """Detect obvious bot / scraper patterns. Returns (is_bot, reason)."""
    ua = request.headers.get("user-agent", "").lower()
    real_mobile_patterns = ["mozilla/5.0", "mobile ", "android", "iphone", "ipad"]
    is_likely_real = any(p in ua for p in real_mobile_patterns) if ua else False

    if not ua:
        return True, "no user-agent"
    if "curl" in ua or "wget" in ua or "python" in ua or "scrap" in ua:
        return True, "suspicious user-agent"
    if not session_id or len(session_id) < 10:
        return True, "invalid session"
    if session_id.startswith("s_") and len(session_id) < 20:
        return True, "session too short"
    if not is_likely_real and any(k in ua for k in ["bot", "crawler", "spider", "slurp"]):
        return True, "bot detected"
    return False, ""


# Hard 3-trial limit: track FREE rewrites used per session (in-memory, no DB hit)
FREE_TRIALS_PER_SESSION = 3


def _check_free_trial(session_id: str) -> tuple[bool, int]:
    """Returns (allowed, remaining). Tracks usage in-process memory."""
    if not session_id:
        return True, 0
    used = _free_rewrites_per_session.get(session_id, 0)
    if used >= FREE_TRIALS_PER_SESSION:
        return False, 0
    return True, FREE_TRIALS_PER_SESSION - used


def _record_free_trial(session_id: str) -> None:
    if session_id:
        _free_rewrites_per_session[session_id] = _free_rewrites_per_session.get(session_id, 0) + 1


# ============== OPEN HOUSE CAPTURE ==============
class OpenHouseCreateIn(BaseModel):
    address: str
    listing_url: Optional[str] = None
    agent_name: str
    agent_phone: str
    agent_email: str
    session_id: Optional[str] = None


class OpenHouseVisitorIn(BaseModel):
    event_id: str
    visitor_name: Optional[str] = None
    visitor_phone: Optional[str] = None
    visitor_email: Optional[str] = None
    message: Optional[str] = None
    source: Optional[str] = "qr"  # qr | text | manual


@api_router.post("/openhouse/create")
async def openhouse_create(req: OpenHouseCreateIn, request: Request):
    is_bot, reason = _is_bot_request(request, req.session_id or "")
    if is_bot:
        raise HTTPException(403, f"Request blocked: {reason}")

    event_id = str(uuid.uuid4())[:8]
    created_at = datetime.now(timezone.utc).isoformat()

    event = {
        "event_id": event_id,
        "address": req.address.strip(),
        "listing_url": req.listing_url or "",
        "agent_name": req.agent_name.strip(),
        "agent_phone": req.agent_phone.strip(),
        "agent_email": req.agent_email.strip(),
        "session_id": req.session_id,
        "created_at": created_at,
        "status": "active",
    }
    await db.openhouse_events.insert_one(event)

    frontend_url = os.environ.get("FRONTEND_URL", "https://listworks.pro")
    checkin_url = f"{frontend_url}/openhouse/{event_id}"
    share_link = f"https://listworks.pro/?ref=oh&event={event_id}"

    return {
        "event_id": event_id,
        "checkin_url": checkin_url,
        "share_link": share_link,
        "qr_data": checkin_url,
        "address": req.address,
    }


@api_router.post("/openhouse/checkin")
async def openhouse_checkin(req: OpenHouseVisitorIn, request: Request):
    is_bot, reason = _is_bot_request(request, "")
    if is_bot:
        raise HTTPException(403, f"Request blocked: {reason}")

    if await _is_rate_limited("", "checkin", 5, 60):
        raise HTTPException(429, "Too many checkins. Slow down.")

    event = await db.openhouse_events.find_one({"event_id": req.event_id})
    if not event:
        raise HTTPException(404, "Event not found")

    visitor = {
        "event_id": req.event_id,
        "name": (req.visitor_name or "").strip()[:100],
        "phone": (req.visitor_phone or "").strip()[:20],
        "email": (req.visitor_email or "").strip().lower()[:254],
        "message": (req.message or "").strip()[:500],
        "source": req.source or "qr",
        "checked_in_at": datetime.now(timezone.utc).isoformat(),
        "drip_sent": False,
        "drip_step": 0,
    }
    result = await db.openhouse_visitors.insert_one(visitor)
    visitor_id = str(result.inserted_id)

    if visitor["email"] and RESEND_API_KEY:
        await _send_openhouse_drip(visitor["email"], visitor["name"], event)

    return {
        "ok": True,
        "visitor_id": visitor_id,
        "message": f"Thanks for visiting {event['address']}! The agent will follow up shortly.",
    }


async def _send_openhouse_drip(email: str, name: str, event: dict) -> None:
    frontend_url = os.environ.get("FRONTEND_URL", "https://listworks.pro")
    address = event.get("address", "")
    agent_name = event.get("agent_name", "")
    agent_phone = event.get("agent_phone", "")
    body = f"""Hi{name and f" {name}" or " there"},

Thanks for visiting {address}! It was great meeting{name and f" you" or ""}.

If you have any questions about the property or want to schedule a showing, feel free to reach out:

{agent_name}
{agent_phone}

Here's the full listing with AI-generated copy:
{frontend_url}

Looking forward to connecting!

Best,
{agent_name}
"""
    try:
        await asyncio.to_thread(
            send_email,
            to=email,
            subject=f"Thanks for visiting {address}!",
            body=body,
            tag="openhouse_visitor",
        )
        await db.openhouse_visitors.update_one(
            {"event_id": event["event_id"], "email": email},
            {"$set": {"drip_sent": True}},
        )
    except Exception as e:
        logger.warning("Open house drip send failed: %s", e)


@api_router.get("/openhouse/{event_id}/visitors")
async def openhouse_visitors(event_id: str, request: Request):
    is_bot, reason = _is_bot_request(request, "")
    if is_bot:
        raise HTTPException(403, f"Request blocked: {reason}")

    event = await db.openhouse_events.find_one({"event_id": event_id})
    if not event:
        raise HTTPException(404, "Event not found")

    cursor = db.openhouse_visitors.find(
        {"event_id": event_id},
        {"_id": 0, "name": 1, "phone": 1, "email": 1, "source": 1, "checked_in_at": 1, "drip_sent": 1},
    ).sort("checked_in_at", -1)
    visitors = await cursor.to_list(length=200)

    return {
        "event_id": event_id,
        "address": event["address"],
        "total": len(visitors),
        "visitors": visitors,
    }


# ============== FAIR HOUSING COMPLIANCE GUARD ==============
FH_VIOLATION_PATTERNS = [
    (r"\b(perfect for|ideal for|great for)\s+(families?|kids?|children)\b", "Avoid describing a home as ideal for families with children — may constitute familial status discrimination."),
    (r"\b(quiet|peaceful|tranquil)\s+(neighborhood|area)\b", "Describing a neighborhood as 'quiet' can imply homogeneity — avoid in favor of specific community facts."),
    (r"\b(walking distance|steps? from|near|close to)\s+(school|church|park|transit|shuttle)\b", "Proximity to schools/churches/transit can imply discriminatory preference under FHA."),
    (r"\b(master\s+suite|master\s+bed|master\s+bath)\b", "'Master' terminology is being retired industry-wide — use 'primary suite' instead."),
    (r"\b(adult\s+(living|community|home|only))\b", "Adult-only communities have specific FHA exemptions — verify before using this language."),
    (r"\b(no\s+kids|pets? ok|no\s+pets?)\b", "Pet and occupancy policies have strict FHA guidelines — avoid casual language."),
    (r"\b(exclusive|premium|prestigious)\b", "These terms may imply discriminatory preference — use specific property facts instead."),
    (r"\b(traditional\s+family|family-oriented)\b", "Family status discrimination risk — describe community amenities instead."),
    (r"\b(heterosexual|gay|lesbian|LGBTQ|immigrant|religion)\b", "Never reference protected classes in listing copy."),
    (r"\b(minority|ethnic|demographic)\b", "Never reference demographic characteristics in listing copy."),
]


def _check_fair_housing(raw_text: str) -> list[dict]:
    violations = []
    text_lower = raw_text.lower()
    for pattern, explanation in FH_VIOLATION_PATTERNS:
        matches = re.findall(pattern, text_lower, re.IGNORECASE)
        if matches:
            violations.append({
                "phrase": matches[0] if isinstance(matches[0], str) else matches[0][0] if matches[0] else "",
                "risk": "HIGH",
                "rule": "FHA Protected Class / Discriminatory Language",
                "fix": explanation,
            })
    return violations


async def _get_usage(session_id: Optional[str]) -> dict:
    """Resolve a session's free quota status, paid credits, and Pro entitlement."""
    if not session_id:
        return {"is_pro": False, "credits": 0, "free_used": 0,
                "free_remaining": FREE_REWRITES_PER_SESSION, "paywall": False}

    # Check Pro / Lifetime entitlement (unlimited)
    pro = await db.entitlements.find_one(
        {"lw_session_id": session_id, "kind": {"$in": ["pro", "lifetime"]}}, {"_id": 0}
    )
    is_pro = bool(pro)

    # Paid credits balance
    cdoc = await db.credits.find_one({"lw_session_id": session_id}, {"_id": 0})
    credits = int((cdoc or {}).get("balance", 0))

    # Free rewrites used (counted from listings table)
    free_used = await db.listings.count_documents({"session_id": session_id})
    free_remaining = max(0, FREE_REWRITES_PER_SESSION - free_used)

    # Allowed if Pro, has credits, or has free remaining
    allowed = is_pro or credits > 0 or free_remaining > 0
    return {
        "is_pro": is_pro,
        "credits": credits,
        "free_used": free_used,
        "free_remaining": free_remaining,
        "paywall": not allowed,
    }


@api_router.get("/usage/{session_id}")
async def get_usage(session_id: str):
    """Frontend reads this to know whether to show the paywall modal."""
    return await _get_usage(session_id)


# ============== AFFILIATE TRACKING ==============
# Commission: 30% recurring on Pro · 30% one-time on PDF/Lifetime/Credits
COMMISSION_RATE = 0.30


@api_router.get("/affiliate/{ref}")
async def affiliate_stats(ref: str):
    """Public dashboard for an affiliate. Anyone with the URL sees their stats.
    Format: GET /api/affiliate/mike → totals + recent referred sales.
    """
    ref = ref.strip().lower()
    if not ref or len(ref) > 64:
        raise HTTPException(400, "Invalid ref")

    # All paid txns attributed to this ref
    cursor = db.payment_transactions.find(
        {"ref": ref, "payment_status": "paid"},
        {"_id": 0, "stripe_session_id": 1, "amount": 1,
         "package_kind": 1, "package_id": 1, "paid_at": 1, "drip_email": 1},
    ).sort("paid_at", -1)
    sales = await cursor.to_list(length=500)

    total_revenue = sum(s.get("amount", 0) for s in sales)
    total_commission = round(total_revenue * COMMISSION_RATE, 2)

    # Total clicks (anyone who landed with the ref param — frontend posts to /api/ref-click)
    clicks = await db.ref_clicks.count_documents({"ref": ref})

    return {
        "ref": ref,
        "clicks": clicks,
        "sales_count": len(sales),
        "total_revenue": round(total_revenue, 2),
        "commission_rate": COMMISSION_RATE,
        "commission_owed": total_commission,
        "recent_sales": [
            {
                "amount": s.get("amount"),
                "package": s.get("package_id"),
                "kind": s.get("package_kind"),
                "paid_at": s.get("paid_at"),
                # Don't leak full email — show first letter + domain
                "buyer": _mask_email(s.get("drip_email") or ""),
            }
            for s in sales[:50]
        ],
    }


def _mask_email(email: str) -> str:
    if not email or "@" not in email:
        return ""
    local, _, domain = email.partition("@")
    return f"{local[0]}***@{domain}"


class RefClickIn(BaseModel):
    ref: str
    path: Optional[str] = "/"


@api_router.post("/ref-click")
async def track_ref_click(req: RefClickIn):
    """Frontend pings this when a visitor lands with ?ref=xyz so we know the click happened
    even if they never buy. Used for affiliate conversion-rate analytics."""
    ref = req.ref.strip().lower()[:64]
    if not ref:
        return {"ok": False}
    await db.ref_clicks.insert_one({
        "ref": ref,
        "path": req.path,
        "at": datetime.now(timezone.utc).isoformat(),
    })
    return {"ok": True}


# ============== AFFILIATE SELF-SIGNUP ==============
class AffiliateCreateIn(BaseModel):
    name: str
    email: str
    ref: Optional[str] = None


@api_router.post("/affiliate/create")
async def affiliate_create(req: AffiliateCreateIn):
    name = req.name.strip()[:100]
    email = req.email.strip().lower()[:254]
    if "@" not in email or "." not in email:
        raise HTTPException(400, "Invalid email")
    if not name:
        raise HTTPException(400, "Name required")

    existing = await db.affiliates.find_one({"email": email})
    if existing:
        ref = existing["ref"]
    else:
        ref = name.lower().replace(" ", "-").replace("@", "").replace(".", "")[:32]
        ref = ref + "-" + str(uuid.uuid4())[:6]
        ref = ref.strip("-")

        await db.affiliates.insert_one({
            "ref": ref,
            "name": name,
            "email": email,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "commission_rate": COMMISSION_RATE,
            "status": "active",
        })

        if RESEND_API_KEY:
            await _send_affiliate_welcome(email, name, ref)

    frontend_url = os.environ.get("FRONTEND_URL", "https://listworks.pro")
    link = f"{frontend_url}/?ref={ref}"
    return {"ref": ref, "link": link, "commission_rate": int(COMMISSION_RATE * 100)}


async def _send_affiliate_welcome(email: str, name: str, ref: str) -> None:
    from email_engine import send_email
    frontend_url = os.environ.get("FRONTEND_URL", "https://listworks.pro")
    link = f"{frontend_url}/?ref={ref}"
    dashboard = f"{frontend_url}/affiliate/{ref}"
    body = f"""Hey {name},

You are officially a ListWorks PRO affiliate! Congrats.

Here's your referral link:
{link}

Your dashboard (share this URL with anyone):
{dashboard}

You'll earn 30% of every sale your link brings in. We pay out monthly via Stripe once you hit $50.

How to earn:
1. Share your link with fellow real estate agents
2. Post it on social media
3. Text it to your sphere

The first 3 rewrites are free — so there's zero friction for them to try it.

Let's get you paid.

— The ListWorks PRO Team
"""
    try:
        await asyncio.to_thread(
            send_email,
            to=email,
            subject=f"You are a ListWorks PRO Affiliate, {name}!",
            body=body,
        )
    except Exception as e:
        logger.warning("Could not send affiliate welcome email to %s: %s", email, e)


# ============== AFFILIATE DASHBOARD (full stats + recent sales) ==============
@api_router.get("/affiliate/dashboard/{ref}")
async def affiliate_full(ref: str):
    basic = await db.affiliates.find_one({"ref": ref.strip().lower()}, {"_id": 0})
    if not basic:
        raise HTTPException(404, "Affiliate not found")

    ref_lower = ref.strip().lower()
    cursor = db.payment_transactions.find(
        {"ref": ref_lower, "payment_status": "paid"},
        {"_id": 0, "stripe_session_id": 1, "amount": 1,
         "package_kind": 1, "package_id": 1, "paid_at": 1, "drip_email": 1},
    ).sort("paid_at", -1)
    sales = await cursor.to_list(length=500)

    total_revenue = sum(s.get("amount", 0) for s in sales)
    total_commission = round(total_revenue * COMMISSION_RATE, 2)
    clicks = await db.ref_clicks.count_documents({"ref": ref_lower})
    conversion = round(len(sales) / clicks * 100, 1) if clicks > 0 else 0.0

    return {
        **basic,
        "clicks": clicks,
        "sales_count": len(sales),
        "total_revenue": round(total_revenue, 2),
        "commission_owed": total_commission,
        "conversion": conversion,
        "recent_sales": [
            {
                "amount": s.get("amount"),
                "package": s.get("package_id"),
                "kind": s.get("package_kind"),
                "paid_at": s.get("paid_at"),
                "buyer": _mask_email(s.get("drip_email") or ""),
            }
            for s in sales[:50]
        ],
    }


# ============== AFFILIATE SHARE TEXT (AI-crafted copy) ==============
class ShareTextRequest(BaseModel):
    ref: str
    platform: Optional[str] = "twitter"
    tone: Optional[str] = "casual"
    custom_note: Optional[str] = None


SHARE_PROMPTS = {
    "twitter": {
        "prefix": "listing copy that actually sells homes",
        "body": "I used this AI tool to rewrite a boring MLS draft in 10 seconds — Instagram caption, FB post, 5 headlines, email blast. First 3 free",
        "hashtags": "#realestate #realestateagent #listings",
    },
    "facebook": {
        "prefix": "Just tried this for listing copy",
        "body": "3 bed 2 bath ranch to Instagram caption + FB post + 5 headlines + email blast, all in 10 seconds. First 3 free.",
        "hashtags": "",
    },
    "linkedin": {
        "prefix": "Sharing a tool that has changed how I do listing copy",
        "body": "Paste a boring MLS draft, get publish-ready Instagram, Facebook, 5 headlines, and email blast in 10 seconds. First 3 free.",
        "hashtags": "",
    },
    "text": {
        "prefix": "Check this out",
        "body": "ListWorks PRO — paste your boring MLS draft, get publish-ready copy in 10 seconds. Instagram, Facebook, 5 headlines, email. First 3 free.",
        "hashtags": "",
    },
}


@api_router.post("/affiliate/share-text")
async def affiliate_share_text(req: ShareTextRequest):
    ref = req.ref.strip().lower()[:64]
    if not ref:
        raise HTTPException(400, "ref required")

    template = SHARE_PROMPTS.get(req.platform, SHARE_PROMPTS["twitter"])
    frontend_url = os.environ.get("FRONTEND_URL", "https://listworks.pro")
    link = f"{frontend_url}/?ref={ref}"
    parts = [template["prefix"], template["body"], link]
    if template["hashtags"]:
        parts.append(template["hashtags"])
    if req.custom_note:
        parts.insert(0, req.custom_note)

    copy = "\n\n".join(parts)

    twitter_url = f"https://twitter.com/intent/tweet?text={encodeURIComponent(copy)}"
    fb_url = f"https://www.facebook.com/sharer/sharer.php?u={encodeURIComponent(link)}"
    li_url = f"https://www.linkedin.com/sharing/share-offsite/?url={encodeURIComponent(link)}"

    return {
        "copy": copy,
        "platforms": {
            "twitter": twitter_url,
            "facebook": fb_url,
            "linkedin": li_url,
            "text": None,
        },
    }


# ============== FAIR HOUSING ANALYSIS ==============
class FairHousingIn(BaseModel):
    text: str


@api_router.post("/analyze/fair-housing")
async def analyze_fair_housing(req: FairHousingIn):
    if not req.text or len(req.text.strip()) < 20:
        raise HTTPException(400, "Text too short")
    violations = _check_fair_housing(req.text)
    return {
        "violations": violations,
        "total": len(violations),
        "clean": len(violations) == 0,
    }


# ============== VOICE-TO-DESCRIPTION ==============
class VoiceDescriptionIn(BaseModel):
    transcript: str
    tone: Optional[str] = "Modern"


VOICE_POLISH_SYSTEM = """You are a professional real estate listing copywriter. An agent has narrated their observations while walking through a property. Your job is to transform their natural, conversational speech into a polished, professional listing description.

Rules:
- Preserve specific, impressive details (square footage, material names, years)
- Fix grammar, remove rambling, eliminate "um" and "uh" filler
- Keep the agent's genuine enthusiasm and authentic observations
- Write in active, confident voice
- No invented details — if the agent didn't mention it, don't add it
- Keep length proportional to the input (don't pad or truncate unnaturally)

Return JSON with a single key "raw_description" containing the polished text."""


@api_router.post("/analyze/voice-description")
async def analyze_voice_description(req: VoiceDescriptionIn):
    if not req.transcript or len(req.transcript.strip()) < 5:
        raise HTTPException(400, "Transcript too short")

    if not EMERGENT_LLM_KEY or not HAS_ANTHROPIC:
        raise HTTPException(500, "AI not configured")

    client = AsyncAnthropic(api_key=EMERGENT_LLM_KEY)
    response = client.messages.create(
        model=DEFAULT_MODEL,
        max_tokens=1024,
        system=VOICE_POLISH_SYSTEM,
        messages=[{"role": "user", "content": req.transcript.strip()}],
    )
    raw = response.content[0].text.strip()
    try:
        data = json.loads(raw)
        raw_description = data.get("raw_description", raw)
    except Exception:
        raw_description = raw

    return {"raw_description": raw_description}


# ============== POST-SALE MARKETING REPORT ==============
class PostSaleReportIn(BaseModel):
    session_id: str
    listing_id: Optional[str] = None


class PostSaleReportRequest(BaseModel):
    session_id: Optional[str] = None
    listing_id: Optional[str] = None
    seller_name: Optional[str] = None
    sold_price: Optional[str] = None
    days_on_market: Optional[int] = None


@api_router.post("/report/post-sale")
async def post_sale_report(req: PostSaleReportRequest):
    session_id = req.session_id or ""

    listing = None
    if req.listing_id:
        listing = await db.listings.find_one({"id": req.listing_id}, {"_id": 0})
    elif session_id:
        listing = await db.listings.find_one(
            {"session_id": session_id},
            {"_id": 0},
            sort=[("created_at", -1)],
        )

    if not listing:
        raise HTTPException(404, "No listing found for this session")

    address = listing.get("address", "your home")
    listing_strength = listing.get("listing_strength", 0)

    shares = await db.shared_listings.count_documents({"listing_id": listing.get("id") or ""})
    views_est = shares * 47 + 120
    showing_requests = 0
    offers_received = 0

    strength_label = "Exceptional" if listing_strength >= 9 else "Strong" if listing_strength >= 7.5 else "Effective" if listing_strength >= 6 else "Average"
    price_position = "Above market expectation" if listing_strength >= 8 else "At market value" if listing_strength >= 6 else "Below asking"
    time_context = "well under the national average" if (req.days_on_market or 30) < 45 else "within typical market time" if (req.days_on_market or 30) < 75 else "reflecting current market conditions"

    return {
        "report": {
            "address": address,
            "seller_name": req.seller_name or "Homeowner",
            "sold_price": req.sold_price or "",
            "days_on_market": req.days_on_market or 0,
            "listing_strength": listing_strength,
            "strength_label": strength_label,
            "views_estimated": views_est,
            "shares": shares,
            "showing_requests": showing_requests,
            "offers_received": offers_received,
            "price_position": price_position,
            "time_context": time_context,
        },
        "copy": {
            "headline": f"How We Sold {address} for {req.sold_price or 'Top Dollar'}",
            "summary": f"Your home at {address} received an estimated {views_est} views and was successfully sold in {req.days_on_market or 0} days — {time_context}.",
            "buyers_loved": f"The AI-generated listing copy highlighted the property's {strength_label.lower()} features. {price_position}.",
            "closing": f"Sold by your agent using ListWorks PRO — AI-powered listing copy that turns listings into conversations.",
        },
        "share_text": f"Just closed on {address}! 🏡 The AI-generated listing copy was incredible. Sold in {req.days_on_market or 0} days. If you're buying or selling, hit up your agent — and ask them about ListWorks PRO!",
    }


# ============== ROUTES ==============
@api_router.get("/")
async def root():
    return {"app": "ListWorks PRO", "status": "live", "engine": "Claude Sonnet 4.5"}


@api_router.post("/rewrite", response_model=RewriteOutput)
async def rewrite_listing(req: RewriteRequest, request: Request):
    if len(req.raw_listing.strip()) < 10:
        raise HTTPException(400, "Listing too short. Add at least a sentence.")

    # Bot detection
    is_bot, reason = _is_bot_request(request, req.session_id or "")
    if is_bot:
        raise HTTPException(403, f"Request blocked: {reason}")

    # Rate limiting (20 req/min per session)
    if await _is_rate_limited(req.session_id or "", "rewrite", 20, 60):
        raise HTTPException(429, "Too many requests. Slow down.")

    # Hard 3-trial limit for free users
    allowed, remaining = _check_free_trial(req.session_id or "")
    if not allowed:
        raise HTTPException(
            status_code=402,
            detail={
                "code": "trial_exceeded",
                "message": "You've used your 3 free rewrites. Upgrade to Pro or Lifetime to continue.",
                "trials_used": FREE_TRIALS_PER_SESSION,
                "remaining": 0,
            },
        )

    outputs = await call_rewrite_llm(req)
    listing_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    # Record free trial usage (runs after generation to avoid race)
    _record_free_trial(req.session_id or "")
    updated_allowed, updated_remaining = _check_free_trial(req.session_id or "")
    usage_meta = {"trials_used": FREE_TRIALS_PER_SESSION - updated_remaining, "remaining": updated_remaining}

    doc = {
        "id": listing_id,
        "session_id": req.session_id,
        "tone": req.tone,
        "raw_listing": req.raw_listing,
        "address": req.address,
        "price": req.price,
        "beds": req.beds,
        "baths": req.baths,
        "sqft": req.sqft,
        "created_at": created_at,
        **outputs,
    }
    await db.listings.insert_one({k: v for k, v in doc.items()})

    return {
        **RewriteOutput(
            id=listing_id,
            tone=req.tone,
            raw_listing=req.raw_listing,
            created_at=created_at,
            **outputs,
        ).model_dump(),
        "trial_remaining": updated_remaining,
        "trial_limit": FREE_TRIALS_PER_SESSION,
    }


@api_router.post("/batch-rewrite", response_model=BatchRewriteResponse)
async def batch_rewrite(req: BatchRewriteRequest):
    results = []
    success_count = 0
    failed_count = 0

    # Trial check before processing batch
    if req.listings:
        first_session = req.listings[0].session_id or ""
        allowed, _ = _check_free_trial(first_session)
        if not allowed:
            raise HTTPException(
                status_code=402,
                detail={
                    "code": "trial_exceeded",
                    "message": "Trial exceeded. Upgrade to continue.",
                    "trials_used": FREE_TRIALS_PER_SESSION,
                    "remaining": 0,
                },
            )

    for listing_req in req.listings:
        try:
            outputs = await call_rewrite_llm(listing_req)
            listing_id = str(uuid.uuid4())
            created_at = datetime.now(timezone.utc).isoformat()

            doc = {
                "id": listing_id,
                "session_id": listing_req.session_id,
                "tone": listing_req.tone,
                "raw_listing": listing_req.raw_listing,
                "address": listing_req.address,
                "price": listing_req.price,
                "beds": listing_req.beds,
                "baths": listing_req.baths,
                "sqft": listing_req.sqft,
                "created_at": created_at,
                **outputs,
            }
            await db.listings.insert_one({k: v for k, v in doc.items()})

            results.append(RewriteOutput(
                id=listing_id,
                tone=listing_req.tone,
                raw_listing=listing_req.raw_listing,
                created_at=created_at,
                **outputs,
            ))
            success_count += 1
        except Exception as e:
            logging.exception("Batch item failed")
            failed_count += 1

    return BatchRewriteResponse(results=results, success_count=success_count, failed_count=failed_count)


@api_router.get("/templates/{session_id}")
async def get_templates(session_id: str):
    rows = await db.templates.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(20)
    return rows


@api_router.post("/templates/{session_id}")
async def save_template(session_id: str, req: TemplateSaveRequest):
    doc = {
        "id": str(uuid.uuid4()),
        "session_id": session_id,
        "name": req.name,
        "tone": req.tone,
        "is_default": req.is_default,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.templates.insert_one(doc)
    return doc


@api_router.delete("/templates/{session_id}/{template_id}")
async def delete_template(session_id: str, template_id: str):
    await db.templates.delete_one({"id": template_id, "session_id": session_id})
    return {"deleted": True}


@api_router.post("/capture-email")
async def capture_email(email: str, session_id: str):
    doc = {
        "email": email,
        "session_id": session_id,
        "captured_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.leads.insert_one(doc)
    return {"captured": True}


@api_router.post("/expired-scripts", response_model=ExpiredListingScripts)
async def get_expired_scripts(req: ExpiredListingRequest):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(500, "LLM key missing")

    if not HAS_ANTHROPIC:
        raise HTTPException(500, "anthropic package not installed")

    client = AsyncAnthropic(api_key=EMERGENT_LLM_KEY)
    meta_parts = []
    if req.price:
        meta_parts.append(f"Original price: {req.price}")
    if req.beds or req.baths or req.sqft:
        details = f"{req.beds or '?'} bed, {req.baths or '?'} bath, {req.sqft or '?'} sqft"
        meta_parts.append(f"Details: {details}")
    if req.days_on_market:
        meta_parts.append(f"Days on market: {req.days_on_market}")
    if req.seller_name:
        meta_parts.append(f"Seller: {req.seller_name}")
    if req.original_price:
        meta_parts.append(f"Original asking price: {req.original_price}")
    if req.listing_reason:
        meta_parts.append(f"Likely reason: {req.listing_reason}")

    meta_str = "\n".join(meta_parts) if meta_parts else "No additional details provided."
    user_prompt = f"""PROPERTY: {req.address}

META:
{meta_str}

Now produce the JSON object with all 4 scripts. JSON only."""

    response = client.messages.create(
        model=DEFAULT_MODEL,
        max_tokens=1024,
        system=EXPIRED_LISTING_SYSTEM,
        messages=[{"role": "user", "content": user_prompt}],
    )
    cleaned = _strip_json(response.content[0].text)
    try:
        data = json.loads(cleaned)
    except Exception as e:
        logging.exception("JSON parse failed for expired scripts")
        raise HTTPException(500, f"AI returned invalid JSON: {str(e)[:120]}")

    return ExpiredListingScripts(
        cold_call_script=data.get("cold_call_script", "").strip(),
        voicemail_script=data.get("voicemail_script", "").strip(),
        text_message=data.get("text_message", "").strip(),
        door_knock_script=data.get("door_knock_script", "").strip(),
    )


@api_router.post("/import/redfin", response_model=RedfinPropertyData)
async def import_redfin(req: RedfinImportRequest):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(500, "LLM key missing")

    if not req.redfin_url or "redfin.com" not in req.redfin_url.lower():
        raise HTTPException(400, "Invalid Redfin URL. Please provide a valid Redfin listing URL.")

    if not HAS_ANTHROPIC:
        raise HTTPException(500, "anthropic package not installed")

    client = AsyncAnthropic(api_key=EMERGENT_LLM_KEY)
    user_prompt = f"""Extract property data from this Redfin listing:

URL: {req.redfin_url}

Return the JSON object with all available property details. JSON only."""

    response = client.messages.create(
        model=DEFAULT_MODEL,
        max_tokens=512,
        system=REDFIN_IMPORT_SYSTEM,
        messages=[{"role": "user", "content": user_prompt}],
    )
    cleaned = _strip_json(response.content[0].text)
    try:
        data = json.loads(cleaned)
    except Exception as e:
        logging.exception("JSON parse failed for Redfin import")
        raise HTTPException(500, f"Failed to parse Redfin data: {str(e)[:120]}")

    return RedfinPropertyData(
        address=data.get("address", "").strip(),
        price=data.get("price"),
        beds=data.get("beds"),
        baths=data.get("baths"),
        sqft=data.get("sqft"),
        year_built=data.get("year_built"),
        property_type=data.get("property_type"),
        lot_size=data.get("lot_size"),
        parking=data.get("parking"),
        description=data.get("description"),
    )


@api_router.get("/share/{listing_id}")
async def get_shared_listing(listing_id: str):
    """Public share endpoint — returns the before/after for a listing.
    Anyone can view via /share/{id} on the frontend (no auth)."""
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0, "session_id": 0})
    if not listing:
        raise HTTPException(404, "Listing not found")
    # Track shares for analytics
    await db.share_views.insert_one({
        "listing_id": listing_id,
        "viewed_at": datetime.now(timezone.utc).isoformat(),
    })
    return listing


@api_router.post("/analyze-photo", response_model=PhotoAnalyzeResponse)
async def analyze_photo(req: PhotoAnalyzeRequest):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(500, "LLM key missing")

    if not HAS_ANTHROPIC:
        raise HTTPException(500, "anthropic package not installed")

    client = AsyncAnthropic(api_key=EMERGENT_LLM_KEY)
    prompt = (
        "You analyze real estate property photos. "
        "Return STRICT JSON: {\"features\":[8 short property features detected, "
        "e.g. 'marble counters','hardwood floors','vaulted ceilings'],"
        "\"style\":\"one short style label like 'Modern Farmhouse'\","
        "\"suggested_headline\":\"a single 10-word emotional headline for this property\"}"
    )
    # strip data: URL prefix if present
    img_data = req.image_base64
    if img_data.startswith("data:"):
        img_data = img_data.split(",", 1)[1]

    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=512,
        system=prompt,
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": "Analyze this property photo. JSON only."},
                {
                    "type": "image",
                    "source": {"type": "base64", "media_type": req.mime_type, "data": img_data},
                },
            ],
        }],
    )
    cleaned = _strip_json(response.content[0].text)
    try:
        data = json.loads(cleaned)
    except Exception:
        raise HTTPException(500, "Photo analysis failed to parse")

    return PhotoAnalyzeResponse(
        features=[f.strip() for f in data.get("features", []) if isinstance(f, str)][:8],
        style=str(data.get("style", "")).strip(),
        suggested_headline=str(data.get("suggested_headline", "")).strip(),
    )


# ===== AI Advisor (chat) =====
ADVISOR_SYSTEM = """You are the ListWorks AI Advisor — a senior real estate marketing
strategist trained on the ListWorks framework (5-part structure, Feature → Benefit → Feeling,
4 buyer triggers). You give concise, opinionated, actionable advice on listing copy,
photos, video strategy, and buyer psychology.

Keep responses under 180 words. Use plain text, short paragraphs, no markdown headers.
When the user shares listing copy, critique it against the framework: point to specific
banned-word offenders, missing FBF translations, weak hooks, and dead CTAs. Suggest
exact rewrites — don't just describe."""


@api_router.post("/advisor", response_model=AdvisorResponse)
async def advisor(req: AdvisorRequest):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(500, "LLM key missing")

    if not HAS_ANTHROPIC:
        raise HTTPException(500, "anthropic package not installed")

    context_msg = ""
    if req.listing_id:
        listing = await db.listings.find_one({"id": req.listing_id}, {"_id": 0})
        if listing:
            context_msg = (
                "\n\n[CURRENT LISTING CONTEXT]\n"
                f"Tone: {listing.get('tone')}\n"
                f"MLS: {listing.get('mls', '')[:600]}\n"
                f"Headlines: {listing.get('headlines', [])}\n"
            )

    history_text = ""
    for h in req.history[-6:]:
        history_text += f"\n{h.role.upper()}: {h.content[:600]}"

    client = AsyncAnthropic(api_key=EMERGENT_LLM_KEY)
    user_text = f"{history_text}\n\nUSER: {req.question}{context_msg}".strip()
    messages = []
    if history_text:
        for h in req.history[-6:]:
            messages.append({"role": h.role, "content": h.content[:600]})
    messages.append({"role": "user", "content": user_text})

    response = client.messages.create(
        model=DEFAULT_MODEL,
        max_tokens=512,
        system=ADVISOR_SYSTEM,
        messages=messages,
    )
    reply = response.content[0].text.strip()
    return AdvisorResponse(reply=reply)


# ===== Video Generation =====
@api_router.post("/video/generate", response_model=VideoGenerateResponse)
async def video_generate(req: VideoGenerateRequest):
    if not req.photos:
        raise HTTPException(400, "Upload at least one photo")
    if req.fmt not in ("16:9", "9:16"):
        raise HTTPException(400, "fmt must be 16:9 or 9:16")
    if req.music_id not in MUSIC_TRACKS:
        raise HTTPException(400, f"Invalid music_id. Use one of {sorted(MUSIC_TRACKS)}")

    # voiceover text fallback
    vo_text = None
    if not req.voiceover_audio and req.use_ai_voice:
        vo_text = req.voiceover_text or " ".join(req.slides) or ""
        vo_text = vo_text.strip()

    try:
        result = await generate_listing_video(
            photos_b64=req.photos,
            slides=req.slides,
            music_id=req.music_id,
            voiceover_b64=req.voiceover_audio,
            voiceover_text=vo_text,
            agent_name=req.agent_name,
            agent_brokerage=req.agent_brokerage,
            fmt=req.fmt,
            api_key=EMERGENT_LLM_KEY,
        )
    except ValueError as ve:
        raise HTTPException(400, str(ve))
    except Exception as e:
        logging.exception("Video generation failed")
        raise HTTPException(500, f"Video generation failed: {str(e)[:200]}")

    # persist
    await db.videos.insert_one({
        "id": result["id"],
        "listing_id": req.listing_id,
        "url": result["url"],
        "duration": result["duration"],
        "format": result["format"],
        "music_id": req.music_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return VideoGenerateResponse(**result)


@api_router.get("/videos/{filename}")
async def serve_video(filename: str):
    # safe filename
    if not re.fullmatch(r"[a-f0-9]{6,32}\.mp4", filename):
        raise HTTPException(404, "Not found")
    path = VIDEO_DIR / filename
    if not path.exists():
        raise HTTPException(404, "Video not found")
    return FileResponse(str(path), media_type="video/mp4", filename=filename)


@api_router.get("/listings/{session_id}")
async def list_session_listings(session_id: str):
    rows = await db.listings.find(
        {"session_id": session_id}, {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return rows


@api_router.get("/examples")
async def get_examples():
    samples = [
        {
            "id": "ex1",
            "address": "248 Linden Ave, Austin TX",
            "before": "3 bed 2 bath ranch home. Updated kitchen with granite. Fenced backyard. Close to schools. Move-in ready.",
            "after": "Sunlight pours through the front window at 7 a.m. — and that's before you've even reached the kitchen, where granite catches the morning glow and Sunday pancakes practically make themselves. Three bedrooms. Two updated baths. A backyard built for slow weekends and faster dogs. Walk to top-rated schools, bike to the trail, and discover why this stretch of Linden trades quietly — and rarely.",
            "tone": "Cozy",
        },
        {
            "id": "ex2",
            "address": "12 Skyline Dr, Beverly Hills CA",
            "before": "Large modern home, 5 bedrooms, pool, city views. High ceilings. Two car garage.",
            "after": "Carved into the hillside above Sunset, this 5-bedroom architectural statement turns the city into your private theater. Walls of glass dissolve into infinity-edge water. Ceilings climb. Light pools. Five suites — each its own sanctuary. The kind of home where mornings start with a swim and evenings end with the skyline at your feet.",
            "tone": "Luxury",
        },
        {
            "id": "ex3",
            "address": "904 Ironwood Ct, Denver CO",
            "before": "Investment property. 4-plex. Fully rented. Cap rate 6.2%. Recent roof. Off-street parking.",
            "after": "A rare 4-plex in Denver's tightest sub-market — fully tenanted, freshly capitalized, and engineered to print. 6.2% cap on actuals. New roof, new bones, new opportunity. Off-street parking, low turnover, and an emerging block where comps are climbing 9% YoY. The kind of asset you don't list — you whisper.",
            "tone": "Investor",
        },
    ]
    return samples


@api_router.post("/feedback")
async def feedback(req: FeedbackRequest):
    doc = {
        "id": str(uuid.uuid4()),
        "email": req.email,
        "message": req.message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.feedback.insert_one(doc)
    return {"ok": True}


# ===== STRIPE PAYMENTS =====
class CheckoutCreateRequest(BaseModel):
    package_id: str
    origin_url: str
    session_id: Optional[str] = None  # listworks session id (anon)
    email: Optional[str] = None
    ref: Optional[str] = None  # affiliate referral code (e.g. ?ref=mike)


@api_router.post("/checkout/session")
async def create_checkout_session(req: CheckoutCreateRequest, request: Request):
    if not STRIPE_API_KEY:
        raise HTTPException(500, "Stripe not configured")
    if req.package_id not in PACKAGES:
        raise HTTPException(400, "Invalid package")
    pkg = PACKAGES[req.package_id]

    origin = req.origin_url.rstrip("/")
    success_url = f"{origin}/payment-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/?cancel=1#pricing"

    metadata = {
        "package_id": req.package_id,
        "package_kind": pkg["kind"],
        "package_name": pkg["name"],
        "lw_session_id": req.session_id or "",
        "email": req.email or "",
        "ref": (req.ref or "").strip().lower()[:64],
    }

    # Subscription mode for monthly/annual Pro; one-time for everything else
    is_subscription = req.package_id in ("pro_month", "pro_annual")

    # Use raw Stripe SDK for everything (skip emergent wrapper)
    is_emergent_test = False

    line_item = {
        "price_data": {
            "currency": pkg["currency"],
            "product_data": {"name": pkg["name"]},
            "unit_amount": int(pkg["amount"] * 100),
        },
        "quantity": 1,
    }

    if is_subscription:
        line_item["price_data"]["recurring"] = {
            "interval": "month" if req.package_id == "pro_month" else "year",
        }

    cs_params = {
        "mode": "subscription" if is_subscription else "payment",
        "line_items": [line_item],
        "success_url": success_url,
        "cancel_url": cancel_url,
        "metadata": metadata,
        "allow_promotion_codes": True,  # 🔥 Customers can enter COMEBACK29 etc.
    }
    if req.email:
        cs_params["customer_email"] = req.email

    try:
        session = await asyncio.to_thread(stripe_sdk.checkout.Session.create, **cs_params)
    except Exception as e:
        logger.exception("Stripe checkout creation failed")
        raise HTTPException(502, f"Stripe error: {e}")

    # Persist transaction with PENDING status BEFORE redirect
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "stripe_session_id": session.id,
        "package_id": req.package_id,
        "package_kind": pkg["kind"],
        "amount": pkg["amount"],
        "currency": pkg["currency"],
        "lw_session_id": req.session_id or "",
        "email": req.email or "",
        "ref": metadata["ref"],
        "status": "initiated",
        "payment_status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "metadata": metadata,
    })
    return {"url": session.url, "session_id": session.id}


@api_router.get("/checkout/status/{stripe_session_id}")
async def checkout_status(stripe_session_id: str, request: Request):
    if not STRIPE_API_KEY:
        raise HTTPException(500, "Stripe not configured")

    is_emergent_test = False  # skip emergent wrapper
    if is_emergent_test:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        host_url = str(request.base_url).rstrip("/")
        webhook_url = f"{host_url}/api/webhook/stripe"
        sc = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        try:
            cs = await sc.get_checkout_status(stripe_session_id)
        except Exception as e:
            logger.warning("Stripe status (emergent) failed: %s", e)
            raise HTTPException(404, "Session not found")
        cs_status = cs.status
        cs_payment_status = cs.payment_status
        cs_amount_total = cs.amount_total
        cs_currency = cs.currency
        cs_metadata = cs.metadata
    else:
        try:
            sess = await asyncio.to_thread(stripe_sdk.checkout.Session.retrieve, stripe_session_id)
        except Exception as e:
            logger.warning("Stripe checkout status failed for %s: %s", stripe_session_id, e)
            raise HTTPException(404, "Session not found or unavailable")
        cs_status = sess.get("status")
        cs_payment_status = sess.get("payment_status")
        cs_amount_total = sess.get("amount_total")
        cs_currency = sess.get("currency")
        cs_metadata = sess.get("metadata") or {}

    txn = await db.payment_transactions.find_one(
        {"stripe_session_id": stripe_session_id}, {"_id": 0}
    )

    # Idempotent grant of entitlements
    if cs_payment_status == "paid" and txn and txn.get("payment_status") != "paid":
        await db.payment_transactions.update_one(
            {"stripe_session_id": stripe_session_id},
            {"$set": {
                "status": cs_status,
                "payment_status": "paid",
                "paid_at": datetime.now(timezone.utc).isoformat(),
            }},
        )
        # Grant entitlement to the listworks session
        if txn.get("lw_session_id"):
            kind = txn.get("package_kind")
            ent = {
                "lw_session_id": txn["lw_session_id"],
                "kind": kind,
                "package_id": txn.get("package_id"),
                "stripe_session_id": stripe_session_id,
                "granted_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.entitlements.update_one(
                {"lw_session_id": txn["lw_session_id"], "kind": kind},
                {"$set": ent},
                upsert=True,
            )

        # Fire drip emails (idempotent — only first time payment_status flips to paid)
        await _trigger_drip_for_txn(stripe_session_id, txn)

    return {
        "status": cs_status,
        "payment_status": cs_payment_status,
        "amount_total": cs_amount_total,
        "currency": cs_currency,
        "metadata": cs_metadata,
        "package_kind": (txn or {}).get("package_kind"),
    }


@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    if not STRIPE_API_KEY:
        raise HTTPException(500, "Stripe not configured")
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")

    is_emergent_test = False  # skip emergent wrapper
    if is_emergent_test:
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        host_url = str(request.base_url)
        webhook_url = f"{host_url}api/webhook/stripe".replace("//api", "/api")
        sc = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        try:
            evt = await sc.handle_webhook(body, sig)
        except Exception as e:
            logger.exception("Stripe webhook (emergent) failed: %s", e)
            raise HTTPException(400, "Invalid webhook")
        session_id = evt.session_id if evt else None
        payment_status = evt.payment_status if evt else None
        event_type = evt.event_type if evt else None
    else:
        webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
        try:
            if webhook_secret:
                evt = stripe_sdk.Webhook.construct_event(body, sig, webhook_secret)
            else:
                import json as _json
                evt = _json.loads(body)
        except Exception as e:
            logger.exception("Stripe webhook parse failed: %s", e)
            raise HTTPException(400, "Invalid webhook")
        event_type = evt.get("type") if isinstance(evt, dict) else getattr(evt, "type", None)
        data_object = (evt.get("data") if isinstance(evt, dict) else evt.get("data", {})).get("object", {})
        session_id = data_object.get("id") if event_type == "checkout.session.completed" else None
        payment_status = data_object.get("payment_status")

    if session_id:
        await db.payment_transactions.update_one(
            {"stripe_session_id": session_id},
            {"$set": {
                "payment_status": payment_status,
                "webhook_event": event_type,
                "webhook_at": datetime.now(timezone.utc).isoformat(),
            }},
        )
        # Grant entitlement on paid
        if payment_status == "paid":
            txn = await db.payment_transactions.find_one(
                {"stripe_session_id": session_id}, {"_id": 0}
            )
            if txn and txn.get("lw_session_id"):
                await db.entitlements.update_one(
                    {"lw_session_id": txn["lw_session_id"], "kind": txn.get("package_kind")},
                    {"$set": {
                        "lw_session_id": txn["lw_session_id"],
                        "kind": txn.get("package_kind"),
                        "package_id": txn.get("package_id"),
                        "stripe_session_id": session_id,
                        "granted_at": datetime.now(timezone.utc).isoformat(),
                    }},
                    upsert=True,
                )
            # Fire drip emails — idempotent via drip_sent flag
            if txn:
                await _trigger_drip_for_txn(session_id, txn)
    return {"received": True}


async def _trigger_drip_for_txn(stripe_session_id: str, txn: dict) -> None:
    """Resolve buyer email and fire the appropriate Resend drip + Slack ping. Idempotent."""
    if txn.get("drip_sent"):
        return  # already fired

    # Try transaction record, then fetch email from Stripe session if missing
    email = (txn.get("email") or "").strip()
    if not email and STRIPE_API_KEY:
        try:
            sess = await asyncio.to_thread(
                stripe_sdk.checkout.Session.retrieve,
                stripe_session_id,
                expand=["customer_details"],
            )
            details = sess.get("customer_details") or {}
            email = (details.get("email") or sess.get("customer_email") or "").strip()
        except Exception as e:
            logger.warning("Could not fetch Stripe email for %s: %s", stripe_session_id, e)

    # 🔔 Fire Slack notification regardless (motivation + tracking)
    await _notify_slack_sale(txn, email)

    # 📧 Email drips (only if Resend configured and we have an email)
    ids: dict = {}
    if os.environ.get("RESEND_API_KEY") and email:
        kind = txn.get("package_kind")
        try:
            if kind == "guide":
                ids = await send_guide_drip(email)
            elif kind in ("pro", "lifetime"):
                ids = await send_pro_welcome(email)
        except Exception as e:
            logger.exception("Drip send failed for %s: %s", stripe_session_id, e)

    # 💎 Credit grant for credit packages
    pkg = PACKAGES.get(txn.get("package_id") or "", {})
    if pkg.get("kind") == "credits" and txn.get("lw_session_id"):
        credit_amount = int(pkg.get("credits", 0))
        if credit_amount > 0:
            await db.credits.update_one(
                {"lw_session_id": txn["lw_session_id"]},
                {"$inc": {"balance": credit_amount},
                 "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}},
                upsert=True,
            )
            logger.info("Granted %s credits to lw_session=%s", credit_amount, txn["lw_session_id"])

    await db.payment_transactions.update_one(
        {"stripe_session_id": stripe_session_id},
        {"$set": {
            "drip_sent": True,
            "drip_email": email,
            "drip_ids": ids,
            "drip_sent_at": datetime.now(timezone.utc).isoformat(),
        }},
    )


async def _notify_slack_sale(txn: dict, email: str) -> None:
    """Ping Slack channel when someone buys. Silently no-op if no webhook set."""
    if not SLACK_WEBHOOK_URL:
        return
    try:
        amount = txn.get("amount", 0)
        kind = txn.get("package_kind", "?")
        name = txn.get("metadata", {}).get("package_name") or txn.get("package_id", "?")
        emoji = {
            "guide": ":books:", "pro": ":rocket:",
            "lifetime": ":crown:", "credits": ":coin:",
        }.get(kind, ":moneybag:")

        text = f"{emoji} *NEW SALE — ${amount}* — {name}\n_email:_ `{email or 'unknown'}`  ·  _kind:_ `{kind}`"
        async with httpx.AsyncClient(timeout=10.0) as client:
            await client.post(SLACK_WEBHOOK_URL, json={"text": text})
    except Exception as e:
        logger.warning("Slack notification failed: %s", e)


@api_router.get("/entitlements/{session_id}")
async def get_entitlements(session_id: str):
    rows = await db.entitlements.find(
        {"lw_session_id": session_id}, {"_id": 0}
    ).to_list(20)
    return {"entitlements": rows, "is_pro": any(r.get("kind") == "pro" for r in rows),
            "has_guide": any(r.get("kind") == "guide" for r in rows)}


# ===== MAKE.COM SOCIAL AUTO-POST =====
class SocialPostRequest(BaseModel):
    listing_id: str
    platforms: List[str] = Field(default_factory=lambda: ["facebook"])  # ["facebook", "instagram"]
    photo_urls: List[str] = Field(default_factory=list)


@api_router.post("/social/post")
async def social_post(req: SocialPostRequest):
    if not MAKE_WEBHOOK_URL:
        # Check listing existence first so callers get useful 404 even before webhook is configured
        listing = await db.listings.find_one({"id": req.listing_id}, {"_id": 0})
        if not listing:
            raise HTTPException(404, "Listing not found")
        raise HTTPException(503, "Social auto-post not configured. Add MAKE_WEBHOOK_URL.")

    listing = await db.listings.find_one({"id": req.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Listing not found")

    payload = {
        "platforms": req.platforms,
        "photo_urls": req.photo_urls,
        "address": listing.get("address"),
        "price": listing.get("price"),
        "tone": listing.get("tone"),
        "mls": listing.get("mls"),
        "instagram_caption": listing.get("instagram"),
        "facebook_post": listing.get("facebook"),
        "headlines": listing.get("headlines", []),
        "email": listing.get("email"),
        "listing_strength": listing.get("listing_strength"),
        "source": "listworks.pro",
        "generated_at": listing.get("created_at"),
    }

    import httpx
    try:
        async with httpx.AsyncClient(timeout=30.0) as http:
            r = await http.post(MAKE_WEBHOOK_URL, json=payload)
            r.raise_for_status()
    except Exception as e:
        logger.exception("Make.com webhook failed: %s", e)
        raise HTTPException(502, f"Auto-post failed: {str(e)[:160]}")

    await db.social_posts.insert_one({
        "id": str(uuid.uuid4()),
        "listing_id": req.listing_id,
        "platforms": req.platforms,
        "status": "queued",
        "queued_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"queued": True, "platforms": req.platforms, "listing_id": req.listing_id}


# ===== PRICING (frontend reads this) =====
@api_router.get("/pricing")
async def pricing():
    return {
        pid: {"name": p["name"], "amount": p["amount"], "currency": p["currency"], "kind": p["kind"]}
        for pid, p in PACKAGES.items()
    }


# ===== EMAIL TEST ENDPOINT (admin-style smoke test) =====
class EmailTestRequest(BaseModel):
    email: str
    flow: str = "guide"  # "guide" | "pro"
    first_name: Optional[str] = None


@api_router.post("/email/test")
async def email_test(req: EmailTestRequest):
    """Send the welcome email immediately to verify Resend is wired correctly.
    Drip emails are NOT scheduled here — this is for smoke-testing only."""
    if not os.environ.get("RESEND_API_KEY"):
        raise HTTPException(503, "RESEND_API_KEY not configured")
    from email_engine import _send, tpl_guide_welcome, tpl_pro_welcome
    if req.flow == "pro":
        s, h, _ = tpl_pro_welcome(req.first_name)
        tag = "test_pro_welcome"
    else:
        s, h, _ = tpl_guide_welcome(req.first_name)
        tag = "test_guide_welcome"
    eid = await _send(to=req.email, subject=s, html=h, tag=tag)
    if not eid:
        raise HTTPException(502, "Resend send failed — check backend logs")
    return {"sent": True, "email_id": eid, "to": req.email, "flow": req.flow}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
