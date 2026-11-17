"""
Barbah SponsorPlay - WordPress CMS Content API Router
PayPal AI Hackathon - Track 02: Sponsor Play
"""

from fastapi import APIRouter
from typing import Dict, Any, List
from app.integrations.wordpress_client import wp_client
from app.models.database import db

router = APIRouter(prefix="/api/v1/cms", tags=["WordPress Content Hub"])

@router.get("/overview")
def get_cms_overview() -> Dict[str, Any]:
    """Returns aggregated WordPress content metrics and connection status."""
    posts = wp_client.get_all_posts()
    creators = wp_client.get_creators_and_lounges()
    campaigns = wp_client.get_campaigns()
    impact = wp_client.get_impact_stories()

    return {
        "status": "ONLINE",
        "source": "WordPress Studio (sponsorpay)",
        "total_posts": len(posts),
        "creators_count": len(creators),
        "campaigns_count": len(campaigns),
        "impact_stories_count": len(impact),
        "posts": posts
    }

@router.get("/creators")
def get_cms_creators() -> List[Dict[str, Any]]:
    """Returns WordPress-managed gaming lounges, clubs, and esports squads."""
    return wp_client.get_creators_and_lounges()

@router.get("/campaigns")
def get_cms_campaigns() -> List[Dict[str, Any]]:
    """Returns WordPress-managed campaign briefs and preset activations."""
    return wp_client.get_campaigns()

@router.get("/impact")
def get_cms_impact() -> List[Dict[str, Any]]:
    """Returns published ESG, community, and KRA tax case studies."""
    return wp_client.get_impact_stories()

@router.post("/sync")
def sync_cms_creators_to_scout():
    """Syncs WordPress creators into Agent 1 Scout talent graph."""
    wp_client.sync_to_creator_registry(db)
    return {
        "status": "SYNCED",
        "total_creators_in_registry": len(db.creators),
        "synced_from_wordpress": len(wp_client.get_creators_and_lounges())
    }
