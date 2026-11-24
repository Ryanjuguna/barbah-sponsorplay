"""Request and response models for the workflow API.

The response shapes are the frontend contract. Amounts appear twice on
purpose: ``amount_minor`` is the source of truth for arithmetic, ``amount`` is
the formatted-for-display decimal, and ``currency`` is always explicit.
"""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

from app.workflow.money import from_minor


# --------------------------------------------------------------------------
# Identity
# --------------------------------------------------------------------------

class PrincipalOut(BaseModel):
    user_id: str
    email: str
    name: str
    role: str
    org_id: Optional[str] = None
    creator_id: Optional[str] = None
    is_ops: bool = False
    is_brand: bool = False


class SessionOut(BaseModel):
    token: str
    principal: PrincipalOut
    redirect_url: str


# --------------------------------------------------------------------------
# Creators
# --------------------------------------------------------------------------

class CreatorOut(BaseModel):
    id: str
    name: str
    gamer_tag: Optional[str] = None
    type: Optional[str] = None
    primary_game: Optional[str] = None
    platform: Optional[str] = None
    channel_url: Optional[str] = None
    location: Optional[str] = None
    monthly_reach: int = 0
    base_rate_minor: int = 0
    base_rate: float = 0
    currency: str = "USD"
    brand_safety_score: float = 0
    channel_verified: bool = False
    tax_profile_status: str = "UNVERIFIED"


# --------------------------------------------------------------------------
# Campaigns
# --------------------------------------------------------------------------

class CampaignCreate(BaseModel):
    brand_name: Optional[str] = None
    brief: str
    target_audience: Optional[str] = None
    objective: Optional[str] = None
    kpi: Optional[str] = None
    geography: Optional[str] = "Nairobi"
    budget: float
    currency: str = "USD"
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None
    strategy_preference: str = "AUTO"


class CampaignUpdate(BaseModel):
    brand_name: Optional[str] = None
    brief: Optional[str] = None
    target_audience: Optional[str] = None
    objective: Optional[str] = None
    kpi: Optional[str] = None
    geography: Optional[str] = None
    budget: Optional[float] = None
    currency: Optional[str] = None
    starts_at: Optional[str] = None
    ends_at: Optional[str] = None


class CampaignOut(BaseModel):
    id: str
    org_id: str
    brand_name: str
    brief: str
    target_audience: Optional[str] = None
    objective: Optional[str] = None
    kpi: Optional[str] = None
    geography: Optional[str] = None
    budget_minor: int
    budget: float
    currency: str
    status: str
    created_at: str
    updated_at: str


class SyndicateMemberOut(BaseModel):
    creator: CreatorOut
    role_in_syndicate: Optional[str] = None
    allocation_pct: float = 0


class SyndicateOut(BaseModel):
    id: str
    campaign_id: str
    title: str
    rationale: Optional[str] = None
    expected_reach: int = 0
    status: str
    members: List[SyndicateMemberOut] = []


class MatchRunOut(BaseModel):
    id: str
    campaign_id: str
    agent_version: Optional[str] = None
    model: Optional[str] = None
    created_at: str
    analysis: Dict[str, Any] = {}
    syndicates: List[SyndicateOut] = []
    solo_matches: List[Dict[str, Any]] = []


class SyndicatePatch(BaseModel):
    add_creator_ids: List[str] = []
    remove_creator_ids: List[str] = []


# --------------------------------------------------------------------------
# Proposals
# --------------------------------------------------------------------------

class EvidenceRequirementIn(BaseModel):
    key: str
    label: str
    kind: str = "FILE"  # URL | IMAGE | FILE | TEXT
    required: bool = True
    instructions: Optional[str] = None
    accepted_types: List[str] = []
    accepted_hosts: List[str] = []
    min_count: int = 1
    min_width: Optional[int] = None


class MilestoneIn(BaseModel):
    id: Optional[str] = None
    seq: int
    title: str
    description: Optional[str] = None
    amount: float
    currency: Optional[str] = None
    due_at: Optional[str] = None
    evidence_requirements: List[EvidenceRequirementIn] = []
    acceptance_criteria: List[str] = []
    review_sla_hours: int = 48
    revision_window_hours: int = 72


