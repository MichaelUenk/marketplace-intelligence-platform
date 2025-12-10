"""
Generate Demo Data for Intent Analysis Tab

Creates realistic deal intent data matching the IBOOD_INTENT_ANALYSIS_SPEC.md examples.
"""

from datetime import datetime, timedelta
import sys
import os

# Add the src directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from atlas.services.intent import (
    IntentEngine,
    PersonaType,
    EngagementLevel,
    RiskSeverity,
    RiskCategory,
)


def generate_demo_data():
    """Generate demo intent analysis data"""
    engine = IntentEngine()

    # ==========================================================================
    # DEAL 1: Philips Personal Care (from spec example)
    # ==========================================================================
    print("Creating Philips Personal Care deal...")

    philips_deal = engine.create_deal_intent(
        deal_id="deal-philips-pc-001",
        deal_name="Philips Personal Care",
        deal_value=450000,
        deal_stage="commit",
        close_date=datetime.now() + timedelta(days=11),  # Dec 20
    )

    # Add personas
    maria = engine.add_persona(
        deal_id="deal-philips-pc-001",
        contact_name="Maria van den Berg",
        contact_title="CFO Benelux",
        persona_type=PersonaType.ECONOMIC_BUYER,
        contact_email="maria.vandenberg@philips.com",
        engagement_level=EngagementLevel.SILENT,
        influence_score=90,
        can_veto=False,
        can_approve=True,
        motivations=["Improve working capital", "Hit Q4 targets", "Board pressure"],
        concerns=["Brand reputation", "Analyst reaction"],
    )
    maria.last_engagement_date = datetime.now() - timedelta(days=4)
    maria.response_time_avg_hours = 48

    peter = engine.add_persona(
        deal_id="deal-philips-pc-001",
        contact_name="Peter de Jong",
        contact_title="Supply Chain Director",
        persona_type=PersonaType.TECHNICAL_BUYER,
        contact_email="peter.dejong@philips.com",
        engagement_level=EngagementLevel.ENGAGED,
        influence_score=75,
        can_veto=False,
        can_approve=False,
        motivations=["Clear warehouse space", "Streamline operations"],
        concerns=["Logistics complexity", "Timing"],
    )
    peter.last_engagement_date = datetime.now() - timedelta(days=1)

    jan = engine.add_persona(
        deal_id="deal-philips-pc-001",
        contact_name="Jan de Vries",
        contact_title="Sales Director Benelux",
        persona_type=PersonaType.CHAMPION,
        contact_email="jan.devries@philips.com",
        engagement_level=EngagementLevel.ENGAGED,
        influence_score=85,
        can_veto=False,
        can_approve=False,
        motivations=["Hit Q4 revenue target", "Clear excess stock", "Show initiative", "Build iBOOD relationship"],
        concerns=["Brand perception", "Internal politics", "Competitor reaction", "Marketing pushback"],
    )
    jan.last_engagement_date = datetime.now()
    jan.response_time_avg_hours = 2

    sophie = engine.add_persona(
        deal_id="deal-philips-pc-001",
        contact_name="Sophie Bakker",
        contact_title="Brand Manager",
        persona_type=PersonaType.USER_BUYER,
        contact_email="sophie.bakker@philips.com",
        engagement_level=EngagementLevel.CAUTIOUS,
        influence_score=60,
        can_veto=False,
        can_approve=False,
        motivations=["Protect brand image", "Control messaging"],
        concerns=["Discount positioning", "Channel conflict"],
    )
    sophie.last_engagement_date = datetime.now() - timedelta(days=2)

    thomas = engine.add_persona(
        deal_id="deal-philips-pc-001",
        contact_name="Thomas Mueller",
        contact_title="EU Marketing Director",
        persona_type=PersonaType.BLOCKER,
        contact_email="thomas.mueller@philips.com",
        engagement_level=EngagementLevel.BLOCKING,
        influence_score=80,
        can_veto=True,
        can_approve=False,
        motivations=["Brand consistency", "Premium positioning"],
        concerns=["Discount channels", "Brand dilution"],
    )

    # Score BANT
    engine.score_bant("deal-philips-pc-001", {
        "budget_confirmed": True,
        "budget_amount": 450000,
        "po_ready": False,
        "budget_approval_process_clear": True,
        "need_critical": True,
        "need_quantified": True,
        "need_urgent": True,
        "need_description": "€120M excess inventory in Personal Care division, 200K+ units",
        "personal_stakes": ["Jan's Q4 bonus", "CFO board pressure"],
        "deadline_hard": True,
        "deadline_event_driven": True,
        "deadline_driver": "Year-end financial close Dec 31, Q1 product launch needs warehouse space",
        "timeline_slipped": True,
        "original_close_date": "Dec 15",
    })

    # SPIN Analysis
    engine.analyze_spin(
        deal_id="deal-philips-pc-001",
        situation={
            "content": "€120M excess inventory in Personal Care division. 200K+ units of grooming products (OneBlade, shavers). Year-end financial close approaching (Dec 31). New product launch Q1 2025 needs warehouse space. 3 distribution centers in EU.",
            "confidence": 95,
            "sources": ["Earnings call", "Jan de Vries"],
        },
        problem={
            "content": "Q4 inventory targets at risk. Warehouse costs increasing. Cash tied up in stock. Traditional retail channels saturated. Previous clearance attempt through outlet stores failed. Marketing team resistant to 'discount' positioning.",
            "confidence": 90,
            "sources": ["Jan de Vries", "Maria van den Berg (CFO)"],
        },
        implication={
            "content": "Write-down on Q4 financials (analyst pressure). Warehouse overflow costs (~€200K/month). Q1 launch delayed due to space constraints. Jan's Q4 bonus at risk. CFO under board pressure to improve working capital.",
            "confidence": 85,
            "sources": ["Jan (implied)", "Public financials"],
        },
        need_payoff={
            "content": "Clear €48M+ in inventory. Free up warehouse for Q1 product launch. Improve cash position before year-end. Avoid write-down impact on stock price. Jan hits bonus target. Builds ongoing iBOOD channel for future inventory needs.",
            "confidence": 90,
            "sources": ["Jan de Vries", "Peter de Jong"],
        },
    )

    # Run Paranoid Twin
    engine.run_paranoid_twin("deal-philips-pc-001", {
        "timeline_slipped": True,
        "original_close_date": "Dec 15",
        "competitor_mentioned": True,
        "competitors": ["Veepee", "Groupon"],
    })

    # ==========================================================================
    # DEAL 2: Sony Audio (Strong deal - ready for commit)
    # ==========================================================================
    print("Creating Sony Audio deal...")

    sony_deal = engine.create_deal_intent(
        deal_id="deal-sony-audio-001",
        deal_name="Sony Audio",
        deal_value=380000,
        deal_stage="commit",
        close_date=datetime.now() + timedelta(days=6),  # Dec 15
    )

    # Add personas - all engaged, no blockers
    engine.add_persona(
        deal_id="deal-sony-audio-001",
        contact_name="Yuki Tanaka",
        contact_title="VP Sales EMEA",
        persona_type=PersonaType.ECONOMIC_BUYER,
        contact_email="yuki.tanaka@sony.com",
        engagement_level=EngagementLevel.ENGAGED,
        influence_score=95,
        can_approve=True,
        motivations=["Clear seasonal inventory", "Meet annual targets"],
    )

    engine.add_persona(
        deal_id="deal-sony-audio-001",
        contact_name="Henrik Larsson",
        contact_title="Procurement Manager",
        persona_type=PersonaType.CHAMPION,
        contact_email="henrik.larsson@sony.com",
        engagement_level=EngagementLevel.ENGAGED,
        influence_score=80,
        motivations=["Build iBOOD relationship", "Streamline clearance process"],
    )

    engine.add_persona(
        deal_id="deal-sony-audio-001",
        contact_name="Emma Schmidt",
        contact_title="Operations Director",
        persona_type=PersonaType.TECHNICAL_BUYER,
        contact_email="emma.schmidt@sony.com",
        engagement_level=EngagementLevel.ENGAGED,
        influence_score=70,
    )

    # Score BANT - strong scores
    engine.score_bant("deal-sony-audio-001", {
        "budget_confirmed": True,
        "budget_amount": 380000,
        "po_ready": True,
        "budget_approval_process_clear": True,
        "need_critical": True,
        "need_quantified": True,
        "need_urgent": True,
        "need_description": "150K units of headphones and speakers, warehouse clearing required",
        "personal_stakes": [],
        "deadline_hard": True,
        "deadline_event_driven": True,
        "deadline_driver": "Fiscal year end, new product line launching",
        "timeline_slipped": False,
    })

    # SPIN Analysis
    engine.analyze_spin(
        deal_id="deal-sony-audio-001",
        situation={
            "content": "Sony Audio division with 150K units excess stock. Headphones and speakers from 2023 line. Fiscal year ending.",
            "confidence": 90,
            "sources": ["Yuki Tanaka", "Henrik Larsson"],
        },
        problem={
            "content": "Need to clear inventory before new product launch. Warehouse capacity constraints.",
            "confidence": 85,
            "sources": ["Emma Schmidt"],
        },
        implication={
            "content": "Delayed product launch if warehouse not cleared. Write-down risk.",
            "confidence": 80,
            "sources": ["Yuki Tanaka"],
        },
        need_payoff={
            "content": "Clear inventory quickly, recover capital, make space for new line.",
            "confidence": 90,
            "sources": ["Team consensus"],
        },
    )

    # Run Paranoid Twin (should come back clear)
    engine.run_paranoid_twin("deal-sony-audio-001", {
        "timeline_slipped": False,
        "competitor_mentioned": False,
    })

    # ==========================================================================
    # DEAL 3: Tefal Cookware (Needs attention)
    # ==========================================================================
    print("Creating Tefal Cookware deal...")

    tefal_deal = engine.create_deal_intent(
        deal_id="deal-tefal-cookware-001",
        deal_name="Tefal Cookware",
        deal_value=220000,
        deal_stage="commit",
        close_date=datetime.now() + timedelta(days=13),  # Dec 22
    )

    engine.add_persona(
        deal_id="deal-tefal-cookware-001",
        contact_name="Jean-Pierre Dubois",
        contact_title="Commercial Director",
        persona_type=PersonaType.ECONOMIC_BUYER,
        contact_email="jp.dubois@tefal.com",
        engagement_level=EngagementLevel.ENGAGED,
        influence_score=85,
        can_approve=True,
    )

    engine.add_persona(
        deal_id="deal-tefal-cookware-001",
        contact_name="Claire Martin",
        contact_title="Account Manager",
        persona_type=PersonaType.CHAMPION,
        contact_email="claire.martin@tefal.com",
        engagement_level=EngagementLevel.ENGAGED,
        influence_score=70,
    )

    # Add a cautious user buyer
    engine.add_persona(
        deal_id="deal-tefal-cookware-001",
        contact_name="Marc Lefevre",
        contact_title="Retail Channel Manager",
        persona_type=PersonaType.USER_BUYER,
        contact_email="marc.lefevre@tefal.com",
        engagement_level=EngagementLevel.CAUTIOUS,
        influence_score=60,
        concerns=["Retail partner conflicts", "Channel cannibalization"],
    )

    engine.score_bant("deal-tefal-cookware-001", {
        "budget_confirmed": True,
        "budget_amount": 220000,
        "po_ready": False,
        "budget_approval_process_clear": True,
        "need_critical": True,
        "need_quantified": True,
        "need_urgent": False,
        "need_description": "Excess cookware stock from seasonal overproduction",
        "deadline_hard": False,
        "deadline_event_driven": False,
        "deadline_driver": "Prefer before year-end but flexible",
        "timeline_slipped": False,
    })

    engine.analyze_spin(
        deal_id="deal-tefal-cookware-001",
        situation={
            "content": "Seasonal overproduction of cookware. 80K units in warehouse.",
            "confidence": 85,
            "sources": ["Claire Martin"],
        },
        problem={
            "content": "Storage costs, capital tied up in inventory.",
            "confidence": 80,
            "sources": ["Jean-Pierre Dubois"],
        },
        implication={
            "content": "Minor margin impact if not cleared soon.",
            "confidence": 75,
            "sources": ["Inferred"],
        },
        need_payoff={
            "content": "Recover working capital, reduce storage fees.",
            "confidence": 80,
            "sources": ["Team"],
        },
    )

    engine.run_paranoid_twin("deal-tefal-cookware-001", {
        "timeline_slipped": False,
        "competitor_mentioned": False,
    })

    # ==========================================================================
    # DEAL 4: Xiaomi Smart (Not ready - multiple issues)
    # ==========================================================================
    print("Creating Xiaomi Smart deal...")

    xiaomi_deal = engine.create_deal_intent(
        deal_id="deal-xiaomi-smart-001",
        deal_name="Xiaomi Smart",
        deal_value=150000,
        deal_stage="commit",
        close_date=datetime.now() + timedelta(days=9),  # Dec 18
    )

    # Only a champion identified, no economic buyer
    engine.add_persona(
        deal_id="deal-xiaomi-smart-001",
        contact_name="Li Wei",
        contact_title="Sales Manager EU",
        persona_type=PersonaType.CHAMPION,
        contact_email="li.wei@xiaomi.com",
        engagement_level=EngagementLevel.ENGAGED,
        influence_score=60,
        motivations=["Build EU partnerships"],
        concerns=["Internal approval complexity"],
    )

    # Weak BANT - budget not confirmed, timeline unclear
    engine.score_bant("deal-xiaomi-smart-001", {
        "budget_confirmed": False,
        "budget_amount": 150000,
        "po_ready": False,
        "budget_approval_process_clear": False,
        "need_critical": False,
        "need_quantified": False,
        "need_urgent": False,
        "need_description": "Exploring clearance options for smart home devices",
        "deadline_hard": False,
        "deadline_event_driven": False,
        "deadline_driver": "",
        "timeline_slipped": True,
        "original_close_date": "Dec 10",
    })

    # Incomplete SPIN
    engine.analyze_spin(
        deal_id="deal-xiaomi-smart-001",
        situation={
            "content": "Xiaomi has smart home inventory in EU warehouses.",
            "confidence": 50,
            "sources": ["Li Wei"],
        },
        problem={
            "content": "",
            "confidence": 0,
            "sources": [],
        },
        implication={
            "content": "",
            "confidence": 0,
            "sources": [],
        },
        need_payoff={
            "content": "",
            "confidence": 0,
            "sources": [],
        },
    )

    engine.run_paranoid_twin("deal-xiaomi-smart-001", {
        "timeline_slipped": True,
        "original_close_date": "Dec 10",
        "competitor_mentioned": True,
        "competitors": ["MediaMarkt", "Amazon"],
    })

    # ==========================================================================
    # DEAL 5: Dyson Home (Negotiation stage - not in commit yet)
    # ==========================================================================
    print("Creating Dyson Home deal...")

    dyson_deal = engine.create_deal_intent(
        deal_id="deal-dyson-home-001",
        deal_name="Dyson Home",
        deal_value=520000,
        deal_stage="negotiation",
        close_date=datetime.now() + timedelta(days=25),
    )

    engine.add_persona(
        deal_id="deal-dyson-home-001",
        contact_name="Sarah Williams",
        contact_title="Head of Retail Partnerships",
        persona_type=PersonaType.ECONOMIC_BUYER,
        contact_email="sarah.williams@dyson.com",
        engagement_level=EngagementLevel.ENGAGED,
        influence_score=90,
        can_approve=True,
    )

    engine.add_persona(
        deal_id="deal-dyson-home-001",
        contact_name="James Thompson",
        contact_title="Partnership Manager",
        persona_type=PersonaType.CHAMPION,
        contact_email="james.thompson@dyson.com",
        engagement_level=EngagementLevel.ENGAGED,
        influence_score=75,
    )

    engine.score_bant("deal-dyson-home-001", {
        "budget_confirmed": True,
        "budget_amount": 520000,
        "po_ready": False,
        "budget_approval_process_clear": True,
        "need_critical": True,
        "need_quantified": True,
        "need_urgent": False,
        "need_description": "Q1 inventory planning, clearing older models",
        "deadline_hard": False,
        "deadline_event_driven": False,
        "deadline_driver": "Q1 preference",
    })

    engine.analyze_spin(
        deal_id="deal-dyson-home-001",
        situation={
            "content": "Dyson transitioning to newer product lines. Older vacuum and air purifier models need clearing.",
            "confidence": 80,
            "sources": ["Sarah Williams"],
        },
        problem={
            "content": "Warehouse space needed for new models.",
            "confidence": 75,
            "sources": ["James Thompson"],
        },
        implication={
            "content": "",
            "confidence": 0,
            "sources": [],
        },
        need_payoff={
            "content": "",
            "confidence": 0,
            "sources": [],
        },
    )

    engine.run_paranoid_twin("deal-dyson-home-001", {})

    print("\n" + "=" * 60)
    print("DEMO DATA GENERATION COMPLETE")
    print("=" * 60)

    # Print summary
    stats = {
        "total_deals": len(engine._intents),
        "total_personas": len(engine._personas),
        "total_risks": len(engine._risks),
    }

    print(f"\nCreated {stats['total_deals']} deals:")
    for deal_id, intent in engine._intents.items():
        commit_gate = engine.check_commit_gate(deal_id)
        print(f"  - {intent.deal_name}: €{intent.deal_value:,.0f} | BANT: {intent.bant_total_score} | "
              f"Verdict: {intent.paranoid_verdict.value} | "
              f"Commit Ready: {'✓' if commit_gate.passed else '✗'}")

    print(f"\nTotal personas: {stats['total_personas']}")
    print(f"Total risks identified: {stats['total_risks']}")

    return engine


if __name__ == "__main__":
    generate_demo_data()
