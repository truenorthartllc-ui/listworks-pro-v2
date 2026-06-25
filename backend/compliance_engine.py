# backend/compliance_engine.py
import re

# (regex, risk, rule, hud_citation, legal_basis, fix)
FH_PATTERNS_V3 = [
    # CRITICAL — direct protected class references
    (r'\b(white|black|hispanic|asian|latino|latina|african.american|caucasian)\b',
     "CRITICAL", "Protected Class Reference — Race",
     "42 U.S.C. § 3604(c) — FHA Section 804(c)",
     "Directly references a racial group. The FHA prohibits any statement indicating preference or limitation based on race.",
     "Remove all race references. Describe the property only — never the demographic composition of the neighborhood."),

    (r'\b(christian|jewish|muslim|catholic|protestant|hindu|buddhist)\b',
     "CRITICAL", "Protected Class Reference — Religion",
     "42 U.S.C. § 3604(c) — FHA Section 804(c)",
     "References religious affiliation, violating FHA's prohibition on religious discrimination in housing advertising.",
     "Remove religious references. Do not describe proximity to religious institutions as a selling point."),

    (r'\b(handicapped|crippled|retarded|mentally ill)\b',
     "CRITICAL", "Protected Class Reference — Disability (Slur)",
     "42 U.S.C. § 3604(f) — FHA Section 804(f)",
     "Uses discriminatory language related to disability status.",
     "Remove entirely. Describe accessibility factually: 'Step-free entry. First-floor primary suite.'"),

    (r'\b(adults.only|no.children|child.free|18\s*\+\s*community)\b',
     "CRITICAL", "Familial Status Discrimination",
     "42 U.S.C. § 3604(c); 24 CFR § 100.65",
     "Explicitly excludes families with children. Only HUD-approved senior housing (55+ with 80% occupancy or 62+) may lawfully exclude children.",
     "Remove familial status restrictions unless property is a HUD-approved senior community."),

    (r'\b(perfect for (couples?|singles?|retirees?|empty nesters?|young professionals?))\b',
     "CRITICAL", "Familial Status / Age Steering",
     "24 CFR § 100.65; 24 CFR § 100.75",
     "Suggesting a property is 'perfect for' a specific life stage implies other groups are unwelcome — a Fair Housing violation.",
     "Describe features broadly: 'Low-maintenance layout. Walking distance to downtown dining and transit.'"),

    # HIGH — steering language
    (r'\b(great schools?|excellent schools?|top.rated schools?|best schools?)\b',
     "HIGH", "Familial Status Steering — Schools",
     "24 CFR § 100.75 — Prohibited conduct re: familial status",
     "School quality references imply steering families with children — FHA Section 3604(c) per HUD guidance.",
     "Use specific verifiable data: 'Zoned for Jefferson Elementary (GreatSchools: 8/10, verified June 2026).'"),

    (r'\b(safe (neighborhoods?|areas?|community|communities|streets?|blocks?))\b',
     "HIGH", "Racial / National Origin Steering",
     "24 CFR § 100.70(b)(1) — Discriminatory representations",
     "Safety references in real estate advertising frequently imply racial composition. HUD enforcement treats this as steering.",
     "Use verifiable data: 'Neighborhood Watch active since 2018. City crime index 15% below metro average.'"),

    (r'\b(quiet (neighborhoods?|streets?|blocks?|areas?|community|communities))\b',
     "HIGH", "Racial / Familial Status Steering",
     "24 CFR § 100.70 — Discriminatory representations",
     "'Quiet' is commonly used as coded language implying absence of children or racial minorities. HUD enforcement precedent.",
     "Be specific: 'Dead-end street with no through traffic. No commercial zoning within 0.5 miles.'"),

    (r'\b(desirable (areas?|neighborhoods?|location|community|communities))\b',
     "HIGH", "Racial / National Origin Steering",
     "24 CFR § 100.70(b)(1) — Steering",
     "'Desirable' is subjective and can imply racial/ethnic preferences. Has been cited in HUD enforcement actions.",
     "Replace with specifics: 'Walk Score: 91. 0.3mi to Whole Foods. 0.5mi to Green Line stop.'"),

    (r'\b(master (bedroom|suite|bath|bathroom))\b',
     "HIGH", "Racially Coded Language",
     "HUD Guidance 2021; NAR MLS Policy Statement 8.0 (2022)",
     "The term 'master bedroom/suite' has documented racial connotations. Major MLSs (CRMLS, Bright MLS) now prohibit this term.",
     "Use 'primary bedroom,' 'primary suite,' 'owner's suite,' or 'main bedroom.'"),

    (r'\b(good (area|neighborhood|community|schools?))\b',
     "HIGH", "Potential Racial Steering",
     "24 CFR § 100.70 — Discriminatory representations",
     "Subjective quality descriptors applied to neighborhoods frequently function as racial coding in real estate contexts.",
     "Replace with verifiable stats: school ratings, walk scores, proximity to specific named amenities."),

    # MEDIUM — ambiguous, context-dependent
    (r'\b(exclusive (community|neighborhood|area|development|enclave))\b',
     "MEDIUM", "Potential National Origin / Race Steering",
     "24 CFR § 100.70 — Discriminatory representations",
     "'Exclusive' can imply some groups are unwelcome. Context-dependent but flagged for review.",
     "Replace with factual amenity descriptions: 'Gated community with 24/7 staffed entry. HOA-maintained grounds.'"),

    (r'\b(english.speaking|english.only)\b',
     "MEDIUM", "National Origin — Language Requirement",
     "42 U.S.C. § 3604 — National Origin prohibition",
     "Language requirements in housing advertising can constitute national origin discrimination.",
     "Remove language references entirely."),

    (r'\b(international (buyers?|community|neighborhood))\b',
     "MEDIUM", "National Origin Awareness",
     "42 U.S.C. § 3604 — National Origin prohibition",
     "References to 'international' community can imply national origin preferences in either direction.",
     "Describe actual community features without referencing national origin."),

    # LOW — contextual flags
    (r'\b(walking distance)\b',
     "LOW", "Disability Awareness — Mobility",
     "24 CFR § 100.205 — Accessibility considerations",
     "Not a violation, but 'walking distance' excludes consideration for people with mobility impairments.",
     "Add alternatives: 'Walking distance (0.4mi) or 2 min by car/transit to [destination].'"),

    (r'\b(family.friendly|family neighborhood|family community)\b',
     "LOW", "Familial Status — Contextual",
     "24 CFR § 100.65",
     "'Family-friendly' is generally acceptable but can imply non-family households are less welcome.",
     "Balance with broad language: 'Fenced backyard. Multiple parks within 0.5 miles.'"),
]

