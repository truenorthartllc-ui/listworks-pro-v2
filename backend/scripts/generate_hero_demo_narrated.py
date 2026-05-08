"""
ListWorks PRO hero demo — middle-class blue-collar relatable home.

Uses the 10 user-uploaded photos in /app/backend/static/demo_photos/.
Voice + slides written for a $300-$450K family home (the actual market).
"""
from __future__ import annotations

import asyncio
import base64
import os
import sys
import tempfile
from pathlib import Path

from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DEMO_PHOTOS_DIR = Path(__file__).resolve().parent.parent / "static" / "demo_photos"

# Re-written for middle-class relatable family home
NARRATION = (
    "Some homes... you walk through. "
    "This one... you come home to. "
    "The kitchen where homework gets done at the counter. "
    "A backyard the kids will outgrow before you do. "
    "Three bedrooms. Real closets. A garage that fits two cars and the bikes. "
    "This isn't the Pinterest house. "
    "This is the one your family actually lives in."
)

SLIDE_TEXTS = [
    "Some homes you walk through.",
    "This one — you come home to.",
    "Where homework gets done at the counter.",
    "A backyard the kids will outgrow.",
    "The home your family actually lives in.",
]


async def _run(cmd: list[str]) -> tuple[int, str]:
    proc = await asyncio.create_subprocess_exec(
        *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    _, stderr = await proc.communicate()
    return proc.returncode, stderr.decode("utf-8", "ignore")


async def detect_pauses(mp3_path: Path, min_silence_dur: float = 0.25,
                       silence_threshold_db: int = -32) -> list[float]:
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
    if not pauses or n_slides <= 1:
        return [total_duration]
    needed = n_slides - 1
    if len(pauses) < needed:
        seg = total_duration / n_slides
        return [seg] * n_slides
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
    durations = []
    prev = 0.0
    for t in chosen:
        d = max(0.5, round(t - prev, 2))
        durations.append(d)
        prev = prev + d
    last = max(1.0, round(total_duration - prev, 2))
    durations.append(last)
    return durations


def load_demo_photos() -> list[str]:
    """Load all photos from demo_photos dir as base64 strings."""
    photos = sorted(DEMO_PHOTOS_DIR.glob("*.jpg"))
    return [base64.b64encode(p.read_bytes()).decode("ascii") for p in photos if p.stat().st_size > 1000]


async def main() -> None:
    api_key = os.environ.get("EMERGENT_LLM_KEY", "")
    if not api_key:
        print("❌ EMERGENT_LLM_KEY not set"); sys.exit(1)

    photos_b64 = load_demo_photos()
    print(f"📥 Loaded {len(photos_b64)} relatable home photos")
    if len(photos_b64) < 5:
        print("❌ Need at least 5 photos in /app/backend/static/demo_photos/")
        sys.exit(1)

    from emergentintegrations.llm.openai import OpenAITextToSpeech
    print("\n🎙️  Generating narration (Nova @ 0.92)...")
    tts = OpenAITextToSpeech(api_key=api_key)
    audio_bytes = await tts.generate_speech(
        text=NARRATION, model="tts-1-hd", voice="nova", speed=0.92
    )
    tmp = Path(tempfile.mkdtemp())
    tts_raw = tmp / "tts.mp3"
    tts_raw.write_bytes(audio_bytes)

    proc = await asyncio.create_subprocess_exec(
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "csv=p=0", str(tts_raw),
        stdout=asyncio.subprocess.PIPE,
    )
    out, _ = await proc.communicate()
    tts_duration = float(out.decode().strip())
    print(f"  ✓ TTS: {tts_duration:.2f}s")

    tts_final = tmp / "tts_final.mp3"
    await _run([
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(tts_raw),
        "-af", "loudnorm=I=-14:TP=-1.5:LRA=11,aformat=channel_layouts=stereo",
        "-c:a", "libmp3lame", "-b:a", "192k", "-ar", "44100", "-ac", "2",
        str(tts_final),
    ])

    pauses = await detect_pauses(tts_final)
    n_slides = len(SLIDE_TEXTS)
    durations = derive_slide_durations(pauses, tts_duration, n_slides)
    print(f"  ✓ slide durations: {durations}")

    # Render
    print("\n🎬 Rendering...")
    out_video = await render_video(
        photos_b64=photos_b64[:n_slides],
        slide_texts=SLIDE_TEXTS,
        slide_durations=durations,
        voice_path=tts_final,
        tmp=tmp,
    )

    frontend = Path(__file__).resolve().parent.parent.parent / "frontend" / "public" / "hero-demo-narrated.mp4"
    frontend.write_bytes(out_video.read_bytes())
    # Also copy to /hero-demo.mp4 (the main one) so we have one consistent video
    main_video = Path(__file__).resolve().parent.parent.parent / "frontend" / "public" / "hero-demo.mp4"
    main_video.write_bytes(out_video.read_bytes())
    print(f"\n✅ {frontend} ({frontend.stat().st_size/(1024*1024):.2f} MB)")
    print(f"✅ {main_video}")


async def render_video(photos_b64, slide_texts, slide_durations, voice_path, tmp,
                       width=1920, height=1080, fps=30):
    from PIL import Image, ImageDraw, ImageFont
    import io as _io

    SLIDE_DIR = tmp / "slides"
    SLIDE_DIR.mkdir(exist_ok=True)
    fonts_dir = Path(__file__).resolve().parent.parent / "static" / "fonts"
    title_font_path = next(iter(fonts_dir.glob("*.ttf")), None)

    slide_files = []
    for i, (b64, txt) in enumerate(zip(photos_b64, slide_texts)):
        img_bytes = base64.b64decode(b64)
        img = Image.open(_io.BytesIO(img_bytes)).convert("RGB")
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

        overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        for y in range(int(height * 0.55), height):
            alpha = int(180 * ((y - height * 0.55) / (height * 0.45)) ** 1.6)
            od.line([(0, y), (width, y)], fill=(0, 0, 0, alpha))
        img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

        d = ImageDraw.Draw(img)
        try:
            font = ImageFont.truetype(str(title_font_path), size=84) if title_font_path else ImageFont.load_default()
        except Exception:
            font = ImageFont.load_default()
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
            d.text((x + 2, y + 3), line, font=font, fill=(0, 0, 0))
            d.text((x, y), line, font=font, fill=(255, 255, 255))

        sf = SLIDE_DIR / f"slide_{i}.jpg"
        img.save(sf, "JPEG", quality=92)
        slide_files.append(sf)

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

    concat_list = tmp / "concat.txt"
    concat_list.write_text("\n".join(f"file '{c}'" for c in clips))
    video_only = tmp / "video.mp4"
    await _run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(concat_list),
        "-c", "copy", str(video_only),
    ])

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
