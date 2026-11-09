"""
Barbah SponsorPlay - Application Configuration & Settings
PayPal AI Hackathon - Track 02: Sponsor Play
"""

import os
from pydantic import BaseModel

class Settings(BaseModel):
    # App Settings
    APP_NAME: str = "Barbah SponsorPlay"
    APP_VERSION: str = "1.0.0-hackathon-mvp"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "127.0.0.1")
    
    # Currency Conversion Rate (USD to KES)
    USD_TO_KES_RATE: float = float(os.getenv("USD_TO_KES_RATE", 130.0))
    
    # Platform Commission & Tax Rates
    PLATFORM_COMMISSION_PERCENT: float = 10.0  # 10% marketplace take rate
    KENYA_WITHHOLDING_TAX_PERCENT: float = 5.0  # 5% WHT on digital services under Kenyan tax law
    KENYA_VAT_PERCENT: float = 16.0             # 16% VAT where applicable
    
    # PayPal Sandbox Configuration
    PAYPAL_MODE: str = os.getenv("PAYPAL_MODE", "sandbox")  # sandbox or live
    PAYPAL_CLIENT_ID: str = os.getenv("PAYPAL_CLIENT_ID", "sb-barbah-hackathon-client-id")
    PAYPAL_CLIENT_SECRET: str = os.getenv("PAYPAL_CLIENT_SECRET", "sb-barbah-hackathon-client-secret")
    PAYPAL_BASE_URL: str = "https://api-m.sandbox.paypal.com" if PAYPAL_MODE == "sandbox" else "https://api-m.paypal.com"
    PAYPAL_PARTNER_ATTRIBUTION_ID: str = "BarbahGames_SponsorPlay_Marketplace"
    
    # KRA eTIMS Configuration
    ETIMS_BASE_URL: str = os.getenv("ETIMS_BASE_URL", "https://etims-sbx.kra.go.ke/api/v1")
    ETIMS_DEVICE_SERIAL: str = "VSCU-KENYA-BARBAH-001"
    BARBAH_KRA_PIN: str = "P051982736Z"
    BARBAH_BUSINESS_NAME: str = "Barbah Games Limited"

settings = Settings()
