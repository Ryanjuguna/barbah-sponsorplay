"""Ops review queue and the human decision.

This is the screen that makes the product honest: evidence, the agent's
report, and a named human decision, in that order.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.workflow import audit, evidence_service, payment_service, store
from app.workflow.auth import Principal
from app.workflow.enums import MilestoneStatus, ReviewDecisionType
from app.workflow.errors import Conflict, Forbidden, NotFound, ValidationFailed
from app.workflow.security import new_id
from app.workflow.serializers import decision_out, evidence_out, milestone_out, report_out


def _age_hours(milestone: Dict[str, Any]) -> float:
    stamp = milestone.get("updated_at") or milestone.get("created_at")
    try:
        started = datetime.fromisoformat(stamp)
    except (TypeError, ValueError):
        return 0.0
    delta = datetime.now(timezone.utc) - started
    return round(delta.total_seconds() / 3600.0, 1)


def queue(principal: Principal) -> List[Dict[str, Any]]:
    if not principal.is_ops:
        raise Forbidden("Ops access only.", code="OPS_ONLY")

    items: List[Dict[str, Any]] = []
    milestones = store.find(
        "milestones", order_by="updated_at ASC"
    )
    for milestone in milestones:
        if milestone["status"] in evidence_service.TERMINAL_STATUSES:
            continue
        for offer in evidence_service.participating_offers(milestone["proposal_id"]):
            # Only a submission that no decision covers yet belongs in the queue.
            if not evidence_service.has_pending_submission(milestone["id"], offer["id"]):
                continue
            case = evidence_service.case_for(milestone["id"], offer["id"])
            age = _age_hours(milestone)
            case["age_hours"] = age
            case["sla_breached"] = age > int(milestone.get("review_sla_hours") or 48)
            items.append(case)
    return items


def case(milestone_id: str, offer_id: str, principal: Principal) -> Dict[str, Any]:
    if not principal.is_ops:
        raise Forbidden("Ops access only.", code="OPS_ONLY")
    result = evidence_service.case_for(milestone_id, offer_id)
    age = _age_hours(result["milestone"])
    result["age_hours"] = age
    result["sla_breached"] = age > int(result["milestone"].get("review_sla_hours") or 48)
    return result


def decide(
    milestone_id: str,
    offer_id: str,
    principal: Principal,
    decision: str,
    reason: Optional[str],
) -> Dict[str, Any]:
    if not principal.is_ops:
        raise Forbidden("Ops access only.", code="OPS_ONLY")
    if decision not in {d.value for d in ReviewDecisionType}:
        raise ValidationFailed("Unknown decision.", field="decision")

    milestone = store.get("milestones", milestone_id)
    if not milestone:
        raise NotFound("Milestone not found.", code="MILESTONE_NOT_FOUND")
    offer = store.get("offers", offer_id)
    if not offer or offer["proposal_id"] != milestone["proposal_id"]:
        raise NotFound("Offer not found.", code="OFFER_NOT_FOUND")

    if not evidence_service.has_pending_submission(milestone_id, offer_id):
        raise Conflict(
            "There is no submission from this creator awaiting review.",
            code="NOTHING_TO_REVIEW",
        )

    if milestone["status"] == MilestoneStatus.EVIDENCE_SUBMITTED.value:
        evidence_service.run_verification(milestone_id, offer_id)
        milestone = store.get("milestones", milestone_id)

    report = store.find(
        "verification_reports",
        {"milestone_id": milestone_id, "offer_id": offer_id},
        order_by="created_at DESC",
        limit=1,
    )
    recommended = report[0]["recommended_decision"] if report else None

    overrode = bool(recommended and recommended != decision)
    if overrode and not reason:
        raise ValidationFailed(
            "A reason is required when you override the agent's recommendation.",
            code="REASON_REQUIRED",
            details={"recommended": recommended, "decision": decision},
        )

    now = store.utcnow()
    row = {
        "id": new_id("rd"),
        "milestone_id": milestone_id,
        "offer_id": offer_id,
        "reviewer_id": principal.user_id,
        "decision": decision,
        "reason": reason,
        "overrode_recommendation": 1 if overrode else 0,
        "decided_at": now,
    }
    store.insert("review_decisions", row)

    # The milestone spans every creator on the proposal, so the decision only
    # moves it once the aggregate agrees (all approved, or all revisions in).
    status_after = evidence_service.refresh_status(milestone_id)

    if decision == ReviewDecisionType.APPROVE.value:
        payment = payment_service.settle_milestone(milestone_id, offer_id, principal.user_id)
        audit.record(
            actor_id=principal.user_id,
            actor_role=principal.role,
            action="review.approved",
            entity_type="milestone",
            entity_id=milestone_id,
            after={"offer_id": offer_id, "payout_id": payment["id"], "reason": reason},
        )
        result = case(milestone_id, offer_id, principal)
        result["payout"] = payment
        return result

    audit.record(
        actor_id=principal.user_id,
        actor_role=principal.role,
        action=f"review.{decision.lower()}",
        entity_type="milestone",
        entity_id=milestone_id,
        after={"offer_id": offer_id, "reason": reason, "status": status_after},
    )
    return case(milestone_id, offer_id, principal)


def rerun_verification(milestone_id: str, offer_id: str, principal: Principal) -> Dict[str, Any]:
    if not principal.is_ops:
        raise Forbidden("Ops access only.", code="OPS_ONLY")
    report = evidence_service.run_verification(milestone_id, offer_id)
    return report


def all_campaigns(principal: Principal) -> List[Dict[str, Any]]:
    if not principal.is_ops:
        raise Forbidden("Ops access only.", code="OPS_ONLY")
    from app.workflow.serializers import campaign_out

    return [campaign_out(c) for c in store.find("campaigns", order_by="created_at DESC")]
