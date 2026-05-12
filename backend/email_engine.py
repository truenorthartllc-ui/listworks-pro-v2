"""
ListWorks PRO — Email engine (Resend)

Sends transactional + drip campaign emails for PDF buyers and Pro subscribers.
Uses Resend's native `scheduled_at` parameter so we don't need any worker/cron —
all 4 drip emails are scheduled the moment payment is confirmed. Resend handles delivery timing.
"""

from __future__ import annotations

import os
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Optional

import resend
from dotenv import load_dotenv

# Defensive: ensure backend/.env is loaded even if this module imports first
load_dotenv(Path(__file__).parent / ".env")

logger = logging.getLogger("listworks.email")


def _resend_key() -> str:
    return os.environ.get("RESEND_API_KEY", "") or ""


def _email_from() -> str:
    return os.environ.get("EMAIL_FROM", "ListWorks PRO <hello@listworks.pro>")


def _site_url() -> str:
    return os.environ.get("SITE_URL", "https://listworks.pro")


def _pdf_download_url() -> str:
    return f"{_site_url()}/assets/listworks-guide.pdf"


# ---------------------------------------------------------------------------
# HTML templates — inline-styled, table-based, email-client safe
# ---------------------------------------------------------------------------

_BASE_STYLE = """
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
  line-height: 1.6;
  color: #1a1a1a;
  background-color: #f6f1e7;
"""

_BTN_VERMILLION = (
    "display:inline-block;background:#ff3a1c;color:#f6f1e7;"
    "padding:14px 28px;text-decoration:none;font-weight:600;letter-spacing:0.05em;"
    "text-transform:uppercase;font-size:13px;border-radius:0;"
)


def _wrap(inner_html: str, preheader: str = "") -> str:
    """Wrap content in a basic email shell."""
    site = _site_url()
    return f"""<!DOCTYPE html>
<html><body style="margin:0;padding:0;{_BASE_STYLE}">
  <span style="display:none !important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;">{preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e7;padding:40px 20px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid rgba(26,26,26,0.12);">
        <tr><td style="padding:36px 40px 28px;border-bottom:1px solid rgba(26,26,26,0.08);">
          <h1 style="margin:0;font-size:22px;letter-spacing:0.02em;font-weight:600;">
            ListWorks <span style="color:#ff3a1c;">PRO</span>
          </h1>
        </td></tr>
        <tr><td style="padding:36px 40px;font-size:16px;line-height:1.7;color:#1a1a1a;">
          {inner_html}
        </td></tr>
        <tr><td style="padding:24px 40px;background:#1a1a1a;color:#f6f1e7;font-size:12px;line-height:1.6;">
          <p style="margin:0 0 6px;">— The ListWorks PRO Team</p>
          <p style="margin:0;color:rgba(246,241,231,0.6);">
            <a href="{site}" style="color:rgba(246,241,231,0.6);text-decoration:underline;">listworks.pro</a> ·
            <a href="{{{{RESEND_UNSUBSCRIBE_URL}}}}" style="color:rgba(246,241,231,0.6);text-decoration:underline;">Unsubscribe</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>"""


def tpl_guide_welcome(first_name: Optional[str] = None) -> tuple[str, str, str]:
    name = first_name or "there"
    site = _site_url()
    preheader = "Your ListWorks Guide is ready — 85 pages of the framework, yours forever."
    inner = f"""
      <h2 style="margin:0 0 16px;font-size:28px;font-weight:300;line-height:1.25;">
        Hey {name} — <em style="color:#ff3a1c;font-style:italic;">it's in.</em>
      </h2>
      <p style="margin:0 0 18px;">
        Your <strong>ListWorks Guide</strong> is unlocked. 85 pages of the exact framework I use to turn boring MLS drafts into copy that closes — yours forever.
      </p>
      <p style="margin:0 0 28px;">
        <a href="{_pdf_download_url()}" style="{_BTN_VERMILLION}">Download the Guide PDF</a>
      </p>
      <p style="margin:0 0 12px;color:#444;">
        While you're here — did you know your purchase comes with <strong>3 free AI rewrites</strong> in our playground? Same framework, instant output.
      </p>
      <p style="margin:0;">
        <a href="{site}/#playground" style="color:#ff3a1c;text-decoration:underline;font-weight:600;">Try the AI playground →</a>
      </p>
    """
    return ("Your ListWorks Guide is ready 📕", _wrap(inner, preheader), preheader)


