"""
Barbah SponsorPlay - Application Settings & Configuration
PayPal AI Hackathon - Track 02: Sponsor Play
"""

import os
from pydantic import BaseModel
from dotenv import load_dotenv

# Load local environment variables from .env file
load_dotenv()

class Settings(BaseModel):
    APP_NAME: str = "Barbah SponsorPlay"
    APP_VERSION: str = "2.0.0-hackathon-final"
    ENV: str = os.getenv("ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    HOST: str = os.getenv("HOST", "127.0.0.1")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # Financial Configuration
    USD_TO_KES_RATE: float = float(os.getenv("USD_TO_KES_RATE", "130.0"))
    PLATFORM_COMMISSION_PERCENT: float = 10.0  # 10% marketplace take rate
    KENYA_WITHHOLDING_TAX_PERCENT: float = 5.0  # 5% WHT on digital services under Kenyan tax law
    KENYA_VAT_PERCENT: float = 16.0             # 16% VAT where applicable
    
    # PayPal Sandbox Configuration
    PAYPAL_MODE: str = os.getenv("PAYPAL_MODE", "sandbox")  # sandbox or live
    PAYPAL_CLIENT_ID: str = os.getenv("PAYPAL_CLIENT_ID", "")
    PAYPAL_CLIENT_SECRET: str = os.getenv("PAYPAL_CLIENT_SECRET", "")
    PAYPAL_BASE_URL: str = "https://api-m.sandbox.paypal.com" if os.getenv("PAYPAL_MODE", "sandbox") == "sandbox" else "https://api-m.paypal.com"
    PAYPAL_PARTNER_ATTRIBUTION_ID: str = "BarbahGames_SponsorPlay_Marketplace"
    
    # Anthropic Claude Configuration (Cognitive Brain for Multi-Agent Swarm)
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    CLAUDE_MODEL: str = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")

    # Barbah Games Live Gateway Configuration
    BARBAH_API_BASE_URL: str = os.getenv("BARBAH_API_BASE_URL", "https://api.barbahgames.com/v1")
    BARBAH_PARTNER_KEY: str = os.getenv("BARBAH_PARTNER_KEY", "barbah_partner_sponsorplay_live")
    
    # KRA eTIMS Configuration
    ETIMS_BASE_URL: str = os.getenv("ETIMS_BASE_URL", "https://etims-sbx.kra.go.ke/api/v1")
    ETIMS_DEVICE_SERIAL: str = "VSCU-KENYA-BARBAH-001"
    BARBAH_KRA_PIN: str = "P051982736Z"
    BARBAH_BUSINESS_NAME: str = "Barbah Games Limited"

    # Beneficiary Notification Service (Email & SMTP)
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("SMTP_USERNAME", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SMTP_SENDER_NAME: str = os.getenv("SMTP_SENDER_NAME", "Barbah SponsorPlay")
    SMTP_SENDER_EMAIL: str = os.getenv("SMTP_SENDER_EMAIL", "proposals@barbahgames.com")
    BENEFICIARY_DEFAULT_EMAIL: str = os.getenv("BENEFICIARY_DEFAULT_EMAIL", "team@barbahgames.com")

settings = Settings()
