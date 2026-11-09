"""
Barbah SponsorPlay - Agent 5: Real-Time Brand Safety & Live Chat Guardian Agent
PayPal AI Hackathon - Track 02: Sponsor Play
"""

from typing import List, Dict, Any
from app.agents.claude_brain import claude_brain

class GuardianAgent:
    def __init__(self):
        self.name = "Real-Time Brand Safety & Live Chat Guardian Agent"
        self.version = "2.0.0-claude-enhanced"
        self.toxic_lexicon = ["hate", "racist", "scam", "trash", "fraud", "fake"]

    def audit_live_stream_chat(
        self,
        chat_messages: List[str],
        competitor_brands: List[str] = ["Airtel", "Telkom", "Red Bull"]
    ) -> Dict[str, Any]:
        """
        Audits live stream chat and speech for brand safety violations,
        hate speech, and direct competitor product collisions.
        Uses Claude Sonnet cultural Sheng/Swahili reasoning if available,
        with fast deterministic fallback.
        """
        # Try Claude cognitive cultural analysis
        claude_audit = claude_brain.reason_chat_brand_safety(chat_messages)
        if claude_audit:
            competitor_mentions = []
            for msg in chat_messages:
                for comp in competitor_brands:
                    if comp.lower() in msg.lower():
                        competitor_mentions.append(comp)
            
            claude_audit["competitor_collisions_detected"] = list(set(competitor_mentions))
            claude_audit["action_required"] = "None. Environment verified by Claude cultural brain." if claude_audit.get("guardian_approved") else "Flagged for moderator review."
            return claude_audit

        # Fast deterministic fallback
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
