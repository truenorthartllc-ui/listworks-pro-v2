"""Video generation pipeline: photos + slides + music + voiceover -> MP4."""
from __future__ import annotations

import asyncio
import base64
import logging
import os
import re
import shutil
import subprocess
import tempfile
import textwrap
import uuid
from pathlib import Path
from typing import List, Optional

from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent
MUSIC_DIR = (ROOT_DIR.parent / "frontend" / "public" / "assets" / "music").resolve()
STATIC_VIDEOS = (ROOT_DIR / "static" / "videos").resolve()
STATIC_VIDEOS.mkdir(parents=True, exist_ok=True)

FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
]
FONT_PATH = next((f for f in FONT_CANDIDATES if os.path.exists(f)), None)

MUSIC_TRACKS = {
    "cinematic", "epic", "luxury", "piano",
    "inspiring", "upbeat", "modern", "hiphop", "none",
}


def _decode_image(data_url_or_b64: str, dest: Path) -> Path:
    """Decode an image (data: URL or raw base64) to JPEG file."""
    if data_url_or_b64.startswith("data:"):
        b64 = data_url_or_b64.split(",", 1)[1]
    else:
        b64 = data_url_or_b64
    raw = base64.b64decode(b64)
    img = Image.open(__import__("io").BytesIO(raw)).convert("RGB")
    img.save(dest, "JPEG", quality=88)
    return dest


def _render_slide(
    photo_path: Path,
    text: str,
    out_path: Path,
    width: int,
    height: int,
    agent_name: Optional[str] = None,
    agent_brokerage: Optional[str] = None,
    is_first: bool = False,
    is_last: bool = False,
):
    """Render a JPEG frame: photo cropped to canvas + dark gradient + slide text."""
    img = Image.open(photo_path).convert("RGB")
    # cover-fit
    src_ratio = img.width / img.height
    dst_ratio = width / height
    if src_ratio > dst_ratio:
        new_h = height
        new_w = int(height * src_ratio)
    else:
        new_w = width
        new_h = int(width / src_ratio)
    img = img.resize((new_w, new_h), Image.LANCZOS)
    left = (new_w - width) // 2
    top = (new_h - height) // 2
    img = img.crop((left, top, left + width, top + height))

    # gradient overlay (dark from bottom)
    overlay = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for y in range(height):
        t = max(0, (y - height * 0.45) / (height * 0.55))
        a = int(180 * t)
        od.line([(0, y), (width, y)], fill=(0, 0, 0, a))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

    if not FONT_PATH:
        img.save(out_path, "JPEG", quality=88)
        return

    draw = ImageDraw.Draw(img)
    # main slide text
    main_size = max(48, int(width / 22))
    main_font = ImageFont.truetype(FONT_PATH, main_size)
    # wrap text
    safe_text = (text or "").strip().upper()
    wrapped = textwrap.wrap(safe_text, width=24) or [""]
    line_h = main_size + 8
    total_h = line_h * len(wrapped)
    y = height - total_h - int(height * 0.13)
    for line in wrapped:
        bbox = draw.textbbox((0, 0), line, font=main_font)
        tw = bbox[2] - bbox[0]
        x = (width - tw) // 2
        # subtle stroke
        draw.text((x, y), line, font=main_font, fill="#F4F3EF",
                  stroke_width=2, stroke_fill="#0A0A0A")
        y += line_h

    # vermillion accent bar
    bar_w = int(width * 0.12)
    bar_x = (width - bar_w) // 2
    bar_y = y + 14
    draw.rectangle([bar_x, bar_y, bar_x + bar_w, bar_y + 4], fill="#FF3B22")

    # agent footer on last slide
    if is_last and agent_name:
        sub_size = max(22, int(width / 60))
        sub_font = ImageFont.truetype(FONT_PATH, sub_size)
        agent_line = agent_name.upper()
        if agent_brokerage:
            agent_line += f"  ·  {agent_brokerage.upper()}"
        bbox = draw.textbbox((0, 0), agent_line, font=sub_font)
        tw = bbox[2] - bbox[0]
        x = (width - tw) // 2
        draw.text((x, bar_y + 28), agent_line, font=sub_font,
                  fill="#F4F3EF", stroke_width=1, stroke_fill="#0A0A0A")

    img.save(out_path, "JPEG", quality=88)