RISK_ORDER = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}


def check_fair_housing_v3(text: str) -> list[dict]:
    """Run v3 Fair Housing compliance check. Returns violations sorted by severity."""
    violations = []
    text_check = text.lower()
    seen_rules: set[str] = set()

    for pattern, risk, rule, citation, legal_basis, fix in FH_PATTERNS_V3:
        if rule in seen_rules:
            continue
        matches = re.findall(pattern, text_check, re.IGNORECASE)
        if not matches:
            continue
        seen_rules.add(rule)
        raw = matches[0]
        phrase = raw if isinstance(raw, str) else " ".join(m for m in raw if m)
        violations.append({
            "phrase": phrase,
            "risk": risk,
            "rule": rule,
            "hud_citation": citation,
            "legal_basis": legal_basis,
            "fix": fix,
            "acknowledged": False,
            "acknowledged_at": None,
        })

    violations.sort(key=lambda v: RISK_ORDER.get(v["risk"], 4))
    return violations


CO_AI_DISCLOSURE_PATTERNS = [
    r'\bai[- ]generated\b',
    r'\bai[- ]assisted\b',
    r'\bartificial intelligence\b',
    r'\bgenerated (by|with|using) (ai|artificial intelligence|listworks)\b',
    r'\bwritten (by|with|using) (ai|artificial intelligence)\b',
    r'\bcreated (by|with|using) (ai|artificial intelligence)\b',
    r'\blistworks pro\b',
    r'\bthis (listing|description|content|copy) (was |)(generated|created|written|produced) (by|with|using) (ai|artificial intelligence)\b',
    r'\bdisclosure:.*\bai\b',
    r'\bai disclosure\b',
]


