"""
Generates the NARRATED hero demo — same 10 luxury photos, but with a confident
female agent voiceover (OpenAI TTS-1-HD, "nova" voice) selling the listing.

The script is timed to ~28 seconds at natural speaking pace (~155 wpm).
"""
from __future__ import annotations

import asyncio
import base64
import os
import sys
from pathlib import Path

import httpx
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from video_engine import generate_listing_video  # noqa: E402

PHOTO_URLS = [
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=1920&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1920&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1920&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1920&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=1920&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1920&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1605276373954-0c4a0dac5b12?w=1920&q=85&auto=format&fit=crop",
]

# Slide texts — they appear ON the photos, in sync with what the voice says
SLIDE_TEXTS = [
    "Some homes you walk through. This one — you arrive at.",
    "The kitchen wasn't designed. It was earned.",
    "A pool that turns Saturdays into memories.",
    "The address you stop searching at.",
]

# 28-second narration — confident, warm, human. Sells without overselling.
# Each sentence is timed to land on its matching slide (~7s per slide).
VOICEOVER_SCRIPT = (
    "Some homes you walk through. This one... you arrive at. "
    "The kitchen wasn't designed — it was earned. "
    "A pool that turns every Saturday into a memory. "
    "This isn't another listing. This is the address you stop searching at. "
    "Schedule your private tour today."
)


async def _download(url: str, client: httpx.AsyncClient) -> bytes | None:
    try:
        r = await client.get(url, timeout=30.0, follow_redirects=True)
        r.raise_for_status()
        return r.content
    except Exception as e:
        print(f"  ✗ download failed: {url[:60]}... — {e}")
        return None


async def main() -> None:
    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not api_key:
        print("❌ EMERGENT_LLM_KEY not set — cannot generate voiceover")
        sys.exit(1)

    print("📥 Downloading 10 luxury photos from Unsplash...")
    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(*[_download(u, client) for u in PHOTO_URLS])
    photos_b64 = [base64.b64encode(r).decode("ascii") for r in results if r]
    print(f"  ✓ {len(photos_b64)} photos downloaded")

    if len(photos_b64) < 4:
        print(f"❌ Only got {len(photos_b64)} photos — aborting")
        sys.exit(1)

    print(f"\n🎙️  Generating female narration (nova) — {len(VOICEOVER_SCRIPT)} chars...")
    print(f"\n🎬 Rendering NARRATED demo with music duck...")
    result = await generate_listing_video(
        photos_b64=photos_b64,
        slides=SLIDE_TEXTS,
        music_id="cinematic",
        voiceover_text=VOICEOVER_SCRIPT,
        agent_name="ListWorks PRO",
        agent_brokerage="Generated in 8 seconds",
        fmt="16:9",
        api_key=api_key,
    )
    print(f"  ✓ rendered: id={result['id']}  duration={result['duration']}s")

    backend_path = (
        Path(__file__).resolve().parent.parent / "static" / "videos" / f"{result['id']}.mp4"
    )
    frontend_path = (
        Path(__file__).resolve().parent.parent.parent
        / "frontend"
        / "public"
        / "hero-demo-narrated.mp4"
    )
    if not backend_path.exists():
        print(f"❌ Rendered file not found: {backend_path}")
        sys.exit(1)

    frontend_path.parent.mkdir(parents=True, exist_ok=True)
    frontend_path.write_bytes(backend_path.read_bytes())
    size_mb = frontend_path.stat().st_size / (1024 * 1024)
    print(f"\n✅ Narrated demo deployed: {frontend_path} ({size_mb:.2f} MB)")


if __name__ == "__main__":
    asyncio.run(main())
