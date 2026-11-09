"""
Barbah SponsorPlay - Financial Escrow & Tax Invoicing API Router
PayPal AI Hackathon - Track 02: Sponsor Play
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from app.models.schemas import Proposal, eTIMSInvoice
from app.models.database import db
from app.agents.financial_agent import financial_agent
from app.integrations.paypal_client import paypal_client

router = APIRouter(prefix="/api/v1/payments", tags=["Payments & Invoicing"])

@router.post("/create-escrow-order")
def create_escrow_order(payload: Dict[str, str]):
    """
    Triggers Agent 4 to create a PayPal Orders v2 multiparty transaction.
    Locks funds in milestone escrow and generates Barbah Platform Fee eTIMS invoice.
    """
    proposal_id = payload.get("proposal_id")
    proposal = db.get_proposal(proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    order_resp = financial_agent.initialize_escrow_order(proposal)
    proposal.status = "APPROVED_BY_SPONSOR"
    db.save_proposal(proposal)

    return {
        "status": "ORDER_CREATED",
        "proposal_id": proposal.id,
        "paypal_order": order_resp
    }

@router.post("/capture-order/{order_id}")
def capture_order(order_id: str):
    """
    Simulates or executes PayPal Order Capture, transitioning escrow status to FUNDED.
    """
    order_data = db.paypal_orders.get(order_id)
    if not order_data:
        raise HTTPException(status_code=404, detail="PayPal Order not found")

    capture_resp = paypal_client.capture_order(order_id)
    order_data["escrow_status"] = "FUNDED_IN_ESCROW"
    order_data["capture"] = capture_resp

    # Update proposal milestones to FUNDED_IN_ESCROW
    proposal = db.get_proposal(order_data["proposal_id"])
    if proposal:
        proposal.status = "FUNDED"
        for m in proposal.milestones:
            m.status = "FUNDED_IN_ESCROW"
        db.save_proposal(proposal)

    return {
        "status": "ESCROW_LOCKED",
        "order_id": order_id,
        "escrow_state": "FUNDED_IN_ESCROW",
        "capture_details": capture_resp
    }

@router.post("/disburse-milestone")
def disburse_milestone(payload: Dict[str, str]):
    """
    Releases verified milestone funds from escrow.
    Agent 4 generates certified KRA eTIMS invoice (BII) and executes PayPal Payout.
    """
    proposal_id = payload.get("proposal_id")
    milestone_id = payload.get("milestone_id")
    cert_id = payload.get("certificate_id")

    certificate = db.get_certificate(cert_id)
    if not certificate:
        raise HTTPException(status_code=404, detail="Proof of Play Certificate not found")

    try:
        disbursement_result = financial_agent.release_milestone_funds(
            proposal_id=proposal_id,
            milestone_id=milestone_id,
            certificate=certificate
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
