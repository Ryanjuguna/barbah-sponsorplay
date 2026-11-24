"""Money: funding commitments, the ledger, invoices and payouts.

Everything here is idempotent. A retried request returns the original result;
it never moves money twice. Provider calls are simulated for the demo, but the
ledger and the guards are real.
"""

from typing import Any, Dict, List, Optional

from app.config import settings
from app.workflow import audit, store, transitions
from app.workflow.auth import Principal
from app.workflow.enums import (
    FundingStatus,
    InvoiceType,
    MilestoneStatus,
    OfferStatus,
    PaymentStatus,
    ProposalStatus,
)
from app.workflow.errors import Conflict, Forbidden, NotFound, ValidationFailed
from app.workflow.money import allocate, split_gross, to_minor
from app.workflow.security import new_id
from app.workflow.serializers import invoice_out, ledger_out


def _proposal(proposal_id: str) -> Dict[str, Any]:
    row = store.get("proposals", proposal_id)
    if not row:
        raise NotFound("Proposal not found.", code="PROPOSAL_NOT_FOUND")
    return row


def _offer_weights(offers: List[Dict[str, Any]]) -> List[int]:
    return [max(int(o.get("allocation_minor") or 0), 1) for o in offers]


def share_for_offer(milestone: Dict[str, Any], offer: Dict[str, Any]) -> int:
    offers = store.find("offers", {"proposal_id": milestone["proposal_id"]})
    shares = allocate(int(milestone["amount_minor"]), _offer_weights(offers))
    index = next((i for i, o in enumerate(offers) if o["id"] == offer["id"]), 0)
    return shares[index]


# --------------------------------------------------------------------------
# Funding
# --------------------------------------------------------------------------

def create_funding_intent(
    principal: Principal,
    proposal_id: str,
    *,
    amount: Optional[float] = None,
    provider: str = "SIMULATED",
    idempotency_key: Optional[str] = None,
) -> Dict[str, Any]:
    proposal = _proposal(proposal_id)
    if not principal.is_brand or principal.org_id != proposal["org_id"]:
        raise Forbidden("You cannot fund this proposal.", code="FUNDING_FORBIDDEN")
    if proposal["status"] not in (
        ProposalStatus.ACCEPTED.value,
        ProposalStatus.PARTIALLY_ACCEPTED.value,
    ):
        raise Conflict(
            "The proposal must be accepted by the creators before funding.",
            code="PROPOSAL_NOT_ACCEPTED",
        )

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
    pending = [o for o in offers if o["status"] not in resolved_states]
    if pending:
        raise Conflict(
            "Some creators have not responded yet. Fund once every offer is resolved.",
            code="OFFERS_PENDING",
            details={"pending": [o["creator_id"] for o in pending]},
        )
    if not any(o["status"] in accepted_states for o in offers):
        raise Conflict(
            "No creator has accepted this proposal yet.",
            code="NO_ACCEPTED_OFFERS",
        )

    key = idempotency_key or f"fund:{proposal_id}:{proposal['total_minor']}"
    existing = store.find_one("funding_commitments", {"idempotency_key": key})
    if existing:
        return _funding_out(existing)

    amount_minor = to_minor(amount, proposal["currency"]) if amount else int(proposal["total_minor"])
    if amount_minor <= 0:
        raise ValidationFailed("Funding amount must be positive.", field="amount")

    row = {
        "id": new_id("fund"),
        "proposal_id": proposal_id,
        "amount_minor": amount_minor,
        "currency": proposal["currency"],
        "provider": provider,
        "provider_ref": None,
        "status": FundingStatus.CREATED.value,
        "idempotency_key": key,
        "created_at": store.utcnow(),
    }
    store.insert("funding_commitments", row)
    audit.record(
        actor_id=principal.user_id,
        actor_role=principal.role,
        action="funding.intent_created",
        entity_type="proposal",
        entity_id=proposal_id,
        after={"amount_minor": amount_minor, "provider": provider},
    )
    return _funding_out(row)


def _funding_out(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": row["id"],
        "proposal_id": row["proposal_id"],
        "amount_minor": int(row["amount_minor"]),
        "amount": round(int(row["amount_minor"]) / 100.0, 2),
        "currency": row["currency"],
        "provider": row.get("provider"),
        "status": row["status"],
        "idempotency_key": row.get("idempotency_key"),
        "created_at": row["created_at"],
    }


