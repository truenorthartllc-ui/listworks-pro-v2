const STATES = [
  { abbr: "AL", name: "Alabama" }, { abbr: "AK", name: "Alaska" }, { abbr: "AZ", name: "Arizona" },
  { abbr: "AR", name: "Arkansas" }, { abbr: "CA", name: "California" }, { abbr: "CO", name: "Colorado" },
  { abbr: "CT", name: "Connecticut" }, { abbr: "DE", name: "Delaware" }, { abbr: "FL", name: "Florida" },
  { abbr: "GA", name: "Georgia" }, { abbr: "HI", name: "Hawaii" }, { abbr: "ID", name: "Idaho" },
  { abbr: "IL", name: "Illinois" }, { abbr: "IN", name: "Indiana" }, { abbr: "IA", name: "Iowa" },
  { abbr: "KS", name: "Kansas" }, { abbr: "KY", name: "Kentucky" }, { abbr: "LA", name: "Louisiana" },
  { abbr: "ME", name: "Maine" }, { abbr: "MD", name: "Maryland" }, { abbr: "MA", name: "Massachusetts" },
  { abbr: "MI", name: "Michigan" }, { abbr: "MN", name: "Minnesota" }, { abbr: "MS", name: "Mississippi" },
  { abbr: "MO", name: "Missouri" }, { abbr: "MT", name: "Montana" }, { abbr: "NE", name: "Nebraska" },
  { abbr: "NV", name: "Nevada" }, { abbr: "NH", name: "New Hampshire" }, { abbr: "NJ", name: "New Jersey" },
  { abbr: "NM", name: "New Mexico" }, { abbr: "NY", name: "New York" }, { abbr: "NC", name: "North Carolina" },
  { abbr: "ND", name: "North Dakota" }, { abbr: "OH", name: "Ohio" }, { abbr: "OK", name: "Oklahoma" },
  { abbr: "OR", name: "Oregon" }, { abbr: "PA", name: "Pennsylvania" }, { abbr: "RI", name: "Rhode Island" },
  { abbr: "SC", name: "South Carolina" }, { abbr: "SD", name: "South Dakota" }, { abbr: "TN", name: "Tennessee" },
  { abbr: "TX", name: "Texas" }, { abbr: "UT", name: "Utah" }, { abbr: "VT", name: "Vermont" },
  { abbr: "VA", name: "Virginia" }, { abbr: "WA", name: "Washington" }, { abbr: "WV", name: "West Virginia" },
  { abbr: "WI", name: "Wisconsin" }, { abbr: "WY", name: "Wyoming" },
];

// Per-state compliance notes — AI disclosure, Fair Housing specifics, MLS rules
const STATE_COMPLIANCE = {
  CA: { ai: "California REALTORS require AI disclosure in listing content. C.A.R. Form 101 includes AI-generated content clauses.", fh: "California Fair Housing (FEHA) adds protected classes: sexual orientation, gender identity, marital status, source of income.", mls: "CRMLS requires AI-generated content labeling. Max 400 words, no subjective terms." },
  CO: { ai: "Colorado's AI Act (SB 24-205) requires disclosure when AI is used to generate real estate content. Effective 2026.", fh: "Colorado Fair Housing Act mirrors federal law. Denver/Boulder add source of income protection.", mls: "REcolorado: 350 word limit. No 'investment property,' 'great for families.' AI disclosure recommended." },
  FL: { ai: "Florida REALTORS guidance: disclosure recommended when AI materially assists with content creation.", fh: "Florida Fair Housing Act adds familial status, disability. No 'retirement community,' 'family-friendly' without context.", mls: "Florida Realtors MLS: 400 words. No 'motivated seller,' 'must see.' AI disclosure encouraged." },
  NY: { ai: "New York State DFS guidance: AI use in real estate marketing requires disclosure. REBNY recommends labeling.", fh: "NY Human Rights Law adds: marital status, sexual orientation, gender identity, military status, source of income.", mls: "MLS policies vary by board. REBNY: 350 words. No 'bargain,' 'handyman special,' 'investment.'" },
  TX: { ai: "Texas REALTORS: no formal AI disclosure requirement yet. Recommended best practice for transparency.", fh: "Texas Fair Housing Act mirrors federal. No 'perfect for empty nesters,' 'young couples.'", mls: "ABOR/MLS: 350 words. No 'fixer-upper,' 'great starter home.' AI disclosure voluntary." },
  default: { ai: "No specific state AI disclosure law yet. Federal Fair Housing applies. Best practice: disclose AI-assisted content.", fh: "Federal Fair Housing Act: race, color, religion, sex, handicap, familial status, national origin.", mls: "Check local MLS for word limits and prohibited terms. Most ban 'motivated seller,' 'handyman special,' 'investment property.'" },
};

export function getStateInfo(abbr) {
  const state = STATES.find(s => s.abbr === abbr.toUpperCase());
  if (!state) return null;
  return { ...state, compliance: STATE_COMPLIANCE[abbr] || STATE_COMPLIANCE.default };
}

export function getAllStates() {
  return STATES.map(s => ({ ...s, compliance: STATE_COMPLIANCE[s.abbr] || STATE_COMPLIANCE.default }));
}

export default STATES;