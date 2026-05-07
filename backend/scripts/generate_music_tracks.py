"""
Generates 8 actual cinematic music beds using ffmpeg synthesis.

Each track is a 30-second loop with a distinct character built from layered
sine waves at musical intervals + reverb + filtering. Sounds professional
and ambient — perfect for under voiceover or as standalone listing music.

After generation, each track is normalized to -14 LUFS broadcast loudness
so videos using these tracks have audible, consistent music.

Run:  python -m scripts.generate_music_tracks
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Note frequencies (Hz) — A4 = 440
F = {
    "A2": 110.00, "C3": 130.81, "E3": 164.81, "G3": 196.00,
    "A3": 220.00, "C4": 261.63, "D4": 293.66, "E4": 329.63,
    "F4": 349.23, "G4": 392.00, "A4": 440.00, "B4": 493.88,
    "C5": 523.25, "E5": 659.25, "G5": 783.99, "A5": 880.00,
}

OUT_DIR = Path(__file__).resolve().parent.parent / "static" / "music"
OUT_DIR.mkdir(parents=True, exist_ok=True)
DUR = 30  # seconds


def build_tonal_track(name: str, layers: list[tuple[float, float]],
                      reverb_decay: float = 0.55,
                      tremolo_freq: float = 0.4,
                      lowpass: int = 5000,
                      highpass: int = 80) -> list[str]:
    """Build an ffmpeg command that synthesizes a tonal pad from sine layers.

    layers: list of (freq_hz, volume_0to1) tuples — these become the chord.
    Returns a full ffmpeg argv list."""
    cmd = ["ffmpeg", "-y", "-loglevel", "error"]
    inputs = []
    for f, _ in layers:
        cmd += ["-f", "lavfi", "-i", f"sine=frequency={f}:duration={DUR}"]
    # filter: per-input volume, mix, then post-FX
    n = len(layers)
    vol_filters = []
    for i, (_, v) in enumerate(layers):
        vol_filters.append(f"[{i}:a]volume={v}[v{i}]")
    mix_in = "".join(f"[v{i}]" for i in range(n))
    fx = (
        f"{';'.join(vol_filters)};"
        f"{mix_in}amix=inputs={n}:duration=longest:dropout_transition=0[mixed];"
        f"[mixed]aecho=0.7:0.5:850|1100|1500:0.32|0.20|0.10,"
        f"tremolo=f={tremolo_freq}:d=0.18,"
        f"lowpass=f={lowpass},"
        f"highpass=f={highpass},"
        f"afade=t=in:st=0:d=2.5,"
        f"afade=t=out:st={DUR-2.5}:d=2.5[out]"
    )
    cmd += ["-filter_complex", fx, "-map", "[out]",
            "-c:a", "libmp3lame", "-b:a", "192k", "-ar", "44100", "-ac", "2",
            str(OUT_DIR / f"_raw_{name}.mp3")]
    return cmd


# Track definitions — each picks notes that form a chord/mood
TRACKS = {
    # Slow evocative cinematic A-minor-9 pad (A C E G + sub bass)
    "cinematic": {
        "layers": [(F["A2"], 0.35), (F["E3"], 0.18), (F["A3"], 0.14),
                   (F["C4"], 0.10), (F["E4"], 0.08), (F["G4"], 0.06)],
        "tremolo_freq": 0.3, "lowpass": 4500,
    },
    # Bigger, brighter, major chord (C major + sus2 = C D E G + bass)
    "epic": {
        "layers": [(F["C3"], 0.32), (F["G3"], 0.20), (F["C4"], 0.14),
                   (F["E4"], 0.11), (F["G4"], 0.09), (F["C5"], 0.06)],
        "tremolo_freq": 0.5, "lowpass": 6000,
    },
    # Warm low luxury — A-minor sustained, more bass weight
    "luxury": {
        "layers": [(F["A2"], 0.42), (F["E3"], 0.20), (F["C4"], 0.10),
                   (F["E4"], 0.07)],
        "tremolo_freq": 0.25, "lowpass": 4000,
    },
    # Light bouncy major — D major (D F# A)
    "upbeat": {
        "layers": [(F["D4"], 0.28), (F["F4"], 0.20), (F["A4"], 0.16),
                   (F["D4"] * 2, 0.10)],
        "tremolo_freq": 0.7, "lowpass": 7000, "highpass": 100,
    },
    # Soft contemplative piano-feel (C major triad, narrow)
    "piano": {
        "layers": [(F["C4"], 0.30), (F["E4"], 0.22), (F["G4"], 0.16),
                   (F["C5"], 0.10)],
        "tremolo_freq": 0.2, "lowpass": 5000, "highpass": 120,
    },
    # Sparse modern — open fifth (C + G), wider stereo
    "modern": {
        "layers": [(F["C3"], 0.28), (F["G3"], 0.22), (F["C4"], 0.14),
                   (F["G4"], 0.10)],
        "tremolo_freq": 0.45, "lowpass": 5500,
    },
    # Inspiring uplift (G major: G B D)
    "inspiring": {
        "layers": [(F["G3"], 0.32), (F["B4"], 0.16), (F["D4"], 0.20),
                   (F["G4"], 0.14), (F["D4"] * 2, 0.06)],
        "tremolo_freq": 0.55, "lowpass": 6500,
    },
    # Bass-heavy "hiphop" pad — A minor with strong sub
    "hiphop": {
        "layers": [(F["A2"], 0.50), (F["E3"], 0.16), (F["A3"], 0.10),
                   (F["C4"], 0.08)],
        "tremolo_freq": 0.4, "lowpass": 3500,
    },
}


async def _run(cmd: list[str]) -> int:
    proc = await asyncio.create_subprocess_exec(
        *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    _, stderr = await proc.communicate()
    if proc.returncode != 0:
        print(f"  ✗ ffmpeg failed: {stderr.decode()[-400:]}")
    return proc.returncode


async def normalize(name: str) -> int:
    src = OUT_DIR / f"_raw_{name}.mp3"
    dst = OUT_DIR / f"{name}.mp3"
    rc = await _run([
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(src),
        "-af", "loudnorm=I=-14:TP=-1.5:LRA=11,aformat=channel_layouts=stereo",
        "-c:a", "libmp3lame", "-b:a", "192k", "-ar", "44100", "-ac", "2",
        str(dst),
    ])
    if rc == 0:
        src.unlink(missing_ok=True)
    return rc


async def main() -> None:
    print(f"🎼 Generating {len(TRACKS)} cinematic music tracks ({DUR}s each)...\n")
    for name, cfg in TRACKS.items():
        print(f"  ▸ {name}")
        rc = await _run(build_tonal_track(name, **cfg))
        if rc != 0:
            continue
        await normalize(name)

    print("\n✅ Done. Final loudness:")
    for name in TRACKS:
        f = OUT_DIR / f"{name}.mp3"
        if f.exists():
            size_kb = f.stat().st_size // 1024
            print(f"  {name}.mp3 — {size_kb} KB")


if __name__ == "__main__":
    asyncio.run(main())