def capture_funding(principal: Principal, intent_id: str) -> Dict[str, Any]:
    intent = store.get("funding_commitments", intent_id)
    if not intent:
        raise NotFound("Funding intent not found.", code="FUNDING_NOT_FOUND")
    proposal = _proposal(intent["proposal_id"])
    if not principal.is_brand or principal.org_id != proposal["org_id"]:
        raise Forbidden("You cannot capture this funding.", code="FUNDING_FORBIDDEN")

    if intent["status"] == FundingStatus.CAPTURED.value:
        return {"intent": _funding_out(intent), "proposal": _proposal_out(proposal["id"])}

    if intent["status"] != FundingStatus.CREATED.value:
        raise Conflict(f"Funding is {intent['status']}.", code="FUNDING_NOT_CAPTURABLE")

    now = store.utcnow()
    amount = int(intent["amount_minor"])
    currency = intent["currency"]

    store.update(
        "funding_commitments",
        intent_id,
        {"status": FundingStatus.CAPTURED.value, "provider_ref": f"SIM-{new_id('pay')}"},
    )

    store.insert(
        "ledger_entries",
        {
            "id": new_id("led"),
            "account": "platform",
            "direction": "CREDIT",
            "amount_minor": amount,
            "currency": currency,
            "ref_type": "proposal",
            "ref_id": proposal["id"],
            "description": "Brand committed balance captured",
            "created_at": now,
        },
    )

    # Platform fee invoice, pro-rated if the funding is partial.
    proportion = amount / max(int(proposal["total_minor"]), 1)
    platform_fee = int(round(int(proposal["platform_fee_minor"]) * proportion))
    if platform_fee:
        store.insert(
            "invoices",
            {
                "id": new_id("inv"),
                "milestone_id": None,
                "proposal_id": proposal["id"],
                "invoice_type": InvoiceType.PLATFORM_FEE.value,
                "amount_minor": platform_fee,
                "tax_minor": 0,
                "currency": currency,
                "status": "ISSUED",
                "etims_ref": f"SIM-ETIMS-{new_id('x')[:10].upper()}",
                "issued_at": now,
            },
        )

    current = proposal["status"]
    if transitions.can("proposal", current, ProposalStatus.FUNDED.value):
        transitions.ensure("proposal", current, ProposalStatus.FUNDED.value)
        store.update(
            "proposals", proposal["id"], {"status": ProposalStatus.FUNDED.value, "updated_at": now}
        )

    milestones = store.find("milestones", {"proposal_id": proposal["id"]}, order_by="seq ASC")
    for m in milestones:
        if m["status"] in (MilestoneStatus.DRAFT.value, MilestoneStatus.LOCKED.value):
            store.update("milestones", m["id"], {"status": MilestoneStatus.FUNDED.value, "updated_at": now})
    if milestones:
        first = milestones[0]
        transitions.ensure("milestone", MilestoneStatus.FUNDED.value, MilestoneStatus.IN_PROGRESS.value)
        store.update("milestones", first["id"], {"status": MilestoneStatus.IN_PROGRESS.value, "updated_at": now})

    audit.record(
        actor_id=principal.user_id,
        actor_role=principal.role,
        action="funding.captured",
        entity_type="proposal",
        entity_id=proposal["id"],
        after={"amount_minor": amount, "currency": currency, "provider": intent.get("provider")},
    )
    return {
        "intent": _funding_out(store.get("funding_commitments", intent_id)),
        "proposal": _proposal_out(proposal["id"]),
    }


def _proposal_out(proposal_id: str) -> Dict[str, Any]:
    from app.workflow.serializers import proposal_out

    return proposal_out(_proposal(proposal_id), include_links=True)


# --------------------------------------------------------------------------
# Settlement
# --------------------------------------------------------------------------

