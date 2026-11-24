"""Evidence upload, submission and the verification report.

The report is advisory. It records what was checked, what was found, what
could not be established, and what it recommends — never a verdict.
"""

import hashlib
import io
import os
from typing import Any, Dict, List, Optional, Tuple

from app.workflow import audit, store, transitions
from app.workflow.auth import Principal
from app.workflow.enums import CheckResult, MilestoneStatus, OfferStatus, ReviewDecisionType
from app.workflow.errors import Conflict, Forbidden, NotFound, ValidationFailed
from app.workflow.security import new_id
from app.workflow.serializers import (
    campaign_out,
    creator_out,
    decision_out,
    evidence_out,
    milestone_out,
    proposal_out,
    report_out,
)

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
EVIDENCE_DIR = os.environ.get("EVIDENCE_DIR", os.path.join(ROOT, "data", "evidence"))
AGENT_VERSION = "3.0.0-report-only"

IMAGE_TYPES = {"image/png", "image/jpeg", "image/jpg", "image/webp"}
MAX_BYTES = 25 * 1024 * 1024


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

def _creator_offer(proposal_id: str, creator_id: str) -> Dict[str, Any]:
    offer = store.find_one("offers", {"proposal_id": proposal_id, "creator_id": creator_id})
    if not offer:
        raise Forbidden("You do not have an offer on this campaign.", code="OFFER_FORBIDDEN")
    return offer


def _milestone_for_creator(milestone_id: str, principal: Principal) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    milestone = store.get("milestones", milestone_id)
    if not milestone:
        raise NotFound("Milestone not found.", code="MILESTONE_NOT_FOUND")
    if principal.role != "CREATOR" or not principal.creator_id:
        raise Forbidden("Creator access only.", code="CREATOR_ONLY")
    offer = _creator_offer(milestone["proposal_id"], principal.creator_id)
    if offer["status"] not in (
        OfferStatus.ACCEPTED.value,
        OfferStatus.ACTIVE.value,
        OfferStatus.COMPLETED.value,
    ):
        raise Forbidden("Accept the offer before submitting evidence.", code="OFFER_NOT_ACCEPTED")
    return milestone, offer


def _requirements(milestone: Dict[str, Any]) -> List[Dict[str, Any]]:
    return store.loads(milestone.get("evidence_requirements_json"), []) or []


# A milestone belongs to the proposal, but each creator on the proposal
# fulfils it separately. Its status is therefore an aggregate: one creator's
# submission must not close the milestone for everyone else.
PARTICIPATING = (
    OfferStatus.ACCEPTED.value,
    OfferStatus.ACTIVE.value,
    OfferStatus.COMPLETED.value,
)

TERMINAL_STATUSES = (
    MilestoneStatus.INVOICED.value,
    MilestoneStatus.PAID.value,
    MilestoneStatus.CLOSED.value,
    MilestoneStatus.REJECTED.value,
    MilestoneStatus.CANCELLED.value,
)


def participating_offers(proposal_id: str) -> List[Dict[str, Any]]:
    return [
        offer
        for offer in store.find("offers", {"proposal_id": proposal_id})
        if offer["status"] in PARTICIPATING
    ]


def latest_decisions(milestone_id: str) -> Dict[str, Dict[str, Any]]:
    rows = store.find(
        "review_decisions", {"milestone_id": milestone_id}, order_by="decided_at ASC"
    )
    return {row["offer_id"]: row for row in rows}


def last_submission_at(milestone_id: str, offer_id: str) -> Optional[str]:
    stamps = [
        row.get("submitted_at")
        for row in _evidence_for(milestone_id, offer_id)
        if row.get("submitted_at")
    ]
    return max(stamps) if stamps else None


def has_pending_submission(milestone_id: str, offer_id: str) -> bool:
    """True when this creator has submitted evidence that has not been reviewed yet."""
    submitted = last_submission_at(milestone_id, offer_id)
    if not submitted:
        return False
    decision = latest_decisions(milestone_id).get(offer_id)
    return not decision or submitted > decision["decided_at"]


