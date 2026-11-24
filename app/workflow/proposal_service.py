"""Proposal drafting, editing, validation, approval and sending.

The critical guarantee of this module: **creating a draft never sends an
email**. Sending is a separate, explicit, role-guarded action.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List, Optional

from app.config import settings
from app.workflow import audit, store, transitions
from app.workflow.auth import Principal
from app.workflow.campaign_service import get_campaign_row
from app.workflow.email_templates import offer_link, render_offer_email
from app.workflow.enums import OfferStatus, ProposalStatus
from app.workflow.errors import Conflict, Forbidden, NotFound, ValidationFailed
from app.workflow.money import allocate, split_from_pool, split_gross, to_minor
from app.workflow.security import hash_token, new_id, new_token
from app.workflow.serializers import proposal_out
from app.workflow.templates import default_legal_clauses, default_milestones

OFFER_TTL_DAYS = 14


# --------------------------------------------------------------------------
# Access
# --------------------------------------------------------------------------

def get_proposal_row(proposal_id: str) -> Dict[str, Any]:
    row = store.get("proposals", proposal_id)
    if not row:
        raise NotFound("Proposal not found.", code="PROPOSAL_NOT_FOUND")
    return row


def assert_can_read(row: Dict[str, Any], principal: Principal) -> None:
    if principal.is_ops:
        return
    if principal.is_brand and principal.org_id == row["org_id"]:
        return
    if principal.role == "CREATOR" and principal.creator_id:
        offer = store.find_one(
            "offers", {"proposal_id": row["id"], "creator_id": principal.creator_id}
        )
        if offer:
            return
    raise Forbidden("You do not have access to this proposal.", code="PROPOSAL_FORBIDDEN")


def assert_can_write(row: Dict[str, Any], principal: Principal) -> None:
    if not principal.is_brand or principal.org_id != row["org_id"]:
        raise Forbidden("You cannot edit this proposal.", code="PROPOSAL_FORBIDDEN")
    if row["status"] not in (
        ProposalStatus.DRAFT.value,
        ProposalStatus.CHANGES_REQUESTED.value,
    ):
        raise Conflict(
            f"This proposal is {row['status']} and can no longer be edited. "
            "Create a change order instead.",
            code="PROPOSAL_NOT_EDITABLE",
        )


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------

def _resolve_creators(campaign: Dict[str, Any], payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    syndicate_id = payload.get("syndicate_id")
    creator_ids = payload.get("creator_ids") or []

    if creator_ids:
        return [store.get("creators", cid) for cid in creator_ids if store.get("creators", cid)]

    if syndicate_id:
        members = store.find("syndicate_members", {"syndicate_id": syndicate_id})
        creators = [store.get("creators", m["creator_id"]) for m in members]
        return [c for c in creators if c]

    runs = store.find(
        "match_runs", {"campaign_id": campaign["id"]}, order_by="created_at DESC", limit=1
    )
    if runs:
        result = store.loads(runs[0]["result_json"], {})
        sid = result.get("syndicate_id")
        if sid:
            members = store.find("syndicate_members", {"syndicate_id": sid})
            creators = [store.get("creators", m["creator_id"]) for m in members]
            creators = [c for c in creators if c]
            if creators:
                return creators

    raise ValidationFailed(
        "No creators selected. Pick a syndicate or at least one creator.",
        field="creator_ids",
    )


def _offer_weights(offers: List[Dict[str, Any]]) -> List[int]:
    return [max(int(o.get("allocation_minor") or 0), 1) for o in offers]


def _reallocate_offers(proposal_id: str, pool_minor: int) -> None:
    """Keep each creator's offer in step with the pool the brand just edited.

    The weights are the previous allocations, so the relative split the brand
    saw is preserved as the total moves.
    """
    offers = store.find("offers", {"proposal_id": proposal_id}, order_by="created_at ASC")
    if not offers:
        return
    allocations = allocate(pool_minor, _offer_weights(offers))
    now = store.utcnow()
    for offer, allocation in zip(offers, allocations):
        store.update(
            "offers",
            offer["id"],
            {"allocation_minor": allocation, "updated_at": now},
        )


def _replace_milestones(proposal_id: str, milestones: List[Dict[str, Any]], currency: str) -> None:
    store.execute("DELETE FROM milestones WHERE proposal_id = ?", (proposal_id,))
    now = store.utcnow()
    for item in milestones:
        amount_minor = to_minor(item.get("amount") or 0, item.get("currency") or currency)
        store.insert(
            "milestones",
            {
                "id": item.get("id") or new_id("ms"),
                "proposal_id": proposal_id,
                "seq": int(item.get("seq") or 1),
                "title": item.get("title") or f"Milestone {item.get('seq')}",
                "description": item.get("description"),
                "amount_minor": amount_minor,
                "currency": item.get("currency") or currency,
                "due_at": item.get("due_at"),
                "evidence_requirements_json": store.dumps(item.get("evidence_requirements") or []),
                "acceptance_criteria_json": store.dumps(item.get("acceptance_criteria") or []),
                "review_sla_hours": int(item.get("review_sla_hours") or 48),
                "revision_window_hours": int(item.get("revision_window_hours") or 72),
                "status": item.get("status") or "DRAFT",
                "created_at": now,
                "updated_at": now,
            },
        )


def _template_milestones(creator_pool_minor: int, currency: str) -> List[Dict[str, Any]]:
    template = default_milestones(currency)
    weights = [int(m["weight"]) for m in template]
    amounts = allocate(creator_pool_minor, weights)
    out = []
    for item, amount in zip(template, amounts):
        row = dict(item)
        row["amount"] = amount / 100.0
        row["currency"] = currency
        out.append(row)
    return out


# --------------------------------------------------------------------------
# Create draft
# --------------------------------------------------------------------------

def create_draft(principal: Principal, campaign_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    campaign = get_campaign_row(campaign_id)
    if not principal.is_brand or principal.org_id != campaign["org_id"]:
        raise Forbidden("You cannot create a proposal for this campaign.", code="PROPOSAL_FORBIDDEN")

    creators = _resolve_creators(campaign, payload)
    currency = (payload.get("currency") or campaign["currency"] or "USD").upper()

    if payload.get("total_budget") is not None:
        total_minor = to_minor(payload["total_budget"], currency)
    else:
        total_minor = sum(int(c.get("base_rate_minor") or 0) for c in creators)
        if total_minor <= 0:
            total_minor = int(campaign["budget_minor"])

    split = split_gross(total_minor, currency)
    now = store.utcnow()
    proposal_id = new_id("prop")

    proposal = {
        "id": proposal_id,
        "campaign_id": campaign_id,
        "org_id": campaign["org_id"],
        "syndicate_id": payload.get("syndicate_id"),
        "version": 1,
        "status": ProposalStatus.DRAFT.value,
        "total_minor": total_minor,
        "currency": currency,
        "fx_rate": float(settings.USD_TO_KES_RATE),
        "platform_fee_minor": split.platform_fee_minor,
        "creator_pool_minor": split.creator_pool_minor,
        "withholding_minor": split.withholding_minor,
        "net_creator_minor": split.net_creator_minor,
        "legal_clauses_json": store.dumps(default_legal_clauses(currency)),
        "created_by": principal.user_id,
        "approved_by": None,
        "approved_at": None,
        "sent_at": None,
        "created_at": now,
        "updated_at": now,
    }
    store.insert("proposals", proposal)

    _replace_milestones(proposal_id, _template_milestones(split.creator_pool_minor, currency), currency)

    # Per-creator offers are created now so the brand can see recipients and
    # allocations while editing. They are not sent until the explicit send step.
    weights = [max(int(c.get("base_rate_minor") or 0), 1) for c in creators]
    allocations = allocate(split.creator_pool_minor, weights)
    for creator, allocation in zip(creators, allocations):
        store.insert(
            "offers",
            {
                "id": new_id("offer"),
                "proposal_id": proposal_id,
                "creator_id": creator["id"],
                "allocation_minor": allocation,
                "currency": currency,
                "status": OfferStatus.INVITED.value,
                "token_hash": None,
                "token_expires_at": None,
                "sent_at": None,
                "viewed_at": None,
                "accepted_at": None,
                "declined_at": None,
                "decline_reason": None,
                "created_at": now,
                "updated_at": now,
            },
        )

    audit.record(
        actor_id=principal.user_id,
        actor_role=principal.role,
        action="proposal.drafted",
        entity_type="proposal",
        entity_id=proposal_id,
        after={
            "total_minor": total_minor,
            "currency": currency,
            "creators": [c["id"] for c in creators],
            "emails_sent": False,
        },
    )
    return proposal_out(get_proposal_row(proposal_id), include_links=True)


# --------------------------------------------------------------------------
# Read / edit
# --------------------------------------------------------------------------

def get_proposal(proposal_id: str, principal: Principal) -> Dict[str, Any]:
    row = get_proposal_row(proposal_id)
    assert_can_read(row, principal)
    return proposal_out(row, include_links=principal.is_brand or principal.is_ops)


def list_proposals(campaign_id: str, principal: Principal) -> List[Dict[str, Any]]:
    campaign = get_campaign_row(campaign_id)
    if not principal.is_ops and not (principal.is_brand and principal.org_id == campaign["org_id"]):
        raise Forbidden("You do not have access to this campaign.", code="CAMPAIGN_FORBIDDEN")
    rows = store.find("proposals", {"campaign_id": campaign_id}, order_by="created_at DESC")
    return [proposal_out(r, include_links=principal.is_brand or principal.is_ops) for r in rows]


def patch_draft(proposal_id: str, principal: Principal, payload: Dict[str, Any]) -> Dict[str, Any]:
    row = get_proposal_row(proposal_id)
    assert_can_write(row, principal)
    before = proposal_out(row)

    updates: Dict[str, Any] = {"updated_at": store.utcnow()}
    currency = (payload.get("currency") or row["currency"]).upper()

    new_pool: Optional[int] = None
    if payload.get("milestones") is not None:
        _replace_milestones(proposal_id, payload["milestones"], currency)
        # Re-derive the creator pool from the milestone amounts so the money
        # always adds up. The brand is editing the pool, not a hidden total.
        new_pool = sum(
            int(m["amount_minor"])
            for m in store.find("milestones", {"proposal_id": proposal_id})
        )
    elif payload.get("total_budget") is not None:
        # A gross budget is a convenient way to set the whole proposal. Scale
        # the milestones so the invariant (sum of milestones == creator pool)
        # still holds instead of leaving a validation error behind.
        gross_minor = to_minor(payload["total_budget"], currency)
        new_pool = int(round(gross_minor * (1.0 - settings.PLATFORM_COMMISSION_PERCENT / 100.0)))
        rows = store.find("milestones", {"proposal_id": proposal_id}, order_by="seq ASC")
        if rows:
            weights = [max(int(m["amount_minor"]), 1) for m in rows]
            for milestone, amount in zip(rows, allocate(new_pool, weights)):
                store.update(
                    "milestones",
                    milestone["id"],
                    {"amount_minor": amount, "currency": currency, "updated_at": store.utcnow()},
                )

    if new_pool is not None:
        split = split_from_pool(new_pool, currency)
        updates.update(
            {
                "total_minor": split.gross_minor,
                "platform_fee_minor": split.platform_fee_minor,
                "creator_pool_minor": new_pool,
                "withholding_minor": split.withholding_minor,
                "net_creator_minor": split.net_creator_minor,
            }
        )
        _reallocate_offers(proposal_id, new_pool)

    if payload.get("legal_clauses") is not None:
        updates["legal_clauses_json"] = store.dumps(payload["legal_clauses"])
    if payload.get("fx_rate") is not None:
        updates["fx_rate"] = float(payload["fx_rate"])
    if payload.get("currency") is not None:
        updates["currency"] = currency

    store.update("proposals", proposal_id, updates)

    audit.record(
        actor_id=principal.user_id,
        actor_role=principal.role,
        action="proposal.edited",
        entity_type="proposal",
        entity_id=proposal_id,
        before=before,
        after=proposal_out(get_proposal_row(proposal_id)),
    )
    return proposal_out(get_proposal_row(proposal_id), include_links=True)


# --------------------------------------------------------------------------
# Validation
# --------------------------------------------------------------------------

def validate(proposal_id: str) -> Dict[str, Any]:
    row = get_proposal_row(proposal_id)
    currency = row["currency"]
    milestones = store.find("milestones", {"proposal_id": proposal_id}, order_by="seq ASC")
    offers = store.find("offers", {"proposal_id": proposal_id})

    blocking: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

    if not milestones:
        blocking.append(
            {"severity": "BLOCKING", "code": "NO_MILESTONES", "message": "Add at least one milestone."}
        )

    total_milestones = sum(int(m["amount_minor"]) for m in milestones)
    if milestones and total_milestones != int(row["creator_pool_minor"]):
        blocking.append(
            {
                "severity": "BLOCKING",
                "code": "TOTAL_MISMATCH",
                "message": (
                    "Milestone amounts do not add up to the creator pool. "
                    "Re-save the milestone table to recalculate."
                ),
                "field": "milestones",
            }
        )

    if int(row["total_minor"]) <= 0:
        blocking.append(
            {"severity": "BLOCKING", "code": "ZERO_BUDGET", "message": "Total budget must be positive."}
        )

    if not offers:
        blocking.append(
            {"severity": "BLOCKING", "code": "NO_RECIPIENTS", "message": "Add at least one creator offer."}
        )

    now = datetime.now(timezone.utc)
    for m in milestones:
        if not store.loads(m.get("evidence_requirements_json"), []):
            blocking.append(
                {
                    "severity": "BLOCKING",
                    "code": "NO_EVIDENCE_REQUIREMENTS",
                    "message": f"Milestone {m['seq']} has no evidence requirements.",
                    "field": f"milestones.{m['seq']}.evidence_requirements",
                }
            )
        if not m.get("due_at"):
            warnings.append(
                {
                    "severity": "WARNING",
                    "code": "NO_DUE_DATE",
                    "message": f"Milestone {m['seq']} has no due date.",
                    "field": f"milestones.{m['seq']}.due_at",
                }
            )
        else:
            try:
                if datetime.fromisoformat(m["due_at"]) < now:
                    warnings.append(
                        {
                            "severity": "WARNING",
                            "code": "DUE_DATE_IN_PAST",
                            "message": f"Milestone {m['seq']} is due in the past.",
                            "field": f"milestones.{m['seq']}.due_at",
                        }
                    )
            except ValueError:
                warnings.append(
                    {
                        "severity": "WARNING",
                        "code": "BAD_DUE_DATE",
                        "message": f"Milestone {m['seq']} has an invalid due date.",
                    }
                )

    for offer in offers:
        creator = store.get("creators", offer["creator_id"])
        if not creator:
            continue
        if not creator.get("channel_verified"):
            warnings.append(
                {
                    "severity": "WARNING",
                    "code": "CHANNEL_UNVERIFIED",
                    "message": f"{creator['name']} has not verified channel ownership.",
                    "field": f"offers.{offer['id']}",
                }
            )
        if (creator.get("tax_profile_status") or "UNVERIFIED") != "VERIFIED":
            warnings.append(
                {
                    "severity": "WARNING",
                    "code": "TAX_PROFILE_UNVERIFIED",
                    "message": (
                        f"{creator['name']} has an unverified tax profile. "
                        "Payment will be blocked until it is complete."
                    ),
                    "field": f"offers.{offer['id']}",
                }
            )

    return {
        "ok": not blocking,
        "blocking": blocking,
        "warnings": warnings,
    }


def _guard_validation(proposal_id: str) -> Dict[str, Any]:
    result = validate(proposal_id)
    if not result["ok"]:
        raise ValidationFailed(
            "Resolve the blocking issues before continuing.",
            code="PROPOSAL_INVALID",
            details={"issues": result["blocking"]},
        )
    return result


# --------------------------------------------------------------------------
# Lifecycle
# --------------------------------------------------------------------------

def submit_for_approval(proposal_id: str, principal: Principal) -> Dict[str, Any]:
    row = get_proposal_row(proposal_id)
    assert_can_write(row, principal)
    _guard_validation(proposal_id)
    transitions.ensure("proposal", row["status"], ProposalStatus.IN_REVIEW.value)
    store.update(
        "proposals",
        proposal_id,
        {"status": ProposalStatus.IN_REVIEW.value, "updated_at": store.utcnow()},
    )
    audit.record(
        actor_id=principal.user_id,
        actor_role=principal.role,
        action="proposal.submitted_for_approval",
        entity_type="proposal",
        entity_id=proposal_id,
        before={"status": row["status"]},
        after={"status": ProposalStatus.IN_REVIEW.value},
    )
    return proposal_out(get_proposal_row(proposal_id), include_links=True)


def approve(proposal_id: str, principal: Principal) -> Dict[str, Any]:
    row = get_proposal_row(proposal_id)
    if not (principal.role == "BRAND_ADMIN" and principal.org_id == row["org_id"]):
        raise Forbidden("Only a brand admin can approve and send this proposal.", code="APPROVAL_REQUIRED")
    _guard_validation(proposal_id)
    transitions.ensure("proposal", row["status"], ProposalStatus.APPROVED.value)
    now = store.utcnow()
    store.update(
        "proposals",
        proposal_id,
        {
            "status": ProposalStatus.APPROVED.value,
            "approved_by": principal.user_id,
            "approved_at": now,
            "updated_at": now,
        },
    )
    audit.record(
        actor_id=principal.user_id,
        actor_role=principal.role,
        action="proposal.approved",
        entity_type="proposal",
        entity_id=proposal_id,
        before={"status": row["status"]},
        after={"status": ProposalStatus.APPROVED.value, "approved_by": principal.user_id},
    )
    return proposal_out(get_proposal_row(proposal_id), include_links=True)


def send(proposal_id: str, principal: Principal) -> Dict[str, Any]:
    row = get_proposal_row(proposal_id)
    if not (principal.role == "BRAND_ADMIN" and principal.org_id == row["org_id"]):
        raise Forbidden("Only a brand admin can send this proposal.", code="APPROVAL_REQUIRED")
    if row["status"] != ProposalStatus.APPROVED.value:
        raise Conflict(
            "Approve the proposal before sending it.", code="NOT_APPROVED"
        )
    _guard_validation(proposal_id)

    campaign = get_campaign_row(row["campaign_id"])
    milestones = store.find("milestones", {"proposal_id": proposal_id}, order_by="seq ASC")
    offers = store.find("offers", {"proposal_id": proposal_id})
    now = datetime.now(timezone.utc)
    expires = (now + timedelta(days=OFFER_TTL_DAYS)).isoformat()

    for offer in offers:
        raw = new_token()
        link = offer_link(raw)
        store.update(
            "offers",
            offer["id"],
            {
                "status": OfferStatus.SENT.value,
                "token_hash": hash_token(raw),
                "token_expires_at": expires,
                "sent_at": now.isoformat(),
                "updated_at": now.isoformat(),
            },
        )
        creator = store.get("creators", offer["creator_id"]) or {"name": "Creator"}
        gross_allocation = int(offer["allocation_minor"])
        wht = int(round(gross_allocation * settings.KENYA_WITHHOLDING_TAX_PERCENT / 100.0))
        net_allocation = gross_allocation - wht
        email = render_offer_email(
            brand_name=campaign["brand_name"],
            creator_name=creator.get("name") or "Creator",
            gross_minor=gross_allocation,
            currency=row["currency"],
            net_creator_minor=net_allocation,
            withholding_minor=wht,
            milestones=[
                {
                    "seq": m["seq"],
                    "title": m["title"],
                    "description": m.get("description"),
                    "amount_minor": allocate(
                        int(m["amount_minor"]),
                        _offer_weights(offers),
                    )[offers.index(offer)],
                }
                for m in milestones
            ],
            link=link,
            expires_at=expires[:10],
        )
        store.insert(
            "notifications",
            {
                "id": new_id("ntf"),
                "recipient": creator.get("payout_ref") or creator.get("name") or "creator",
                "channel": "email",
                "subject": email["subject"],
                "body": store.dumps(
                    {
                        "offer_id": offer["id"],
                        "link": link,
                        "html": email["html"],
                        "text": email["text"],
                    }
                ),
                "status": "LOGGED_ONLY",
                "ref_type": "proposal",
                "ref_id": proposal_id,
                "created_at": now.isoformat(),
            },
        )
        store.insert(
            "messages",
            {
                "id": new_id("msg"),
                "thread_type": "proposal",
                "thread_id": proposal_id,
                "sender_id": principal.user_id,
                "sender_role": principal.role,
                "body": f"Offer sent to {creator.get('name')} ({creator.get('gamer_tag') or 'creator'}).",
                "created_at": now.isoformat(),
            },
        )

    store.update(
        "proposals",
        proposal_id,
        {
            "status": ProposalStatus.SENT.value,
            "sent_at": now.isoformat(),
            "updated_at": now.isoformat(),
        },
    )
    for m in milestones:
        store.update("milestones", m["id"], {"status": "LOCKED", "updated_at": now.isoformat()})

    audit.record(
        actor_id=principal.user_id,
        actor_role=principal.role,
        action="proposal.sent",
        entity_type="proposal",
        entity_id=proposal_id,
        after={
            "offers": len(offers),
            "recipients": [o["creator_id"] for o in offers],
            "emails_sent": True,
        },
    )
    return proposal_out(get_proposal_row(proposal_id), include_links=True)


def cancel(proposal_id: str, principal: Principal, reason: Optional[str] = None) -> Dict[str, Any]:
    row = get_proposal_row(proposal_id)
    if not (principal.role in ("BRAND_ADMIN", "OPS_ADMIN") and (principal.is_ops or principal.org_id == row["org_id"])):
        raise Forbidden("You cannot cancel this proposal.", code="PROPOSAL_FORBIDDEN")
    transitions.ensure("proposal", row["status"], ProposalStatus.CANCELLED.value)
    store.update(
        "proposals",
        proposal_id,
        {"status": ProposalStatus.CANCELLED.value, "updated_at": store.utcnow()},
    )
    audit.record(
        actor_id=principal.user_id,
        actor_role=principal.role,
        action="proposal.cancelled",
        entity_type="proposal",
        entity_id=proposal_id,
        before={"status": row["status"]},
        after={"status": ProposalStatus.CANCELLED.value, "reason": reason},
    )
    return proposal_out(get_proposal_row(proposal_id), include_links=True)


# --------------------------------------------------------------------------
# Email preview and audit
# --------------------------------------------------------------------------

def email_preview(proposal_id: str, principal: Principal, offer_id: Optional[str] = None) -> Dict[str, Any]:
    row = get_proposal_row(proposal_id)
    assert_can_read(row, principal)
    campaign = get_campaign_row(row["campaign_id"])
    milestones = store.find("milestones", {"proposal_id": proposal_id}, order_by="seq ASC")
    offers = store.find("offers", {"proposal_id": proposal_id})
    if not offers:
        raise ValidationFailed("This proposal has no recipients yet.")

    offer = next((o for o in offers if o["id"] == offer_id), offers[0])
    creator = store.get("creators", offer["creator_id"]) or {"name": "Creator"}

    stored = store.find(
        "notifications", {"ref_type": "proposal", "ref_id": proposal_id}, order_by="created_at DESC"
    )
    for notification in stored:
        payload = store.loads(notification.get("body"), {}) or {}
        if payload.get("offer_id") == offer["id"]:
            return {
                "offer_id": offer["id"],
                "creator_id": offer["creator_id"],
                "recipient": creator.get("name"),
                "subject": notification.get("subject"),
                "html": payload.get("html"),
                "text": payload.get("text"),
                "link": payload.get("link"),
                "sent": True,
            }

    weights = _offer_weights(offers)
    gross_allocation = int(offer["allocation_minor"])
    wht = int(round(gross_allocation * settings.KENYA_WITHHOLDING_TAX_PERCENT / 100.0))
    email = render_offer_email(
        brand_name=campaign["brand_name"],
        creator_name=creator.get("name") or "Creator",
        gross_minor=gross_allocation,
        currency=row["currency"],
        net_creator_minor=gross_allocation - wht,
        withholding_minor=wht,
        milestones=[
            {
                "seq": m["seq"],
                "title": m["title"],
                "description": m.get("description"),
                "amount_minor": allocate(int(m["amount_minor"]), weights)[offers.index(offer)],
            }
            for m in milestones
        ],
        link="#preview-not-sent",
        expires_at="not sent yet",
    )
    return {
        "offer_id": offer["id"],
        "creator_id": offer["creator_id"],
        "recipient": creator.get("name"),
        "subject": email["subject"],
        "html": email["html"],
        "text": email["text"],
        "link": None,
        "sent": False,
    }


def audit_trail(proposal_id: str, principal: Principal) -> List[Dict[str, Any]]:
    row = get_proposal_row(proposal_id)
    assert_can_read(row, principal)
    return audit.for_proposal(proposal_id)
