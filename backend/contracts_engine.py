"""
Contract engine — real estate form library with field explanations, 
branded PDF generation, and fillable form support.

Every form has:
- Sections with field-by-field explanations (what each line means)
- Logo/agent branding overlay
- Fillable field generation
- PDF export

Forms catalog covers the most common US real estate contracts.
"""

import os, json, io, base64, re
from datetime import datetime
from pathlib import Path

# Try reportlab for PDF gen
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.units import inch
    from reportlab.lib.colors import HexColor, black, white
    from reportlab.pdfgen import canvas
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.platypus import Paragraph, Table, TableStyle
    HAS_REPORTLAB = True
except ImportError:
    HAS_REPORTLAB = False

# ─── Form Definitions ────────────────────────────────────────────────────────
# Each form: id, name, category, description, sections[] with fields[]
# Every field has: label, explanation (what it means for the agent/client), type, required

FORMS_CATALOG = [
    {
        "id": "listing-agreement",
        "name": "Exclusive Right-to-Sell Listing Agreement",
        "category": "listing",
        "description": "Standard listing agreement between seller and brokerage. Defines commission, term, and obligations.",
        "sections": [
            {
                "title": "Property Information",
                "fields": [
                    {"id": "property_address", "label": "Property Address", "type": "text", "required": True,
                     "explanation": "The full street address of the property being listed. Must include city, state, and ZIP."},
                    {"id": "legal_description", "label": "Legal Description", "type": "text", "required": False,
                     "explanation": "The official lot and block number from the county assessor. Not always required but helps with title work."},
                    {"id": "parcel_number", "label": "Parcel / APN Number", "type": "text", "required": False,
                     "explanation": "Assessor's Parcel Number — the county's unique ID for this property."},
                ]
            },
            {
                "title": "Listing Price & Terms",
                "fields": [
                    {"id": "list_price", "label": "Listing Price ($)", "type": "currency", "required": True,
                     "explanation": "The initial asking price. This is what the property is marketed at. Agent should provide a CMA to support this price."},
                    {"id": "commission_total", "label": "Total Commission (%)", "type": "percentage", "required": True,
                     "explanation": "Total commission paid to listing brokerage, typically 5-6%. This is split between listing and buyer broker at closing."},
                    {"id": "listing_broker_commission", "label": "Listing Broker Share (%)", "type": "percentage", "required": True,
                     "explanation": "The portion retained by the listing brokerage after the buyer broker is paid. Negotiable."},
                    {"id": "cooperating_broker_commission", "label": "Buyer Broker Share (%)", "type": "percentage", "required": True,
                     "explanation": "The portion offered to the buyer's brokerage. Must be clearly stated — affects buyer agent willingness to show."},
                    {"id": "term_days", "label": "Listing Term (days)", "type": "number", "required": True,
                     "explanation": "How long the listing agreement is in effect. Typical: 90-180 days. Longer terms give the agent more time but lock the seller in."},
                ]
            },
            {
                "title": "Seller Representations",
                "fields": [
                    {"id": "seller_name", "label": "Seller Name(s)", "type": "text", "required": True,
                     "explanation": "Full legal name(s) of all owners. All owners must sign for the agreement to be enforceable."},
                    {"id": "title_holder", "label": "How is title held?", "type": "select", "required": False,
                     "options": ["Joint Tenants", "Tenants in Common", "Sole Ownership", "Community Property", "Trust"],
                     "explanation": "How ownership is structured. Affects signatures needed at closing. Joint Tenants = all must sign."},
                    {"id": "seller_disclosures", "label": "Seller Disclosures Attached?", "type": "checkbox", "required": True,
                     "explanation": "State-mandated disclosure forms (lead-based paint, property condition, natural hazards, etc.) must be provided to buyers. Check YES only if you have them."},
                    {"id": "home_warranty", "label": "Home Warranty Provided?", "type": "checkbox", "required": False,
                     "explanation": "Optional home warranty plan paid by seller. Usually $300-600. Can make a listing more attractive."},
                ]
            },
            {
                "title": "Additional Terms",
                "fields": [
                    {"id": "exclusions", "label": "Excluded Items", "type": "textarea", "required": False,
                     "explanation": "List any items that are not included in the sale (chandeliers, curtains, specific appliances). Be specific to avoid disputes."},
                    {"id": "special_terms", "label": "Special Terms", "type": "textarea", "required": False,
                     "explanation": "Any additional negotiated terms: leaseback period, early termination rights, mediation requirements."},
                ]
            },
        ]
    },
    {
        "id": "purchase-agreement",
        "name": "Residential Purchase Agreement",
        "category": "transaction",
        "description": "The main contract between buyer and seller. Covers price, contingencies, closing timeline, and all terms of the sale.",
        "sections": [
            {
                "title": "Buyer & Seller Information",
                "fields": [
                    {"id": "buyer_name", "label": "Buyer Name(s)", "type": "text", "required": True,
                     "explanation": "Full legal name(s) of the buyer(s). All buyers must sign unless power of attorney is in place."},
                    {"id": "seller_name", "label": "Seller Name(s)", "type": "text", "required": True,
                     "explanation": "Full legal name(s) of the seller(s) — must match the vesting on title."},
                ]
            },
            {
                "title": "Purchase Price & Financing",
                "fields": [
                    {"id": "purchase_price", "label": "Purchase Price ($)", "type": "currency", "required": True,
                     "explanation": "The agreed purchase price. Must match the offer and any counter-offers."},
                    {"id": "earnest_money", "label": "Earnest Money Deposit ($)", "type": "currency", "required": True,
                     "explanation": "Good-faith deposit held in escrow. Usually 1-3% of purchase price. Forfeited if buyer defaults without a contingency."},
                    {"id": "financing_type", "label": "Financing Type", "type": "select", "required": True,
                     "options": ["Cash", "Conventional", "FHA", "VA", "USDA"],
                     "explanation": "How the buyer is paying. Cash = no loan contingency. FHA/VA have specific appraisal and property condition requirements."},
                    {"id": "loan_amount", "label": "Loan Amount ($)", "type": "currency", "required": False,
                     "explanation": "If financing, the amount being borrowed. Must be consistent with the down payment."},
                    {"id": "down_payment", "label": "Down Payment ($)", "type": "currency", "required": False,
                     "explanation": "Buyer's cash contribution. For conventional loans, minimum varies by lender."},
                ]
            },
            {
                "title": "Contingencies",
                "fields": [
                    {"id": "inspection_period", "label": "Inspection Period (days)", "type": "number", "required": True,
                     "explanation": "Days buyer has to complete inspections and request repairs. Typical: 10-17 days. Buyer can terminate or negotiate repairs during this window."},
                    {"id": "appraisal_contingency", "label": "Appraisal Contingency?", "type": "select", "required": True,
                     "options": ["Yes", "Yes — Waived after ___ days", "No (Waived)"],
                     "explanation": "If YES, buyer can walk away if the property appraises below purchase price. Waiving this means buyer covers the gap or proceeds anyway."},
                    {"id": "loan_contingency", "label": "Loan Contingency?", "type": "select", "required": True,
                     "options": ["Yes", "No (Waived)"],
                     "explanation": "If YES, buyer can back out if financing falls through. Waived for cash offers or strong buyers."},
                    {"id": "sale_of_home", "label": "Contingent on Sale of Buyer's Home?", "type": "checkbox", "required": False,
                     "explanation": "If buyer needs to sell their current home first, this contingency protects them. Sellers should be cautious — it creates uncertainty."},
                ]
            },
            {
                "title": "Closing & Possession",
                "fields": [
                    {"id": "closing_date", "label": "Closing Date", "type": "date", "required": True,
                     "explanation": "The date ownership transfers. Typically 30-60 days from offer acceptance. Must be a business day."},
                    {"id": "possession_date", "label": "Possession Date", "type": "date", "required": True,
                     "explanation": "When the buyer can take physical possession. Usually at closing, but sometimes post-closing leaseback is negotiated."},
                    {"id": "closing_location", "label": "Closing Location / Escrow Company", "type": "text", "required": True,
                     "explanation": "The title company or escrow office handling the closing."},
                ]
            },
        ]
    },
    {
        "id": "disclosure-cond",
        "name": "Seller Property Condition Disclosure",
        "category": "disclosure",
        "description": "State-mandated disclosure form where seller reveals known property defects. Varies by state — this is a general template.",
        "sections": [
            {
                "title": "Property Systems",
                "fields": [
                    {"id": "roof_age", "label": "Roof Age & Condition", "type": "text", "required": True,
                     "explanation": "Approximate age of roof and any known issues. Buyers will inspect regardless, but honesty here builds trust."},
                    {"id": "hvac_age", "label": "HVAC System Age", "type": "text", "required": True,
                     "explanation": "Age of furnace and AC. Older systems (15+ years) are common negotiation points."},
                    {"id": "electrical", "label": "Electrical Issues?", "type": "select", "required": True,
                     "options": ["No Known Issues", "Minor (explain)", "Major (explain)"],
                     "explanation": "Known electrical problems (outdated panel, knob-and-tube, exposed wiring). Must disclose for safety and insurance."},
                    {"id": "plumbing", "label": "Plumbing Issues?", "type": "select", "required": True,
                     "options": ["No Known Issues", "Minor (explain)", "Major (explain)"],
                     "explanation": "Known plumbing problems (leaks, polybutylene pipes, sewer line issues)."} ,
                    {"id": "water_damage", "label": "Past or Present Water Damage?", "type": "select", "required": True,
                     "options": ["No", "Yes — Repaired", "Yes — Unresolved"],
                     "explanation": "Must disclose past leaks, flooding, or moisture issues. Failure to disclose can lead to lawsuits post-sale."},
                ]
            },
            {
                "title": "Other Disclosures",
                "fields": [
                    {"id": "death_on_property", "label": "Death on Property (within 3 years)?", "type": "select", "required": True,
                     "options": ["No", "Yes"],
                     "explanation": "Some states require disclosure of deaths on the property within a certain timeframe. Check state law."},
                    {"id": "hoa", "label": "HOA / Covenants?", "type": "select", "required": True,
                     "options": ["No", "Yes"],
                     "explanation": "If the property is in an HOA, buyer needs to review CC&Rs, fees, and rules before closing."},
                    {"id": "environmental", "label": "Known Environmental Hazards?", "type": "textarea", "required": False,
                     "explanation": "Lead paint (pre-1978), asbestos, radon, mold, underground tanks, or flood zone status."},
                ]
            },
        ]
    },
    {
        "id": "lease-agreement",
        "name": "Residential Lease Agreement",
        "category": "rental",
        "description": "Standard lease contract between landlord and tenant. Covers rent, deposit, term, and property rules.",
        "sections": [
            {
                "title": "Parties & Property",
                "fields": [
                    {"id": "landlord_name", "label": "Landlord / Property Manager", "type": "text", "required": True,
                     "explanation": "The property owner or authorized manager."},
                    {"id": "tenant_name", "label": "Tenant Name(s)", "type": "text", "required": True,
                     "explanation": "All adults occupying the unit must be named and sign the lease."},
                    {"id": "property_address", "label": "Rental Property Address", "type": "text", "required": True,
                     "explanation": "Full address including unit number if applicable."},
                ]
            },
            {
                "title": "Financial Terms",
                "fields": [
                    {"id": "monthly_rent", "label": "Monthly Rent ($)", "type": "currency", "required": True,
                     "explanation": "Base rent due each month. Does not include utilities or fees unless specified."},
                    {"id": "security_deposit", "label": "Security Deposit ($)", "type": "currency", "required": True,
                     "explanation": "Refundable deposit held for damages. Most states limit to 1-2 months rent. Must be returned within state-mandated timeline."},
                    {"id": "late_fee", "label": "Late Fee ($ after grace period)", "type": "currency", "required": False,
                     "explanation": "Fee charged if rent is not paid by the due date + grace period. Must be stated explicitly to be enforceable."},
                    {"id": "utilities", "label": "Utilities Included?", "type": "textarea", "required": False,
                     "explanation": "Which utilities the landlord covers (water, trash, gas, electric, internet). Be specific."},
                ]
            },
            {
                "title": "Term & Rules",
                "fields": [
                    {"id": "lease_start", "label": "Lease Start Date", "type": "date", "required": True},
                    {"id": "lease_end", "label": "Lease End Date", "type": "date", "required": True,
                     "explanation": "Fixed term. Month-to-month automatically follows unless specified."},
                    {"id": "pets", "label": "Pets Allowed?", "type": "select", "required": True,
                     "options": ["No", "Yes — with deposit", "Yes — no deposit"],
                     "explanation": "Pet policy. Pet deposits are often partially refundable. Service animals are NOT pets under law."},
                    {"id": "smoking", "label": "Smoking Allowed?", "type": "select", "required": True,
                     "options": ["No", "Yes — Designated Areas Only", "Yes"],
                     "explanation": "Smoking policy. Designated areas must be clearly marked."},
                    {"id": "subletting", "label": "Subletting Allowed?", "type": "select", "required": True,
                     "options": ["No", "Yes — with written approval"],
                     "explanation": "If allowed, tenant can find replacement tenants. Landlord must approve in writing."},
                ]
            },
        ]
    },
    {
        "id": "buyer-rep-agreement",
        "name": "Buyer Representation Agreement",
        "category": "representation",
        "description": "Exclusive agreement between buyer and their agent. Defines agent duties, compensation, and term.",
        "sections": [
            {
                "title": "Buyer & Agent",
                "fields": [
                    {"id": "buyer_name", "label": "Buyer Name(s)", "type": "text", "required": True,
                     "explanation": "All buyers represented under this agreement."},
                    {"id": "agent_name", "label": "Agent Name", "type": "text", "required": True},
                    {"id": "brokerage_name", "label": "Brokerage Name", "type": "text", "required": True},
                ]
            },
            {
                "title": "Compensation & Term",
                "fields": [
                    {"id": "compensation", "label": "Compensation Agreement", "type": "select", "required": True,
                     "options": ["Paid by Listing Brokerage", "Paid by Buyer (%)", "Flat Fee ($)"],
                     "explanation": "How the agent gets paid. Most common: paid by listing brokerage through commission split. If buyer pays, amount is negotiable."},
                    {"id": "term_months", "label": "Agreement Term (months)", "type": "number", "required": True,
                     "explanation": "How long the buyer is represented. Typical: 3-6 months. After expiry, buyer is no longer obligated."},
                    {"id": "geographic_area", "label": "Geographic Area", "type": "text", "required": True,
                     "explanation": "Counties or specific cities covered. Buyer can work with any agent outside this area."},
                ]
            },
        ]
    },
]


