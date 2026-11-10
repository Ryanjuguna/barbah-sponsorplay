"""
Barbah SponsorPlay - Multi-Channel Scouting Radar API Router
PayPal AI Hackathon - Track 02: Sponsor Play
"""

from fastapi import APIRouter
from typing import Dict, Any
from app.agents.scout_radar import scout_radar

router = APIRouter(prefix="/api/v1/radar", tags=["Scouting Radar"])

@router.get("/overview")
def get_radar_overview() -> Dict[str, Any]:
    """Returns aggregated intelligence across all 4 scouting radar feeds."""
    return scout_radar.get_radar_overview()

@router.get("/streams")
def get_live_streams():
    """Channel 1: Twitch Helix & YouTube Live Crawler Feed with Bot Inflation Detection."""
    return scout_radar.get_live_streams_telemetry()

@router.get("/brackets")
def get_tournament_brackets():
    """Channel 2: Start.gg & Challonge Tournament Standings."""
    return scout_radar.get_tournament_brackets()

@router.get("/webhooks")
def get_community_webhooks():
    """Channel 3: Discord Bot & WhatsApp Cloud Webhooks from Clan Captains."""
    return scout_radar.get_community_webhooks_feed()

@router.get("/social-clips")
def get_social_clips():
    """Channel 4: Short-Form Social Clip Radar (X/Twitter & TikTok with Sheng Sentiment)."""
    return scout_radar.get_social_clips_radar()
