from fastapi import FastAPI, APIRouter, HTTPException, Request, Header
from fastapi.responses import FileResponse, HTMLResponse
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
from datetime import datetime, timezone, timedelta
import jwt

JWT_SECRET = os.environ.get("JWT_SECRET", "listworks-jwt-secret-change-in-prod")
JWT_ALGO = "HS256"

try:
    from anthropic import AsyncAnthropic
    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False
    AsyncAnthropic = None

from video_engine import generate_listing_video, MUSIC_TRACKS
from email_engine import send_guide_drip, send_pro_welcome, send_email, send_free_trial_drip
from compliance_engine import check_fair_housing_v3, overall_risk, compliance_grade, check_co_ai_act
import base64
import stripe as stripe_sdk
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY', '')
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', '')
MAKE_WEBHOOK_URL = os.environ.get('MAKE_WEBHOOK_URL', '')
FIRECRAWL_API_KEY = os.environ.get('FIRECRAWL_API_KEY', '')
RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
DEFAULT_PROVIDER = "openrouter"
DEFAULT_MODEL = "openai/gpt-4o"

if STRIPE_API_KEY:
    stripe_sdk.api_key = STRIPE_API_KEY

# ── OpenRouter helper ─────────────────────────────────────
OPENROUTER_BASE = "https://openrouter.ai/api/v1"
G0DM0D3_BASE = "http://localhost:7860"
G0DM0D3_API_KEY = "g0dm0d3-local-key-change-me"

async def call_openrouter(system: str, user_text: str, model: str = None) -> str:
    """Call OpenRouter's OpenAI-compatible chat completions endpoint via httpx."""
    key = OPENROUTER_API_KEY or os.environ.get("OPENROUTER_API_KEY", "")
    if not key:
        raise HTTPException(500, "OpenRouter API key not configured")
    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(
            f"{OPENROUTER_BASE}/chat/completions",
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            json={
                "model": model or DEFAULT_MODEL,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_text},
                ],
                "max_tokens": 2048,
                "temperature": 0.7,
            },
        )
        if resp.status_code != 200:
            raise HTTPException(502, f"OpenRouter error {resp.status_code}: {resp.text[:200]}")
        data = resp.json()
        return data["choices"][0]["message"]["content"]

