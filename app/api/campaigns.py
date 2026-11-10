"""
Barbah SponsorPlay - Campaigns & Creator API Router
PayPal AI Hackathon - Track 02: Sponsor Play
"""

import uuid
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any, Optional
from app.models.schemas import (
    CreatorProfile, CampaignBrief, SyndicateRecommendation,
    Proposal, BriefDeconstructionResult
)
from app.models.database import db
from app.agents.scout_agent import scout_agent
from app.agents.architect_agent import architect_agent

router = APIRouter(prefix="/api/v1/campaigns", tags=["Campaigns"])

@router.get("/creators", response_model=List[CreatorProfile])
def list_creators():
    """Returns all registered Kenyan esports creators, teams, and gaming lounges."""
    return db.get_all_creators()

@router.get("/creators/{creator_id}", response_model=CreatorProfile)
def get_creator_detail(creator_id: str):
    """Retrieves an individual creator profile."""
    creator = db.get_creator(creator_id)
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    return creator

@router.get("/seed", response_model=List[CampaignBrief])
def list_seed_campaigns():
    """Returns sample preloaded corporate brand briefs (Safaricom, Monster Energy)."""
    return list(db.campaigns.values())

@router.post("/deconstruct", response_model=BriefDeconstructionResult)
def deconstruct_brief(brief: CampaignBrief):
    """
    Submits a campaign brief for Agent 1 unified cognitive deconstruction.
    Returns:
    1. AI Strategic Analysis with verdict & recommendation
    2. Bundled Syndicates
    3. Top Solo Creator Matches
    """
    if not brief.id:
        brief.id = f"CAMP-{uuid.uuid4().hex[:6].upper()}"
    db.save_campaign(brief)
    return scout_agent.deconstruct_brief_and_match(brief)

@router.post("/brief", response_model=List[SyndicateRecommendation])
def submit_brief(brief: CampaignBrief):
    """
    Submits a campaign brief. Agent 1 (Scout) analyzes the brief and returns
    bundled Sponsorship Syndicates matching budget and demographic criteria.
    """
    if not brief.id:
        brief.id = f"CAMP-{uuid.uuid4().hex[:6].upper()}"
    db.save_campaign(brief)
    
    recommendations = scout_agent.analyze_brief_and_match(brief)
    return recommendations

@router.post("/proposal", response_model=Proposal)
def create_proposal(payload: Dict[str, Any]):
    """
    Accepts campaign_id and EITHER syndicate_id (for bundled sponsorship)
    OR creator_id (for solo individual creator sponsorship).
    Extracts optional beneficiary email(s) and dispatches automated proposal notifications.
    Agent 2 (Architect) generates the executable milestone contract and fee splits.
    """
    campaign_id = payload.get("campaign_id")
    syndicate_id = payload.get("syndicate_id")
    creator_id = payload.get("creator_id")
    
    # Extract recipient emails
    raw_email = payload.get("beneficiary_email") or payload.get("beneficiary_notification_email")
    beneficiary_emails: List[str] = []
    if raw_email:
        beneficiary_emails = [e.strip() for e in str(raw_email).split(",") if "@" in e]
    elif payload.get("beneficiary_emails"):
        beneficiary_emails = [e.strip() for e in payload.get("beneficiary_emails") if "@" in e]

    campaign = db.get_campaign(campaign_id)
    if not campaign:
        # Create a default campaign on the fly if not yet submitted
        campaign = CampaignBrief(
            id=f"CAMP-{uuid.uuid4().hex[:6].upper()}",
            brand_name=payload.get("brand_name", "Safaricom 5G Gaming"),
            corporate_pin="P051234567A",
            brief="Direct creator sponsorship contract",
            target_audience="Youth Gamers",
            budget_usd=payload.get("budget_usd", 350.0)
        )
        db.save_campaign(campaign)

    # 1. Solo Creator Sponsorship
    if creator_id:
        creator = db.get_creator(creator_id)
        if not creator:
            raise HTTPException(status_code=404, detail=f"Creator {creator_id} not found")
        proposal = architect_agent.draft_solo_proposal(campaign, creator, beneficiary_emails=beneficiary_emails)
        db.save_proposal(proposal)
        return proposal

    # 2. Syndicate Bundle Sponsorship
    syndicate = db.get_syndicate(syndicate_id)
    if not syndicate:
        recs = scout_agent.analyze_brief_and_match(campaign)
        syndicate = next((r for r in recs if r.syndicate_id == syndicate_id), recs[0])

    proposal = architect_agent.draft_proposal(campaign, syndicate, beneficiary_emails=beneficiary_emails)
    db.save_proposal(proposal)
    return proposal

@router.get("/proposal/{proposal_id}", response_model=Proposal)
def get_proposal(proposal_id: str):
    """Retrieves an existing proposal contract."""
    proposal = db.get_proposal(proposal_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return proposal
