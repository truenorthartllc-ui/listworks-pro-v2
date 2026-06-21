# Social Template Library — Phase 2 Design

**Date:** 2026-06-21  
**Status:** Approved → Building  

## Problem

Competitors (Coffee & Contracts, Agent Crate, The Social Broker) offer static copy vaults — agents browse pre-written captions and copy-paste. It's tedious and generic. LW PRO's differentiator is AI-personalized copy in the agent's brand voice from real listing data. The Social Template Library applies that same engine to 35+ content scenarios beyond active listings.

## What We're Building

A standalone `/templates` page where agents pick a content category and type, optionally add listing/context notes, and get platform-ready copy generated in their brand voice in one click. No pre-written text — every output is AI-generated fresh, personalized to the agent.

## Architecture

### Data Model

Templates are static configuration — a hardcoded array of template definitions:

```typescript
{
  id: "just-listed-instagram",
  category: "just_listed",
  platform: "instagram",
  label: "Instagram Caption",
  prompt_hint: "Write an Instagram caption announcing this new listing..."
}
```

No new DB table. Generated outputs are ephemeral (same as Playground). Brand voice pulled from existing `/api/brand-voice/{session_id}`.

### Backend

New endpoint: `POST /api/template/generate`

Request: `{ template_id: string, listing_notes?: string, session_id?: string }`  
Response: `{ output: string, template_id: string }`

Uses existing `call_rewrite_llm()` infrastructure with a template-specific system prompt segment. Brand voice injected same as Playground rewrites.

### Frontend

New file: `src/components/Templates.jsx`  
New route: `/templates` added to App router  
New nav item: "Templates" added to sidebar/nav

**UX Flow:**
1. Category grid at top — 7 categories with icons and names
2. Click category → template cards expand (accordion or scroll-to-section)  
3. Each card: platform icon + title + optional notes input + Generate button
4. Output renders inline below card — copy button + Regenerate
5. Brand voice badge shows active if brand kit is set

## Categories + Templates (Phase 2 Launch)

| Category | ID | Templates |
|---|---|---|
| Just Listed | `just_listed` | Instagram, Facebook, Reel caption, Email blast, Stories slide |
| Just Sold | `just_sold` | Instagram, Facebook, LinkedIn announcement, Client story tease |
| Market Update | `market_update` | Monthly stats, Buyer's market, Seller's market, Rate update |
| Testimonial | `testimonial` | Share a review, Client story, Referral ask |
| Open House | `open_house` | Invite post, Day-of reminder, Follow-up |
| Education / Tips | `education` | Buyer tips, Seller tips, Staging tip, Mortgage FAQ |
| Seasonal | `seasonal` | Spring market, Holiday warmth, Year-end recap |

**Total: 35 templates**

## Prompt Architecture

Each template generates via a two-part prompt:
1. **Category context** — sets the scenario ("You are writing copy for a real estate agent announcing a just-sold listing")
2. **Brand voice injection** — same block injected into all Playground rewrites (style, avoid_words, favorite_phrases, tagline, agent_name)
3. **Listing notes** — optional free-text context the agent provides ("3BR ranch, sold above asking in 4 days, buyers from Chicago")

Platform-specific constraints (Instagram 2200 char, Reel 150 char, etc.) applied same as Playground.

## What's NOT in Phase 2

- Saving/favoriting generated outputs (Phase 4)
- Bulk-generate all platforms at once (Phase 4)
- Scheduling directly to social (Phase 6)
- Auto-pulling from a recent Playground rewrite (Phase 3 — after URL import lands)

## Success Criteria

- Agent can generate a platform-ready Just Listed Instagram caption in <10 seconds
- Output sounds like them (brand voice applied), not generic AI slop
- Works without brand kit set (graceful fallback to neutral tone)
- 35 templates browsable without scrolling fatigue

## Implementation Order

1. Backend: `TEMPLATE_CONFIGS` array + `/api/template/generate` endpoint
2. Frontend: `Templates.jsx` — category grid + card layout + generate/output flow
3. Routing: add `/templates` route + nav item
4. Polish: loading states, copy confirmation, empty states
