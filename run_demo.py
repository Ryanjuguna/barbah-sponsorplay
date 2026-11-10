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
    print(f"Local Interactive Dashboard: http://{host}:{port}")
    print(f"FastAPI Interactive Swagger Docs: http://{host}:{port}/docs")
    print("Postman Collection Path: postman/SponsorPlay_API_Collection.json")
    print("=" * 75)
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=True
    )

if __name__ == "__main__":
    main()