def refresh_status(milestone_id: str) -> str:
    """Recompute the milestone status from every participating creator's state.

    Approval only lands when all participants are approved; a single creator's
    revision request reopens the milestone for that creator without discarding
    the decisions already recorded for the others.
    """
    milestone = store.get("milestones", milestone_id)
    if not milestone:
        raise NotFound("Milestone not found.", code="MILESTONE_NOT_FOUND")

    current = milestone["status"]
    if current in TERMINAL_STATUSES:
        return current

    offers = participating_offers(milestone["proposal_id"])
    if not offers:
        return current

    decisions = latest_decisions(milestone_id)
    pending = {o["id"]: has_pending_submission(milestone_id, o["id"]) for o in offers}
    outcome = {
        offer["id"]: (decisions.get(offer["id"]) or {}).get("decision") for offer in offers
    }

    all_approved = all(value == ReviewDecisionType.APPROVE.value for value in outcome.values())
    all_decided = all(value is not None for value in outcome.values())

    if all_approved and not any(pending.values()):
        target = MilestoneStatus.APPROVED.value
    elif any(pending.values()):
        resolved = all(pending[o["id"]] or outcome[o["id"]] == ReviewDecisionType.APPROVE.value for o in offers)
        target = MilestoneStatus.AI_REVIEWED.value if resolved else MilestoneStatus.EVIDENCE_SUBMITTED.value
    elif all_decided and any(
        value == ReviewDecisionType.REQUEST_CHANGES.value for value in outcome.values()
    ):
        target = MilestoneStatus.REVISION_REQUESTED.value
    elif all_decided and all(value == ReviewDecisionType.REJECTED.value for value in outcome.values()):
        target = MilestoneStatus.REJECTED.value
    else:
        target = current

    if target == current:
        return current
    if not transitions.can("milestone", current, target):
        return current

    store.update("milestones", milestone_id, {"status": target, "updated_at": store.utcnow()})
    audit.record(
        actor_id=None,
        actor_role="SYSTEM",
        action="milestone.status_changed",
        entity_type="milestone",
        entity_id=milestone_id,
        before={"status": current},
        after={"status": target},
    )
    return target


def _evidence_for(milestone_id: str, offer_id: str) -> List[Dict[str, Any]]:
    return store.find("evidence", {"milestone_id": milestone_id, "offer_id": offer_id})


def _meta(row: Dict[str, Any]) -> Dict[str, Any]:
    return store.loads(row.get("metadata_json"), {}) or {}


def save_upload(data: bytes, filename: str, content_type: str) -> Tuple[str, str, int]:
    if len(data) > MAX_BYTES:
        raise ValidationFailed("File is larger than 25 MB.", field="file")
    os.makedirs(EVIDENCE_DIR, exist_ok=True)
    digest = hashlib.sha256(data).hexdigest()
    extension = os.path.splitext(filename or "")[1][:10] or ".bin"
    key = f"{digest[:16]}{extension}"
    path = os.path.join(EVIDENCE_DIR, key)
    if not os.path.exists(path):
        with open(path, "wb") as fh:
            fh.write(data)
    return key, digest, len(data)


def _image_dimensions(data: bytes) -> Optional[Tuple[int, int]]:
    try:
        from PIL import Image

        with Image.open(io.BytesIO(data)) as image:
            return image.size
    except Exception:
        return None


# --------------------------------------------------------------------------
# Add evidence
# --------------------------------------------------------------------------

