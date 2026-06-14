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


def tpl_free_trial_drip() -> tuple[str, str, str]:
    site = _site_url()
    preheader = "Your 3 bonus rewrites are live — here's exactly how to use them."
    inner = f"""
      <h2 style="margin:0 0 16px;font-size:28px;font-weight:300;line-height:1.25;">
        Your <em style="color:#ff3a1c;font-style:italic;">3 bonus rewrites</em> are ready.
      </h2>
      <p style="margin:0 0 16px;">
        You just unlocked 3 more free rewrites in ListWorks PRO. Here's the fastest way to use them:
      </p>
      <ol style="margin:0 0 24px;padding-left:22px;line-height:2;">
        <li>Paste your next listing's basic details — address, beds, baths, a few bullet points</li>
        <li>Pick a tone: <strong>Luxury</strong> for high-end, <strong>Modern</strong> for most listings, <strong>Cozy</strong> for starter homes</li>
        <li>Hit Rewrite — get MLS copy, Instagram caption, Facebook post, 5 headlines, and a buyer email in 8 seconds</li>
      </ol>
      <p style="margin:0 0 28px;">
        <a href="{site}/#playground" style="{_BTN_VERMILLION}">Use Your Bonus Rewrites Now →</a>
      </p>
      <p style="margin:0 0 16px;color:#444;font-size:14px;">
        When you're ready to go unlimited, Pro is $29/month — flat rate, no credit limits, cancel anytime.
      </p>
      <p style="margin:0;color:#444;font-size:14px;">
        <a href="{site}/#pricing" style="color:#ff3a1c;text-decoration:underline;">See pricing →</a>
      </p>
    """
    return ("Your 3 bonus rewrites are live", _wrap(inner, preheader), preheader)


# ---------------------------------------------------------------------------
# Free trial drip sequence (7 emails, Days 0/2/5/7/14/21/30)
# ---------------------------------------------------------------------------

def tpl_trial_day2_beforeafter() -> tuple[str, str, str]:
    site = _site_url()
    preheader = "This is what 10 seconds looks like. Real before/after."
    inner = f"""
      <h2 style="margin:0 0 16px;font-size:26px;font-weight:300;line-height:1.3;">
        Before vs. After — <em style="color:#ff3a1c;font-style:italic;">10 seconds.</em>
      </h2>
      <p style="margin:0 0 16px;">Here's what a real listing looks like before and after ListWorks PRO:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-collapse:collapse;">
        <tr>
          <td style="width:50%;padding:16px;background:#f0ede4;vertical-align:top;border:1px solid #e0ddd4;">
            <p style="margin:0 0 8px;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.15em;color:#9a9590;">❌ Before</p>
            <p style="margin:0;font-size:13px;color:#555;line-height:1.6;font-style:italic;">"3 bed 2 bath ranch. Updated kitchen. Hardwood floors. Fenced yard. Near schools. Move-in ready."</p>
          </td>
          <td style="width:50%;padding:16px;background:#1a1a1a;vertical-align:top;border:1px solid #333;">
            <p style="margin:0 0 8px;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.15em;color:#ff3a1c;">✅ After</p>
            <p style="margin:0;font-size:13px;color:#f4f3ef;line-height:1.6;font-style:italic;">"Every morning starts with light across gleaming hardwood floors. The updated kitchen — granite, stainless, real counter space — is where weekends happen. Three bedrooms, two baths, a fully fenced yard, and top-rated schools two blocks away. This is the one you'll stop scrolling for."</p>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 16px;color:#444;">That rewrite took 8 seconds. ListWorks also generated the Instagram caption, Facebook post, 5 headlines, and a buyer email at the same time.</p>
      <p style="margin:0 0 28px;">
        <a href="{site}/#playground" style="{_BTN_VERMILLION}">Rewrite Your Next Listing →</a>
      </p>
      <p style="margin:0;color:#666;font-size:13px;">You still have bonus rewrites available. Use them on a real listing — see the difference yourself.</p>
    """
    return ("This is what 10 seconds looks like", _wrap(inner, preheader), preheader)


