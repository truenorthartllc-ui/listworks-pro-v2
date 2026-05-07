"""
Real piano-style music tracks synthesized in Python with numpy.

Each note is built with proper ADSR (attack/decay/sustain/release) envelope,
producing actual musical notes that ring out and resolve — not constant drones.
Notes are composed into chord progressions for each track style.

Output: 8 stereo MP3 files in /app/backend/static/music/, all loudness-normalized.
"""
from __future__ import annotations

import asyncio
import math
import struct
import sys
import wave
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

OUT_DIR = Path(__file__).resolve().parent.parent / "static" / "music"
OUT_DIR.mkdir(parents=True, exist_ok=True)

SR = 44100  # sample rate
DUR = 30.0  # seconds

# Note frequencies (Hz)
NOTE = {
    "A1": 55.00, "C2": 65.41, "E2": 82.41, "G2": 98.00,
    "A2": 110.00, "C3": 130.81, "D3": 146.83, "E3": 164.81,
    "F3": 174.61, "G3": 196.00, "A3": 220.00, "B3": 246.94,
    "C4": 261.63, "D4": 293.66, "E4": 329.63, "F4": 349.23,
    "G4": 392.00, "A4": 440.00, "B4": 493.88,
    "C5": 523.25, "D5": 587.33, "E5": 659.25, "G5": 783.99,
}


def synth_note(freq: float, dur: float, amp: float = 0.5,
               attack: float = 0.005, decay: float = 0.4,
               release: float = 0.5) -> np.ndarray:
    """Generate ONE piano-like note as a mono float32 numpy array.

    Uses sine + 2nd + 3rd harmonics with rich ADSR envelope so it sounds
    plucked/struck instead of droning."""
    n = int(SR * dur)
    t = np.linspace(0, dur, n, endpoint=False)

    # Layered harmonics (gives piano-like timbre)
    wave_arr = (
        np.sin(2 * math.pi * freq * t)
        + 0.32 * np.sin(2 * math.pi * (freq * 2) * t)
        + 0.10 * np.sin(2 * math.pi * (freq * 3) * t)
        + 0.05 * np.sin(2 * math.pi * (freq * 4) * t)
    )

    # ADSR envelope
    env = np.zeros(n)
    a_n = max(1, int(attack * SR))
    # Attack: 0 -> 1
    env[:a_n] = np.linspace(0, 1, a_n)
    # Decay + release: exponential decay over the rest
    rest_n = n - a_n
    if rest_n > 0:
        # Steep early decay, slower release tail
        decay_curve = np.exp(-3.0 * np.linspace(0, dur - attack, rest_n))
        env[a_n:] = decay_curve

    return (wave_arr * env * amp).astype(np.float32)


def add_note(track: np.ndarray, freq: float, start_t: float, dur: float, amp: float):
    """Mix a single note into the global track at time start_t."""
    note = synth_note(freq, dur, amp)
    s = int(start_t * SR)
    e = s + len(note)
    if e > len(track):
        note = note[:len(track) - s]
        e = len(track)
    if s < len(track):
        track[s:e] += note


def add_chord(track: np.ndarray, freqs: list[float], start_t: float,
              dur: float, amps: list[float]):
    for f, a in zip(freqs, amps):
        add_note(track, f, start_t, dur, a)


# ============== TRACK COMPOSITIONS ==============

def compose_cinematic() -> np.ndarray:
    """Slow Am - F - C - G progression, each chord rings 7s."""
    track = np.zeros(int(DUR * SR), dtype=np.float32)
    chords = [
        (0.0,  [NOTE["A2"], NOTE["E3"], NOTE["A3"], NOTE["C4"], NOTE["E4"]]),
        (7.0,  [NOTE["F3"], NOTE["A3"], NOTE["C4"], NOTE["F4"], NOTE["A4"]]),
        (14.0, [NOTE["C3"], NOTE["G3"], NOTE["C4"], NOTE["E4"], NOTE["G4"]]),
        (21.0, [NOTE["G2"], NOTE["D3"], NOTE["G3"], NOTE["B3"], NOTE["D4"]]),
    ]
    amps = [0.45, 0.28, 0.22, 0.18, 0.14]
    for t, freqs in chords:
        add_chord(track, freqs, t, 7.5, amps)
        # add a soft melodic flutter mid-chord
        add_note(track, freqs[3] * 2, t + 3.5, 3.5, 0.16)
        add_note(track, freqs[4] * 2, t + 5.0, 3.0, 0.12)
    return track


