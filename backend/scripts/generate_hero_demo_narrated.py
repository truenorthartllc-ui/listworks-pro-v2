"""
Hero demo — music + photos + text. No TTS. Clean, solid, ships.
"""
from __future__ import annotations

import asyncio
import base64
import sys
import tempfile
from pathlib import Path

from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

DEMO_PHOTOS_DIR = Path(__file__).resolve().parent.parent / "static" / "demo_photos"
MUSIC_FILE = Path(__file__).resolve().parent.parent / "static" / "music" / "cinematic.mp3"

# 7 universal emotional slides — work with ANY photo order, no room references
SLIDES = [
    ("This isn't another listing.",          5.0),
    ("It's the one they remember.",          4.5),
    ("Real homes. Real families.",           4.5),
    ("Built for the way you live.",          4.5),
    ("The address you stop searching at.",   5.5),
]


async def _run(cmd: list[str]) -> tuple[int, str]:
    proc = await asyncio.create_subprocess_exec(
        *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    _, stderr = await proc.communicate()
    return proc.returncode, stderr.decode("utf-8", "ignore")


def load_photos() -> list[bytes]:
    photos = sorted(DEMO_PHOTOS_DIR.glob("*.jpg"))
    return [p.read_bytes() for p in photos if p.stat().st_size > 1000]


async def render_video(photos: list[bytes], slides: list[tuple[str, float]],
                       music_path: Path, tmp: Path,
                       width: int = 1920, height: int = 1080, fps: int = 30) -> Path:
    from PIL import Image, ImageDraw, ImageFont
    import io as _io

    SLIDE_DIR = tmp / "slides"
    SLIDE_DIR.mkdir(exist_ok=True)
    fonts_dir = Path(__file__).resolve().parent.parent / "static" / "fonts"
    title_font_path = next(iter(fonts_dir.glob("*.ttf")), None)

    slide_files = []
    for i, (raw, (txt, _dur)) in enumerate(zip(photos, slides)):
        img = Image.open(_io.BytesIO(raw)).convert("RGB")
        # Cover-fit
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

        # Bottom darken gradient
        overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        od = ImageDraw.Draw(overlay)
        for y in range(int(height * 0.55), height):
            alpha = int(190 * ((y - height * 0.55) / (height * 0.45)) ** 1.5)
            od.line([(0, y), (width, y)], fill=(0, 0, 0, alpha))
        img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

        d = ImageDraw.Draw(img)
        try:
            font = ImageFont.truetype(str(title_font_path), size=88) if title_font_path else ImageFont.load_default()
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

        line_h = 100
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

    # Render clips with fade in/out and slow zoom
    clips = []
    for i, (sf, (_txt, dur)) in enumerate(zip(slide_files, slides)):
        clip = tmp / f"clip{i}.mp4"
        fade = min(0.7, dur / 4)
        zoom = (
            f"scale={width*2}:{height*2},"
            f"zoompan=z='min(zoom+0.0006,1.06)':d={int(dur*fps)}:"
            f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
            f"s={width}x{height}:fps={fps},"
            f"format=yuv420p,"
            f"fade=t=in:st=0:d={fade},"
            f"fade=t=out:st={dur-fade}:d={fade}"
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

    # Concat
    concat_list = tmp / "concat.txt"
    concat_list.write_text("\n".join(f"file '{c}'" for c in clips))
    video_only = tmp / "video.mp4"
    await _run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-f", "concat", "-safe", "0", "-i", str(concat_list),
        "-c", "copy", str(video_only),
    ])

    # Total duration
    total = sum(d for _, d in slides)

    # Music: trim/loop to total, fade in/out, normalize
    music_track = tmp / "music.mp3"
    await _run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-stream_loop", "-1", "-i", str(music_path),
        "-t", f"{total}",
        "-af", (
            f"afade=t=in:st=0:d=2,"
            f"afade=t=out:st={total-2}:d=2,"
            f"loudnorm=I=-14:TP=-1.5:LRA=11,"
            f"aformat=channel_layouts=stereo"
        ),
        "-ar", "44100", "-ac", "2", "-b:a", "192k",
        str(music_track),
    ])

    final = tmp / "final.mp4"
    await _run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", str(video_only),
        "-i", str(music_track),
        "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k",
        "-shortest",
        "-movflags", "+faststart",
        str(final),
    ])
    return final


async def main() -> None:
    photos = load_photos()
    print(f"📥 {len(photos)} photos loaded")
    if len(photos) < len(SLIDES):
        print(f"❌ Need at least {len(SLIDES)} photos"); sys.exit(1)
    if not MUSIC_FILE.exists():
        print(f"❌ Music file missing: {MUSIC_FILE}"); sys.exit(1)

    tmp = Path(tempfile.mkdtemp())
    print("🎬 Rendering...")
    out = await render_video(photos[:len(SLIDES)], SLIDES, MUSIC_FILE, tmp)

    pub = Path(__file__).resolve().parent.parent.parent / "frontend" / "public"
    main_video = pub / "hero-demo.mp4"
    narrated = pub / "hero-demo-narrated.mp4"
    main_video.write_bytes(out.read_bytes())
    narrated.write_bytes(out.read_bytes())  # same file — frontend can keep both names

    # Poster from middle of video
    await _run([
        "ffmpeg", "-y", "-loglevel", "error",
        "-i", str(main_video), "-ss", "00:00:03", "-frames:v", "1", "-q:v", "2",
        str(pub / "hero-demo-poster.jpg"),
    ])
    size_mb = main_video.stat().st_size / (1024 * 1024)
    print(f"✅ {main_video} ({size_mb:.2f} MB)")


if __name__ == "__main__":
    asyncio.run(main())
