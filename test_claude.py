"""
Test Anthropic Claude Models
"""

import requests
from app.config import settings

models_to_test = [
    settings.CLAUDE_MODEL,
    "claude-sonnet-4-6",
    "claude-3-5-sonnet-latest",
    "claude-3-5-sonnet-20240620",
    "claude-3-haiku-20240307"
]

def test():
    print("Testing Claude Models with key:", settings.ANTHROPIC_API_KEY[:15] + "...")
    url = "https://api.anthropic.com/v1/messages"
    headers = {
        "x-api-key": settings.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
    }

    # Deduplicate while preserving order
    seen = set()
    unique_models = [m for m in models_to_test if not (m in seen or seen.add(m))]

    for m in unique_models:
        print(f"\nTrying model: {m}...")
        payload = {
            "model": m,
            "max_tokens": 100,
            "messages": [{"role": "user", "content": "Hello Claude! In 1 short sentence, introduce yourself to Barbah Games in Kenya."}]
        }
        try:
            r = requests.post(url, headers=headers, json=payload, timeout=8)
            print("Status:", r.status_code)
            if r.status_code == 200:
                print("SUCCESS! Output:", r.json()["content"][0]["text"])
                break
            else:
                print("Error:", r.text)
        except Exception as e:
            print("Conn error:", e)

if __name__ == "__main__":
    test()
