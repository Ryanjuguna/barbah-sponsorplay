"""
Barbah SponsorPlay - Main FastAPI Application
PayPal AI Hackathon - Track 02: Sponsor Play
"""

import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, Response

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
from app.api.cms import router as cms_router
from app.api.workflow import router as workflow_router
from app.workflow.errors import DomainError
from app.integrations.wordpress_client import wp_client
from app.models.database import db

# Initial sync of WordPress Studio lounges and creators into talent registry
try:
    wp_client.sync_to_creator_registry(db)
except Exception:
    pass

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
app.include_router(cms_router)
app.include_router(workflow_router)


@app.exception_handler(DomainError)
async def domain_error_handler(request: Request, exc: DomainError):
    return JSONResponse(status_code=exc.status_code, content=exc.as_dict())

# Mount Static Assets Directory
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Mount React Frontend Build (Dhamini SPA)
FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend", "dist")
FRONTEND_INDEX = os.path.join(FRONTEND_DIST, "index.html")
FRONTEND_ASSETS = os.path.join(FRONTEND_DIST, "assets")

if os.path.exists(FRONTEND_ASSETS):
    app.mount("/assets", StaticFiles(directory=FRONTEND_ASSETS), name="assets")

@app.get("/favicon.svg")
def serve_favicon():
    fav = os.path.join(FRONTEND_DIST, "favicon.svg")
    if os.path.exists(fav):
        return FileResponse(fav, media_type="image/svg+xml")
    return Response(status_code=404)

@app.get("/icons.svg")
def serve_icons():
    icons = os.path.join(FRONTEND_DIST, "icons.svg")
    if os.path.exists(icons):
        return FileResponse(icons, media_type="image/svg+xml")
    return Response(status_code=404)

def get_frontend_or_fallback(fallback_file: str):
    if os.path.exists(FRONTEND_INDEX):
        return FileResponse(FRONTEND_INDEX)
    f = os.path.join(STATIC_DIR, fallback_file)
    if os.path.exists(f):
        return FileResponse(f)
    return None

@app.get("/")
@app.get("/login")
def serve_login():
    """Serves the primary Authentication & Role Selection Gateway (first page entry point)."""
    res = get_frontend_or_fallback("login.html")
    if res:
        return res
    return {"app": settings.APP_NAME, "page": "LOGIN_GATEWAY"}

@app.get("/brand")
@app.get("/dashboard")
@app.get("/sponsor")
@app.get("/brand/brief")
@app.get("/brand/campaigns")
@app.get("/brand/tax")
def serve_brand_dashboard():
    """Serves the interactive Corporate Brand / Sponsor dashboard."""
    res = get_frontend_or_fallback("index.html")
    if res:
        return res
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "ONLINE",
        "documentation": "/docs"
    }

@app.get("/creator")
@app.get("/creator/offers")
@app.get("/creator/deliverables")
@app.get("/creator/certificates")
def serve_creator():
    """Serves the interactive Beneficiary / Creator Portal."""
    res = get_frontend_or_fallback("creator.html")
    if res:
        return res
    return {
        "app": settings.APP_NAME,
        "role": "CREATOR_PORTAL",
        "status": "ONLINE"
    }

@app.get("/prototype/brand")
def serve_prototype_brand():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))

@app.get("/prototype/creator")
def serve_prototype_creator():
    return FileResponse(os.path.join(STATIC_DIR, "creator.html"))

@app.get("/prototype/login")
def serve_prototype_login():
    return FileResponse(os.path.join(STATIC_DIR, "login.html"))

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


# --------------------------------------------------------------------------
# SPA fallback
#
# Client-side routes (/offer/:token, /ops, /brand/campaigns/:id, ...) must serve
# the React shell on a direct load. This is deliberately last so it never
# shadows an API route.
# --------------------------------------------------------------------------

_RESERVED_PREFIXES = (
    "api/",
    "static/",
    "assets/",
    "docs",
    "redoc",
    "openapi.json",
)


@app.get("/{full_path:path}")
def spa_fallback(full_path: str):
    if full_path.startswith(_RESERVED_PREFIXES):
        return JSONResponse({"detail": "Not found"}, status_code=404)
    res = get_frontend_or_fallback("index.html")
    if res:
        return res
    return JSONResponse({"detail": "Not found"}, status_code=404)
