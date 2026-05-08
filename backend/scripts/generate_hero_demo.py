"""
Generates the hero demo video for the listworks.pro homepage.

Workflow:
  1. Download 10 hand-picked luxury real estate photos from Unsplash (free commercial use)
  2. Encode them as base64
  3. Generate cinematic slide copy via Claude (or use curated fallback text)
  4. Render a 30-second cinematic MP4 via the existing video_engine
  5. Save the result to /app/frontend/public/hero-demo.mp4 so it ships with the React build

Run:  python -m scripts.generate_hero_demo
"""
from __future__ import annotations

import asyncio
import base64
import sys
from pathlib import Path

import httpx

# Add parent dir so we can import video_engine
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from video_engine import generate_listing_video  # noqa: E402


# Curated luxury real estate photos (Unsplash — free commercial use)
# Each URL uses the &w=1920&q=85 size hint for high-res, manageable file size.
PHOTO_URLS = [
    # Aerial drone-style middle-class to upper-class home shots
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1920&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1920&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1920&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1920&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1920&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=1920&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1920&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1920&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1605276373954-0c4a0dac5b12?w=1920&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1592595896616-c37162298647?w=1920&q=85&auto=format&fit=crop",
]


SLIDE_TEXTS = [
    "Some homes you walk through. This one — you arrive at.",
    "The kitchen wasn't designed. It was earned.",
    "A pool that turns Saturdays into memories.",
    "The address you stop searching at.",
]


async def _download(url: str, client: httpx.AsyncClient) -> bytes | None:
    try:
        r = await client.get(url, timeout=30.0, follow_redirects=True)
        r.raise_for_status()
        return r.content
    except Exception as e:
        print(f"  ✗ download failed: {url[:60]}... — {e}")
        return None


async def main() -> None:
    print("📥 Downloading 10 luxury photos from Unsplash...")
    photos_b64: list[str] = []
    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(*[_download(u, client) for u in PHOTO_URLS])
    for i, raw in enumerate(results, 1):
        if not raw:
            continue
        photos_b64.append(base64.b64encode(raw).decode("ascii"))
        size_kb = len(raw) // 1024
        print(f"  ✓ photo {i}: {size_kb} KB")

    if len(photos_b64) < 4:
        print(f"❌ Only got {len(photos_b64)} photos — aborting (need at least 4)")
        sys.exit(1)

    print(f"\n🎬 Rendering cinematic demo with {len(photos_b64)} photos...")
    result = await generate_listing_video(
        photos_b64=photos_b64,
        slides=SLIDE_TEXTS,
        music_id="cinematic",
        agent_name="ListWorks PRO",
        agent_brokerage="Generated in 8 seconds",
        fmt="16:9",
    )
    print(f"  ✓ rendered: id={result['id']}  duration={result['duration']}s")

    # Move from backend static to frontend public so it ships with React build
    backend_path = Path(__file__).resolve().parent.parent / "static" / "videos" / f"{result['id']}.mp4"
    frontend_path = Path(__file__).resolve().parent.parent.parent / "frontend" / "public" / "hero-demo.mp4"
    if not backend_path.exists():
        print(f"❌ Rendered file not found: {backend_path}")
        sys.exit(1)

    frontend_path.parent.mkdir(parents=True, exist_ok=True)
    frontend_path.write_bytes(backend_path.read_bytes())
    size_mb = frontend_path.stat().st_size / (1024 * 1024)
    print(f"\n✅ Hero demo deployed:")
    print(f"   {frontend_path}")
    print(f"   {size_mb:.2f} MB")
    print(f"\nNext: reference as <video src=\"/hero-demo.mp4\" /> in the React Hero component.")


if __name__ == "__main__":
    asyncio.run(main())
