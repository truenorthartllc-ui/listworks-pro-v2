# ListWorks PRO — Product Requirements

## Original Problem Statement
> "iv made a app listworks.pro its become a mess your a AI godmode app builder i need you to take what iv shown you and turn it into a AI masterpiece!"

## Vision
ListWorks PRO is the AI listing-copy + virtual-tour-video weapon for real estate agents.
Paste a boring MLS draft → 5 publish-ready assets in 10 seconds.
Then upload photos → cinematic 30-second listing video for IG/TikTok/FB.
Plus an 85-page $20 PDF guide (Gumroad) teaching the underlying framework.

## User Personas
- Solo Agent (drowning in MLS uploads, needs speed + voice)
- Brokerage Owner (wants brand-uniform copy across team)
- Real Estate Coach (buys $20 guide, refers students)

## Tech Stack
- Backend: FastAPI · Motor (MongoDB) · emergentintegrations
- AI: Claude Sonnet 4.5 (rewrites + advisor) · GPT-5.2 (vision/photo analysis) · OpenAI TTS-1-HD (voiceover narration)
- Video: ffmpeg + Pillow (server-side rendering pipeline)
- Frontend: React 19 · Tailwind · Lucide · Sonner · MediaRecorder API

## Implementation Status — 2026-01

### v1 (initial MVP)
- ✅ Editorial-luxury landing (Playfair Display + Outfit + JetBrains Mono, vermillion + oat palette)
- ✅ Hero + brokerage marquee + before/after examples + features bento + dark guide upsell + testimonials + 3-tier pricing + FAQ + footer
- ✅ AI Playground: textarea + metadata + tone pills + Generate + 5 tabbed outputs + Copy

### v2 (PDF wired) — same day
- ✅ Replaced AI system prompt with the actual ListWorks framework from the 85-page guide
- ✅ "Preview Inside" modal embeds the PDF inline (Gumroad funnel preserved)

### v3 (current — Claude switch + Video Builder + AI Advisor)
- ✅ Switched to Claude Sonnet 4.5 for rewrites + advisor
- ✅ Output structure now matches ListGenius Pro spec: 3 headlines (not 5), Listing Strength score (0-10) with explainer reasons, "Copy & Crush It" buttons, AI Advisor / Try Different Tone / Make 10/10 Pro action row, ListGenius Pro $49 upsell banner, Powered by Claude branding
- ✅ /api/advisor — Claude-powered chat critiquing listings against the framework, right-drawer UI with starter prompts and history
- ✅ Video Builder (the big one):
  - Multi-photo upload (≤12) with thumbnails + remove
  - 4 editable slide inputs auto-filled from headlines (50 char cap)
  - Music vibe picker — 8 royalty-free tracks (Cinematic / Epic / Luxury / Piano / Inspiring / Upbeat / Modern / Hip Hop) + No Music, with ▶ inline audio preview
  - Voiceover: browser MediaRecorder for agent recording OR auto AI narration (OpenAI TTS-1-HD onyx voice)
  - Agent name + brokerage on final slide
  - Format toggle: 16:9 (free) / 9:16 (Pro lock)
  - Virtual Tour Mode toggle
  - Server-side ffmpeg pipeline: photos → Ken-Burns zoompan → text overlay (DejaVu Serif Bold, vermillion accent bar) → concat → mix music + voiceover → 1920×1080 H.264 MP4 (~28-30s)
  - In-app preview + Download MP4
- ✅ Page count fix: 30 → 85
- ✅ Tested: backend 20/20 pytest cases green · frontend 100% e2e (rewrite, advisor, video gen with real Unsplash photo verified to produce valid H.264 + AAC MP4)

### Backlog (P1)
- [ ] Stripe billing for Pro $49 / Team plans
- [ ] Email magic-link auth for cross-device history
- [ ] 9:16 Reels format (currently Pro-locked stub)
- [ ] Make-it-10/10 actual rewrite logic (currently toast)
- [ ] Real royalty-free music tracks (current ones are ffmpeg synthesis — placeholder ambient)
- [ ] MLS-link auto-import (paste MLS URL → auto-fill metadata)

### Backlog (P2)
- [ ] Brokerage voice presets / custom training
- [ ] Newsletter integration (capture only — no provider yet)
- [ ] Admin / metrics dashboard
- [ ] Multi-language outputs

## API Surface (v3)
- POST /api/rewrite — listing → 5 outputs + strength
- POST /api/analyze-photo — vision feature detection
- POST /api/advisor — chat with Claude advisor
- POST /api/video/generate — render MP4
- GET /api/videos/{id}.mp4 — serve MP4
- GET /api/listings/{session_id}
- GET /api/examples
- POST /api/feedback

## v4 (current — Stripe + Make.com auto-post)
- ✅ Stripe Checkout wired (test key `sk_test_emergent`):
  - `guide_pdf` $20 (one-time PDF unlock — replaces Gumroad)
  - `pro_month` $49 (1 month Pro access)
  - `pro_annual` $470 (annual save $118)
- ✅ `/api/checkout/session` (creates session + persists payment_transactions row)
- ✅ `/api/checkout/status/{id}` polling (with safe 404 fallback)
- ✅ `/api/webhook/stripe` (idempotent — grants entitlement to lw_session_id)
- ✅ `/api/entitlements/{session_id}` (returns is_pro, has_guide)
- ✅ `/payment-success` page polls Stripe → if guide → instant download; if pro → pro welcome
- ✅ Make.com FB auto-post — `/api/social/post` POSTs full listing JSON to MAKE_WEBHOOK_URL
- ✅ Frontend: GuideUpsell + Pricing + Pro upsell banner all use Stripe; "Auto-Post to FB" button after rewrite; "Make It 10/10" now opens Pro checkout
- ✅ Tested: backend 17/17 + frontend 100%

## v5 (current — Resend Email Drips + Custom Domain Live)
- ✅ **listworks.pro custom domain LIVE** on Railway (TXT verify fixed — was truncated in DNS)
- ✅ **REACT_APP_BACKEND_URL** wired between frontend (`resourceful-passion`) and backend (`listworks-pro-v2-production.up.railway.app`) Railway services
- ✅ Resend integration (Python SDK 2.30.0) — sending domain `listworks.pro` verified (DKIM + SPF)
- ✅ `email_engine.py` — 5 inline-styled HTML templates (guide welcome, day 2 playground, day 5 video, day 14 winback, pro welcome)
- ✅ Drip scheduling via Resend's native `scheduled_at` (no worker/cron needed — stateless on Railway)
- ✅ Auto-fires on payment confirmation in BOTH the polling endpoint AND the Stripe webhook (idempotent via `drip_sent` flag in `payment_transactions`)
- ✅ Falls back to Stripe `customer_details.email` if buyer email not collected pre-checkout
- ✅ `/api/email/test` endpoint for smoke testing
- ✅ Verified: full drip (5 emails) returns valid Resend email_ids

## Next session priorities
- [ ] **Add `RESEND_API_KEY`, `EMAIL_FROM`, `SITE_URL` to Railway BACKEND service vars** (user action)
- [ ] Real Stripe live keys + live products (when user goes to production)
- [ ] Telegram bot for buyer DMs / agent notifications
- [ ] Affiliate program (30% recurring per agent referral)
- [ ] Login (email magic link) for cross-device entitlement persistence
- [ ] Brokerage admin panel for $499 tier
- [ ] Resend webhook handler for delivery/bounce/complaint events
- [ ] Coupon code support in Stripe (for COMEBACK29 from day-14 winback)
