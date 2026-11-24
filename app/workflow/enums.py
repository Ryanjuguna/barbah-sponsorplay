"""Canonical status vocabulary for the workflow.

Every status in the system belongs to exactly one of five families. The
frontend uses the family to pick a treatment, so a new status never needs a new
colour.
"""

from enum import Enum
from typing import Dict


class StrEnum(str, Enum):
    def __str__(self) -> str:  # pragma: no cover - convenience only
        return self.value


class Role(StrEnum):
    BRAND_ADMIN = "BRAND_ADMIN"
    BRAND_MEMBER = "BRAND_MEMBER"
    OPS_REVIEWER = "OPS_REVIEWER"
    OPS_ADMIN = "OPS_ADMIN"
    CREATOR = "CREATOR"


class StatusFamily(StrEnum):
    NEUTRAL = "NEUTRAL"
    PROGRESS = "PROGRESS"
    ATTENTION = "ATTENTION"
    SUCCESS = "SUCCESS"
    RISK = "RISK"


class ProposalStatus(StrEnum):
    DRAFT = "DRAFT"
    IN_REVIEW = "IN_REVIEW"
    CHANGES_REQUESTED = "CHANGES_REQUESTED"
    APPROVED = "APPROVED"
    SENT = "SENT"
    PARTIALLY_ACCEPTED = "PARTIALLY_ACCEPTED"
    ACCEPTED = "ACCEPTED"
    FUNDED = "FUNDED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"
    DISPUTED = "DISPUTED"


class MilestoneStatus(StrEnum):
    DRAFT = "DRAFT"
    LOCKED = "LOCKED"
    FUNDED = "FUNDED"
    IN_PROGRESS = "IN_PROGRESS"
    EVIDENCE_SUBMITTED = "EVIDENCE_SUBMITTED"
    AI_REVIEWED = "AI_REVIEWED"
    APPROVED = "APPROVED"
    INVOICED = "INVOICED"
    PAID = "PAID"
    CLOSED = "CLOSED"
    REVISION_REQUESTED = "REVISION_REQUESTED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"
    DISPUTED = "DISPUTED"


class OfferStatus(StrEnum):
    INVITED = "INVITED"
    SENT = "SENT"
    VIEWED = "VIEWED"
    ACCEPTED = "ACCEPTED"
    COUNTERED = "COUNTERED"
    DECLINED = "DECLINED"
    EXPIRED = "EXPIRED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    WITHDRAWN = "WITHDRAWN"


class ReviewDecisionType(StrEnum):
    APPROVE = "APPROVE"
    REQUEST_CHANGES = "REQUEST_CHANGES"
    REJECT = "REJECT"


class CheckResult(StrEnum):
    PASS = "PASS"
    FAIL = "FAIL"
    INCONCLUSIVE = "INCONCLUSIVE"
    NOT_APPLICABLE = "NOT_APPLICABLE"


class PaymentStatus(StrEnum):
    INTENT_CREATED = "INTENT_CREATED"
    PROCESSING = "PROCESSING"
    PAID = "PAID"
    FAILED = "FAILED"
    RECONCILED = "RECONCILED"
    REFUNDED = "REFUNDED"
    REVERSED = "REVERSED"


class FundingStatus(StrEnum):
    CREATED = "CREATED"
    CAPTURED = "CAPTURED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class InvoiceType(StrEnum):
    PLATFORM_FEE = "PLATFORM_FEE"
    CREATOR_SERVICE = "CREATOR_SERVICE"


class NotificationStatus(StrEnum):
    QUEUED = "QUEUED"
    SENT = "SENT"
    FAILED = "FAILED"
    LOGGED_ONLY = "LOGGED_ONLY"


# --------------------------------------------------------------------------
# Families
# --------------------------------------------------------------------------

PROPOSAL_FAMILY: Dict[str, StatusFamily] = {
    ProposalStatus.DRAFT.value: StatusFamily.NEUTRAL,
    ProposalStatus.IN_REVIEW.value: StatusFamily.NEUTRAL,
    ProposalStatus.CHANGES_REQUESTED.value: StatusFamily.ATTENTION,
    ProposalStatus.APPROVED.value: StatusFamily.SUCCESS,
    ProposalStatus.SENT.value: StatusFamily.PROGRESS,
    ProposalStatus.PARTIALLY_ACCEPTED.value: StatusFamily.PROGRESS,
    ProposalStatus.ACCEPTED.value: StatusFamily.SUCCESS,
    ProposalStatus.FUNDED.value: StatusFamily.PROGRESS,
    ProposalStatus.ACTIVE.value: StatusFamily.PROGRESS,
    ProposalStatus.COMPLETED.value: StatusFamily.SUCCESS,
    ProposalStatus.CANCELLED.value: StatusFamily.RISK,
    ProposalStatus.EXPIRED.value: StatusFamily.ATTENTION,
    ProposalStatus.DISPUTED.value: StatusFamily.RISK,
}

MILESTONE_FAMILY: Dict[str, StatusFamily] = {
    MilestoneStatus.DRAFT.value: StatusFamily.NEUTRAL,
    MilestoneStatus.LOCKED.value: StatusFamily.NEUTRAL,
    MilestoneStatus.FUNDED.value: StatusFamily.NEUTRAL,
    MilestoneStatus.IN_PROGRESS.value: StatusFamily.PROGRESS,
    MilestoneStatus.EVIDENCE_SUBMITTED.value: StatusFamily.PROGRESS,
    MilestoneStatus.AI_REVIEWED.value: StatusFamily.PROGRESS,
    MilestoneStatus.APPROVED.value: StatusFamily.SUCCESS,
    MilestoneStatus.INVOICED.value: StatusFamily.SUCCESS,
    MilestoneStatus.PAID.value: StatusFamily.SUCCESS,
    MilestoneStatus.CLOSED.value: StatusFamily.SUCCESS,
    MilestoneStatus.REVISION_REQUESTED.value: StatusFamily.ATTENTION,
    MilestoneStatus.REJECTED.value: StatusFamily.RISK,
    MilestoneStatus.CANCELLED.value: StatusFamily.RISK,
    MilestoneStatus.DISPUTED.value: StatusFamily.RISK,
}

OFFER_FAMILY: Dict[str, StatusFamily] = {
    OfferStatus.INVITED.value: StatusFamily.NEUTRAL,
    OfferStatus.SENT.value: StatusFamily.NEUTRAL,
    OfferStatus.VIEWED.value: StatusFamily.PROGRESS,
    OfferStatus.ACCEPTED.value: StatusFamily.SUCCESS,
    OfferStatus.COUNTERED.value: StatusFamily.ATTENTION,
    OfferStatus.DECLINED.value: StatusFamily.RISK,
    OfferStatus.EXPIRED.value: StatusFamily.ATTENTION,
    OfferStatus.ACTIVE.value: StatusFamily.PROGRESS,
    OfferStatus.COMPLETED.value: StatusFamily.SUCCESS,
    OfferStatus.WITHDRAWN.value: StatusFamily.RISK,
}


def family_for(status: str) -> StatusFamily:
    """Return the status family for any known status string."""
    for table in (PROPOSAL_FAMILY, MILESTONE_FAMILY, OFFER_FAMILY):
        if status in table:
            return table[status]
    return StatusFamily.NEUTRAL
