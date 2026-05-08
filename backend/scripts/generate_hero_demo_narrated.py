"""
ListWorks PRO hero demo — voice-only, ONE flowing TTS, slides timed to match.

Approach:
  1. Generate ONE continuous TTS (Nova, slower speed for emotion + flow)
  2. Detect natural pauses in the audio (silence_detect) — these become slide change points
  3. Render the video with N slides, each lasting until the next natural pause
  4. No music, no padding, no chunking — pure cinematic voice over aerial photos
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

PHOTO_URLS = [
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

# ONE continuous narration. Periods + commas + ellipses give natural pauses
# that TTS-1-HD respects. Read it aloud and time it: ~28-32 seconds at speed=0.92.
NARRATION = (
    "Some homes... you walk through. "
    "This one... you arrive at. "
    "The kitchen wasn't designed — it was earned. "
    "A pool that turns every Saturday into a memory. "
    "Four bedrooms. Spa-level baths. "
    "Sunsets that stop conversations. "
    "This isn't another listing. "
    "This is the address you stop searching at."
)

# Each line in NARRATION corresponds to one slide on screen.
SLIDE_TEXTS = [
    "Some homes you walk through.",
    "This one — you arrive at.",
    "Earned, not designed.",
    "Saturdays become memories.",
    "The address you stop searching at.",
]


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


async def detect_pauses(mp3_path: Path, min_silence_dur: float = 0.25,
                       silence_threshold_db: int = -32) -> list[float]:
    """Return timestamps (in seconds) where silence ENDS — meaning where
    the voice resumes after a pause. These are the natural sentence boundaries."""
    proc = await asyncio.create_subprocess_exec(
        "ffmpeg", "-i", str(mp3_path),
        "-af", f"silencedetect=noise={silence_threshold_db}dB:d={min_silence_dur}",
        "-f", "null", "-",
        stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()
    pauses = []
    for line in stderr.decode().split("\n"):
        if "silence_end" in line:
            try:
                t = float(line.split("silence_end:")[1].split("|")[0].strip())
                pauses.append(t)
            except Exception:
                pass
    return pauses


def derive_slide_durations(pauses: list[float], total_duration: float,
                          n_slides: int) -> list[float]:
    """Given pause timestamps + total audio duration + how many slides we want,
    return a list of slide durations that flow with the voice's natural pauses."""
    # Pick the n_slides-1 pauses that best partition the audio into equal-ish
    # chunks. This means slides change WHERE the voice naturally pauses.
    if not pauses or n_slides <= 1:
        return [total_duration]

    # We need n_slides-1 transition points
    needed = n_slides - 1
    if len(pauses) < needed:
        # Not enough natural pauses — distribute evenly
        seg = total_duration / n_slides
        return [seg] * n_slides

    # Pick pauses closest to evenly-distributed time markers
    targets = [(i + 1) * total_duration / n_slides for i in range(needed)]
    chosen = []
    used_indices = set()
    for tgt in targets:
        best_i = -1
        best_dist = 1e9
        for i, p in enumerate(pauses):
            if i in used_indices:
                continue
            d = abs(p - tgt)
            if d < best_dist:
                best_dist = d
                best_i = i
        if best_i >= 0:
            chosen.append(pauses[best_i])
            used_indices.add(best_i)
    chosen.sort()

    # Convert transition points to durations (clamp last to be >= 1.0s)
    durations = []
    prev = 0.0
    for t in chosen:
        d = max(0.5, round(t - prev, 2))
        durations.append(d)
        prev = prev + d  # advance by what we actually allocated
    last = max(1.0, round(total_duration - prev, 2))
    durations.append(last)
    return durations


async def main() -> None:
    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not api_key:
        print("❌ EMERGENT_LLM_KEY not set"); sys.exit(1)

    print("📥 Downloading aerial photos...")
    async with httpx.AsyncClient() as client:
        results = await asyncio.gather(*[_download(u, client) for u in PHOTO_URLS])
    photos_b64 = [base64.b64encode(r).decode("ascii") for r in results if r]
    print(f"  ✓ {len(photos_b64)} photos")

    # 1) Generate ONE continuous TTS — no chunking
    from emergentintegrations.llm.openai import OpenAITextToSpeech
    print("\n🎙️  Generating ONE continuous TTS (Nova @ speed 0.92)...")
    tts = OpenAITextToSpeech(api_key=api_key)
    audio_bytes = await tts.generate_speech(
        text=NARRATION, model="tts-1-hd", voice="nova", speed=0.92
    )
    tmp = Path(tempfile.mkdtemp())
    tts_raw = tmp / "tts.mp3"
    tts_raw.write_bytes(audio_bytes)

    # Get duration
    proc = await asyncio.create_subprocess_exec(
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "csv=p=0", str(tts_raw),
        stdout=asyncio.subprocess.PIPE,
    )
    out, _ = await proc.communicate()
    tts_duration = float(out.decode().strip())
    print(f"  ✓ TTS rendered: {tts_duration:.2f}s of natural narration")

    # Loudnorm + slight reverb for warmth (NO truncation, NO padding between)
    tts_final = tmp / "tts_final.mp3"
    await _run([
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(tts_raw),
        "-af",
        # Soft tail of room reverb so the voice has space, then loudnorm
        "aecho=0.4:0.4:60:0.15,"
        "loudnorm=I=-14:TP=-1.5:LRA=11,"
        "aformat=channel_layouts=stereo",
        "-c:a", "libmp3lame", "-b:a", "192k", "-ar", "44100", "-ac", "2",
        str(tts_final),
    ])

    # 2) Detect natural pauses → derive slide durations
    pauses = await detect_pauses(tts_final)
    n_slides = len(SLIDE_TEXTS)
    durations = derive_slide_durations(pauses, tts_duration, n_slides)
    print(f"  ✓ pauses detected: {len(pauses)} | slide durations: {durations}")

    # 3) Render video with custom per-slide durations
    # video_engine doesn't support per-slide durations natively, so we'll
    # use it but pass total duration via a custom approach.
    # Quickest path: render images as one ffmpeg pipeline directly here.
    print("\n🎬 Rendering aerial video (slides timed to natural voice pauses)...")
    out_video = await render_video_with_voice(
        photos_b64=photos_b64[:n_slides],
        slide_texts=SLIDE_TEXTS,
        slide_durations=durations,
        voice_path=tts_final,
        tmp=tmp,
    )

    # 4) Deploy
    frontend = Path(__file__).resolve().parent.parent.parent / "frontend" / "public" / "hero-demo-narrated.mp4"
    frontend.write_bytes(out_video.read_bytes())
    print(f"\n✅ {frontend} ({frontend.stat().st_size/(1024*1024):.2f} MB)")