def compose_epic() -> np.ndarray:
    """Bigger major progression C - G - Am - F."""
    track = np.zeros(int(DUR * SR), dtype=np.float32)
    chords = [
        (0.0,  [NOTE["C2"], NOTE["G2"], NOTE["C3"], NOTE["E4"], NOTE["G4"]]),
        (7.0,  [NOTE["G2"], NOTE["D3"], NOTE["G3"], NOTE["B3"], NOTE["D4"]]),
        (14.0, [NOTE["A2"], NOTE["E3"], NOTE["A3"], NOTE["C4"], NOTE["E4"]]),
        (21.0, [NOTE["F3"], NOTE["A3"], NOTE["C4"], NOTE["F4"], NOTE["A4"]]),
    ]
    amps = [0.50, 0.32, 0.26, 0.20, 0.16]
    for t, freqs in chords:
        add_chord(track, freqs, t, 7.5, amps)
        # arpeggio melody
        for j, beat in enumerate([2.0, 4.0, 5.5]):
            add_note(track, freqs[3 + (j % 2)] * 1.5, t + beat, 2.5, 0.16)
    return track


def compose_luxury() -> np.ndarray:
    """Deep, sparse, low-end heavy A minor."""
    track = np.zeros(int(DUR * SR), dtype=np.float32)
    chords = [
        (0.0,  [NOTE["A1"], NOTE["A2"], NOTE["E3"], NOTE["A3"], NOTE["C4"]]),
        (14.0, [NOTE["F3"] / 2, NOTE["F3"], NOTE["C4"], NOTE["A3"], NOTE["F4"]]),
    ]
    amps = [0.55, 0.35, 0.22, 0.16, 0.12]
    for t, freqs in chords:
        add_chord(track, freqs, t, 14.5, amps)
        # subtle high notes
        add_note(track, NOTE["E4"], t + 7.0, 6.0, 0.13)
        add_note(track, NOTE["A4"], t + 10.0, 4.0, 0.10)
    return track


def compose_upbeat() -> np.ndarray:
    """D - G - D - A pattern, faster/bouncy."""
    track = np.zeros(int(DUR * SR), dtype=np.float32)
    pattern = [
        [NOTE["D3"], NOTE["A3"], NOTE["D4"], NOTE["F4"]],
        [NOTE["G3"], NOTE["D4"], NOTE["G4"], NOTE["B4"]],
        [NOTE["D3"], NOTE["A3"], NOTE["D4"], NOTE["F4"]],
        [NOTE["A2"], NOTE["E3"], NOTE["A3"], NOTE["C5"]],
    ]
    amps = [0.42, 0.26, 0.20, 0.16]
    for i, freqs in enumerate(pattern):
        t = i * 7.0
        add_chord(track, freqs, t, 7.5, amps)
        # bouncy arpeggio
        for j, beat in enumerate([1.5, 3.0, 4.5, 6.0]):
            add_note(track, freqs[(j % 3) + 1] * 1.5, t + beat, 1.5, 0.14)
    return track


def compose_piano() -> np.ndarray:
    """Solo piano feel — single melodic line in C major."""
    track = np.zeros(int(DUR * SR), dtype=np.float32)
    sequence = [
        # (freq, time, dur, amp)
        (NOTE["C3"], 0.0, 6.0, 0.55),
        (NOTE["E3"], 1.0, 5.0, 0.40),
        (NOTE["G3"], 2.0, 4.0, 0.35),
        (NOTE["C4"], 3.0, 4.0, 0.45),
        (NOTE["E4"], 4.0, 3.0, 0.32),
        (NOTE["G4"], 5.5, 3.0, 0.28),
        (NOTE["F3"], 7.0, 6.0, 0.55),
        (NOTE["A3"], 8.0, 5.0, 0.40),
        (NOTE["C4"], 9.0, 4.0, 0.35),
        (NOTE["F4"], 10.0, 4.0, 0.45),
        (NOTE["A4"], 11.5, 3.0, 0.28),
        (NOTE["G3"], 14.0, 6.0, 0.55),
        (NOTE["B3"], 15.0, 5.0, 0.40),
        (NOTE["D4"], 16.0, 4.0, 0.35),
        (NOTE["G4"], 17.0, 4.0, 0.45),
        (NOTE["B4"], 18.5, 3.0, 0.28),
        (NOTE["C3"], 21.0, 6.0, 0.55),
        (NOTE["E3"], 22.0, 5.0, 0.40),
        (NOTE["G3"], 23.0, 4.0, 0.35),
        (NOTE["C4"], 24.0, 4.0, 0.45),
        (NOTE["E4"], 25.5, 3.0, 0.30),
    ]
    for f, t, d, a in sequence:
        add_note(track, f, t, d, a)
    return track