def tpl_trial_day5_fairhousing() -> tuple[str, str, str]:
    site = _site_url()
    preheader = "One phrase in your listings could cost $26,262. Seriously."
    inner = f"""
      <h2 style="margin:0 0 16px;font-size:26px;font-weight:300;line-height:1.3;">
        One phrase. <em style="color:#ff3a1c;font-style:italic;">$26,262 fine.</em>
      </h2>
      <p style="margin:0 0 16px;">HUD's minimum fine for a first Fair Housing violation is <strong>$26,262</strong>. And the most common violations aren't intentional — they're AI-generated phrases that no one caught.</p>
      <p style="margin:0 0 12px;font-weight:600;">Phrases that have triggered Fair Housing complaints:</p>
      <ul style="margin:0 0 24px;padding-left:22px;line-height:2.2;color:#444;">
        <li><span style="font-family:monospace;background:#fff3f0;padding:2px 6px;color:#c0392b;">"Perfect for families"</span> — implies households without children need not apply</li>
        <li><span style="font-family:monospace;background:#fff3f0;padding:2px 6px;color:#c0392b;">"Safe, quiet neighborhood"</span> — coded language with documented complaint history</li>
        <li><span style="font-family:monospace;background:#fff3f0;padding:2px 6px;color:#c0392b;">"Walking distance to church"</span> — steering based on religion</li>
        <li><span style="font-family:monospace;background:#fff3f0;padding:2px 6px;color:#c0392b;">"Great for young professionals"</span> — age discrimination</li>
      </ul>
      <p style="margin:0 0 16px;">ChatGPT generates these constantly. It has no real estate compliance layer. ListWorks screens every output before it reaches you.</p>
      <p style="margin:0 0 28px;">
        <a href="{site}/listing-analyzer" style="{_BTN_VERMILLION}">Check Your Listings for Violations — Free →</a>
      </p>
      <p style="margin:0;color:#666;font-size:13px;">Paste any listing into our free analyzer. Instant Fair Housing score. No signup needed.</p>
    """
    return ("One phrase in your listing could cost $26,262", _wrap(inner, preheader), preheader)


def tpl_trial_day7_socialproof() -> tuple[str, str, str]:
    site = _site_url()
    preheader = "What 850+ agents actually said about ListWorks PRO."
    inner = f"""
      <h2 style="margin:0 0 16px;font-size:26px;font-weight:300;line-height:1.3;">
        What agents are <em style="color:#ff3a1c;font-style:italic;">actually saying.</em>
      </h2>
      <p style="margin:0 0 20px;">We're not a big company. We don't have a Super Bowl ad. We have agents who tried it and kept coming back.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
        {"".join(f'''<tr><td style="padding:14px 18px;border-left:3px solid #ff3a1c;background:#faf9f5;margin-bottom:12px;display:block;">
          <p style="margin:0 0 8px;font-size:15px;color:#1a1a1a;line-height:1.6;font-style:italic;">"{quote}"</p>
          <p style="margin:0;font-size:11px;font-family:monospace;text-transform:uppercase;letter-spacing:0.12em;color:#9a9590;">{author}</p>
        </td></tr><tr><td style="height:10px;"></td></tr>''' for quote, author in [
            ("Used it on a stale listing that had been sitting 47 days. New copy went live Monday. Showing requests by Wednesday. Offer by Friday.", "RE Agent — Phoenix AZ"),
            ("I was skeptical. Tried it on a $2.1M listing as a test. The MLS description it wrote was genuinely better than what I would have written in an hour.", "RE Agent — Austin TX"),
            ("The Fair Housing filter alone is worth the subscription. My broker requires compliance review on every listing. This does it automatically.", "RE Agent — Atlanta GA"),
        ])}
      </table>
      <p style="margin:0 0 28px;">
        <a href="{site}/#playground" style="{_BTN_VERMILLION}">Try Your Next Listing Free →</a>
      </p>
      <p style="margin:0;color:#666;font-size:13px;">Still on free rewrites. Use them — you've already paid with your email.</p>
    """
    return ("What 850+ agents are saying about ListWorks", _wrap(inner, preheader), preheader)


