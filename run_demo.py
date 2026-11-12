"""
Barbah SponsorPlay - Local Demo Server Runner
PayPal AI Hackathon - Track 02: Sponsor Play
"""

import uvicorn
from app.config import settings

def main():
    host = getattr(settings, "HOST", "127.0.0.1")
    port = int(getattr(settings, "PORT", 8000))

    print("=" * 75)
    print("STARTING BARBAH SPONSORPLAY DEMO SERVER")
    print("PayPal AI Hackathon - Track 02: Sponsor Play")
    print(f"Platform: {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"1. Entry Point / Login Gateway:  http://{host}:{port}/ (or /login)")
    print(f"2. Corporate Brand Dashboard:     http://{host}:{port}/brand")
    print(f"3. Beneficiary Creator Studio:    http://{host}:{port}/creator")
    print(f"4. FastAPI Interactive Docs:      http://{host}:{port}/docs")
    print("--- SIMULATION TEST ACCOUNTS ---")
    print("  Brand Sponsor: brand@sponsorplay.ke   | Password123! -> /brand")
    print("  Esports Talent: creator@sponsorplay.ke | Password123! -> /creator")
    print("Postman Collection: postman/SponsorPlay_API_Collection.json")
    print("=" * 75)
    
    reload_mode = bool(settings.DEBUG and settings.ENV == "development")
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload_mode
    )

if __name__ == "__main__":
    main()
