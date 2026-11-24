"""Campaigns and the Agent 1 match run.

The matcher here is deterministic on purpose: the demo must work with no API
key and no network. When a model is available it can enrich the rationale, but
the ranking itself stays explainable — every score is arithmetic a brand can
audit.
"""

from typing import Any, Dict, List, Optional

from app.workflow import audit, store
from app.workflow.auth import Principal
from app.workflow.errors import Forbidden, NotFound, ValidationFailed
from app.workflow.money import to_minor
from app.workflow.security import new_id
from app.workflow.serializers import campaign_out, creator_out, syndicate_out

MATCH_AGENT_VERSION = "1.0.0-heuristic"


# --------------------------------------------------------------------------
# Access helpers
# --------------------------------------------------------------------------

def get_campaign_row(campaign_id: str) -> Dict[str, Any]:
    row = store.get("campaigns", campaign_id)
    if not row:
        raise NotFound("Campaign not found.", code="CAMPAIGN_NOT_FOUND")
    return row


def assert_can_read(row: Dict[str, Any], principal: Principal) -> None:
    if principal.is_ops:
        return
    if principal.is_brand and principal.org_id == row.get("org_id"):
        return
    raise Forbidden("You do not have access to this campaign.", code="CAMPAIGN_FORBIDDEN")


def assert_can_write(row: Dict[str, Any], principal: Principal) -> None:
    if not principal.is_brand or principal.org_id != row.get("org_id"):
        raise Forbidden("You cannot edit this campaign.", code="CAMPAIGN_FORBIDDEN")


# --------------------------------------------------------------------------
# Creators
# --------------------------------------------------------------------------

def list_creators() -> List[Dict[str, Any]]:
    return [creator_out(c) for c in store.find("creators", order_by="name ASC")]


def get_creator_row(creator_id: str) -> Dict[str, Any]:
    row = store.get("creators", creator_id)
    if not row:
        raise NotFound("Creator not found.", code="CREATOR_NOT_FOUND")
    return row


# --------------------------------------------------------------------------
# Campaign CRUD
# --------------------------------------------------------------------------

def create_campaign(principal: Principal, payload: Dict[str, Any]) -> Dict[str, Any]:
    org_id = principal.require_org()
    org = store.get("orgs", org_id)
    now = store.utcnow()
    currency = (payload.get("currency") or "USD").upper()
    budget_minor = to_minor(payload.get("budget") or 0, currency)
    if budget_minor <= 0:
        raise ValidationFailed("Budget must be greater than zero.", field="budget")

    row = {
        "id": new_id("camp"),
        "org_id": org_id,
        "brand_name": payload.get("brand_name") or (org["name"] if org else "Brand"),
        "brief_text": payload.get("brief") or "",
        "target_audience": payload.get("target_audience"),
        "objective": payload.get("objective"),
        "kpi": payload.get("kpi"),
        "geography": payload.get("geography") or "Nairobi",
        "budget_minor": budget_minor,
        "currency": currency,
        "starts_at": payload.get("starts_at"),
        "ends_at": payload.get("ends_at"),
        "status": "MATCHING",
        "created_at": now,
        "updated_at": now,
    }
    store.insert("campaigns", row)
    audit.record(
        actor_id=principal.user_id,
        actor_role=principal.role,
        action="campaign.created",
        entity_type="campaign",
        entity_id=row["id"],
        after={"brand_name": row["brand_name"], "budget_minor": budget_minor, "currency": currency},
    )

    run_matching(row)
    row = get_campaign_row(row["id"])
    store.update("campaigns", row["id"], {"status": "MATCHED", "updated_at": store.utcnow()})
    return campaign_out(get_campaign_row(row["id"]))


def list_campaigns(principal: Principal) -> List[Dict[str, Any]]:
    if principal.is_ops:
        rows = store.find("campaigns", order_by="created_at DESC")
    else:
        org_id = principal.require_org()
        rows = store.find("campaigns", {"org_id": org_id}, order_by="created_at DESC")
    return [campaign_out(r) for r in rows]


def get_campaign(campaign_id: str, principal: Principal) -> Dict[str, Any]:
    row = get_campaign_row(campaign_id)
    assert_can_read(row, principal)
    return campaign_out(row)


