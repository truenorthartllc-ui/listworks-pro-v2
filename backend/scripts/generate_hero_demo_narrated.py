"""
NARRATED hero demo with PER-SLIDE TTS sync.

The fix: instead of one long TTS that finishes too fast, generate ONE TTS
clip per slide and pad each with silence so each sentence lands exactly
when its slide is on screen.

Slides change every 7s (0, 7, 14, 21). Each sentence gets a 7s window.
"""
from __future__ import annotations

import asyncio
import base64
import os
import sys
import tempfile
from pathlib import Path

import httpx
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from video_engine import generate_listing_video  # noqa: E402

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

# Each sentence is timed for one ~7s slide
SLIDES = [
    {
        "text":     "Some homes you walk through. This one — you arrive at.",
        "narration":"Some homes... you just walk through. This one... you arrive at.",
    },
    {
        "text":     "The kitchen wasn't designed. It was earned.",
        "narration":"The kitchen wasn't designed. It was earned.",
    },
    {
        "text":     "A pool that turns Saturdays into memories.",
        "narration":"A pool that turns every Saturday into a memory.",
    },
    {
        "text":     "The address you stop searching at.",
        "narration":"This is the address you stop searching at. Schedule your private tour today.",
    },
]
SLIDE_DURATION = 7.0  # must match video_engine `per`

# Built-in lavfi anullsrc for silence padding
async def _run(cmd: list[str]) -> tuple[int, str]:
    proc = await asyncio.create_subprocess_exec(
        *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    _, stderr = await proc.communicate()
    return proc.returncode, stderr.decode("utf-8", "ignore")


async def _download(url: str, client: httpx.AsyncClient) -> bytes | None:
    try:
        r = await client.get(url, timeout=30.0, follow_redirects=True)
        r.raise_for_status()
        return r.content
    except Exception:
        return None


async def build_synced_voiceover(api_key: str, slides: list[dict], per: float) -> bytes:
    """Generate per-sentence TTS, pad each to `per` seconds, concat. Returns mp3 bytes."""
    from emergentintegrations.llm.openai import OpenAITextToSpeech

    tts = OpenAITextToSpeech(api_key=api_key)
    tmp = Path(tempfile.mkdtemp())
    padded_files = []

    for i, slide in enumerate(slides):
        # 1. Generate TTS for this sentence
        audio_bytes = await tts.generate_speech(
            text=slide["narration"], model="tts-1-hd", voice="nova", speed=0.95
        )
        raw_file = tmp / f"raw_{i}.mp3"
        raw_file.write_bytes(audio_bytes)

        # 2. Get its duration
        dur_proc = await asyncio.create_subprocess_exec(
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "csv=p=0", str(raw_file),
            stdout=asyncio.subprocess.PIPE,
        )
        dur_out, _ = await dur_proc.communicate()
        clip_dur = float(dur_out.decode().strip())

        # 3. Pad with silence so sentence starts ~0.4s in and total = per seconds
        lead_silence = 0.4
        trail_silence = max(0.1, per - clip_dur - lead_silence)
        padded = tmp / f"padded_{i}.mp3"
        await _run([
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(raw_file),
            "-af", (
                f"adelay={int(lead_silence * 1000)}|{int(lead_silence * 1000)},"
                f"apad=pad_dur={trail_silence},"
                "loudnorm=I=-14:TP=-1.5:LRA=11,"
                "aformat=channel_layouts=stereo,"
                f"atrim=end={per},"
                "asetpts=PTS-STARTPTS"
            ),
            "-ar", "44100", "-ac", "2", "-b:a", "192k",
            str(padded),
        ])
        padded_files.append(padded)
        print(f"     · slide {i+1} TTS: {clip_dur:.2f}s -> padded to {per}s")

    # 4. Concat all padded clips
    list_file = tmp / "concat.txt"
    list_file.write_text("\n".join(f"file '{p}'" for p in padded_files))
    final = tmp / "final.mp3"
    await _run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(list_file),
        "-c:a", "libmp3lame", "-b:a", "192k", "-ar", "44100", "-ac", "2",
        str(final),
    ])
    return final.read_bytes()


async def main() -> None:
    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not api_key:
        print("❌ EMERGENT_LLM_KEY not set"); sys.exit(1)

    print("📥 Downloading photos...")
    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(*[_download(u, client) for u in PHOTO_URLS])
    photos_b64 = [base64.b64encode(r).decode("ascii") for r in results if r]
    print(f"  ✓ {len(photos_b64)} photos")

    print("\n🎙️  Building per-slide synced voiceover (4 TTS clips)...")
    vo_mp3_bytes = await build_synced_voiceover(api_key, SLIDES, SLIDE_DURATION)
    vo_b64 = base64.b64encode(vo_mp3_bytes).decode("ascii")
    print(f"  ✓ synced voiceover: {len(vo_mp3_bytes)/1024:.0f} KB")

    print("\n🎬 Rendering NARRATED demo (voice locked to slides)...")
    result = await generate_listing_video(
        photos_b64=photos_b64,
        slides=[s["text"] for s in SLIDES],
        music_id="none",                     # voice-only — cleaner, no fighting
        voiceover_b64=vo_b64,                # pre-built synced track
        agent_name="ListWorks PRO",
        agent_brokerage="Generated in 8 seconds",
        fmt="16:9",
        api_key=api_key,
    )
    print(f"  ✓ rendered: id={result['id']} duration={result['duration']}s")

    backend = Path(__file__).resolve().parent.parent / "static" / "videos" / f"{result['id']}.mp4"
    frontend = Path(__file__).resolve().parent.parent.parent / "frontend" / "public" / "hero-demo-narrated.mp4"
    frontend.write_bytes(backend.read_bytes())
    print(f"\n✅ {frontend} ({frontend.stat().st_size/(1024*1024):.2f} MB)")


if __name__ == "__main__":
    asyncio.run(main())