class MilestoneOut(BaseModel):
    id: str
    proposal_id: str
    seq: int
    title: str
    description: Optional[str] = None
    amount_minor: int
    amount: float
    currency: str
    due_at: Optional[str] = None
    evidence_requirements: List[Dict[str, Any]] = []
    acceptance_criteria: List[str] = []
    review_sla_hours: int = 48
    revision_window_hours: int = 72
    status: str
    status_family: str = "NEUTRAL"


class ProposalCreate(BaseModel):
    syndicate_id: Optional[str] = None
    creator_ids: List[str] = []
    total_budget: Optional[float] = None
    currency: Optional[str] = None


class ProposalPatch(BaseModel):
    milestones: Optional[List[MilestoneIn]] = None
    legal_clauses: Optional[List[str]] = None
    fx_rate: Optional[float] = None
    total_budget: Optional[float] = None
    currency: Optional[str] = None


class OfferOut(BaseModel):
    id: str
    proposal_id: str
    creator_id: str
    creator: Optional[CreatorOut] = None
    allocation_minor: int
    allocation: float
    currency: str
    status: str
    status_family: str = "NEUTRAL"
    sent_at: Optional[str] = None
    viewed_at: Optional[str] = None
    accepted_at: Optional[str] = None
    declined_at: Optional[str] = None
    decline_reason: Optional[str] = None
    token_expires_at: Optional[str] = None
    magic_link: Optional[str] = None


class ProposalOut(BaseModel):
    id: str
    campaign_id: str
    org_id: str
    brand_name: Optional[str] = None
    syndicate_id: Optional[str] = None
    version: int
    status: str
    status_family: str = "NEUTRAL"
    total_minor: int
    total: float
    currency: str
    fx_rate: float
    platform_fee_minor: int
    platform_fee: float
    creator_pool_minor: int
    creator_pool: float
    withholding_minor: int
    withholding: float
    net_creator_minor: int
    net_creator: float
    legal_clauses: List[str] = []
    created_by: Optional[str] = None
    approved_by: Optional[str] = None
    approved_at: Optional[str] = None
    sent_at: Optional[str] = None
    created_at: str
    updated_at: str
    milestones: List[MilestoneOut] = []
    offers: List[OfferOut] = []


class ValidationIssue(BaseModel):
    severity: str  # BLOCKING | WARNING
    code: str
    message: str
    field: Optional[str] = None


class ValidationResult(BaseModel):
    ok: bool
    blocking: List[ValidationIssue] = []
    warnings: List[ValidationIssue] = []


# --------------------------------------------------------------------------
# Offers / creator side
# --------------------------------------------------------------------------

class OfferPublicOut(BaseModel):
    offer: OfferOut
    proposal: ProposalOut
    campaign: Optional[CampaignOut] = None
    brand_name: str
    milestones: List[MilestoneOut] = []
    requires_account: bool = False
    expires_at: Optional[str] = None


class AcceptOfferIn(BaseModel):
    full_name: Optional[str] = None
    password: Optional[str] = None
    confirm_payout_ref: Optional[str] = None
    confirm_tax_profile: bool = True


class CounterOfferIn(BaseModel):
    amount: float
    scope_changes: List[str] = []
    proposed_dates: Dict[str, str] = {}
    message: Optional[str] = None


class DeclineOfferIn(BaseModel):
    reason: Optional[str] = None


class EvidenceOut(BaseModel):
    id: str
    milestone_id: str
    kind: str
    label: Optional[str] = None
    original_filename: Optional[str] = None
    content_type: Optional[str] = None
    size_bytes: int = 0
    sha256: Optional[str] = None
    url: Optional[str] = None
    captured_at: Optional[str] = None
    submitted_at: Optional[str] = None
    created_at: str