# Server-side fixed pricing — NEVER accept amounts from frontend
PACKAGES = {
    "guide_pdf":   {"amount":  20.00, "currency": "usd", "name": "ListWorks Guide PDF",          "kind": "guide"},
    "pro_month":   {"amount":  29.00, "currency": "usd", "name": "ListGenius Pro — 1 Month",     "kind": "pro"},
    "pro_annual":  {"amount": 290.00, "currency": "usd", "name": "ListGenius Pro — Annual",      "kind": "pro"},
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
    language: Optional[str] = None
    mls_char_limit: Optional[int] = None
    address: Optional[str] = None
    price: Optional[str] = None
    beds: Optional[str] = None
    baths: Optional[str] = None
    sqft: Optional[str] = None
    virtual_tour_url: Optional[str] = None
    session_id: Optional[str] = None
    brand_voice: Optional[dict] = None  # injected server-side from DB


class BrandVoiceModel(BaseModel):
    agent_name: Optional[str] = None
    brokerage: Optional[str] = None
    market: Optional[str] = None
    style: Optional[str] = None          # "Conversational", "Polished", "Bold", "Minimal"
    avoid_words: Optional[str] = None    # comma-separated
    favorite_phrases: Optional[str] = None
    extra: Optional[str] = None          # free-form notes
    # Brand Kit visual fields
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None  # hex e.g. "#d63b1e"
    secondary_color: Optional[str] = None
    font: Optional[str] = None           # "Modern Sans", "Classic Serif", "Friendly Script"
    tagline: Optional[str] = None        # agent/brokerage tagline


class PrintFlyerOutput(BaseModel):
    headline: str
    bullets: List[str]
    tagline: str


class RewriteOutput(BaseModel):
    id: str
    mls: str
    instagram: str
    facebook: str
    headlines: List[str]
    email: str
    reel_script: str = ""
    stories: List[str] = []
    print_flyer: Optional[PrintFlyerOutput] = None
    listing_strength: float
    strength_reasons: List[str]
    tone: str
    raw_listing: str
    virtual_tour_url: Optional[str] = None
    created_at: str
    output_compliance: Optional[Dict[str, Any]] = None  # post-gen scan of AI output


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


class AddressLookupRequest(BaseModel):
    address: str
    session_id: Optional[str] = None


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

REWRITE_SYSTEM = """You are ListWorks PRO — the most advanced real estate copywriting AI ever built. You outperform every human copywriter and every other AI at generating listing copy that converts. Your writing doesn't just describe homes — it triggers dopamine, activates mirror neurons, and compels action.

═══════════════════════════════════════════════════════════════
CORE FRAMEWORK — THE LISTWORKS 5-PART STRUCTURE
═══════════════════════════════════════════════════════════════
1. THE OPENING HOOK — 1-2 sentences. Must be emotionally disruptive, not descriptive. Never start with "Welcome to", the address, or "This beautiful home". Start with a feeling, a contrast, or an unexpected truth.

2. THE LIFESTYLE PARAGRAPH — Sell the LIFE, not the specs. Paint a specific Wednesday afternoon or Saturday morning. Use sensory language (light, sound, texture, temperature). Make the reader see themselves there.

3. THE FEATURE TRANSLATION LAYER — FBF (Feature → Benefit → Feeling). Every spec must answer: "So what?" A chef's kitchen isn't about appliances — it's about Sunday sauce simmering while friends gather around the island.

4. THE NEIGHBORHOOD & CONTEXT — Specific > generic. Instead of "great location", say "three blocks from the farmers market and that coffee shop with the blue door". If no specifics given, create a believable archetype.

5. THE CALL TO ACTION — Confident, not desperate. Never "call today!" or "schedule a showing". Instead: "Come see why 47 Elm Street won't last the weekend." Assume interest, don't beg for it.

═══════════════════════════════════════════════════════════════
PLATFORM-SPECIFIC OPTIMIZATION — NON-NEGOTIABLE
═══════════════════════════════════════════════════════════════
MLS (200-250 words):
- Full 5-part structure, flowing paragraphs
- Professional, confident, editorial tone
- End with a soft CTA that assumes the buyer is already interested
- No hashtags, no emojis, no gimmicks

INSTAGRAM (100-130 words):
- First 2 lines must work WITHOUT the image (they show in feed preview)
- Conversational, punchy, emotional
- End with a question to trigger comments
- Final line: 12-15 hyper-targeted hashtags separated by spaces
- Use line breaks for rhythm, not periods
- Example structure: Hook → Feeling → Specs as texture → CTA question

FACEBOOK (150-180 words):
- Story-driven, lifestyle-led
- Open with a micro-story (3 sentences max)
- Middle: paint the lifestyle, weave in specs naturally
- End with low-pressure CTA
- Think: what would make an agent's friend comment "Wow where is this?"

EMAIL (120-160 words):
- First line: "Subject: [punchy subject line under 50 chars]" on its own line
- Blank line after subject
- Body: warm, personal, confident — like an email from a trusted friend
- One clear CTA. Never "click here" or "call now"

HEADLINES (3 variations):
- Variation 1: EMOTION-led (makes you feel something first)
- Variation 2: SPECIFICITY-led (uses a concrete detail to hook)
- Variation 3: URGENCY-led (creates FOMO without being pushy)
- Each under 10 words. Each could stand alone as a social post.

REEL / SHORT-FORM VIDEO SCRIPT (15-20 seconds when read aloud, ~55-70 words):
- Line 1 — THE HOOK (3-5 words, on its own line): The single most scroll-stopping thing about this property. Blunt. Visual. Unexpected.
- Lines 2-4 — THE PUNCHES (one line each): Three specific, visual features that pop on camera. Not descriptions — punches. "White oak floors. No carpet anywhere." "A kitchen that costs more than most cars."
- Line 5 — THE CTA (one line): Confident, low-pressure. Assumes interest. "Link in bio. Come see it." or "DM TOUR and I'll get you in."
- Write for voice. Short sentences. Natural pauses. No emojis.

INSTAGRAM STORIES (exactly 3 slides, each line is one slide):
- Slide 1 — HOOK: Bold claim or contrast. 10 words max. Grabs attention before they swipe. "This is the one your friends are going to be jealous of."
- Slide 2 — PROOF: 2-3 specific features separated by line breaks. With relevant emojis. "🏠 4 beds · 3 baths\n✨ Renovated kitchen — quartz, gas range\n🌿 Fenced backyard — no HOA"
- Slide 3 — CTA: One action. "👆 Swipe up for full tour" or "💬 DM me TOUR for showing times"
- Each slide 15 words max.

PRINT FLYER (headline + 3 bullets + tagline):
- headline: Under 8 words. Emotion or specificity. Could print at 48pt. Makes you stop.
- bullets: Array of exactly 3 strings. Each starts with the KEY feature as a bold anchor (2-3 words), followed by " — " then the "so what" in 10 words max. Example: "Chef's Kitchen — quartz counters, gas range, zero compromise on cooking."
- tagline: 6-8 words. Confident, not desperate. The last thing they read before they call.

═══════════════════════════════════════════════════════════════
PSYCHOLOGICAL TRIGGERS — ACTIVATE AT LEAST 2 PER ASSET
═══════════════════════════════════════════════════════════════
- Belonging: "This is where Sunday dinners happen"
- Status: "The kind of address that says something before you do"
- Safety: "Dead-end street. Kids still ride bikes here."
- Urgency: "Three offers already. Seller reviewing Tuesday."
- Novelty: "First time on the market in 18 years."
- Validation: "The kind of neighborhood everyone drives through and wishes they lived in."
- Sensory: Specific sounds, smells, light quality, tactile details
- Contrast: "City energy when you want it. Tree-lined quiet when you don't."

═══════════════════════════════════════════════════════════════
FAIR HOUSING COMPLIANCE — ABSOLUTE LAW
═══════════════════════════════════════════════════════════════
NEVER write language implying a property is suitable or unsuitable for any protected class.

BANNED — protected class language:
- Familial status: "perfect for families", "great for kids", "family-friendly", "kid-friendly"
- Religion: "near churches", "walk to church", "religious community"
- Race/national origin: any language implying neighborhood demographics
- Age: "great for retirees", "senior living", "retirement community"
- Disability: implying a person needs accessibility features

INSTEAD — describe what is physically there:
- "fenced backyard" NOT "perfect for kids"
- "0.3 miles from First Baptist Church" NOT "church community nearby"
- "wide doorways and zero-step entry" NOT "accessible"

═══════════════════════════════════════════════════════════════
HARD RULES — VIOLATION = FAILURE
═══════════════════════════════════════════════════════════════
ABSOLUTELY BANNED (AI clichés that signal robot writing):
"Welcome to", "Don't miss", "Must see", "Spacious", "Cozy" (as a crutch), "Motivated seller", "Charming", "Nestled", "Won't last", "Priced to sell", "Call for details", "Opportunity awaits", "This gem", "Check out", "Stunning", "Gorgeous", "Meticulously", "Meticulously maintained", "Breathtaking", "Incredible", "Fantastic", "Spectacular", "Magnificent", "Immaculate", "Pristine", "Amazing", "Wonderful", "Exceptional", "Outstanding", "Remarkable", "Oasis", "Boasts", "Serene", "Perfect for", "Nestled in a serene oasis", "Ideal for"

TEST: If the word could appear in 10,000 other listings, do not use it. Be specific instead.
- NOT "stunning kitchen" → YES "quartz counters under a skylight, no overhead fluorescents"
- NOT "meticulously maintained" → YES "new roof (2023), HVAC replaced last spring"
- NOT "gorgeous views" → YES "south-facing windows frame open sky from every room"

DO NOT:
- Open with the address or property type
- Use more than 2 adjectives in a row
- Write any sentence longer than 25 words
- Use more than 1 exclamation mark per asset
- Use bullet points in MLS or Email
- Say "you won't want to miss this"
- Use generic filler like "great schools" or "close to everything"
- Describe the obvious (a kitchen has countertops, a bedroom has a closet)
- Invent specific facts not provided in the input

ALWAYS:
- Write in present tense
- Use active voice
- Include at least one specific sensory detail per asset
- Ground every claim in facts from the input
- Make the reader feel like THIS specific home, not any home
- End every asset with forward momentum

═══════════════════════════════════════════════════════════════
OUTPUT — STRICT JSON ONLY (no markdown, no commentary)
═══════════════════════════════════════════════════════════════
{
  "mls": "Full MLS description following 5-part structure.",
  "instagram": "Instagram caption with hook → feeling → hashtags.",
  "facebook": "Story-driven Facebook post.",
  "headlines": ["Emotion-led headline", "Specificity-led headline", "Urgency-led headline"],
  "email": "Subject line on first line, then body.",
  "reel_script": "HOOK LINE\n\nPunch feature 1\nPunch feature 2\nPunch feature 3\n\nCTA line",
  "stories": ["Slide 1 hook — 10 words max", "Slide 2 features with emojis\nFeature 2\nFeature 3", "Slide 3 CTA"],
  "print_flyer": {
    "headline": "Attention-stopping headline under 8 words",
    "bullets": ["Key Feature — the so what in 10 words.", "Key Feature — the so what in 10 words.", "Key Feature — the so what in 10 words."],
    "tagline": "Confident 6-8 word closing line"
  },
  "listing_strength": 7.4,
  "strength_reasons": ["3-4 specific reasons for the score, citing real elements from the copy"]
}

The listing_strength is 0-10 (one decimal). Be honest — most land between 6.5-8.5. Reserve 9+ for truly exceptional listing detail + output. If score is below 9, include 1-2 concrete improvements in strength_reasons.
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


async def call_g0dm0d3(system: str, user_text: str, tier: str = "smart") -> str:
    """Race multiple models via G0DM0D3 ultraplinian — returns best response."""
    async with httpx.AsyncClient(timeout=90.0) as c:
        resp = await c.post(
            f"{G0DM0D3_BASE}/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {G0DM0D3_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": f"ultraplinian/{tier}",
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_text},
                ],
                "max_tokens": 2048,
                "stream": False,
            },
        )
        resp.raise_for_status()
        return resp.json()["choices"][0]["message"]["content"]


async def call_rewrite_llm(req: RewriteRequest) -> Dict[str, Any]:
    if not OPENROUTER_API_KEY and not os.environ.get("OPENROUTER_API_KEY"):
        raise HTTPException(500, "OpenRouter key missing")

    user_text = _build_user_prompt(req)
    system = REWRITE_SYSTEM

    # Inject brand voice if present
    if req.brand_voice:
        bv = req.brand_voice
        parts = []
        if bv.get("agent_name"): parts.append(f"Agent name: {bv['agent_name']}")
        if bv.get("brokerage"): parts.append(f"Brokerage: {bv['brokerage']}")
        if bv.get("market"): parts.append(f"Market area: {bv['market']}")
        if bv.get("style"): parts.append(f"Writing style: {bv['style']}")
        if bv.get("avoid_words"): parts.append(f"NEVER use these words or phrases: {bv['avoid_words']}")
        if bv.get("favorite_phrases"): parts.append(f"Naturally weave in these phrases when relevant: {bv['favorite_phrases']}")
        if bv.get("tagline"): parts.append(f"Agent tagline (weave into Reel CTA or print flyer tagline when natural): {bv['tagline']}")
        if bv.get("font"): parts.append(f"Brand feel/font aesthetic: {bv['font']} — let this inform tone (Modern Sans = clean/direct, Classic Serif = elevated/formal, Friendly Script = warm/approachable)")
        if bv.get("extra"): parts.append(f"Additional brand notes: {bv['extra']}")
        if parts:
            system += "\n\n═══ AGENT BRAND VOICE (apply to ALL outputs) ═══\n" + "\n".join(parts) + "\n═══════════════════════════════════════════════"

    if req.mls_char_limit and req.mls_char_limit > 0:
        system += f"\n\n⚠️ MLS CHARACTER LIMIT: The MLS field MUST NOT exceed {req.mls_char_limit} characters (including spaces). Count carefully. If your draft exceeds {req.mls_char_limit} chars, shorten it. This is a hard requirement."
    if req.language and req.language.lower() not in ("english", "en"):
        system += f"\n\n⚠️ CRITICAL LANGUAGE OVERRIDE: The agent selected {req.language} as their output language. You MUST write EVERY field — mls, instagram, facebook, all headlines, email, reel_script — entirely in {req.language}. NOT English. {req.language}. Only keep raw numbers, addresses, and measurements as-is. This is a hard requirement — do not produce any English output."
    raw = await call_openrouter(system, user_text, model="anthropic/claude-opus-4-8")
    cleaned = _strip_json(raw)
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

    # Parse print_flyer — can be dict or missing
    raw_flyer = data.get("print_flyer", {})
    print_flyer = None
    if isinstance(raw_flyer, dict) and raw_flyer.get("headline"):
        bullets = raw_flyer.get("bullets", [])
        if isinstance(bullets, str):
            bullets = [b.strip() for b in bullets.split("\n") if b.strip()]
        print_flyer = {
            "headline": raw_flyer.get("headline", "").strip(),
            "bullets": [b.strip() for b in bullets if b.strip()][:3],
            "tagline": raw_flyer.get("tagline", "").strip(),
        }

    # Parse stories — array of 3 slide strings
    raw_stories = data.get("stories", [])
    if isinstance(raw_stories, str):
        raw_stories = [s.strip() for s in raw_stories.split("|||") if s.strip()]
    stories = [str(s).strip() for s in raw_stories if s][:3]

    return {
        "mls": data.get("mls", "").strip(),
        "instagram": data.get("instagram", "").strip(),
        "facebook": data.get("facebook", "").strip(),
        "headlines": headlines,
        "email": data.get("email", "").strip(),
        "reel_script": data.get("reel_script", "").strip(),
        "stories": stories,
        "print_flyer": print_flyer,
        "listing_strength": strength,
        "strength_reasons": [r for r in reasons if isinstance(r, str)][:5],
    }


# ============== RATE LIMITING + BOT PROTECTION ==============
_free_rewrites_per_session: Dict[str, int] = {}
_rate_limit_log: Dict[str, list] = {}
_rate_limit_lock = asyncio.Lock()


def _get_client_ip(request: Request) -> str:
    """Extract real client IP, respecting Cloudflare/proxy headers."""
    cf_ip = request.headers.get("CF-Connecting-IP")
    if cf_ip:
        return cf_ip.strip()
    forwarded = request.headers.get("X-Forwarded-For", "")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


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


async def _is_ip_rate_limited(request: Request, endpoint: str, limit: int = 30, window: int = 60) -> bool:
    """IP-level backstop — catches attackers who rotate session IDs."""
    ip = _get_client_ip(request)
    if not ip or ip == "unknown":
        return False
    return await _is_rate_limited(f"ip:{ip}", endpoint, limit, window)


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


# Hard 3-trial limit per session, persisted to MongoDB so restarts don't reset it.
# IP-level cap (15 total) prevents localStorage-clearing bypass.
FREE_TRIALS_PER_SESSION = 3
IP_TRIAL_CAP = 15


UNLIMITED_SESSIONS = set(filter(None, os.environ.get("UNLIMITED_SESSIONS", "").split(",")))


async def _check_free_trial(session_id: str, ip: str = "") -> tuple[bool, int]:
    """Returns (allowed, remaining). Persisted in MongoDB."""
    if not session_id:
        return False, 0
    if session_id in UNLIMITED_SESSIONS:
        return True, 999
    doc = await db.free_trials.find_one({"session_id": session_id}, {"used": 1})
    used = doc.get("used", 0) if doc else 0
    if used >= FREE_TRIALS_PER_SESSION:
        return False, 0
    if ip:
        pipeline = [{"$match": {"ip": ip}}, {"$group": {"_id": None, "total": {"$sum": "$used"}}}]
        res = await db.free_trials.aggregate(pipeline).to_list(1)
        if res and res[0].get("total", 0) >= IP_TRIAL_CAP:
            return False, 0
    return True, FREE_TRIALS_PER_SESSION - used


async def _record_free_trial(session_id: str, ip: str = "") -> None:
    if not session_id:
        return
    now = datetime.now(timezone.utc).isoformat()
    await db.free_trials.update_one(
        {"session_id": session_id},
        {
            "$inc": {"used": 1},
            "$set": {"ip": ip, "updated_at": now},
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )


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


# ══════════════ AUTH ENDPOINTS ══════════════
class AgentSignupIn(BaseModel):
    email: str
    password: str
    name: str
    brokerage: str = ""
    phone: str = ""

class AgentLoginIn(BaseModel):
    email: str
    password: str

class BrandingIn(BaseModel):
    logo_url: str = ""
    primary_color: str = "#1a1a2e"
    secondary_color: str = "#d63b1e"
    brokerage: str = ""
    agent_name: str = ""

@api_router.post("/auth/signup")
async def agent_signup(req: AgentSignupIn):
    import bcrypt as _bcrypt
    import traceback
    try:
        existing = await db.agents.find_one({"email": req.email.lower()})
        if existing:
            raise HTTPException(400, "Email already registered")
        pw_hash = _bcrypt.hashpw(req.password.encode(), _bcrypt.gensalt()).decode()
        agent = {
            "email": req.email.lower(),
            "password": pw_hash,
            "name": req.name,
            "brokerage": req.brokerage,
            "phone": req.phone,
            "branding": {"logo_url": "", "primary_color": "#1a1a2e", "secondary_color": "#d63b1e"},
            "tier": "free",
            "content_packs_used": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.agents.insert_one(agent)
        token = jwt.encode({"sub": req.email.lower(), "iat": datetime.now(timezone.utc)}, JWT_SECRET, algorithm=JWT_ALGO)
        return {"token": token, "agent": {"email": agent["email"], "name": agent["name"], "brokerage": agent["brokerage"], "tier": "free"}}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Signup failed: {traceback.format_exc()}")
        raise HTTPException(500, "Account creation failed. Please try again.")

@api_router.post("/auth/login")
async def agent_login(req: AgentLoginIn):
    import bcrypt as _bcrypt
    agent = await db.agents.find_one({"email": req.email.lower()})
    if not agent or not _bcrypt.checkpw(req.password.encode(), agent["password"].encode()):
        raise HTTPException(401, "Invalid email or password")
    token = jwt.encode({"sub": req.email.lower(), "iat": datetime.now(timezone.utc)}, JWT_SECRET, algorithm=JWT_ALGO)
    return {"token": token, "agent": {"email": agent["email"], "name": agent["name"], "brokerage": agent["brokerage"], "tier": agent.get("tier", "free")}}

@api_router.get("/auth/me")
async def get_me(authorization: str = Header(None)):
    import traceback
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing token")
    try:
        payload = jwt.decode(authorization.split(" ")[1], JWT_SECRET, algorithms=[JWT_ALGO])
    except:
        raise HTTPException(401, "Invalid token")
    try:
        agent = await db.agents.find_one({"email": payload["sub"]})
        if not agent:
            raise HTTPException(404, "Agent not found")
        agent.pop("password", None)
        agent.pop("_id", None)
        return {"agent": agent}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Auth/me failed: {traceback.format_exc()}")
        raise HTTPException(500, "Authentication error. Please try again.")

@api_router.put("/auth/branding")
async def update_branding(req: BrandingIn, authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing token")
    try:
        payload = jwt.decode(authorization.split(" ")[1], JWT_SECRET, algorithms=[JWT_ALGO])
    except:
        raise HTTPException(401, "Invalid token")
    await db.agents.update_one(
        {"email": payload["sub"]},
        {"$set": {"branding": req.model_dump(), "brokerage": req.brokerage, "name": req.agent_name}}
    )
    return {"ok": True}


# ══════════════ ACCOUNT / TIER ENDPOINTS ══════════════
def _get_agent_from_token(authorization):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Missing token")
    try:
        payload = jwt.decode(authorization.split(" ")[1], JWT_SECRET, algorithms=[JWT_ALGO])
    except:
        raise HTTPException(401, "Invalid token")
    return payload["sub"]

@api_router.get("/account/status")
async def account_status(authorization: str = Header(None)):
    email = _get_agent_from_token(authorization)
    agent = await db.agents.find_one({"email": email})
    if not agent: raise HTTPException(404, "Agent not found")
    return {
        "tier": agent.get("tier", "free"),
        "content_packs_used": agent.get("content_packs_used", 0),
        "content_packs_limit": 999 if agent.get("tier") == "pro" else 1,
        "can_generate": agent.get("tier") == "pro" or agent.get("content_packs_used", 0) < 1,
        "can_download_pdf": agent.get("tier") == "pro",
    }

@api_router.post("/account/upgrade")
async def upgrade_account(authorization: str = Header(None)):
    email = _get_agent_from_token(authorization)
    await db.agents.update_one({"email": email}, {"$set": {"tier": "pro"}})
    return {"tier": "pro", "message": "Upgraded to Pro!"}

@api_router.post("/account/create-checkout")
async def create_checkout_session(authorization: str = Header(None)):
    """Create a Stripe checkout session for Pro upgrade, with agent email attached."""
    if not STRIPE_API_KEY:
        raise HTTPException(500, "Stripe not configured")
    email = _get_agent_from_token(authorization)
    frontend_url = os.environ.get("FRONTEND_URL", "https://listworks.pro")
    try:
        session = await asyncio.to_thread(
            stripe_sdk.checkout.Session.create,
            success_url=f"{frontend_url}/dashboard?upgrade=success",
            cancel_url=f"{frontend_url}/dashboard",
            mode="subscription",
            line_items=[{"price": "price_1QhqLlP39YDnKXkS0BcYQr2A", "quantity": 1}],
            customer_email=email,
            metadata={"agent_email": email},
        )
        return {"url": session.url}
    except Exception as e:
        logger.error(f"Stripe checkout creation failed: {e}")
        raise HTTPException(500, "Failed to create checkout session")

@api_router.post("/account/use-content-pack")
async def use_content_pack(authorization: str = Header(None)):
    email = _get_agent_from_token(authorization)
    agent = await db.agents.find_one({"email": email})
    if agent.get("tier") != "pro":
        used = agent.get("content_packs_used", 0)
        limit = 1
        if used >= limit:
            raise HTTPException(402, "Free limit reached. Upgrade to Pro.")
        await db.agents.update_one({"email": email}, {"$inc": {"content_packs_used": 1}})
    return {"ok": True}


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

    # Run all three DB lookups in parallel — they are independent of each other
    pro, cdoc, free_used = await asyncio.gather(
        db.entitlements.find_one(
            {"lw_session_id": session_id, "kind": {"$in": ["pro", "lifetime"]}}, {"_id": 0}
        ),
        db.credits.find_one({"lw_session_id": session_id}, {"_id": 0}),
        db.listings.count_documents({"session_id": session_id}),
    )
    is_pro = bool(pro)
    credits = int((cdoc or {}).get("balance", 0))
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
async def affiliate_stats(ref: str, x_admin_secret: str = Header(default="")):
    """Protected dashboard for an affiliate. Requires X-Admin-Secret header.
    Format: GET /api/affiliate/mike → totals + recent referred sales.
    """
    if not ADMIN_SECRET or x_admin_secret != ADMIN_SECRET:
        raise HTTPException(403, "Forbidden")
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
        await send_email(to=email, subject=f"You are a ListWorks PRO Affiliate, {name}!", body=body)
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

    twitter_url = f"https://twitter.com/intent/tweet?text={urllib.parse.quote(copy, safe='')}"
    fb_url = f"https://www.facebook.com/sharer/sharer.php?u={urllib.parse.quote(link, safe='')}"
    li_url = f"https://www.linkedin.com/sharing/share-offsite/?url={urllib.parse.quote(link, safe='')}"

    return {
        "copy": copy,
        "platforms": {
            "twitter": twitter_url,
            "facebook": fb_url,
            "linkedin": li_url,
            "text": None,
        },
    }


# ============== REFERRAL PROGRAM (refer 3 → free Pro month) ==============
REFERRAL_THRESHOLD = 3


def _referral_code_for_session(session_id: str) -> str:
    # Deterministic short code derived from session_id so same session always gets same code
    import hashlib
    return "lw-" + hashlib.sha256(session_id.encode()).hexdigest()[:8]


@api_router.get("/referral/link/{session_id}")
async def get_referral_link(session_id: str):
    """Get or create a referral link for this session. Idempotent."""
    if not session_id or len(session_id) < 4:
        raise HTTPException(400, "Invalid session_id")

    code = _referral_code_for_session(session_id)
    doc = await db.referrals.find_one({"code": code}, {"_id": 0})

    if not doc:
        doc = {
            "code": code,
            "referrer_session": session_id,
            "count": 0,
            "granted": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.referrals.insert_one({**doc})

    frontend_url = os.environ.get("FRONTEND_URL", "https://listworks.pro")
    link = f"{frontend_url}/?ref={code}"
    return {
        "code": code,
        "link": link,
        "count": doc.get("count", 0),
        "granted": doc.get("granted", False),
        "threshold": REFERRAL_THRESHOLD,
    }


@api_router.post("/referral/activate")
async def activate_referral(req: RefClickIn):
    """Called when a NEW session lands with ?ref=REFERRAL_CODE.
    Increments the referrer's count and grants a free Pro month at threshold."""
    code = req.ref.strip().lower()
    if not code.startswith("lw-"):
        # Not a user referral code — might be affiliate code, skip silently
        return {"ok": False, "reason": "not_referral_code"}

    doc = await db.referrals.find_one({"code": code})
    if not doc:
        return {"ok": False, "reason": "code_not_found"}

    new_count = doc.get("count", 0) + 1
    granted = doc.get("granted", False)

    if new_count >= REFERRAL_THRESHOLD and not granted:
        granted = True
        referrer_session = doc["referrer_session"]
        await db.entitlements.insert_one({
            "lw_session_id": referrer_session,
            "kind": "pro",
            "source": "referral_reward",
            "granted_at": datetime.now(timezone.utc).isoformat(),
        })

    await db.referrals.update_one(
        {"code": code},
        {"$set": {"count": new_count, "granted": granted}},
    )

    return {"ok": True, "count": new_count, "granted": granted}


# ============== FAIR HOUSING ANALYSIS ==============
class FairHousingIn(BaseModel):
    text: str
    session_id: Optional[str] = None
    team_id: Optional[str] = None


class AcknowledgeIn(BaseModel):
    pass


@api_router.post("/analyze/fair-housing")
async def analyze_fair_housing(req: FairHousingIn, request: Request):
    if not req.text or len(req.text.strip()) < 20:
        raise HTTPException(400, "Text too short")
    if len(req.text) > 8000:
        raise HTTPException(400, "Text too long (max 8000 characters)")
    if await _is_ip_rate_limited(request, "fair-housing", limit=20, window=60):
        raise HTTPException(429, "Too many requests. Try again shortly.")
    violations = check_fair_housing_v3(req.text)
    risk = overall_risk(violations)
    grade = compliance_grade(violations)
    scan_id = str(uuid.uuid4())
    # Write audit log — every scan is recorded, no exceptions
    await db.compliance_logs.insert_one({
        "scan_id": scan_id,
        "session_id": req.session_id,
        "team_id": req.team_id,
        "listing_text": req.text,
        "violations": violations,
        "overall_risk": risk,
        "grade": grade,
        "agent_acknowledged": False,
        "acknowledged_at": None,
        "scanned_at": datetime.now(timezone.utc).isoformat(),
    })
    return {
        "scan_id": scan_id,
        "violations": violations,
        "total": len(violations),
        "clean": len(violations) == 0,
        "overall_risk": risk,
        "grade": grade,
    }


@api_router.post("/compliance/acknowledge/{scan_id}")
async def acknowledge_compliance(scan_id: str):
    result = await db.compliance_logs.update_one(
        {"scan_id": scan_id},
        {"$set": {"agent_acknowledged": True, "acknowledged_at": datetime.now(timezone.utc).isoformat()}},
    )
    if result.matched_count == 0:
        raise HTTPException(404, "Scan not found")
    return {"acknowledged": True, "scan_id": scan_id}






# ============== COMPLIANCE PDF EXPORT ==============
@api_router.get("/compliance/pdf/{scan_id}")
async def compliance_pdf(scan_id: str):
    """Generate downloadable compliance report PDF for E&O documentation."""
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    import tempfile

    doc_data = await db.compliance_logs.find_one({"scan_id": scan_id}, {"_id": 0})
    if not doc_data:
        raise HTTPException(404, "Scan not found")

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    tmp.close()

    doc = SimpleDocTemplate(tmp.name, pagesize=letter,
                            leftMargin=0.75*inch, rightMargin=0.75*inch,
                            topMargin=0.75*inch, bottomMargin=0.75*inch)
    styles = getSampleStyleSheet()
    story = []

    # Header
    header_style = ParagraphStyle("header", fontSize=18, fontName="Helvetica-Bold", spaceAfter=4)
    sub_style = ParagraphStyle("sub", fontSize=10, fontName="Helvetica", textColor=colors.HexColor("#666666"), spaceAfter=16)
    story.append(Paragraph("ListWorks PRO — Compliance Report", header_style))
    story.append(Paragraph("Fair Housing E&amp;O Documentation", sub_style))

    # Meta
    meta_data = [
        ["Scan ID:", scan_id],
        ["Scanned:", doc_data.get("scanned_at", "")[:19].replace("T", " ")],
        ["Overall Risk:", doc_data.get("overall_risk", "CLEAN")],
        ["Grade:", doc_data.get("grade", "A")],
        ["Acknowledged:", "Yes" if doc_data.get("agent_acknowledged") else "No"],
    ]
    meta_table = Table(meta_data, colWidths=[1.5*inch, 5*inch])
    meta_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    # Listing excerpt
    story.append(Paragraph("<b>Listing Text Scanned:</b>", styles["Normal"]))
    excerpt = doc_data.get("listing_text", "")[:500]
    if len(doc_data.get("listing_text", "")) > 500:
        excerpt += "..."
    story.append(Paragraph(excerpt, ParagraphStyle("excerpt", fontSize=9, leftIndent=12, spaceAfter=12)))

    # Violations table
    violations = doc_data.get("violations", [])
    story.append(Paragraph(f"<b>Violations Found: {len(violations)}</b>", styles["Normal"]))
    story.append(Spacer(1, 6))

    if violations:
        risk_colors = {"CRITICAL": "#CC0000", "HIGH": "#EF4444", "MEDIUM": "#F59E0B", "LOW": "#EAB308"}
        for v in violations:
            risk_color = colors.HexColor(risk_colors.get(v["risk"], "#666666"))
            v_data = [
                [Paragraph(f'<font color="#{risk_colors.get(v["risk"],"666666")[1:]}"><b>{v["risk"]}</b></font>',
                           ParagraphStyle("risk", fontSize=9)),
                 Paragraph(f'<b>{v["rule"]}</b>', ParagraphStyle("rule", fontSize=9))],
                ["Phrase:", v.get("phrase", "")],
                ["Citation:", v.get("hud_citation", "")],
                ["Legal basis:", v.get("legal_basis", "")],
                ["Recommended fix:", v.get("fix", "")],
            ]
            v_table = Table(v_data, colWidths=[1.3*inch, 5.2*inch])
            v_table.setStyle(TableStyle([
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F5F5F5")),
            ]))
            story.append(v_table)
            story.append(Spacer(1, 6))
    else:
        story.append(Paragraph("No violations detected. Listing passed Fair Housing compliance scan.", styles["Normal"]))

    # Footer
    story.append(Spacer(1, 20))
    footer_style = ParagraphStyle("footer", fontSize=8, textColor=colors.HexColor("#999999"))
    story.append(Paragraph("This report was generated by ListWorks PRO for E&amp;O insurance documentation purposes. "
                           "It does not constitute legal advice. Consult a licensed real estate attorney for questions "
                           "about Fair Housing compliance.", footer_style))

    doc.build(story)
    return FileResponse(tmp.name, media_type="application/pdf",
                        filename=f"listworks-compliance-{scan_id[:8]}.pdf",
                        headers={"Content-Disposition": f"attachment; filename=listworks-compliance-{scan_id[:8]}.pdf"})

# ============== COLORADO AI ACT COMPLIANCE ==============
class COActDisclosureIn(BaseModel):
    listing_text: str
    agent_name: str
    brokerage_name: str
    property_address: str


@api_router.post("/compliance/co-act-disclosure")
async def co_act_disclosure(req: COActDisclosureIn):
    """Generate Colorado AI Act (SB 205) disclosure statement for an AI-generated listing."""
    system = """You are a real estate compliance expert. Generate a Colorado AI Act (SB 24-205) 
disclosure statement for an AI-generated property listing. The disclosure must:
1. State that artificial intelligence was used to generate the listing description
2. Name the AI tool used (ListWorks PRO)
3. Confirm the licensed agent reviewed and approved the content
4. Include the agent name, brokerage, and property address
5. Be concise (2-3 sentences), professional, and legally appropriate
Return only the disclosure text, no extra commentary."""
    user = f"""Agent: {req.agent_name}
Brokerage: {req.brokerage_name}
Property: {req.property_address}
Generate the CO AI Act disclosure statement."""
    disclosure = await call_openrouter(system, user, model="openai/gpt-4o-mini")
    return {"disclosure_text": disclosure.strip()}

# ============== COLORADO AI ACT SCANNER ==============
class COActCheckIn(BaseModel):
    text: str
    agent_name: str = ""
    human_reviewed: bool = True
    session_id: str = ""


@api_router.post("/compliance/co-act")
async def check_co_act_compliance(req: COActCheckIn):
    """Scan listing copy for Colorado SB 24-205 (AI Act) compliance."""
    result = check_co_ai_act(req.text, {
        "agent_name": req.agent_name,
        "human_reviewed": req.human_reviewed,
    })
    scan_id = req.session_id or str(uuid.uuid4())
    await db.co_act_scans.insert_one({
        "scan_id": scan_id,
        "scanned_at": datetime.now(timezone.utc).isoformat(),
        "listing_text": req.text,
        "agent_name": req.agent_name,
        **result,
    })
    return {"scan_id": scan_id, **result}


@api_router.get("/compliance/co-act/pdf/{scan_id}")
async def co_act_pdf(scan_id: str):
    """Generate a Colorado AI Act compliance certificate PDF."""
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
    import tempfile

    doc_data = await db.co_act_scans.find_one({"scan_id": scan_id}, {"_id": 0})
    if not doc_data:
        raise HTTPException(404, "CO Act scan not found")

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    tmp.close()

    doc = SimpleDocTemplate(tmp.name, pagesize=letter,
                            leftMargin=0.75*inch, rightMargin=0.75*inch,
                            topMargin=0.75*inch, bottomMargin=0.75*inch)
    styles = getSampleStyleSheet()
    story = []

    grade = doc_data.get("grade", "NON_COMPLIANT")
    grade_color = "#16a34a" if grade == "COMPLIANT" else "#dc2626"

    header_style = ParagraphStyle("header", fontSize=18, fontName="Helvetica-Bold", spaceAfter=4)
    sub_style = ParagraphStyle("sub", fontSize=10, fontName="Helvetica",
                               textColor=colors.HexColor("#666666"), spaceAfter=16)
    story.append(Paragraph("ListWorks PRO", header_style))
    story.append(Paragraph("Colorado AI Act Compliance Record — SB 24-205", sub_style))

    grade_style = ParagraphStyle("grade", fontSize=14, fontName="Helvetica-Bold",
                                 textColor=colors.HexColor(grade_color), spaceAfter=12)
    story.append(Paragraph(f"Status: {grade}", grade_style))

    meta_data = [
        ["Scan ID:", scan_id[:16] + "..."],
        ["Date / Time:", doc_data.get("scanned_at", "")[:19].replace("T", " ") + " UTC"],
        ["Agent:", doc_data.get("agent_name", "—") or "—"],
        ["Human Reviewed:", "Yes" if doc_data.get("human_reviewed", True) else "No"],
        ["AI Disclosure Found:", "Yes" if doc_data.get("disclosure_present") else "No"],
    ]
    meta_table = Table(meta_data, colWidths=[1.8*inch, 4.7*inch])
    meta_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 12))

    story.append(Paragraph("<b>Listing Excerpt Scanned:</b>", styles["Normal"]))
    snippet = doc_data.get("listing_text", "")[:200]
    if len(doc_data.get("listing_text", "")) > 200:
        snippet += "..."
    story.append(Paragraph(snippet, ParagraphStyle("excerpt", fontSize=9, leftIndent=12, spaceAfter=12)))

    story.append(Paragraph("<b>Suggested Disclosure Statement:</b>", styles["Normal"]))
    story.append(Paragraph(
        doc_data.get("suggested_disclosure", ""),
        ParagraphStyle("disclosure", fontSize=9, leftIndent=12, spaceAfter=12,
                       textColor=colors.HexColor("#1d4ed8"))
    ))

    violations = doc_data.get("violations", [])
    story.append(Paragraph(f"<b>Compliance Issues: {len(violations)}</b>", styles["Normal"]))
    story.append(Spacer(1, 6))
    if violations:
        sev_colors = {"CRITICAL": "#CC0000", "HIGH": "#EF4444", "MEDIUM": "#F59E0B"}
        for v in violations:
            color = sev_colors.get(v.get("severity", ""), "#666666")
            v_data = [
                [Paragraph(f'<font color="{color}"><b>{v.get("severity","")}</b></font>',
                           ParagraphStyle("sev", fontSize=9)),
                 Paragraph(f'<b>{v.get("rule","")}</b>', ParagraphStyle("rule", fontSize=9))],
                ["Detail:", v.get("explanation", "")],
            ]
            v_table = Table(v_data, colWidths=[1.3*inch, 5.2*inch])
            v_table.setStyle(TableStyle([
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
                ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#DDDDDD")),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F5F5F5")),
            ]))
            story.append(v_table)
            story.append(Spacer(1, 6))
    else:
        story.append(Paragraph("No compliance issues detected.", styles["Normal"]))

    story.append(Spacer(1, 20))
    footer_style = ParagraphStyle("footer", fontSize=8, textColor=colors.HexColor("#999999"))
    story.append(Paragraph(
        "Generated by ListWorks PRO | listworks.pro | Colorado SB 24-205 Compliance. "
        "This record is for E&amp;O documentation purposes. Not legal advice.",
        footer_style
    ))

    doc.build(story)
    return FileResponse(tmp.name, media_type="application/pdf",
                        filename=f"co-act-compliance-{scan_id[:8]}.pdf",
                        headers={"Content-Disposition": f"attachment; filename=co-act-compliance-{scan_id[:8]}.pdf"})


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

    async def _call_anthropic_voice(system_prompt: str, user_text: str) -> str:
        """Voice description uses a different format — keep Anthropic for now."""
        try:
            client = AsyncAnthropic(api_key=os.environ.get("EMERGENT_LLM_KEY", ""))
            resp = await client.messages.create(
                model="claude-sonnet-4-5-20250929",
                max_tokens=2048,
                system=system_prompt,
                messages=[{"role": "user", "content": user_text}],
            )
            return resp.content[0].text
        except Exception:
            # Fallback to OpenRouter
            return await call_openrouter(system_prompt, user_text, model="openai/gpt-4o")
    raw_text = await _call_anthropic_voice(VOICE_POLISH_SYSTEM, req.transcript.strip())
    try:
        data = json.loads(raw_text)
        raw_description = data.get("raw_description", raw_text)
    except Exception:
        raw_description = raw_text

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


