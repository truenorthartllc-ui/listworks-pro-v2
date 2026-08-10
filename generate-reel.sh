#!/usr/bin/env bash
# generate-reel.sh — One-command listing-to-reel pipeline
# Usage: MUAPI_API_KEY=xxx ./generate-reel.sh "Listing Title" "Description" [music_id]
set -euo pipefail

TITLE="${1:-Modern 3-Bedroom Home}"
DESC="${2:-Open floor plan, granite countertops, large backyard}"
MUSIC="${3:-cinematic}"
BACKEND="${BACKEND:-/root/listworks-pro-v2/backend}"
OUTDIR="${OUTDIR:-/root/listworks-pro-v2/frontend/public/reels}"
mkdir -p "$OUTDIR"

SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g' | tr -cd 'a-z0-9-')
SLUG="${SLUG:0:30}"
echo "=== Generating reel: $TITLE ==="

# Step 1: Generate listing images via MuAPI
echo "[1/3] Generating images via MuAPI..."
cd "$BACKEND"
python3 -m scripts.muapi_gen "$TITLE" "$DESC" 2>/dev/null || {
    echo "MuAPI failed — falling back to Unsplash demo images"
    # Fallback: download demo images
    mkdir -p /tmp/reel-fallback
    for url in \
        "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1080&q=85&fit=crop" \
        "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1080&q=85&fit=crop" \
        "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1080&q=85&fit=crop" \
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1080&q=85&fit=crop"; do
        curl -sL "$url" -o "/tmp/reel-fallback/img_$(basename $url | cut -d? -f1)"
    done
    echo "Fallback images saved"
}

# Step 2: Generate reel description + slide text via OmniRoute
echo "[2/3] Generating slide text..."
SLIDES=$(
curl -s http://localhost:7860/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d "{
    \"model\": \"oc/deepseek-v4-flash-free\",
    \"messages\": [{\"role\":\"user\",\"content\":\"Write 4 short punchy real estate reel captions (max 6 words each) for: $TITLE. $DESC. Format: one per line, no numbering, no quotes.\"}],
    \"stream\": false
  }" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    msg = d.get('choices',[{}])[0].get('message',{})
    text = msg.get('content') or msg.get('reasoning_content') or ''
    lines = [l.strip() for l in text.split('\n') if l.strip() and not l.startswith('{')]
    print('\n'.join(lines[:4]))
except:
    print('Your dream home awaits\nSchedule your tour today\nModern living\nMove-in ready')
" 2>/dev/null
)
echo "$SLIDES"

# Step 3: Render video via existing API (or directly via video_engine)
echo "[3/3] Rendering reel..."
# Use the existing API endpoint — the backend must be running
API_URL="${API_URL:-http://localhost:7861}"
PHOTOS_JSON=$(python3 -c "
import base64, sys, os, json
from pathlib import Path
imgs = list(Path('/tmp/reel-fallback').glob('*')) if (Path('/tmp/reel-fallback').exists() and list(Path('/tmp/reel-fallback').iterdir())) else list(Path('/tmp/muapi-gen').glob('*.jpg'))
b64s = []
for p in imgs[:4]:
    raw = p.read_bytes()
    b64s.append(base64.b64encode(raw).decode())
print(json.dumps(b64s))
")

SLIDES_JSON=$(python3 -c "
import json, sys
lines = '''$SLIDES'''.strip().split('\n')
print(json.dumps(lines[:4]))
")

RESULT=$(curl -s -X POST "$API_URL/api/generate-video" \
  -H "Content-Type: application/json" \
  -d "{
    \"photos\": $PHOTOS_JSON,
    \"slides\": $SLIDES_JSON,
    \"music_id\": \"$MUSIC\",
    \"use_ai_voice\": true,
    \"voiceover_text\": \"$TITLE. $DESC. Schedule your showing today.\",
    \"agent_name\": \"ListWorks PRO\",
    \"fmt\": \"9:16\"
  }")

VIDEO_ID=$(echo "$RESULT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
if [ -n "$VIDEO_ID" ]; then
    echo "=== DONE ==="
    echo "Reel ID: $VIDEO_ID"
    echo "URL: $API_URL/api/videos/$VIDEO_ID.mp4"
    # Copy to frontend reels dir
    SRC="/root/listworks-pro-v2/backend/static/videos/$VIDEO_ID.mp4"
    if [ -f "$SRC" ]; then
        cp "$SRC" "$OUTDIR/$SLUG.mp4"
        echo "Copied to: $OUTDIR/$SLUG.mp4"
    fi
else
    echo "FAIL: $RESULT"
    exit 1
fi