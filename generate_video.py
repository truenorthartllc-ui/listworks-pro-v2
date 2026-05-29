"""Standalone video generator — generates hero-demo.mp4 from demo photos."""
import subprocess
import os
import sys
import tempfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import base64
import struct
import wave
import math

# Config
WIDTH, HEIGHT = 1080, 1920
FPS = 30
PER_SLIDE = 2.5  # seconds per slide
SLIDES = [
    "Sunday pancakes and slow weekends",
    "This kitchen earns them.",
    "Three beds. Two baths. One home worth writing about.",
    "Try it free → listworks.pro",
]
PHOTOS = [
    f"frontend/public/demo-photos/photo_{i:02d}.jpg"
    for i in range(1, 11)
]
MUSIC = "backend/static/music/cinematic.mp3"
FONT = "backend/static/fonts/DejaVuSerif-Bold.ttf"
OUTPUT = "frontend/public/hero-demo-narrated.mp4"

def run(cmd, cwd=None):
    print(f"  CMD: {' '.join(cmd[:5])}...")
    subprocess.run(cmd, check=True, capture_output=True, cwd=cwd)

def render_slide(photo_path, text, out_path, w=WIDTH, h=HEIGHT):
    """Render a JPEG frame."""
    img = Image.open(photo_path).convert("RGB")
    src_ratio = img.width / img.height
    dst_ratio = w / h
    if src_ratio > dst_ratio:
        new_h, new_w = h, int(h * src_ratio)
    else:
        new_w, new_h = w, int(w / src_ratio)
    img = img.resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - w) // 2
    top = (new_h - h) // 2
    img = img.crop((left, top, left + w, top + h))

    draw = ImageDraw.Draw(img)
    # Bottom gradient
    for y in range(h - 400, h):
        alpha = min(255, int((y - (h - 400)) / 400 * 220))
        draw.rectangle([(0, y), (w, y + 1)], fill=(0, 0, 0, alpha))

    # Text
    try:
        font = ImageFont.truetype(FONT, 72)
        small = ImageFont.truetype(FONT, 36)
    except:
        font = ImageFont.load_default()
        small = font

    # Wrap text
    words = text.split()
    lines, line = [], []
    for word in words:
        test = ' '.join(line + [word])
        bbox = draw.textbbox((0, 0), test, font=font)
        if bbox[2] > w - 80:
            lines.append(' '.join(line))
            line = [word]
        else:
            line.append(word)
    if line:
        lines.append(' '.join(line))

    y = h - 280
    for ln in lines:
        bbox = draw.textbbox((0, 0), ln, font=font)
        x = (w - (bbox[2] - bbox[0])) // 2
        draw.text((x, y), ln, font=font, fill=(255, 255, 255, 255))
        y += 90

    img.save(out_path, "JPEG", quality=92)
    print(f"  Slide: {out_path.name} ({img.width}x{img.height})")

def main():
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        clips = []

        for i, (photo, text) in enumerate(zip(PHOTOS, SLIDES)):
            photo_path = Path(photo)
            if not photo_path.exists():
                print(f"  SKIP {photo} — not found")
                continue

            sf = tmp / f"slide_{i:02d}.jpg"
            render_slide(photo_path, text, sf)

            clip = tmp / f"clip_{i:02d}.mp4"
            zoom_filter = (
                f"scale={WIDTH*2}:{HEIGHT*2},"
                f"zoompan=z='min(zoom+0.0008,1.08)':d={int(PER_SLIDE*30)}:"
                f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
                f"s={WIDTH}x{HEIGHT}:fps=30,"
                f"format=yuv420p,"
                f"fade=t=in:st=0:d=0.5,"
                f"fade=t=out:st={PER_SLIDE-0.5}:d=0.5"
            )
            run([
                "ffmpeg", "-y", "-loglevel", "error",
                "-loop", "1", "-i", str(sf),
                "-t", str(PER_SLIDE),
                "-vf", zoom_filter,
                "-r", "30", "-c:v", "libx264", "-pix_fmt", "yuv420p",
                "-preset", "ultrafast", "-crf", "20",
                str(clip)
            ])
            clips.append(clip)

        if not clips:
            print("ERROR: No clips generated")
            return

        # Concat
        concat = tmp / "concat.txt"
        concat.write_text("\n".join(f"file '{c}'" for c in clips))
        video_only = tmp / "video.mp4"
        run([
            "ffmpeg", "-y", "-loglevel", "error",
            "-f", "concat", "-safe", "0", "-i", str(concat),
            "-c", "copy", str(video_only)
        ])

        # No audio track in video — keep as-is (silent is fine for demo)
        # Music + voiceover are added by Railway's full video_engine.py in production
        print(f"  Video silent (audio added in production)")

        # Copy to output
        out_path = Path(OUTPUT)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        import shutil
        shutil.copy2(video_only, out_path)
        sz = out_path.stat().st_size
        print(f"\nOUTPUT: {out_path} ({sz/1024/1024:.1f} MB)")

if __name__ == "__main__":
    main()