# ============== WAITLIST ==============
class WaitlistJoin(BaseModel):
    name: str
    email: str


@api_router.post("/waitlist/join")
async def waitlist_join(req: WaitlistJoin):
    name = req.name.strip()[:100]
    email = req.email.strip().lower()[:254]
    if "@" not in email or "." not in email:
        raise HTTPException(400, "Invalid email")
    existing = await db.waitlist.find_one({"email": email})
    if existing:
        return {"ok": True, "message": "Already on the list!"}
    await db.waitlist.insert_one({
        "name": name,
        "email": email,
        "joined_at": datetime.now(timezone.utc).isoformat(),
        "source": "landing",
    })
    return {"ok": True, "message": "You're on the list!"}


# ============== ROUTES ==============
@api_router.get("/")
async def root():
    return {"app": "ListWorks PRO", "status": "live", "engine": "Claude Opus 4.8"}


@api_router.post("/rewrite", response_model=RewriteOutput)
async def rewrite_listing(req: RewriteRequest, request: Request):
    if len(req.raw_listing.strip()) < 10:
        raise HTTPException(400, "Listing too short. Add at least a sentence.")
    if len(req.raw_listing) > 8000:
        raise HTTPException(400, "Listing description too long (max 8000 characters)")

    # Bot detection
    is_bot, reason = _is_bot_request(request, req.session_id or "")
    if is_bot:
        raise HTTPException(403, f"Request blocked: {reason}")

    # Rate limiting — session layer (20/min) + IP layer (40/min backstop)
    if await _is_rate_limited(req.session_id or "", "rewrite", 20, 60):
        raise HTTPException(429, "Too many requests. Slow down.")
    if await _is_ip_rate_limited(request, "rewrite", limit=40, window=60):
        raise HTTPException(429, "Too many requests from this IP. Slow down.")

    # Hard 3-trial limit for free users (MongoDB-persisted, IP-backed)
    client_ip = _get_client_ip(request)
    allowed, remaining = await _check_free_trial(req.session_id or "", client_ip)
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

    # Auto-inject brand voice if agent has one saved
    if req.session_id and not req.brand_voice:
        bv_doc = await db.brand_voices.find_one({"session_id": req.session_id}, {"_id": 0, "session_id": 0, "updated_at": 0})
        if bv_doc:
            req = req.model_copy(update={"brand_voice": bv_doc})

    outputs = await call_rewrite_llm(req)
    listing_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

    # Scan AI output for Fair Housing violations — system prompt forbids them but verify
    _scan_text = " ".join(filter(None, [
        outputs.get("mls", ""),
        outputs.get("instagram", ""),
        outputs.get("facebook", ""),
        outputs.get("email", ""),
    ]))
    _output_violations = check_fair_housing_v3(_scan_text)
    output_compliance = {
        "clean": len(_output_violations) == 0,
        "grade": compliance_grade(_output_violations),
        "risk": overall_risk(_output_violations),
        "violations": _output_violations,
    }
    if not output_compliance["clean"]:
        logging.warning(
            f"[compliance] Output violations detected for session {req.session_id}: "
            f"{[v['rule'] for v in _output_violations]}"
        )

    # Record free trial usage (runs after generation to avoid race)
    await _record_free_trial(req.session_id or "", client_ip)
    _, updated_remaining = await _check_free_trial(req.session_id or "", client_ip)
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
        "virtual_tour_url": req.virtual_tour_url,
        "created_at": created_at,
        "output_compliance": output_compliance,
        **outputs,
    }
    await db.listings.insert_one({k: v for k, v in doc.items() if v is not None})

    return {
        **RewriteOutput(
            id=listing_id,
            tone=req.tone,
            raw_listing=req.raw_listing,
            virtual_tour_url=req.virtual_tour_url,
            created_at=created_at,
            output_compliance=output_compliance,
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
        allowed, _ = await _check_free_trial(first_session)
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

    sem = asyncio.Semaphore(3)  # max 3 concurrent LLM calls

    async def _process_one(listing_req):
        async with sem:
            return await call_rewrite_llm(listing_req)

    tasks = [_process_one(lr) for lr in req.listings]
    settled = await asyncio.gather(*tasks, return_exceptions=True)

    for listing_req, outcome in zip(req.listings, settled):
        if isinstance(outcome, Exception):
            logging.exception("Batch item failed: %s", outcome)
            failed_count += 1
            continue
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
            "virtual_tour_url": getattr(listing_req, "virtual_tour_url", None),
            "created_at": created_at,
            **outcome,
        }
        await db.listings.insert_one({k: v for k, v in doc.items() if v is not None})
        results.append(RewriteOutput(
            id=listing_id,
            tone=listing_req.tone,
            raw_listing=listing_req.raw_listing,
            virtual_tour_url=getattr(listing_req, "virtual_tour_url", None),
            created_at=created_at,
            **outcome,
        ))
        success_count += 1

    return BatchRewriteResponse(results=results, success_count=success_count, failed_count=failed_count)


# ══════════════ CONTENT PACK ENDPOINTS ══════════════
CONTENT_PACK_DIR = "/root/listworks-outreach/content-packs"

@api_router.get("/content/packs")
async def list_content_packs():
    """List all generated content packs."""
    import glob as g
    packs = []
    for d in g.glob(f"{CONTENT_PACK_DIR}/*/"):
        lead_id = d.strip("/").split("/")[-1]
        json_path = f"{d}content-pack.json"
        if os.path.exists(json_path):
            try:
                with open(json_path) as f:
                    data = json.load(f)
                packs.append({"leadId": lead_id, "name": data.get("leadName","?"), "city": data.get("leadCity",""), "generatedAt": data.get("generatedAt",""),"hasMarketReport": os.path.exists(f"{d}market-report.json")})
            except: pass
    return {"packs": sorted(packs, key=lambda p: p.get("generatedAt",""), reverse=True)}

@api_router.get("/content/pack/{lead_id}")
async def get_content_pack(lead_id: str):
    """Get full content pack for a lead."""
    path = f"{CONTENT_PACK_DIR}/{lead_id}/content-pack.json"
    if not os.path.exists(path):
        raise HTTPException(404, "No content pack found")
    with open(path) as f:
        return json.load(f)

@api_router.get("/content/{lead_id}/{file_name}")
async def get_content_file(lead_id: str, file_name: str):
    """Get specific file from a content pack (e.g. reel-script.txt, market-report-post.txt)."""
    path = f"{CONTENT_PACK_DIR}/{lead_id}/{file_name}"
    if not os.path.exists(path):
        raise HTTPException(404, "File not found")
    from fastapi.responses import PlainTextResponse
    with open(path) as f:
        return PlainTextResponse(f.read())

@api_router.get("/content/{lead_id}/market-report")
async def get_market_report(lead_id: str):
    """Get market report for a lead."""
    path = f"{CONTENT_PACK_DIR}/{lead_id}/market-report.json"
    if not os.path.exists(path):
        raise HTTPException(404, "No market report")
    with open(path) as f:
        return json.load(f)

class ContentGenerateIn(BaseModel):
    first_name: str = ""
    city: str = ""
    price: str = ""
    features: str = ""
    email: str = ""

@api_router.post("/content/generate")
async def generate_content_for_lead(req: ContentGenerateIn, authorization: str = Header(None)):
    """Generate a content pack on demand for a lead. Gated: free users get 1/month."""
    email = _get_agent_from_token(authorization)
    agent = await db.agents.find_one({"email": email})
    if agent.get("tier") != "pro" and agent.get("content_packs_used", 0) >= 1:
        raise HTTPException(402, "Free limit reached. Upgrade to Pro for unlimited generation.")
    if agent.get("tier") != "pro":
        await db.agents.update_one({"email": email}, {"$inc": {"content_packs_used": 1}})

    import subprocess, tempfile, random
    # Build a mock lead and run the generator
    features_list = [f.strip() for f in req.features.split(",") if f.strip()] or ["natural light", "updated finishes", "open layout"]
    lead = {"id": random.randint(1000, 9999), "first_name": req.first_name or "Client", "city": req.city or "Your City", "email": req.email or "client@example.com"}
    listing = {"price": req.price or "$500,000", "features": features_list}

    js_code = f"""
    import {{ generateAll }} from '/root/listworks-outreach/templates/social-content.js';
    import {{ generateWeeklyPlan }} from '/root/listworks-outreach/templates/content-calendar.js';
    const social = generateAll({json.dumps(lead)}, {json.dumps(listing)});
    const cal = generateWeeklyPlan({json.dumps(lead)});
    process.stdout.write(JSON.stringify({{ social, cal }}));
    """
    result = subprocess.run(["node", "--input-type=module", "-r", "dotenv/config", "-e", js_code],
                          capture_output=True, text=True, timeout=30,
                          cwd="/root/listworks-outreach")
    if result.returncode != 0:
        raise HTTPException(500, f"Generator failed: {result.stderr}")
    return json.loads(result.stdout)


# ══════════════ CONTRACTS & FORMS ENDPOINTS ══════════════
from contracts_engine import FORMS_CATALOG, get_form, get_forms_by_category, get_categories, generate_fillable_pdf, generate_form_preview

@api_router.get("/forms")
async def list_forms(category: str = None):
    """List all available contract forms."""
    if category:
        return {"forms": get_forms_by_category(category)}
    return {"forms": FORMS_CATALOG, "categories": get_categories()}

@api_router.get("/forms/{form_id}")
async def get_form_detail(form_id: str):
    """Get full form definition with field explanations."""
    form = get_form(form_id)
    if not form:
        raise HTTPException(404, "Form not found")
    return form

@api_router.post("/forms/{form_id}/pdf")
async def generate_form_pdf(form_id: str, req: Request, authorization: str = Header(None)):
    """Generate a branded fillable PDF for a contract form. Pro only."""
    email = _get_agent_from_token(authorization)
    agent = await db.agents.find_one({"email": email})
    if agent.get("tier") != "pro":
        raise HTTPException(402, "PDF download requires Pro. Upgrade at listworks.pro/dashboard")

    form = get_form(form_id)
    if not form:
        raise HTTPException(404, "Form not found")
    
    body = await req.json() if req.headers.get("content-type") == "application/json" else {}
    field_values = body.get("values", {})
    brand = body.get("brand", {"agent_name": "", "brokerage": "ListWorks PRO"})
    
    pdf_bytes = generate_fillable_pdf(form_id, field_values, brand)
    if not pdf_bytes:
        raise HTTPException(500, "PDF generation failed (reportlab not available)")
    
    from fastapi.responses import Response
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{form_id}.pdf"'}
    )

