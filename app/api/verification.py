"""
Barbah SponsorPlay - Multimodal Verification & Brand Safety API Router
PayPal AI Hackathon - Track 02: Sponsor Play
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from app.models.schemas import DeliverableSubmission, ProofOfPlayCertificate
from app.models.database import db
from app.agents.verification_agent import verification_agent
from app.agents.guardian_agent import guardian_agent

router = APIRouter(prefix="/api/v1/verification", tags=["Verification & Safety"])

@router.post("/submit-deliverable", response_model=ProofOfPlayCertificate)
def submit_deliverable(submission: DeliverableSubmission):
    """
    Ingests live stream VOD or media evidence.
    Agent 3 runs Computer Vision & Audio Whisper STT.
    Returns cryptographic Proof-of-Play certificate.
    """
    certificate = verification_agent.verify_deliverable(submission)
    db.save_certificate(certificate)
    return certificate

@router.get("/certificate/{certificate_id}", response_model=ProofOfPlayCertificate)
def get_certificate(certificate_id: str):
    """Retrieves an existing Proof-of-Play Certificate."""
    cert = db.get_certificate(certificate_id)
    if not cert:
        raise HTTPException(status_code=404, detail="Proof of Play Certificate not found")
    return cert

@router.post("/chat-audit")
def audit_chat_stream(payload: Dict[str, Any]):
    """
    Agent 5 (Live Guardian) audits live stream chat messages for toxicity and competitor collisions.
    """
    messages = payload.get("messages", [])
    competitors = payload.get("competitors", ["Airtel", "Telkom"])
    return guardian_agent.audit_live_stream_chat(messages, competitors)
