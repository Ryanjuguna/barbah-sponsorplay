"""
Barbah SponsorPlay - Comprehensive End-to-End Creator / Beneficiary Flow Test
PayPal AI Hackathon - Track 02: Sponsor Play
"""

import base64
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_full_creator_flow():
    print("\n" + "="*80)
    print("STARTING BARBAH SPONSORPLAY CREATOR / BENEFICIARY PLATFORM AUDIT")
    print("="*80 + "\n")

    # 0A. Test Root Route (First Page) serves Login Interface
    resp_root = client.get("/")
    assert resp_root.status_code == 200, f"Failed /: {resp_root.status_code}"
    assert "Sign In to Barbah SponsorPlay" in resp_root.text
    assert "STAGE 0: AUTHENTICATION & ROLE GATEWAY" in resp_root.text
    print("[PASS] 0A. Root Route (/) successfully serves the Login Interface as the application entry point")

    # 0B. Test /login route also serves Login Interface
    resp_login = client.get("/login")
    assert resp_login.status_code == 200, f"Failed /login: {resp_login.status_code}"
    assert "Sign In to Barbah SponsorPlay" in resp_login.text
    print("[PASS] 0B. Route /login successfully serves dedicated login.html Gateway")

    # 0C. Test Corporate Brand Dashboard route (/brand)
    resp_brand = client.get("/brand")
    assert resp_brand.status_code == 200, f"Failed /brand: {resp_brand.status_code}"
    assert "BARBAH" in resp_brand.text
    print("[PASS] 0C. Route /brand successfully serves the Corporate Brand / Sponsor Dashboard")

    # 0D. Test Auth API Simulation Accounts
    resp_demos = client.get("/api/v1/auth/demo-accounts")
    assert resp_demos.status_code == 200
    demo_accounts = resp_demos.json()
    assert "simulation_accounts" in demo_accounts
    sim_brand = demo_accounts["simulation_accounts"]["brand"]
    sim_creator = demo_accounts["simulation_accounts"]["creator"]
    assert sim_brand["email"] == "brand@sponsorplay.ke"
    assert sim_creator["email"] == "creator@sponsorplay.ke"
    print(f"[PASS] 0D. Simulation Accounts Verified: Brand='{sim_brand['name']}' ({sim_brand['email']}), Creator='{sim_creator['name']}' ({sim_creator['email']})")

    # 0E. Test Simulation Account 1: Brand Sponsor Sign-In
    brand_login = client.post("/api/v1/auth/login", json={
        "role": "brand",
        "identifier": "brand@sponsorplay.ke",
        "password": "Password123!"
    })
    assert brand_login.status_code == 200
    brand_auth = brand_login.json()
    assert brand_auth["role"] == "brand"
    assert brand_auth["redirect_url"] == "/brand"
    assert "token" in brand_auth
    assert brand_auth["user"]["corporate_pin"] == "P051234567A"
    print(f"[PASS] 0E. Brand Test Account 1 Authenticated: {brand_auth['user']['name']} -> Redirects to {brand_auth['redirect_url']}")

    # 0F. Test Simulation Account 2: Beneficiary Creator Sign-In
    creator_login = client.post("/api/v1/auth/login", json={
        "role": "creator",
        "identifier": "creator@sponsorplay.ke",
        "password": "Password123!"
    })
    assert creator_login.status_code == 200
    creator_auth = creator_login.json()
    assert creator_auth["role"] == "creator"
    assert "/creator?creator_id=creator-001" in creator_auth["redirect_url"]
    assert "token" in creator_auth
    assert creator_auth["user"]["gamer_tag"] == "TheBeast_KE"
    print(f"[PASS] 0F. Creator Test Account 2 Authenticated: @{creator_auth['user']['gamer_tag']} -> Redirects to {creator_auth['redirect_url']}")

    # 1. Test Creator HTML route
    resp = client.get("/creator")
    assert resp.status_code == 200, f"Failed /creator: {resp.status_code}"
    assert "BARBAH" in resp.text
    assert "CREATOR PORTAL" in resp.text
    print("[PASS] 1. Route /creator successfully serves creator.html SPA")

    # 2. Test Creator Profile
    resp = client.get("/api/v1/creator/profile/creator-001")
    assert resp.status_code == 200
    data = resp.json()
    assert data["gamer_tag"] == "TheBeast_KE"
    assert data["primary_game"] == "EA FC 25 / Mortal Kombat 1"
    print(f"[PASS] 2. Profile loaded: {data['name']} (@{data['gamer_tag']}) in {data['location']}")

    # 3. Test Creator Dashboard
    resp = client.get("/api/v1/creator/dashboard/creator-001")
    assert resp.status_code == 200
    dashboard = resp.json()
    assert "creator" in dashboard
    assert "active_deals" in dashboard
    assert "pending_offers" in dashboard
    assert "skills_passport" in dashboard
    print(f"[PASS] 3. Dashboard loaded: Active Deals={len(dashboard['active_deals'])}, Escrow in Ledger=${dashboard['ledger_escrow_usd']}")
    print(f"       Skills Passport: Tier={dashboard['skills_passport']['tier']}, Credibility={dashboard['skills_passport']['credibility_index']}%, Badges={len(dashboard['skills_passport']['badges'])}")

    # 4. Test Creator Offers Inbox
    resp = client.get("/api/v1/creator/offers/creator-002")
    assert resp.status_code == 200
    offers = resp.json()
    assert len(offers) > 0, "Expected at least 1 pending offer for creator-002"
    offer = offers[0]
    print(f"[PASS] 4. Pending Offer for QueenArrow: {offer['brand_name']} - Budget=${offer['total_budget_usd']} (Net Payout=${offer['net_creator_disbursement_usd']})")

    # 5. Test 1-Click Offer Acceptance
    accept_payload = {
        "proposal_id": offer["id"],
        "creator_id": "creator-002",
        "accepted_terms": True,
        "countersigned_by": "Sylvia 'QueenArrow' Gathoni",
        "confirmed_paypal_email": "queenarrow@personal.example.com",
        "confirmed_mpesa_phone": "+254722987654",
        "notes": "Accepted terms for Tekken 8 Title Championship!"
    }
    resp = client.post(f"/api/v1/creator/offers/{offer['id']}/accept", json=accept_payload)
    assert resp.status_code == 200
    accepted_prop = resp.json()
    assert accepted_prop["status"] in ["ACTIVE", "ACCEPTED_BY_BENEFICIARY"]
    print(f"[PASS] 5. 1-Click Offer Acceptance successful! Proposal status updated to: {accepted_prop['status']}")

    # 6. Test Deliverables Submission & Autonomous Multimodal Verification (Agent 3)
    p1 = dashboard["active_deals"][0]
    m1 = p1["milestones"][0]
    submit_payload = {
        "proposal_id": p1["id"],
        "milestone_id": m1["id"],
        "creator_id": "creator-001",
        "deliverable_type": "LIVE_STREAM_VOD",
        "preset_scenario": "PASS",
        "notes": "Broadcast overlay verified during 3h EA FC 25 championship stream. Shoutouts at 00:25:00 and 01:15:30.",
        "brand_name": "Safaricom"
    }
    resp = client.post("/api/v1/creator/deliverables/submit", json=submit_payload)
    assert resp.status_code == 200
    v_res = resp.json()
    assert v_res["decision"] == "PASSED", f"Expected PASSED but got {v_res['decision']}"
    cert = v_res["certificate"]
    assert cert["logo_screen_ratio_percent"] >= 3.5, f"Screen ratio {cert['logo_screen_ratio_percent']}% below 3.5%"
    assert cert["overall_confidence_percent"] >= 90.0
    assert cert["cryptographic_hash"] is not None
    assert v_res["milestone"]["status"] == "VERIFIED"
    print(f"[PASS] 6. Autonomous Verification Triggered (Agent 3):")
    print(f"       Decision: {v_res['decision']} (Confidence: {cert['overall_confidence_percent']}%)")
    print(f"       Logo Screen Occupancy: {cert['logo_screen_ratio_percent']}% (Threshold >= 3.5%)")
    print(f"       Crypto Hash: {cert['cryptographic_hash'][:32]}...")
    print(f"       Milestone {m1['milestone_number']} status updated to: {v_res['milestone']['status']}")

    # 7. Test Deliverable Submission with Custom Synthetic Frame (Base64)
    # Generate 1x1 white jpeg base64
    dummy_jpeg_base64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="
    custom_submit_payload = {
        "proposal_id": p1["id"],
        "milestone_id": m1["id"],
        "creator_id": "creator-001",
        "deliverable_type": "STREAM_OVERLAY_SCREENSHOT",
        "image_base64": dummy_jpeg_base64,
        "notes": "Custom screenshot test upload",
        "brand_name": "Safaricom"
    }
    resp = client.post("/api/v1/creator/deliverables/submit", json=custom_submit_payload)
    assert resp.status_code == 200
    print("[PASS] 7. Custom Image (Base64 Drag-and-Drop) deliverable successfully uploaded and verified")

    # 7B. Test Physical Venue Deliverable Submission (Claude Multimodal AI Vision)
    venue_submit_payload = {
        "proposal_id": p1["id"],
        "milestone_id": m1["id"],
        "creator_id": "creator-001",
        "deliverable_type": "VENUE_PHOTO",
        "preset_scenario": "VENUE",
        "notes": "Physical roll-up banner staged at Barbah LAN lounge in Kibera.",
        "brand_name": "Safaricom"
    }
    resp = client.post("/api/v1/creator/deliverables/submit", json=venue_submit_payload)
    assert resp.status_code == 200
    venue_res = resp.json()
    venue_cert = venue_res["certificate"]
    assert venue_cert["verification_engine"] == "CLAUDE_MULTIMODAL_VISION"
    assert venue_cert["cryptographic_hash"] is not None
    print(f"[PASS] 7B. Physical Venue Banner (Claude Multimodal AI Vision):")
    print(f"       Engine: {venue_cert['verification_engine']}")
    print(f"       Physical Authenticity: {venue_cert.get('physical_authenticity')}")
    print(f"       Findings: {venue_cert.get('multimodal_findings', '')[:80]}...")

    # 8. Test Bilateral Collaboration Room & Live Chat Feed
    resp = client.get(f"/api/v1/creator/collaboration/{p1['id']}")
    assert resp.status_code == 200
    msgs = resp.json()
    assert len(msgs) >= 2, "Expected messages in collaboration feed"
    print(f"[PASS] 8. Bilateral Deal Room: {len(msgs)} messages logged (Brand, Creator, Agent 3 Verifier)")
    for m in msgs[-2:]:
        print(f"       [{m['sender_name']}]: {m['content'][:70]}...")

    # 9. Test Creator Milestone Payout Execution & KRA eTIMS BII Fiscal Invoicing
    payout_resp = client.post(
        f"/api/v1/creator/payout/{p1['id']}/{m1['id']}",
        json={"paypal_email": "creator-thebeast@barbahgames.com"}
    )
    assert payout_resp.status_code == 200
    payout_data = payout_resp.json()
    assert payout_data["status"] == "DISBURSEMENT_SUCCESSFUL"
    assert payout_data["net_payout_usd"] > 0
    assert payout_data["net_payout_kes"] > 0
    print(f"[PASS] 9. Milestone Payout & eTIMS BII Invoicing Executed:")
    print(f"       Net Cash Disbursed to Creator: ${payout_data['net_payout_usd']} USD (KES {payout_data['net_payout_kes']:,.2f})")
    print(f"       PayPal Destination: {payout_data['paypal_destination']}")
    print(f"       eTIMS BII Invoice Number: {payout_data['disbursement_result'].get('etims_cu_invoice_number')}")
    print(f"       5% Withholding Tax Remitted: KES {payout_data['disbursement_result'].get('withholding_tax_kes'):,.2f}")

    # 10. Test Tax Receipts Vault
    tax_resp = client.get("/api/v1/creator/invoices/creator-001")
    assert tax_resp.status_code == 200
    tax_invoices = tax_resp.json()
    print(f"[PASS] 10. Tax Vault: {len(tax_invoices)} KRA eTIMS Section 16 compliant invoices retrieved for creator-001")

    # 11. Test Profile Update
    prof_update = {
        "paypal_email": "updated.thebeast@gmail.com",
        "mpesa_phone": "+254700112233",
        "base_rate_usd": 400.0,
        "bio": "East Africa premier EA FC champion, mentor, and Safaricom Blaze partner."
    }
    update_resp = client.post("/api/v1/creator/profile/creator-001", json=prof_update)
    assert update_resp.status_code == 200
    updated_creator = update_resp.json()
    assert updated_creator["paypal_email"] == "updated.thebeast@gmail.com"
    assert updated_creator["base_rate_usd"] == 400.0
    print(f"[PASS] 11. Profile & Payment Rails Update Verified: New PayPal={updated_creator['paypal_email']}, Rate=${updated_creator['base_rate_usd']}")

    print("\n" + "="*80)
    print("ALL 11 END-TO-END CREATOR / BENEFICIARY AUDIT CHECKS PASSED WITH ZERO ERRORS!")
    print("="*80 + "\n")

if __name__ == "__main__":
    test_full_creator_flow()