@api_router.get("/forms/{form_id}/preview")
async def preview_form(form_id: str):
    """HTML preview of a form with field explanations."""
    form = get_form(form_id)
    if not form:
        raise HTTPException(404, "Form not found")
    from fastapi.responses import HTMLResponse
    return HTMLResponse(generate_form_preview(form_id))


@api_router.get("/content-packs")
async def content_packs_page():
    """Serve the content packs dashboard page."""
    with open(ROOT_DIR / "static" / "packs.html") as f:
        return HTMLResponse(f.read())


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


@api_router.get("/dashboard")
async def serve_dashboard():
    """Main agent dashboard — content packs + contracts + generator."""
    with open(ROOT_DIR / "static" / "dashboard.html") as f:
        return HTMLResponse(f.read())


@api_router.delete("/templates/{session_id}/{template_id}")
async def delete_template(session_id: str, template_id: str):
    await db.templates.delete_one({"id": template_id, "session_id": session_id})
    return {"deleted": True}


class EmailCaptureIn(BaseModel):
    email: str
    session_id: Optional[str] = None


@api_router.post("/capture-email")
async def capture_email(req: EmailCaptureIn):
    email = req.email.strip().lower()
    session_id = req.session_id or ""

    existing = await db.leads.find_one({"email": email})
    if not existing:
        doc = {
            "email": email,
            "session_id": session_id,
            "source": "trial_gate",
            "captured_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.leads.insert_one(doc)
        try:
            asyncio.create_task(send_free_trial_drip(email))
        except Exception:
            pass

    # Grant 3 bonus rewrites by resetting session usage
    if session_id and session_id in _free_rewrites_per_session:
        current = _free_rewrites_per_session[session_id]
        _free_rewrites_per_session[session_id] = max(0, current - 3)

    return {"captured": True, "bonus_rewrites": 3}


@api_router.post("/expired-scripts", response_model=ExpiredListingScripts)
async def get_expired_scripts(req: ExpiredListingRequest):
    user_prompt = f"""PROPERTY: {req.address}

Now produce the JSON object with all 4 scripts. JSON only."""

    raw = await call_openrouter(EXPIRED_LISTING_SYSTEM, user_prompt)
    cleaned = _strip_json(raw)
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


LISTING_EXTRACT_SYSTEM = """You extract structured property data from real estate listing page content.
Return ONLY a valid JSON object with these exact fields (use null for any field not found):
{
  "address": "Full street address including city, state, zip",
  "price": "$XXX,XXX",
  "beds": "3",
  "baths": "2",
  "sqft": "1,850",
  "year_built": "1998",
  "property_type": "Single Family",
  "lot_size": "0.25 acres",
  "parking": "2-car garage",
  "description": "The full MLS or public remarks description text, verbatim if possible"
}
Rules: Extract only what is explicitly present in the content. No guessing or fabrication. JSON only."""


async def _scrape_listing_url(url: str) -> str:
    """Scrape a listing URL with Firecrawl, fall back to httpx+basic parse."""
    if FIRECRAWL_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=30.0) as hc:
                resp = await hc.post(
                    "https://api.firecrawl.dev/v1/scrape",
                    headers={"Authorization": f"Bearer {FIRECRAWL_API_KEY}", "Content-Type": "application/json"},
                    json={"url": url, "formats": ["markdown"], "onlyMainContent": True},
                )
                if resp.status_code == 200:
                    result = resp.json()
                    md = result.get("data", {}).get("markdown", "")
                    if md and len(md) > 100:
                        return md[:8000]
        except Exception as e:
            logging.warning(f"Firecrawl scrape failed: {e}")

    # Fallback: raw httpx fetch, strip tags
    try:
        async with httpx.AsyncClient(timeout=20.0, headers={"User-Agent": "Mozilla/5.0 (compatible; ListWorksPRO/1.0)"}) as hc:
            resp = await hc.get(url)
            text = resp.text
            # Crude strip — remove scripts/styles, keep visible text
            import re as _re
            text = _re.sub(r"<script[^>]*>.*?</script>", " ", text, flags=_re.DOTALL | _re.IGNORECASE)
            text = _re.sub(r"<style[^>]*>.*?</style>", " ", text, flags=_re.DOTALL | _re.IGNORECASE)
            text = _re.sub(r"<[^>]+>", " ", text)
            text = _re.sub(r"\s+", " ", text).strip()
            return text[:8000]
    except Exception as e:
        raise HTTPException(502, f"Could not fetch listing page: {str(e)[:120]}")


class ListingImportRequest(BaseModel):
    url: str


SUPPORTED_LISTING_DOMAINS = [
    "redfin.com", "zillow.com", "realtor.com", "trulia.com",
    "homes.com", "compass.com", "coldwellbanker.com", "century21.com",
    "kw.com", "bhgrealestate.com", "homesnap.com", "movoto.com",
]


@api_router.post("/import/listing", response_model=RedfinPropertyData)
async def import_listing(req: ListingImportRequest):
    url = req.url.strip()
    if not url.startswith("http"):
        raise HTTPException(400, "Please provide a full URL starting with http:// or https://")

    page_content = await _scrape_listing_url(url)

    user_prompt = f"Extract all property data from this listing page content:\n\n{page_content}\n\nJSON only."
    raw = await call_openrouter(LISTING_EXTRACT_SYSTEM, user_prompt, model="openai/gpt-4o-mini")
    cleaned = _strip_json(raw)
    try:
        data = json.loads(cleaned)
    except Exception as e:
        logging.exception("JSON parse failed for listing import")
        raise HTTPException(500, f"Failed to extract listing data: {str(e)[:120]}")

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


# Keep legacy endpoint alive so existing RedfinImport.jsx calls still work
@api_router.post("/import/redfin", response_model=RedfinPropertyData)
async def import_redfin(req: RedfinImportRequest):
    return await import_listing(ListingImportRequest(url=req.redfin_url))


ADDRESS_LOOKUP_SYSTEM = """You extract real estate property data from web search snippets.
Return ONLY a JSON object with these fields (use null for any field not found):
{
  "price": "$XXX,XXX",
  "beds": "3",
  "baths": "2",
  "sqft": "1,850",
  "year_built": "1998",
  "property_type": "Single Family",
  "lot_size": "0.25 acres"
}
Rules: Extract only what is explicitly stated. No guessing. Numbers only for beds/baths/sqft. JSON only."""


@api_router.post("/lookup-address", response_model=RedfinPropertyData)
async def lookup_address(req: AddressLookupRequest, request: Request):
    if await _is_ip_rate_limited(request, "lookup-address", limit=10, window=60):
        raise HTTPException(429, "Too many requests. Slow down.")

    address = req.address.strip()
    if len(address) < 5:
        raise HTTPException(400, "Please enter a full street address.")

    tavily_key = os.environ.get("TAVILY_API_KEY", "")
    if not tavily_key:
        raise HTTPException(503, "Address lookup not available — Tavily not configured.")

    async with httpx.AsyncClient(timeout=15.0) as c:
        r = await c.post(
            "https://api.tavily.com/search",
            json={
                "api_key": tavily_key,
                "query": f"{address} bedrooms bathrooms square feet listing",
                "max_results": 5,
                "search_depth": "basic",
                "include_domains": ["zillow.com", "redfin.com", "realtor.com", "trulia.com"],
            },
        )
        if r.status_code != 200:
            raise HTTPException(502, "Address lookup failed. Please fill in details manually.")
        results = r.json().get("results", [])

    if not results:
        raise HTTPException(404, "No public listing data found for this address. Please fill in details manually.")

    snippets = "\n\n".join(
        f"Source: {res.get('url', '')}\n{res.get('content', '')[:500]}"
        for res in results[:4]
    )
    user_prompt = f"Address: {address}\n\nSearch results:\n{snippets}\n\nExtract property data. JSON only."

    raw = await call_openrouter(ADDRESS_LOOKUP_SYSTEM, user_prompt, model="openai/gpt-4o-mini")
    cleaned = _strip_json(raw)
    try:
        data = json.loads(cleaned)
    except Exception:
        raise HTTPException(500, "Could not parse property data. Please fill in details manually.")

    return RedfinPropertyData(
        address=address,
        price=data.get("price"),
        beds=data.get("beds"),
        baths=data.get("baths"),
        sqft=data.get("sqft"),
        year_built=data.get("year_built"),
        property_type=data.get("property_type"),
        lot_size=data.get("lot_size"),
    )


@api_router.get("/share/{listing_id}")
async def get_shared_listing(listing_id: str):
    """Public share endpoint — returns the before/after for a listing.
    Anyone can view via /share/{id} on the frontend (no auth)."""
    listing = await db.listings.find_one({"id": listing_id})
    if not listing:
        raise HTTPException(404, "Listing not found")
    listing.pop("_id", None)
    session_id = listing.pop("session_id", None)
    # Track shares for analytics
    await db.share_views.insert_one({
        "listing_id": listing_id,
        "viewed_at": datetime.now(timezone.utc).isoformat(),
    })
    # Attach agent info if available
    agent_info = None
    if session_id:
        profile = await db.agent_profiles.find_one({"session_id": session_id})
        if profile:
            profile.pop("_id", None)
            agent_info = {
                "name": profile.get("name"),
                "slug": profile.get("slug"),
                "brokerage": profile.get("brokerage"),
                "photo_url": profile.get("photo_url"),
                "phone": profile.get("phone"),
                "email": profile.get("email"),
                "public_url": profile.get("public_url"),
            }
    listing["agent"] = agent_info
    return listing


@api_router.post("/analyze-photo", response_model=PhotoAnalyzeResponse)
async def analyze_photo(req: PhotoAnalyzeRequest, request: Request):
    if await _is_ip_rate_limited(request, "analyze-photo", limit=15, window=60):
        raise HTTPException(429, "Too many requests. Slow down.")

    prompt = (
        "You analyze real estate property photos. "
        "Return STRICT JSON: {\"features\":[8 short property features detected, "
        "e.g. 'marble counters','hardwood floors','vaulted ceilings'],"
        "\"style\":\"one short style label like 'Modern Farmhouse'\","
        "\"suggested_headline\":\"a single 10-word emotional headline for this property\"}"
    )
    img_data = req.image_base64
    if img_data.startswith("data:"):
        img_data = img_data.split(",", 1)[1]

    raw = await call_openrouter(prompt, "Analyze this real estate photo. Return JSON only.", model="openai/gpt-4o")
    cleaned = _strip_json(raw)
    try:
        data = json.loads(cleaned)
    except Exception:
        raise HTTPException(500, "Photo analysis failed to parse")

    return PhotoAnalyzeResponse(
        features=[f.strip() for f in data.get("features", []) if isinstance(f, str)][:8],
        style=str(data.get("style", "")).strip(),
        suggested_headline=str(data.get("suggested_headline", "")).strip(),
    )


