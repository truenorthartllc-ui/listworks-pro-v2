"""MuAPI image generator for ListWorks PRO reel pipeline."""
from __future__ import annotations

import asyncio
import os
import sys
from pathlib import Path
from typing import List, Optional

import httpx

MUAPI_BASE = "https://api.muapi.ai/api/v1"
DEFAULT_MODEL = "flux-dev"


async def _submit_and_poll(
    endpoint: str,
    payload: dict,
    api_key: str,
    max_polls: int = 120,
    interval: float = 2.0,
) -> dict:
    url = f"{MUAPI_BASE}/{endpoint}"
    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post(url, json=payload, headers={
            "Content-Type": "application/json",
            "x-api-key": api_key,
        })
        r.raise_for_status()
        data = r.json()
        request_id = data.get("request_id") or data.get("id")
        if not request_id:
            return data
        for _ in range(max_polls):
            await asyncio.sleep(interval)
            pr = await c.get(
                f"{MUAPI_BASE}/predictions/{request_id}/result",
                headers={"x-api-key": api_key},
            )
            if not pr.is_success:
                continue
            pr_data = pr.json()
            status = (pr_data.get("status") or "").lower()
            if status in ("completed", "succeeded", "success"):
                return pr_data
            if status in ("failed", "error"):
                raise RuntimeError(f"MuAPI gen failed: {pr_data.get('error', 'unknown')}")
        raise RuntimeError("MuAPI poll timed out")


async def generate_image(
    prompt: str,
    api_key: str,
    model: str = DEFAULT_MODEL,
    aspect_ratio: str = "16:9",
    output_path: Optional[Path] = None,
) -> bytes:
    payload = {"prompt": prompt, "model": model, "aspect_ratio": aspect_ratio}
    result = await _submit_and_poll(model, payload, api_key)
    url = (
        result.get("url")
        or (result.get("outputs") or [None])[0]
        or (result.get("output") or {}).get("url")
    )
    if not url:
        raise RuntimeError(f"No output URL: {str(result)[:300]}")
    async with httpx.AsyncClient(timeout=60) as c:
        r = await c.get(url)
        r.raise_for_status()
        data = r.content
    if output_path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_bytes(data)
    return data


async def generate_listing_images(
    listing_title: str,
    listing_description: str,
    api_key: str,
    model: str = DEFAULT_MODEL,
    count: int = 4,
) -> List[bytes]:
    prompts = [
        f"Real estate photo of {listing_title}. {listing_description}. Professional real estate photography, wide angle, natural lighting, high-end",
        f"Interior shot of {listing_title}. Modern kitchen and living room, bright natural light, professional staging",
        f"Exterior of {listing_title}. Curb appeal, well-maintained landscaping, professional real estate photo",
        f"Detail shot of {listing_title}. Living room or master bedroom, warm lighting, home feel",
    ]
    prompts = prompts[:count]
    tasks = [generate_image(p, api_key, model) for p in prompts]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    images = []
    for i, r in enumerate(results):
        if isinstance(r, Exception):
            print(f"  FAIL image {i}: {r}", file=sys.stderr)
        else:
            images.append(r)
    return images


if __name__ == "__main__":
    api_key = os.environ.get("MUAPI_API_KEY") or sys.argv[1] if len(sys.argv) > 1 else ""
    if not api_key:
        print("Usage: MUAPI_API_KEY=xxx python -m scripts.muapi_gen 'title' 'desc'")
        sys.exit(1)
    title = sys.argv[2] if len(sys.argv) > 2 else "Modern 3-bedroom home"
    desc = sys.argv[3] if len(sys.argv) > 3 else "Open floor plan, granite counters"
    images = asyncio.run(generate_listing_images(title, desc, api_key))
    print(f"Generated {len(images)} images")
    out_dir = Path("/tmp/muapi-gen")
    out_dir.mkdir(parents=True, exist_ok=True)
    for i, img in enumerate(images):
        p = out_dir / f"listing_{i}.jpg"
        p.write_bytes(img)
        print(f"  Saved {p} ({len(img)//1024} KB)")