def settle_milestone(milestone_id: str, offer_id: str, reviewer_id: str) -> Dict[str, Any]:
    """Create the invoice, the payout and the ledger entries for one creator.

    Called only after an APPROVE decision has been recorded.
    """
    milestone = store.get("milestones", milestone_id)
    if not milestone:
        raise NotFound("Milestone not found.", code="MILESTONE_NOT_FOUND")
    offer = store.get("offers", offer_id)
    if not offer:
        raise NotFound("Offer not found.", code="OFFER_NOT_FOUND")

    decision = store.find(
        "review_decisions",
        {"milestone_id": milestone_id, "offer_id": offer_id, "decision": "APPROVE"},
        order_by="decided_at DESC",
        limit=1,
    )
    if not decision:
        raise Conflict(
            "A human APPROVE decision is required before payment.",
            code="PAYMENT_REQUIRES_APPROVAL",
        )

    proposal = _proposal(milestone["proposal_id"])
    if proposal["status"] not in (
        ProposalStatus.FUNDED.value,
        ProposalStatus.ACTIVE.value,
    ):
        raise Conflict("The campaign is not funded.", code="CAMPAIGN_NOT_FUNDED")

    key = f"payout:{milestone_id}:{offer_id}"
    existing = store.find_one("payment_intents", {"idempotency_key": key})
    if existing:
        payout = store.find_one("payouts", {"intent_id": existing["id"]})
        return _payout_out(existing, payout, milestone, offer)

    creator = store.get("creators", offer["creator_id"]) or {}
    if (creator.get("tax_profile_status") or "UNVERIFIED") != "VERIFIED":
        raise Conflict(
            "The creator's tax profile must be verified before payout.",
            code="TAX_PROFILE_REQUIRED",
        )

    now = store.utcnow()
    currency = milestone["currency"]
    gross = share_for_offer(milestone, offer)
    wht_pct = settings.KENYA_WITHHOLDING_TAX_PERCENT / 100.0
    wht = int(round(gross * wht_pct))
    net = gross - wht

    invoice = {
        "id": new_id("inv"),
        "milestone_id": milestone_id,
        "proposal_id": proposal["id"],
        "invoice_type": InvoiceType.CREATOR_SERVICE.value,
        "amount_minor": gross,
        "tax_minor": wht,
        "currency": currency,
        "status": "ISSUED",
        "etims_ref": f"SIM-ETIMS-{new_id('x')[:10].upper()}",
        "issued_at": now,
    }
    store.insert("invoices", invoice)

    intent = {
        "id": new_id("pi"),
        "milestone_id": milestone_id,
        "offer_id": offer_id,
        "amount_minor": net,
        "currency": currency,
        "idempotency_key": key,
        "status": PaymentStatus.INTENT_CREATED.value,
        "created_at": now,
    }
    store.insert("payment_intents", intent)

    store.update("payment_intents", intent["id"], {"status": PaymentStatus.PROCESSING.value})
    payout = {
        "id": new_id("payout"),
        "intent_id": intent["id"],
        "provider": "SIMULATED",
        "provider_ref": f"SIM-PAYOUT-{new_id('x')[:10].upper()}",
        "status": PaymentStatus.PAID.value,
        "failure_reason": None,
        "created_at": now,
    }
    store.insert("payouts", payout)
    store.update("payment_intents", intent["id"], {"status": PaymentStatus.PAID.value})

    store.insert(
        "ledger_entries",
        {
            "id": new_id("led"),
            "account": "creator",
            "direction": "CREDIT",
            "amount_minor": gross,
            "currency": currency,
            "ref_type": "milestone",
            "ref_id": milestone_id,
            "description": f"Milestone payable to {creator.get('name') or offer['creator_id']}",
            "created_at": now,
        },
    )
    store.insert(
        "ledger_entries",
        {
            "id": new_id("led"),
            "account": "external",
            "direction": "DEBIT",
            "amount_minor": net,
            "currency": currency,
            "ref_type": "milestone",
            "ref_id": milestone_id,
            "description": f"Payout settled to {creator.get('name') or offer['creator_id']}",
            "created_at": now,
        },
    )
    if wht:
        store.insert(
            "ledger_entries",
            {
                "id": new_id("led"),
                "account": "kra",
                "direction": "DEBIT",
                "amount_minor": wht,
                "currency": currency,
                "ref_type": "milestone",
                "ref_id": milestone_id,
                "description": "Withholding tax recorded (simulated, not remitted)",
                "created_at": now,
            },
        )

    # Aggregate milestone status.
    current = milestone["status"]
    if transitions.can("milestone", current, MilestoneStatus.INVOICED.value):
        store.update("milestones", milestone_id, {"status": MilestoneStatus.INVOICED.value, "updated_at": now})
    if transitions.can("milestone", MilestoneStatus.INVOICED.value, MilestoneStatus.PAID.value):
        store.update("milestones", milestone_id, {"status": MilestoneStatus.PAID.value, "updated_at": now})

    audit.record(
        actor_id=reviewer_id,
        actor_role="OPS",
        action="payout.settled",
        entity_type="payment",
        entity_id=milestone_id,
        after={
            "offer_id": offer_id,
            "gross_minor": gross,
            "withholding_minor": wht,
            "net_minor": net,
            "provider": "SIMULATED",
        },
    )
    _close_or_unlock(milestone["proposal_id"])
    return _payout_out(intent, payout, milestone, offer, invoice)


