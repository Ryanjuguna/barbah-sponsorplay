"""
Barbah SponsorPlay - Multimodal Verification & Brand Safety API Router
PayPal AI Hackathon - Track 02: Sponsor Play
"""

from fastapi import APIRouter, HTTPException
import base64
import os
import uuid
from typing import Dict, Any, List
from app.models.schemas import DeliverableSubmission, ProofOfPlayCertificate
from app.models.database import db
from app.agents.verification_agent import verification_agent
from app.agents.guardian_agent import guardian_agent
from app.agents.vision_engine import vision_engine, PROOFS_DIR
from app.agents.claude_brain import claude_brain

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
    Supports preset scenarios, existing frame paths, or user-uploaded base64 images.
    """
    brand_name = payload.get("brand_name", "Safaricom")
    scenario = payload.get("scenario", "PASS")  # PASS, LOW_OCCUPANCY
    frame_path = payload.get("frame_path")
    image_base64 = payload.get("image_base64")

    if image_base64:
        try:
            # Strip data URL header e.g. "data:image/jpeg;base64,"
            if "," in image_base64:
                image_base64 = image_base64.split(",", 1)[1]
            raw_bytes = base64.b64decode(image_base64)
            safe_name = f"upload_{uuid.uuid4().hex[:8]}.jpg"
            frame_path = os.path.join(PROOFS_DIR, safe_name)
            with open(frame_path, "wb") as f:
                f.write(raw_bytes)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 image data: {e}")

    if not frame_path or not os.path.exists(frame_path):
        frame_path = vision_engine.generate_synthetic_esports_frame(brand_name=brand_name, scenario=scenario)

    cv_result = vision_engine.analyze_frame(frame_path, brand_name=brand_name)
    return {
        "status": "ANALYSIS_COMPLETE",
        "engine": "OpenCV v5.0.0 Real-Time Vision Pipeline",
        "metrics": cv_result
    }

@router.post("/audit-venue")
def audit_venue_activation(payload: Dict[str, Any]):
    """
    Direct endpoint for Anthropic Claude 3.5 Sonnet Multimodal Vision analysis:
    Audits physical tournament venue photos, roll-up banners, and IRL campus derbies.
    Evaluates physical banner authenticity, digital tampering/Photoshop check,
    competitor clash exclusion, and attendee community engagement.
    """
    brand_name = payload.get("brand_name", "Safaricom")
    scenario = payload.get("scenario", "PASS")  # PASS, COMPETITOR_CLASH
    frame_path = payload.get("frame_path")
    image_base64 = payload.get("image_base64")
    context_notes = payload.get("context_notes", "")

    if image_base64:
        try:
            if "," in image_base64:
                image_base64_clean = image_base64.split(",", 1)[1]
            else:
                image_base64_clean = image_base64
            raw_bytes = base64.b64decode(image_base64_clean)
            safe_name = f"venue_upload_{uuid.uuid4().hex[:8]}.jpg"
            frame_path = os.path.join(PROOFS_DIR, safe_name)
            with open(frame_path, "wb") as f:
                f.write(raw_bytes)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid base64 image data: {e}")

    if not frame_path or not os.path.exists(frame_path):
        frame_path = vision_engine.generate_synthetic_venue_photo(brand_name=brand_name, scenario=scenario)

    audit_result = claude_brain.audit_multimodal_deliverable(
        image_base64_or_path=frame_path,
        brand_name=brand_name,
        deliverable_type="VENUE_PHOTO",
        context_notes=context_notes
    )

    proof_image_filename = os.path.basename(frame_path)
    return {
        "status": "ANALYSIS_COMPLETE",
        "engine": "Anthropic Claude 3.5 Sonnet Multimodal Vision",
        "proof_image_url": f"/static/proofs/{proof_image_filename}",
        "metrics": audit_result
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
