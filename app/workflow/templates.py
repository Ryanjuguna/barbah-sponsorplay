"""Draft content that Agent 2 proposes and the brand edits.

These are starting points, not decisions. Every field is editable in the
proposal editor, which is the whole point of the draft step.
"""

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List


def _due(days: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()


def default_milestones(currency: str = "USD") -> List[Dict[str, Any]]:
    return [
        {
            "seq": 1,
            "title": "Mobilisation & brand asset integration",
            "description": (
                "Overlay configured, brand assets applied, and the campaign announced on the "
                "creator's own channels."
            ),
            "weight": 30,
            "due_at": _due(14),
            "evidence_requirements": [
                {
                    "key": "overlay_screenshot",
                    "label": "Overlay screenshots",
                    "kind": "IMAGE",
                    "required": True,
                    "min_count": 2,
                    "accepted_types": ["image/png", "image/jpeg"],
                    "instructions": "One wide shot and one close-up of the brand overlay.",
                },
                {
                    "key": "announcement_post",
                    "label": "Announcement post link",
                    "kind": "URL",
                    "required": True,
                    "accepted_hosts": [
                        "x.com", "twitter.com", "tiktok.com", "instagram.com",
                        "youtube.com", "discord.com",
                    ],
                    "instructions": "A public post announcing the campaign.",
                },
            ],
            "acceptance_criteria": [
                "Brand overlay is clearly legible",
                "Announcement post is public and live",
                "No competitor branding visible",
            ],
        },
        {
            "seq": 2,
            "title": "Live broadcast & airtime",
            "description": (
                "Live esports broadcast with continuous sponsor placement and verbal callouts."
            ),
            "weight": 40,
            "due_at": _due(30),
            "evidence_requirements": [
                {
                    "key": "stream_vod_url",
                    "label": "Stream VOD link",
                    "kind": "URL",
                    "required": True,
                    "accepted_hosts": ["youtube.com", "twitch.tv", "kick.com", "tiktok.com"],
                    "instructions": "Public or unlisted link. Private links cannot be verified.",
                },
                {
                    "key": "overlay_screenshot",
                    "label": "Overlay screenshots",
                    "kind": "IMAGE",
                    "required": True,
                    "min_count": 2,
                    "accepted_types": ["image/png", "image/jpeg"],
                    "instructions": "Captured during the live broadcast.",
                },
                {
                    "key": "platform_analytics",
                    "label": "Platform analytics export",
                    "kind": "FILE",
                    "required": False,
                    "accepted_types": ["application/pdf", "text/csv", "image/png"],
                    "instructions": "Concurrent viewers and watch time from the platform dashboard.",
                },
            ],
            "acceptance_criteria": [
                "Broadcast ran for the agreed duration",
                "Brand overlay visible throughout",
                "Verbal callouts delivered",
                "No competitor branding visible",
            ],
        },
        {
            "seq": 3,
            "title": "Highlights & performance reporting",
            "description": (
                "Short-form highlights published and audience performance exported."
            ),
            "weight": 30,
            "due_at": _due(45),
            "evidence_requirements": [
                {
                    "key": "clip_urls",
                    "label": "Published clip links",
                    "kind": "URL",
                    "required": True,
                    "min_count": 2,
                    "accepted_hosts": ["tiktok.com", "instagram.com", "youtube.com"],
                    "instructions": "At least two published vertical clips.",
                },
                {
                    "key": "analytics_export",
                    "label": "Analytics export",
                    "kind": "FILE",
                    "required": True,
                    "accepted_types": ["application/pdf", "text/csv", "image/png"],
                    "instructions": "Views, watch time and demographics from the platform.",
                },
            ],
            "acceptance_criteria": [
                "Clips are published and public",
                "Analytics cover the campaign window",
            ],
        },
    ]


def default_legal_clauses(currency: str = "USD") -> List[str]:
    return [
        "1. SCOPE: The creator delivers the milestones described in this agreement. "
        "Changes after signing require a written change order.",
        "2. PAYMENT: Each milestone is paid after the creator submits the required evidence "
        "and Barbah ops approves it. Payment is not automatic on upload.",
        "3. VERIFICATION: Evidence is stored with a content hash. AI-assisted checks are "
        "advisory; a human reviewer makes the approval decision.",
        "4. TAX (PROTOTYPE): Tax documents in this environment are simulated and are not valid "
        "KRA tax invoices.",
        "5. FUNDING: Campaign funds are held as a committed balance by SponsorPlay and released "
        "per approved milestone. This is not a licensed escrow arrangement.",
        "6. BRAND SAFETY: The creator agrees not to promote competing brands for the duration "
        "of the campaign.",
    ]