def _payout_out(
    intent: Dict[str, Any],
    payout: Optional[Dict[str, Any]],
    milestone: Dict[str, Any],
    offer: Dict[str, Any],
    invoice: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    if invoice is None:
        invoice = store.find_one("invoices", {"milestone_id": milestone["id"], "invoice_type": "CREATOR_SERVICE"})
    return {
        "id": intent["id"],
        "milestone_id": milestone["id"],
        "offer_id": offer["id"],
        "amount_minor": int(intent["amount_minor"]),
        "amount": round(int(intent["amount_minor"]) / 100.0, 2),
        "currency": intent["currency"],
        "status": payout["status"] if payout else intent["status"],
        "provider": payout.get("provider") if payout else None,
        "provider_ref": payout.get("provider_ref") if payout else None,
        "invoice": invoice_out(invoice) if invoice else None,
    }


def _close_or_unlock(proposal_id: str) -> None:
    proposal = _proposal(proposal_id)
    milestones = store.find("milestones", {"proposal_id": proposal_id}, order_by="seq ASC")
    all_offers = store.find("offers", {"proposal_id": proposal_id})
    participating = [
        o
        for o in all_offers
        if o["status"]
        in (OfferStatus.ACCEPTED.value, OfferStatus.ACTIVE.value, OfferStatus.COMPLETED.value)
    ]
    now = store.utcnow()

    for milestone in milestones:
        settled = []
        for offer in participating:
            decision = store.find(
                "review_decisions",
                {"milestone_id": milestone["id"], "offer_id": offer["id"], "decision": "APPROVE"},
                order_by="decided_at DESC",
            )
            intent = store.find_one(
                "payment_intents", {"idempotency_key": f"payout:{milestone['id']}:{offer['id']}"}
            )
            settled.append(bool(decision) and bool(intent and intent["status"] == PaymentStatus.PAID.value))
        if participating and settled and all(settled) and milestone["status"] != MilestoneStatus.CLOSED.value:
            store.update("milestones", milestone["id"], {"status": MilestoneStatus.CLOSED.value, "updated_at": now})

    all_closed = all(
        store.get("milestones", m["id"])["status"] == MilestoneStatus.CLOSED.value
        for m in milestones
    )
    if all_closed and proposal["status"] != ProposalStatus.COMPLETED.value:
        if transitions.can("proposal", proposal["status"], ProposalStatus.COMPLETED.value):
            store.update(
                "proposals", proposal_id, {"status": ProposalStatus.COMPLETED.value, "updated_at": now}
            )
            audit.record(
                actor_id=None,
                actor_role="SYSTEM",
                action="proposal.completed",
                entity_type="proposal",
                entity_id=proposal_id,
                after={"status": ProposalStatus.COMPLETED.value},
            )

    # Unlock the next milestone whose predecessor is closed.
    for index, milestone in enumerate(milestones):
        if milestone["status"] != MilestoneStatus.FUNDED.value:
            continue
        if index == 0 or milestones[index - 1]["status"] in (
            MilestoneStatus.CLOSED.value,
            MilestoneStatus.PAID.value,
        ):
            transitions.ensure("milestone", MilestoneStatus.FUNDED.value, MilestoneStatus.IN_PROGRESS.value)
            store.update(
                "milestones", milestone["id"], {"status": MilestoneStatus.IN_PROGRESS.value, "updated_at": now}
            )
            break


# --------------------------------------------------------------------------
# Reporting
# --------------------------------------------------------------------------

def money_summary(proposal_id: str, principal: Principal) -> Dict[str, Any]:
    proposal = _proposal(proposal_id)
    if not (principal.is_ops or (principal.is_brand and principal.org_id == proposal["org_id"])):
        raise Forbidden("You cannot view this ledger.", code="LEDGER_FORBIDDEN")

    entries = [
        ledger_out(e)
        for e in store.find("ledger_entries", {"ref_type": "proposal", "ref_id": proposal_id})
    ]
    milestone_entries = []
    for m in store.find("milestones", {"proposal_id": proposal_id}):
        milestone_entries.extend(
            ledger_out(e)
            for e in store.find("ledger_entries", {"ref_type": "milestone", "ref_id": m["id"]})
        )
    entries = sorted(entries + milestone_entries, key=lambda e: e["created_at"])

    committed = sum(
        int(f["amount_minor"])
        for f in store.find("funding_commitments", {"proposal_id": proposal_id, "status": "CAPTURED"})
    )
    released = sum(
        int(e["amount_minor"])
        for e in entries
        if e["account"] == "external" and e["direction"] == "DEBIT"
    )
    invoices = [
        invoice_out(i)
        for i in store.find("invoices", {"proposal_id": proposal_id}, order_by="issued_at ASC")
    ]
    currency = proposal["currency"]
    return {
        "proposal_id": proposal_id,
        "committed_minor": committed,
        "committed": round(committed / 100.0, 2),
        "released_minor": released,
        "released": round(released / 100.0, 2),
        "remaining_minor": max(committed - released, 0),
        "remaining": round(max(committed - released, 0) / 100.0, 2),
        "currency": currency,
        "ledger": entries,
        "invoices": invoices,
    }
