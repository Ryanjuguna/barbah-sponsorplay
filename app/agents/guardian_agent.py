"""
Barbah SponsorPlay - Agent 5: Real-Time Brand Safety & Live Chat Guardian Agent
PayPal AI Hackathon - Track 02: Sponsor Play
"""

from typing import List, Dict, Any

class GuardianAgent:
    def __init__(self):
        self.name = "Real-Time Brand Safety & Live Chat Guardian Agent"
        self.version = "1.0.0"
        self.toxic_lexicon = ["hate", "racist", "scam", "trash", "fraud", "fake"]

    def audit_live_stream_chat(
        self,
        chat_messages: List[str],
        competitor_brands: List[str] = ["Airtel", "Telkom", "Red Bull"]
    ) -> Dict[str, Any]:
        """
        Audits live stream chat and speech for brand safety violations,
        hate speech, and direct competitor product collisions.
        """
        toxic_count = 0
        competitor_mentions = []

        for msg in chat_messages:
            msg_lower = msg.lower()
            if any(term in msg_lower for term in self.toxic_lexicon):
                toxic_count += 1
            for comp in competitor_brands:
                if comp.lower() in msg_lower:
                    competitor_mentions.append(comp)

        total_msgs = len(chat_messages) or 1
        toxicity_ratio = toxic_count / total_msgs

        if toxicity_ratio > 0.05:
            status = "WARNING"
            action_required = "15-minute creator remediation window triggered via webhook."
        elif len(competitor_mentions) > 3:
            status = "COMPETITOR_COLLISION"
            action_required = "Competitor brand clash flagged for moderation review."
        else:
            status = "SAFE"
            action_required = "None. Brand environment clean."

        return {
            "safety_status": status,
            "toxicity_ratio": round(toxicity_ratio, 4),
            "clean_message_rate_percent": round((1.0 - toxicity_ratio) * 100.0, 2),
            "competitor_collisions_detected": list(set(competitor_mentions)),
            "action_required": action_required,
            "guardian_approved": status == "SAFE"
        }

guardian_agent = GuardianAgent()