# ===== Virtual Staging =====
STABILITY_API_KEY = os.environ.get("STABILITY_API_KEY", "")
STAGING_STYLES = {
    "modern": "Modern interior design with clean lines, neutral colors, contemporary furniture, bright natural lighting",
    "coastal": "Coastal/beach style with light blue and white tones, natural textures, airy curtains, casual elegant furniture",
    "luxury": "Luxury interior design with rich textures, statement lighting, premium furniture, sophisticated color palette, elegant decor",
    "midcentury": "Mid-century modern with warm wood tones, iconic furniture pieces, geometric patterns, organic shapes",
    "farmhouse": "Modern farmhouse style with shiplap accents, rustic-modern furniture, warm neutral palette, cozy inviting atmosphere",
    "minimalist": "Minimalist interior with clean spaces, minimal furniture, monochromatic palette, uncluttered zen atmosphere",
    "boho": "Bohemian style with layered textures, plants, eclectic decor, warm earthy tones, comfortable and artistic feel",
    "industrial": "Industrial loft style with exposed elements, metal accents, leather furniture, urban raw aesthetic",
}

class VirtualStageRequest(BaseModel):
    image_base64: str
    style: str = "modern"
    room_type: str = "living room"

@api_router.post("/virtual-stage")
async def virtual_stage(req: VirtualStageRequest, request: Request):
    if not STABILITY_API_KEY:
        raise HTTPException(503, "Virtual staging not configured")
    if req.style not in STAGING_STYLES:
        raise HTTPException(400, f"Invalid style. Choose from: {', '.join(STAGING_STYLES.keys())}")
    
    style_desc = STAGING_STYLES[req.style]
    prompt = f"A professionally staged {req.room_type} with {style_desc}. High-end real estate photography, natural lighting, wide angle lens, inviting atmosphere."
    negative = "empty room, cluttered, dirty, poorly lit, distorted, unnatural, cartoonish, low quality, blurry, watermark"

    img_data = req.image_base64
    if img_data.startswith("data:"):
        img_data = img_data.split(",", 1)[1]

    img_bytes = base64.b64decode(img_data)
    
    async with httpx.AsyncClient(timeout=60.0) as c:
        # Use img2img with the uploaded photo as base
        r = await c.post(
            "https://api.stability.ai/v2beta/stable-image/edit/search-and-replace",
            headers={"authorization": f"Bearer {STABILITY_API_KEY}", "accept": "application/json"},
            files={"image": ("input.png", img_bytes, "image/png")},
            data={
                "prompt": f"{style_desc}. High-end interior photography.",
                "select": "furniture, decor, walls, flooring, ceiling",
                "negative_prompt": negative,
                "output_format": "png",
            },
        )
        if r.status_code == 200:
            result = r.json()
            image_b64 = result["image"]
        else:
            # Fallback: use generate via core with guidance
            r2 = await c.post(
                "https://api.stability.ai/v2beta/stable-image/generate/sd3",
                headers={"authorization": f"Bearer {STABILITY_API_KEY}", "accept": "application/json"},
                files={"image": ("input.png", img_bytes, "image/png")},
                data={
                    "prompt": prompt,
                    "negative_prompt": negative,
                    "mode": "image-to-image",
                    "strength": 0.75,
                    "output_format": "png",
                },
            )
            if r2.status_code != 200:
                raise HTTPException(502, f"Staging generation failed")
            result = r2.json()
            image_b64 = result["image"]
    
    return {
        "image_base64": f"data:image/png;base64,{image_b64}",
        "style": req.style,
        "prompt": prompt,
    }

# ===== AI Advisor (chat) =====
ADVISOR_SYSTEM = """You are the ListWorks AI Coach — a senior real estate marketing
strategist with 20 years experience. You've trained thousands of agents. You give
concise, opinionated, actionable advice on listing copy, photos, video strategy,
buyer psychology, lead generation, open houses, scripts, and CRM strategy.

Keep responses under 200 words. Use plain text, short paragraphs, no markdown headers.
Be direct and opinionated — don't hedge. When the user shares listing copy, critique
it against the ListWorks framework: point to specific banned-word offenders,
missing FBF translations, weak hooks, and dead CTAs. Suggest exact rewrites.
When they ask about strategy, give specific tactics they can use today."""


@api_router.post("/advisor", response_model=AdvisorResponse)
async def advisor(req: AdvisorRequest, request: Request):
    if await _is_ip_rate_limited(request, "advisor", limit=20, window=60):
        raise HTTPException(429, "Too many requests. Slow down.")

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

    user_text = f"{history_text}\n\nUSER: {req.question}{context_msg}".strip()

    raw = await call_openrouter(ADVISOR_SYSTEM, user_text)
    reply = raw.strip()
    return AdvisorResponse(reply=reply)

# ===== CMA / Market Report =====
class CMARequest(BaseModel):
    address: str
    price: Optional[str] = None
    beds: Optional[str] = None
    baths: Optional[str] = None
    sqft: Optional[str] = None
    property_type: Optional[str] = None

CMA_SYSTEM = """You are a senior real estate CMA analyst. Generate a professional Comparative Market Analysis report.

Based on the comparable properties data provided, create a report with these sections:
1. **Subject Property Summary** — address, specs, estimated value
2. **Comparable Properties** — 3-5 comps with address, price, beds/baths/sqft, and days on market
3. **Market Analysis** — current trends, average days on market, price per sqft analysis
4. **Pricing Recommendation** — suggested list price range with rationale
5. **Market Positioning** — how this property compares to active listings

Rules:
- Be specific and data-driven. Use the actual comp data provided.
- If specific comp data is limited, explain what additional data would strengthen the analysis.
- Never give legal or appraisal advice — this is a market analysis tool.
- Format with clear section headers and clean HTML.

OUTPUT — STRICT JSON ONLY:
{
  "subject": { "address": "", "estimated_value": "", "confidence": "" },
  "comps": [{"address": "", "price": "", "beds": "", "baths": "", "sqft": "", "dom": "", "notes": ""}],
  "market_summary": "",
  "price_per_sqft_avg": "",
  "days_on_market_avg": "",
  "recommendation": "",
  "html_report": "<full HTML report with styling>"
}"""

@api_router.post("/cma/report")
async def cma_report(req: CMARequest, request: Request):
    if await _is_ip_rate_limited(request, "cma", limit=5, window=60):
        raise HTTPException(429, "Too many requests. Slow down.")
    address = req.address.strip()
    if len(address) < 5:
        raise HTTPException(400, "Enter a full street address.")
    tavily_key = os.environ.get("TAVILY_API_KEY", "")
    if not tavily_key:
        raise HTTPException(503, "CMA not available — Tavily not configured.")

    # Search for comps in the area
    queries = [
        f"sold homes near {address} last 6 months",
        f"comparable listings {address} real estate",
        f"similar homes for sale near {address}",
    ]
    all_results = []
    async with httpx.AsyncClient(timeout=20.0) as c:
        for query in queries:
            try:
                r = await c.post("https://api.tavily.com/search", json={
                    "api_key": tavily_key, "query": query, "max_results": 4, "search_depth": "basic",
                    "include_domains": ["zillow.com", "redfin.com", "realtor.com", "trulia.com"],
                })
                if r.status_code == 200:
                    all_results.extend(r.json().get("results", []))
            except: pass

    all_results = all_results[:10]
    if not all_results:
        raise HTTPException(404, "No comparable data found. Try a different address.")

    snippets = "\n\n".join(
        f"Source: {res.get('url', '')}\n{res.get('content', '')[:600]}"
        for res in all_results
    )
    subject_info = f"Address: {address}"
    if req.price: subject_info += f"\nList Price: {req.price}"
    if req.beds: subject_info += f"\nBeds: {req.beds}"
    if req.baths: subject_info += f"\nBaths: {req.baths}"
    if req.sqft: subject_info += f"\nSqFt: {req.sqft}"
    if req.property_type: subject_info += f"\nType: {req.property_type}"

    user_prompt = f"{subject_info}\n\nComparable properties data:\n{snippets}\n\nGenerate a professional CMA report as JSON."

    raw = await call_openrouter(CMA_SYSTEM, user_prompt, model="openai/gpt-4o-mini")
    cleaned = _strip_json(raw)
    try:
        data = json.loads(cleaned)
    except Exception:
        raise HTTPException(500, "Could not generate CMA report. Try again.")

    return data

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
    if await _is_ip_rate_limited(request, "checkout", limit=10, window=60):
        raise HTTPException(429, "Too many checkout attempts. Try again shortly.")
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

        # Fire drip emails — non-fatal: a failed email must never block credit grant
        try:
            await _trigger_drip_for_txn(stripe_session_id, txn)
        except Exception as drip_err:
            logger.exception("Drip/credit grant failed for %s: %s", stripe_session_id, drip_err)

    return {
        "status": cs_status,
        "payment_status": cs_payment_status,
        "amount_total": cs_amount_total,
        "currency": cs_currency,
        "metadata": cs_metadata,
        "package_kind": (txn or {}).get("package_kind"),
    }


@api_router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    if not STRIPE_API_KEY:
        raise HTTPException(500, "Stripe not configured")
    body = await request.body()
    sig = request.headers.get("Stripe-Signature", "")

    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
    if not webhook_secret:
        logger.error("STRIPE_WEBHOOK_SECRET not configured — refusing unsigned webhook")
        raise HTTPException(500, "Webhook secret not configured")
    try:
        evt = stripe_sdk.Webhook.construct_event(body, sig, webhook_secret)
    except Exception as e:
        logger.exception("Stripe webhook parse failed: %s", e)
        raise HTTPException(400, "Invalid webhook")

    # Safe access for both dict-style and typed Stripe SDK objects
    if isinstance(evt, dict):
        event_type = evt.get("type")
        raw_data = evt.get("data", {})
        data_object = raw_data.get("object", {}) if isinstance(raw_data, dict) else getattr(raw_data, "object", {}) or {}
    else:
        event_type = getattr(evt, "type", None)
        raw_data = getattr(evt, "data", None)
        if raw_data is None:
            data_object = {}
        elif isinstance(raw_data, dict):
            data_object = raw_data.get("object", {})
        else:
            data_object = getattr(raw_data, "object", None) or {}

    logger.info("Stripe webhook received: %s", event_type)

    # Only process checkout completion — acknowledge everything else immediately
    if event_type != "checkout.session.completed":
        return {"received": True}

    session_id = data_object.get("id") if isinstance(data_object, dict) else getattr(data_object, "id", None)
    payment_status = data_object.get("payment_status") if isinstance(data_object, dict) else getattr(data_object, "payment_status", None)

    if not session_id:
        logger.warning("checkout.session.completed missing session id")
        return {"received": True}

    try:
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
                        "package_id": txn.get("package_id"),
                        "stripe_session_id": session_id,
                        "granted_at": datetime.now(timezone.utc).isoformat(),
                    }},
                    upsert=True,
                )
            # Auto-upgrade agent to Pro on successful payment
            try:
                sess = await asyncio.to_thread(
                    stripe_sdk.checkout.Session.retrieve,
                    session_id,
                    expand=["customer_details"],
                )
                cd = getattr(sess, "customer_details", None) or (sess.get("customer_details") if isinstance(sess, dict) else None)
                customer_email = (getattr(cd, "email", None) or (cd.get("email") if isinstance(cd, dict) else None) or
                                  getattr(sess, "customer_email", None) or (sess.get("customer_email") if isinstance(sess, dict) else None) or "")
                if customer_email:
                    result = await db.agents.update_one(
                        {"email": customer_email.lower()},
                        {"$set": {"tier": "pro"}}
                    )
                    if result.modified_count:
                        logger.info("Stripe webhook: upgraded agent %s to Pro", customer_email)
            except Exception as e:
                logger.warning("Stripe webhook: could not upgrade agent: %s", e)
            if txn:
                await _trigger_drip_for_txn(session_id, txn)
    except Exception as e:
        logger.exception("Stripe webhook processing error for %s: %s", session_id, e)
        # Still return 200 so Stripe doesn't retry — log for manual review
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


# ============== BRAND VOICE ==============

@api_router.get("/brand-voice/{session_id}")
async def get_brand_voice(session_id: str):
    doc = await db.brand_voices.find_one({"session_id": session_id}, {"_id": 0, "session_id": 0})
    return doc or {}


@api_router.post("/brand-voice/{session_id}")
async def save_brand_voice(session_id: str, req: BrandVoiceModel):
    data = req.model_dump(exclude_none=True)
    data["session_id"] = session_id
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.brand_voices.update_one(
        {"session_id": session_id},
        {"$set": data},
        upsert=True,
    )
    return {"ok": True}


# ============== GOOGLE AUTH ==============
GOOGLE_CLIENT_ID = os.environ.get("GOOGLE_CLIENT_ID", "")


class GoogleAuthRequest(BaseModel):
    id_token: str
    session_id: str  # The anonymous session to promote


@api_router.post("/auth/google")
async def auth_google(req: GoogleAuthRequest):
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(501, "Google auth not configured. Set GOOGLE_CLIENT_ID.")
    try:
        from google.oauth2 import id_token as google_id_token
        from google.auth.transport import requests as google_requests
        idinfo = google_id_token.verify_oauth2_token(
            req.id_token, google_requests.Request(), GOOGLE_CLIENT_ID
        )
    except Exception as e:
        raise HTTPException(401, f"Invalid Google token: {str(e)[:120]}")

    google_id = idinfo["sub"]
    email = idinfo.get("email", "").lower()
    name = idinfo.get("name", "")
    picture = idinfo.get("picture", "")

    # Upsert user record
    now = datetime.now(timezone.utc).isoformat()
    await db.users.update_one(
        {"google_id": google_id},
        {"$set": {"email": email, "name": name, "picture": picture, "last_login": now},
         "$setOnInsert": {"google_id": google_id, "created_at": now}},
        upsert=True,
    )

    # Link current anonymous session to this Google account
    session_id = req.session_id.strip()
    if session_id:
        await db.user_sessions.update_one(
            {"session_id": session_id},
            {"$set": {"google_id": google_id, "email": email, "linked_at": now}},
            upsert=True,
        )

    return {"ok": True, "email": email, "name": name, "picture": picture, "google_id": google_id}


@api_router.get("/auth/me/{session_id}")
async def get_auth_me(session_id: str):
    sess = await db.user_sessions.find_one({"session_id": session_id}, {"_id": 0})
    if not sess or not sess.get("google_id"):
        return {"signed_in": False}
    user = await db.users.find_one({"google_id": sess["google_id"]}, {"_id": 0, "google_id": 0})
    return {"signed_in": True, **(user or {})}


@api_router.get("/entitlements/{session_id}")
async def get_entitlements(session_id: str):
    # Check direct entitlements on this session
    rows = await db.entitlements.find(
        {"lw_session_id": session_id}, {"_id": 0}
    ).to_list(20)

    # Also check entitlements on all other sessions linked to the same Google account
    if not any(r.get("kind") == "pro" for r in rows):
        sess = await db.user_sessions.find_one({"session_id": session_id})
        if sess and sess.get("google_id"):
            other_sessions = await db.user_sessions.find(
                {"google_id": sess["google_id"]}, {"session_id": 1}
            ).to_list(50)
            other_ids = [s["session_id"] for s in other_sessions if s["session_id"] != session_id]
            if other_ids:
                extra = await db.entitlements.find(
                    {"lw_session_id": {"$in": other_ids}}, {"_id": 0}
                ).to_list(50)
                rows = rows + extra

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


