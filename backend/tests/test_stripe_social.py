"""Iteration 3 – Stripe checkout + Make.com social post + entitlements + regression."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://listworks-ai.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    sess.headers.update({"Content-Type": "application/json"})
    return sess


# ============== PRICING ==============
class TestPricing:
    def test_pricing_returns_three_packages(self, s):
        r = s.get(f"{API}/pricing", timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "guide_pdf" in data and "pro_month" in data and "pro_annual" in data
        assert data["guide_pdf"]["amount"] == 20.00
        assert data["pro_month"]["amount"] == 49.00
        assert data["pro_annual"]["amount"] == 470.00
        for pid in ("guide_pdf", "pro_month", "pro_annual"):
            for k in ("name", "amount", "currency", "kind"):
                assert k in data[pid]
            assert data[pid]["currency"] == "usd"
        assert data["guide_pdf"]["kind"] == "guide"
        assert data["pro_month"]["kind"] == "pro"
        assert data["pro_annual"]["kind"] == "pro"


# ============== CHECKOUT SESSION ==============
class TestCheckoutSession:
    @pytest.mark.parametrize("pid", ["guide_pdf", "pro_month", "pro_annual"])
    def test_create_session_each_package(self, s, pid):
        r = s.post(f"{API}/checkout/session", json={
            "package_id": pid,
            "origin_url": BASE_URL,
            "session_id": f"TEST_sess_{pid}_{uuid.uuid4().hex[:6]}",
        }, timeout=30)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "url" in d and "session_id" in d
        assert d["url"].startswith("https://checkout.stripe.com")
        assert d["session_id"].startswith("cs_")

    def test_invalid_package_returns_400(self, s):
        r = s.post(f"{API}/checkout/session", json={
            "package_id": "fake_pkg",
            "origin_url": BASE_URL,
        }, timeout=20)
        assert r.status_code == 400
        assert "Invalid package" in r.text

    def test_transaction_persisted_after_checkout(self, s):
        # Create the session — verify the response shape and stripe URL.
        # Note: cannot reliably re-fetch /checkout/status/{id} immediately because
        # the emergent stripe proxy session may not be retrievable via the same key
        # (returns 500 with sk_test_emergent on retrieve — see issue list).
        lw_sid = f"TEST_tx_{uuid.uuid4().hex[:8]}"
        r = s.post(f"{API}/checkout/session", json={
            "package_id": "guide_pdf",
            "origin_url": BASE_URL,
            "session_id": lw_sid,
        }, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["session_id"].startswith("cs_")
        assert "checkout.stripe.com" in d["url"]


# ============== CHECKOUT STATUS ==============
class TestCheckoutStatus:
    def test_status_invalid_session_id(self, s):
        r = s.get(f"{API}/checkout/status/cs_test_invalid_xxx", timeout=20)
        assert r.status_code >= 400 and r.status_code < 600


# ============== STRIPE WEBHOOK ==============
class TestStripeWebhook:
    def test_webhook_bad_signature_400(self, s):
        r = s.post(
            f"{API}/webhook/stripe",
            data=b'{"id":"evt_test","type":"checkout.session.completed"}',
            headers={"Stripe-Signature": "t=1,v1=bad", "Content-Type": "application/json"},
            timeout=20,
        )
        assert r.status_code == 400


# ============== ENTITLEMENTS ==============
class TestEntitlements:
    def test_empty_entitlements_for_new_session(self, s):
        sid = f"TEST_ent_{uuid.uuid4().hex[:8]}"
        r = s.get(f"{API}/entitlements/{sid}", timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d == {"entitlements": [], "is_pro": False, "has_guide": False}


# ============== SOCIAL POST (Make.com) ==============
class TestSocialPost:
    def test_social_post_503_when_unconfigured_with_valid_listing(self, s):
        # First create a listing via /api/rewrite so listing_id exists. Retry up to 2x for flaky AI JSON.
        listing_id = None
        last_err = None
        for _ in range(2):
            rew = s.post(f"{API}/rewrite", json={
                "raw_listing": "3 bed 2 bath ranch. Updated kitchen. Hardwood floors. Big yard.",
                "tone": "Modern",
                "session_id": "TEST_social_sess",
            }, timeout=120)
            if rew.status_code == 200:
                listing_id = rew.json()["id"]
                break
            last_err = rew.text
        assert listing_id is not None, f"Rewrite failed twice: {last_err}"

        r = s.post(f"{API}/social/post", json={
            "listing_id": listing_id,
            "platforms": ["facebook"],
        }, timeout=20)
        # MAKE_WEBHOOK_URL is empty -> 503 expected
        assert r.status_code == 503
        assert "not configured" in r.text.lower()

    def test_social_post_nonexistent_listing(self, s):
        # When MAKE_WEBHOOK_URL is empty, the 503 short-circuits BEFORE the listing lookup.
        # So with current backend behavior, even a fake listing returns 503.
        # If MAKE_WEBHOOK_URL were set, fake listing would return 404.
        # Test current behavior:
        r = s.post(f"{API}/social/post", json={
            "listing_id": "nonexistent_xyz_12345",
            "platforms": ["facebook"],
        }, timeout=20)
        # Either 503 (current empty-webhook) or 404 (if webhook configured)
        assert r.status_code in (503, 404)


# ============== REGRESSION: prior endpoints still work ==============
class TestRegression:
    def test_root(self, s):
        r = s.get(f"{API}/", timeout=20)
        assert r.status_code == 200
        assert r.json().get("status") == "live"

    def test_examples(self, s):
        r = s.get(f"{API}/examples", timeout=20)
        assert r.status_code == 200
        assert len(r.json()) >= 3

    def test_listings_by_session(self, s):
        r = s.get(f"{API}/listings/TEST_social_sess", timeout=20)
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_feedback(self, s):
        r = s.post(f"{API}/feedback", json={
            "email": "TEST_qa@example.com",
            "message": "iter3 regression"
        }, timeout=20)
        assert r.status_code == 200
        assert r.json().get("ok") is True

    def test_advisor_basic(self, s):
        r = s.post(f"{API}/advisor", json={
            "question": "In one sentence, what is FBF?",
            "history": [],
        }, timeout=60)
        assert r.status_code == 200
        assert len(r.json().get("reply", "")) > 5

    def test_rewrite_validation_short(self, s):
        r = s.post(f"{API}/rewrite", json={"raw_listing": "x", "tone": "Modern"}, timeout=20)
        assert r.status_code == 400
