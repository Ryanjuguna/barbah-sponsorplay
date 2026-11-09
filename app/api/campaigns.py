"""
Barbah SponsorPlay - Campaigns & Creator API Router
PayPal AI Hackathon - Track 02: Sponsor Play
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.models.schemas import CreatorProfile, CampaignBrief, SyndicateRecommendation, Proposal
from app.models.database import db
from app.agents.scout_agent import scout_agent
from app.agents.architect_agent import architect_agent

router = APIRouter(prefix="/api/v1/campaigns", tags=["Campaigns"])

@router.get("/creators", response_model=List[CreatorProfile])
def list_creators():
    """Returns all registered Kenyan esports creators, teams, and gaming lounges."""
    return db.get_all_creators()

@router.get("/seed", response_model=List[CampaignBrief])
def list_seed_campaigns():
    """Returns sample preloaded corporate brand briefs (Safaricom, Monster Energy)."""
    return list(db.campaigns.values())

@router.post("/brief", response_model=List[SyndicateRecommendation])
def submit_brief(brief: CampaignBrief):
    """
    Submits a campaign brief. Agent 1 (Scout) analyzes the brief and returns
    bundled Sponsorship Syndicates matching budget and demographic criteria.
    """
    if not brief.id:
        import uuid
        brief.id = f"CAMP-{uuid.uuid4().hex[:6].upper()}"
    db.save_campaign(brief)
    
    recommendations = scout_agent.analyze_brief_and_match(brief)
    return recommendations

@router.post("/proposal", response_model=Proposal)
def create_proposal(payload: Dict[str, str]):
    """
    Accepts campaign_id and syndicate_id. Agent 2 (Architect) generates the
    executable milestone contract, fee calculations, and legal agreement.
    """
    campaign_id = payload.get("campaign_id")
    syndicate_id = payload.get("syndicate_id")
    
    campaign = db.get_campaign(campaign_id)
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # Match syndicate
    syndicate = db.get_syndicate(syndicate_id)
    if not syndicate:
        recs = scout_agent.analyze_brief_and_match(campaign)
        syndicate = next((r for r in recs if r.syndicate_id == syndicate_id), recs[0])

    proposal = architect_agent.draft_proposal(campaign, syndicate)
    db.save_proposal(proposal)
    return proposal

@router.get("/proposal/{proposal_id}", response_model=Proposal)
def get_proposal(proposal_id: str):
    """Retrieves an existing proposal contract."""
    proposal = db.get_proposal(proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return proposal