def tpl_day2_playground() -> tuple[str, str, str]:
    site = _site_url()
    preheader = "Most agents skim the guide, then forget. Don't. Here's the 60-second shortcut."
    inner = f"""
      <h2 style="margin:0 0 16px;font-size:26px;font-weight:300;line-height:1.3;">
        Did you actually <em style="color:#ff3a1c;font-style:italic;">try</em> the AI yet?
      </h2>
      <p style="margin:0 0 16px;">
        Real talk — most agents read the Guide, nod, and forget. The AI rewriter built into ListWorks does it FOR you in about 8 seconds.
      </p>
      <p style="margin:0 0 16px;">
        Paste any boring MLS draft. Pick a tone (Luxury, Cozy, Modern, Family, Investor). Hit rewrite. Get back:
      </p>
      <ul style="margin:0 0 24px;padding-left:22px;">
        <li>Publish-ready MLS description</li>
        <li>Instagram caption (with hooks that stop the scroll)</li>
        <li>Facebook post</li>
        <li>5 headline options</li>
        <li>Email blast to your sphere</li>
      </ul>
      <p style="margin:0 0 28px;">
        <a href="{site}/#playground" style="{_BTN_VERMILLION}">Try a Free Rewrite Now</a>
      </p>
      <p style="margin:0;color:#666;font-size:14px;">
        First 3 rewrites are on the house with your purchase. Use 'em on your next listing.
      </p>
    """
    return ("Did you actually try the AI yet?", _wrap(inner, preheader), preheader)


def tpl_day5_video() -> tuple[str, str, str]:
    site = _site_url()
    preheader = "Listings with 30-second cinematic reels close 32% faster. We make them in one click."
    inner = f"""
      <h2 style="margin:0 0 16px;font-size:26px;font-weight:300;line-height:1.3;">
        The thing that <em style="color:#ff3a1c;font-style:italic;">actually</em> sells listings now.
      </h2>
      <p style="margin:0 0 16px;">
        It's not the photos. It's the <strong>30-second cinematic reel</strong>. Listings with one close 32% faster (NAR, 2025).
      </p>
      <p style="margin:0 0 16px;">
        Here's the wild part: <strong>ListWorks generates them automatically</strong> from the same listing copy you've been rewriting. Stock-photo intro, slide-by-slide highlights, ambient music, your agent card baked in. One click, done.
      </p>
      <p style="margin:0 0 16px;">
        Pro plan unlocks unlimited reels, watermark-free, plus 9:16 Reels format for IG/TikTok.
      </p>
      <p style="margin:0 0 28px;">
        <a href="{site}/#pricing" style="{_BTN_VERMILLION}">Upgrade to Pro — $49/mo</a>
      </p>
      <p style="margin:0 0 0;color:#666;font-size:14px;">
        Or cancel anytime, no contracts, no nonsense.
      </p>
    """
    return ("The thing that actually sells listings now", _wrap(inner, preheader), preheader)


def tpl_day14_winback() -> tuple[str, str, str]:
    site = _site_url()
    preheader = "Last nudge — first month of Pro for $29 (40% off). Code: COMEBACK29."
    inner = f"""
      <h2 style="margin:0 0 16px;font-size:26px;font-weight:300;line-height:1.3;">
        One last <em style="color:#ff3a1c;font-style:italic;">nudge.</em>
      </h2>
      <p style="margin:0 0 16px;">
        I won't keep emailing — promise. But here's a one-time offer: try ListWorks Pro for <strong>$29 your first month</strong> (40% off). Use code <strong style="background:#fff3ee;padding:2px 8px;font-family:monospace;border:1px solid #ff3a1c;">COMEBACK29</strong> at checkout.
      </p>
      <p style="margin:0 0 16px;">
        What you get:
      </p>
      <ul style="margin:0 0 24px;padding-left:22px;">
        <li>Unlimited rewrites (no caps)</li>
        <li>Watermark-free 9:16 cinematic reels</li>
        <li>AI Advisor — chat with the framework anytime</li>
        <li>Auto-post to Instagram & Facebook</li>
      </ul>
      <p style="margin:0 0 28px;">
        <a href="{site}/#pricing" style="{_BTN_VERMILLION}">Claim 40% off Pro</a>
      </p>
      <p style="margin:0;color:#666;font-size:14px;">
        Code expires in 7 days. After that it's gone.
      </p>
    """
    return ("One last nudge — 40% off Pro", _wrap(inner, preheader), preheader)