def tpl_trial_day14_features() -> tuple[str, str, str]:
    site = _site_url()
    preheader = "You've seen 10% of ListWorks. Here's the other 90%."
    inner = f"""
      <h2 style="margin:0 0 16px;font-size:26px;font-weight:300;line-height:1.3;">
        You've only seen <em style="color:#ff3a1c;font-style:italic;">10% of this.</em>
      </h2>
      <p style="margin:0 0 20px;">Most agents who try ListWorks use the basic rewrite and stop. Here's what's also in there:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-collapse:collapse;">
        {"".join(f'<tr style="border-bottom:1px solid #f0ede4;"><td style="padding:12px 0;font-size:14px;color:#1a1a1a;font-weight:600;width:35%;">{feat}</td><td style="padding:12px 0 12px 16px;font-size:13px;color:#555;line-height:1.6;">{desc}</td></tr>' for feat, desc in [
            ("Brand Voice Memory", "Save your tone, banned words, and style once. Every rewrite sounds like you — automatically."),
            ("Local Gems", "AI pulls nearby schools, restaurants, and transit into a neighborhood paragraph. The research agents skip."),
            ("Address Auto-Fill", "Type an address, get beds/baths/sqft populated from public records. No manual lookup."),
            ("Photo → Listing", "Upload a photo. AI identifies features — hardwood floors, marble counters, vaulted ceilings — and writes from them."),
            ("Agent Bio Generator", "Short, medium, and full bios in Professional, Warm, or Bold tone. LinkedIn and Instagram ready."),
            ("Spanish + Chinese Output", "One-click multilingual listings. Reach buyers in their language."),
            ("Listing Strength Score", "0-100 quality score on every output. See exactly what's weak before it goes live."),
        ])}
      </table>
      <p style="margin:0 0 28px;">
        <a href="{site}/#pricing" style="{_BTN_VERMILLION}">Unlock Everything — $29/mo →</a>
      </p>
      <p style="margin:0;color:#666;font-size:13px;">Flat rate. No credit limits. Cancel anytime. Your first listing pays for the whole month.</p>
    """
    return ("You've only seen 10% of what ListWorks does", _wrap(inner, preheader), preheader)


def tpl_trial_day21_comparison() -> tuple[str, str, str]:
    site = _site_url()
    preheader = "ChatGPT vs. ListWorks PRO for real estate — honest breakdown."
    inner = f"""
      <h2 style="margin:0 0 16px;font-size:26px;font-weight:300;line-height:1.3;">
        ChatGPT vs. ListWorks — <em style="color:#ff3a1c;font-style:italic;">honest answer.</em>
      </h2>
      <p style="margin:0 0 16px;">Agents ask us this constantly. Here's the real answer — no spin.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-collapse:collapse;font-size:13px;">
        <tr style="background:#1a1a1a;color:#f4f3ef;">
          <th style="padding:10px 14px;text-align:left;font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.15em;font-weight:normal;">Feature</th>
          <th style="padding:10px 14px;text-align:center;font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.15em;font-weight:normal;">ChatGPT</th>
          <th style="padding:10px 14px;text-align:center;font-family:monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.15em;color:#ff3a1c;font-weight:normal;">ListWorks PRO</th>
        </tr>
        {"".join(f'<tr style="border-bottom:1px solid #f0ede4;"><td style="padding:10px 14px;color:#333;">{feat}</td><td style="padding:10px 14px;text-align:center;color:#999;">{chatgpt}</td><td style="padding:10px 14px;text-align:center;color:#1a7a4a;font-weight:600;">{lw}</td></tr>' for feat, chatgpt, lw in [
            ("Fair Housing compliance screen", "✗ None", "✓ Built-in"),
            ("All 5 formats in one click", "✗ One at a time", "✓ Simultaneous"),
            ("Brand Voice Memory", "✗ Resets every chat", "✓ Saved forever"),
            ("MLS character limits", "✗ Manual counting", "✓ Auto-enforced"),
            ("Banned AI clichés", "✗ Generates them freely", "✓ 25+ blocked at system level"),
            ("Local Gems neighborhood data", "✗ Hallucinated or missing", "✓ Real data pulled live"),
            ("Cost per listing", "$20/mo general use", "$29/mo unlimited RE"),
        ])}
      </table>
      <p style="margin:0 0 16px;color:#444;">ChatGPT is a great general tool. ListWorks is built for exactly one job — real estate copy that's fast, compliant, and in your voice. For agents, purpose-built wins.</p>
      <p style="margin:0 0 28px;">
        <a href="{site}/vs/chatgpt" style="{_BTN_VERMILLION}">See Full Comparison →</a>
      </p>
    """
    return ("ChatGPT vs. ListWorks PRO — honest breakdown", _wrap(inner, preheader), preheader)