def update_campaign(campaign_id: str, principal: Principal, payload: Dict[str, Any]) -> Dict[str, Any]:
    row = get_campaign_row(campaign_id)
    assert_can_write(row, principal)
    before = campaign_out(row)

    updates: Dict[str, Any] = {"updated_at": store.utcnow()}
    mapping = {
        "brand_name": "brand_name",
        "brief": "brief_text",
        "target_audience": "target_audience",
        "objective": "objective",
        "kpi": "kpi",
        "geography": "geography",
        "starts_at": "starts_at",
        "ends_at": "ends_at",
    }
    for source, column in mapping.items():
        if source in payload and payload[source] is not None:
            updates[column] = payload[source]
    if payload.get("budget") is not None:
        currency = payload.get("currency") or row["currency"]
        updates["budget_minor"] = to_minor(payload["budget"], currency)
        updates["currency"] = currency.upper()

    store.update("campaigns", campaign_id, updates)
    audit.record(
        actor_id=principal.user_id,
        actor_role=principal.role,
        action="campaign.updated",
        entity_type="campaign",
        entity_id=campaign_id,
        before=before,
        after=campaign_out(get_campaign_row(campaign_id)),
    )
    return campaign_out(get_campaign_row(campaign_id))


# --------------------------------------------------------------------------
# Matching
# --------------------------------------------------------------------------

def _score(creator: Dict[str, Any], geography: Optional[str]) -> float:
    safety = float(creator.get("brand_safety_score") or 0) / 100.0
    reach = min(float(creator.get("monthly_reach") or 0) / 25000.0, 1.0)
    location = 1.0 if geography and geography.lower() in (creator.get("location") or "").lower() else 0.5
    return round((safety * 0.4 + reach * 0.4 + location * 0.2) * 100, 1)


def _rationale(creator: Dict[str, Any], campaign: Dict[str, Any]) -> str:
    return (
        f"{creator['name']} reaches about {int(creator.get('monthly_reach') or 0):,} people a month "
        f"from {creator.get('location')}, with a brand-safety score of "
        f"{float(creator.get('brand_safety_score') or 0):.1f}. "
        f"Type: {(creator.get('type') or '').replace('_', ' ').title()}."
    )


def run_matching(campaign: Dict[str, Any]) -> Dict[str, Any]:
    creators = store.find("creators", order_by="name ASC")
    budget = int(campaign["budget_minor"])
    geography = campaign.get("geography")

    scored = sorted(
        ((c, _score(c, geography)) for c in creators),
        key=lambda pair: pair[1],
        reverse=True,
    )

    affordable = [(c, s) for c, s in scored if int(c["base_rate_minor"]) <= budget]
    if not affordable:
        cheapest = min(creators, key=lambda c: int(c["base_rate_minor"]), default=None)
        affordable = [(cheapest, _score(cheapest, geography))] if cheapest else []

    # Build a syndicate that fits the budget.
    syndicate_members: List[Dict[str, Any]] = []
    running = 0
    for creator, _ in affordable:
        rate = int(creator["base_rate_minor"])
        if running + rate <= budget and len(syndicate_members) < 3:
            syndicate_members.append(creator)
            running += rate
    if not syndicate_members and affordable:
        syndicate_members = [affordable[0][0]]
        running = int(affordable[0][0]["base_rate_minor"])

    now = store.utcnow()
    syndicate_id = new_id("syn")
    total_reach = sum(int(c.get("monthly_reach") or 0) for c in syndicate_members)
    store.insert(
        "syndicates",
        {
            "id": syndicate_id,
            "campaign_id": campaign["id"],
            "title": f"{campaign['brand_name']} · bundled syndicate",
            "rationale": (
                "Bundled for complementary audiences and a shared budget ceiling. "
                "The brand can remove or add creators before drafting the proposal."
            ),
            "expected_reach": total_reach,
            "status": "DRAFT",
            "created_at": now,
        },
    )
    weights = [int(c["base_rate_minor"]) for c in syndicate_members]
    weight_sum = sum(weights) or 1
    for creator, weight in zip(syndicate_members, weights):
        store.insert(
            "syndicate_members",
            {
                "id": new_id("synm"),
                "syndicate_id": syndicate_id,
                "creator_id": creator["id"],
                "role_in_syndicate": (creator.get("type") or "").replace("_", " ").title(),
                "allocation_pct": round(100.0 * weight / weight_sum, 2),
                "created_at": now,
            },
        )

    solo = []
    for creator, score in affordable[:5]:
        solo.append(
            {
                "creator": creator_out(creator),
                "match_score": score,
                "match_rationale": _rationale(creator, campaign),
                "total_cost_minor": int(creator["base_rate_minor"]),
                "total_cost": round(int(creator["base_rate_minor"]) / 100.0, 2),
                "currency": creator.get("currency") or "USD",
            }
        )

    analysis = {
        "target_summary": campaign.get("target_audience") or "Youth gaming audience",
        "detected_intent": "SYNDICATE" if len(syndicate_members) > 1 else "SOLO",
        "recommended_path": "SYNDICATE" if len(syndicate_members) > 1 else "SOLO",
        "recommendation_title": (
            f"{len(syndicate_members)}-creator syndicate"
            if len(syndicate_members) > 1
            else "Single creator"
        ),
        "verdict_rationale": (
            "A bundle spreads reach across complementary audiences while staying inside the "
            "budget ceiling. This is a recommendation, not a decision."
        ),
        "syndicate_score": round(
            sum(s for c, s in affordable if c["id"] in {m["id"] for m in syndicate_members})
            / max(len(syndicate_members), 1),
            1,
        ),
        "solo_score": solo[0]["match_score"] if solo else 0,
        "reach_comparison": {
            "syndicate_reach": total_reach,
            "solo_reach": int(solo[0]["creator"]["monthly_reach"]) if solo else 0,
        },
        "limitations": [
            "Scores are derived from seeded profile data, not live platform analytics.",
            "Audience overlap between creators is not yet deduplicated.",
        ],
    }

    run_id = new_id("match")
    store.insert(
        "match_runs",
        {
            "id": run_id,
            "campaign_id": campaign["id"],
            "agent_version": MATCH_AGENT_VERSION,
            "model": "heuristic-fallback",
            "result_json": store.dumps(
                {"analysis": analysis, "syndicate_id": syndicate_id, "solo_matches": solo}
            ),
            "created_at": now,
        },
    )
    return {"run_id": run_id, "syndicate_id": syndicate_id, "analysis": analysis, "solo_matches": solo}


