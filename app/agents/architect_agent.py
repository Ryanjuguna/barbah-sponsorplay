"""
Barbah SponsorPlay - Agent 2: Campaign Architect & Contract Generator Agent
PayPal AI Hackathon - Track 02: Sponsor Play
"""

import uuid
from typing import List
from app.models.schemas import CampaignBrief, SyndicateRecommendation, Proposal, Milestone
from app.config import settings

class ArchitectAgent:
    def __init__(self):
        self.name = "Campaign Architect & Contract Generator Agent"
        self.version = "1.0.0"

    def draft_proposal(
        self,
        campaign: CampaignBrief,
        syndicate: SyndicateRecommendation
    ) -> Proposal:
        """
        Structures an executable milestone contract, calculates exact financial fee splits,
        and generates legally enforceable digital agreement clauses with automated verification specs.
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

architect_agent = ArchitectAgent()
