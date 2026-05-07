from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
import re
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI(title="ListWorks PRO API")
api_router = APIRouter(prefix="/api")


# ============== MODELS ==============
class RewriteRequest(BaseModel):
    raw_listing: str
    tone: str = "Modern"  # Luxury, Cozy, Modern, Family, Investor
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
    tone: str
    raw_listing: str
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


# ============== AI HELPERS ==============
TONE_GUIDE = {
    "Luxury": "Refined, aspirational, evocative. Use cinematic adjectives. Speak to status, exclusivity, and timelessness.",
    "Cozy": "Warm, inviting, family-forward. Emphasize comfort, quiet mornings, gathering, and home-feel.",
    "Modern": "Clean, confident, design-aware. Highlight architecture, light, lines, and lifestyle.",
    "Family": "Friendly, practical, neighborhood-aware. Emphasize schools, yard, room to grow, safety.",
    "Investor": "Data-forward, ROI-aware. Emphasize cap rate potential, rental comps, location upside, low maintenance.",
}

REWRITE_SYSTEM = """You are ListWorks PRO — the world's best real estate copywriter.
You transform boring property listings into scroll-stopping copy using the Feature → Benefit → Feeling framework.
You write copy that actually closes deals 2-3 weeks faster.

Rules:
- Never use clichés like "must see", "won't last long", "priced to sell"
- Translate features into feelings (e.g., "marble counters" → "the kind of kitchen where Sunday breakfast lasts until noon")
- Use sensory language and lifestyle hooks
- Match the tone exactly
- Output STRICT JSON only — no markdown, no commentary

JSON schema:
{
  "mls": "120-150 words. Professional MLS description. Hook → lifestyle → features-as-feelings → neighborhood → CTA.",
  "instagram": "70-90 words. Punchy, scroll-stopping. Use line breaks and 4-6 relevant hashtags at the end.",
  "facebook": "80-120 words. Conversational, story-driven. Ask a question to drive comments.",
  "headlines": ["5 distinct scroll-stopping headlines, max 12 words each, emotional and specific"],
  "email": "100-140 words. Subject line first as 'Subject: ...' on its own line. Then body. Personal, warm, confident."
}"""


def _strip_json(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?", "", text).strip()
        if text.endswith("```"):
            text = text[:-3].strip()
    # extract first {...} block
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        text = text[start:end+1]
    return text


async def call_rewrite_llm(req: RewriteRequest) -> Dict[str, Any]:
    if not EMERGENT_LLM_KEY:
        raise HTTPException(500, "LLM key missing")

    tone_desc = TONE_GUIDE.get(req.tone, TONE_GUIDE["Modern"])
    meta = []
    if req.address: meta.append(f"Address: {req.address}")
    if req.price: meta.append(f"Price: {req.price}")
    if req.beds: meta.append(f"Beds: {req.beds}")
    if req.baths: meta.append(f"Baths: {req.baths}")
    if req.sqft: meta.append(f"Sqft: {req.sqft}")
    meta_str = "\n".join(meta) if meta else "No metadata provided."

    prompt = f"""TONE: {req.tone}
TONE GUIDE: {tone_desc}

PROPERTY METADATA:
{meta_str}

RAW / BORING LISTING:
{req.raw_listing}

Now produce the JSON object. JSON only."""

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=req.session_id or str(uuid.uuid4()),
        system_message=REWRITE_SYSTEM,
    ).with_model("openai", "gpt-5.2")

    response = await chat.send_message(UserMessage(text=prompt))
    cleaned = _strip_json(response)
    try:
        data = json.loads(cleaned)
    except Exception as e:
        logging.exception("JSON parse failed")
        raise HTTPException(500, f"AI returned invalid JSON: {str(e)[:120]}")

    # normalize
    headlines = data.get("headlines", [])
    if isinstance(headlines, str):
        headlines = [h.strip("- •*").strip() for h in headlines.split("\n") if h.strip()]
    return {
        "mls": data.get("mls", "").strip(),
        "instagram": data.get("instagram", "").strip(),
        "facebook": data.get("facebook", "").strip(),
        "headlines": [h.strip() for h in headlines if h.strip()][:6],
        "email": data.get("email", "").strip(),
    }


# ============== ROUTES ==============
@api_router.get("/")
async def root():
    return {"app": "ListWorks PRO", "status": "live"}


@api_router.post("/rewrite", response_model=RewriteOutput)
async def rewrite_listing(req: RewriteRequest):
    if len(req.raw_listing.strip()) < 10:
        raise HTTPException(400, "Listing too short. Add at least a sentence.")

    outputs = await call_rewrite_llm(req)
    listing_id = str(uuid.uuid4())
    created_at = datetime.now(timezone.utc).isoformat()

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


@api_router.post("/analyze-photo", response_model=PhotoAnalyzeResponse)
async def analyze_photo(req: PhotoAnalyzeRequest):
    if not EMERGENT_LLM_KEY:
        raise HTTPException(500, "LLM key missing")

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=str(uuid.uuid4()),
        system_message=(
            "You analyze real estate property photos. "
            "Return STRICT JSON: {\"features\":[8 short property features detected, "
            "e.g. 'marble counters','hardwood floors','vaulted ceilings'],"
            "\"style\":\"one short style label like 'Modern Farmhouse'\","
            "\"suggested_headline\":\"a single 10-word emotional headline for this property\"}"
        ),
    ).with_model("openai", "gpt-5.2")

    image = ImageContent(image_base64=req.image_base64)
    response = await chat.send_message(UserMessage(
        text="Analyze this property photo. JSON only.",
        file_contents=[image],
    ))
    cleaned = _strip_json(response)
    try:
        data = json.loads(cleaned)
    except Exception:
        raise HTTPException(500, "Photo analysis failed to parse")

    return PhotoAnalyzeResponse(
        features=[f.strip() for f in data.get("features", []) if isinstance(f, str)][:8],
        style=str(data.get("style", "")).strip(),
        suggested_headline=str(data.get("suggested_headline", "")).strip(),
    )


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
