"""Creator-facing offers: view, claim, accept, counter, decline.

The magic link is the entry point. The token is single-purpose and expiring;
accepting it creates or attaches a creator account so the creator can return
later with a password.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from app.workflow import audit, store, transitions
from app.workflow.auth import Principal, create_session
from app.workflow.campaign_service import get_campaign_row
from app.workflow.enums import OfferStatus, ProposalStatus, Role
from app.workflow.errors import Conflict, Forbidden, NotFound, ValidationFailed
from app.workflow.money import allocate, to_minor
from app.workflow.security import hash_password, hash_token, new_id
from app.workflow.serializers import (
    campaign_out,
    creator_out,
    decision_out,
    evidence_out,
    milestone_out,
    offer_out,
    proposal_out,
    report_out,
)
from app.workflow.proposal_service import get_proposal_row


# --------------------------------------------------------------------------
# Token resolution
# --------------------------------------------------------------------------

def find_offer_by_token(raw: str) -> Dict[str, Any]:
    if not raw:
        raise NotFound("Offer link is missing.", code="OFFER_TOKEN_MISSING")
    offer = store.find_one("offers", {"token_hash": hash_token(raw)})
    if not offer:
        raise NotFound("This offer link is not valid.", code="OFFER_TOKEN_INVALID")
    expires = offer.get("token_expires_at")
    if expires and datetime.fromisoformat(expires) < datetime.now(timezone.utc):
        raise Conflict("This offer link has expired.", code="OFFER_TOKEN_EXPIRED")
    return offer


def creator_email(creator: Dict[str, Any]) -> str:
    ref = creator.get("payout_ref") or ""
    if "@" in ref:
        return ref
    return f"{creator['id']}@creators.sponsorplay.ke"


def _offer_weights(offers: List[Dict[str, Any]]) -> List[int]:
    return [max(int(o.get("allocation_minor") or 0), 1) for o in offers]


def milestones_for_offer(proposal_id: str, offer: Dict[str, Any]) -> List[Dict[str, Any]]:
    offers = store.find("offers", {"proposal_id": proposal_id})
    weights = _offer_weights(offers)
    index = next((i for i, o in enumerate(offers) if o["id"] == offer["id"]), 0)
    rows = store.find("milestones", {"proposal_id": proposal_id}, order_by="seq ASC")
    out = []
    for row in rows:
        shares = allocate(int(row["amount_minor"]), weights)
        view = milestone_out(row)
        view["amount_minor"] = shares[index]
        view["amount"] = round(shares[index] / 100.0, 2)
        out.append(view)
    return out


# --------------------------------------------------------------------------
# Public view
# --------------------------------------------------------------------------

def public_offer(raw: str) -> Dict[str, Any]:
    offer = find_offer_by_token(raw)
    if offer["status"] == OfferStatus.INVITED.value:
        store.update(
            "offers",
            offer["id"],
            {"status": OfferStatus.SENT.value, "sent_at": offer.get("sent_at") or store.utcnow()},
        )
        offer = store.get("offers", offer["id"])

    if offer["status"] in (OfferStatus.SENT.value, OfferStatus.VIEWED.value):
        store.update(
            "offers",
            offer["id"],
            {"status": OfferStatus.VIEWED.value, "viewed_at": store.utcnow()},
        )
        offer = store.get("offers", offer["id"])
        audit.record(
            actor_id=None,
            actor_role="CREATOR",
            action="offer.viewed",
            entity_type="offer",
            entity_id=offer["id"],
        )

    proposal = get_proposal_row(offer["proposal_id"])
    campaign = store.get("campaigns", proposal["campaign_id"])
    creator = store.get("creators", offer["creator_id"])
    user = store.find_one("users", {"email": creator_email(creator)}) if creator else None

    return {
        "offer": offer_out(offer, creator=creator),
        "proposal": proposal_out(proposal, include_offers=False),
        "campaign": campaign_out(campaign),
        "brand_name": campaign["brand_name"] if campaign else "Brand",
        "milestones": milestones_for_offer(proposal["id"], offer),
        "requires_account": user is None,
        "expires_at": offer.get("token_expires_at"),
    }


# --------------------------------------------------------------------------
# Claim / account creation
# --------------------------------------------------------------------------

def claim(raw: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    offer = find_offer_by_token(raw)
    creator = store.get("creators", offer["creator_id"])
    if not creator:
        raise NotFound("Creator profile not found.", code="CREATOR_NOT_FOUND")

    email = creator_email(creator)
    user = store.find_one("users", {"email": email})
    now = store.utcnow()

    if user is None:
        user = {
            "id": new_id("user"),
            "org_id": None,
            "email": email,
            "name": payload.get("full_name") or creator["name"],
            "role": Role.CREATOR.value,
            "password_hash": hash_password(payload["password"]) if payload.get("password") else None,
            "created_at": now,
        }
        store.insert("users", user)
        audit.record(
            actor_id=user["id"],
            actor_role=Role.CREATOR.value,
            action="creator.account_created",
            entity_type="user",
            entity_id=user["id"],
            after={"email": email, "creator_id": creator["id"]},
        )
    elif payload.get("password") and not user.get("password_hash"):
        store.update("users", user["id"], {"password_hash": hash_password(payload["password"])})

    if payload.get("confirm_payout_ref"):
        store.update("creators", creator["id"], {"payout_ref": payload["confirm_payout_ref"]})

    token = create_session(
        user_id=user["id"],
        role=Role.CREATOR.value,
        org_id=None,
        creator_id=creator["id"],
    )
    return {
        "token": token,
        "principal": {
            "user_id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "role": Role.CREATOR.value,
            "org_id": None,
            "creator_id": creator["id"],
            "is_ops": False,
            "is_brand": False,
        },
        "offer_id": offer["id"],
        "redirect_url": f"/creator?offer={offer['id']}",
    }


# --------------------------------------------------------------------------
# Accept / counter / decline
# --------------------------------------------------------------------------

def _recompute_proposal_status(proposal_id: str) -> str:
    proposal = get_proposal_row(proposal_id)
    if proposal["status"] in (
        ProposalStatus.FUNDED.value,
        ProposalStatus.ACTIVE.value,
        ProposalStatus.COMPLETED.value,
    ):
        return proposal["status"]
    offers = store.find("offers", {"proposal_id": proposal_id})
    accepted_states = {
        OfferStatus.ACCEPTED.value,
        OfferStatus.ACTIVE.value,
        OfferStatus.COMPLETED.value,
    }
    resolved_states = accepted_states | {
        OfferStatus.DECLINED.value,
        OfferStatus.WITHDRAWN.value,
        OfferStatus.EXPIRED.value,
    }
    accepted = sum(1 for o in offers if o["status"] in accepted_states)
    resolved = sum(1 for o in offers if o["status"] in resolved_states)
    if offers and accepted == len(offers):
        target = ProposalStatus.ACCEPTED.value
    elif offers and accepted and resolved == len(offers):
        # Everyone has answered; the remaining creators declined.
        target = ProposalStatus.ACCEPTED.value
    elif accepted:
        target = ProposalStatus.PARTIALLY_ACCEPTED.value
    else:
        return proposal["status"]

    current = proposal["status"]
    if current != target and transitions.can("proposal", current, target):
        store.update(
            "proposals",
            proposal_id,
            {"status": target, "updated_at": store.utcnow()},
        )
        audit.record(
            actor_id=None,
            actor_role="SYSTEM",
            action="proposal.status_changed",
            entity_type="proposal",
            entity_id=proposal_id,
            before={"status": current},
            after={"status": target},
        )
        return target
    return current


def accept(raw: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    offer = find_offer_by_token(raw)
    if offer["status"] in (OfferStatus.DECLINED.value, OfferStatus.EXPIRED.value, OfferStatus.WITHDRAWN.value):
        raise Conflict(f"This offer is {offer['status'].lower()}.", code="OFFER_NOT_ACCEPTABLE")

    now = store.utcnow()
    transitions.ensure("offer", offer["status"], OfferStatus.ACCEPTED.value)
    store.update(
        "offers",
        offer["id"],
        {
            "status": OfferStatus.ACCEPTED.value,
            "accepted_at": now,
            "updated_at": now,
        },
    )

    creator = store.get("creators", offer["creator_id"]) or {}
    store.insert(
        "messages",
        {
            "id": new_id("msg"),
            "thread_type": "proposal",
            "thread_id": offer["proposal_id"],
            "sender_id": creator.get("id"),
            "sender_role": "CREATOR",
            "body": (
                f"{creator.get('name') or 'Creator'} accepted the offer"
                + (f" and confirmed payout to {payload.get('confirm_payout_ref')}"
                   if payload.get("confirm_payout_ref") else "")
                + "."
            ),
            "created_at": now,
        },
    )
    audit.record(
        actor_id=creator.get("id"),
        actor_role="CREATOR",
        action="offer.accepted",
        entity_type="offer",
        entity_id=offer["id"],
        after={"accepted_at": now, "confirmed_by": payload.get("full_name") or creator.get("name")},
    )
    _recompute_proposal_status(offer["proposal_id"])

    proposal = get_proposal_row(offer["proposal_id"])
    return {
        "offer": offer_out(store.get("offers", offer["id"]), creator=creator),
        "proposal": proposal_out(proposal, include_offers=False),
    }


def counter(raw: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    offer = find_offer_by_token(raw)
    if offer["status"] not in (
        OfferStatus.SENT.value,
        OfferStatus.VIEWED.value,
        OfferStatus.COUNTERED.value,
    ):
        raise Conflict(f"This offer is {offer['status'].lower()}.", code="OFFER_NOT_COUNTERABLE")

    amount_minor = to_minor(payload.get("amount") or 0, offer["currency"])
    if amount_minor <= 0:
        raise ValidationFailed("Counter amount must be greater than zero.", field="amount")

    now = store.utcnow()
    transitions.ensure("offer", offer["status"], OfferStatus.COUNTERED.value)
    store.update(
        "offers",
        offer["id"],
        {"status": OfferStatus.COUNTERED.value, "updated_at": now},
    )
    counter_row = {
        "id": new_id("cnt"),
        "offer_id": offer["id"],
        "amount_minor": amount_minor,
        "scope_json": store.dumps(payload.get("scope_changes") or []),
        "dates_json": store.dumps(payload.get("proposed_dates") or {}),
        "message": payload.get("message"),
        "status": "PENDING",
        "created_at": now,
    }
    store.insert("counter_offers", counter_row)

    creator = store.get("creators", offer["creator_id"]) or {}
    store.insert(
        "messages",
        {
            "id": new_id("msg"),
            "thread_type": "proposal",
            "thread_id": offer["proposal_id"],
            "sender_id": creator.get("id"),
            "sender_role": "CREATOR",
            "body": (
                f"{creator.get('name') or 'Creator'} countered at "
                f"{amount_minor / 100:.2f} {offer['currency']}."
                + (f" Note: {payload.get('message')}" if payload.get("message") else "")
            ),
            "created_at": now,
        },
    )
    audit.record(
        actor_id=creator.get("id"),
        actor_role="CREATOR",
        action="offer.countered",
        entity_type="offer",
        entity_id=offer["id"],
        after={"amount_minor": amount_minor, "counter_id": counter_row["id"]},
    )
    return {
        "counter_id": counter_row["id"],
        "amount_minor": amount_minor,
        "amount": round(amount_minor / 100.0, 2),
        "currency": offer["currency"],
        "status": "PENDING",
    }


def decline(raw: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    offer = find_offer_by_token(raw)
    if offer["status"] in (OfferStatus.ACCEPTED.value, OfferStatus.ACTIVE.value, OfferStatus.COMPLETED.value):
        raise Conflict("This offer has already been accepted.", code="OFFER_ALREADY_ACCEPTED")
    now = store.utcnow()
    transitions.ensure("offer", offer["status"], OfferStatus.DECLINED.value)
    store.update(
        "offers",
        offer["id"],
        {
            "status": OfferStatus.DECLINED.value,
            "declined_at": now,
            "decline_reason": payload.get("reason"),
            "updated_at": now,
        },
    )
    creator = store.get("creators", offer["creator_id"]) or {}
    store.insert(
        "messages",
        {
            "id": new_id("msg"),
            "thread_type": "proposal",
            "thread_id": offer["proposal_id"],
            "sender_id": creator.get("id"),
            "sender_role": "CREATOR",
            "body": f"{creator.get('name') or 'Creator'} declined the offer."
            + (f" Reason: {payload.get('reason')}" if payload.get("reason") else ""),
            "created_at": now,
        },
    )
    audit.record(
        actor_id=creator.get("id"),
        actor_role="CREATOR",
        action="offer.declined",
        entity_type="offer",
        entity_id=offer["id"],
        after={"reason": payload.get("reason")},
    )
    _recompute_proposal_status(offer["proposal_id"])
    return {"offer": offer_out(store.get("offers", offer["id"]), creator=creator)}


# --------------------------------------------------------------------------
# Brand decisions on counters
# --------------------------------------------------------------------------

def _brand_offer(proposal_id: str, offer_id: str, principal: Principal) -> Dict[str, Any]:
    proposal = get_proposal_row(proposal_id)
    if not principal.is_brand or principal.org_id != proposal["org_id"]:
        raise Forbidden("You cannot act on this offer.", code="OFFER_FORBIDDEN")
    offer = store.get("offers", offer_id)
    if not offer or offer["proposal_id"] != proposal_id:
        raise NotFound("Offer not found.", code="OFFER_NOT_FOUND")
    return offer


def accept_counter(proposal_id: str, offer_id: str, principal: Principal) -> Dict[str, Any]:
    offer = _brand_offer(proposal_id, offer_id, principal)
    pending = store.find(
        "counter_offers", {"offer_id": offer_id, "status": "PENDING"}, order_by="created_at DESC"
    )
    if not pending:
        raise NotFound("No pending counter for this offer.", code="COUNTER_NOT_FOUND")
    counter_row = pending[0]
    now = store.utcnow()

    store.update("counter_offers", counter_row["id"], {"status": "ACCEPTED"})
    store.update(
        "offers",
        offer_id,
        {
            "allocation_minor": int(counter_row["amount_minor"]),
            "status": OfferStatus.ACCEPTED.value,
            "accepted_at": now,
            "updated_at": now,
        },
    )

    # Re-derive the proposal totals from the accepted allocations and bump the
    # version. A sent proposal is never silently mutated.
    proposal = get_proposal_row(proposal_id)
    offers = store.find("offers", {"proposal_id": proposal_id})
    pool = sum(int(o["allocation_minor"]) for o in offers)
    from app.workflow.money import split_from_pool

    split = split_from_pool(pool, proposal["currency"])
    store.update(
        "proposals",
        proposal_id,
        {
            "version": int(proposal["version"]) + 1,
            "total_minor": split.gross_minor,
            "platform_fee_minor": split.platform_fee_minor,
            "creator_pool_minor": split.creator_pool_minor,
            "withholding_minor": split.withholding_minor,
            "net_creator_minor": split.net_creator_minor,
            "updated_at": now,
        },
    )
    audit.record(
        actor_id=principal.user_id,
        actor_role=principal.role,
        action="counter.accepted",
        entity_type="offer",
        entity_id=offer_id,
        before={"allocation_minor": int(offer["allocation_minor"])},
        after={"allocation_minor": int(counter_row["amount_minor"])},
    )
    _recompute_proposal_status(proposal_id)
    return proposal_out(get_proposal_row(proposal_id), include_links=True)


def decline_counter(proposal_id: str, offer_id: str, principal: Principal) -> Dict[str, Any]:
    offer = _brand_offer(proposal_id, offer_id, principal)
    pending = store.find(
        "counter_offers", {"offer_id": offer_id, "status": "PENDING"}, order_by="created_at DESC"
    )
    if not pending:
        raise NotFound("No pending counter for this offer.", code="COUNTER_NOT_FOUND")
    counter_row = pending[0]
    now = store.utcnow()
    store.update("counter_offers", counter_row["id"], {"status": "DECLINED"})
    store.update(
        "offers",
        offer_id,
        {"status": OfferStatus.VIEWED.value, "updated_at": now},
    )
    audit.record(
        actor_id=principal.user_id,
        actor_role=principal.role,
        action="counter.declined",
        entity_type="offer",
        entity_id=offer_id,
        after={"counter_id": counter_row["id"]},
    )
    return proposal_out(get_proposal_row(proposal_id), include_links=True)


# --------------------------------------------------------------------------
# Creator home
# --------------------------------------------------------------------------

def creator_home(principal: Principal) -> Dict[str, Any]:
    if principal.role != Role.CREATOR.value or not principal.creator_id:
        raise Forbidden("Creator access only.", code="CREATOR_ONLY")
    creator = store.get("creators", principal.creator_id)
    if not creator:
        raise NotFound("Creator profile not found.", code="CREATOR_NOT_FOUND")

    offers = store.find("offers", {"creator_id": principal.creator_id}, order_by="created_at DESC")
    campaigns = []
    earnings = 0
    for offer in offers:
        if offer["status"] in (
            OfferStatus.ACCEPTED.value,
            OfferStatus.ACTIVE.value,
            OfferStatus.COMPLETED.value,
        ):
            proposal = get_proposal_row(offer["proposal_id"])
            campaigns.append(
                {
                    "offer": offer_out(offer, creator=creator),
                    "proposal": proposal_out(proposal, include_offers=False),
                    "campaign": campaign_out(store.get("campaigns", proposal["campaign_id"])),
                    "milestones": milestones_for_offer(proposal["id"], offer),
                }
            )
            for m in store.find("milestones", {"proposal_id": proposal["id"]}):
                if m["status"] in ("PAID", "CLOSED"):
                    shares = allocate(
                        int(m["amount_minor"]),
                        _offer_weights(store.find("offers", {"proposal_id": proposal["id"]})),
                    )
                    index = next(
                        (
                            i
                            for i, o in enumerate(
                                store.find("offers", {"proposal_id": proposal["id"]})
                            )
                            if o["id"] == offer["id"]
                        ),
                        0,
                    )
                    earnings += shares[index]

    return {
        "creator": creator_out(creator),
        "offers": [offer_out(o, creator=creator) for o in offers],
        "campaigns": campaigns,
        "earnings_minor": earnings,
        "earnings": round(earnings / 100.0, 2),
        "currency": creator.get("currency") or "USD",
    }


def creator_campaign(principal: Principal, proposal_id: str) -> Dict[str, Any]:
    if principal.role != Role.CREATOR.value or not principal.creator_id:
        raise Forbidden("Creator access only.", code="CREATOR_ONLY")
    offer = store.find_one(
        "offers", {"proposal_id": proposal_id, "creator_id": principal.creator_id}
    )
    if not offer:
        raise Forbidden("You do not have access to this campaign.", code="OFFER_FORBIDDEN")
    proposal = get_proposal_row(proposal_id)
    creator = store.get("creators", principal.creator_id)

    milestones = []
    for view in milestones_for_offer(proposal_id, offer):
        row = store.get("milestones", view["id"])
        evidence = [evidence_out(e) for e in store.find("evidence", {"milestone_id": row["id"]})]
        report = store.find(
            "verification_reports", {"milestone_id": row["id"]}, order_by="created_at DESC", limit=1
        )
        decision = store.find(
            "review_decisions", {"milestone_id": row["id"]}, order_by="decided_at DESC", limit=1
        )
        milestones.append(
            {
                "milestone": view,
                "offer_id": offer["id"],
                "proposal_id": proposal_id,
                "brand_name": (store.get("campaigns", proposal["campaign_id"]) or {}).get("brand_name", ""),
                "evidence": evidence,
                "report": report_out(report[0]) if report else None,
                "decision": decision_out(decision[0]) if decision else None,
            }
        )

    return {
        "offer": offer_out(offer, creator=creator),
        "proposal": proposal_out(proposal, include_offers=False),
        "campaign": campaign_out(store.get("campaigns", proposal["campaign_id"])),
        "milestones": milestones,
    }