def add_evidence(
    *,
    milestone_id: str,
    principal: Principal,
    requirement_key: str,
    kind: str,
    label: Optional[str] = None,
    filename: Optional[str] = None,
    content_type: Optional[str] = None,
    data: Optional[bytes] = None,
    url: Optional[str] = None,
) -> Dict[str, Any]:
    milestone, offer = _milestone_for_creator(milestone_id, principal)
    if milestone["status"] in TERMINAL_STATUSES:
        raise Conflict(
            f"This milestone is {milestone['status']} and is not accepting evidence.",
            code="MILESTONE_NOT_OPEN",
        )
    if has_pending_submission(milestone_id, offer["id"]):
        raise Conflict(
            "Your evidence is already awaiting review. Wait for the decision before adding more.",
            code="ALREADY_SUBMITTED",
        )

    requirement = next(
        (r for r in _requirements(milestone) if r.get("key") == requirement_key), None
    )
    if not requirement:
        raise ValidationFailed(
            "Unknown evidence requirement for this milestone.", field="requirement_key"
        )

    now = store.utcnow()
    storage_key = None
    digest = None
    size = 0
    meta: Dict[str, Any] = {"requirement_key": requirement_key}

    if requirement.get("kind") == "URL":
        if not url or not str(url).startswith(("http://", "https://")):
            raise ValidationFailed("Provide a full http(s) link.", field="url")
        hosts = requirement.get("accepted_hosts") or []
        if hosts and not any(host in url for host in hosts):
            raise ValidationFailed(
                f"Link must be on one of: {', '.join(hosts)}", field="url"
            )
        meta["url"] = url
        kind = "URL"
    else:
        if not data:
            raise ValidationFailed("Upload a file for this requirement.", field="file")
        if content_type and requirement.get("accepted_types"):
            if content_type not in requirement["accepted_types"]:
                raise ValidationFailed(
                    f"Accepted types: {', '.join(requirement['accepted_types'])}",
                    field="file",
                )
        if content_type in IMAGE_TYPES or requirement.get("kind") == "IMAGE":
            dimensions = _image_dimensions(data)
            if dimensions is None:
                raise ValidationFailed("That image could not be read.", field="file")
            meta["width"], meta["height"] = dimensions
            min_width = requirement.get("min_width")
            if min_width and dimensions[0] < int(min_width):
                raise ValidationFailed(
                    f"Image must be at least {min_width}px wide.", field="file"
                )
        storage_key, digest, size = save_upload(data, filename or "evidence.bin", content_type or "")

    row = {
        "id": new_id("ev"),
        "milestone_id": milestone_id,
        "offer_id": offer["id"],
        "uploaded_by": principal.user_id,
        "kind": kind,
        "label": label or requirement.get("label"),
        "original_filename": filename,
        "content_type": content_type,
        "size_bytes": size,
        "sha256": digest,
        "storage_key": storage_key,
        "captured_at": None,
        "submitted_at": None,
        "metadata_json": store.dumps(meta),
        "created_at": now,
    }
    store.insert("evidence", row)
    audit.record(
        actor_id=principal.user_id,
        actor_role=principal.role,
        action="evidence.added",
        entity_type="milestone",
        entity_id=milestone_id,
        after={"evidence_id": row["id"], "requirement_key": requirement_key, "sha256": digest},
    )
    return evidence_out(row)


def delete_evidence(evidence_id: str, principal: Principal) -> None:
    row = store.get("evidence", evidence_id)
    if not row:
        raise NotFound("Evidence not found.", code="EVIDENCE_NOT_FOUND")
    milestone, offer = _milestone_for_creator(row["milestone_id"], principal)
    if row["offer_id"] != offer["id"]:
        raise Forbidden("You cannot delete this evidence.", code="EVIDENCE_FORBIDDEN")
    if row.get("submitted_at"):
        raise Conflict("Submitted evidence cannot be deleted.", code="EVIDENCE_LOCKED")
    store.execute("DELETE FROM evidence WHERE id = ?", (evidence_id,))
    audit.record(
        actor_id=principal.user_id,
        actor_role=principal.role,
        action="evidence.deleted",
        entity_type="milestone",
        entity_id=row["milestone_id"],
        before={"evidence_id": evidence_id},
    )


# --------------------------------------------------------------------------
# Validation of the evidence set
# --------------------------------------------------------------------------

def validate_evidence_set(milestone: Dict[str, Any], offer_id: str) -> List[Dict[str, Any]]:
    issues: List[Dict[str, Any]] = []
    evidence = _evidence_for(milestone["id"], offer_id)
    for requirement in _requirements(milestone):
        key = requirement.get("key")
        matches = [e for e in evidence if _meta(e).get("requirement_key") == key]
        required = bool(requirement.get("required", True))
        minimum = int(requirement.get("min_count") or 1)
        if required and len(matches) < minimum:
            issues.append(
                {
                    "severity": "BLOCKING",
                    "code": "MISSING_EVIDENCE",
                    "message": (
                        f"{requirement.get('label') or key}: "
                        f"{len(matches)} of {minimum} required."
                    ),
                    "field": key,
                }
            )
    return issues


# --------------------------------------------------------------------------
# Submit + verify
# --------------------------------------------------------------------------

