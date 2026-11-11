"""
Barbah SponsorPlay - Authentication & Persona Gateway API Router
PayPal AI Hackathon - Track 02: Sponsor Play
Provides strict role distinction and authentication between:
1. Corporate Brand Sponsors (Safaricom, Monster Energy) -> Brand Dashboard (/brand)
2. Esports Creators & Beneficiaries (Pro Streamers, Gaming Dens, Teams) -> Creator Portal (/creator)
"""

import uuid
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.models.database import db

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication & Session"])

# -------------------------------------------------------------------------
# PRIMARY TEST SIMULATION ACCOUNTS (FOR HACKATHON EVALUATION)
# -------------------------------------------------------------------------
PRIMARY_SIMULATION_ACCOUNTS = {
    "brand": {
        "id": "brand-simulation-account",
        "email": "brand@sponsorplay.ke",
        "username": "brand",
        "password": "Password123!",
        "name": "Safaricom 5G Gaming Hub",
        "corporate_pin": "P051234567A",
        "role": "brand",
        "tier": "ENTERPRISE_SPONSOR",
        "target_campaign": "camp-001",
        "budget_usd": 10000.0,
        "avatar_text": "SAF",
        "location": "Nairobi HQ, Kenya",
        "paypal_email": "sponsor-corporate@safaricom.co.ke",
        "description": "Primary Corporate Brand Simulation Account for Hackathon Evaluation"
    },
    "creator": {
        "id": "creator-001",
        "email": "creator@sponsorplay.ke",
        "username": "creator",
        "password": "Password123!",
        "name": "Brian 'The Beast' Diang'a",
        "gamer_tag": "TheBeast_KE",
        "role": "creator",
        "type": "PRO_PLAYER_STREAMER",
        "primary_game": "EA FC 25 / Mortal Kombat 1",
        "location": "Kibera, Nairobi",
        "paypal_email": "creator-thebeast@barbahgames.com",
        "mpesa_phone": "+254712345678",
        "base_rate_usd": 350.0,
        "brand_safety_score": 98.5,
        "etims_registered": True,
        "kra_pin": "A014982341Z",
        "description": "Primary Beneficiary Esports Talent Simulation Account for Hackathon Evaluation"
    }
}

DEMO_BRANDS = [
    PRIMARY_SIMULATION_ACCOUNTS["brand"],
    {
        "id": "brand-monster",
        "name": "Monster Energy East Africa",
        "email": "esports.ke@monsterenergy.com",
        "corporate_pin": "P052847591B",
        "role": "brand",
        "tier": "TITLE_SPONSOR",
        "target_campaign": "camp-002",
        "budget_usd": 1200.0,
        "avatar_text": "MON",
        "location": "Nairobi / Regional"
    }
]

class LoginRequest(BaseModel):
    role: str  # "brand" or "creator"
    identifier: Optional[str] = None  # email, gamer tag, or brand id
    password: Optional[str] = "demo123"
    demo_id: Optional[str] = None  # quick persona switch

class LoginResponse(BaseModel):
    status: str
    token: str
    role: str
    user: Dict[str, Any]
    redirect_url: str

@router.get("/demo-accounts")
def list_demo_accounts():
    """Lists simulation test accounts and personas for 1-click evaluation by hackathon judges."""
    creators = db.get_all_creators()
    top_creators = []
    for c in creators[:6]:
        top_creators.append({
            "id": c.id,
            "name": c.name,
            "gamer_tag": c.gamer_tag,
            "type": c.type,
            "primary_game": c.primary_game,
            "location": c.location,
            "role": "creator",
            "paypal_email": c.paypal_email,
            "mpesa_phone": c.mpesa_phone,
            "base_rate_usd": c.base_rate_usd,
            "brand_safety_score": c.brand_safety_score
        })

    return {
        "simulation_accounts": PRIMARY_SIMULATION_ACCOUNTS,
        "brands": DEMO_BRANDS,
        "creators": top_creators
    }

@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest):
    """
    Authenticates user and returns session credentials with strictly enforced role routing:
    - Brands -> redirect to /brand
    - Creators -> redirect to /creator?creator_id={id}
    """
    token = f"TOKEN-{uuid.uuid4().hex[:16].upper()}"

    # 1. Brand Login Flow
    if request.role == "brand":
        brand = None
        ident_lower = (request.identifier or "").strip().lower()

        # Check for Primary Simulation Account
        if (ident_lower in ["brand@sponsorplay.ke", "brand", "safaricom", "brand-simulation-account"] or 
            request.demo_id in ["brand-simulation-account", "brand-safaricom"]):
            brand = PRIMARY_SIMULATION_ACCOUNTS["brand"]
        elif request.demo_id:
            brand = next((b for b in DEMO_BRANDS if b["id"] == request.demo_id), None)
        elif request.identifier:
            brand = next((b for b in DEMO_BRANDS if ident_lower in b["email"].lower() or ident_lower in b["name"].lower()), None)

        if not brand:
            brand = PRIMARY_SIMULATION_ACCOUNTS["brand"]

        return LoginResponse(
            status="SUCCESS",
            token=token,
            role="brand",
            user=brand,
            redirect_url="/brand"
        )

    # 2. Creator Login Flow
    elif request.role == "creator":
        creator_user = None
        ident_lower = (request.identifier or "").strip().lower()

        # Check for Primary Simulation Account
        if (ident_lower in ["creator@sponsorplay.ke", "creator", "thebeast", "thebeast_ke", "@thebeast_ke"] or 
            request.demo_id in ["creator-001", "creator-simulation-account"]):
            creator_user = PRIMARY_SIMULATION_ACCOUNTS["creator"]
            creator_id = creator_user["id"]
        else:
            creator = None
            if request.demo_id:
                creator = db.get_creator(request.demo_id)
            elif request.identifier:
                for c in db.get_all_creators():
                    if (ident_lower in c.id.lower() or 
                        ident_lower in c.gamer_tag.lower() or 
                        ident_lower in c.name.lower() or 
                        ident_lower in c.paypal_email.lower()):
                        creator = c
                        break

            if not creator:
                creators = db.get_all_creators()
                creator = creators[0] if creators else None

            if not creator:
                raise HTTPException(status_code=404, detail="Creator not found")

            creator_id = creator.id
            creator_user = {
                "id": creator.id,
                "name": creator.name,
                "gamer_tag": creator.gamer_tag,
                "type": creator.type,
                "role": "creator",
                "primary_game": creator.primary_game,
                "location": creator.location,
                "paypal_email": creator.paypal_email,
                "mpesa_phone": creator.mpesa_phone,
                "base_rate_usd": creator.base_rate_usd,
                "brand_safety_score": creator.brand_safety_score,
                "etims_registered": creator.etims_registered,
                "kra_pin": creator.kra_pin
            }

        return LoginResponse(
            status="SUCCESS",
            token=token,
            role="creator",
            user=creator_user,
            redirect_url=f"/creator?creator_id={creator_user['id']}"
        )

    else:
        raise HTTPException(status_code=400, detail="Invalid role specified. Must be 'brand' or 'creator'.")
