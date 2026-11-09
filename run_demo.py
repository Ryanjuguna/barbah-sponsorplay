"""
Barbah SponsorPlay - Local Demo Server Runner
PayPal AI Hackathon - Track 02: Sponsor Play
"""

import uvicorn
from app.config import settings

def main():
    print("=" * 75)
    print("STARTING BARBAH SPONSORPLAY DEMO SERVER")
    print("PayPal AI Hackathon - Track 02: Sponsor Play")
    print(f"Platform: {settings.APP_NAME} v{settings.APP_VERSION}")
    print(f"Local Interactive Dashboard: http://{settings.HOST}:{settings.PORT}")
    print(f"FastAPI Interactive Swagger Docs: http://{settings.HOST}:{settings.PORT}/docs")
    print(f"Postman Collection Path: postman/SponsorPlay_API_Collection.json")
    print("=" * 75)
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )

if __name__ == "__main__":
    main()
