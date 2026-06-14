# ListWorks PRO — Design System

> Category: Real Estate SaaS / PropTech
> AI listing description tool for real estate agents. Minimalist, editorial, anti-AI-slop.

## 1. Visual Theme & Atmosphere

ListWorks PRO is light-mode-native. The dominant surface is oat (`#F4F3EF`) — a warm cream that reads as premium paper, not stark white. Against it, ink (`#121212`) provides near-black text with warmth. The brand accent is vermillion (`#FF3B22`) — a bold, confident red-orange used exclusively for primary CTAs and critical highlights. It appears sparingly: one button per section, one stat callout, never decorative.

The aesthetic is editorial-minimalist: generous whitespace, high-contrast type, borders over shadows. The brand deliberately avoids gradients, rounded cards, and soft drop shadows — the visual language of generic SaaS. Instead: sharp edges, flat fills, monospace labels, and table-style grids that communicate precision and professionalism to real estate agents who distrust "AI tools."

**Key Characteristics:**
- Light-mode native: oat (`#F4F3EF`) as page background, white for card surfaces
- Vermillion (`#FF3B22`) as the single accent color — buttons, stats, alerts only
- Klein blue (`#002FA7`) as a secondary accent for trust/compliance contexts (Fair Housing badge)
- Near-black ink (`#121212`) for all primary text — warmer than pure black
- Coal (`#0A0A0A`) for the deepest surfaces (footer, dark sections)
- Bone (`#D1CFC7`) for subtle borders and dividers
- No gradients. No rounded corners above `rounded-sm`. No box-shadow on cards.
- Borders do all structural work: `border border-ink/15` (85% transparent ink)

## 2. Color Palette & Roles

### Backgrounds
- **Oat** (`#F4F3EF`): Primary page background. Warm cream — professional, not clinical.
- **White** (`#FFFFFF`): Card surfaces, input fields, elevated content areas.
- **Coal** (`#0A0A0A`): Footer background, dark hero sections, high-contrast callouts.
- **Bone** (`#D1CFC7`): Subtle section dividers and muted backgrounds.

### Text
- **Ink** (`#121212`): Primary text — all headings, body, UI labels. Near-black with warmth.
- **Ink/70** (`rgba(18,18,18,0.70)`): Secondary text — descriptions, captions.
- **Ink/40** (`rgba(18,18,18,0.40)`): Tertiary text — timestamps, fine print, placeholders.
- **Oat** (`#F4F3EF`): Text on dark backgrounds (coal sections, vermillion buttons).

### Brand & Accent
- **Vermillion** (`#FF3B22`): Primary CTA color. Buttons, sale counters, urgent stats. Used once per section maximum.
- **Klein** (`#002FA7`): Trust + compliance contexts. Fair Housing badge, legal callouts, verification states.

### Borders & Structure
- **Border Default** (`border-ink/15`): Standard card and section borders — ink at 15% opacity.
- **Border Heavy** (`border-ink/30`): Input fields, focused states, table borders.
- **Bone** (`#D1CFC7`): Decorative dividers, footer top border.

### Status
- **Success**: `#16a34a` (green-600) — used only for verified/confirmed states.
- **Warning**: `#d97706` (amber-600) — only for trial limits and soft paywalls.
- **Error**: vermillion at full opacity on white background.

## 3. Typography Rules

### Font Family
- **Display**: `Playfair Display`, serif — hero headlines, section titles, editorial emphasis. Use at 36px+.
- **Heading**: `Outfit`, sans-serif — UI labels, navigation, caps labels, pricing, CTAs.
- **Body**: `DM Sans`, sans-serif — all body text, descriptions, form labels, email copy.
- **Mono**: `JetBrains Mono`, monospace — code, character counts, technical metadata, stat numbers.

### Hierarchy

| Role | Font | Size | Weight | Notes |
|------|------|------|--------|-------|
| Hero Display | Playfair Display | 48–72px | 700 | Negative letter-spacing -0.02em |
| Section Heading | Playfair Display | 32–40px | 600 | Used for `<h2>` section titles |
| Sub-heading | Outfit | 18–24px | 600 | ALL CAPS with `tracking-[0.15em]` for caps labels |
| Body | DM Sans | 15–17px | 400 | Line height 1.6, comfortable reading |
| UI Label | Outfit | 10–12px | 500 | `uppercase tracking-[0.12em]` — navigation, tabs, metadata |
| Mono Stat | JetBrains Mono | 13px | 400 | Character counts, technical labels, before/after scores |
| Caption | DM Sans | 11–13px | 400 | `text-ink/60` — helper text, fine print |

