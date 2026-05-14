# ListWorks PRO — Full Sprint Plan (May 13, 2026)

## TL;DR
Execute 3 high-impact improvements: Remove Claude branding, remove fake scarcity, add Before/After share card for viral growth.

## Context
External review identified critical revenue blockers:
1. "Powered by Claude" signals competitors can replicate in 20 minutes
2. Fake scarcity "73 spots remaining" damages trust with professional agents
3. No viral loop = single-player tool that doesn't spread organically

## Work Objectives
1. Remove all "Powered by Claude/Anthropic" references from frontend
2. Remove fake "Lifetime spots remaining" scarcity from pricing
3. Build Before/After social share card for viral amplification
4. Build Lead Capture landing page for each listing

## TODOs

- [ ] 1. **Remove Claude branding from Playground.jsx**

  **What to do**:
  - Remove "Powered by Claude AI by Anthropic" text
  - Replace with: "Free for first 3 listings" (keep the trial messaging)

  **References**:
  - `frontend/src/components/Playground.jsx:220`

- [ ] 2. **Remove Claude branding from Footer.jsx**

  **What to do**:
  - Remove "Powered by Claude AI by Anthropic" text
  - Replace with: "© 2026 ListWorks PRO · Made for agents"

  **References**:
  - `frontend/src/components/Footer.jsx:65`

- [ ] 3. **Remove Claude branding from AdvisorPanel.jsx**

  **What to do**:
  - Remove "Powered by Claude" text
  - Replace with: "AI Advisor" only

  **References**:
  - `frontend/src/components/AdvisorPanel.jsx:76`

- [ ] 4. **Remove Claude branding from FloatingAdvisorButton.jsx**

  **What to do**:
  - Remove "Claude" text from button
  - Keep "AI Advisor" only

  **References**:
  - `frontend/src/components/FloatingAdvisorButton.jsx:22`

- [ ] 5. **Remove Claude branding from VoiceDescriptionPanel.jsx**

  **What to do**:
  - Remove "Powered by Claude AI" text
  - Replace with: Just the placeholder text

  **References**:
  - `frontend/src/components/VoiceDescriptionPanel.jsx:181`

- [ ] 6. **Remove GuideUpsell.jsx ChatGPT reference**

  **What to do**:
  - Remove "15 plug-and-play prompts for ChatGPT, Claude, Gemini" from guide pitch

  **References**:
  - `frontend/src/components/GuideUpsell.jsx:48`

- [ ] 7. **Remove fake scarcity from Pricing.jsx**

  **What to do**:
  - Remove "{spotsLeft} Lifetime spots remaining" text
  - Replace with: Simple pricing — no fake urgency

  **References**:
  - `frontend/src/components/Pricing.jsx:115`

- [ ] 8. **Build Before/After Share Card component**

  **What to do**:
  - Create new component `ShareCard.jsx`
  - Shows before/after comparison as beautiful image
  - One-click download/share button
  - Add to Playground after each rewrite

  **References**:
  - `frontend/src/components/Playground.jsx` (where to integrate)
  - `frontend/src/components/BeforeAfter.jsx` (reference existing design)

- [ ] 9. **Build Listing Landing Page Generator**

  **What to do**:
  - Create new page `ShareListing.jsx` (already exists, enhance it)
  - Add lead capture: "Book a Showing" widget
  - Add "Share on Instagram" button
  - Add mortgage pre-approval CTA

  **References**:
  - `frontend/src/pages/SharedListing.jsx` (existing page to enhance)

- [ ] 10. **Push changes and deploy**

  **What to do**:
  - Commit all changes
  - Push to GitHub
  - Netlify auto-deploys

  **References**:
  - `.git` (already linked to Netlify)