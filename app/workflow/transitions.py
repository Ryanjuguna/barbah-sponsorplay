"""The single source of truth for legal state transitions.

Nothing in the API layer mutates a status directly. Services call
``ensure(kind, current, target)`` first, so an illegal move is a 409 rather
than a corrupted record.
"""

from typing import Dict, Set

from app.workflow.enums import MilestoneStatus, OfferStatus, PaymentStatus, ProposalStatus
from app.workflow.errors import Conflict

PROPOSAL: Dict[str, Set[str]] = {
    ProposalStatus.DRAFT.value: {
        ProposalStatus.IN_REVIEW.value,
        ProposalStatus.CANCELLED.value,
    },
    ProposalStatus.IN_REVIEW.value: {
        ProposalStatus.APPROVED.value,
        ProposalStatus.CHANGES_REQUESTED.value,
        ProposalStatus.DRAFT.value,
        ProposalStatus.CANCELLED.value,
    },
    ProposalStatus.CHANGES_REQUESTED.value: {
        ProposalStatus.DRAFT.value,
        ProposalStatus.IN_REVIEW.value,
        ProposalStatus.CANCELLED.value,
    },
    ProposalStatus.APPROVED.value: {
        ProposalStatus.SENT.value,
        ProposalStatus.DRAFT.value,
        ProposalStatus.CANCELLED.value,
    },
    ProposalStatus.SENT.value: {
        ProposalStatus.PARTIALLY_ACCEPTED.value,
        ProposalStatus.ACCEPTED.value,
        ProposalStatus.EXPIRED.value,
        ProposalStatus.CANCELLED.value,
    },
    ProposalStatus.PARTIALLY_ACCEPTED.value: {
        ProposalStatus.ACCEPTED.value,
        ProposalStatus.FUNDED.value,
        ProposalStatus.EXPIRED.value,
        ProposalStatus.CANCELLED.value,
    },
    ProposalStatus.ACCEPTED.value: {
        ProposalStatus.FUNDED.value,
        ProposalStatus.CANCELLED.value,
    },
    ProposalStatus.FUNDED.value: {
        ProposalStatus.ACTIVE.value,
        ProposalStatus.CANCELLED.value,
    },
    ProposalStatus.ACTIVE.value: {
        ProposalStatus.COMPLETED.value,
        ProposalStatus.DISPUTED.value,
        ProposalStatus.CANCELLED.value,
    },
    ProposalStatus.DISPUTED.value: {
        ProposalStatus.ACTIVE.value,
        ProposalStatus.CANCELLED.value,
    },
    ProposalStatus.COMPLETED.value: set(),
    ProposalStatus.CANCELLED.value: set(),
    ProposalStatus.EXPIRED.value: {ProposalStatus.DRAFT.value},
}

MILESTONE: Dict[str, Set[str]] = {
    MilestoneStatus.DRAFT.value: {
        MilestoneStatus.LOCKED.value,
        MilestoneStatus.CANCELLED.value,
    },
    MilestoneStatus.LOCKED.value: {
        MilestoneStatus.FUNDED.value,
        MilestoneStatus.CANCELLED.value,
    },
    MilestoneStatus.FUNDED.value: {
        MilestoneStatus.IN_PROGRESS.value,
        MilestoneStatus.CANCELLED.value,
    },
    MilestoneStatus.IN_PROGRESS.value: {
        MilestoneStatus.EVIDENCE_SUBMITTED.value,
        MilestoneStatus.CANCELLED.value,
    },
    MilestoneStatus.EVIDENCE_SUBMITTED.value: {
        MilestoneStatus.AI_REVIEWED.value,
        MilestoneStatus.IN_PROGRESS.value,
        MilestoneStatus.CANCELLED.value,
    },
    MilestoneStatus.AI_REVIEWED.value: {
        MilestoneStatus.APPROVED.value,
        MilestoneStatus.REVISION_REQUESTED.value,
        MilestoneStatus.REJECTED.value,
        MilestoneStatus.CANCELLED.value,
    },
    MilestoneStatus.REVISION_REQUESTED.value: {
        MilestoneStatus.IN_PROGRESS.value,
        MilestoneStatus.EVIDENCE_SUBMITTED.value,
        MilestoneStatus.CANCELLED.value,
    },
    MilestoneStatus.APPROVED.value: {
        MilestoneStatus.INVOICED.value,
        MilestoneStatus.CLOSED.value,
    },
    MilestoneStatus.INVOICED.value: {
        MilestoneStatus.PAID.value,
    },
    MilestoneStatus.PAID.value: {
        MilestoneStatus.CLOSED.value,
        MilestoneStatus.DISPUTED.value,
    },
    MilestoneStatus.CLOSED.value: {MilestoneStatus.DISPUTED.value},
    MilestoneStatus.REJECTED.value: {
        MilestoneStatus.DISPUTED.value,
        MilestoneStatus.CLOSED.value,
    },
    MilestoneStatus.DISPUTED.value: {
        MilestoneStatus.IN_PROGRESS.value,
        MilestoneStatus.CLOSED.value,
    },
    MilestoneStatus.CANCELLED.value: set(),
}