# ─── Helpers ──────────────────────────────────────────────────────────────────

def get_form(form_id):
    """Get a single form definition by ID."""
    for form in FORMS_CATALOG:
        if form["id"] == form_id:
            return form
    return None

def get_forms_by_category(category=None):
    """Get all forms, optionally filtered by category."""
    if category:
        return [f for f in FORMS_CATALOG if f["category"] == category]
    return FORMS_CATALOG

def get_categories():
    """Get unique form categories."""
    cats = {}
    for f in FORMS_CATALOG:
        c = f["category"]
        if c not in cats:
            cats[c] = {"id": c, "count": 0}
        cats[c]["count"] += 1
    return list(cats.values())


# ─── PDF Generation ───────────────────────────────────────────────────────────

def generate_fillable_pdf(form_id, field_values=None, brand=None):
    """
    Generate a branded fillable PDF for a given form.
    
    Args:
        form_id: ID from FORMS_CATALOG
        field_values: dict of {field_id: value} for pre-filling
        brand: dict with {logo_url, primary_color, secondary_color, agent_name, brokerage}
    
    Returns:
        bytes of the generated PDF (or None if failed)
    """
    if not HAS_REPORTLAB:
        return None

    form = get_form(form_id)
    if not form:
        return None

    if field_values is None:
        field_values = {}
    if brand is None:
        brand = {}

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    w, h = letter  # 612 x 792

    primary = brand.get("primary_color", "#1a1a2e")
    secondary = brand.get("secondary_color", "#d63b1e")
    logo_url = brand.get("logo_url", "")
    agent_name = brand.get("agent_name", "")
    brokerage = brand.get("brokerage", "")

    y = h - 36  # start from top

    # ── Header with branding ──
    c.setFillColor(HexColor(primary))
    c.rect(0, h - 60, w, 60, fill=1, stroke=0)
    c.setFillColor(white)
    c.setFont("Helvetica-Bold", 16)
    c.drawString(36, h - 42, form["name"])

    c.setFont("Helvetica", 9)
    c.drawString(36, h - 54, f"Generated: {datetime.now().strftime('%B %d, %Y')}  |  {brokerage}")

    if logo_url:
        try:
            # Try to draw logo at top-right
            import urllib.request
            logo_data = urllib.request.urlopen(logo_url).read()
            logo_buf = io.BytesIO(logo_data)
            c.drawImage(logo_buf, w - 140, h - 50, width=100, height=40, preserveAspectRatio=True)
        except:
            pass

    y = h - 80

    # ── Sections ──
    for section in form["sections"]:
        if y < 120:
            c.showPage()
            y = h - 36

        # Section header
        c.setFillColor(HexColor(secondary))
        c.rect(36, y - 18, w - 72, 22, fill=1, stroke=0)
        c.setFillColor(white)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(44, y - 14, section["title"])
        y -= 30

        c.setFillColor(black)
        c.setFont("Helvetica", 8)

        for field in section["fields"]:
            if y < 80:
                c.showPage()
                y = h - 36

            # Field label
            c.setFont("Helvetica-Bold", 9)
            label = field["label"]
            if field.get("required"):
                label += " *"
            c.drawString(44, y - 10, label)

            # Pre-filled value or blank line
            val = field_values.get(field["id"], "")
            c.setFont("Helvetica", 9)
            if val:
                c.setFillColor(HexColor("#333333"))
                c.drawString(170, y - 10, str(val))
            else:
                c.setFillColor(HexColor("#cccccc"))
                c.drawString(170, y - 10, "___________________________")

            # Explanation (small text below)
            c.setFillColor(HexColor("#666666"))
            c.setFont("Helvetica", 6.5)
            expl = field.get("explanation", "")
            # Word wrap explanation
            words = expl.split()
            line = ""
            x_pos = 44
            for word in words:
                test_line = line + " " + word if line else word
                if c.stringWidth(test_line, "Helvetica", 6.5) > w - 88:
                    c.drawString(x_pos, y - 22, line)
                    y -= 10
                    line = word
                else:
                    line = test_line
            if line:
                c.drawString(x_pos, y - 22, line)

            y -= 34

    # ── Footer ──
    c.setFillColor(HexColor("#999999"))
    c.setFont("Helvetica", 7)
    c.drawString(36, 24, f"Generated by ListWorks PRO — {brokerage}")
    c.drawRightString(w - 36, 24, f"Page 1")

    c.save()
    return buf.getvalue()