def tpl_trial_day30_lastoffer() -> tuple[str, str, str]:
    site = _site_url()
    preheader = "Last email. One offer. COMEBACK29 saves you $116 today."
    inner = f"""
      <h2 style="margin:0 0 16px;font-size:26px;font-weight:300;line-height:1.3;">
        Last email. <em style="color:#ff3a1c;font-style:italic;">One offer.</em>
      </h2>
      <p style="margin:0 0 16px;">You've been on our list for 30 days. You tried the free rewrites. You know what this does.</p>
      <p style="margin:0 0 16px;">If you haven't upgraded yet, here's the honest version of why agents do:</p>
      <ul style="margin:0 0 24px;padding-left:22px;line-height:2.2;color:#444;">
        <li>One listing pays for 4 months of Pro at $29</li>
        <li>The Fair Housing screen alone has saved agents from $26,262 fines</li>
        <li>Flat rate means no anxiety about how many listings you run</li>
        <li>Your first commission covers a full year of the annual plan ($290)</li>
      </ul>
      <p style="margin:0 0 8px;font-weight:600;">One-time offer for people who've been with us since the beginning:</p>
      <div style="margin:0 0 24px;padding:20px;background:#fff3f0;border:2px solid #ff3a1c;text-align:center;">
        <p style="margin:0 0 4px;font-family:monospace;font-size:22px;font-weight:700;letter-spacing:0.1em;color:#ff3a1c;">COMEBACK29</p>
        <p style="margin:0;font-size:13px;color:#666;">$10 off your first month — apply at checkout</p>
      </div>
      <p style="margin:0 0 28px;">
        <a href="{site}/#pricing" style="{_BTN_VERMILLION}">Claim COMEBACK29 — $19 First Month →</a>
      </p>
      <p style="margin:0 0 12px;color:#666;font-size:13px;">This is the last email in this sequence. No more nudges after this — I respect your inbox.</p>
      <p style="margin:0;color:#666;font-size:13px;">If you ever want to try Pro, the door's open at <a href="{site}" style="color:#ff3a1c;">{site}</a>.</p>
    """
    return ("Last email — COMEBACK29 saves you $116 today", _wrap(inner, preheader), preheader)


async def send_free_trial_drip(email: str) -> dict:
    """
    Full 7-email sequence for free trial signups.
    All emails pre-scheduled at capture time via Resend scheduled_at.
    Day 0: bonus rewrites (already sent by capture endpoint)
    Day 2: before/after example
    Day 5: fair housing warning
    Day 7: social proof
    Day 14: feature reveal
    Day 21: chatgpt comparison
    Day 30: last offer + COMEBACK29
    """
    if not email:
        return {}

    s0, h0, _ = tpl_free_trial_drip()
    s2, h2, _ = tpl_trial_day2_beforeafter()
    s5, h5, _ = tpl_trial_day5_fairhousing()
    s7, h7, _ = tpl_trial_day7_socialproof()
    s14, h14, _ = tpl_trial_day14_features()
    s21, h21, _ = tpl_trial_day21_comparison()
    s30, h30, _ = tpl_trial_day30_lastoffer()

    results = {}
    results["day0"] = await _send(to=email, subject=s0, html=h0, tag="trial_day0")
    results["day2"] = await _send(to=email, subject=s2, html=h2, scheduled_at=_iso_in(2), tag="trial_day2")
    results["day5"] = await _send(to=email, subject=s5, html=h5, scheduled_at=_iso_in(5), tag="trial_day5")
    results["day7"] = await _send(to=email, subject=s7, html=h7, scheduled_at=_iso_in(7), tag="trial_day7")
    results["day14"] = await _send(to=email, subject=s14, html=h14, scheduled_at=_iso_in(14), tag="trial_day14")
    results["day21"] = await _send(to=email, subject=s21, html=h21, scheduled_at=_iso_in(21), tag="trial_day21")
    results["day30"] = await _send(to=email, subject=s30, html=h30, scheduled_at=_iso_in(30), tag="trial_day30")
    return results


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