def tpl_pro_welcome(first_name: Optional[str] = None) -> tuple[str, str, str]:
    name = first_name or "there"
    site = _site_url()
    preheader = "Welcome to ListGenius Pro. Unlimited rewrites, cinematic reels, AI Advisor."
    inner = f"""
      <h2 style="margin:0 0 16px;font-size:28px;font-weight:300;line-height:1.25;">
        {name} — <em style="color:#ff3a1c;font-style:italic;">you're in.</em>
      </h2>
      <p style="margin:0 0 16px;">
        Welcome to <strong>ListGenius Pro</strong>. Everything's unlocked — go crush listings.
      </p>
      <ul style="margin:0 0 24px;padding-left:22px;">
        <li>Unlimited listing rewrites</li>
        <li>9:16 Reels format unlocked</li>
        <li>Watermark-free cinematic videos</li>
        <li>AI Advisor — chat with the framework anytime</li>
        <li>Auto-post to social via Make.com</li>
      </ul>
      <p style="margin:0 0 28px;">
        <a href="{site}/#playground" style="{_BTN_VERMILLION}">Open the Playground</a>
      </p>
      <p style="margin:0;color:#666;font-size:14px;">
        Receipts come from Stripe directly. Manage your subscription anytime from the link in any receipt.
      </p>
    """
    return ("Welcome to ListGenius Pro", _wrap(inner, preheader), preheader)


# ---------------------------------------------------------------------------
# Sending helpers
# ---------------------------------------------------------------------------

async def _send(
    *,
    to: str,
    subject: str,
    html: str,
    scheduled_at: Optional[str] = None,
    tag: Optional[str] = None,
) -> Optional[str]:
    """Send (or schedule) one email via Resend. Returns email_id or None."""
    if not _resend_key():
        logger.warning("RESEND_API_KEY not set — skipping email send to %s", to)
        return None

    # Set the SDK key just before send (handles late env loading)
    resend.api_key = _resend_key()

    params: dict = {
        "from": _email_from(),
        "to": [to],
        "subject": subject,
        "html": html,
    }
    if scheduled_at:
        params["scheduled_at"] = scheduled_at
    if tag:
        params["tags"] = [{"name": "campaign", "value": tag}]

    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        eid = result.get("id") if isinstance(result, dict) else None
        logger.info("Resend send: to=%s tag=%s scheduled=%s id=%s",
                    to, tag, bool(scheduled_at), eid)
        return eid
    except Exception as e:
        logger.exception("Resend send failed to=%s tag=%s err=%s", to, tag, e)
        return None


def _iso_in(days: int) -> str:
    """ISO 8601 timestamp `days` days from now (UTC). Resend accepts ISO."""
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()


async def send_email(*, to: str, subject: str, body: str, tag: Optional[str] = None) -> Optional[str]:
    """Simple plain-text email send."""
    html = f"<p style='font-family:sans-serif;line-height:1.6'>{body.replace(chr(10), '<br>')}</p>"
    return await _send(to=to, subject=subject, html=html, tag=tag or "transactional")


async def send_guide_drip(email: str, first_name: Optional[str] = None) -> dict:
    """
    Fire the full PDF-buyer drip:
      Day 0 (now)  — welcome + download link
      Day 2        — playground nudge
      Day 5        — Pro upsell
      Day 14       — win-back (40% off)
    Returns a dict with email_ids for each step (None if skipped/failed).
    """
    if not email:
        return {}

    # Day 0
    s0, h0, _ = tpl_guide_welcome(first_name)
    id0 = await _send(to=email, subject=s0, html=h0, tag="guide_welcome")

    # Day 2
    s2, h2, _ = tpl_day2_playground()
    id2 = await _send(to=email, subject=s2, html=h2, scheduled_at=_iso_in(2), tag="guide_day2")

    # Day 5
    s5, h5, _ = tpl_day5_video()
    id5 = await _send(to=email, subject=s5, html=h5, scheduled_at=_iso_in(5), tag="guide_day5")

    # Day 14
    s14, h14, _ = tpl_day14_winback()
    id14 = await _send(to=email, subject=s14, html=h14, scheduled_at=_iso_in(14), tag="guide_day14")

    return {
        "welcome": id0,
        "day2": id2,
        "day5": id5,
        "day14": id14,
    }


async def send_pro_welcome(email: str, first_name: Optional[str] = None) -> dict:
    """Single welcome email for Pro subscribers."""
    if not email:
        return {}
    s, h, _ = tpl_pro_welcome(first_name)
    eid = await _send(to=email, subject=s, html=h, tag="pro_welcome")
    return {"welcome": eid}
