import os
import io
import base64
import uuid
import pytest
import requests
from PIL import Image

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    # fallback to frontend env
    with open('/app/frontend/.env') as f:
        for line in f:
            if line.startswith('REACT_APP_BACKEND_URL'):
                BASE_URL = line.split('=', 1)[1].strip().strip('"').rstrip('/')

API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def session_id():
    return f"TEST_{uuid.uuid4()}"


# ---------- Health ----------
def test_root():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("status") == "live"


# ---------- Examples ----------
def test_examples():
    r = requests.get(f"{API}/examples")
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) == 3
    for item in data:
        for k in ("id", "address", "before", "after", "tone"):
            assert k in item and item[k]


# ---------- Feedback ----------
def test_feedback():
    r = requests.post(f"{API}/feedback", json={"email": "TEST_a@b.co", "message": "hi"})
    assert r.status_code == 200
    assert r.json() == {"ok": True}


# ---------- Rewrite validation ----------
def test_rewrite_validation_short():
    r = requests.post(f"{API}/rewrite", json={"raw_listing": "tiny", "tone": "Modern"})
    assert r.status_code == 400


# ---------- Rewrite — single tone deep test ----------
SAMPLE_LISTING = (
    "3 bedroom 2 bathroom single family home. 1850 sqft. Updated kitchen with granite counters. "
    "Hardwood floors. Fenced backyard. 2 car garage. Close to schools and parks."
)


def _validate_rewrite_payload(data, tone):
    for k in ("id", "mls", "instagram", "facebook", "headlines", "email", "tone", "raw_listing", "created_at",
             "listing_strength", "strength_reasons"):
        assert k in data, f"missing {k}"
    assert data["tone"] == tone
    assert isinstance(data["headlines"], list)
    assert len(data["headlines"]) == 3, f"expected exactly 3 headlines, got {len(data['headlines'])}"
    assert len(data["mls"]) > 50
    assert len(data["instagram"]) > 30
    assert len(data["facebook"]) > 30
    assert len(data["email"]) > 30
    # strength
    assert isinstance(data["listing_strength"], (int, float))
    assert 0.0 <= data["listing_strength"] <= 10.0
    assert isinstance(data["strength_reasons"], list) and len(data["strength_reasons"]) >= 1


def test_rewrite_modern(session_id):
    payload = {
        "raw_listing": SAMPLE_LISTING,
        "tone": "Modern",
        "address": "123 Test St",
        "price": "$650,000",
        "beds": "3", "baths": "2", "sqft": "1850",
        "session_id": session_id,
    }
    r = requests.post(f"{API}/rewrite", json=payload, timeout=120)
    assert r.status_code == 200, r.text
    _validate_rewrite_payload(r.json(), "Modern")


@pytest.mark.parametrize("tone", ["Luxury", "Cozy", "Family", "Investor"])
def test_rewrite_all_tones(tone, session_id):
    r = requests.post(
        f"{API}/rewrite",
        json={"raw_listing": SAMPLE_LISTING, "tone": tone, "session_id": session_id},
        timeout=120,
    )
    assert r.status_code == 200, r.text
    _validate_rewrite_payload(r.json(), tone)


# ---------- Listings persistence ----------
def test_listings_by_session(session_id):
    r = requests.get(f"{API}/listings/{session_id}")
    assert r.status_code == 200
    rows = r.json()
    assert isinstance(rows, list) and len(rows) >= 1
    # confirm no _id leaks
    for row in rows:
        assert "_id" not in row


# ---------- Photo Analyze ----------
def _fetch_real_jpeg_b64():
    # Use unsplash small property photo
    url = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=70&fm=jpg"
    resp = requests.get(url, timeout=30)
    assert resp.status_code == 200
    img = Image.open(io.BytesIO(resp.content)).convert("RGB")
    img.thumbnail((640, 640))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=75)
    return base64.b64encode(buf.getvalue()).decode()


