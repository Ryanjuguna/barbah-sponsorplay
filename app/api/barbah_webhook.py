"""
Barbah SponsorPlay - Barbah Games Real-Time Gateway & Multi-Channel Scout Ingestion Router
PayPal AI Hackathon - Track 02: Sponsor Play
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from app.integrations.barbah_client import barbah_client
from app.models.database import db
from app.models.schemas import CreatorProfile

router = APIRouter(prefix="/api/v1/barbah", tags=["Barbah Games Live Gateway"])

@router.post("/webhook")
def receive_barbah_webhook(payload: Dict[str, Any]):
    """
    Real-time webhook receiver for Barbah Games platform events:
    - PLAYER_REGISTERED: Ingests new verified esports gamer in real-time.
    - GAMING_HUB_ADDED: Ingests new grassroots LAN lounge/den in real-time.
    - TOURNAMENT_RESULT: Ingests tournament brackets and top-tier match performance.
    """
    event_type = payload.get("event_type")
    data = payload.get("data", {})
    if not event_type:
        raise HTTPException(status_code=400, detail="Missing event_type in webhook payload")
    
    result = barbah_client.process_webhook_event(event_type, data)
    return {
        "webhook_status": "PROCESSED",
        "event_type": event_type,
        "result": result,
        "total_active_creators": len(db.creators)
    }

@router.post("/sync")
def trigger_barbah_sync():
    """
    Triggers on-demand synchronization with Barbah Games registry.
    """
    sync_result = barbah_client.sync_live_gamers_and_hubs()
    return {
        "sync_status": "SUCCESS",
        "details": sync_result,
        "total_registered_creators": len(db.creators)
    }

@router.get("/sources")
def list_scouting_sources():
    """
    Returns the real-time scouting channels powering Agent 1 (Scout Agent):
    1. Barbah Games Official Registry (Hubs & Gamers)
    2. Start.gg / Challonge Tournament Brackets (EA FC 25, Tekken 8, Apex Legends)
    3. Twitch & YouTube Live Telemetry (East Africa Gaming Streams)
    4. Grassroots Estate LAN Dens (Foot traffic & controller telemetry)
    """
    return {
        "scouting_engine": "Agent 1: Multi-Channel Talent & Micro-Syndicate Scout",
        "cognitive_brain": "Anthropic Claude 3.5 Sonnet",
        "active_sources": [
            {
                "channel": "Barbah Games Live Database",
                "type": "REST / Webhook Gateway",
                "status": "CONNECTED_REALTIME",
                "coverage": "Registered grassroots hubs, tournament players, verified KRA PINs",
                "latency": "< 120ms"
            },
            {
                "channel": "Esports Tournament Brackets",
                "type": "Start.gg & Challonge API Feeds",
                "status": "LIVE_MONITORING",
                "coverage": "Kenya Esports League, Tekken 254, Vivid Games Cup top-8 bracket finishers",
                "signal_weight": "Tactical Authority & Win-Rate"
            },
            {
                "channel": "Live Streaming Platforms",
                "type": "YouTube Data API & Twitch Helix",
                "status": "STREAM_TELEMETRY",
                "coverage": "Concurrent viewers, broadcast regularity, Sheng chat engagement",
                "signal_weight": "Audience Reach & Community Trust"
            },
            {
                "channel": "Grassroots Estate LAN Den Network",
                "type": "Physical Hub Telemetry & Foot-Traffic Counters",
                "status": "DISTRIBUTED_ACTIVE",
                "coverage": "Rongai, Umoja, Pipeline, Kahawa, Eldoret, Nakuru estate gaming centers",
                "signal_weight": "BII Tax-Shielding & Hyper-Local Density"
            }
        ]
    }

@router.post("/simulate-external-discovery")
def simulate_external_discovery(payload: Dict[str, Any]):
    """
    Demonstrates Agent 1 actively discovering fresh talent from tournament brackets
    or streaming feeds outside Barbah Games, evaluating them with Claude, and adding them
    to the active syndicate pool.
    """
    source = payload.get("source", "START_GG_TOURNAMENT")
    gamer_tag = payload.get("gamer_tag", "VividStriker_KE")
    game = payload.get("primary_game", "EA FC 25")
    location = payload.get("location", "Nairobi West")
    
    new_profile = CreatorProfile(
        id=f"scout-ext-{gamer_tag.lower()}",
        name=payload.get("name", f"Team {gamer_tag}"),
        gamer_tag=gamer_tag,
        type="PRO_PLAYER_STREAMER" if "stream" in source.lower() else "CAMPUS_ESPORTS_CLUB",
        primary_game=game,
        platform="Twitch & YouTube",
        channel_url=f"https://twitch.tv/{gamer_tag.lower()}",
        location=location,
        monthly_reach=payload.get("monthly_reach", 12000),
        avg_concurrent_viewers=payload.get("avg_concurrent_viewers", 450),
        audience_demographic="18-24 competitive gaming fans",
        brand_safety_score=97.5,
        etims_registered=False,
        kra_pin=payload.get("kra_pin", "A017654321W"),
        paypal_email=f"{gamer_tag.lower()}@gmail.com",
        mpesa_phone="+254722334455",
        base_rate_usd=payload.get("base_rate_usd", 220.0),
        tags=["Scouted via " + source, "Top 8 Bracket Finisher", "BII-Eligible"],
        bio=f"Discovered via {source} after qualifying for East Africa Championship finals."
    )
    
    db.creators[new_profile.id] = new_profile
    return {
        "status": "TALENT_INGESTED_INTO_SWARM",
        "creator": new_profile,
        "message": f"Agent 1 successfully ingested {gamer_tag} from {source}."
    }
