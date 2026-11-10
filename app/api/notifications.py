"""
Barbah SponsorPlay - Notifications & Beneficiary Email Router
PayPal AI Hackathon - Track 02: Sponsor Play
"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.models.schemas import EmailDispatchRecord
from app.models.database import db
from app.services.email_service import email_service
from app.config import settings

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])

class ResendEmailRequest(BaseModel):
    proposal_id: str
    recipients: List[str]
    custom_note: Optional[str] = None

class SmtpConfigRequest(BaseModel):
    smtp_server: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str
    smtp_password: str
    sender_name: str = "Barbah SponsorPlay"
    sender_email: str = "proposals@barbahgames.com"

@router.get("/emails", response_model=List[EmailDispatchRecord])
def list_dispatched_emails():
    """Lists all proposal emails dispatched to creators, team captains, and sponsors."""
    return db.get_all_emails()

@router.get("/emails/{email_id}", response_model=EmailDispatchRecord)
def get_email_record(email_id: str):
    """Retrieves full details of a specific email dispatch."""
    email = db.get_email(email_id)
    if not email:
        raise HTTPException(status_code=404, detail="Email record not found")
    return email

@router.get("/email-preview/{email_id}", response_class=HTMLResponse)
def preview_email_html(email_id: str):
    """Renders the exact formatted HTML email delivered to the beneficiary."""
    email = db.get_email(email_id)
    if not email:
        raise HTTPException(status_code=404, detail="Email record not found")
    return HTMLResponse(content=email.rendered_html)

@router.post("/resend", response_model=EmailDispatchRecord)
def resend_proposal_email(req: ResendEmailRequest):
    """
    Re-sends or forwards an existing sponsorship proposal to additional teammates or test inboxes.
    """
    proposal = db.get_proposal(req.proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail=f"Proposal {req.proposal_id} not found")

    record = email_service.send_proposal_email(
        proposal=proposal,
        override_recipients=req.recipients,
        custom_note=req.custom_note
    )
    return record

@router.post("/configure-smtp")
def configure_smtp(config: SmtpConfigRequest):
    """
    Dynamically configures live SMTP credentials for real-world delivery (e.g. via Gmail App Password).
    """
    settings.SMTP_SERVER = config.smtp_server
    settings.SMTP_PORT = config.smtp_port
    settings.SMTP_USERNAME = config.smtp_username
    settings.SMTP_PASSWORD = config.smtp_password
    settings.SMTP_SENDER_NAME = config.sender_name
    settings.SMTP_SENDER_EMAIL = config.sender_email
    
    email_service.smtp_server = config.smtp_server
    email_service.smtp_port = config.smtp_port
    email_service.smtp_username = config.smtp_username
    email_service.smtp_password = config.smtp_password
    email_service.sender_name = config.sender_name
    email_service.sender_email = config.sender_email

    return {
        "status": "SMTP_CONFIGURED",
        "server": config.smtp_server,
        "port": config.smtp_port,
        "username": config.smtp_username[:4] + "***" if config.smtp_username else "",
        "message": "Live SMTP credentials updated successfully."
    }