def generate_form_preview(form_id, brand=None):
    """Generate a simple HTML preview of a form with branding."""
    form = get_form(form_id)
    if not form:
        return "<p>Form not found.</p>"

    primary = "#1a1a2e"
    secondary = "#d63b1e"
    if brand:
        primary = brand.get("primary_color", primary)
        secondary = brand.get("secondary_color", secondary)

    agent_name = brand.get("agent_name", "") if brand else ""
    brokerage = brand.get("brokerage", "") if brand else ""

    html = f"""
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:800px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.1)">
      <div style="background:{primary};color:#fff;padding:24px 32px">
        <h1 style="margin:0 0 4px;font-size:20px">{form['name']}</h1>
        <p style="margin:0;opacity:.7;font-size:13px">{form['description']}</p>
        <p style="margin:4px 0 0;opacity:.5;font-size:11px">{brokerage} | {agent_name}</p>
      </div>
      <div style="padding:24px 32px">
    """

    for section in form["sections"]:
        html += f"""
        <div style="margin-bottom:24px">
          <h2 style="color:{secondary};font-size:14px;margin:0 0 12px;padding-bottom:6px;border-bottom:2px solid {secondary}">{section['title']}</h2>
        """
        for field in section["fields"]:
            req = '<span style="color:#c00">*</span>' if field.get("required") else ""
            html += f"""
          <div style="margin-bottom:10px;padding:10px 14px;background:#f9f9f9;border-radius:6px;">
            <strong style="font-size:13px">{field['label']} {req}</strong>
            <p style="margin:4px 0 0;font-size:11px;color:#666;line-height:1.5">{field.get('explanation', '')}</p>
          </div>
          """
        html += "</div>"

    html += f"""
      <div style="text-align:center;padding:20px">
        <span style="background:{secondary};color:#fff;padding:10px 24px;border-radius:6px;font-size:13px">📄 Download Fillable PDF</span>
      </div>
      </div></div>
    """
    return html
