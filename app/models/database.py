"""
Barbah SponsorPlay - Local Persistence Layer & Store
PayPal AI Hackathon - Track 02: Sponsor Play
"""

import json
import os
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from app.models.schemas import (
    CreatorProfile, CampaignBrief, SyndicateRecommendation,
    Proposal, Milestone, ProofOfPlayCertificate, eTIMSInvoice,
    MetaTwinReport, EmailDispatchRecord, CreatorCollaborationMessage,
    CreatorProfileUpdate
)

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")

class Database:
    def __init__(self):
        self.creators: Dict[str, CreatorProfile] = {}
        self.campaigns: Dict[str, CampaignBrief] = {}
        self.syndicates: Dict[str, SyndicateRecommendation] = {}
        self.proposals: Dict[str, Proposal] = {}
        self.certificates: Dict[str, ProofOfPlayCertificate] = {}
        self.invoices: Dict[str, eTIMSInvoice] = {}
        self.impact_reports: Dict[str, MetaTwinReport] = {}
        self.paypal_orders: Dict[str, Dict] = {}
        self.emails: Dict[str, EmailDispatchRecord] = {}
        self.collaboration_messages: Dict[str, List[CreatorCollaborationMessage]] = {}
        self._load_seed_data()

    def _load_seed_data(self):
        # Load creators
        creators_file = os.path.join(DATA_DIR, "seed_creators.json")
        if os.path.exists(creators_file):
            with open(creators_file, "r", encoding="utf-8") as f:
                creators_data = json.load(f)
                for item in creators_data:
                    c = CreatorProfile(**item)
                    self.creators[c.id] = c
        
        # Load campaigns
        campaigns_file = os.path.join(DATA_DIR, "seed_campaigns.json")
        if os.path.exists(campaigns_file):
            with open(campaigns_file, "r", encoding="utf-8") as f:
                campaigns_data = json.load(f)
                for item in campaigns_data:
                    b = CampaignBrief(**item)
                    self.campaigns[b.id] = b

        # Pre-seed initial proposals for realistic immediate creator onboarding demo
        self._seed_initial_proposals()

    def _seed_initial_proposals(self):
        the_beast = self.creators.get("creator-001")
        queen_arrow = self.creators.get("creator-002")
        psg = self.creators.get("creator-003")
        kayole = self.creators.get("creator-004")

        # 1. Active Funded Deal for Brian 'The Beast' Diang'a (Safaricom 5G)
        if the_beast:
            p1_id = "PROP-SAF-001"
            p1 = Proposal(
                id=p1_id,
                campaign_id="camp-001",
                brand_name="Safaricom 5G Home Gaming",
                syndicate_id="SYN-SAF-01",
                total_budget_usd=769.23,
                total_budget_kes=100000.0,
                platform_fee_usd=76.92,
                platform_fee_kes=10000.0,
                gross_beneficiary_usd=692.31,
                gross_beneficiary_kes=90000.0,
                withholding_tax_usd=34.62,
                withholding_tax_kes=4500.0,
                net_creator_disbursement_usd=657.69,
                net_creator_disbursement_kes=85500.0,
                creators=[the_beast] + ([kayole] if kayole else []),
                milestones=[
                    Milestone(
                        id="MLS-SAF-01",
                        milestone_number=1,
                        title="Broadcast Asset Integration & Mobilization",
                        description="Stream overlay setup, teaser video drop on YouTube/TikTok, physical lounge banner placement.",
                        percentage=30.0,
                        amount_usd=207.69,
                        amount_kes=27000.0,
                        deliverables=[
                            "1080p overlay test screenshot showing Safaricom 5G logo",
                            "Community announcement post on TikTok and WhatsApp"
                        ],
                        verification_criteria={
                            "min_logo_screen_ratio_percent": 3.5,
                            "min_resolution": "1920x1080"
                        },
                        status="COMMITTED_IN_LEDGER"
                    ),
                    Milestone(
                        id="MLS-SAF-02",
                        milestone_number=2,
                        title="Live EA FC 25 Stream Broadcast (3 Hours)",
                        description="Live competitive broadcast with continuous Safaricom logo and 4 verbal shoutcaster callouts.",
                        percentage=40.0,
                        amount_usd=276.92,
                        amount_kes=36000.0,
                        deliverables=[
                            "Minimum 3 hours live gameplay broadcast",
                            "Logo screen occupancy ratio >= 3.5%",
                            "4 verbal brand endorsements"
                        ],
                        verification_criteria={
                            "min_airtime_minutes": 180,
                            "min_logo_screen_ratio_percent": 3.5,
                            "min_verbal_callouts": 4
                        },
                        status="PENDING_FUNDING"
                    ),
                    Milestone(
                        id="MLS-SAF-03",
                        milestone_number=3,
                        title="Post-Event Highlight Slicing & Audience Telemetry",
                        description="Vertical 9:16 highlight clips published to TikTok/Reels and viewer analytics dossier.",
                        percentage=30.0,
                        amount_usd=207.69,
                        amount_kes=27000.0,
                        deliverables=[
                            "2 branded highlight clips with #Safaricom5GGaming",
                            "Final stream metrics and demographic report"
                        ],
                        verification_criteria={
                            "clips_published": 2,
                            "analytics_submitted": True
                        },
                        status="PENDING_FUNDING"
                    )
                ],
                legal_clauses=[
                    "1. eTIMS BII INVOICING: Barbah Games generates Buyer-Initiated Invoice (BII) on creator's behalf under KRA Section 23A.",
                    "2. 5% WITHHOLDING TAX: Deducted at source (KES 4,500.00) and remitted directly to Kenya Revenue Authority.",
                    "3. PAYPAL MILESTONE LEDGER: Funds locked in Orders v2 multiparty ledger with delayed release upon Agent 3 Proof-of-Play."
                ],
                status="FUNDED",
                beneficiary_emails=[the_beast.paypal_email],
                email_dispatch_id="EMAIL-INIT-001"
            )
            self.proposals[p1_id] = p1

            # Seed sample collaboration messages
            self.collaboration_messages[p1_id] = [
                CreatorCollaborationMessage(
                    id="MSG-01",
                    proposal_id=p1_id,
                    sender_type="BRAND",
                    sender_name="Safaricom Marketing",
                    content="Welcome to the campaign, Brian! Campaign budget is fully locked in PayPal Milestone Ledger. Excited for the Kibera community derby!",
                    timestamp="2026-11-10T14:30:00Z"
                ),
                CreatorCollaborationMessage(
                    id="MSG-02",
                    proposal_id=p1_id,
                    sender_type="AGENT",
                    sender_name="Agent 2 (Architect)",
                    content="Contract terms active: Milestone 1 is ready for deliverable submission. Upload your overlay screenshot or stream VOD to trigger Agent 3 verification.",
                    timestamp="2026-11-10T14:32:00Z"
                )
            ]

        # 2. Pending Offer for QueenArrow (Monster Energy East Africa)
        if queen_arrow:
            p2_id = "PROP-MON-002"
            p2 = Proposal(
                id=p2_id,
                campaign_id="camp-002",
                brand_name="Monster Energy East Africa",
                syndicate_id="SYN-MON-01",
                total_budget_usd=600.0,
                total_budget_kes=78000.0,
                platform_fee_usd=60.0,
                platform_fee_kes=7800.0,
                gross_beneficiary_usd=540.0,
                gross_beneficiary_kes=70200.0,
                withholding_tax_usd=27.0,
                withholding_tax_kes=3510.0,
                net_creator_disbursement_usd=513.0,
                net_creator_disbursement_kes=66690.0,
                creators=[queen_arrow],
                milestones=[
                    Milestone(
                        id="MLS-MON-01",
                        milestone_number=1,
                        title="Tekken 8 Title Sponsorship Announcement & Staging",
                        description="Custom stream alert integration and branded Tekken 8 social tournament reveal.",
                        percentage=30.0,
                        amount_usd=162.0,
                        amount_kes=21060.0,
                        deliverables=[
                            "Branded Twitch stream overlay staging",
                            "Social media teaser video"
                        ],
                        verification_criteria={
                            "brand_tag_verified": True,
                            "min_logo_screen_ratio_percent": 3.5
                        },
                        status="PENDING_FUNDING"
                    ),
                    Milestone(
                        id="MLS-MON-02",
                        milestone_number=2,
                        title="Live Tekken 8 Tournament Airtime & Mentorship",
                        description="4 hours live stream fighting game showcase with Monster Energy placement.",
                        percentage=40.0,
                        amount_usd=216.0,
                        amount_kes=28080.0,
                        deliverables=[
                            "4 hours continuous broadcast",
                            "Logo occupancy ratio >= 3.5%",
                            "3 brand shoutcaster endorsements"
                        ],
                        verification_criteria={
                            "min_airtime_minutes": 240,
                            "min_logo_screen_ratio_percent": 3.5
                        },
                        status="PENDING_FUNDING"
                    ),
                    Milestone(
                        id="MLS-MON-03",
                        milestone_number=3,
                        title="VOD Archival & Highlights",
                        description="Clip highlights and YouTube archive.",
                        percentage=30.0,
                        amount_usd=162.0,
                        amount_kes=21060.0,
                        deliverables=[
                            "2 tournament highlight shorts"
                        ],
                        verification_criteria={
                            "clips_published": 2
                        },
                        status="PENDING_FUNDING"
                    )
                ],
                legal_clauses=[
                    "1. BUYER-INITIATED INVOICE (BII) compliance under KRA Section 16(1)(c).",
                    "2. Withholding tax at 5% remitted directly to KRA.",
                    "3. Programmatic release upon Agent 3 Proof-of-Play certification."
                ],
                status="OFFER_DISPATCHED",
                beneficiary_emails=[queen_arrow.paypal_email],
                email_dispatch_id="EMAIL-INIT-002"
            )
            self.proposals[p2_id] = p2

    def get_all_creators(self) -> List[CreatorProfile]:
        return list(self.creators.values())

    def get_creator(self, creator_id: str) -> Optional[CreatorProfile]:
        return self.creators.get(creator_id)

    def save_campaign(self, campaign: CampaignBrief) -> CampaignBrief:
        self.campaigns[campaign.id] = campaign
        return campaign

    def get_campaign(self, campaign_id: str) -> Optional[CampaignBrief]:
        if not campaign_id:
            return next(iter(self.campaigns.values()), None)
        # Direct lookup
        if campaign_id in self.campaigns:
            return self.campaigns[campaign_id]
        # Case-insensitive lookup
        cid_lower = campaign_id.lower()
        for k, v in self.campaigns.items():
            if k.lower() == cid_lower:
                return v
        # Fallback to the latest campaign
        if self.campaigns:
            return list(self.campaigns.values())[-1]
        return None

    def save_syndicate(self, syn: SyndicateRecommendation) -> SyndicateRecommendation:
        self.syndicates[syn.syndicate_id] = syn
        return syn

    def get_syndicate(self, syndicate_id: str) -> Optional[SyndicateRecommendation]:
        if not syndicate_id:
            return next(iter(self.syndicates.values()), None)
        if syndicate_id in self.syndicates:
            return self.syndicates[syndicate_id]
        sid_lower = syndicate_id.lower()
        for k, v in self.syndicates.items():
            if k.lower() == sid_lower:
                return v
        return next(iter(self.syndicates.values()), None)

    def save_proposal(self, proposal: Proposal) -> Proposal:
        self.proposals[proposal.id] = proposal
        return proposal

    def get_proposal(self, proposal_id: str) -> Optional[Proposal]:
        return self.proposals.get(proposal_id)

    def save_certificate(self, cert: ProofOfPlayCertificate) -> ProofOfPlayCertificate:
        self.certificates[cert.certificate_id] = cert
        return cert

    def get_certificate(self, cert_id: str) -> Optional[ProofOfPlayCertificate]:
        return self.certificates.get(cert_id)

    def save_invoice(self, invoice: eTIMSInvoice) -> eTIMSInvoice:
        self.invoices[invoice.cu_invoice_number] = invoice
        return invoice

    def get_invoice(self, cu_number: str) -> Optional[eTIMSInvoice]:
        return self.invoices.get(cu_number)

    def save_impact_report(self, report: MetaTwinReport) -> MetaTwinReport:
        self.impact_reports[report.campaign_id] = report
        return report

    def get_impact_report(self, campaign_id: str) -> Optional[MetaTwinReport]:
        return self.impact_reports.get(campaign_id)

    def save_email(self, record: EmailDispatchRecord) -> EmailDispatchRecord:
        self.emails[record.email_id] = record
        return record

    def get_email(self, email_id: str) -> Optional[EmailDispatchRecord]:
        return self.emails.get(email_id)

    def get_all_emails(self) -> List[EmailDispatchRecord]:
        return list(self.emails.values())

    def get_proposals_for_creator(self, creator_id: str) -> List[Proposal]:
        matches = []
        for p in self.proposals.values():
            if any(c.id == creator_id for c in p.creators):
                matches.append(p)
        return matches

    def get_certificates_for_creator(self, creator_id: str) -> List[ProofOfPlayCertificate]:
        return [c for c in self.certificates.values() if c.creator_id == creator_id]

    def get_invoices_for_creator(self, creator_id: str) -> List[eTIMSInvoice]:
        creator = self.get_creator(creator_id)
        if not creator:
            return []
        return [inv for inv in self.invoices.values() if inv.supplier_pin == creator.kra_pin]

    def update_creator_profile(self, creator_id: str, updates: CreatorProfileUpdate) -> Optional[CreatorProfile]:
        creator = self.get_creator(creator_id)
        if not creator:
            return None
        dump = updates.model_dump(exclude_unset=True) if hasattr(updates, "model_dump") else updates.dict(exclude_unset=True)
        for k, v in dump.items():
            if v is not None and hasattr(creator, k):
                setattr(creator, k, v)
        self.creators[creator_id] = creator
        return creator

    def add_collaboration_message(self, proposal_id: str, message: CreatorCollaborationMessage) -> CreatorCollaborationMessage:
        if proposal_id not in self.collaboration_messages:
            self.collaboration_messages[proposal_id] = []
        self.collaboration_messages[proposal_id].append(message)
        return message

    def get_collaboration_messages(self, proposal_id: str) -> List[CreatorCollaborationMessage]:
        return self.collaboration_messages.get(proposal_id, [])

db = Database()
