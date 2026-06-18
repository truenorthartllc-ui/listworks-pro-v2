import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from compliance_engine import check_fair_housing_v3, overall_risk, compliance_grade

def test_critical_race_reference():
    v = check_fair_housing_v3("Great home in a predominantly white neighborhood")
    assert any(x["risk"] == "CRITICAL" for x in v), "Expected CRITICAL for race ref"

def test_critical_adults_only():
    v = check_fair_housing_v3("Adults only community, no children allowed")
    assert any(x["risk"] == "CRITICAL" for x in v)

def test_high_schools_steering():
    v = check_fair_housing_v3("Located near great schools and quiet streets")
    rules = [x["rule"] for x in v]
    assert any("school" in r.lower() for r in rules)
    assert any("quiet" in x["phrase"].lower() for x in v)

def test_high_master_bedroom():
    v = check_fair_housing_v3("Spacious master bedroom with en-suite bath")
    assert any("master" in x["phrase"].lower() for x in v)
    assert any(x["risk"] == "HIGH" for x in v)

def test_clean_listing():
    v = check_fair_housing_v3("3-bed 2-bath, 1850 sqft, updated kitchen, attached 2-car garage, walk-in closet.")
    assert v == [], f"Expected clean listing, got: {v}"

def test_violations_sorted_critical_first():
    v = check_fair_housing_v3("White neighborhood with adults only policy near great schools")
    assert v[0]["risk"] == "CRITICAL"

def test_one_violation_per_rule():
    v = check_fair_housing_v3("great schools near great schools with excellent schools")
    school_rules = [x for x in v if "school" in x["rule"].lower()]
    assert len(school_rules) == 1, "Should deduplicate same rule"

def test_overall_risk_critical_wins():
    violations = [
        {"risk": "HIGH"}, {"risk": "CRITICAL"}, {"risk": "LOW"}
    ]
    assert overall_risk(violations) == "CRITICAL"

def test_overall_risk_clean():
    assert overall_risk([]) == "CLEAN"

def test_grade_clean_is_A():
    assert compliance_grade([]) == "A"

def test_grade_critical_is_F():
    assert compliance_grade([{"risk": "CRITICAL"}]) == "F"

def test_grade_high_is_D():
    assert compliance_grade([{"risk": "HIGH"}]) == "D"

def test_violation_has_required_fields():
    v = check_fair_housing_v3("master bedroom in a quiet neighborhood")
    for violation in v:
        for field in ["phrase", "risk", "rule", "hud_citation", "legal_basis", "fix"]:
            assert field in violation, f"Missing field: {field}"
