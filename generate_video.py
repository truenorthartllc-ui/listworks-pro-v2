"""Standalone video generator — generates hero-demo-narrated.mp4 from demo photos."""
import subprocess
import os
import tempfile
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

WIDTH, HEIGHT = 1920, 1080
FPS = 30
PER_SLIDE = 2.8  # seconds per slide (10 slides = 28s total)

SLIDES = [
    ("Sunday pancakes\nand slow weekends.", "sub"),
    ("This kitchen earns them.", "main"),
    ("Where mornings move slowly.", "sub"),
    ("Three beds. Two baths.\nOne home worth writing about.", "main"),
    ("A backyard built for\nslow weekends.", "sub"),
    ("And faster dogs.", "accent"),
    ("Walk to top-rated schools.", "sub"),
    ("Bike to the trail.", "sub"),
    ("This street trades quietly —\nand rarely.", "main"),
    ("Try it free →  listworks.pro", "cta"),
]

PHOTOS = [
    f"frontend/public/demo-photos/photo_{i:02d}.jpg"
    for i in range(1, 11)
]

FONT_CANDIDATES = [
    "backend/static/fonts/DejaVuSerif-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]
FONT_PATH = next((f for f in FONT_CANDIDATES if os.path.exists(f)), None)
OUTPUT = "frontend/public/hero-demo-narrated.mp4"


def run(cmd, cwd=None):
    subprocess.run(cmd, check=True, capture_output=True, cwd=cwd)


def render_slide(photo_path, text, style, out_path):
    img = Image.open(photo_path).convert("RGB")
    # Cover-fit to 1920x1080
    src_r = img.width / img.height
    dst_r = WIDTH / HEIGHT
    if src_r > dst_r:
        new_h, new_w = HEIGHT, int(HEIGHT * src_r)
    else:
        new_w, new_h = WIDTH, int(WIDTH / src_r)
    img = img.resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - WIDTH) // 2
    top = (new_h - HEIGHT) // 2
    img = img.crop((left, top, left + WIDTH, top + HEIGHT))

    draw = ImageDraw.Draw(img, "RGBA")

    # Dark gradient bottom third
    for y in range(HEIGHT - 480, HEIGHT):
        frac = (y - (HEIGHT - 480)) / 480
        alpha = int(frac * 210)
        draw.rectangle([(0, y), (WIDTH, y + 1)], fill=(0, 0, 0, alpha))

    # Subtle dark bar at top
    for y in range(0, 120):
        frac = (120 - y) / 120
        alpha = int(frac * 120)
        draw.rectangle([(0, y), (WIDTH, y + 1)], fill=(0, 0, 0, alpha))

    # Fonts
    try:
        if FONT_PATH:
            font_size = 88 if style == "main" else 72 if style == "sub" else 60
            font = ImageFont.truetype(FONT_PATH, font_size)
            small_font = ImageFont.truetype(FONT_PATH, 32)
        else:
            font = ImageFont.load_default()
            small_font = font
    except Exception:
        font = ImageFont.load_default()
        small_font = font

    # Text color
    if style == "accent":
        fill = (255, 80, 50)  # vermillion
    elif style == "cta":
        fill = (255, 255, 255)
    else:
        fill = (245, 240, 230)  # warm oat

    # Draw text — bottom-left aligned with padding
    pad_x, pad_y = 90, 80
    lines = text.split("\n")
    line_h = font_size + 16 if FONT_PATH else 20
    total_h = len(lines) * line_h
    y_start = HEIGHT - pad_y - total_h

    for line in lines:
        draw.text((pad_x, y_start), line, font=font, fill=fill)
        y_start += line_h

    # ListWorks watermark — top right
    wm = "listworks.pro"
    draw.text((WIDTH - 280, 36), wm, font=small_font, fill=(255, 255, 255, 160))

    img.convert("RGB").save(out_path, "JPEG", quality=90)


def main():
    print("Generating hero demo video...")
    cwd = Path(__file__).parent

    with tempfile.TemporaryDirectory() as tmp_str:
        tmp = Path(tmp_str)
        clips = []

        for i, ((text, style), photo) in enumerate(zip(SLIDES, PHOTOS)):
            photo_path = cwd / photo
            if not photo_path.exists():
                print(f"  SKIP {photo}")
                continue

            sf = tmp / f"slide_{i:02d}.jpg"
            render_slide(photo_path, text, style, sf)
            print(f"  Slide {i+1}/{len(SLIDES)}: {text[:40]!r}")

            clip = tmp / f"clip_{i:02d}.mp4"
            # Ken burns: slow push-in zoom
            zoom_f = (
                f"scale={WIDTH*2}:{HEIGHT*2},"
                f"zoompan=z='min(zoom+0.0006,1.06)':d={int(PER_SLIDE*30)}:"
                f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
                f"s={WIDTH}x{HEIGHT}:fps={FPS},"
                f"format=yuv420p,"
                f"fade=t=in:st=0:d=0.4,"
                f"fade=t=out:st={PER_SLIDE-0.4:.1f}:d=0.4"
            )
            run([
                "ffmpeg", "-y", "-loglevel", "error",
                "-loop", "1", "-i", str(sf),
                "-t", str(PER_SLIDE),
                "-vf", zoom_f,
                "-r", str(FPS), "-c:v", "libx264",
                "-pix_fmt", "yuv420p",
                "-preset", "fast", "-crf", "18",
                str(clip),
            ])
            clips.append(clip)

        if not clips:
            print("ERROR: no clips rendered")
            return

        # Concat all clips
        concat = tmp / "concat.txt"
        concat.write_text("\n".join(f"file '{c}'" for c in clips))
        final = tmp / "final.mp4"
        run([
            "ffmpeg", "-y", "-loglevel", "error",
            "-f", "concat", "-safe", "0", "-i", str(concat),
            "-c", "copy", str(final),
        ])

        out = cwd / OUTPUT
        out.parent.mkdir(parents=True, exist_ok=True)
        import shutil
        shutil.copy2(final, out)
        sz = out.stat().st_size
        print(f"\n✓ {out} — {sz/1024/1024:.1f} MB, {len(clips)} slides × {PER_SLIDE}s = {len(clips)*PER_SLIDE:.0f}s")


if __name__ == "__main__":
    main()