def check_co_ai_act(text: str, metadata: dict, use_ai_analysis: bool = True) -> dict:
    """
    Check a listing description for Colorado SB 24-205 (AI Act) compliance.

    Two-layer approach:
    1. Deterministic regex check (fast, legally defensible)
    2. Claude Opus 4.8 quality analysis (disclosure clarity, prominence, effectiveness)

    metadata keys:
      - human_reviewed: bool (default True)
      - agent_name: str
    """
    from datetime import datetime, timezone

    text_lower = text.lower()
    agent_name = metadata.get("agent_name", "")
    human_reviewed = metadata.get("human_reviewed", True)

    # Layer 1: Deterministic disclosure detection
    disclosure_present = any(
        re.search(pat, text_lower, re.IGNORECASE)
        for pat in CO_AI_DISCLOSURE_PATTERNS
    )

    violations = []
    if not disclosure_present:
        violations.append({
            "rule": "AI Disclosure Missing",
            "explanation": (
                "Colorado SB 24-205 requires disclosure whenever AI is used to generate "
                "real estate listing copy. No disclosure phrase was detected in this text."
            ),
            "severity": "CRITICAL",
        })
    if not human_reviewed:
        violations.append({
            "rule": "Human Review Not Attested",
            "explanation": (
                "SB 24-205 requires that a licensed agent reviews and approves AI-generated "
                "content before publication. human_reviewed was set to false."
            ),
            "severity": "HIGH",
        })

    # Layer 2: AI-powered disclosure quality analysis (if disclosure present)
    disclosure_quality = None
    if disclosure_present and use_ai_analysis:
        try:
            import asyncio
            import os
            import httpx

            system_prompt = """You are a Colorado real estate compliance expert analyzing AI disclosure quality under SB 24-205.

The law requires:
1. Clear disclosure that AI was used to generate content
2. Human review by a licensed agent
3. Disclosure must be PROMINENT and TRANSPARENT (not buried in fine print)

Analyze the disclosure and return JSON:
{
  "quality_score": 0-100,
  "prominence": "PROMINENT" | "ADEQUATE" | "BURIED",
  "clarity": "CLEAR" | "VAGUE" | "CONFUSING",
  "issues": ["issue1", "issue2"],
  "strengths": ["strength1", "strength2"],
  "recommendation": "brief improvement suggestion or 'Disclosure meets best practices'"
}"""

            user_prompt = f"""Analyze this listing's AI disclosure for Colorado SB 24-205 compliance:

LISTING TEXT:
{text}

Focus on:
- Is the disclosure CLEAR and SPECIFIC about what AI did?
- Is it PROMINENT (early/visible) or buried at the end?
- Does it name the reviewing agent clearly?
- Does it meet the SPIRIT of the law (consumer transparency)?"""

            async def call_opus():
                key = os.environ.get('OPENROUTER_API_KEY', '')
                if not key:
                    return None
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.post(
                        "https://openrouter.ai/api/v1/chat/completions",
                        headers={
                            "Authorization": f"Bearer {key}",
                            "Content-Type": "application/json",
                        },
                        json={
                            "model": "anthropic/claude-opus-4.5:beta",
                            "messages": [
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_prompt},
                            ],
                            "max_tokens": 1024,
                            "temperature": 0.3,
                        },
                    )
                    if resp.status_code != 200:
                        return None
                    data = resp.json()
                    import json
                    return json.loads(data["choices"][0]["message"]["content"])

            # Run async in sync context
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            disclosure_quality = loop.run_until_complete(call_opus())
            loop.close()

            # Add quality-based violations
            if disclosure_quality:
                if disclosure_quality.get("prominence") == "BURIED":
                    violations.append({
                        "rule": "Disclosure Not Prominent",
                        "explanation": "Disclosure is present but buried in fine print. SB 24-205 requires transparent, prominent disclosure.",
                        "severity": "MEDIUM",
                    })
                if disclosure_quality.get("clarity") == "VAGUE":
                    violations.append({
                        "rule": "Disclosure Lacks Clarity",
                        "explanation": "Disclosure doesn't clearly state what AI did or who reviewed it.",
                        "severity": "MEDIUM",
                    })

        except Exception:
            # AI analysis failed — fall back to regex-only results
            disclosure_quality = None

    agent_label = agent_name if agent_name else "[Agent Name]"
    suggested_disclosure = (
        f"This listing description was generated with AI assistance (ListWorks PRO) "
        f"and reviewed by {agent_label}, a licensed Colorado real estate agent."
    )

    # Grade calculation
    if not violations:
        grade = "COMPLIANT"
    elif any(v["severity"] == "CRITICAL" for v in violations):
        grade = "NON_COMPLIANT"
    else:
        grade = "NEEDS_IMPROVEMENT"

    result = {
        "compliant": len(violations) == 0,
        "disclosure_present": disclosure_present,
        "suggested_disclosure": suggested_disclosure,
        "violations": violations,
        "audit_record": {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "agent_name": agent_name,
            "listing_snippet": text[:200],
            "ai_used": True,
            "human_reviewed": human_reviewed,
            "disclosure_present": disclosure_present,
        },
        "grade": grade,
    }

    if disclosure_quality:
        result["disclosure_quality"] = disclosure_quality

    return result


def overall_risk(violations: list[dict]) -> str:
    if not violations:
        return "CLEAN"
    return min(violations, key=lambda v: RISK_ORDER.get(v["risk"], 4))["risk"]


def compliance_grade(violations: list[dict]) -> str:
    return {"CLEAN": "A", "LOW": "B", "MEDIUM": "C", "HIGH": "D", "CRITICAL": "F"}.get(
        overall_risk(violations), "F"
    )
