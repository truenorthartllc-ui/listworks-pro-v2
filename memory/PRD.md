# ListWorks PRO — Product Requirements

## Original Problem Statement
> "iv made a app listworks.pro its become a mess your a AI godmode app builder i need you to take what iv shown you and turn it into a AI masterpiece!"

## Vision
ListWorks PRO is the AI listing-copy weapon for real estate agents.
Paste a boring MLS draft → 5 publish-ready assets in 10 seconds:
MLS · Instagram · Facebook · Headlines · Email — all in their voice.
Plus a $20 PDF guide (Gumroad) teaching the underlying framework.

## User Personas
- **Solo Agent** — drowning in MLS uploads, wants speed + voice consistency.
- **Brokerage Owner** — wants brand-uniform listing copy across 5+ agents.
- **Real Estate Coach / Influencer** — buys the $20 guide, refers students to the tool.

## Core Requirements (static)
- Free tier: 3 rewrites / month
- 5 tone modes: Luxury · Cozy · Modern · Family · Investor
- 5 output formats per rewrite
- Photo analysis (vision)
- Listing history per session
- $20 guide upsell linking to listworks.gumroad.com
- Mobile responsive · MLS-compliant copy

## Implementation Status — 2026-01

### Implemented (v1)
- ✅ Editorial luxury landing (Playfair Display + Outfit + DM Sans + JetBrains Mono)
- ✅ Vermillion #FF3B22 / oat #F4F3EF / coal #0A0A0A palette — bento grid layout
- ✅ Hero with stat block + animated rise transitions
- ✅ Brokerage marquee (eXp / KW / RE/MAX / Compass etc.)
- ✅ AI Playground: textarea, metadata, tone pills, Generate, 5 tabbed outputs, Copy
- ✅ Backend `/api/rewrite` — GPT-5.2 via emergentintegrations, JSON-strict
- ✅ Backend `/api/analyze-photo` — vision-based feature detection
- ✅ Backend `/api/examples`, `/api/listings/{session_id}`, `/api/feedback`
- ✅ Before/After tabs with 3 seeded examples
- ✅ Features bento grid (6 features)
- ✅ Dark $20 guide upsell card linking to Gumroad
- ✅ Testimonials (3 agent quotes + Unsplash headshots, grayscale)
- ✅ 3-tier pricing (Free / Pro / Team)
- ✅ FAQ accordion (6 Qs)
- ✅ Footer with newsletter capture
- ✅ Backend tested 100% · Frontend tested 100%

### Backlog (P1)
- [ ] Photo upload UI in Playground (backend ready)
- [ ] Stripe billing for Pro / Team plans
- [ ] User auth (email magic link or Google) for cross-device history
- [ ] Cinematic listing video generator from photos (the original promise)
- [ ] PDF download of generated assets
- [ ] Brokerage voice training (custom presets)

### Backlog (P2)
- [ ] Newsletter integration (capture only — no provider yet)
- [ ] Admin / metrics dashboard
- [ ] MLS link auto-import (paste MLS URL → auto-fill)
- [ ] Multi-language outputs

## Tech Stack
- Backend: FastAPI · Motor (MongoDB) · emergentintegrations (GPT-5.2)
- Frontend: React 19 · Tailwind · Lucide · Sonner toasts
- Storage: MongoDB (collections: listings, feedback)