def latest_matches(campaign_id: str, principal: Principal) -> Dict[str, Any]:
    campaign = get_campaign_row(campaign_id)
    assert_can_read(campaign, principal)

    runs = store.find(
        "match_runs", {"campaign_id": campaign_id}, order_by="created_at DESC", limit=1
    )
    if not runs:
        run = run_matching(campaign)
        runs = store.find(
            "match_runs", {"campaign_id": campaign_id}, order_by="created_at DESC", limit=1
        )
    run = runs[0]
    result = store.loads(run["result_json"], {})
    syndicate_ids = [
        s["id"] for s in store.find("syndicates", {"campaign_id": campaign_id})
    ]
    return {
        "id": run["id"],
        "campaign_id": campaign_id,
        "agent_version": run.get("agent_version"),
        "model": run.get("model"),
        "created_at": run["created_at"],
        "analysis": result.get("analysis", {}),
        "syndicates": [syndicate_out(store.get("syndicates", sid)) for sid in syndicate_ids if store.get("syndicates", sid)],
        "solo_matches": result.get("solo_matches", []),
    }


def patch_syndicate(
    campaign_id: str, syndicate_id: str, principal: Principal, payload: Dict[str, Any]
) -> Dict[str, Any]:
    campaign = get_campaign_row(campaign_id)
    assert_can_write(campaign, principal)
    syndicate = store.get("syndicates", syndicate_id)
    if not syndicate or syndicate["campaign_id"] != campaign_id:
        raise NotFound("Syndicate not found.", code="SYNDICATE_NOT_FOUND")

    for creator_id in payload.get("remove_creator_ids") or []:
        store.execute(
            "DELETE FROM syndicate_members WHERE syndicate_id = ? AND creator_id = ?",
            (syndicate_id, creator_id),
        )
    for creator_id in payload.get("add_creator_ids") or []:
        creator = get_creator_row(creator_id)
        if store.find_one(
            "syndicate_members", {"syndicate_id": syndicate_id, "creator_id": creator_id}
        ):
            continue
        store.insert(
            "syndicate_members",
            {
                "id": new_id("synm"),
                "syndicate_id": syndicate_id,
                "creator_id": creator_id,
                "role_in_syndicate": (creator.get("type") or "").replace("_", " ").title(),
                "allocation_pct": 0,
                "created_at": store.utcnow(),
            },
        )

    members = store.find("syndicate_members", {"syndicate_id": syndicate_id})
    weights = []
    for member in members:
        creator = store.get("creators", member["creator_id"])
        weights.append(int((creator or {}).get("base_rate_minor") or 1))
    weight_sum = sum(weights) or 1
    for member, weight in zip(members, weights):
        store.update(
            "syndicate_members",
            member["id"],
            {"allocation_pct": round(100.0 * weight / weight_sum, 2)},
        )

    total_reach = sum(
        int((store.get("creators", m["creator_id"]) or {}).get("monthly_reach") or 0)
        for m in members
    )
    store.update("syndicates", syndicate_id, {"expected_reach": total_reach})

    audit.record(
        actor_id=principal.user_id,
        actor_role=principal.role,
        action="syndicate.updated",
        entity_type="syndicate",
        entity_id=syndicate_id,
        after={"members": [m["creator_id"] for m in members]},
    )
    return syndicate_out(store.get("syndicates", syndicate_id))