class CheckOut(BaseModel):
    key: str
    label: str
    required: bool = True
    result: str
    confidence: float = 0.0
    method: Optional[str] = None
    detail: Optional[str] = None
    artifacts: List[Dict[str, Any]] = []


class VerificationReportOut(BaseModel):
    id: str
    milestone_id: str
    agent_version: Optional[str] = None
    model: Optional[str] = None
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    checks: List[CheckOut] = []
    metrics: Dict[str, Any] = {}
    limitations: List[str] = []
    recommended_decision: Optional[str] = None
    summary: Optional[str] = None
    created_at: str


class ReviewDecisionIn(BaseModel):
    decision: str  # APPROVE | REQUEST_CHANGES | REJECT
    reason: Optional[str] = None


class ReviewDecisionOut(BaseModel):
    id: str
    milestone_id: str
    reviewer_id: str
    decision: str
    reason: Optional[str] = None
    overrode_recommendation: bool = False
    decided_at: str


class ReviewCaseOut(BaseModel):
    milestone: MilestoneOut
    proposal: ProposalOut
    campaign: Optional[CampaignOut] = None
    creator: Optional[CreatorOut] = None
    evidence: List[EvidenceOut] = []
    report: Optional[VerificationReportOut] = None
    decision: Optional[ReviewDecisionOut] = None
    age_hours: float = 0
    sla_breached: bool = False


class LedgerEntryOut(BaseModel):
    id: str
    account: str
    direction: str
    amount_minor: int
    amount: float
    currency: str
    ref_type: Optional[str] = None
    ref_id: Optional[str] = None
    description: Optional[str] = None
    created_at: str


class InvoiceOut(BaseModel):
    id: str
    milestone_id: Optional[str] = None
    proposal_id: Optional[str] = None
    invoice_type: str
    amount_minor: int
    amount: float
    tax_minor: int
    tax: float
    currency: str
    status: str
    etims_ref: Optional[str] = None
    issued_at: str


class FundingIntentIn(BaseModel):
    proposal_id: str
    amount: Optional[float] = None
    provider: str = "SIMULATED"


class FundingIntentOut(BaseModel):
    id: str
    proposal_id: str
    amount_minor: int
    amount: float
    currency: str
    provider: str
    status: str
    idempotency_key: Optional[str] = None
    created_at: str


class PayoutOut(BaseModel):
    id: str
    milestone_id: str
    offer_id: Optional[str] = None
    amount_minor: int
    amount: float
    currency: str
    status: str
    provider: Optional[str] = None
    provider_ref: Optional[str] = None
    invoice: Optional[InvoiceOut] = None


class AuditEventOut(BaseModel):
    id: str
    actor_id: Optional[str] = None
    actor_role: Optional[str] = None
    action: str
    entity_type: str
    entity_id: str
    before: Optional[Dict[str, Any]] = None
    after: Optional[Dict[str, Any]] = None
    created_at: str


# --------------------------------------------------------------------------
# Dashboards
# --------------------------------------------------------------------------

class CreatorMilestoneOut(BaseModel):
    milestone: MilestoneOut
    offer_id: str
    proposal_id: str
    brand_name: str
    evidence: List[EvidenceOut] = []
    report: Optional[VerificationReportOut] = None
    decision: Optional[ReviewDecisionOut] = None


class CreatorCampaignOut(BaseModel):
    offer: OfferOut
    proposal: ProposalOut
    campaign: Optional[CampaignOut] = None
    milestones: List[MilestoneOut] = []


class CreatorHomeOut(BaseModel):
    creator: CreatorOut
    offers: List[OfferOut] = []
    campaigns: List[CreatorCampaignOut] = []
    earnings_minor: int = 0
    earnings: float = 0
    currency: str = "USD"


class MoneySummaryOut(BaseModel):
    proposal_id: str
    committed_minor: int
    committed: float
    released_minor: int
    released: float
    remaining_minor: int
    remaining: float
    currency: str
    ledger: List[LedgerEntryOut] = []
    invoices: List[InvoiceOut] = []


def amount_of(minor: int, currency: str) -> float:
    return from_minor(minor, currency)
