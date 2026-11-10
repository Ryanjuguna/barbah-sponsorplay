"""
Barbah SponsorPlay - Financial Milestone Ledger & Tax Invoicing API Router
PayPal AI Hackathon - Track 02: Sponsor Play
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from app.models.schemas import Proposal, eTIMSInvoice
from app.models.database import db
from app.agents.financial_agent import financial_agent
from app.integrations.paypal_client import paypal_client

router = APIRouter(prefix="/api/v1/payments", tags=["Payments & Invoicing"])

@router.post("/create-milestone-order")
@router.post("/create-escrow-order")
def create_escrow_order(payload: Dict[str, str]):
    """
    Triggers Agent 4 to create a PayPal Orders v2 multiparty transaction.
    Commits funds into programmatic milestone ledger and generates Barbah Platform Fee eTIMS invoice (prototype).
    """
    proposal_id = payload.get("proposal_id")
    proposal = db.get_proposal(proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    order_resp = financial_agent.initialize_escrow_order(proposal)
    proposal.status = "APPROVED_BY_SPONSOR"
    db.save_proposal(proposal)

    order_id = order_resp.get("id") or f"PAYPAL-ORD-{proposal.id}"
    approval_url = ""
    for link in order_resp.get("links", []):
        if link.get("rel") == "approve":
            approval_url = link.get("href", "")
            break

    return {
        "status": "ORDER_CREATED",
        "proposal_id": proposal.id,
        "order_id": order_id,
        "approval_url": approval_url,
        "gross_amount": float(proposal.total_budget_usd),
        "platform_fee": float(proposal.platform_fee_usd),
        "disbursement_mode": "DELAYED",
        "paypal_order": order_resp
    }

@router.post("/capture-order/{order_id}")
@router.post("/capture/{order_id}")
def capture_order(order_id: str):
    """
    Simulates or executes PayPal Order Capture, committing milestone funds into the ledger.
    """
    order_data = db.paypal_orders.get(order_id)
    if not order_data:
        # Fallback to the latest active proposal if order record was keyed differently
        latest_prop = next(iter(db.proposals.values()), None)
        order_data = {
            "order": {"id": order_id},
            "proposal_id": latest_prop.id if latest_prop else "PROP-DEFAULT",
            "escrow_status": "COMMITTED_IN_LEDGER"
        }
        db.paypal_orders[order_id] = order_data

    capture_resp = paypal_client.capture_order(order_id)
    order_data["escrow_status"] = "COMMITTED_IN_LEDGER"
    order_data["capture"] = capture_resp

    # Update proposal milestones to COMMITTED_IN_LEDGER
    proposal = db.get_proposal(order_data["proposal_id"])
    if proposal:
        proposal.status = "FUNDED"
        for m in proposal.milestones:
            m.status = "COMMITTED_IN_LEDGER"
        db.save_proposal(proposal)

    return {
        "status": "MILESTONES_COMMITTED",
        "order_id": order_id,
        "escrow_state": "COMMITTED_IN_LEDGER",
        "capture_details": capture_resp
    }

@router.post("/disburse-milestone")
def disburse_milestone(payload: Dict[str, str]):
    """
    Releases verified milestone funds from the programmatic milestone ledger.
    Agent 4 generates a prototype eTIMS invoice (BII) and executes PayPal Payout.
    """
    proposal_id = payload.get("proposal_id")
    milestone_id = payload.get("milestone_id")
    cert_id = payload.get("certificate_id")
    override_recipient_email = payload.get("recipient_email") or payload.get("override_recipient_email")

    certificate = db.get_certificate(cert_id)
    if not certificate:
        raise HTTPException(status_code=404, detail="Proof of Play Certificate not found")

    try:
        disbursement_result = financial_agent.release_milestone_funds(
            proposal_id=proposal_id,
            milestone_id=milestone_id,
            certificate=certificate,
            override_recipient_email=override_recipient_email
        )
        return disbursement_result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/invoices", response_model=List[eTIMSInvoice])
def list_invoices():
    """Returns all generated KRA eTIMS tax invoices with QR codes."""
    return list(db.invoices.values())

@router.get("/invoices/{cu_invoice_number}", response_model=eTIMSInvoice)
def get_invoice(cu_invoice_number: str):
    """Retrieves an individual KRA eTIMS tax invoice by Control Unit Number."""
    inv = db.get_invoice(cu_invoice_number)
    if not inv:
        raise HTTPException(status_code=404, detail="eTIMS invoice not found")
    return inv
