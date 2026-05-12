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
from email_engine import send_guide_drip, send_pro_welcome
import stripe as stripe_sdk
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

ANTHROPIC_API_KEY = os.environ.get('ANTHROPIC_API_KEY') or os.environ.get('ANTHROPIC_API_KEY', '')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')
MAKE_WEBHOOK_URL = os.environ.get('MAKE_WEBHOOK_URL', '')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
DEFAULT_PROVIDER = "anthropic"
DEFAULT_MODEL = "claude-sonnet-4-5-20250929"

if STRIPE_API_KEY:
    stripe_sdk.api_key = STRIPE_API_KEY

# Server-side fixed pricing - NEVER accept amounts from frontend
PACKAGES = {
    "guide_pdf":   {"amount":  20.00, "currency": "usd", "name": "ListWorks Guide PDF",          "kind": "guide"},
    "pro_month":   {"amount":  49.00, "currency": "usd", "name": "ListGenius Pro - 1 Month",     "kind": "pro"},
    "pro_annual":  {"amount": 470.00, "currency": "usd", "name": "ListGenius Pro - Annual",      "kind": "pro"},
    "lifetime":    {"amount": 299.00, "currency": "usd", "name": "ListWorks Lifetime - All-In",  "kind": "lifetime"},
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

REWRITE_SYSTEM = """You are ListWorks PRO - a professional real estate copywriter trained
on the official ListWorks framework. Your writing is confident, specific, and
emotionally resonant. You make buyers FEEL something first, then give them facts
to justify that feeling.

===============================================================
THE LISTWORKS 5-PART STRUCTURE (use for MLS, Facebook, Email)
===============================================================
1. THE OPENING HOOK - stops the scroll, earns the read.
2. THE LIFESTYLE PARAGRAPH - sells the LIFE, not the specs.
3. THE FEATURE TRANSLATION LAYER - convert specs into desire using FBF.
4. THE NEIGHBORHOOD & CONTEXT - place the buyer in the world of this home.
5. THE CALL TO ACTION - confidence without begging.

===============================================================
FEATURE -> BENEFIT -> FEELING (FBF)
===============================================================
Feature: what it has -> Benefit: what it does -> Feeling: how it feels.
Always write the FEELING.

===============================================================
BUYER TRIGGERS (activate at least one per asset)
===============================================================
Belonging  *  Status  *  Safety  *  Urgency

===============================================================
HARD RULES - DO NOT VIOLATE
===============================================================
BANNED: "Welcome to", "Don't miss", "Must see", "Spacious", "Cozy" (cliche),
"Motivated seller", "Charming", "Nestled", "Won't last", "Priced to sell",
"Call for details".
DO NOT open with the address or property type. No more than 2 adjectives in a row.
No sentence longer than 25 words. Max one exclamation per asset. No bullet points.

===============================================================
OUTPUT - STRICT JSON ONLY (no markdown, no commentary)
===============================================================
"""

CONTRACT_REVIEW_SYSTEM = """You are a real estate contract risk analyst for US residential transactions.
You review purchase agreements, counter-offers, addenda, and disclosure forms.
You identify: (1) critical risks, (2) missing fields, (3) unfavorable terms, (4) deadline issues.
You NEVER give legal advice. You advise agents to consult an attorney for anything material.

OUTPUT FORMAT - STRICT JSON ONLY:
{
  "risk_level": "low | medium | high",
  "summary": "one paragraph plain-English summary of overall risk",
  "findings": [
    {
      "severity": "critical | warning | note",
      "area": "financing | inspection | disclosure | deadlines | contingency | price_terms | other",
      "text": "specific issue found in the contract text",
      "recommendation": "what to do or ask about this"
    }
  ],
  "plain_english": "detailed breakdown in plain language a non-attorney can understand",
  "todo_checklist": ["action item 1", "action item 2", ...]
}
"""


class ContractReviewRequest(BaseModel):
    content: str
    focus_areas: List[str] = Field(default_factory=list)
    session_id: Optional[str] = None


class ContractReviewResponse(BaseModel):
    risk_level: str
    summary: str
    findings: List[Dict[str, str]]
    plain_english: str
    todo_checklist: List[str]


@api_router.post("/contract/review", response_model=ContractReviewResponse)
async def contract_review(req: ContractReviewRequest):
    if not ANTHROPIC_API_KEY:
        raise HTTPException(500, "LLM key missing")
    if not HAS_ANTHROPIC:
        raise HTTPException(500, "anthropic package not installed")

    focus_note = ""
    if req.focus_areas:
        focus_list = ", ".join(req.focus_areas)
        focus_note = f"\\nPay extra attention to these areas: {focus_list}."

    client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
    response = client.messages.create(
        model=DEFAULT_MODEL,
        max_tokens=1024,
        system=CONTRACT_REVIEW_SYSTEM,
        messages=[{
            "role": "user",
            "content": (
                f"Review this real estate contract. Flag risks in plain English.{focus_note}\n\n"
                "CONTRACT TEXT:\n" + req.content[:8000]
            ),
        }],
    )
    cleaned = _strip_json(response.content[0].text)
    try:
        data = json.loads(cleaned)
    except Exception as e:
        logging.exception("Contract review JSON parse failed")
        raise HTTPException(500, f"Could not parse contract review: {str(e)[:120]}")

    return ContractReviewResponse(
        risk_level=str(data.get("risk_level", "medium")),
        summary=str(data.get("summary", "")),
        findings=[{
            "severity": str(f.get("severity", "note")),
            "area": str(f.get("area", "other")),
            "text": str(f.get("text", "")),
            "recommendation": str(f.get("recommendation", "")),
        } for f in data.get("findings", [])],
        plain_english=str(data.get("plain_english", "")),
        todo_checklist=[str(t) for t in data.get("todo_checklist", [])],
    )
The listing_strength is a number 0-10 (one decimal), reflecting how well the SOURCE
input + your output expresses the framework. Be honest - most rewrites land between
6.5 and 8.5. Reserve 9+ for inputs with strong specificity.
"""

EXPIRED_LISTING_SYSTEM = """You are ListWorks PRO - a real estate marketing expert specializing in expired listings.
Your job is to write outreach scripts that get the seller to pick up the phone or agree to a meeting.

==============================================================
TONE: Professional, empathetic, confident. Never desperate or pushy.
==============================================================

The seller just went through a failed listing attempt. They're likely frustrated, skeptical, and cautious.
Your scripts must:
- Acknowledge their experience without making them feel stupid
- Show you understand their situation
- Offer a clear, low-pressure next step
- NEVER criticize their previous agent
- Use "we" more than "I" to sound like a team

==============================================================
SCRIPT TYPES REQUIRED (JSON output)
==============================================================
1. COLD CALL SCRIPT: 150-200 words. Opening hook -> acknowledge -> value proposition -> objection handling -> CTA.
   Start with their name. Use the address naturally. End with a specific question, not "call me."

2. VOICEMAIL SCRIPT: 30-45 seconds (60-80 words). Hook -> context -> callback request with specific time.
   Must work as audio only - no context needed. Speak naturally.

3. TEXT MESSAGE: Under 160 characters. Casual but professional. Include address and one key value hook.
   End with a question to trigger response.

4. DOOR KNOCK SCRIPT: 200-250 words. Greeting -> acknowledge expired -> brief value -> ask for 5 min conversation -> offer specific time.

HARD RULES:
- Use the seller's name when provided
- Use the property address in every script
- Include days on market if provided to show research
- Never say "expired" negatively - use "previous listing" or "your home was on the market"
- Offer ONE clear next step per script
- No heavy sales language - be a helpful expert, not a closer
- Include your agent name placeholder: [YOUR_NAME]

==============================================================
OUTPUT - STRICT JSON ONLY
==============================================================
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

OUTPUT - STRICT JSON ONLY:
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
    if not ANTHROPIC_API_KEY:
        raise HTTPException(500, "LLM key missing")

    if not HAS_ANTHROPIC:
        raise HTTPException(500, "anthropic package not installed")

    client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
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
        headlines = [h.strip("- -*").strip() for h in headlines.split("\n") if h.strip()]
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
# Commission: 30% recurring on Pro  *  30% one-time on PDF/Lifetime/Credits
COMMISSION_RATE = 0.30


@api_router.get("/affiliate/{ref}")
async def affiliate_stats(ref: str):
    """Public dashboard for an affiliate. Anyone with the URL sees their stats.
    Format: GET /api/affiliate/mike -> totals + recent referred sales.
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

    # Total clicks (anyone who landed with the ref param - frontend posts to /api/ref-click)
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
                # Don't leak full email - show first letter + domain
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


# ===== TELEGRAM BOT BACKEND =====
class TelegramLinkIn(BaseModel):
    email: str
    telegram_chat_id: int


class TelegramUnlinkIn(BaseModel):
    telegram_chat_id: int


async def _send_telegram(chat_id: int, text: str, token: str, parse_mode: str = "HTML"):
    if not token:
        return
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    async with httpx.AsyncClient(timeout=15) as client:
        await client.post(url, json={
            "chat_id": chat_id,
            "text": text,
            "parse_mode": parse_mode,
        })


@api_router.post("/telegram/link")
async def tg_link(req: TelegramLinkIn):
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    if not token:
        raise HTTPException(500, "Telegram not configured")

    sessions = await db.listings.distinct("session_id", {"drip_email": req.email.lower()})
    if not sessions:
        sessions = [None]

    await db.telegram_links.update_one(
        {"telegram_chat_id": req.telegram_chat_id},
        {"$set": {
            "telegram_chat_id": req.telegram_chat_id,
            "email": req.email.lower(),
            "linked_at": datetime.now(timezone.utc).isoformat(),
            "sessions": sessions,
        }},
        upsert=True,
    )

    await _send_telegram(
        req.telegram_chat_id,
        f"? Linked! You're connected to <b>{req.email}</b>. I'll ping you when leads come in.",
        token,
    )

    return {"ok": True, "session_count": len([s for s in sessions if s])}


@api_router.post("/telegram/unlink")
async def tg_unlink(req: TelegramUnlinkIn):
    await db.telegram_links.delete_one({"telegram_chat_id": req.telegram_chat_id})
    return {"ok": True}


@api_router.get("/telegram/status/{chat_id}")
async def tg_status(chat_id: int):
    doc = await db.telegram_links.find_one({"telegram_chat_id": chat_id}, {"_id": 0})
    if not doc:
        return {"linked_email": None, "recent_leads": 0}
    email = doc.get("email", "")
    leads = await db.lead_notifications.count_documents({"email": email.lower()})
    return {"linked_email": email, "recent_leads": leads}


async def _notify_telegram_lead(email: str, listing_address: str, source: str):
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    if not token:
        return
    chats = await db.telegram_links.find({"email": email.lower()}).to_list(100)
    if not chats:
        return
    site = os.environ.get("SITE_URL", "https://listworks.pro")
    text = (
        f"? <b>New Lead</b>\n\n"
        f"Address: <b>{listing_address}</b>\n"
        f"Source: {source}\n\n"
        f"Log in to reply: {site}"
    )
    for chat in chats:
        await _send_telegram(chat["telegram_chat_id"], text, token)


# ===== SELLER DASHBOARD =====
class SellerListingRequest(BaseModel):
    session_id: Optional[str] = None


@api_router.get("/seller/listings")
async def seller_listings(session_id: Optional[str] = None):
    session_id = session_id or ""
    listings = await db.listings.find(
        {"session_id": session_id},
        {"_id": 0, "id": 1, "address": 1, "tone": 1, "created_at": 1, "mls": 1},
    ).to_list(50)
    for l in listings:
        l["views"] = await db.share_views.count_documents({"listing_id": l.get("id")})
        l["inquiries"] = await db.lead_notifications.count_documents({"listing_id": l.get("id")})
        l["showings"] = 0
        l["report_enabled"] = False
    return {"listings": listings}


@api_router.post("/seller/report-toggle")
async def seller_report_toggle(req: dict):
    listing_id = req.get("listing_id")
    enabled = req.get("enabled", False)
    session_id = req.get("session_id", "")
    await db.seller_reports.update_one(
        {"listing_id": listing_id},
        {"$set": {"enabled": enabled, "session_id": session_id}},
        upsert=True,
    )
    return {"ok": True}


# ===== LEAD SCORING ENGINE =====
class LeadScoreRequest(BaseModel):
    listing_id: str
    lead_name: str
    lead_contact: str
    lead_source: str = "web"  # "web" | "zillow" | "realtor" | "fb" | "referral" | "cold"
    messages_count: int = 0
    showings_scheduled: int = 0
    budget: Optional[str] = None
    timeline: Optional[str] = None  # "30d" | "60d" | "90d" | "6mo" | "browsing"
    prequalified: bool = False


class LeadScoreResponse(BaseModel):
    score: int  # 0-100
    tier: str  # "hot" | "warm" | "cold"
    signals: List[str]
    recommendation: str
    next_action: str


LEAD_SCORING_SYSTEM = """You are a real estate lead qualification analyst.
Score a buyer's likelihood to close (0-100) based on the signals provided.
Consider: budget, timeline, prequalification status, engagement level, source quality.

SCORING RUBRIC:
- Hot (80-100): prequalified, timeline < 60d, high engagement, referral source
- Warm (50-79): timeline 60-90d, some engagement, budget aligned
- Cold (0-49): no prequal, browsing, low engagement, weak source

OUTPUT - STRICT JSON ONLY:
{
  "score": 75,
  "tier": "warm",
  "signals": ["short bullet signals that affected the score"],
  "recommendation": "what to do with this lead",
  "next_action": "specific next step for the agent"
}
"""


@api_router.post("/leads/score", response_model=LeadScoreResponse)
async def score_lead(req: LeadScoreRequest):
    if not ANTHROPIC_API_KEY:
        raise HTTPException(500, "LLM key missing")

    listing = await db.listings.find_one({"id": req.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Listing not found")

    score_text = f"""Score this lead for the listing at {listing.get('address', 'the listing')}.

Lead info:
- Name: {req.lead_name}
- Contact: {req.lead_contact}
- Source: {req.lead_source}
- Budget: {req.budget or 'unknown'}
- Timeline: {req.timeline or 'unknown'}
- Prequalified: {'yes' if req.prequalified else 'no'}
- Messages: {req.messages_count}
- Showings scheduled: {req.showings_scheduled}

Respond ONLY with the JSON scoring object."""

    client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
    response = client.messages.create(
        model=DEFAULT_MODEL,
        max_tokens=512,
        system=LEAD_SCORING_SYSTEM,
        messages=[{"role": "user", "content": score_text}],
    )
    cleaned = _strip_json(response.content[0].text)
    try:
        data = json.loads(cleaned)
    except Exception as e:
        logging.exception("Lead score JSON failed: %s", e)
        raise HTTPException(500, f"Lead scoring failed: {str(e)[:100]}")

    score = int(data.get("score", 50))
    tier = data.get("tier", "warm")
    signals = data.get("signals", [])

    await db.lead_scores.update_one(
        {"lead_contact": req.lead_contact, "listing_id": req.listing_id},
        {"$set": {
            "lead_name": req.lead_name,
            "lead_contact": req.lead_contact,
            "lead_source": req.lead_source,
            "score": score,
            "tier": tier,
            "signals": signals,
            "listing_id": req.listing_id,
            "scored_at": datetime.now(timezone.utc).isoformat(),
        }},
        upsert=True,
    )

    return LeadScoreResponse(
        score=score,
        tier=tier,
        signals=[str(s) for s in signals],
        recommendation=str(data.get("recommendation", "")),
        next_action=str(data.get("next_action", "")),
    )


# ===== TRANSACTION DEADLINE TRACKER =====
class TransactionCreate(BaseModel):
    address: str
    closing_date: str  # ISO date string
    inspection_date: Optional[str] = None
    financing_date: Optional[str] = None
    appraisal_date: Optional[str] = None
    due_diligence_date: Optional[str] = None
    agent_name: Optional[str] = None
    agent_email: Optional[str] = None


class DeadlineItem(BaseModel):
    task: str
    deadline: str
    days_until: int
    urgency: str  # "overdue" | "today" | "soon" | "normal"
    completed: bool
    notes: Optional[str] = None


class TransactionResponse(BaseModel):
    id: str
    address: str
    closing_date: str
    days_to_close: int
    closing_urgency: str
    deadlines: List[DeadlineItem]
    overdue_count: int
    soon_count: int


STANDARD_DEADLINES = [
    {"task": "Seller disclosures (SOD)", "days_before": 5, "key": "disclosure"},
    {"task": "HOA documents requested", "days_before": 7, "key": "hoa"},
    {"task": "Inspection objection deadline", "days_before": 3, "key": "inspection_objection"},
    {"task": "Financing commitment letter", "days_before": 7, "key": "financing_commitment"},
    {"task": "Appraisal ordered", "days_before": 10, "key": "appraisal_ordered"},
    {"task": "Homeowner's insurance", "days_before": 5, "key": "insurance"},
    {"task": "Final walkthrough scheduled", "days_before": 1, "key": "walkthrough"},
    {"task": "Wire transfer instructions reviewed", "days_before": 1, "key": "wire"},
]


def _build_deadlines(closing_str: str, custom: dict) -> List[DeadlineItem]:
    try:
        closing = datetime.strptime(closing_str[:10], "%Y-%m-%d")
    except Exception:
        closing = datetime.now() + datetime.timedelta(days=30)

    items = []
    for d in STANDARD_DEADLINES:
        deadline = closing - datetime.timedelta(days=d["days_before"])
        now = datetime.now()
        delta = (deadline - now).days
        if delta < 0:
            urgency = "overdue"
        elif delta == 0:
            urgency = "today"
        elif delta <= 3:
            urgency = "soon"
        else:
            urgency = "normal"
        items.append(DeadlineItem(
            task=d["task"],
            deadline=deadline.strftime("%Y-%m-%d"),
            days_until=delta,
            urgency=urgency,
            completed=False,
        ))
    return items


@api_router.post("/transaction/create", response_model=TransactionResponse)
async def transaction_create(req: TransactionCreate):
    tx_id = str(uuid.uuid4())
    closing_date = req.closing_date[:10]
    try:
        closing_dt = datetime.strptime(closing_date, "%Y-%m-%d")
        days_to_close = (closing_dt - datetime.now()).days
    except Exception:
        days_to_close = 30

    if days_to_close < 0:
        urgency = "overdue"
    elif days_to_close <= 7:
        urgency = "today"
    elif days_to_close <= 14:
        urgency = "soon"
    else:
        urgency = "normal"

    custom_dates = {
        "inspection": req.inspection_date[:10] if req.inspection_date else None,
        "financing": req.financing_date[:10] if req.financing_date else None,
        "appraisal": req.appraisal_date[:10] if req.appraisal_date else None,
        "due_diligence": req.due_diligence_date[:10] if req.due_diligence_date else None,
    }

    deadlines = _build_deadlines(closing_date, custom_dates)
    overdue_count = sum(1 for d in deadlines if d.urgency == "overdue")
    soon_count = sum(1 for d in deadlines if d.urgency == "soon")

    doc = {
        "id": tx_id,
        "address": req.address,
        "closing_date": closing_date,
        "custom_dates": custom_dates,
        "deadlines": [d.model_dump() for d in deadlines],
        "agent_name": req.agent_name or "",
        "agent_email": req.agent_email or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.transactions.insert_one(doc)

    return TransactionResponse(
        id=tx_id,
        address=req.address,
        closing_date=closing_date,
        days_to_close=days_to_close,
        closing_urgency=urgency,
        deadlines=deadlines,
        overdue_count=overdue_count,
        soon_count=soon_count,
    )


@api_router.get("/transactions")
async def transactions_list(session_id: Optional[str] = None):
    q = {}
    if session_id:
        q["agent_email"] = {"$exists": True}
    txs = await db.transactions.find(q, {"_id": 0}).to_list(50)
    for tx in txs:
        tx["days_to_close"] = 0
        try:
            cd = datetime.strptime(tx["closing_date"][:10], "%Y-%m-%d")
            tx["days_to_close"] = (cd - datetime.now()).days
        except Exception:
            tx["days_to_close"] = 0
        tx["overdue_count"] = sum(1 for d in tx.get("deadlines", []) if d.get("urgency") == "overdue")
        tx["soon_count"] = sum(1 for d in tx.get("deadlines", []) if d.get("urgency") == "soon")
    return {"transactions": txs}


@api_router.post("/transaction/deadline-complete")
async def deadline_complete(req: dict):
    tx_id = req.get("transaction_id")
    task_key = req.get("task")
    await db.transactions.update_one(
        {"id": tx_id},
        {"$set": {f"deadlines.$[d].completed": True}},
        array_filters=[{"d.task": task_key}],
    )
    return {"ok": True}


# ===== MARKET VALUATION =====
class MarketValuationRequest(BaseModel):
    address: str
    sqft: Optional[int] = None
    beds: Optional[int] = None
    baths: Optional[float] = None
    year_built: Optional[int] = None


class MarketValuationResponse(BaseModel):
    address: str
    estimated_value: str
    price_per_sqft: str
    comps_count: int
    market_condition: str  # "hot" | "balanced" | "slow"
    days_on_market_avg: int
    trend: str  # "rising" | "stable" | "falling"
    over_under: str  # "$12k above comps" etc.
    analysis: str


@api_router.post("/market/valuation", response_model=MarketValuationResponse)
async def market_valuation(req: MarketValuationRequest):
    if not ANTHROPIC_API_KEY:
        raise HTTPException(500, "LLM key missing")

    client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
    prompt = f"""Analyze this property for a comparative market analysis (CMA).

Property: {req.address}
Size: {req.sqft or 'unknown'} sqft, {req.beds or '?'} bed, {req.baths or '?'} bath
Year built: {req.year_built or 'unknown'}

Using your knowledge of US residential real estate markets, provide:
1. Estimated market value range ($200k-$2M scale)
2. Price per sqft estimate for this neighborhood tier
3. Market condition (hot/balanced/slow)
4. Average days on market for this type of home
5. Price trend (rising/stable/falling)
6. Whether this listing is priced above or below comps
7. A 3-paragraph analysis a real estate agent can use in a CMA

Respond in STRICT JSON only:
{{
  "estimated_value": "$450,000-$475,000",
  "price_per_sqft": "$287/sqft",
  "comps_count": 8,
  "market_condition": "hot",
  "days_on_market_avg": 12,
  "trend": "rising",
  "over_under": "$8k above comps",
  "analysis": "3-paragraph market analysis..."
}}"""

    response = client.messages.create(
        model=DEFAULT_MODEL,
        max_tokens=1024,
        system="You are a US real estate market analyst. Provide CMA-level analysis.",
        messages=[{"role": "user", "content": prompt}],
    )
    cleaned = _strip_json(response.content[0].text)
    try:
        data = json.loads(cleaned)
    except Exception as e:
        logging.exception("Market valuation parse failed: %s", e)
        raise HTTPException(500, f"Could not analyze market: {str(e)[:120]}")

    return MarketValuationResponse(
        address=req.address,
        estimated_value=str(data.get("estimated_value", "Contact agent")),
        price_per_sqft=str(data.get("price_per_sqft", "Varies")),
        comps_count=int(data.get("comps_count", 0)),
        market_condition=str(data.get("market_condition", "balanced")),
        days_on_market_avg=int(data.get("days_on_market_avg", 30)),
        trend=str(data.get("trend", "stable")),
        over_under=str(data.get("over_under", "")),
        analysis=str(data.get("analysis", "")),
    )
    listing_id = req.get("listing_id")
    session_id = req.get("session_id", "")
    listing = await db.listings.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Listing not found")
    views = await db.share_views.count_documents({"listing_id": listing_id})
    inquiries = await db.lead_notifications.count_documents({"listing_id": listing_id})
    address = listing.get("address", "Your Property")
    report_text = (
        f"Hi! Here's your listing report for {address}.\n\n"
        f"Views: {views} | Inquiries: {inquiries} | Showings: 0\n\n"
        f"Keep your agent posted on any feedback. Full report at listworks.pro"
    )
    return {"ok": True, "report": report_text}


# ===== LEAD NURTURING ENGINE =====
class NurtureThreadRequest(BaseModel):
    listing_id: str
    lead_name: str
    lead_contact: str  # email or phone
    channel: str = "telegram"  # "telegram" | "email" | "sms"
    tone: str = "friendly"  # "friendly" | "professional" | "urgent"


class NurtureMessage(BaseModel):
    role: str  # "agent" | "lead" | "assistant"
    content: str
    sent_at: Optional[str] = None


@api_router.post("/nurture/thread")
async def nurture_thread(req: NurtureThreadRequest):
    listing = await db.listings.find_one({"id": req.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Listing not found")

    thread_id = str(uuid.uuid4())
    first_message = (
        f"Hi {req.lead_name}! I saw your inquiry on {listing.get('address', 'this listing')}. "
        f"Happy to answer any questions. Is this still on your radar? "
        f"What's most important to you - the location, price, or the condition?"
    )

    doc = {
        "id": thread_id,
        "listing_id": req.listing_id,
        "lead_name": req.lead_name,
        "lead_contact": req.lead_contact,
        "channel": req.channel,
        "tone": req.tone,
        "messages": [
            {"role": "assistant", "content": first_message, "sent_at": datetime.now(timezone.utc).isoformat()},
        ],
        "status": "active",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.nurture_threads.insert_one(doc)

    if req.channel == "telegram":
        token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
        if token and req.lead_contact.startswith("@"):
            chat_id = req.lead_contact
            await _send_telegram(chat_id, f"[chat] Hey {req.lead_name}, your question is being reviewed - I'll have an answer shortly.", token)

    return {"thread_id": thread_id, "first_message": first_message}


@api_router.post("/nurture/reply")
async def nurture_reply(req: dict):
    thread_id = req.get("thread_id")
    lead_message = req.get("message", "")
    if not thread_id or not lead_message:
        raise HTTPException(400, "thread_id and message required")

    thread = await db.nurture_threads.find_one({"id": thread_id}, {"_id": 0})
    if not thread:
        raise HTTPException(404, "Thread not found")

    history = [
        {"role": m["role"], "content": m["content"]}
        for m in thread.get("messages", [])[-10:]
    ]
    history.append({"role": "lead", "content": lead_message})

    NURTURE_SYSTEM = f"""You are a friendly, helpful real estate assistant. You respond to buyer leads
on behalf of a licensed agent. Be warm, curious, and consultative. Never give legal advice.
If asked about contracts, referrals, or specific legal terms - suggest talking to the agent.
Keep responses short and conversational (3-5 sentences max).
Lead name: {thread['lead_name']}. Tone: {thread['tone']}."""

    client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
    response = client.messages.create(
        model=DEFAULT_MODEL,
        max_tokens=256,
        system=NURTURE_SYSTEM,
        messages=[{"role": "user", "content": lead_message}],
    )
    reply = response.content[0].text.strip()
    now = datetime.now(timezone.utc).isoformat()
    await db.nurture_threads.update_one(
        {"id": thread_id},
        {"$push": {"messages": {"$each": [
            {"role": "lead", "content": lead_message, "sent_at": now},
            {"role": "assistant", "content": reply, "sent_at": now},
        ]}}},
    )
    return {"reply": reply}


@api_router.get("/nurture/threads")
async def nurture_threads(session_id: Optional[str] = None):
    q = {}
    if session_id:
        q["session_id"] = session_id
    threads = await db.nurture_threads.find(q, {"_id": 0}).to_list(50)
    return {"threads": threads}
    token = os.environ.get("TELEGRAM_BOT_TOKEN", "")
    if not token:
        return
    chats = await db.telegram_links.find({"email": email.lower()}).to_list(100)
    if not chats:
        return
    commission = round(amount * COMMISSION_RATE, 2)
    text = (
        f"? <b>Sale! You earned ${commission:.2f}</b>\n\n"
        f"Package: {package}\n"
        f"Commission: {int(COMMISSION_RATE * 100)}%\n\n"
        f"Paid out monthly (min $50). Track at listworks.pro/a/{email.split('@')[0]}"
    )
    for chat in chats:
        await _send_telegram(chat["telegram_chat_id"], text, token)


# ===== AFFILIATE UPGRADES =====
class AffiliateCreateIn(BaseModel):
    email: str
    name: str
    referral_code: str


class ShareTextRequest(BaseModel):
    package: str = "general"


@api_router.post("/affiliate/create")
async def affiliate_create(req: AffiliateCreateIn):
    ref = req.referral_code.strip().lower()
    if not ref or len(ref) > 32 or not re.match(r"^[a-z0-9_]+$", ref):
        raise HTTPException(400, "Invalid code - letters, numbers, underscores only, max 32 chars")
    existing = await db.affiliates.find_one({"ref": ref})
    if existing:
        raise HTTPException(409, "That referral code is taken.")
    await db.affiliates.insert_one({
        "ref": ref,
        "email": req.email.lower(),
        "name": req.name.strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "clicks": 0,
        "sales": 0,
        "commission_owed": 0.0,
        "paid_out": 0.0,
    })
    site = os.environ.get("SITE_URL", "https://listworks.pro")
    link = f"{site}/?ref={ref}"
    return {"ref": ref, "link": link, "commission_rate": int(COMMISSION_RATE * 100)}


@api_router.post("/affiliate/share-text")
async def affiliate_share_text(req: ShareTextRequest):
    site = os.environ.get("SITE_URL", "https://listworks.pro")
    if req.package == "guide":
        return {
            "platform": "Instagram",
            "text": (
                "Listing copy that actually sells homes [rocket]\n\n"
                "I used this AI tool to rewrite my MLS draft in 10 seconds - "
                "it gave me an Instagram caption, a Facebook post, 5 headlines, and an email blast.\n\n"
                "First 3 are FREE -> listworks.pro\n\n"
                "#realestate #realestateagent #listings #homesweethome"
            ),
        }
    if req.package == "pro":
        return {
            "platform": "Facebook",
            "text": (
                "Just started using ListWorks PRO for listing copy.\n\n"
                "3 bed 2 bath ranch -> Instagram caption + FB post + 5 headlines + email blast, "
                "all in 10 seconds. First 3 free.\n\n"
                "? listworks.pro\n\n"
                "Has anyone else tried it? Worth the $49/mo?"
            ),
        }
    return {
        "platform": "General",
        "text": (
            "This AI tool rewrites boring MLS listing copy into publish-ready content in 10 seconds.\n\n"
            "Free to try -> listworks.pro\n\n"
            "#realestate #listings #realestateagent"
        ),
    }


@api_router.get("/affiliate/dashboard/{ref}")
async def affiliate_full(ref: str):
    basic = await db.affiliates.find_one({"ref": ref.strip().lower()}, {"_id": 0})
    if not basic:
        raise HTTPException(404, "Affiliate not found")

    sales = await db.payment_transactions.find(
        {"ref": ref.strip().lower(), "payment_status": "paid"},
    ).to_list(500)
    total_revenue = sum(s.get("amount", 0) for s in sales)
    clicks = await db.ref_clicks.count_documents({"ref": ref.strip().lower()})
    conversion = round((len(sales) / clicks * 100), 2) if clicks > 0 else 0.0

    site = os.environ.get("SITE_URL", "https://listworks.pro")
    base = f"{site}/?ref={ref.strip().lower()}"
    share_links = {
        "twitter": f"https://twitter.com/intent/tweet?text={site}&url={base}",
        "facebook": f"https://www.facebook.com/sharer/sharer.php?u={base}",
        "linkedin": f"https://www.linkedin.com/sharing/share-offsite/?url={base}",
        "copy": base,
    }
    return {
        **basic,
        "clicks": clicks,
        "conversion": conversion,
        "total_revenue": round(total_revenue, 2),
        "commission_owed": round(total_revenue * COMMISSION_RATE, 2),
        "paid_out": basic.get("paid_out", 0.0),
        "share_links": share_links,
    }
    return {"app": "ListWorks PRO", "status": "live", "engine": "Claude Sonnet 4.5"}


@api_router.post("/rewrite", response_model=RewriteOutput)
async def rewrite_listing(req: RewriteRequest):
    if len(req.raw_listing.strip()) < 10:
        raise HTTPException(400, "Listing too short. Add at least a sentence.")

    # ? Paywall gate - enforce free quota / credits / Pro
    usage = await _get_usage(req.session_id)
    if usage["paywall"]:
        raise HTTPException(
            status_code=402,  # Payment Required
            detail={
                "code": "paywall",
                "message": f"You've used your {FREE_REWRITES_PER_SESSION} free rewrites. Upgrade to keep generating.",
                "usage": usage,
            },
        )

    outputs = await call_rewrite_llm(req)
    listing_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    # Decrement credits if user is on the credit plan (and not Pro)
    if not usage["is_pro"] and usage["credits"] > 0 and req.session_id:
        await db.credits.update_one(
            {"lw_session_id": req.session_id},
            {"$inc": {"balance": -1}},
        )

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

    return RewriteOutput(
        id=listing_id,
        tone=req.tone,
        raw_listing=req.raw_listing,
        created_at=created_at,
        **outputs,
    )


ENHANCE_SYSTEM = """You are a senior real estate copywriter specializing in turning good
listings into exceptional ones. You take a near-finished listing and push every element
to a 9.5-10/10 on emotional impact, specificity, and buyer resonance.

You will receive a listing with its MLS copy, headlines, and social assets.
Your job is to rewrite ALL outputs so they are 10/10 - vivid, specific, emotionally
charged, and impossible to scroll past.

HARD RULES:
- Replace every generic adjective with a concrete, sensory detail
- Every sentence must earn its place - cut anything that doesn't create a picture
- Open with a feeling, not a fact
- Headlines must hit in under 3 seconds - lead with the most compelling hook
- Instagram: starts with a feeling or a question, ends with a strong CTA
- Facebook: conversational, community-aware, drives comments
- Email: subject line worthy, first line hooks, one clear CTA
- No banned phrases: "Welcome to", "Don't miss", "Must see", "Spacious", "Cozy",
  "Motivated seller", "Charming", "Nestled", "Priced to sell"
- Max one exclamation mark total across all outputs

OUTPUT FORMAT - STRICT JSON ONLY:
{
  "mls": "...",
  "instagram": "...",
  "facebook": "...",
  "headlines": ["headline 1", "headline 2", "headline 3"],
  "email": "...",
  "listing_strength": 9.8,
  "strength_reasons": ["reason 1", "reason 2", ...]
}
"""


class EnhanceRequest(BaseModel):
    listing_id: str
    session_id: Optional[str] = None


class EnhanceResponse(BaseModel):
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


@api_router.post("/rewrite/enhance", response_model=EnhanceResponse)
async def enhance_listing(req: EnhanceRequest):
    if not ANTHROPIC_API_KEY:
        raise HTTPException(500, "LLM key missing")
    if not HAS_ANTHROPIC:
        raise HTTPException(500, "anthropic package not installed")

    usage = await _get_usage(req.session_id)
    if usage["paywall"]:
        raise HTTPException(402, "Upgrade to Pro to use Make it 10/10")

    listing = await db.listings.find_one({"id": req.listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(404, "Listing not found")

    client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
    user_prompt = f"""Enhance this listing to 10/10:

ORIGINAL RAW: {listing.get('raw_listing', '')}

CURRENT MLS OUTPUT:
{listing.get('mls', '')}

CURRENT HEADLINES:
{chr(10).join(f'- {h}' for h in (listing.get('headlines') or []))}

CURRENT INSTAGRAM:
{listing.get('instagram', '')}

CURRENT FACEBOOK:
{listing.get('facebook', '')}

CURRENT EMAIL:
{listing.get('email', '')}

Return STRICT JSON with all enhanced outputs."""  # noqa: F541

    response = client.messages.create(
        model=DEFAULT_MODEL,
        max_tokens=1024,
        system=ENHANCE_SYSTEM,
        messages=[{"role": "user", "content": user_prompt}],
    )
    cleaned = _strip_json(response.content[0].text)
    try:
        data = json.loads(cleaned)
    except Exception as e:
        logging.exception("Enhance JSON parse failed")
        raise HTTPException(500, f"Enhance failed: {str(e)[:120]}")

    headlines = data.get("headlines", [])
    if isinstance(headlines, str):
        headlines = [h.strip("- -*").strip() for h in headlines.split("\n") if h.strip()]
    headlines = [h.strip() for h in headlines if h.strip()][:3]

    reasons = data.get("strength_reasons", [])
    if isinstance(reasons, str):
        reasons = [r.strip() for r in reasons.split("\n") if r.strip()]

    try:
        strength = float(data.get("listing_strength", 9.5))
    except (TypeError, ValueError):
        strength = 9.5
    strength = max(0.0, min(10.0, round(strength, 1)))

    enhanced_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    doc = {
        "id": enhanced_id,
        "session_id": listing.get("session_id"),
        "parent_id": listing.get("id"),
        "tone": listing.get("tone", "Modern"),
        "raw_listing": listing.get("raw_listing", ""),
        "mls": data.get("mls", "").strip(),
        "instagram": data.get("instagram", "").strip(),
        "facebook": data.get("facebook", "").strip(),
        "headlines": headlines,
        "email": data.get("email", "").strip(),
        "listing_strength": strength,
        "strength_reasons": [r for r in reasons if isinstance(r, str)][:5],
        "created_at": created_at,
    }
    await db.listings.insert_one(doc)

    return EnhanceResponse(
        id=enhanced_id,
        tone=listing.get("tone", "Modern"),
        raw_listing=listing.get("raw_listing", ""),
        created_at=created_at,
        mls=doc["mls"],
        instagram=doc["instagram"],
        facebook=doc["facebook"],
        headlines=doc["headlines"],
        email=doc["email"],
        listing_strength=strength,
        strength_reasons=doc["strength_reasons"],
    )


@api_router.post("/batch-rewrite", response_model=BatchRewriteResponse)
async def batch_rewrite(req: BatchRewriteRequest):
    results = []
    success_count = 0
    failed_count = 0

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
    if not ANTHROPIC_API_KEY:
        raise HTTPException(500, "LLM key missing")

    if not HAS_ANTHROPIC:
        raise HTTPException(500, "anthropic package not installed")

    client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
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
    if not ANTHROPIC_API_KEY:
        raise HTTPException(500, "LLM key missing")

    if not req.redfin_url or "redfin.com" not in req.redfin_url.lower():
        raise HTTPException(400, "Invalid Redfin URL. Please provide a valid Redfin listing URL.")

    if not HAS_ANTHROPIC:
        raise HTTPException(500, "anthropic package not installed")

    client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
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
    """Public share endpoint - returns the before/after for a listing.
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
    if not ANTHROPIC_API_KEY:
        raise HTTPException(500, "LLM key missing")

    if not HAS_ANTHROPIC:
        raise HTTPException(500, "anthropic package not installed")

    client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
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
ADVISOR_SYSTEM = """You are the ListWorks AI Advisor - a senior real estate marketing
strategist trained on the ListWorks framework (5-part structure, Feature -> Benefit -> Feeling,
4 buyer triggers). You give concise, opinionated, actionable advice on listing copy,
photos, video strategy, and buyer psychology.

Keep responses under 180 words. Use plain text, short paragraphs, no markdown headers.
When the user shares listing copy, critique it against the framework: point to specific
banned-word offenders, missing FBF translations, weak hooks, and dead CTAs. Suggest
exact rewrites - don't just describe."""


@api_router.post("/advisor", response_model=AdvisorResponse)
async def advisor(req: AdvisorRequest):
    if not ANTHROPIC_API_KEY:
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

    client = AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
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
            api_key=ANTHROPIC_API_KEY,
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
            "after": "Sunlight pours through the front window at 7 a.m. - and that's before you've even reached the kitchen, where granite catches the morning glow and Sunday pancakes practically make themselves. Three bedrooms. Two updated baths. A backyard built for slow weekends and faster dogs. Walk to top-rated schools, bike to the trail, and discover why this stretch of Linden trades quietly - and rarely.",
            "tone": "Cozy",
        },
        {
            "id": "ex2",
            "address": "418 Willowbrook Ln, Scottsdale AZ",
            "before": "Updated 4 bed 3 bath in desirable neighborhood. New quartz counters. Pool. 3-car garage. Mountain views.",
            "after": "The kind of pool you actually use - not just for show. Four bedrooms, three baths, and a kitchen that's been touched by someone who cooks. Quartz counters that don't feel like a compromise. A 3-car garage for the truck, the toys, and everything else. And views of the McDowells that remind you why you moved here in the first place.",
            "tone": "Modern",
        },
        {
            "id": "ex3",
            "address": "904 Ironwood Ct, Denver CO",
            "before": "Investment property. 4-plex. Fully rented. Cap rate 6.2%. Recent roof. Off-street parking.",
            "after": "A rare 4-plex in Denver's tightest sub-market - fully tenanted, freshly capitalized, and engineered to print. 6.2% cap on actuals. New roof, new bones, new opportunity. Off-street parking, low turnover, and an emerging block where comps are climbing 9% YoY. The kind of asset you don't list - you whisper.",
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
        "allow_promotion_codes": True,  # [hot] Customers can enter COMEBACK29 etc.
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

        # Fire drip emails (idempotent - only first time payment_status flips to paid)
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
            # Fire drip emails - idempotent via drip_sent flag
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

    # ? Fire Slack notification regardless (motivation + tracking)
    await _notify_slack_sale(txn, email)

    # [email] Email drips (only if Resend configured and we have an email)
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

    # ? Credit grant for credit packages
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

        text = f"{emoji} *NEW SALE - ${amount}* - {name}\n_email:_ `{email or 'unknown'}`   *   _kind:_ `{kind}`"
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
    Drip emails are NOT scheduled here - this is for smoke-testing only."""
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
        raise HTTPException(502, "Resend send failed - check backend logs")
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
