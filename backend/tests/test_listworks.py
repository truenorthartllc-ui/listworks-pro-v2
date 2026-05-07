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
    for k in ("id", "mls", "instagram", "facebook", "headlines", "email", "tone", "raw_listing", "created_at"):
        assert k in data, f"missing {k}"
    assert data["tone"] == tone
    assert isinstance(data["headlines"], list) and len(data["headlines"]) >= 3
    assert len(data["mls"]) > 50
    assert len(data["instagram"]) > 30
    assert len(data["facebook"]) > 30
    assert len(data["email"]) > 30


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
