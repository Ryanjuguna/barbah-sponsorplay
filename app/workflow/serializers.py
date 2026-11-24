"""Row → API model conversion.

Keeping this in one place means the wire contract is defined once. If a field
name changes, it changes here.
"""

from typing import Any, Dict, List, Optional

from app.workflow import store
from app.workflow.enums import family_for
from app.workflow.money import from_minor


def _f(minor: int, currency: str) -> float:
    return from_minor(int(minor or 0), currency or "USD")


def creator_out(row: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not row:
        return None
    return {
        "id": row["id"],
        "name": row["name"],
        "gamer_tag": row.get("gamer_tag"),
        "type": row.get("type"),
        "primary_game": row.get("primary_game"),
        "platform": row.get("platform"),
        "channel_url": row.get("channel_url"),
        "location": row.get("location"),
        "monthly_reach": int(row.get("monthly_reach") or 0),
        "base_rate_minor": int(row.get("base_rate_minor") or 0),
        "base_rate": _f(row.get("base_rate_minor") or 0, row.get("currency") or "USD"),
        "currency": row.get("currency") or "USD",
        "brand_safety_score": float(row.get("brand_safety_score") or 0),
        "channel_verified": bool(row.get("channel_verified")),
        "tax_profile_status": row.get("tax_profile_status") or "UNVERIFIED",
    }


def campaign_out(row: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not row:
        return None
    currency = row.get("currency") or "USD"
    return {
        "id": row["id"],
        "org_id": row["org_id"],
        "brand_name": row["brand_name"],
        "brief": row.get("brief_text") or "",
        "target_audience": row.get("target_audience"),
        "objective": row.get("objective"),
        "kpi": row.get("kpi"),
        "geography": row.get("geography"),
        "budget_minor": int(row.get("budget_minor") or 0),
        "budget": _f(row.get("budget_minor") or 0, currency),
        "currency": currency,
        "status": row.get("status") or "DRAFT",
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def milestone_out(row: Dict[str, Any]) -> Dict[str, Any]:
    currency = row.get("currency") or "USD"
    return {
        "id": row["id"],
        "proposal_id": row["proposal_id"],
        "seq": int(row["seq"]),
        "title": row["title"],
        "description": row.get("description"),
        "amount_minor": int(row.get("amount_minor") or 0),
        "amount": _f(row.get("amount_minor") or 0, currency),
        "currency": currency,
        "due_at": row.get("due_at"),
        "evidence_requirements": store.loads(row.get("evidence_requirements_json"), []),
        "acceptance_criteria": store.loads(row.get("acceptance_criteria_json"), []),
        "review_sla_hours": int(row.get("review_sla_hours") or 48),
        "revision_window_hours": int(row.get("revision_window_hours") or 72),
        "status": row.get("status") or "DRAFT",
        "status_family": family_for(row.get("status") or "DRAFT").value,
    }


def offer_out(
    row: Dict[str, Any],
    creator: Optional[Dict[str, Any]] = None,
    magic_link: Optional[str] = None,
) -> Dict[str, Any]:
    currency = row.get("currency") or "USD"
    return {
        "id": row["id"],
        "proposal_id": row["proposal_id"],
        "creator_id": row["creator_id"],
        "creator": creator_out(creator) if creator else None,
        "allocation_minor": int(row.get("allocation_minor") or 0),
        "allocation": _f(row.get("allocation_minor") or 0, currency),
        "currency": currency,
        "status": row.get("status") or "INVITED",
        "status_family": family_for(row.get("status") or "INVITED").value,
        "sent_at": row.get("sent_at"),
        "viewed_at": row.get("viewed_at"),
        "accepted_at": row.get("accepted_at"),
        "declined_at": row.get("declined_at"),
        "decline_reason": row.get("decline_reason"),
        "token_expires_at": row.get("token_expires_at"),
        "magic_link": magic_link,
    }


def _offer_links(proposal_id: str) -> Dict[str, str]:
    """Demo-only: recover the emailed magic link for each offer.

    The offer token itself stays hashed. The link lives in the notification
    record because that is the email that was "sent" — the same place a real
    mail provider would hold it.
    """
    links: Dict[str, str] = {}
    for notification in store.find("notifications", {"ref_type": "proposal", "ref_id": proposal_id}):
        if notification.get("channel") != "email":
            continue
        payload = store.loads(notification.get("body"), {}) or {}
        offer_id = payload.get("offer_id")
        link = payload.get("link")
        if offer_id and link:
            links[offer_id] = link
    return links


def proposal_out(
    row: Dict[str, Any],
    *,
    include_offers: bool = True,
    include_links: bool = False,
) -> Dict[str, Any]:
    currency = row.get("currency") or "USD"
    campaign = store.get("campaigns", row["campaign_id"])
    milestones = [
        milestone_out(m)
        for m in store.find("milestones", {"proposal_id": row["id"]}, order_by="seq ASC")
    ]
    offers: List[Dict[str, Any]] = []
    if include_offers:
        links = _offer_links(row["id"]) if include_links else {}
        for offer in store.find("offers", {"proposal_id": row["id"]}, order_by="created_at ASC"):
            offers.append(
                offer_out(
                    offer,
                    creator=store.get("creators", offer["creator_id"]),
                    magic_link=links.get(offer["id"]),
                )
            )
    return {
        "id": row["id"],
        "campaign_id": row["campaign_id"],
        "org_id": row["org_id"],
        "brand_name": campaign["brand_name"] if campaign else None,
        "syndicate_id": row.get("syndicate_id"),
        "version": int(row.get("version") or 1),
        "status": row.get("status") or "DRAFT",
        "status_family": family_for(row.get("status") or "DRAFT").value,
        "total_minor": int(row.get("total_minor") or 0),
        "total": _f(row.get("total_minor") or 0, currency),
        "currency": currency,
        "fx_rate": float(row.get("fx_rate") or 130.0),
        "platform_fee_minor": int(row.get("platform_fee_minor") or 0),
        "platform_fee": _f(row.get("platform_fee_minor") or 0, currency),
        "creator_pool_minor": int(row.get("creator_pool_minor") or 0),
        "creator_pool": _f(row.get("creator_pool_minor") or 0, currency),
        "withholding_minor": int(row.get("withholding_minor") or 0),
        "withholding": _f(row.get("withholding_minor") or 0, currency),
        "net_creator_minor": int(row.get("net_creator_minor") or 0),
        "net_creator": _f(row.get("net_creator_minor") or 0, currency),
        "legal_clauses": store.loads(row.get("legal_clauses_json"), []),
        "created_by": row.get("created_by"),
        "approved_by": row.get("approved_by"),
        "approved_at": row.get("approved_at"),
        "sent_at": row.get("sent_at"),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "milestones": milestones,
        "offers": offers,
    }


def syndicate_out(row: Dict[str, Any]) -> Dict[str, Any]:
    members = []
    for member in store.find("syndicate_members", {"syndicate_id": row["id"]}):
        members.append(
            {
                "creator": creator_out(store.get("creators", member["creator_id"])),
                "role_in_syndicate": member.get("role_in_syndicate"),
                "allocation_pct": float(member.get("allocation_pct") or 0),
            }
        )
    return {
        "id": row["id"],
        "campaign_id": row["campaign_id"],
        "title": row["title"],
        "rationale": row.get("rationale"),
        "expected_reach": int(row.get("expected_reach") or 0),
        "status": row.get("status") or "DRAFT",
        "members": members,
    }


def evidence_out(row: Dict[str, Any]) -> Dict[str, Any]:
    meta = store.loads(row.get("metadata_json"), {}) or {}
    return {
        "id": row["id"],
        "milestone_id": row["milestone_id"],
        "offer_id": row.get("offer_id"),
        "requirement_key": meta.get("requirement_key"),
        "kind": row["kind"],
        "label": row.get("label"),
        "original_filename": row.get("original_filename"),
        "content_type": row.get("content_type"),
        "size_bytes": int(row.get("size_bytes") or 0),
        "sha256": row.get("sha256"),
        "url": f"/api/v1/workflow/evidence/{row['id']}/file" if row.get("storage_key") else None,
        "external_url": meta.get("url"),
        "metadata": meta,
        "captured_at": row.get("captured_at"),
        "submitted_at": row.get("submitted_at"),
        "created_at": row["created_at"],
    }


def report_out(row: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not row:
        return None
    return {
        "id": row["id"],
        "milestone_id": row["milestone_id"],
        "agent_version": row.get("agent_version"),
        "model": row.get("model"),
        "started_at": row.get("started_at"),
        "completed_at": row.get("completed_at"),
        "checks": store.loads(row.get("checks_json"), []),
        "metrics": store.loads(row.get("metrics_json"), {}),
        "limitations": store.loads(row.get("limitations_json"), []),
        "recommended_decision": row.get("recommended_decision"),
        "summary": row.get("summary"),
        "created_at": row["created_at"],
    }


def decision_out(row: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if not row:
        return None
    return {
        "id": row["id"],
        "milestone_id": row["milestone_id"],
        "reviewer_id": row["reviewer_id"],
        "decision": row["decision"],
        "reason": row.get("reason"),
        "overrode_recommendation": bool(row.get("overrode_recommendation")),
        "decided_at": row["decided_at"],
    }


def ledger_out(row: Dict[str, Any]) -> Dict[str, Any]:
    currency = row.get("currency") or "USD"
    return {
        "id": row["id"],
        "account": row["account"],
        "direction": row["direction"],
        "amount_minor": int(row["amount_minor"]),
        "amount": _f(row["amount_minor"], currency),
        "currency": currency,
        "ref_type": row.get("ref_type"),
        "ref_id": row.get("ref_id"),
        "description": row.get("description"),
        "created_at": row["created_at"],
    }


def invoice_out(row: Dict[str, Any]) -> Dict[str, Any]:
    currency = row.get("currency") or "USD"
    return {
        "id": row["id"],
        "milestone_id": row.get("milestone_id"),
        "proposal_id": row.get("proposal_id"),
        "invoice_type": row["invoice_type"],
        "amount_minor": int(row["amount_minor"]),
        "amount": _f(row["amount_minor"], currency),
        "tax_minor": int(row.get("tax_minor") or 0),
        "tax": _f(row.get("tax_minor") or 0, currency),
        "currency": currency,
        "status": row["status"],
        "etims_ref": row.get("etims_ref"),
        "issued_at": row["issued_at"],
    }


def audit_out(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "actor_id": row.get("actor_id"),
        "actor_role": row.get("actor_role"),
        "action": row["action"],
        "entity_type": row["entity_type"],
        "entity_id": row["entity_id"],
        "before": store.loads(row.get("before_json"), None),
        "after": store.loads(row.get("after_json"), None),
        "created_at": row["created_at"],
    }