def submit(milestone_id: str, principal: Principal) -> Dict[str, Any]:
    milestone, offer = _milestone_for_creator(milestone_id, principal)
    if milestone["status"] in TERMINAL_STATUSES:
        raise Conflict(
            f"This milestone is {milestone['status']} and is not accepting a submission.",
            code="MILESTONE_NOT_OPEN",
        )
    if has_pending_submission(milestone_id, offer["id"]):
        raise Conflict(
            "This submission is already awaiting review.", code="ALREADY_SUBMITTED"
        )
    issues = validate_evidence_set(milestone, offer["id"])
    if issues:
        raise ValidationFailed(
            "Some required evidence is missing.",
            code="EVIDENCE_INCOMPLETE",
            details={"issues": issues},
        )

    now = store.utcnow()
    current = milestone["status"]
    if current != MilestoneStatus.EVIDENCE_SUBMITTED.value:
        transitions.ensure("milestone", current, MilestoneStatus.EVIDENCE_SUBMITTED.value)
    store.update("milestones", milestone_id, {"status": MilestoneStatus.EVIDENCE_SUBMITTED.value, "updated_at": now})
    store.execute(
        "UPDATE evidence SET submitted_at = ? WHERE milestone_id = ? AND offer_id = ?",
        (now, milestone_id, offer["id"]),
    )

    report = run_verification(milestone_id, offer["id"])
    refresh_status(milestone_id)

    audit.record(
        actor_id=principal.user_id,
        actor_role=principal.role,
        action="milestone.submitted",
        entity_type="milestone",
        entity_id=milestone_id,
        after={"offer_id": offer["id"], "report_id": report["id"]},
    )
    return case_for(milestone_id, offer["id"])


def run_verification(milestone_id: str, offer_id: str) -> Dict[str, Any]:
    milestone = store.get("milestones", milestone_id)
    if not milestone:
        raise NotFound("Milestone not found.", code="MILESTONE_NOT_FOUND")

    evidence = _evidence_for(milestone_id, offer_id)
    requirements = _requirements(milestone)
    checks: List[Dict[str, Any]] = []
    measured: Dict[str, Any] = {"evidence_items": len(evidence)}
    unavailable: List[str] = []

    for requirement in requirements:
        key = requirement.get("key")
        label = requirement.get("label") or key
        matches = [e for e in evidence if _meta(e).get("requirement_key") == key]
        minimum = int(requirement.get("min_count") or 1)

        if len(matches) < minimum:
            checks.append(
                {
                    "key": f"{key}_present",
                    "label": f"{label} provided",
                    "required": bool(requirement.get("required", True)),
                    "result": CheckResult.FAIL.value,
                    "confidence": 1.0,
                    "method": "system",
                    "detail": f"{len(matches)} of {minimum} provided.",
                    "artifacts": [],
                }
            )
            continue

        checks.append(
            {
                "key": f"{key}_present",
                "label": f"{label} provided",
                "required": bool(requirement.get("required", True)),
                "result": CheckResult.PASS.value,
                "confidence": 1.0,
                "method": "system",
                "detail": f"{len(matches)} item(s) received.",
                "artifacts": [],
            }
        )

        if requirement.get("kind") == "IMAGE":
            readable = all(_meta(e).get("width") for e in matches)
            checks.append(
                {
                    "key": f"{key}_readable",
                    "label": f"{label} readable",
                    "required": True,
                    "result": CheckResult.PASS.value if readable else CheckResult.FAIL.value,
                    "confidence": 1.0 if readable else 0.9,
                    "method": "image-metadata",
                    "detail": (
                        "Images decoded and dimensions recorded."
                        if readable
                        else "One or more images could not be decoded."
                    ),
                    "artifacts": [
                        {"kind": "evidence", "url": f"/api/v1/workflow/evidence/{e['id']}/file"}
                        for e in matches
                    ],
                }
            )
            checks.append(
                {
                    "key": f"{key}_brand_visibility",
                    "label": "Brand visible in the image",
                    "required": True,
                    "result": CheckResult.INCONCLUSIVE.value,
                    "confidence": 0.0,
                    "method": "none",
                    "detail": (
                        "No vision model is configured, so brand visibility was not assessed. "
                        "A human reviewer must look at the image."
                    ),
                    "artifacts": [],
                }
            )
            unavailable.append("brand_visibility")

        if requirement.get("kind") == "URL":
            checks.append(
                {
                    "key": f"{key}_link",
                    "label": f"{label} accepted",
                    "required": True,
                    "result": CheckResult.PASS.value,
                    "confidence": 0.9,
                    "method": "host-allowlist",
                    "detail": "Link host is on the accepted list. Reachability was not fetched.",
                    "artifacts": [
                        {"kind": "link", "url": _meta(e).get("url")} for e in matches
                    ],
                }
            )
            checks.append(
                {
                    "key": f"{key}_reachable",
                    "label": "Link reachable and public",
                    "required": False,
                    "result": CheckResult.INCONCLUSIVE.value,
                    "confidence": 0.0,
                    "method": "none",
                    "detail": "Links are not fetched automatically in this environment.",
                    "artifacts": [],
                }
            )
            unavailable.append("link_reachability")

    if any(r.get("key") in ("stream_vod_url",) for r in requirements):
        checks.append(
            {
                "key": "airtime",
                "label": "Broadcast airtime",
                "required": True,
                "result": CheckResult.INCONCLUSIVE.value,
                "confidence": 0.0,
                "method": "none",
                "detail": (
                    "Airtime cannot be proven from a link or screenshots alone. "
                    "Use a VOD with timestamps or a platform analytics export."
                ),
                "artifacts": [],
            }
        )
        unavailable.append("airtime")

    required_checks = [c for c in checks if c["required"]]
    if any(c["result"] == CheckResult.FAIL.value for c in required_checks):
        recommended = "REQUEST_CHANGES"
    elif any(c["result"] == CheckResult.INCONCLUSIVE.value for c in required_checks):
        recommended = "HUMAN_REVIEW"
    else:
        recommended = "APPROVE"

    limitations = [
        "This report is advisory. A human reviewer makes the approval decision.",
        "Evidence hashes prove the file received, not that the event happened.",
    ]
    if unavailable:
        limitations.append(f"Could not assess: {', '.join(sorted(set(unavailable)))}.")

    summary = {
        "APPROVE": "All required evidence was received and passed the automated checks.",
        "REQUEST_CHANGES": "Some required evidence is missing or unreadable.",
        "HUMAN_REVIEW": "Evidence was received, but one or more checks need a human eye.",
    }[recommended]

    now = store.utcnow()
    row = {
        "id": new_id("vr"),
        "milestone_id": milestone_id,
        "offer_id": offer_id,
        "agent_version": AGENT_VERSION,
        "model": "heuristic-fallback",
        "started_at": now,
        "completed_at": now,
        "checks_json": store.dumps(checks),
        "metrics_json": store.dumps(
            {"measured": measured, "estimated": {}, "unavailable": sorted(set(unavailable))}
        ),
        "limitations_json": store.dumps(limitations),
        "recommended_decision": recommended,
        "summary": summary,
        "evidence_refs_json": store.dumps([e["id"] for e in evidence]),
        "created_at": now,
    }
    store.insert("verification_reports", row)
    audit.record(
        actor_id=None,
        actor_role="AGENT",
        action="verification.report_created",
        entity_type="milestone",
        entity_id=milestone_id,
        after={"report_id": row["id"], "recommended": recommended},
    )
    return report_out(row)