# ----------------------------------------------------------------------------
# Custom video renderer — supports variable per-slide durations + smooth fades
# ----------------------------------------------------------------------------

async def render_video_with_voice(
    photos_b64: list[str],
    slide_texts: list[str],
    slide_durations: list[float],
    voice_path: Path,
    tmp: Path,
    width: int = 1920,
    height: int = 1080,
    fps: int = 30,
) -> Path:
    """Render aerial video with per-slide variable durations + soft fades + voice."""
    from PIL import Image, ImageDraw, ImageFont
    import io

    # Save base photos and overlay text on each
    SLIDE_DIR = tmp / "slides"
    SLIDE_DIR.mkdir(exist_ok=True)

    fonts_dir = Path(__file__).resolve().parent.parent / "static" / "fonts"
    title_font_path = next(iter(fonts_dir.glob("*.ttf")), None)

    slide_files = []
    for i, (b64, txt) in enumerate(zip(photos_b64, slide_texts)):
        img_bytes = base64.b64decode(b64)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        # Cover-fit to 1920x1080
        ratio_src = img.width / img.height
        ratio_dst = width / height
        if ratio_src > ratio_dst:
            new_w = int(img.height * ratio_dst)
            offset = (img.width - new_w) // 2
            img = img.crop((offset, 0, offset + new_w, img.height))
        else:
            new_h = int(img.width / ratio_dst)
            offset = (img.height - new_h) // 2
            img = img.crop((0, offset, img.width, offset + new_h))
        img = img.resize((width, height), Image.LANCZOS)

        # Subtle dark gradient overlay on bottom for text legibility
        overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        for y in range(int(height * 0.55), height):
            alpha = int(180 * ((y - height * 0.55) / (height * 0.45)) ** 1.6)
            od.line([(0, y), (width, y)], fill=(0, 0, 0, alpha))
        img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

        # Big serif text
        d = ImageDraw.Draw(img)
        try:
            font = ImageFont.truetype(str(title_font_path), size=84) if title_font_path else ImageFont.load_default()
        except Exception:
            font = ImageFont.load_default()
        # Wrap text manually if needed (simple version)
        words = txt.split()
        lines, cur = [], ""
        for w in words:
            test = (cur + " " + w).strip()
            bbox = d.textbbox((0, 0), test, font=font)
            if (bbox[2] - bbox[0]) > width * 0.85:
                if cur:
                    lines.append(cur)
                cur = w
            else:
                cur = test
        if cur:
            lines.append(cur)

        line_h = 96
        total_h = line_h * len(lines)
        y0 = int(height * 0.78) - total_h // 2
        for li, line in enumerate(lines):
            bbox = d.textbbox((0, 0), line, font=font)
            w_line = bbox[2] - bbox[0]
            x = (width - w_line) // 2
            y = y0 + li * line_h
            # Soft drop shadow for legibility
            d.text((x + 2, y + 3), line, font=font, fill=(0, 0, 0))
            d.text((x, y), line, font=font, fill=(255, 255, 255))

        sf = SLIDE_DIR / f"slide_{i}.jpg"
        img.save(sf, "JPEG", quality=92)
        slide_files.append(sf)

    # Render each slide as a clip with ken-burns + fade in/out
    clips = []
    for i, (sf, dur) in enumerate(zip(slide_files, slide_durations)):
        clip = tmp / f"clip{i}.mp4"
        fade_dur = min(0.6, dur / 4)
        zoom = (
            f"scale={width*2}:{height*2},"
            f"zoompan=z='min(zoom+0.0006,1.06)':d={int(dur*fps)}:"
            f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
            f"s={width}x{height}:fps={fps},"
            f"format=yuv420p,"
            f"fade=t=in:st=0:d={fade_dur},"
            f"fade=t=out:st={dur-fade_dur}:d={fade_dur}"
        )
        await _run([
            "ffmpeg", "-y", "-loglevel", "error",
            "-loop", "1", "-i", str(sf),
            "-t", f"{dur}",
            "-vf", zoom,
            "-r", f"{fps}",
            "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-preset", "veryfast", "-crf", "21",
            str(clip),
        ])
        clips.append(clip)

    # Concat clips
    concat_list = tmp / "concat.txt"
    concat_list.write_text("\n".join(f"file '{c}'" for c in clips))
    video_only = tmp / "video.mp4"
    await _run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(concat_list),
        "-c", "copy", str(video_only),
    ])

    # Mux video + voice (the voice is the ONLY audio — no music fight)
    final = tmp / "final.mp4"
    await _run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", str(video_only),
        "-i", str(voice_path),
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        "-movflags", "+faststart",
        str(final),
    ])
    return final


if __name__ == "__main__":
    asyncio.run(main())