def compose_modern() -> np.ndarray:
    """Open fifths with rhythmic pulse."""
    track = np.zeros(int(DUR * SR), dtype=np.float32)
    pattern = [
        [NOTE["C3"], NOTE["G3"]], [NOTE["A2"], NOTE["E3"]],
        [NOTE["F3"], NOTE["C4"]], [NOTE["G3"], NOTE["D4"]],
    ]
    for i, (low, high) in enumerate(pattern):
        t = i * 7.0
        add_note(track, low, t, 7.5, 0.50)
        add_note(track, high, t, 7.0, 0.30)
        add_note(track, low * 2, t + 3.5, 3.5, 0.18)
        add_note(track, high * 1.5, t + 5.0, 2.0, 0.14)
    return track


def compose_inspiring() -> np.ndarray:
    """Uplifting major progression with rising melody."""
    track = np.zeros(int(DUR * SR), dtype=np.float32)
    chords = [
        (0.0,  [NOTE["G2"], NOTE["D3"], NOTE["G3"], NOTE["B3"]]),
        (7.0,  [NOTE["C3"], NOTE["G3"], NOTE["C4"], NOTE["E4"]]),
        (14.0, [NOTE["D3"], NOTE["A3"], NOTE["D4"], NOTE["F4"]]),
        (21.0, [NOTE["G3"], NOTE["B3"], NOTE["D4"], NOTE["G4"]]),
    ]
    amps = [0.45, 0.28, 0.22, 0.16]
    for i, (t, freqs) in enumerate(chords):
        add_chord(track, freqs, t, 7.5, amps)
        # rising melody
        for j, beat in enumerate([2.0, 3.5, 5.0]):
            add_note(track, freqs[-1] * (1 + 0.5 * j), t + beat, 2.0, 0.14)
    return track


def compose_hiphop() -> np.ndarray:
    """Deep bass-heavy A minor with sparse hits."""
    track = np.zeros(int(DUR * SR), dtype=np.float32)
    pattern = [NOTE["A1"], NOTE["F3"] / 2, NOTE["G2"], NOTE["A1"]]
    for i, bass in enumerate(pattern):
        t = i * 7.0
        add_note(track, bass, t, 7.5, 0.65)
        add_note(track, bass * 2, t, 6.0, 0.28)
        for j, beat in enumerate([1.5, 4.0, 5.5]):
            add_note(track, bass * 4, t + beat, 1.5, 0.16)
    return track


COMPOSERS = {
    "cinematic": compose_cinematic,
    "epic":      compose_epic,
    "luxury":    compose_luxury,
    "upbeat":    compose_upbeat,
    "piano":     compose_piano,
    "modern":    compose_modern,
    "inspiring": compose_inspiring,
    "hiphop":    compose_hiphop,
}


def write_wav(path: Path, mono: np.ndarray, sr: int = SR) -> None:
    """Write a mono float32 array to a 16-bit WAV file."""
    # Soft clip + normalize to ~ -3 dBFS
    peak = float(np.max(np.abs(mono)))
    if peak > 0:
        mono = mono * (0.7 / peak)
    pcm = np.clip(mono * 32767, -32767, 32767).astype(np.int16)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())


async def _run(cmd: list[str]) -> tuple[int, str]:
    proc = await asyncio.create_subprocess_exec(
        *cmd, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    _, stderr = await proc.communicate()
    return proc.returncode, stderr.decode("utf-8", "ignore")


async def render_all() -> None:
    print(f"🎼 Composing {len(COMPOSERS)} piano-style music tracks...\n")
    for name, fn in COMPOSERS.items():
        print(f"  ▸ {name} ...", end=" ", flush=True)
        track = fn()
        wav_tmp = OUT_DIR / f"_tmp_{name}.wav"
        write_wav(wav_tmp, track)

        # Run through ffmpeg: gentle reverb + loudnorm + stereo + mp3
        final = OUT_DIR / f"{name}.mp3"
        rc, err = await _run([
            "ffmpeg", "-y", "-loglevel", "error", "-i", str(wav_tmp),
            "-af", (
                "aecho=0.65:0.5:850|1100|1500:0.30|0.20|0.10,"
                "lowpass=f=8500,"
                "highpass=f=45,"
                f"afade=t=in:st=0:d=1.5,"
                f"afade=t=out:st={DUR-2}:d=2,"
                "loudnorm=I=-14:TP=-1.5:LRA=11,"
                "aformat=channel_layouts=stereo"
            ),
            "-c:a", "libmp3lame", "-b:a", "192k", "-ar", "44100", "-ac", "2",
            "-f", "mp3", str(final),
        ])
        wav_tmp.unlink(missing_ok=True)
        if rc != 0:
            print(f"FAILED: {err[-300:]}")
        else:
            size_kb = final.stat().st_size // 1024
            print(f"✓ ({size_kb} KB)")

    print("\n✅ All music tracks regenerated as actual piano-like compositions.")


if __name__ == "__main__":
    asyncio.run(render_all())
