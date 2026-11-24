"""Append-only audit trail.

Every state transition, money movement and human decision writes one event.
This is what makes the product defensible in a dispute and demonstrable in a
pitch.
"""

from typing import Any, Dict, Optional

from app.workflow import store
from app.workflow.security import new_id


def record(
    *,
    actor_id: Optional[str],
    actor_role: Optional[str],
    action: str,
    entity_type: str,
    entity_id: str,
    before: Optional[Dict[str, Any]] = None,
    after: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None,
) -> Dict[str, Any]:
    event = {
        "id": new_id("evt"),
        "actor_id": actor_id,
        "actor_role": actor_role,
        "action": action,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "before_json": store.dumps(before) if before is not None else None,
        "after_json": store.dumps(after) if after is not None else None,
        "request_id": request_id,
        "created_at": store.utcnow(),
    }
    store.insert("audit_events", event)
    return event


def for_entity(entity_type: str, entity_id: str) -> list[Dict[str, Any]]:
    events = store.find(
        "audit_events",
        {"entity_type": entity_type, "entity_id": entity_id},
        order_by="created_at ASC",
    )
    for event in events:
        event["before"] = store.loads(event.pop("before_json"), None)
        event["after"] = store.loads(event.pop("after_json"), None)
    return events


def for_proposal(proposal_id: str) -> list[Dict[str, Any]]:
    """Audit trail for a proposal, its milestones and its offers."""
    events = store.find("audit_events", order_by="created_at ASC")
    milestones = {m["id"] for m in store.find("milestones", {"proposal_id": proposal_id})}
    offers = {o["id"] for o in store.find("offers", {"proposal_id": proposal_id})}
    relevant = []
    for event in events:
        if event["entity_id"] == proposal_id:
            relevant.append(event)
        elif event["entity_type"] == "milestone" and event["entity_id"] in milestones:
            relevant.append(event)
        elif event["entity_type"] == "offer" and event["entity_id"] in offers:
            relevant.append(event)
        elif event["entity_type"] == "payment" and event["entity_id"] in milestones:
            relevant.append(event)
    for event in relevant:
        event["before"] = store.loads(event.pop("before_json"), None)
        event["after"] = store.loads(event.pop("after_json"), None)
    return relevant
