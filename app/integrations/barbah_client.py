"""
Barbah SponsorPlay - Barbah Games Real-Time Gateway & Webhook Connector
Direct real-time integration with Barbah Games' Hub & Gamer Registry.
"""

import time
import requests
from typing import Dict, Any, List
from app.config import settings
from app.models.schemas import CreatorProfile
from app.models.database import db

class BarbahGamesClient:
    def __init__(self):
        self.base_url = settings.BARBAH_API_BASE_URL
        self.partner_key = settings.BARBAH_PARTNER_KEY
        self.headers = {
            "Authorization": f"Bearer {self.partner_key}",
            "Content-Type": "application/json"
        }

    def sync_live_gamers_and_hubs(self) -> Dict[str, Any]:
        """
        Attempts real-time REST sync from Barbah Games live server.
        Falls back to active seed graph if offline.
        """
        try:
            resp = requests.get(f"{self.base_url}/gamers", headers=self.headers, timeout=3.0)
            if resp.status_code == 200:
                gamers_data = resp.json().get("gamers", [])
                for g in gamers_data:
                    c = CreatorProfile(**g)
                    db.creators[c.id] = c
                return {"status": "SYNCED_LIVE", "count": len(gamers_data)}
        except Exception:
            pass

        return {
            "status": "LOCAL_REGISTRY_ACTIVE",
            "active_hubs_count": sum(1 for c in db.creators.values() if "DEN" in c.type or "HUB" in c.type or "CAMPUS" in c.type),
            "registered_players_count": len(db.creators)
        }

    def process_webhook_event(self, event_type: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Real-time webhook listener: receives instant events from Barbah Games backend
        when a player joins, enters a tournament, or a new gaming hub is opened.
        """
        if event_type == "PLAYER_REGISTERED":
            new_creator = CreatorProfile(
                id=f"barbah-gamer-{int(time.time())}",
                name=data.get("name", "New Barbah Gamer"),
                gamer_tag=data.get("gamer_tag", "Player_KE"),
                type=data.get("type", "PRO_PLAYER_STREAMER"),
                primary_game=data.get("primary_game", "EA FC 25"),
                platform=data.get("platform", "YouTube Live"),
                channel_url=data.get("channel_url", "https://youtube.com/@barbah_gamer"),
                location=data.get("location", "Nairobi"),
                monthly_reach=data.get("monthly_reach", 5000),
                avg_concurrent_viewers=data.get("avg_concurrent_viewers", 350),
                audience_demographic="16-24 urban gaming youth",
                brand_safety_score=95.0,
                etims_registered=data.get("etims_registered", False),
                kra_pin=data.get("kra_pin", "A019999999Z"),
                paypal_email=data.get("paypal_email", "gamer@barbahgames.com"),
                mpesa_phone=data.get("mpesa_phone", "+254700000000"),
                base_rate_usd=data.get("base_rate_usd", 150.0),
                tags=["Barbah Registered", "Tournament Verified"],
                bio=data.get("bio", "Verified competitive esports gamer registered on Barbah Games.")
            )
            db.creators[new_creator.id] = new_creator
            return {"status": "PLAYER_INGESTED_REALTIME", "player_id": new_creator.id}

        elif event_type == "GAMING_HUB_ADDED":
            hub_creator = CreatorProfile(
                id=f"barbah-hub-{int(time.time())}",
                name=data.get("hub_name", "Barbah Community Hub"),
                gamer_tag=data.get("hub_tag", "Barbah_Hub_KE"),
                type="GRASSROOTS_GAMING_DEN",
                primary_game="EA FC 25 / Tekken",
                platform="Physical Lounge & Discord",
                channel_url=data.get("channel_url", "https://barbahgames.com/hubs"),
                location=data.get("location", "Nairobi"),
                monthly_reach=data.get("monthly_reach", 8000),
                avg_concurrent_viewers=data.get("avg_concurrent_viewers", 400),
                audience_demographic="Grassroots estate gaming density",
                brand_safety_score=96.0,
                etims_registered=False,
                kra_pin=data.get("kra_pin", "P058888888Z"),
                paypal_email=data.get("paypal_email", "hub@barbahgames.com"),
                mpesa_phone=data.get("mpesa_phone", "+254711111111"),
                base_rate_usd=120.0,
                tags=["Barbah Certified Hub", "Grassroots", "BII-Eligible"],
                bio=f"Barbah Games certified grassroots gaming hub in {data.get('location', 'Nairobi')}."
            )
            db.creators[hub_creator.id] = hub_creator
            return {"status": "HUB_INGESTED_REALTIME", "hub_id": hub_creator.id}

        return {"status": "EVENT_ACKNOWLEDGED", "event_type": event_type}

barbah_client = BarbahGamesClient()
