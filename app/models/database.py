"""
Barbah SponsorPlay - Local Persistence Layer & Store
PayPal AI Hackathon - Track 02: Sponsor Play
"""

import json
import os
from typing import Dict, List, Optional
from app.models.schemas import (
    CreatorProfile, CampaignBrief, SyndicateRecommendation,
    Proposal, Milestone, ProofOfPlayCertificate, eTIMSInvoice,
    MetaTwinReport, EmailDispatchRecord
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

db = Database()
