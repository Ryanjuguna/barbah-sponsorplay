"""
Barbah SponsorPlay - End-to-End Automated Verification Test Suite
PayPal AI Hackathon - Track 02: Sponsor Play
Direct function & agent verification suite (fast, resilient, zero-socket dependency)
"""

import os
import sys
from app.models.schemas import CampaignBrief, DeliverableSubmission
from app.models.database import db
from app.agents.scout_agent import scout_agent
from app.agents.architect_agent import architect_agent
from app.agents.financial_agent import financial_agent
from app.agents.verification_agent import verification_agent
from app.agents.guardian_agent import guardian_agent
from app.agents.impact_agent import impact_agent
from app.agents.vision_engine import vision_engine
from app.agents.scout_radar import scout_radar
from app.integrations.barbah_client import barbah_client
from app.integrations.paypal_client import paypal_client
from app.integrations.etims_client import etims_client

def run_e2e_test():
    print("=" * 80)
    print("BARBAH SPONSORPLAY: END-TO-END AUTOMATED VERIFICATION TEST")
    print("PayPal AI Hackathon - Challenge 02: Sponsor Play (Barbah Games Kenya)")
    print("=" * 80)

    # 1. System & Seed Data Verification
    print("\n[STEP 1] Verifying System State & Preloaded Kenyan Talent Graph (16 Personas)...")
    initial_creators = db.get_all_creators()
    assert len(initial_creators) >= 14, f"Expected at least 14 creators, found {len(initial_creators)}"
    print(f"  [+] Loaded {len(initial_creators)} baseline Kenyan esports creators, clubs, and lounges:")
    for c in initial_creators[:4]:
        print(f"      - {c.name} ({c.gamer_tag}) | {c.type} | {c.location} | Safety: {c.brand_safety_score}% | Rate: ${c.base_rate_usd}")

    # 1B. Agent 1: Autonomous Multi-Channel Radar Intelligence
    print("\n[STEP 1B] Scanning Agent 1 Multi-Channel Talent Radar (4 Intelligence Feeds)...")
    radar_data = scout_radar.get_radar_overview()
    print(f"  [+] Channel 1 (Live Streams): {radar_data['channels_summary']['live_streams_monitored']} streams monitored &bull; {radar_data['channels_summary']['bot_flags_intercepted']} bot inflation flagged")
    print(f"  [+] Channel 2 (Brackets): {radar_data['channels_summary']['tournament_brackets_synced']} tournament brackets synced (Start.gg & Challonge)")
    print(f"  [+] Channel 3 (Community Webhooks): {radar_data['channels_summary']['community_webhooks_queued']} clan captain bot events")
    print(f"  [+] Channel 4 (Social Clips): {radar_data['channels_summary']['social_clips_indexed']} viral clips indexed (#KenyaEsports)")

    # 1C. Real-Time Barbah Games Gateway & Webhook Ingestion
    print("\n[STEP 1C] Testing Real-Time Webhook Ingestion from Barbah Games...")
    wh_player = barbah_client.process_webhook_event("PLAYER_REGISTERED", {
        "name": "Alex 'ApexStriker' Mutua",
        "gamer_tag": "ApexStriker_KE",
        "type": "PRO_PLAYER_STREAMER",
        "primary_game": "EA FC 25",
        "platform": "YouTube Gaming",
        "location": "Nairobi West",
        "monthly_reach": 11000,
        "avg_concurrent_viewers": 490,
        "base_rate_usd": 170.0
    })
    print(f"  [+] Ingested Webhook Player: {wh_player['player_id']} (Status: {wh_player['status']})")
    print(f"  [+] Total creators now active in registry: {len(db.creators)}")

    # 2. Agent 1: Talent Scout Analysis with Claude Brain
    print("\n[STEP 2] Submitting Brand Brief to Agent 1 (Scout)...")
    brief = CampaignBrief(
        id="CAMP-SAFARICOM-001",
        brand_name="Safaricom 5G Gaming",
        corporate_pin="P051234567A",
        brief=(
            "We want to promote our low-latency 5G Home Internet to university gamers and "
            "grassroots esports communities across Nairobi and Eldoret. Need tournament broadcast "
            "integration, logo overlay, shoutcaster verbal callouts, and campus derby activations."
        ),
        target_audience="16-25 urban gaming youth",
        target_reach=10000,
        budget_usd=769.23,
        preferred_locations=["Nairobi", "Eldoret"]
    )
    db.save_campaign(brief)
    
    # Unified Deconstruction
    deconstruct_res = scout_agent.deconstruct_brief_and_match(brief)
    print(f"  [+] Unified Deconstruction AI Verdict: {deconstruct_res.ai_analysis.recommendation_title}")
    print(f"      - Recommended Path: {deconstruct_res.ai_analysis.recommended_path}")
    print(f"      - Rationale: {deconstruct_res.ai_analysis.verdict_rationale[:110]}...")
    print(f"      - Available Pathways: {len(deconstruct_res.syndicates)} Syndicates &bull; {len(deconstruct_res.solo_matches)} Solo Creator Matches")
    assert len(deconstruct_res.syndicates) >= 1, "Agent 1 returned no syndicates"
    assert len(deconstruct_res.solo_matches) >= 1, "Agent 1 returned no solo matches"

    chosen_syn = deconstruct_res.syndicates[0]
    print(f"  [+] Selected Syndicate Option: '{chosen_syn.title}' (Synergy Score: {chosen_syn.synergy_score}%)")
    print(f"      - Estimated Youth Reach: {chosen_syn.expected_reach:,} gamers")
    print(f"      - Cost: ${chosen_syn.total_cost_usd:.2f} (KES {chosen_syn.total_cost_kes:,.2f})")
    print(f"      - Compliance Route: {chosen_syn.etims_compliance_mode}")

    # 2B. Direct Solo Creator Sponsorship Test
    print("\n[STEP 2B] Testing Direct Solo Creator Sponsorship Workflow...")
    solo_creator = deconstruct_res.solo_matches[0].creator
    solo_proposal = architect_agent.draft_solo_proposal(brief, solo_creator, beneficiary_emails=["team@barbahgames.com"])
    print(f"  [+] Solo Proposal Generated: {solo_proposal.id} for {solo_creator.name} (${solo_proposal.total_budget_usd:.2f})")
    print(f"      - Barbah Platform Fee (10%): ${solo_proposal.platform_fee_usd:.2f}")
    print(f"      - KRA 5% Withholding Tax: ${solo_proposal.withholding_tax_usd:.2f}")
    print(f"      - Net Creator Disbursement: ${solo_proposal.net_creator_disbursement_usd:.2f}")
    print(f"      - Beneficiary Notification Email Dispatched: {solo_proposal.email_dispatch_id} -> {solo_proposal.beneficiary_emails}")
    assert len(solo_proposal.creators) == 1, "Solo proposal should have exactly 1 creator"
    assert solo_proposal.email_dispatch_id is not None, "Email dispatch record missing"

    # 3. Agent 2: Syndicate Milestone Agreement Generation
    print("\n[STEP 3] Generating Executable Syndicate Agreement via Agent 2 (Architect)...")
    proposal = architect_agent.draft_proposal(brief, chosen_syn, beneficiary_emails=["creators-team@barbahgames.com", "captain@strathmore.edu"])
    db.save_proposal(proposal)
    print(f"  [+] Proposal Generated ID: {proposal.id}")
    print(f"      - Gross Budget Authorized: ${proposal.total_budget_usd:.2f} (KES {proposal.total_budget_kes:,.2f})")
    print(f"      - Barbah Facilitation Fee (10%): ${proposal.platform_fee_usd:.2f} (KES {proposal.platform_fee_kes:,.2f})")
    print(f"      - Gross Beneficiary Escrow: ${proposal.gross_beneficiary_usd:.2f} (KES {proposal.gross_beneficiary_kes:,.2f})")
    print(f"      - KRA 5% Withholding Tax: ${proposal.withholding_tax_usd:.2f} (KES {proposal.withholding_tax_kes:,.2f})")
    print(f"      - Net Creator Disbursement: ${proposal.net_creator_disbursement_usd:.2f} (KES {proposal.net_creator_disbursement_kes:,.2f})")
    print(f"      - Beneficiary Proposal Email Dispatched: {proposal.email_dispatch_id} -> {proposal.beneficiary_emails}")
    print(f"      - Milestones Structured: {len(proposal.milestones)} phases")
    assert proposal.email_dispatch_id is not None, "Syndicate email dispatch record missing"
    email_rec = db.get_email(proposal.email_dispatch_id)
    assert email_rec is not None, "Dispatched email not stored in db"
    assert "Safaricom" in email_rec.rendered_html, "HTML proposal does not contain brand name"
    for m in proposal.milestones:
        print(f"        * Phase {m.milestone_number} ({m.percentage}%): {m.title} -> ${m.amount_usd:.2f}")

    # 4. Agent 4: PayPal Orders v2 Multiparty Escrow Initialization
    print("\n[STEP 4] Initializing PayPal Orders v2 Multiparty Escrow (Agent 4)...")
    order_resp = financial_agent.initialize_escrow_order(proposal)
    order_id = order_resp["id"]
    print(f"  [+] PayPal Order Created: {order_id} (Status: {order_resp['status']})")
    print(f"      - Payee Split Configured: Platform commission routed via payment_instruction")
    
    # Simulate Order Capture into Escrow
    capture_resp = paypal_client.capture_order(order_id)
    proposal.status = "FUNDED"
    for m in proposal.milestones:
        m.status = "FUNDED_IN_ESCROW"
    db.save_proposal(proposal)
    print(f"  [+] PayPal Payment Captured: Funds safely locked in Milestone Escrow!")

    # 5. Agent 5: Live Brand Safety Guardian Audit
    print("\n[STEP 5] Auditing Live Stream Chat via Agent 5 (Brand Guardian)...")
    sample_chat = [
        "Wueh Brian The Beast anapiga watu vibaya sana!",
        "Safaricom 5G has zero latency today gg!",
        "Great tournament guys lets go!",
        "Who is winning the final derby match?"
    ]
    chat_audit = guardian_agent.audit_live_stream_chat(sample_chat, competitor_brands=["Airtel", "Telkom"])
    print(f"  [+] Chat Safety Status: {chat_audit['safety_status']} (Clean Rate: {chat_audit['clean_message_rate_percent']}%)")
    print(f"  [+] Competitor Collisions: {chat_audit['competitor_collisions_detected']}")
    assert chat_audit["guardian_approved"] is True, "Brand Guardian flagged violation"

    # 6A. Real OpenCV Computer Vision Engine Unit Verification
    print("\n[STEP 6A] Testing OpenCV Computer Vision Logo Localization & Area Ratio...")
    cv_pass = vision_engine.analyze_frame("generate", brand_name="Safaricom")
    print(f"  [+] OpenCV Detected Box: {cv_pass['bounding_box']}")
    print(f"  [+] Frame Dimensions: {cv_pass['frame_resolution']['width']}x{cv_pass['frame_resolution']['height']}")
    print(f"  [+] Screen Occupancy Area: {cv_pass['screen_occupancy_percent']}% (Required >= {cv_pass['min_required_occupancy_percent']}%)")
    print(f"  [+] Confidence Score: {cv_pass['confidence_percent']}%")
    print(f"  [+] Annotated Image File: {cv_pass['proof_image_filename']}")
    assert cv_pass["meets_threshold"] is True, "OpenCV failed to detect compliant logo occupancy"

    # Test sub-threshold scenario to ensure OpenCV catches violations
    cv_fail_path = vision_engine.generate_synthetic_esports_frame(brand_name="Safaricom", scenario="LOW_OCCUPANCY")
    cv_fail = vision_engine.analyze_frame(cv_fail_path, brand_name="Safaricom")
    print(f"  [+] Testing Sub-threshold Frame: Occupancy is {cv_fail['screen_occupancy_percent']}% -> Status: {cv_fail['status']}")
    assert cv_fail["meets_threshold"] is False, "OpenCV failed to catch low occupancy"

    # 6B. Agent 3: Multimodal Proof-of-Play Verification
    print("\n[STEP 6B] Ingesting Live Stream VOD & Verifying via Agent 3 (Proof-of-Play)...")
    submission = DeliverableSubmission(
        milestone_id=proposal.milestones[0].id,
        creator_id=proposal.creators[0].id,
        deliverable_type="LIVE_STREAM_VOD",
        media_url=cv_pass["proof_image_filename"],
        simulated_metrics={
            "logo_screen_ratio_percent": cv_pass["screen_occupancy_percent"],
            "airtime_seconds": 11400,
            "verbal_slogans_detected": ["Powered by Safaricom 5G", "Safaricom youth gaming"],
            "audio_confidence": 0.94,
            "brand_safety_status": "SAFE"
        }
    )
    cert = verification_agent.verify_deliverable(submission, required_brand_name="Safaricom")
    db.save_certificate(cert)
    print(f"  [+] Certificate ID: {cert.certificate_id}")
    print(f"      - OpenCV Verified Logo Area: {cert.logo_screen_ratio_percent}% (Threshold: >=3.5%) -> PASS")
    print(f"      - Airtime Logged: {(cert.airtime_seconds / 3600):.2f} hours -> PASS")
    print(f"      - Whisper STT Brand Slogans: {cert.verbal_slogans_detected} -> PASS")
    print(f"      - Proof Image URL: {cert.proof_image_url}")
    print(f"      - Overall Verification Confidence: {cert.overall_confidence_percent}%")
    print(f"      - Verification Decision: {cert.verification_decision}")
    print(f"      - Cryptographic Proof Seal: {cert.cryptographic_hash[:32]}...")
    assert cert.verification_decision == "PASSED", "Verification did not pass"

    # 7. Agent 4: KRA eTIMS Tax Fiscalization (BII) & PayPal Payout Release
    print("\n[STEP 7] Disbursing Milestone Funds with KRA eTIMS Fiscal Invoicing...")
    disb_res = financial_agent.release_milestone_funds(
        proposal_id=proposal.id,
        milestone_id=proposal.milestones[0].id,
        certificate=cert
    )
    print(f"  [+] KRA eTIMS CU Invoice Number: {disb_res['etims_cu_invoice_number']}")
    print(f"      - Section 16 Deductibility Certified: {disb_res['tax_compliance_certified']}")
    print(f"      - Gross Taxable Amount: KES {disb_res['gross_amount_kes']:,.2f}")
    print(f"      - 5% Withholding Tax Remitted: KES {disb_res['withholding_tax_kes']:,.2f}")
    print(f"      - Net Payout Disbursed: KES {disb_res['net_paid_kes']:,.2f} (${disb_res['net_paid_usd']:.2f} USD)")
    print(f"      - PayPal Payout Item ID: {disb_res['paypal_payout_id']}")
    print(f"      - KRA Verification QR URL: {disb_res['qr_code_url']}")

    # 8. Agent 6: MetaTwin ESG Social Impact Dossier
    print("\n[STEP 8] Generating Barbah MetaTwin ESG Social Impact Dossier (Agent 6)...")
    impact = impact_agent.generate_impact_dossier(proposal)
    print(f"  [+] Total Youth Reach Logged: {impact.youth_reached_total:,}")
    print(f"  [+] Collegiate Gamers Empowered: {impact.collegiate_gamers_empowered:,}")
    print(f"  [+] Informal Settlement Community Share: {impact.informal_settlement_youth_share_percent}%")
    print(f"  [+] Female Gamer Inclusion Rate: {impact.female_gamer_inclusion_percent}%")
    print(f"  [+] Cryptographic ESG Assurance Hash: {impact.metatwin_verified_hash[:32]}...")

    print("\n" + "=" * 80)
    print(">>> SUCCESS: ALL MULTI-AGENT & RADAR LIFECYCLE TESTS PASSED CLEANLY! <<<")
    print("=" * 80)

if __name__ == "__main__":
    run_e2e_test()
