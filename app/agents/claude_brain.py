"""
Barbah SponsorPlay - Claude Brain (Cognitive Core for Multi-Agent Swarm)
Powered by Anthropic Claude 3.5 Sonnet
"""

import json
import requests
from typing import Dict, Any, List, Optional
from app.config import settings

class ClaudeBrain:
    def __init__(self):
        self.api_key = settings.ANTHROPIC_API_KEY
        self.model = settings.CLAUDE_MODEL
        self.endpoint = "https://api.anthropic.com/v1/messages"
        self.headers = {
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json"
        }

    def is_available(self) -> bool:
        return bool(self.api_key and not self.api_key.startswith("placeholder"))

    def generate_message(
        self,
        user_prompt: str,
        system_prompt: str = "You are the cognitive multi-agent brain for Barbah SponsorPlay, an AI sponsorship marketplace for African gaming.",
        max_tokens: int = 1000,
        temperature: float = 0.2
    ) -> Optional[str]:
        """
        Sends an inference request to Anthropic Claude 3.5 Sonnet.
        """
        if not self.is_available():
            return None

        payload = {
            "model": self.model,
            "max_tokens": max_tokens,
            "temperature": temperature,
            "system": system_prompt,
            "messages": [
                {"role": "user", "content": user_prompt}
            ]
        }

        try:
            resp = requests.post(self.endpoint, headers=self.headers, json=payload, timeout=35)
            if resp.status_code == 200:
                body = resp.json()
                content = body.get("content", [])
                if content and content[0].get("type") == "text":
                    return content[0].get("text")
            else:
                print(f"[ClaudeBrain] Anthropic API returned HTTP {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"[ClaudeBrain] Connection error calling Claude: {e}")
        return None

    def reason_syndicate_selection(
        self,
        brand_name: str,
        brief_text: str,
        budget_usd: float,
        candidate_creators: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """
        Uses Claude 3.5 Sonnet to deconstruct the brief and synthesize an optimal syndicate.
        """
        system_prompt = (
            "You are Agent 1 (Talent Discovery & Micro-Syndicate Scout) for Barbah SponsorPlay in Kenya. "
            "You analyze corporate marketing briefs and recommend synergistic bundles of Kenyan gaming creators, "
            "collegiate esports teams, and grassroots gaming lounges. Output MUST be valid JSON only."
        )

        prompt = f"""
Brand Name: {brand_name}
Campaign Brief: {brief_text}
Budget: ${budget_usd:.2f} USD (KES {budget_usd * settings.USD_TO_KES_RATE:,.2f})

Available Kenyan Creators & Hubs:
{json.dumps(candidate_creators, indent=2)}

Task:
Analyze the brand's target demographic, geographic priorities (e.g., Nairobi, Eldoret, university campuses), and goals.
Select 3 synergistic candidates that best satisfy the brief within budget.
Provide a clear strategic rationale explaining why this syndicate maximizes youth reach, authenticity, and compliance under KRA Section 16.

Respond with ONLY a JSON object formatted as:
{{
  "syndicate_title": "<String>",
  "strategic_rationale": "<Detailed analysis of cultural and geographic fit>",
  "selected_creator_ids": ["<id1>", "<id2>", "<id3>"],
  "synergy_score": <Float 90.0-99.5>,
  "estimated_unique_reach": <Int>
}}
"""
        response_text = self.generate_message(prompt, system_prompt, max_tokens=2048)
        if response_text:
            try:
                # Clean potential markdown fences and grab first valid JSON block
                clean_json = response_text.strip()
                if "```json" in clean_json:
                    clean_json = clean_json.split("```json")[1].split("```")[0].strip()
                elif "```" in clean_json:
                    clean_json = clean_json.split("```")[1].split("```")[0].strip()
                
                import re
                match = re.search(r'\{[\s\S]*\}', clean_json)
                if match:
                    clean_json = match.group(0)
                return json.loads(clean_json)
            except Exception as e:
                print(f"[ClaudeBrain] Error parsing Claude JSON: {e}")
                print(f"[ClaudeBrain] Raw response was: {response_text[:300]}...")
        return None

    def reason_chat_brand_safety(
        self,
        chat_messages: List[str]
    ) -> Optional[Dict[str, Any]]:
        """
        Uses Claude's cultural understanding of Kenyan English, Swahili, and Sheng
        to accurately audit live stream chat comments.
        """
        system_prompt = (
            "You are Agent 5 (Brand Safety Guardian) for Barbah SponsorPlay in Kenya. "
            "You understand Kenyan youth gaming culture, including Swahili, Sheng (Nairobi slang), "
            "and friendly competitive trash talk vs actual hate speech, toxicity, and slurs. "
            "Output MUST be valid JSON only."
        )

        prompt = f"""
Audit the following live stream chat messages:
{json.dumps(chat_messages, indent=2)}

Task:
Evaluate whether any message contains genuine hate speech, racism, severe toxicity, or competitor sabotage.
Distinguish healthy Sheng gaming banter (e.g. 'Wueh anapiga watu vibaya sana', 'huyo ni mbaya') from actual slurs.

Respond with ONLY a JSON object:
{{
  "safety_status": "SAFE" | "WARNING" | "VIOLATION",
  "toxicity_ratio": <Float 0.0 - 1.0>,
  "clean_message_rate_percent": <Float 0.0 - 100.0>,
  "cultural_notes": "<Brief Sheng / cultural analysis>",
  "guardian_approved": true | false
}}
"""
        response_text = self.generate_message(prompt, system_prompt, max_tokens=1024)
        if response_text:
            try:
                clean_json = response_text.strip()
                if "```json" in clean_json:
                    clean_json = clean_json.split("```json")[1].split("```")[0].strip()
                elif "```" in clean_json:
                    clean_json = clean_json.split("```")[1].split("```")[0].strip()
                
                import re
                match = re.search(r'\{[\s\S]*\}', clean_json)
                if match:
                    clean_json = match.group(0)
                return json.loads(clean_json)
            except Exception as e:
                print(f"[ClaudeBrain] Error parsing Claude safety JSON: {e}")
        return None

claude_brain = ClaudeBrain()