async def _run(cmd: List[str], cwd: Optional[str] = None) -> str:
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        cwd=cwd,
    )
    stdout, stderr = await proc.communicate()
    if proc.returncode != 0:
        err = stderr.decode("utf-8", "ignore")[-2000:]
        raise RuntimeError(f"ffmpeg failed (rc={proc.returncode}): {err}")
    return stdout.decode("utf-8", "ignore")


async def _generate_voiceover_mp3(
    api_key: str, text: str, dest: Path, voice: str = "onyx"
) -> bool:
    try:
        from emergentintegrations.llm.openai import OpenAITextToSpeech
        tts = OpenAITextToSpeech(api_key=api_key)
        audio = await tts.generate_speech(
            text=text[:600], model="tts-1-hd", voice=voice, speed=0.95
        )
        dest.write_bytes(audio)
        return True
    except Exception:
        logger.exception("TTS generation failed")
        return False


async def generate_listing_video(
    *,
    photos_b64: List[str],
    slides: List[str],
    music_id: str = "cinematic",
    voiceover_b64: Optional[str] = None,
    voiceover_text: Optional[str] = None,
    agent_name: Optional[str] = None,
    agent_brokerage: Optional[str] = None,
    fmt: str = "16:9",
    api_key: str = "",
) -> dict:
    """Render the full MP4. Returns {id, url, duration}."""
    if music_id not in MUSIC_TRACKS:
        music_id = "cinematic"
    if fmt == "9:16":
        width, height = 1080, 1920
    else:
        width, height = 1920, 1080

    # photos
    if not photos_b64:
        raise ValueError("At least one photo is required")
    if len(photos_b64) > 12:
        photos_b64 = photos_b64[:12]
    # slides
    slides = [s for s in (slides or []) if isinstance(s, str)]
    slides = [re.sub(r"\s+", " ", s.strip())[:80] for s in slides if s.strip()][:4]
    if not slides:
        slides = ["Welcome home"]

    video_id = uuid.uuid4().hex[:12]
    out_path = STATIC_VIDEOS / f"{video_id}.mp4"

    with tempfile.TemporaryDirectory() as tmpd:
        tmp = Path(tmpd)
        # 1) decode photos
        photo_files: List[Path] = []
        for i, b64 in enumerate(photos_b64):
            try:
                photo_files.append(_decode_image(b64, tmp / f"p{i}.jpg"))
            except Exception:
                continue
        if not photo_files:
            raise ValueError("No valid photos")

        # 2) build slide frames — exactly len(slides) slides, cycling photos
        slide_files: List[Path] = []
        n = len(slides)
        for i, slide_text in enumerate(slides):
            photo = photo_files[i % len(photo_files)]
            f = tmp / f"slide{i}.jpg"
            _render_slide(
                photo, slide_text, f, width, height,
                agent_name=agent_name,
                agent_brokerage=agent_brokerage,
                is_first=(i == 0),
                is_last=(i == n - 1),
            )
            slide_files.append(f)

        # 3) per-slide duration ~7s (total ~28s + final hold ~2s = 30s)
        per = 7.0
        total = per * n

        # 4) build photo video segment with crossfade (xfade)
        # Generate one clip per slide, then concat with ffmpeg-concat.
        clips = []
        for i, sf in enumerate(slide_files):
            clip = tmp / f"clip{i}.mp4"
            # ken-burns zoompan: subtle 1.0 -> 1.08 zoom over per seconds
            zoom_filter = (
                f"scale={width*2}:{height*2},"
                f"zoompan=z='min(zoom+0.0008,1.08)':d={int(per*30)}:"
                f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
                f"s={width}x{height}:fps=30,"
                f"format=yuv420p"
            )
            await _run([
                "ffmpeg", "-y", "-loglevel", "error",
                "-loop", "1", "-i", str(sf),
                "-t", f"{per}",
                "-vf", zoom_filter,
                "-r", "30",
                "-c:v", "libx264", "-pix_fmt", "yuv420p",
                "-preset", "veryfast", "-crf", "22",
                str(clip),
            ])
            clips.append(clip)

        # concat the clips
        concat_list = tmp / "concat.txt"
        concat_list.write_text("\n".join(f"file '{c}'" for c in clips))
        video_only = tmp / "video.mp4"
        await _run([
            "ffmpeg", "-y", "-loglevel", "error",
            "-f", "concat", "-safe", "0", "-i", str(concat_list),
            "-c", "copy", str(video_only),
        ])

        # 5) audio: music + voiceover
        audio_inputs: List[Path] = []
        if music_id != "none":
            music_src = MUSIC_DIR / f"{music_id}.mp3"
            if music_src.exists():
                m_out = tmp / "music.mp3"
                # loop/trim to total length, fade
                await _run([
                    "ffmpeg", "-y", "-loglevel", "error",
                    "-stream_loop", "-1", "-i", str(music_src),
                    "-t", f"{total}",
                    "-af", f"volume=0.55,afade=t=in:st=0:d=1.5,afade=t=out:st={total-1.5}:d=1.5",
                    str(m_out),
                ])
                audio_inputs.append(m_out)

        # voiceover: prefer uploaded base64 audio, else generate from voiceover_text via TTS
        vo_path: Optional[Path] = None
        if voiceover_b64:
            try:
                if voiceover_b64.startswith("data:"):
                    voiceover_b64 = voiceover_b64.split(",", 1)[1]
                raw = base64.b64decode(voiceover_b64)
                vo_in = tmp / "vo_in.bin"
                vo_in.write_bytes(raw)
                vo_path = tmp / "vo.mp3"
                await _run([
                    "ffmpeg", "-y", "-loglevel", "error",
                    "-i", str(vo_in),
                    "-af", f"volume=1.6,apad=whole_dur={total}",
                    "-t", f"{total}",
                    "-ar", "44100", "-ac", "2", "-b:a", "128k",
                    str(vo_path),
                ])
            except Exception:
                logger.exception("Voiceover decode failed")
                vo_path = None
        elif voiceover_text and api_key:
            tts_path = tmp / "tts.mp3"
            ok = await _generate_voiceover_mp3(api_key, voiceover_text, tts_path)
            if ok:
                vo_path = tmp / "vo.mp3"
                await _run([
                    "ffmpeg", "-y", "-loglevel", "error",
                    "-i", str(tts_path),
                    "-af", f"volume=1.4,apad=whole_dur={total}",
                    "-t", f"{total}",
                    "-ar", "44100", "-ac", "2", "-b:a", "128k",
                    str(vo_path),
                ])
        if vo_path and vo_path.exists():
            audio_inputs.append(vo_path)

        # mix or use single
        if not audio_inputs:
            # silent track
            silent = tmp / "silent.mp3"
            await _run([
                "ffmpeg", "-y", "-loglevel", "error",
                "-f", "lavfi", "-i", f"anullsrc=r=44100:cl=stereo",
                "-t", f"{total}", "-b:a", "128k", str(silent),
            ])
            final_audio = silent
        elif len(audio_inputs) == 1:
            final_audio = audio_inputs[0]
        else:
            final_audio = tmp / "mix.mp3"
            cmd = ["ffmpeg", "-y", "-loglevel", "error"]
            for a in audio_inputs:
                cmd += ["-i", str(a)]
            cmd += [
                "-filter_complex",
                f"[0:a]volume=0.45[a0];[1:a]volume=1.4[a1];[a0][a1]amix=inputs=2:duration=longest:dropout_transition=0",
                "-t", f"{total}",
                "-ar", "44100", "-ac", "2", "-b:a", "128k",
                str(final_audio),
            ]
            await _run(cmd)

        # 6) mux video + audio
        await _run([
            "ffmpeg", "-y", "-loglevel", "error",
            "-i", str(video_only),
            "-i", str(final_audio),
            "-map", "0:v:0", "-map", "1:a:0",
            "-c:v", "copy",
            "-c:a", "aac", "-b:a", "128k",
            "-shortest",
            str(out_path),
        ])

    return {
        "id": video_id,
        "url": f"/api/videos/{video_id}.mp4",
        "duration": total,
        "format": fmt,
    }
