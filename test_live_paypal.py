"""
Barbah SponsorPlay - Live PayPal Sandbox Handshake Test
Validates live Client ID & Secret against api-m.sandbox.paypal.com
"""

import requests
import json
from app.config import settings

def test_live_handshake():
    print("=" * 70)
    print("TESTING LIVE PAYPAL SANDBOX HANDSHAKE")
    print(f"Client ID: {settings.PAYPAL_CLIENT_ID[:8]}...{settings.PAYPAL_CLIENT_ID[-8:]}")
    print(f"Base URL:  {settings.PAYPAL_BASE_URL}")
    print("=" * 70)

    # 1. OAuth2 Token Request
    print("\n[1] Requesting OAuth2 Access Token from PayPal Sandbox...")
    token_url = f"{settings.PAYPAL_BASE_URL}/v1/oauth2/token"
    auth = (settings.PAYPAL_CLIENT_ID, settings.PAYPAL_CLIENT_SECRET)
    headers = {
        "Accept": "application/json",
        "Accept-Language": "en_US"
    }
    data = {"grant_type": "client_credentials"}

    try:
        resp = requests.post(token_url, auth=auth, headers=headers, data=data, timeout=10)
        print(f"  --> HTTP Status: {resp.status_code}")
        if resp.status_code != 200:
            print(f"  [!] Failed: {resp.text}")
            return False

        token_data = resp.json()
        access_token = token_data.get("access_token")
        expires_in = token_data.get("expires_in")
        app_id = token_data.get("app_id")
        scope = token_data.get("scope")

        print(f"  [+] SUCCESS: OAuth2 Token Received!")
        print(f"      - App ID: {app_id}")
        print(f"      - Token Expiry: {expires_in} seconds (~{expires_in // 3600} hour)")
        print(f"      - Token: {access_token[:15]}...{access_token[-10:]}")
        print(f"      - Scopes: {scope}")

    except Exception as e:
        print(f"  [!] Connection error: {e}")
        return False

    # 2. Test Real Orders v2 Creation
    print("\n[2] Testing Live Order Creation via Orders v2 API...")
    order_url = f"{settings.PAYPAL_BASE_URL}/v2/checkout/orders"
    order_headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {access_token}",
        "PayPal-Partner-Attribution-Id": settings.PAYPAL_PARTNER_ATTRIBUTION_ID
    }
    order_payload = {
        "intent": "CAPTURE",
        "purchase_units": [
            {
                "reference_id": "SP-LIVE-TEST-001",
                "description": "Barbah SponsorPlay: Safaricom 5G Youth Campaign Test",
                "amount": {
                    "currency_code": "USD",
                    "value": "769.23"
                }
            }
        ],
        "application_context": {
            "brand_name": "Barbah SponsorPlay",
            "locale": "en-KE",
            "landing_page": "BILLING",
            "user_action": "PAY_NOW",
            "return_url": "http://127.0.0.1:8000/payment/success",
            "cancel_url": "http://127.0.0.1:8000/payment/cancel"
        }
    }

    try:
        order_resp = requests.post(order_url, headers=order_headers, json=order_payload, timeout=10)
        print(f"  --> HTTP Status: {order_resp.status_code}")
        if order_resp.status_code in (200, 201):
            order = order_resp.json()
            order_id = order.get("id")
            status = order.get("status")
            approve_url = next((l["href"] for l in order.get("links", []) if l["rel"] == "approve"), None)

            print(f"  [+] SUCCESS: Real PayPal Sandbox Order Created!")
            print(f"      - Live Order ID: {order_id}")
            print(f"      - Status: {status}")
            print(f"      - Live Sandbox Approval URL: {approve_url}")
            print("\n" + "=" * 70)
            print(">>> LIVE PAYPAL SANDBOX INTEGRATION FULLY OPERATIONAL! <<<")
            print("=" * 70)
            return True
        else:
            print(f"  [!] Order creation returned: {order_resp.text}")
            return False

    except Exception as e:
        print(f"  [!] Order connection error: {e}")
        return False

if __name__ == "__main__":
    test_live_handshake()
