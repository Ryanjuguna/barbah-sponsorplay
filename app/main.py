"""
Barbah SponsorPlay - Main FastAPI Application
PayPal AI Hackathon - Track 02: Sponsor Play
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import settings
from app.integrations.paypal_client import paypal_client
from app.api.campaigns import router as campaigns_router
from app.api.payments import router as payments_router
from app.api.verification import router as verification_router
from app.api.impact import router as impact_router
from app.api.barbah_webhook import router as barbah_router
from app.api.scout_radar import router as radar_router
from app.api.notifications import router as notifications_router
from app.api.creator_portal import router as creator_router
from app.api.auth import router as auth_router

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Agentic AI Sponsorship Marketplace with PayPal Programmatic Milestone Ledger & KRA eTIMS Tax Compliance for African Gaming.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for cross-origin dashboard access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(campaigns_router)
app.include_router(payments_router)
app.include_router(verification_router)
app.include_router(impact_router)
app.include_router(barbah_router)
app.include_router(radar_router)
app.include_router(notifications_router)
app.include_router(creator_router)
app.include_router(auth_router)

# Mount Static Assets Directory
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

@app.get("/")
@app.get("/login")
def serve_login():
    """Serves the primary Authentication & Role Selection Gateway (first page entry point)."""
    login_file = os.path.join(STATIC_DIR, "login.html")
    if os.path.exists(login_file):
        return FileResponse(login_file)
    return {"app": settings.APP_NAME, "page": "LOGIN_GATEWAY"}

@app.get("/brand")
@app.get("/dashboard")
@app.get("/sponsor")
def serve_brand_dashboard():
    """Serves the interactive Corporate Brand / Sponsor single-page dashboard."""
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "ONLINE",
        "documentation": "/docs"
    }

@app.get("/creator")
def serve_creator():
    """Serves the interactive Beneficiary / Creator Portal."""
    creator_file = os.path.join(STATIC_DIR, "creator.html")
    if os.path.exists(creator_file):
        return FileResponse(creator_file)
    index_file = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
    return {
        "app": settings.APP_NAME,
        "role": "CREATOR_PORTAL",
        "status": "ONLINE"
    }

@app.get("/health")
@app.get("/api/health")
@app.get("/api/v1/health")
def health_check():
    return {
        "status": "HEALTHY",
        "app": settings.APP_NAME,
        "paypal_mode": settings.PAYPAL_MODE,
        "etims_device": settings.ETIMS_DEVICE_SERIAL
    }

@app.get("/api/paypal/mode")
def paypal_mode():
    """Reports whether PayPal calls are hitting a live sandbox or a simulated fallback."""
    return {"mode": paypal_client.mode()}