# --------------------------------------------------------------------------
# Case view (shared with ops review)
# --------------------------------------------------------------------------

def case_for(milestone_id: str, offer_id: str) -> Dict[str, Any]:
    milestone = store.get("milestones", milestone_id)
    if not milestone:
        raise NotFound("Milestone not found.", code="MILESTONE_NOT_FOUND")
    offer = store.get("offers", offer_id)
    proposal = store.get("proposals", milestone["proposal_id"])
    creator = store.get("creators", offer["creator_id"]) if offer else None

    report = store.find(
        "verification_reports",
        {"milestone_id": milestone_id, "offer_id": offer_id},
        order_by="created_at DESC",
        limit=1,
    )
    decision = store.find(
        "review_decisions",
        {"milestone_id": milestone_id, "offer_id": offer_id},
        order_by="decided_at DESC",
        limit=1,
    )
    return {
        "offer_id": offer_id,
        "milestone": milestone_out(milestone),
        "proposal": proposal_out(proposal, include_offers=False),
        "campaign": campaign_out(store.get("campaigns", proposal["campaign_id"])),
        "creator": creator_out(creator),
        "evidence": [evidence_out(e) for e in _evidence_for(milestone_id, offer_id)],
        "report": report_out(report[0]) if report else None,
        "decision": decision_out(decision[0]) if decision else None,
        "age_hours": 0,
        "sla_breached": False,
    }


def evidence_path(evidence_id: str) -> Tuple[str, str, str]:
    row = store.get("evidence", evidence_id)
    if not row or not row.get("storage_key"):
        raise NotFound("Evidence file not found.", code="EVIDENCE_NOT_FOUND")
    path = os.path.join(EVIDENCE_DIR, row["storage_key"])
    if not os.path.exists(path):
        raise NotFound("Evidence file is missing from storage.", code="EVIDENCE_FILE_MISSING")
    return path, row.get("content_type") or "application/octet-stream", row.get("original_filename") or "evidence"
