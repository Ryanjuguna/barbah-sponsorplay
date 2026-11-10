"""
Barbah SponsorPlay - Agent 2: Campaign Architect & Contract Generator Agent
PayPal AI Hackathon - Track 02: Sponsor Play
"""

import uuid
from typing import List, Optional
from app.models.schemas import CampaignBrief, SyndicateRecommendation, Proposal, Milestone, CreatorProfile
from app.config import settings

class ArchitectAgent:
    def __init__(self):
        self.name = "Campaign Architect & Contract Generator Agent"
        self.version = "2.0.0-solo-and-syndicate"

    def draft_proposal(
        self,
        campaign: CampaignBrief,
        syndicate: SyndicateRecommendation
    ) -> Proposal:
        """
        Structures an executable milestone contract for a multi-creator syndicate bundle,
        calculates exact financial fee splits, and generates legally enforceable digital
        agreement clauses with automated verification specs.
        """
        total_budget_usd = syndicate.total_cost_usd
        total_budget_kes = syndicate.total_cost_kes

        # Financial Calculations
        platform_fee_usd = round(total_budget_usd * (settings.PLATFORM_COMMISSION_PERCENT / 100.0), 2)
        platform_fee_kes = round(total_budget_kes * (settings.PLATFORM_COMMISSION_PERCENT / 100.0), 2)

        gross_beneficiary_usd = round(total_budget_usd - platform_fee_usd, 2)
        gross_beneficiary_kes = round(total_budget_kes - platform_fee_kes, 2)

        wht_usd = round(gross_beneficiary_usd * (settings.KENYA_WITHHOLDING_TAX_PERCENT / 100.0), 2)
        wht_kes = round(gross_beneficiary_kes * (settings.KENYA_WITHHOLDING_TAX_PERCENT / 100.0), 2)

        net_creator_usd = round(gross_beneficiary_usd - wht_usd, 2)
        net_creator_kes = round(gross_beneficiary_kes - wht_kes, 2)

        # 3-Stage Milestone Decomposition
        milestones: List[Milestone] = [
            Milestone(
                id=f"MLS-01-{uuid.uuid4().hex[:4].upper()}",
                milestone_number=1,
                title="Mobilization, Brand Asset Integration & Campaign Launch",
                description="Stream overlay setup, branded social media announcement teaser, physical venue banner staging.",
                percentage=30.0,
                amount_usd=round(gross_beneficiary_usd * 0.30, 2),
                amount_kes=round(gross_beneficiary_kes * 0.30, 2),
                deliverables=[
                    "Broadcast overlay asset verification (1080p minimum)",
                    "Pre-campaign social teaser on X/TikTok/Discord",
                    "Campus/Lounge venue staging photos"
                ],
                verification_criteria={
                    "asset_resolution": "1920x1080",
                    "min_teaser_views": 1000,
                    "brand_guideline_compliance": True
                },
                status="PENDING_FUNDING"
            ),
            Milestone(
                id=f"MLS-02-{uuid.uuid4().hex[:4].upper()}",
                milestone_number=2,
                title="Live Broadcast Airtime & Tournament Execution",
                description="Live esports tournament broadcast with continuous sponsor logo display and verbal shoutcaster endorsements.",
                percentage=40.0,
                amount_usd=round(gross_beneficiary_usd * 0.40, 2),
                amount_kes=round(gross_beneficiary_kes * 0.40, 2),
                deliverables=[
                    "Minimum 3 hours of live competitive broadcast",
                    "Logo screen occupancy ratio >= 3.5%",
                    "At least 4 verbal brand callouts during stream transitions",
                    "Real-time chat moderation and brand safety enforcement"
                ],
                verification_criteria={
                    "min_airtime_minutes": 180,
                    "min_logo_screen_ratio_percent": 3.5,
                    "min_verbal_callouts": 4,
                    "chat_toxicity_threshold": 0.05
                },
                status="PENDING_FUNDING"
            ),
            Milestone(
                id=f"MLS-03-{uuid.uuid4().hex[:4].upper()}",
                milestone_number=3,
                title="Post-Event Archival, Highlight Slicing & Impact Telemetry",
                description="Tournament bracket certification, 9:16 vertical highlight video publication, and audience analytics submission.",
                percentage=30.0,
                amount_usd=round(gross_beneficiary_usd * 0.30, 2),
                amount_kes=round(gross_beneficiary_kes * 0.30, 2),
                deliverables=[
                    "Official certified tournament bracket and winner roster",
                    "3 branded highlight reels published to TikTok/Reels",
                    "Final audience reach, retention, and demographic data export"
                ],
                verification_criteria={
                    "bracket_certified": True,
                    "vertical_clips_published": 3,
                    "analytics_reconciled": True
                },
                status="PENDING_FUNDING"
            )
        ]

        legal_clauses = [
            f"1. TAX DEDUCTIBILITY GUARANTEE: All disbursements are tied to KRA eTIMS invoices satisfying Section 16(1)(c) of the Kenya Income Tax Act.",
            f"2. STATUTORY WITHHOLDING: A 5% Withholding Tax (KES {wht_kes:,.2f}) will be deducted and remitted directly to KRA via iTax.",
            f"3. ESCROW PROTECTION: Campaign funds remain locked in PayPal Smart Escrow and are released only upon automated Proof-of-Play verification (Confidence >= 90%).",
            f"4. BRAND SAFETY INDEMNITY: Creators agree to automated live chat monitoring. Toxicity or derogatory slurs trigger an immediate 15-minute remediation hold.",
            f"5. BUYER-INITIATED INVOICING: Informal/student creators authorize Barbah Games to issue certified BII eTIMS invoices under Section 23A of the Tax Procedures Act."
        ]

        proposal = Proposal(
            id=f"PROP-{uuid.uuid4().hex[:8].upper()}",
            campaign_id=campaign.id or f"CAMP-{uuid.uuid4().hex[:4].upper()}",
            brand_name=campaign.brand_name,
            syndicate_id=syndicate.syndicate_id,
            total_budget_usd=total_budget_usd,
            total_budget_kes=total_budget_kes,
            platform_fee_usd=platform_fee_usd,
            platform_fee_kes=platform_fee_kes,
            gross_beneficiary_usd=gross_beneficiary_usd,
            gross_beneficiary_kes=gross_beneficiary_kes,
            withholding_tax_usd=wht_usd,
            withholding_tax_kes=wht_kes,
            net_creator_disbursement_usd=net_creator_usd,
            net_creator_disbursement_kes=net_creator_kes,
            creators=syndicate.creators,
            milestones=milestones,
            legal_clauses=legal_clauses,
            status="DRAFT"
        )

        return proposal

    def draft_solo_proposal(
        self,
        campaign: CampaignBrief,
        creator: CreatorProfile
    ) -> Proposal:
        """
        Structures an executable milestone contract for a SINGLE solo creator or gaming hub.
        Allows brands to sponsor individual rising stars or neighborhood dens directly.
        """
        total_budget_usd = creator.base_rate_usd
        total_budget_kes = total_budget_usd * settings.USD_TO_KES_RATE

        platform_fee_usd = round(total_budget_usd * (settings.PLATFORM_COMMISSION_PERCENT / 100.0), 2)
        platform_fee_kes = round(total_budget_kes * (settings.PLATFORM_COMMISSION_PERCENT / 100.0), 2)

        gross_beneficiary_usd = round(total_budget_usd - platform_fee_usd, 2)
        gross_beneficiary_kes = round(total_budget_kes - platform_fee_kes, 2)

        wht_usd = round(gross_beneficiary_usd * (settings.KENYA_WITHHOLDING_TAX_PERCENT / 100.0), 2)
        wht_kes = round(gross_beneficiary_kes * (settings.KENYA_WITHHOLDING_TAX_PERCENT / 100.0), 2)

        net_creator_usd = round(gross_beneficiary_usd - wht_usd, 2)
        net_creator_kes = round(gross_beneficiary_kes - wht_kes, 2)

        milestones: List[Milestone] = [
            Milestone(
                id=f"MLS-SOLO-01-{uuid.uuid4().hex[:4].upper()}",
                milestone_number=1,
                title=f"Solo Mobilization & Asset Setup ({creator.gamer_tag})",
                description=f"Stream overlay configuration and branded announcement by {creator.name}.",
                percentage=30.0,
                amount_usd=round(gross_beneficiary_usd * 0.30, 2),
                amount_kes=round(gross_beneficiary_kes * 0.30, 2),
                deliverables=[
                    f"Brand banner overlay test on {creator.platform}",
                    f"Social post on creator channels with #{campaign.brand_name.replace(' ', '')}"
                ],
                verification_criteria={
                    "resolution_check": True,
                    "brand_tag_verified": True
                },
                status="PENDING_FUNDING"
            ),
            Milestone(
                id=f"MLS-SOLO-02-{uuid.uuid4().hex[:4].upper()}",
                milestone_number=2,
                title=f"Competitive Live Airtime ({creator.primary_game})",
                description=f"Live tournament broadcast by {creator.gamer_tag} featuring continuous sponsor logo placement.",
                percentage=40.0,
                amount_usd=round(gross_beneficiary_usd * 0.40, 2),
                amount_kes=round(gross_beneficiary_kes * 0.40, 2),
                deliverables=[
                    "Minimum 3 hours live gameplay",
                    "Logo screen occupancy ratio >= 3.5%",
                    "At least 3 verbal brand callouts",
                    "Brand safety chat monitoring"
                ],
                verification_criteria={
                    "min_airtime_minutes": 180,
                    "min_logo_screen_ratio_percent": 3.5,
                    "min_verbal_callouts": 3
                },
                status="PENDING_FUNDING"
            ),
            Milestone(
                id=f"MLS-SOLO-03-{uuid.uuid4().hex[:4].upper()}",
                milestone_number=3,
                title="Post-Event Highlight Slicing & Analytics Submission",
                description="Short-form TikTok/Reels clip publication and audience telemetry export.",
                percentage=30.0,
                amount_usd=round(gross_beneficiary_usd * 0.30, 2),
                amount_kes=round(gross_beneficiary_kes * 0.30, 2),
                deliverables=[
                    "2 vertical highlight clips published",
                    "Engagement metrics and viewer demographics report"
                ],
                verification_criteria={
                    "clips_published": 2,
                    "analytics_submitted": True
                },
                status="PENDING_FUNDING"
            )
        ]

        tax_clause = (
            f"1. TAX DEDUCTIBILITY: Direct KRA eTIMS invoice will be issued using Creator KRA PIN {creator.kra_pin}."
            if creator.etims_registered else
            f"1. BUYER-INITIATED INVOICING (BII): Creator authorizes Barbah Games to issue certified BII invoice under Section 23A of the Tax Procedures Act, guaranteeing corporate deductibility under Section 16(1)(c)."
        )

        legal_clauses = [
            tax_clause,
            f"2. STATUTORY WITHHOLDING: 5% Withholding Tax (KES {wht_kes:,.2f}) will be deducted and remitted directly to KRA.",
            f"3. PAYPAL MILESTONE ESCROW: Escrow funds release automatically upon OpenCV Proof-of-Play verification (occupancy >= 3.5%).",
            f"4. DISBURSEMENT ROUTE: Released via PayPal to {creator.paypal_email} and M-Pesa {creator.mpesa_phone}."
        ]

        proposal = Proposal(
            id=f"PROP-SOLO-{uuid.uuid4().hex[:6].upper()}",
            campaign_id=campaign.id or f"CAMP-{uuid.uuid4().hex[:4].upper()}",
            brand_name=campaign.brand_name,
            syndicate_id=f"SOLO-{creator.id}",
            total_budget_usd=total_budget_usd,
            total_budget_kes=total_budget_kes,
            platform_fee_usd=platform_fee_usd,
            platform_fee_kes=platform_fee_kes,
            gross_beneficiary_usd=gross_beneficiary_usd,
            gross_beneficiary_kes=gross_beneficiary_kes,
            withholding_tax_usd=wht_usd,
            withholding_tax_kes=wht_kes,
            net_creator_disbursement_usd=net_creator_usd,
            net_creator_disbursement_kes=net_creator_kes,
            creators=[creator],
            milestones=milestones,
            legal_clauses=legal_clauses,
            status="DRAFT"
        )

        return proposal

architect_agent = ArchitectAgent()