OFFER: Dict[str, Set[str]] = {
    OfferStatus.INVITED.value: {OfferStatus.SENT.value, OfferStatus.WITHDRAWN.value},
    OfferStatus.SENT.value: {
        OfferStatus.VIEWED.value,
        OfferStatus.ACCEPTED.value,
        OfferStatus.COUNTERED.value,
        OfferStatus.DECLINED.value,
        OfferStatus.EXPIRED.value,
        OfferStatus.WITHDRAWN.value,
    },
    OfferStatus.VIEWED.value: {
        OfferStatus.ACCEPTED.value,
        OfferStatus.COUNTERED.value,
        OfferStatus.DECLINED.value,
        OfferStatus.EXPIRED.value,
        OfferStatus.WITHDRAWN.value,
    },
    OfferStatus.COUNTERED.value: {
        OfferStatus.ACCEPTED.value,
        OfferStatus.DECLINED.value,
        OfferStatus.VIEWED.value,
        OfferStatus.EXPIRED.value,
    },
    OfferStatus.ACCEPTED.value: {OfferStatus.ACTIVE.value, OfferStatus.COMPLETED.value},
    OfferStatus.ACTIVE.value: {OfferStatus.COMPLETED.value},
    OfferStatus.DECLINED.value: set(),
    OfferStatus.EXPIRED.value: {OfferStatus.SENT.value},
    OfferStatus.WITHDRAWN.value: set(),
    OfferStatus.COMPLETED.value: set(),
}

PAYMENT: Dict[str, Set[str]] = {
    PaymentStatus.INTENT_CREATED.value: {
        PaymentStatus.PROCESSING.value,
        PaymentStatus.FAILED.value,
    },
    PaymentStatus.PROCESSING.value: {
        PaymentStatus.PAID.value,
        PaymentStatus.FAILED.value,
    },
    PaymentStatus.PAID.value: {
        PaymentStatus.RECONCILED.value,
        PaymentStatus.REFUNDED.value,
        PaymentStatus.REVERSED.value,
    },
    PaymentStatus.FAILED.value: {
        PaymentStatus.PROCESSING.value,
        PaymentStatus.INTENT_CREATED.value,
    },
    PaymentStatus.RECONCILED.value: {
        PaymentStatus.REFUNDED.value,
        PaymentStatus.REVERSED.value,
    },
    PaymentStatus.REFUNDED.value: set(),
    PaymentStatus.REVERSED.value: set(),
}

TABLES = {
    "proposal": PROPOSAL,
    "milestone": MILESTONE,
    "offer": OFFER,
    "payment": PAYMENT,
}


def can(kind: str, current: str, target: str) -> bool:
    table = TABLES.get(kind)
    if table is None:
        raise ValueError(f"Unknown transition kind: {kind}")
    return target in table.get(current, set())


def ensure(kind: str, current: str, target: str) -> None:
    if current == target:
        return
    if not can(kind, current, target):
        raise Conflict(
            f"Illegal {kind} transition: {current} → {target}",
            code="ILLEGAL_TRANSITION",
            details={"kind": kind, "from": current, "to": target},
        )