### Voice Rules (applies to all generated copy)
- Direct and specific. "8 seconds" not "lightning fast."
- No AI clichés: banned words include stunning, gorgeous, meticulous, seamlessly, delightful, game-changer, revolutionary, cutting-edge, state-of-the-art, leverage, unlock, elevate, supercharge, dive in, world-class.
- Real estate agents are professionals. Treat them as peers, not students.
- Fair Housing compliance is non-negotiable — never mention protected characteristics (race, religion, national origin, sex, disability, familial status) in property descriptions.
- Before/after framing outperforms abstract claims. Show the rewrite, not just the promise.

## 4. Spacing & Layout

- **Base unit**: 4px (Tailwind default)
- **Section padding**: `py-24` (96px top/bottom) for major page sections
- **Container**: `max-w-6xl mx-auto px-6` (1152px max width, 24px side padding)
- **Card padding**: `p-6` to `p-8` (24–32px) — generous, editorial feel
- **Grid**: 12-column CSS grid for desktop; single column on mobile with `gap-8`
- **Negative space**: err toward more. Sections should breathe. Never cluster elements.

## 5. Components

### Buttons
- **Primary** (`.btn-vermillion`): `bg-vermillion text-oat` — square corners (`rounded-none`), uppercase label, `tracking-[0.15em]`, `px-8 py-4` minimum. One per section.
- **Ghost** (`.btn-ghost-ink`): `border border-ink text-ink` — hover fills with ink, text becomes oat. For secondary actions.
- **Disabled**: `opacity-40 cursor-not-allowed` — no color change, just opacity.

### Cards
- White background, `border border-ink/15`, no border-radius above `rounded-sm`
- `p-6` to `p-8` padding
- No drop shadows — let the border do the work

### Form Inputs
- `border border-ink/20` default, `border-ink/60` on focus
- `bg-white` background, `font-body text-ink`
- No rounded corners — sharp inputs signal precision
- Error state: `border-vermillion` with vermillion message below

### Stat Callouts
- Large mono number (`font-mono text-4xl font-bold`) in vermillion or ink
- Small `Outfit uppercase` label below in `ink/60`
- No background, no border — let the number speak

### Trust Badges
- Klein blue (`#002FA7`) background, white text
- `font-heading text-[10px] uppercase tracking-[0.2em]`
- Used for: Fair Housing Compliant, MLS Ready, Agent Verified

## 6. Motion & Animation

- **Philosophy**: motion communicates state change, not decoration. Minimal.
- **Duration**: 150–200ms for micro-interactions. 400–600ms for page transitions.
- **Easing**: `cubic-bezier(0.2, 0.8, 0.2, 1)` for entrances (rise animation).
- **Rise**: `transform: translateY(16px) → translateY(0)` + `opacity: 0 → 1` — used for cards entering viewport.
- No parallax. No looping background animations. No hover scale transforms above 1.02.

## 7. Voice & Tone

**Brand voice**: Precise, professional, direct. The tone of a senior agent who has seen every AI tool oversell itself.

- Headlines: short, declarative, specific. "8-second listing rewrites" not "Transform your listings instantly."
- CTAs: action + outcome. "Rewrite This Listing" not "Get Started."
- Social proof: specific numbers only. "1,164 agents" not "thousands of agents."
- Error messages: explain what happened and what to do. "Too long — max 8,000 characters. Trim the extras."
- Feature names: plain English. "Fair Housing Check" not "ComplianceGuard™."

**Banned patterns:**
- Exclamation marks in UI labels
- "We" statements in feature descriptions (show, don't claim)
- Rhetorical questions ("Tired of spending hours writing listings?")
- Em-dashes used decoratively (only for asides)
- AI slop adjectives (stunning, meticulously crafted, seamlessly integrated)

## 8. Brand Identity

**Product**: ListWorks PRO
**Tagline**: AI Listing Descriptions for Real Estate Agents
**Domain**: listworks.pro
**Primary CTA**: "Rewrite My Listing" or "Try It Free"
**Proof point**: "8 seconds. MLS-ready. Fair Housing compliant."
**Differentiator**: The only listing tool that automatically flags Fair Housing compliance issues.
**Price anchor**: From $29/mo — agents spend 20+ minutes per listing. That's $50+ of their time.
**Audience**: US real estate agents, 25–55, any platform (CRMLS, Bright MLS, GAMLS, etc.)
**Affiliate**: 30% commission, free PRO access for creators

## 9. Anti-Patterns

Never use:
- Rounded "pill" buttons (use square corners — we're not a fintech app)
- Gradient backgrounds or gradient text
- Dark mode (the tool is light-mode only)
- Stock photography of people looking at laptops
- The word "revolutionary," "game-changing," or "cutting-edge"
- Emoji in UI (except favicon and social)
- Multiple accent colors in the same section (vermillion is the only CTA color)
- Center-aligned body text (left-align all body copy)
- Borders thicker than 1px
- AI-generated property descriptions as examples (always use real, specific addresses)

**Design health check**: If it looks like it could be a generic SaaS template, it's wrong. Every page should be identifiable as ListWorks within 2 seconds.
