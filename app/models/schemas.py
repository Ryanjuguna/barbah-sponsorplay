"""
Barbah SponsorPlay - Pydantic Data Models & Schemas
PayPal AI Hackathon - Track 02: Sponsor Play
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class CreatorProfile(BaseModel):
    id: str
    name: str
    gamer_tag: str
    type: str  # PRO_PLAYER_STREAMER, TOURNAMENT_ORGANIZER, GRASSROOTS_GAMING_DEN, CAMPUS_ESPORTS_CLUB, REGIONAL_HUB
    primary_game: str
    platform: str
    channel_url: str
    location: str
    monthly_reach: int
    avg_concurrent_viewers: int
    audience_demographic: str
    brand_safety_score: float
    etims_registered: bool
    kra_pin: str
    paypal_email: str
    mpesa_phone: str
    base_rate_usd: float
    tags: List[str] = []
    bio: str

class CampaignBrief(BaseModel):
    id: Optional[str] = None
    brand_name: str
    corporate_pin: str
    brief: str
    target_audience: str
    target_reach: int = 10000
    budget_usd: float
    budget_kes: Optional[float] = None
    preferred_locations: List[str] = ["Nairobi"]
    required_activities: List[str] = [
        "Live stream logo overlay",
        "Verbal shoutcaster callout",
        "Campus LAN tournament banner"
    ]
    strategy_preference: Optional[str] = "AUTO"  # "AUTO", "SYNDICATE", "SOLO"
    beneficiary_notification_email: Optional[str] = None

class SyndicateRecommendation(BaseModel):
    syndicate_id: str
    campaign_id: Optional[str] = None
    title: str
    rationale: str
    total_cost_usd: float
    total_cost_kes: float
    expected_reach: int
    creators: List[CreatorProfile]
    synergy_score: float
    etims_compliance_mode: str  # "MIXED_DIRECT_AND_BII", "ALL_DIRECT", "ALL_BII"

class Milestone(BaseModel):
    id: str
    milestone_number: int
    title: str
    description: str
    percentage: float  # e.g. 30.0 for 30%
    amount_usd: float
    amount_kes: float
    deliverables: List[str]
    verification_criteria: Dict[str, Any]
    status: str = "PENDING_FUNDING"  # PENDING_FUNDING, COMMITTED_IN_LEDGER, IN_PROGRESS, VERIFIED, DISBURSED

class Proposal(BaseModel):
    id: str
    campaign_id: str
    brand_name: str
    syndicate_id: str
    total_budget_usd: float
    total_budget_kes: float
    platform_fee_usd: float
    platform_fee_kes: float
    gross_beneficiary_usd: float
    gross_beneficiary_kes: float
    withholding_tax_usd: float
    withholding_tax_kes: float
    net_creator_disbursement_usd: float
    net_creator_disbursement_kes: float
    creators: List[CreatorProfile]
    milestones: List[Milestone]
    legal_clauses: List[str]
    status: str = "DRAFT"  # DRAFT, APPROVED_BY_SPONSOR, FUNDED, ACTIVE, COMPLETED
    beneficiary_emails: List[str] = []
    email_dispatch_id: Optional[str] = None

class SoloCreatorMatch(BaseModel):
    creator: CreatorProfile
    match_score: float
    match_rationale: str
    recommended_deliverables: List[str]
    total_cost_usd: float
    total_cost_kes: float

class AIStrategicAnalysis(BaseModel):
    target_summary: str
    detected_intent: str  # "AUTO", "SYNDICATE", "SOLO"
    recommended_path: str  # "SYNDICATE" or "SOLO"
    recommendation_title: str
    verdict_rationale: str
    syndicate_score: float
    solo_score: float
    reach_comparison: Dict[str, Any]

class BriefDeconstructionResult(BaseModel):
    campaign_id: str
    brand_name: str
    ai_analysis: AIStrategicAnalysis
    syndicates: List[SyndicateRecommendation]
    solo_matches: List[SoloCreatorMatch]

class EmailDispatchRecord(BaseModel):
    email_id: str
    proposal_id: str
    recipients: List[str]
    subject: str
    status: str  # "DELIVERED_SMTP", "DISPATCHED_TO_BENEFICIARY", "SAVED_LOCAL_STORE"
    sent_at: str
    html_preview_url: Optional[str] = None
    rendered_html: str

class PayPalOrderRequest(BaseModel):
    proposal_id: str
    intent: str = "CAPTURE"
    currency: str = "USD"

class PayPalOrderResponse(BaseModel):
    order_id: str
    status: str
    approval_url: str
    gross_amount: float
    platform_fee: float
    disbursement_mode: str
    payer_id: Optional[str] = None
    capture_id: Optional[str] = None

class DeliverableSubmission(BaseModel):
    milestone_id: str
    creator_id: str
    deliverable_type: str  # LIVE_STREAM_VOD, SOCIAL_POST, TOURNAMENT_BRACKET, PHYSICAL_BANNER
    media_url: str
    notes: Optional[str] = None
    simulated_metrics: Optional[Dict[str, Any]] = None

class ProofOfPlayCertificate(BaseModel):
    certificate_id: str
    milestone_id: str
    creator_id: str
    timestamp: str
    logo_screen_ratio_percent: float
    airtime_seconds: int
    verbal_slogans_detected: List[str]
    audio_confidence: float
    brand_safety_status: str  # SAFE, WARNING, VIOLATION
    overall_confidence_percent: float
    verification_decision: str  # PASSED, REQUIRES_REVISION, REJECTED
    cryptographic_hash: str
    proof_image_url: Optional[str] = None
    bounding_box: Optional[Dict[str, int]] = None

class eTIMSInvoice(BaseModel):
    cu_invoice_number: str
    invoice_type: str  # "DIRECT_OSCU" or "BUYER_INITIATED_INVOICE_BII"
    supplier_pin: str
    supplier_name: str
    buyer_pin: str
    buyer_name: str
    invoice_date: str
    taxable_amount_kes: float
    vat_amount_kes: float
    withholding_tax_kes: float
    net_payable_kes: float
    qr_code_url: str
    digital_signature: str
    kra_compliance_status: str = "CERTIFIED_VALID_SECTION_16"

class MetaTwinReport(BaseModel):
    campaign_id: str
    brand_name: str
    youth_reached_total: int
    collegiate_gamers_empowered: int
    informal_settlement_youth_share_percent: float
    female_gamer_inclusion_percent: float
    total_economic_payout_kes: float
    digital_skills_badges_awarded: int
    metatwin_verified_hash: str
    generated_at: str