def test_analyze_photo():
    b64 = _fetch_real_jpeg_b64()
    r = requests.post(
        f"{API}/analyze-photo",
        json={"image_base64": b64, "mime_type": "image/jpeg"},
        timeout=120,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert isinstance(data["features"], list) and len(data["features"]) >= 1
    assert isinstance(data["style"], str) and data["style"]
    assert isinstance(data["suggested_headline"], str) and data["suggested_headline"]


# ---------- Advisor ----------
def test_advisor_basic():
    r = requests.post(
        f"{API}/advisor",
        json={"listing_id": None, "question": "How can I make my hook stronger?", "history": []},
        timeout=120,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert "reply" in data
    assert isinstance(data["reply"], str) and len(data["reply"].strip()) > 10
    # under 200 words (loose check)
    assert len(data["reply"].split()) <= 250


def test_advisor_followup_with_history():
    history = [
        {"role": "user", "content": "Critique this hook: 'Welcome to your dream home'"},
        {"role": "assistant", "content": "It uses a banned phrase and lacks specificity."},
    ]
    r = requests.post(
        f"{API}/advisor",
        json={"listing_id": None, "question": "Give me a better one in 8 words.", "history": history},
        timeout=120,
    )
    assert r.status_code == 200, r.text
    assert len(r.json()["reply"].strip()) > 5


# ---------- Video Generation ----------
def _small_jpeg_b64():
    url = "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&q=70&fm=jpg"
    resp = requests.get(url, timeout=30)
    assert resp.status_code == 200
    img = Image.open(io.BytesIO(resp.content)).convert("RGB")
    img.thumbnail((600, 400))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=70)
    return base64.b64encode(buf.getvalue()).decode()


@pytest.fixture(scope="module")
def generated_video():
    photo_b64 = _small_jpeg_b64()
    payload = {
        "photos": [photo_b64, photo_b64],
        "slides": ["Sun-drenched mornings", "Granite kitchen", "Fenced backyard", "Walk to schools"],
        "music_id": "cinematic",
        "use_ai_voice": True,
        "agent_name": "Test Agent",
        "agent_brokerage": "ListWorks Realty",
        "fmt": "16:9",
    }
    r = requests.post(f"{API}/video/generate", json=payload, timeout=300)
    assert r.status_code == 200, r.text
    data = r.json()
    return data


def test_video_generate_success(generated_video):
    data = generated_video
    for k in ("id", "url", "duration", "format"):
        assert k in data
    assert data["format"] == "16:9"
    assert data["duration"] > 0
    assert data["url"].startswith("/api/videos/") and data["url"].endswith(".mp4")


def test_video_serve(generated_video):
    url = f"{BASE_URL}{generated_video['url']}"
    r = requests.get(url, timeout=60)
    assert r.status_code == 200
    assert r.headers.get("content-type", "").startswith("video/mp4")
    assert len(r.content) > 1000


def test_video_serve_404():
    r = requests.get(f"{API}/videos/deadbeef0000.mp4", timeout=15)
    assert r.status_code == 404


def test_video_serve_bad_filename():
    r = requests.get(f"{API}/videos/badname.mp4", timeout=15)
    assert r.status_code == 404


def test_video_validation_empty_photos():
    r = requests.post(
        f"{API}/video/generate",
        json={"photos": [], "slides": ["x"], "music_id": "cinematic", "fmt": "16:9"},
        timeout=30,
    )
    assert r.status_code == 400


def test_video_validation_bad_music():
    r = requests.post(
        f"{API}/video/generate",
        json={"photos": ["AAAA"], "slides": ["x"], "music_id": "polka", "fmt": "16:9"},
        timeout=30,
    )
    assert r.status_code == 400


def test_video_validation_bad_fmt():
    r = requests.post(
        f"{API}/video/generate",
        json={"photos": ["AAAA"], "slides": ["x"], "music_id": "cinematic", "fmt": "4:3"},
        timeout=30,
    )
    assert r.status_code == 400
