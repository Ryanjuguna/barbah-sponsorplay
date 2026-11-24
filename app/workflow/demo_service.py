"""Demo reset and seeded scenarios.

A reset must be fast and deterministic: the same clicks produce the same
story every time. Scenarios are built through the real services, so the demo
exercises the same code path as a live user.
"""

import io
from typing import Any, Dict, List, Optional

from app.workflow import campaign_service, evidence_service, offer_service, proposal_service, store
from app.workflow.auth import Principal
from app.workflow.payment_service import capture_funding, create_funding_intent


def _brand(org_id: str = "org-safaricom") -> Principal:
    return Principal(
        user_id="user-brand-safaricom" if org_id == "org-safaricom" else "user-brand-apex",
        email="brand@sponsorplay.ke",
        name="Safaricom Brand Team",
        role="BRAND_ADMIN",
        org_id=org_id,
    )


def _ops() -> Principal:
    return Principal(
        user_id="user-ops",
        email="ops@sponsorplay.ke",
        name="Barbah Ops",
        role="OPS_ADMIN",
        org_id=None,
    )


def _creator(creator_id: str) -> Principal:
    creator = store.get("creators", creator_id) or {}
    return Principal(
        user_id=f"user-{creator_id}",
        email=offer_service.creator_email(creator) if creator else f"{creator_id}@creators.sponsorplay.ke",
        name=creator.get("name") or creator_id,
        role="CREATOR",
        org_id=None,
        creator_id=creator_id,
    )


def _link_for_offer(proposal_id: str, offer_id: str) -> Optional[str]:
    for notification in store.find(
        "notifications", {"ref_type": "proposal", "ref_id": proposal_id}
    ):
        payload = store.loads(notification.get("body"), {}) or {}
        if payload.get("offer_id") == offer_id and payload.get("link"):
            return payload["link"]
    return None


def _token_from_link(link: str) -> str:
    return link.rsplit("/offer/", 1)[-1]


def _demo_image(label: str, width: int = 1280, height: int = 720) -> bytes:
    from PIL import Image, ImageDraw

    image = Image.new("RGB", (width, height), color=(38, 34, 29))
    draw = ImageDraw.Draw(image)
    draw.rectangle([40, 40, width - 40, 120], fill=(180, 85, 45))
    draw.text((60, 66), f"SPONSORPLAY · {label}", fill=(255, 253, 249))
    draw.rectangle([40, 160, width - 40, height - 40], outline=(180, 85, 45), width=4)
    draw.text((60, 190), "Simulated proof-of-play frame", fill=(230, 222, 208))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def _satisfy_evidence(milestone_id: str, creator_id: str) -> None:
    principal = _creator(creator_id)
    milestone = store.get("milestones", milestone_id)
    requirements = store.loads(milestone.get("evidence_requirements_json"), []) or []
    for requirement in requirements:
        if not requirement.get("required", True):
            continue
        count = int(requirement.get("min_count") or 1)
        for index in range(count):
            if requirement.get("kind") == "URL":
                evidence_service.add_evidence(
                    milestone_id=milestone_id,
                    principal=principal,
                    requirement_key=requirement["key"],
                    kind="URL",
                    url="https://youtube.com/watch?v=demo-proof-of-play",
                )
            else:
                evidence_service.add_evidence(
                    milestone_id=milestone_id,
                    principal=principal,
                    requirement_key=requirement["key"],
                    kind=requirement.get("kind") or "FILE",
                    filename=f"{requirement['key']}_{index + 1}.png",
                    content_type="image/png",
                    data=_demo_image(requirement.get("label") or requirement["key"]),
                )


def seed_scenario(name: str = "review_pending") -> Dict[str, Any]:
    brand = _brand()
    campaign = campaign_service.create_campaign(
        brand,
        {
            "brief": (
                "Sponsor a live EA FC and Tekken tournament series for the 5G Home Gaming push. "
                "Target university and informal-settlement players in Nairobi."
            ),
            "target_audience": "16-28 urban gamers",
            "objective": "Drive 5G Home Gaming awareness",
            "kpi": "3 live broadcasts, 2 highlight clips, 1.2M impressions",
            "geography": "Nairobi",
            "budget": 1200,
            "currency": "USD",
        },
    )
    matches = campaign_service.latest_matches(campaign["id"], brand)
    syndicate = matches["syndicates"][0] if matches["syndicates"] else None

    proposal = proposal_service.create_draft(
        brand,
        campaign["id"],
        {"syndicate_id": syndicate["id"] if syndicate else None},
    )
    proposal_service.submit_for_approval(proposal["id"], brand)
    proposal_service.approve(proposal["id"], brand)
    proposal = proposal_service.send(proposal["id"], brand)

    for offer in proposal["offers"]:
        link = offer.get("magic_link") or _link_for_offer(proposal["id"], offer["id"])
        if link:
            offer_service.accept(_token_from_link(link), {"full_name": offer["creator"]["name"]})

    intent = create_funding_intent(brand, proposal["id"])
    capture_funding(brand, intent["id"])

    if name in ("review_pending", "syndicate_live"):
        first = store.find("milestones", {"proposal_id": proposal["id"]}, order_by="seq ASC")[0]
        offers = store.find("offers", {"proposal_id": proposal["id"]})
        # Evidence is per creator, so every participant uploads before any of
        # them submits: submit() locks the submission awaiting review.
        for offer in offers:
            _satisfy_evidence(first["id"], offer["creator_id"])
        for offer in offers:
            evidence_service.submit(first["id"], _creator(offer["creator_id"]))

    return {
        "scenario": name,
        "campaign_id": campaign["id"],
        "proposal_id": proposal["id"],
        "offers": len(proposal["offers"]),
    }


def reset(scenario: Optional[str] = None) -> Dict[str, Any]:
    store.reset()
    seeded = None
    if scenario:
        seeded = seed_scenario(scenario)
    return {"reset": True, "scenario": seeded, "counts": state()}


def state() -> Dict[str, Any]:
    tables = [
        "orgs", "users", "creators", "campaigns", "syndicates", "proposals",
        "milestones", "offers", "evidence", "verification_reports",
        "review_decisions", "funding_commitments", "ledger_entries", "invoices",
        "payment_intents", "payouts", "notifications", "audit_events",
    ]
    return {table: store.scalar(f"SELECT COUNT(*) FROM {table}") for table in tables}