# ===== UNSUBSCRIBE (CAN-SPAM) =====
@api_router.get("/unsubscribe")
async def unsubscribe_email(email: str):
    if not email or "@" not in email:
        raise HTTPException(400, "Invalid email address")
    clean = email.lower().strip()
    await db.unsubscribes.update_one(
        {"email": clean},
        {"$set": {"email": clean, "unsubscribed_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    logger.info("Unsubscribed: %s", clean)
    return {"unsubscribed": True, "email": clean}


@api_router.get("/unsubscribe/check")
async def unsubscribe_check(email: str):
    if not email:
        return {"unsubscribed": False}
    doc = await db.unsubscribes.find_one({"email": email.lower().strip()})
    return {"unsubscribed": doc is not None}


# ===== PRICING (frontend reads this) =====
class LocalGemsRequest(BaseModel):
    address: str
    session_id: Optional[str] = None


@api_router.get("/autocomplete")
async def autocomplete(q: str = ""):
    if not q or len(q.strip()) < 2:
        return {"predictions": []}
    google_key = os.environ.get("GOOGLE_MAPS_API_KEY", "")
    if not google_key:
        return {"predictions": []}
    async with httpx.AsyncClient(timeout=8.0) as c:
        r = await c.get(
            "https://maps.googleapis.com/maps/api/place/autocomplete/json",
            params={"input": q.strip(), "types": "address", "components": "country:us", "key": google_key},
        )
        if r.status_code != 200:
            return {"predictions": []}
        return r.json()


@api_router.post("/local-gems")
async def local_gems(req: LocalGemsRequest):
    if not req.address or len(req.address.strip()) < 5:
        raise HTTPException(400, "Address required")

    google_key = os.environ.get("GOOGLE_MAPS_API_KEY", "")
    if not google_key:
        raise HTTPException(503, "Google Maps not configured")

    address = req.address.strip()

    async def places_nearby(lat: float, lng: float, ptype: str, rank: str = "prominence", limit: int = 4) -> list[dict]:
        async with httpx.AsyncClient(timeout=10.0) as c:
            r = await c.get(
                "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
                params={
                    "location": f"{lat},{lng}",
                    "radius": 800,
                    "type": ptype,
                    "rankby": rank,
                    "key": google_key,
                },
            )
            if r.status_code != 200:
                return []
            return r.json().get("results", [])[:limit]

    # Geocode address → lat/lng
    async with httpx.AsyncClient(timeout=10.0) as c:
        g = await c.get(
            "https://maps.googleapis.com/maps/api/geocode/json",
            params={"address": address, "key": google_key},
        )
        geo = g.json()
        if geo.get("status") != "OK" or not geo.get("results"):
            raise HTTPException(400, "Could not geocode that address — try a more specific address")
        loc = geo["results"][0]["geometry"]["location"]
        lat, lng = loc["lat"], loc["lng"]

    # Fetch schools, restaurants, parks/transit in parallel
    school_results, restaurant_results, park_results = await asyncio.gather(
        places_nearby(lat, lng, "school"),
        places_nearby(lat, lng, "restaurant"),
        places_nearby(lat, lng, "park"),
    )

    def fmt_places(places: list[dict]) -> str:
        lines = []
        for p in places:
            name = p.get("name", "")
            rating = p.get("rating")
            rating_str = f" — {rating}/5" if rating else ""
            vicinity = p.get("vicinity", "")
            lines.append(f"  • {name}{rating_str} ({vicinity})")
        return "\n".join(lines) if lines else "(none found nearby)"

    schools_text = fmt_places(school_results)
    restaurants_text = fmt_places(restaurant_results)
    parks_text = fmt_places(park_results)

    system = (
        "You write one short, punchy paragraph (3-4 sentences) for a real estate listing "
        "highlighting the neighborhood's best local features. Tone: warm, specific, aspirational. "
        "Use actual place names and ratings when present. No fluff. No 'nestled' or 'boasting'."
    )
    user = (
        f"Property address: {address}\n\n"
        f"Nearby schools:\n{schools_text}\n\n"
        f"Nearby restaurants:\n{restaurants_text}\n\n"
        f"Nearby parks & transit:\n{parks_text}\n\n"
        "Write the Local Gems paragraph."
    )

    paragraph = await call_openrouter(system, user, model="openai/gpt-4o-mini")
    return {"paragraph": paragraph.strip()}


class AgentBioRequest(BaseModel):
    name: str
    years: Optional[str] = None
    market: Optional[str] = None
    specialties: Optional[str] = None
    personality: str = "Professional"
    session_id: Optional[str] = None


@api_router.post("/agent-bio")
async def agent_bio(req: AgentBioRequest):
    if not req.name or len(req.name.strip()) < 2:
        raise HTTPException(400, "Agent name required")

    system = (
        "You are an expert real estate personal branding copywriter. "
        "You write agent bios that feel human, confident, and trustworthy — not corporate. "
        "No clichés like 'passionate about real estate' or 'helping families find their dream home'. "
        "Write in first person. Be specific. Make it sound like a real person wrote it."
    )

    personality_notes = {
        "Professional": "polished, authoritative, confident",
        "Warm": "friendly, approachable, community-focused",
        "Bold": "direct, results-driven, no-nonsense",
    }
    vibe = personality_notes.get(req.personality, "professional and authentic")

    user = (
        f"Write three versions of an agent bio for:\n"
        f"Name: {req.name}\n"
        f"Years in real estate: {req.years or 'not specified'}\n"
        f"Market/city: {req.market or 'not specified'}\n"
        f"Specialties: {req.specialties or 'residential real estate'}\n"
        f"Tone/vibe: {vibe}\n\n"
        f"Return as JSON with keys: short (2 sentences, for Instagram), "
        f"medium (4-5 sentences, for LinkedIn), full (7-8 sentences, for website). "
        f"JSON only, no markdown."
    )

    raw = await call_openrouter(system, user, model="openai/gpt-4o-mini")
    cleaned = _strip_json(raw)
    try:
        bios = json.loads(cleaned)
    except Exception:
        bios = {"short": raw[:200], "medium": raw[:400], "full": raw}

    return bios


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
async def email_test(req: EmailTestRequest, secret: str = ""):
    """Send the welcome email immediately to verify Resend is wired correctly.
    Drip emails are NOT scheduled here — this is for smoke-testing only."""
    if not ADMIN_SECRET or secret != ADMIN_SECRET:
        raise HTTPException(403, "Forbidden")
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


ADMIN_SECRET = os.environ.get("ADMIN_SECRET", "")


@api_router.get("/admin/stats")
async def admin_stats(x_admin_secret: str = Header(default="")):
    if not ADMIN_SECRET or x_admin_secret != ADMIN_SECRET:
        raise HTTPException(403, "Forbidden")

    since_fix = datetime(2026, 6, 9, tzinfo=timezone.utc)

    total_rewrites = await db.listings.count_documents({})
    rewrites_since_fix = await db.listings.count_documents({"created_at": {"$gte": since_fix}})
    unique_sessions = len(await db.listings.distinct("session_id"))
    sessions_since_fix = len(await db.listings.distinct("session_id", {"created_at": {"$gte": since_fix}}))

    total_purchases = await db.purchases.count_documents({})
    purchases_since_fix = await db.purchases.count_documents({"created_at": {"$gte": since_fix}})

    credit_holders = await db.credits.count_documents({"balance": {"$gt": 0}})

    pro_users = await db.purchases.count_documents({"kind": {"$in": ["pro", "lifetime"]}})

    recent = await db.listings.find(
        {"created_at": {"$gte": since_fix}},
        {"session_id": 1, "created_at": 1, "_id": 0}
    ).sort("created_at", -1).limit(5).to_list(5)

    total_visits = await db.visits.count_documents({})
    visits_today = await db.visits.count_documents({
        "ts": {"$gte": datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)}
    })
    unique_visitors = len(await db.visits.distinct("session_id"))

    return {
        "all_time": {
            "total_rewrites": total_rewrites,
            "unique_sessions": unique_sessions,
            "pro_or_lifetime_users": pro_users,
            "credit_holders": credit_holders,
            "total_purchases": total_purchases,
            "page_views": total_visits,
            "unique_visitors": unique_visitors,
        },
        "today": {
            "page_views": visits_today,
        },
        "since_free_trial_fix_jun9": {
            "rewrites": rewrites_since_fix,
            "unique_sessions": sessions_since_fix,
            "purchases": purchases_since_fix,
        },
        "recent_sessions": recent,
    }


@api_router.post("/admin/grant-paid-session")
async def admin_grant_paid_session(request: Request, x_admin_secret: str = Header(default="")):
    """Force-process a paid Stripe session — grants credits/entitlements that failed to land."""
    if not ADMIN_SECRET or x_admin_secret != ADMIN_SECRET:
        raise HTTPException(403, "Forbidden")
    body = await request.json()
    stripe_session_id = body.get("stripe_session_id", "").strip()
    if not stripe_session_id:
        raise HTTPException(400, "stripe_session_id required")

    step = "stripe_fetch"
    try:
        sess = await asyncio.to_thread(stripe_sdk.checkout.Session.retrieve, stripe_session_id)

        step = "check_paid"
        payment_status = sess.get("payment_status") if hasattr(sess, "get") else getattr(sess, "payment_status", None)
        if payment_status != "paid":
            raise HTTPException(400, f"Session not paid — status: {payment_status}")

        step = "extract_meta"
        raw_meta = getattr(sess, "metadata", None)
        # StripeObject uses __getattr__ for key lookup; getattr with default safely handles missing keys
        lw_session_id = str(getattr(raw_meta, "lw_session_id", "") or "")
        package_id = str(getattr(raw_meta, "package_id", "") or "")
        package_kind = str(getattr(raw_meta, "package_kind", "") or "")
        pkg = PACKAGES.get(package_id, {})

        step = "txn_upsert"
        await db.payment_transactions.update_one(
            {"stripe_session_id": stripe_session_id},
            {"$set": {
                "status": "complete",
                "payment_status": "paid",
                "lw_session_id": lw_session_id,
                "package_id": package_id,
                "package_kind": package_kind,
                "amount": pkg.get("amount", 0),
                "paid_at": datetime.now(timezone.utc).isoformat(),
            }},
            upsert=True,
        )

        granted = {}

        step = "grant_entitlement"
        if lw_session_id and package_kind in ("pro", "lifetime", "guide"):
            ent = {
                "lw_session_id": lw_session_id,
                "kind": package_kind,
                "package_id": package_id,
                "stripe_session_id": stripe_session_id,
                "granted_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.entitlements.update_one(
                {"lw_session_id": lw_session_id, "kind": package_kind},
                {"$set": ent},
                upsert=True,
            )
            granted["entitlement"] = package_kind

        step = "grant_credits"
        if lw_session_id and pkg.get("kind") == "credits":
            credit_amount = int(pkg.get("credits", 0))
            if credit_amount > 0:
                await db.credits.update_one(
                    {"lw_session_id": lw_session_id},
                    {"$inc": {"balance": credit_amount},
                     "$set": {"updated_at": datetime.now(timezone.utc).isoformat()}},
                    upsert=True,
                )
                granted["credits"] = credit_amount

        return {
            "ok": True,
            "stripe_session_id": stripe_session_id,
            "lw_session_id": lw_session_id,
            "package_id": package_id,
            "pkg": pkg,
            "granted": granted,
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback as _tb
        logger.exception("grant-paid-session failed at step '%s': %s", step, e)
        raise HTTPException(500, f"Failed at step '{step}': {type(e).__name__}: {e}")


@api_router.post("/admin/reset-trial")
async def reset_trial(request: Request, x_admin_secret: str = Header(default="")):
    if not ADMIN_SECRET or x_admin_secret != ADMIN_SECRET:
        raise HTTPException(403, "Forbidden")
    body = await request.json()
    session_id = body.get("session_id", "").strip()
    if not session_id:
        raise HTTPException(400, "session_id required")
    await db.free_trials.delete_one({"session_id": session_id})
    return {"ok": True, "session_id": session_id, "message": "Trial reset — 3 rewrites restored"}


@api_router.post("/visit")
async def track_visit(request: Request):
    """Called by the frontend on every page load. Lightweight visit counter."""
    session_id = request.headers.get("x-session-id", "")
    referrer = request.headers.get("referer", "")
    ua = request.headers.get("user-agent", "")
    # Skip bots
    if any(b in ua.lower() for b in ["bot", "crawler", "spider", "lighthouse", "curl", "python"]):
        return {"ok": True}
    await db.visits.insert_one({
        "session_id": session_id,
        "referrer": referrer,
        "ua": ua[:120],
        "ts": datetime.now(timezone.utc),
    })
    return {"ok": True}


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get(
        'CORS_ORIGINS',
        'https://listworks.pro,https://www.listworks.pro,http://localhost:3000'
    ).split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)


# ===== QR: SHOWING FEEDBACK =====
class ShowingFeedbackCreate(BaseModel):
    listing_title: str = ""
    address: str = ""
    agent_name: str = ""
    agent_email: str = ""

class ShowingFeedbackSubmit(BaseModel):
    event_id: str
    rating: int  # 1-5
    comment: str = ""
    email: str = ""
    name: str = ""

@api_router.post("/qr/showing-feedback")
async def qr_showing_create(req: ShowingFeedbackCreate, request: Request):
    event_id = str(uuid.uuid4())
    frontend_url = os.environ.get("FRONTEND_URL", "https://listworks.pro")
    event = {
        "event_id": event_id,
        "listing_title": req.listing_title,
        "address": req.address,
        "agent_name": req.agent_name,
        "agent_email": req.agent_email,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "qr_url": f"{frontend_url}/show/{event_id}",
        "visitors": 0,
    }
    await db.showing_feedback_events.insert_one(event)
    return event

@api_router.post("/qr/showing-feedback/submit")
async def qr_showing_submit(req: ShowingFeedbackSubmit, request: Request):
    event = await db.showing_feedback_events.find_one({"event_id": req.event_id})
    if not event:
        raise HTTPException(404, "Event not found")
    feedback = {
        "id": str(uuid.uuid4()),
        "event_id": req.event_id,
        "rating": req.rating,
        "comment": req.comment,
        "email": req.email,
        "name": req.name,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.showing_feedback.insert_one(feedback)
    await db.showing_feedback_events.update_one(
        {"event_id": req.event_id}, {"$inc": {"visitors": 1}}
    )
    if req.email:
        try:
            await send_email(req.email, "Thanks for your feedback!",
                f"Hi {req.name or 'there'},<br><br>Thanks for touring {event.get('listing_title', 'the property')}.<br><br>Your agent, {event.get('agent_name', 'your agent')}, appreciates the input.<br><br>— ListWorks PRO")
        except: pass
    return {"ok": True, "feedback_id": feedback["id"]}

@api_router.get("/qr/showing-feedback/{event_id}")
async def qr_showing_get(event_id: str):
    event = await db.showing_feedback_events.find_one({"event_id": event_id})
    if not event:
        raise HTTPException(404, "Event not found")
    return event

# ===== AGENT PROFILE (Landing Page) =====
class AgentProfileCreate(BaseModel):
    name: str
    slug: str = ""
    title: str = "Real Estate Agent"
    brokerage: str = ""
    phone: str = ""
    email: str = ""
    photo_url: str = ""
    bio: str = ""
    specialties: str = ""
    social_linkedin: str = ""
    social_instagram: str = ""
    social_facebook: str = ""
    website: str = ""

class AgentProfileUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    title: Optional[str] = None
    brokerage: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    photo_url: Optional[str] = None
    bio: Optional[str] = None
    specialties: Optional[str] = None
    social_linkedin: Optional[str] = None
    social_instagram: Optional[str] = None
    social_facebook: Optional[str] = None
    website: Optional[str] = None

@api_router.post("/agent/profile")
async def agent_profile_create(req: AgentProfileCreate, request: Request):
    session_id = (await request.json()).get("session_id", "") if request.headers.get("content-type") == "application/json" else ""
    slug = req.slug or re.sub(r'[^a-z0-9-]', '', req.name.lower().replace(" ", "-"))
    existing = await db.agent_profiles.find_one({"slug": slug})
    if existing:
        slug = slug + "-" + str(uuid.uuid4())[:6]
    frontend_url = os.environ.get("FRONTEND_URL", "https://listworks.pro")
    profile = {
        "profile_id": str(uuid.uuid4()),
        "session_id": session_id,
        "slug": slug,
        "name": req.name,
        "title": req.title,
        "brokerage": req.brokerage,
        "phone": req.phone,
        "email": req.email,
        "photo_url": req.photo_url,
        "bio": req.bio,
        "specialties": req.specialties,
        "social_linkedin": req.social_linkedin,
        "social_instagram": req.social_instagram,
        "social_facebook": req.social_facebook,
        "website": req.website,
        "public_url": f"{frontend_url}/a/{slug}",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.agent_profiles.insert_one(profile)
    return profile

@api_router.get("/agent/profile/{session_id}")
async def agent_profile_get(session_id: str):
    profile = await db.agent_profiles.find_one({"session_id": session_id})
    if not profile:
        return None
    profile["_id"] = str(profile["_id"])
    return profile

@api_router.put("/agent/profile/{session_id}")
async def agent_profile_update(session_id: str, req: AgentProfileUpdate):
    updates = {k: v for k, v in req.dict(exclude_unset=True).items() if v is not None}
    if not updates:
        raise HTTPException(400, "No fields to update")
    updates["updated_at"] = datetime.now(timezone.utc).isoformat()
    if "slug" in updates:
        existing = await db.agent_profiles.find_one({"slug": updates["slug"], "session_id": {"$ne": session_id}})
        if existing:
            raise HTTPException(400, "Slug already taken")
    await db.agent_profiles.update_one({"session_id": session_id}, {"$set": updates})
    return {"ok": True}

@api_router.get("/agent/public/{slug}")
async def agent_profile_public(slug: str):
    profile = await db.agent_profiles.find_one({"slug": slug})
    if not profile:
        raise HTTPException(404, "Agent not found")
    profile["_id"] = str(profile["_id"])
    # Get their recent listings
    listings_cursor = db.listings.find({"session_id": profile.get("session_id", "")}).sort("created_at", -1).limit(6)
    listings = await listings_cursor.to_list(length=6)
    for l in listings:
        l["_id"] = str(l["_id"])
    profile["listings"] = listings
    return profile

# ===== PDF EXPORT =====
@api_router.post("/export/pdf")
async def export_pdf(request: Request):
    body = await request.json()
    content = body.get("content", "")
    title = body.get("title", "Listing")
    agent = body.get("agent", "")
    brokerage = body.get("brokerage", "")
    html_content = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>{title}</title>
<style>
  @page {{ margin: 0.75in; }}
  body {{ font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12pt; line-height: 1.6; color: #222; max-width: 6.5in; margin: auto; }}
  h1 {{ font-size: 18pt; font-weight: 700; margin-bottom: 4pt; }}
  .meta {{ font-size: 10pt; color: #666; margin-bottom: 16pt; }}
  hr {{ border: none; border-top: 1px solid #ddd; margin: 16pt 0; }}
  .content {{ white-space: pre-wrap; }}
  .footer {{ margin-top: 24pt; font-size: 9pt; color: #999; text-align: center; border-top: 1px solid #ddd; padding-top: 12pt; }}
</style></head><body>
  <h1>{title}</h1>
  <div class="meta">{agent}{' · ' + brokerage if brokerage else ''}</div>
  <hr>
  <div class="content">{content}</div>
  <div class="footer">Generated by ListWorks PRO — listworks.pro</div>
</body></html>"""
    return {"html": html_content, "filename": f"{title.replace(' ', '-').lower()[:40]}.pdf"}

# ===== FIX SOCIAL AUTO-POST =====
@api_router.post("/social/post-direct")
async def social_post_direct(request: Request):
    body = await request.json()
    text = body.get("text", "")
    platform = body.get("platform", "facebook")  # "facebook", "twitter", "linkedin"
    post = {
        "id": str(uuid.uuid4()),
        "platform": platform,
        "text": text,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.social_posts.insert_one(post)
    return post

# ===== QR: AGENT CARD =====
class AgentCardCreate(BaseModel):
    name: str
    title: str = "Real Estate Agent"
    brokerage: str = ""
    phone: str = ""
    email: str = ""
    photo_url: str = ""
    bio: str = ""

class AgentCardUpdate(BaseModel):
    name: str = ""
    title: str = ""
    brokerage: str = ""
    phone: str = ""
    email: str = ""
    photo_url: str = ""
    bio: str = ""

@api_router.post("/qr/agent-card")
async def qr_agent_card_create(req: AgentCardCreate, request: Request):
    card_id = str(uuid.uuid4())
    frontend_url = os.environ.get("FRONTEND_URL", "https://listworks.pro")
    card = {
        "card_id": card_id,
        "name": req.name,
        "title": req.title,
        "brokerage": req.brokerage,
        "phone": req.phone,
        "email": req.email,
        "photo_url": req.photo_url,
        "bio": req.bio,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "qr_url": f"{frontend_url}/agent/{card_id}",
    }
    await db.agent_cards.insert_one(card)
    return card

@api_router.get("/qr/agent-card/{card_id}")
async def qr_agent_card_get(card_id: str):
    card = await db.agent_cards.find_one({"card_id": card_id})
    if not card:
        raise HTTPException(404, "Card not found")
    return card

@api_router.put("/qr/agent-card/{card_id}")
async def qr_agent_card_update(card_id: str, req: AgentCardUpdate, request: Request):
    updates = {k: v for k, v in req.dict().items() if v}
    if not updates:
        raise HTTPException(400, "No fields to update")
    await db.agent_cards.update_one({"card_id": card_id}, {"$set": updates})
    return {"ok": True}

# ============== POST SCHEDULER ==============

class SchedulePostRequest(BaseModel):
    session_id: Optional[str] = None
    email: str                        # reminder destination
    platform: str                     # Instagram | Facebook | LinkedIn | Stories
    content: str                      # the caption/copy to post
    scheduled_at: str                 # ISO-8601 UTC: "2026-07-01T14:00:00Z"
    note: Optional[str] = None        # agent's own note (e.g. "Just Listed — 123 Elm")


@api_router.post("/schedule/post")
async def schedule_post(req: SchedulePostRequest):
    if not req.email or "@" not in req.email:
        raise HTTPException(400, "Valid email required for reminder")
    if not req.content or not req.content.strip():
        raise HTTPException(400, "Content cannot be empty")
    try:
        fire_dt = datetime.fromisoformat(req.scheduled_at.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(400, "Invalid scheduled_at — use ISO-8601 format e.g. 2026-07-01T14:00:00Z")

    post_id = str(uuid.uuid4())
    await db.scheduled_posts.insert_one({
        "id": post_id,
        "session_id": req.session_id,
        "email": req.email.lower().strip(),
        "platform": req.platform,
        "content": req.content.strip(),
        "note": req.note or "",
        "scheduled_at": fire_dt.isoformat(),
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    # Confirmation email immediately
    from email_engine import send_email
    confirm_body = f"""<p>Your post is scheduled for <strong>{fire_dt.strftime("%B %-d, %Y at %-I:%M %p UTC")}</strong> on <strong>{req.platform}</strong>.</p>
{"<p><em>" + req.note + "</em></p>" if req.note else ""}
<p>We'll send you a reminder with the content ready to copy when it's time.</p>
<hr>
<pre style="background:#f5f5f5;padding:16px;border-radius:4px;white-space:pre-wrap;">{req.content}</pre>"""

    await send_email(to=req.email, subject=f"Scheduled: {req.platform} post for {fire_dt.strftime('%b %-d')}", body=confirm_body)
    return {"id": post_id, "scheduled_at": fire_dt.isoformat(), "status": "pending"}


@api_router.get("/schedule/list/{session_id}")
async def schedule_list(session_id: str):
    posts = await db.scheduled_posts.find(
        {"session_id": session_id, "status": {"$in": ["pending", "reminder_sent"]}},
        {"_id": 0}
    ).sort("scheduled_at", 1).to_list(50)
    return {"posts": posts}


@api_router.delete("/schedule/{post_id}")
async def schedule_delete(post_id: str):
    result = await db.scheduled_posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(404, "Scheduled post not found")
    return {"deleted": True}


@api_router.post("/schedule/check")
async def schedule_check(x_admin_secret: str = Header(default="")):
    """Railway cron calls this every 15 min to fire due reminders."""
    if x_admin_secret != os.environ.get("ADMIN_SECRET", ""):
        raise HTTPException(403, "Forbidden")

    now = datetime.now(timezone.utc)
    due = await db.scheduled_posts.find(
        {"status": "pending", "scheduled_at": {"$lte": now.isoformat()}},
        {"_id": 0}
    ).to_list(100)

    fired = 0
    from email_engine import send_email
    for post in due:
        try:
            platform = post.get("platform", "Social")
            note = post.get("note", "")
            fire_dt_str = post.get("scheduled_at", "")
            body = f"""<p>⏰ It's time to post on <strong>{platform}</strong>!</p>
{"<p><em>" + note + "</em></p>" if note else ""}
<p>Copy the content below and paste it into {platform}:</p>
<hr>
<pre style="background:#f5f5f5;padding:16px;border-radius:4px;white-space:pre-wrap;">{post['content']}</pre>
<p style="color:#999;font-size:12px;">Scheduled at {fire_dt_str} via ListWorks PRO</p>"""

            await send_email(
                to=post["email"],
                subject=f"Post time! Your {platform} content is ready",
                body=body,
            )
            await db.scheduled_posts.update_one(
                {"id": post["id"]},
                {"$set": {"status": "reminder_sent", "fired_at": now.isoformat()}}
            )
            fired += 1
        except Exception as e:
            logging.warning(f"Scheduler: failed to send reminder for {post.get('id')}: {e}")

    return {"checked": len(due), "fired": fired}


# ============== MARKET UPDATE GENERATOR ==============

class MarketUpdateRequest(BaseModel):
    location: str         # city, ZIP, or neighborhood
    session_id: Optional[str] = None


MARKET_UPDATE_SYSTEM = """You are a real estate market analyst and social media copywriter.
Given real estate market data snippets for a location, generate 3 ready-to-post social media updates.

Return ONLY a JSON object with exactly these fields:
{
  "instagram": "Instagram caption with market stats. Open with a punchy data hook. Explain what it means for buyers/sellers. 150-250 words. 3-5 relevant hashtags at end.",
  "facebook": "Facebook post. More narrative — what story do these numbers tell? What should local buyers/sellers do right now? 200-300 words. Conversational.",
  "email": "Email newsletter paragraph (no subject line). 100-150 words. Positions agent as the informed local expert. Professional but human tone.",
  "summary": "2-sentence plain-English summary of current market conditions."
}

Rules:
- Use specific numbers from the search data where available
- If data is limited, acknowledge it honestly and focus on trends
- Never fabricate specific numbers — use ranges or qualitative language if unsure
- Apply agent brand voice if provided
- JSON only, no markdown wrapper."""


@api_router.post("/market-update")
async def market_update(req: MarketUpdateRequest):
    if not req.location or len(req.location.strip()) < 2:
        raise HTTPException(400, "Please provide a city, ZIP code, or neighborhood.")

    tavily_key = os.environ.get("TAVILY_API_KEY", "")
    if not tavily_key:
        raise HTTPException(503, "Market data search not available.")

    location = req.location.strip()

    # Fetch live market data via Tavily
    queries = [
        f"{location} real estate market stats 2026 median home price days on market",
        f"{location} housing market trends June 2026 inventory",
    ]
    snippets = []
    async with httpx.AsyncClient(timeout=20.0) as hc:
        for q in queries:
            try:
                resp = await hc.post("https://api.tavily.com/search", json={
                    "api_key": tavily_key, "query": q, "max_results": 3,
                    "search_depth": "basic", "include_answer": True,
                })
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("answer"):
                        snippets.append(data["answer"])
                    for r in data.get("results", [])[:2]:
                        if r.get("content"):
                            snippets.append(r["content"][:400])
            except Exception:
                pass

    bv: dict = {}
    if req.session_id:
        bv_doc = await db.brand_voices.find_one({"session_id": req.session_id})
        if bv_doc:
            bv = {k: v for k, v in bv_doc.items() if k != "_id"}

    system = MARKET_UPDATE_SYSTEM + _build_brand_voice_block(bv)
    market_data = "\n\n".join(snippets) if snippets else f"General market context for {location} — use current knowledge."
    user_text = f"Location: {location}\n\nMarket data:\n{market_data[:3000]}\n\nGenerate 3 social posts. JSON only."

    try:
        raw = await call_g0dm0d3(system, user_text, tier="smart")
    except Exception:
        raw = await call_openrouter(system, user_text)

    cleaned = _strip_json(raw)
    try:
        result = json.loads(cleaned)
    except Exception as e:
        logging.exception("Market update parse failed")
        raise HTTPException(500, f"AI returned invalid data: {str(e)[:120]}")

    return {"location": location, **result}


# ============== CONTENT CALENDAR ==============

class ContentCalendarRequest(BaseModel):
    session_id: Optional[str] = None
    specialty: Optional[str] = None       # "luxury", "first-time buyers", "investors", etc.
    active_listing: Optional[str] = None  # brief listing description to weave in
    market: Optional[str] = None          # city/area override
    month: Optional[str] = None           # "July 2026" — defaults to current month


CONTENT_CALENDAR_SYSTEM = """You are a real estate social media strategist. Generate a 30-day content calendar for a real estate agent.

Return ONLY a JSON array of exactly 30 objects, one per day. Each object:
{
  "day": 1,
  "date": "Mon Jul 1",
  "platform": "Instagram",
  "category": "Just Listed|Market Update|Tips|Testimonial|Personal|Open House|Seasonal|Engagement",
  "hook": "One-sentence post hook (the first line)",
  "caption": "Full draft caption (platform-appropriate length, include hashtags if Instagram/Facebook)"
}

Rules:
- Vary platforms (Instagram, Facebook, LinkedIn, Stories) — don't stack the same platform 3+ days in a row
- Vary categories — mix promotional and educational (max 30% promotional)
- Weave in any active listing naturally on 4-6 days, not every day
- Apply brand voice if provided
- Make every hook scroll-stopping — specific, human, curiosity-driving
- Return ONLY the JSON array. No markdown, no explanation."""


@api_router.post("/content-calendar")
async def content_calendar(req: ContentCalendarRequest):
    bv: dict = {}
    if req.session_id:
        bv_doc = await db.brand_voices.find_one({"session_id": req.session_id})
        if bv_doc:
            bv = {k: v for k, v in bv_doc.items() if k != "_id"}

    market = req.market or bv.get("market") or "your local market"
    specialty = req.specialty or "general real estate"
    month = req.month or datetime.now(timezone.utc).strftime("%B %Y")

    system = CONTENT_CALENDAR_SYSTEM + _build_brand_voice_block(bv)

    user_parts = [
        f"Generate a 30-day content calendar for {month}.",
        f"Agent specialty: {specialty}",
        f"Market: {market}",
    ]
    if req.active_listing:
        user_parts.append(f"Active listing to weave in (use naturally on 4-6 days): {req.active_listing}")

    try:
        raw = await call_g0dm0d3(system, "\n".join(user_parts), tier="smart")
    except Exception:
        raw = await call_openrouter(system, "\n".join(user_parts))

    cleaned = _strip_json(raw)
    try:
        days = json.loads(cleaned)
        if not isinstance(days, list):
            raise ValueError("Expected array")
    except Exception as e:
        logging.exception("Content calendar parse failed")
        raise HTTPException(500, f"AI returned invalid calendar data: {str(e)[:120]}")

    return {"month": month, "days": days}


# ============== SOCIAL TEMPLATE LIBRARY ==============

TEMPLATE_CONFIGS = [
    # Just Listed
    {"id": "just-listed-instagram", "category": "just_listed", "category_label": "Just Listed", "platform": "Instagram", "label": "Instagram Caption",
     "prompt": "Write an Instagram caption (max 2,200 chars, 3-5 relevant hashtags at end) announcing a new listing. Open with a hook that creates curiosity or desire. Highlight 2-3 standout features. End with a call to action (DM for details, link in bio, etc.)."},
    {"id": "just-listed-facebook", "category": "just_listed", "category_label": "Just Listed", "platform": "Facebook", "label": "Facebook Post",
     "prompt": "Write a Facebook post announcing a new listing. Can be longer than Instagram (up to 400 words). Include property highlights, what makes the neighborhood special, and a clear call to action. Conversational and shareable."},
    {"id": "just-listed-reel", "category": "just_listed", "category_label": "Just Listed", "platform": "Reel", "label": "Reel Caption",
     "prompt": "Write a short Reel caption (max 150 chars) for a just-listed property video. Punchy, hook-first, ends with a CTA or cliffhanger. No hashtags needed."},
    {"id": "just-listed-email", "category": "just_listed", "category_label": "Just Listed", "platform": "Email", "label": "Email Blast",
     "prompt": "Write a short email blast (subject line + body) announcing a new listing to the agent's sphere of influence. Subject under 60 chars. Body 100-150 words. Personal, not corporate. End with a direct offer to schedule a showing. Format as: SUBJECT: [subject line]\n\n[body]"},
    {"id": "just-listed-stories", "category": "just_listed", "category_label": "Just Listed", "platform": "Stories", "label": "Stories (3 Slides)",
     "prompt": "Write 3 Instagram/Facebook Stories slide captions for a new listing. Each slide max 15 words. Slide 1: hook/tease. Slide 2: key features. Slide 3: CTA. Return as exactly 3 lines separated by '|||'."},
    # Just Sold
    {"id": "just-sold-instagram", "category": "just_sold", "category_label": "Just Sold", "platform": "Instagram", "label": "Instagram Caption",
     "prompt": "Write an Instagram caption celebrating a just-sold property. Acknowledge the clients (without naming them). Highlight what made this sale special (speed, price, competition, etc.). Social proof angle — builds credibility. 3-5 hashtags at end."},
    {"id": "just-sold-facebook", "category": "just_sold", "category_label": "Just Sold", "platform": "Facebook", "label": "Facebook Post",
     "prompt": "Write a Facebook post celebrating a just-sold property. Tell the brief story: the clients, the challenge, the win. Make it feel like a celebration, not a brag. 150-250 words. Ends with a soft CTA (thinking of selling?)."},
    {"id": "just-sold-linkedin", "category": "just_sold", "category_label": "Just Sold", "platform": "LinkedIn", "label": "LinkedIn Announcement",
     "prompt": "Write a professional LinkedIn post announcing a just-sold property. Frame it as a business accomplishment. Mention market conditions, strategy, or negotiation wins (generic, not client-specific). 100-200 words. Professional but not stuffy."},
    {"id": "just-sold-story", "category": "just_sold", "category_label": "Just Sold", "platform": "Instagram", "label": "Client Story Tease",
     "prompt": "Write a short Instagram caption that teases the story behind a just-sold property without giving everything away. Hook-first style ('The buyers almost walked away. Here's why they didn't.'). Under 100 words. Ends with 'Full story in bio' or similar."},
    # Market Update
    {"id": "market-monthly-stats", "category": "market_update", "category_label": "Market Update", "platform": "Instagram", "label": "Monthly Market Stats",
     "prompt": "Write an Instagram caption sharing monthly real estate market stats. Use [STAT] placeholders the agent can fill in. Educational, easy to understand, positions the agent as the local expert. Frame the data with context. 3-4 hashtags."},
    {"id": "market-buyers-market", "category": "market_update", "category_label": "Market Update", "platform": "Facebook", "label": "Buyer's Market Update",
     "prompt": "Write a Facebook post explaining current buyer's market conditions in real estate. What does it mean for buyers? What opportunities exist right now? Actionable, educational, not alarmist. 150-200 words. Soft CTA at end."},
    {"id": "market-sellers-market", "category": "market_update", "category_label": "Market Update", "platform": "Facebook", "label": "Seller's Market Update",
     "prompt": "Write a Facebook post explaining current seller's market conditions. Why is NOW a great time to list? What can sellers expect? Motivating but honest. 150-200 words. Soft CTA."},
    {"id": "market-rate-update", "category": "market_update", "category_label": "Market Update", "platform": "Instagram", "label": "Interest Rate Update",
     "prompt": "Write an Instagram caption commenting on recent interest rate movements and what it means for buyers and sellers. Approachable, not financial advice. Under 200 words. Positions agent as informed and helpful. 3 hashtags."},
    # Testimonial
    {"id": "testimonial-share-review", "category": "testimonial", "category_label": "Testimonial", "platform": "Instagram", "label": "Share a Review",
     "prompt": "Write an Instagram caption to accompany a client review/testimonial screenshot. Frame the review with context. Brief, lets the review speak. Thank the client without being sycophantic. Under 100 words. 2-3 hashtags."},
    {"id": "testimonial-client-story", "category": "testimonial", "category_label": "Testimonial", "platform": "Facebook", "label": "Client Story",
     "prompt": "Write a Facebook post telling a client success story (no identifying details). What was their goal? What challenges came up? How did it resolve? Narrative arc, 200-300 words. Human and warm. Ends with a soft CTA."},
    {"id": "testimonial-referral-ask", "category": "testimonial", "category_label": "Testimonial", "platform": "Instagram", "label": "Referral Ask",
     "prompt": "Write an Instagram caption asking for referrals in a non-pushy, authentic way. Acknowledge the agent's referral-based business. Make it easy and specific ('know anyone thinking of buying or selling?'). Under 100 words. Conversational."},
    # Open House
    {"id": "open-house-invite", "category": "open_house", "category_label": "Open House", "platform": "Instagram", "label": "Open House Invite",
     "prompt": "Write an Instagram caption inviting followers to an open house. Include [DATE], [TIME], [ADDRESS] placeholders. Create excitement about the property. Call out the best feature as the hook. Under 200 words. 3-4 hashtags."},
    {"id": "open-house-reminder", "category": "open_house", "category_label": "Open House", "platform": "Instagram", "label": "Day-Of Reminder",
     "prompt": "Write a short Instagram caption for an open house day-of reminder. Urgent, casual, feels like a friend texting you. Under 80 words. Include [TIME] and [ADDRESS] placeholders."},
    {"id": "open-house-followup", "category": "open_house", "category_label": "Open House", "platform": "Instagram", "label": "Post-Open House Follow-Up",
     "prompt": "Write an Instagram caption for the day after an open house. Thank everyone who came. Create FOMO for those who didn't. If there's still availability, mention it. Under 150 words. Warm and genuine."},
    # Education / Tips
    {"id": "edu-buyer-tips", "category": "education", "category_label": "Education / Tips", "platform": "Instagram", "label": "Buyer Tips (Carousel)",
     "prompt": "Write a 5-tip Instagram carousel caption for first-time homebuyers. Each tip is one punchy sentence (numbered 1-5). Intro hook + 5 tips + CTA to DM for a free buyer consultation. Under 400 words. Educational, not salesy."},
    {"id": "edu-seller-tips", "category": "education", "category_label": "Education / Tips", "platform": "Instagram", "label": "Seller Tips (Carousel)",
     "prompt": "Write a 5-tip Instagram carousel caption for homeowners thinking about selling. Focus on practical prep tips (staging, pricing, timing). Hook + 5 numbered tips + CTA. Under 400 words. Practical and actionable."},
    {"id": "edu-staging-tip", "category": "education", "category_label": "Education / Tips", "platform": "Facebook", "label": "Home Staging Tip",
     "prompt": "Write a Facebook post sharing one high-impact staging tip that helps homes sell faster. Practical, specific, actionable. 100-150 words. Ends with a CTA (free staging consultation, etc.)."},
    {"id": "edu-mortgage-faq", "category": "education", "category_label": "Education / Tips", "platform": "Instagram", "label": "Mortgage FAQ",
     "prompt": "Write an Instagram caption busting one common mortgage myth or answering one common mortgage question. Educational, approachable, positions agent as a knowledgeable guide. Under 200 words. 2-3 hashtags."},
    {"id": "edu-neighborhood", "category": "education", "category_label": "Education / Tips", "platform": "Instagram", "label": "Neighborhood Spotlight",
     "prompt": "Write an Instagram caption spotlighting a neighborhood. What makes it special? Restaurants, vibe, walkability, schools, hidden gems. Local expert voice. Under 250 words. 3-4 hashtags including the neighborhood name."},
    {"id": "edu-negotiation-tip", "category": "education", "category_label": "Education / Tips", "platform": "Facebook", "label": "Negotiation Tip",
     "prompt": "Write a Facebook post sharing one practical real estate negotiation tip for buyers or sellers. Insider knowledge angle — something they wouldn't know without an agent. 100-150 words. Builds trust and authority."},
    # Seasonal
    {"id": "seasonal-spring", "category": "seasonal", "category_label": "Seasonal", "platform": "Instagram", "label": "Spring Market",
     "prompt": "Write an Instagram caption for the spring real estate market. Spring is the busiest season — what should buyers and sellers know? Energetic, optimistic tone. Under 200 words. 3-4 hashtags."},
    {"id": "seasonal-summer", "category": "seasonal", "category_label": "Seasonal", "platform": "Instagram", "label": "Summer Market",
     "prompt": "Write an Instagram caption about summer real estate market conditions. Acknowledge the slower pace and frame it as an opportunity for serious buyers/sellers. Under 200 words. Casual summer vibe."},
    {"id": "seasonal-fall", "category": "seasonal", "category_label": "Seasonal", "platform": "Instagram", "label": "Fall Market",
     "prompt": "Write an Instagram caption for the fall real estate market. Motivated buyers/sellers, less competition. Warm, cozy fall tone. Under 200 words. 3-4 hashtags."},
    {"id": "seasonal-holiday", "category": "seasonal", "category_label": "Seasonal", "platform": "Instagram", "label": "Holiday Warmth",
     "prompt": "Write a warm Instagram caption for the holiday season from the agent. Personal, grateful, human. NOT salesy. Acknowledge clients who closed this year. Under 150 words. Ends with a warm closing, not a CTA."},
    {"id": "seasonal-new-year", "category": "seasonal", "category_label": "Seasonal", "platform": "Instagram", "label": "New Year Market Outlook",
     "prompt": "Write an Instagram caption for a new year real estate market outlook. What's the agent excited about? Goals, market predictions, encouragement. Inspiring tone. Under 200 words. 3-4 hashtags."},
    {"id": "seasonal-year-end", "category": "seasonal", "category_label": "Seasonal", "platform": "Instagram", "label": "Year-End Recap",
     "prompt": "Write an Instagram caption recapping the agent's year in real estate. Homes sold, milestones, grateful to clients. Celebratory but humble. Under 200 words. Personal and genuine."},
]

TEMPLATE_CATEGORY_ORDER = ["just_listed", "just_sold", "market_update", "testimonial", "open_house", "education", "seasonal"]
_TEMPLATE_MAP = {t["id"]: t for t in TEMPLATE_CONFIGS}


def _build_brand_voice_block(bv: dict) -> str:
    parts = []
    if bv.get("agent_name"): parts.append(f"Agent name: {bv['agent_name']}")
    if bv.get("brokerage"): parts.append(f"Brokerage: {bv['brokerage']}")
    if bv.get("market"): parts.append(f"Market area: {bv['market']}")
    if bv.get("style"): parts.append(f"Writing style: {bv['style']}")
    if bv.get("avoid_words"): parts.append(f"NEVER use these words or phrases: {bv['avoid_words']}")
    if bv.get("favorite_phrases"): parts.append(f"Naturally weave in these phrases when relevant: {bv['favorite_phrases']}")
    if bv.get("tagline"): parts.append(f"Agent tagline: {bv['tagline']}")
    if bv.get("font"): parts.append(f"Brand feel: {bv['font']} — Modern Sans=clean/direct, Classic Serif=elevated/formal, Friendly Script=warm/approachable")
    if bv.get("extra"): parts.append(f"Additional brand notes: {bv['extra']}")
    if not parts:
        return ""
    return "\n\n═══ AGENT BRAND VOICE ═══\n" + "\n".join(parts) + "\n═════════════════════════"


class TemplateGenerateRequest(BaseModel):
    template_id: str
    listing_notes: Optional[str] = None
    session_id: Optional[str] = None


@api_router.get("/templates")
async def list_templates():
    by_category: Dict[str, Any] = {}
    for t in TEMPLATE_CONFIGS:
        cat = t["category"]
        if cat not in by_category:
            by_category[cat] = {"id": cat, "label": t["category_label"], "templates": []}
        by_category[cat]["templates"].append({"id": t["id"], "platform": t["platform"], "label": t["label"]})
    ordered = [by_category[c] for c in TEMPLATE_CATEGORY_ORDER if c in by_category]
    return {"categories": ordered}


@api_router.post("/template/generate")
async def template_generate(req: TemplateGenerateRequest):
    tmpl = _TEMPLATE_MAP.get(req.template_id)
    if not tmpl:
        raise HTTPException(404, f"Unknown template id: {req.template_id}")

    system = (
        "You are a real estate marketing copywriter. Write compelling, authentic social media content "
        "for real estate agents. Avoid clichés like 'nestled', 'charming', 'motivated seller', 'priced to sell'. "
        "Be specific, human, and platform-appropriate. Follow Fair Housing guidelines — never suggest preference "
        "for or against any protected class."
    )

    bv: dict = {}
    if req.session_id:
        bv_doc = await db.brand_voices.find_one({"session_id": req.session_id})
        if bv_doc:
            bv = {k: v for k, v in bv_doc.items() if k != "_id"}

    system += _build_brand_voice_block(bv)

    user_parts = [tmpl["prompt"]]
    if req.listing_notes and req.listing_notes.strip():
        user_parts.append(f"\nContext about this listing/situation:\n{req.listing_notes.strip()}")
    if bv.get("market"):
        user_parts.append(f"\nMarket context: {bv['market']}")

    try:
        output = await call_g0dm0d3(system, "\n".join(user_parts), tier="smart")
    except Exception:
        output = await call_openrouter(system, "\n".join(user_parts))

    return {"output": output.strip(), "template_id": req.template_id}


# Register all api_router routes with the app — placed AFTER all @api_router decorators
# so FastAPI's include_router snapshot captures every route defined above.
app.include_router(api_router)


@app.on_event("startup")
async def start_scheduler():
    from apscheduler.schedulers.asyncio import AsyncIOScheduler

    async def _fire_due_posts():
        now = datetime.now(timezone.utc)
        due = await db.scheduled_posts.find(
            {"status": "pending", "scheduled_at": {"$lte": now.isoformat()}},
            {"_id": 0}
        ).to_list(100)
        if not due:
            return
        from email_engine import send_email
        for post in due:
            try:
                platform = post.get("platform", "Social")
                note = post.get("note", "")
                body = f"""<p>⏰ Time to post on <strong>{platform}</strong>!</p>
{"<p><em>" + note + "</em></p>" if note else ""}
<p>Copy the content below and paste it into {platform}:</p>
<hr>
<pre style="background:#f5f5f5;padding:16px;border-radius:4px;white-space:pre-wrap;">{post['content']}</pre>
<p style="color:#999;font-size:12px;">Scheduled via ListWorks PRO</p>"""
                await send_email(
                    to=post["email"],
                    subject=f"Post time! Your {platform} content is ready",
                    body=body,
                )
                await db.scheduled_posts.update_one(
                    {"id": post["id"]},
                    {"$set": {"status": "reminder_sent", "fired_at": now.isoformat()}}
                )
                logging.info(f"[scheduler] Reminder sent for post {post['id']}")
            except Exception as e:
                logging.warning(f"[scheduler] Failed reminder for {post.get('id')}: {e}")

    scheduler = AsyncIOScheduler()
    scheduler.add_job(_fire_due_posts, "interval", minutes=15, id="post_reminders")
    scheduler.start()
    app.state.scheduler = scheduler
    logging.info("[scheduler] Post reminder scheduler started (15-min interval)")


@app.on_event("shutdown")
async def shutdown_db_client():
    if hasattr(app.state, "scheduler"):
        app.state.scheduler.shutdown(wait=False)
    client.close()
