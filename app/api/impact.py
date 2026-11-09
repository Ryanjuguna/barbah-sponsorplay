"""
Barbah SponsorPlay - MetaTwin ESG & Social Impact API Router
PayPal AI Hackathon - Track 02: Sponsor Play
"""

from fastapi import APIRouter, HTTPException
from app.models.schemas import MetaTwinReport
from app.models.database import db
from app.agents.impact_agent import impact_agent

router = APIRouter(prefix="/api/v1/impact", tags=["MetaTwin ESG Impact"])

@router.get("/metatwin/{proposal_id}", response_model=MetaTwinReport)
def get_metatwin_report(proposal_id: str):
    """
    Agent 6 generates a C-Suite ESG and Youth Development Impact Dossier
    verifying community empowerment, gender inclusion, and economic distribution.
    """
    proposal = db.get_proposal(proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    report = impact_agent.generate_impact_dossier(proposal)
    return report
