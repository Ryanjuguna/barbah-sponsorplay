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
from app.agents.vision_engine import vision_engine

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

@router.post("/analyze-frame")
def analyze_stream_frame(payload: Dict[str, Any]):
    """
    Direct endpoint for OpenCV Computer Vision analysis:
    Runs logo bounding box localization, screen area occupancy ratio,
    draws glowing tactical bounding box, and saves annotated proof image.
    """
    brand_name = payload.get("brand_name", "Safaricom")
    scenario = payload.get("scenario", "PASS")  # PASS, LOW_OCCUPANCY
    frame_path = payload.get("frame_path")

    if not frame_path:
        frame_path = vision_engine.generate_synthetic_esports_frame(brand_name=brand_name, scenario=scenario)

    cv_result = vision_engine.analyze_frame(frame_path, brand_name=brand_name)
    return {
        "status": "ANALYSIS_COMPLETE",
        "engine": "OpenCV v5.0.0 Real-Time Vision Pipeline",
        "metrics": cv_result
    }

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
