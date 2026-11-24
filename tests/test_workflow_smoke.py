"""End-to-end smoke test for the workflow spine.

Run directly:  python tests/test_workflow_smoke.py

It drives the real HTTP surface with TestClient, in the same order the demo
does: brief → matches → draft → edit → approve → send → claim → accept →
fund → evidence → submit → review → payout.
"""

import io
import os
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

WORKDIR = tempfile.mkdtemp(prefix="sponsorplay-smoke-")
os.environ["WORKFLOW_DB_PATH"] = os.path.join(WORKDIR, "workflow.db")
os.environ["EVIDENCE_DIR"] = os.path.join(WORKDIR, "evidence")

from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402
from PIL import Image  # noqa: E402

client = TestClient(app)
FAILURES = []


def check(label, condition, detail=""):
    status = "PASS" if condition else "FAIL"
    print(f"[{status}] {label}{(' — ' + str(detail)) if detail and not condition else ''}")
    if not condition:
        FAILURES.append(label)


def png_bytes():
    image = Image.new("RGB", (1280, 720), color=(38, 34, 29))
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return buffer.getvalue()


def main():
    # Fresh state
    response = client.post("/api/v1/demo/reset")
    check("reset", response.status_code == 200, response.text)

    # Brand session
    response = client.post(
        "/api/v1/auth/workflow-login",
        json={"identifier": "brand@sponsorplay.ke", "password": "Password123!"},
    )
    check("brand login", response.status_code == 200, response.text)
    brand_token = response.json()["token"]
    brand = {"Authorization": f"Bearer {brand_token}"}

    # Campaign
    response = client.post(
        "/api/v1/campaigns",
        headers=brand,
        json={
            "brief": "5G Home Gaming push across Nairobi university and grassroots tournaments.",
            "target_audience": "16-28 urban gamers",
            "objective": "Awareness",
            "kpi": "3 broadcasts, 2 clips",
            "geography": "Nairobi",
            "budget": 1200,
            "currency": "USD",
        },
    )
    check("create campaign", response.status_code == 200, response.text)
    campaign = response.json()

    response = client.get(f"/api/v1/campaigns/{campaign['id']}/matches", headers=brand)
    check("matches", response.status_code == 200, response.text)
    matches = response.json()
    check("syndicate returned", len(matches["syndicates"]) > 0)
    syndicate = matches["syndicates"][0]

    # Draft
    response = client.post(
        f"/api/v1/campaigns/{campaign['id']}/proposals",
        headers=brand,
        json={"syndicate_id": syndicate["id"]},
    )
    check("draft proposal", response.status_code == 200, response.text)
    proposal = response.json()
    check("draft is DRAFT", proposal["status"] == "DRAFT", proposal["status"])
    check("draft has milestones", len(proposal["milestones"]) == 3)
    check("draft has offers", len(proposal["offers"]) >= 1)
    check("no email sent on draft", all(o["sent_at"] is None for o in proposal["offers"]))
    check("no magic link on draft", all(o["magic_link"] is None for o in proposal["offers"]))
    check("milestone sum equals pool",
          sum(m["amount_minor"] for m in proposal["milestones"]) == proposal["creator_pool_minor"],
          (sum(m["amount_minor"] for m in proposal["milestones"]), proposal["creator_pool_minor"]))

    # Edit the draft: change milestone 1 amount and due date
    milestones = proposal["milestones"]
    edited = []
    for index, m in enumerate(milestones):
        edited.append({
            "id": m["id"],
            "seq": m["seq"],
            "title": m["title"],
            "description": m["description"],
            # Deliberately move the money so we can prove totals follow the table.
            "amount": round(m["amount"] + (100 if index == 0 else 0), 2),
            "due_at": m["due_at"],
            "evidence_requirements": m["evidence_requirements"],
            "acceptance_criteria": m["acceptance_criteria"],
            "review_sla_hours": m["review_sla_hours"],
            "revision_window_hours": m["revision_window_hours"],
        })
    response = client.patch(
        f"/api/v1/proposals/{proposal['id']}", headers=brand, json={"milestones": edited}
    )
    check("edit draft", response.status_code == 200, response.text)
    edited_proposal = response.json()
    check(
        "milestone sum still equals pool",
        sum(m["amount_minor"] for m in edited_proposal["milestones"])
        == edited_proposal["creator_pool_minor"],
        (
            sum(m["amount_minor"] for m in edited_proposal["milestones"]),
            edited_proposal["creator_pool_minor"],
        ),
    )
    check(
        "offer allocations still sum to pool",
        sum(o["allocation_minor"] for o in edited_proposal["offers"])
        == edited_proposal["creator_pool_minor"],
        (
            sum(o["allocation_minor"] for o in edited_proposal["offers"]),
            edited_proposal["creator_pool_minor"],
        ),
    )

    # Validation
    response = client.post(f"/api/v1/proposals/{proposal['id']}/validate", headers=brand)
    check("validate", response.status_code == 200, response.text)
    check("validation ok", response.json()["ok"], response.json())

    # Approve + send
    response = client.post(f"/api/v1/proposals/{proposal['id']}/submit-for-approval", headers=brand)
    check("submit for approval", response.status_code == 200, response.text)
    response = client.post(f"/api/v1/proposals/{proposal['id']}/approve", headers=brand)
    check("approve", response.status_code == 200, response.text)
    response = client.post(f"/api/v1/proposals/{proposal['id']}/send", headers=brand)
    check("send", response.status_code == 200, response.text)
    sent = response.json()
    check("status SENT", sent["status"] == "SENT", sent["status"])
    check("every offer has a magic link", all(o["magic_link"] for o in sent["offers"]))

    first_offer = sent["offers"][0]
    token = first_offer["magic_link"].rsplit("/offer/", 1)[-1]

    # Public offer
    response = client.get(f"/api/v1/offers/{token}")
    check("public offer", response.status_code == 200, response.text)
    public = response.json()
    check("offer requires account", public["requires_account"] is True)
    check("offer milestones scoped", len(public["milestones"]) == 3)

    # Claim
    response = client.post(
        f"/api/v1/offers/{token}/claim",
        json={"full_name": "Smoke Creator", "password": "CreatorPass123!"},
    )
    check("claim account", response.status_code == 200, response.text)
    creator_token = response.json()["token"]
    creator = {"Authorization": f"Bearer {creator_token}"}

    # Accept — a syndicate needs every creator to answer before funding.
    for offer in sent["offers"]:
        offer_token = offer["magic_link"].rsplit("/offer/", 1)[-1]
        response = client.post(
            f"/api/v1/offers/{offer_token}/accept", json={"full_name": "Smoke Creator"}
        )
        check(f"accept offer {offer['creator']['name']}", response.status_code == 200, response.text)

    response = client.get(f"/api/v1/proposals/{proposal['id']}", headers=brand)
    check("proposal accepted", response.json()["status"] == "ACCEPTED", response.json()["status"])

    # Fund
    response = client.post(
        "/api/v1/payments/funding-intents",
        headers={**brand, "Idempotency-Key": "smoke-fund-1"},
        json={"proposal_id": proposal["id"]},
    )
    check("funding intent", response.status_code == 200, response.text)
    intent = response.json()
    response = client.post(f"/api/v1/payments/funding-intents/{intent['id']}/capture", headers=brand)
    check("capture funding", response.status_code == 200, response.text)
    check("proposal funded", response.json()["proposal"]["status"] == "FUNDED")

    # Creator campaign
    response = client.get("/api/v1/creator/me", headers=creator)
    check("creator home", response.status_code == 200, response.text)
    home = response.json()
    check("creator has a campaign", len(home["campaigns"]) >= 1)

    response = client.get(f"/api/v1/creator/campaigns/{proposal['id']}", headers=creator)
    check("creator campaign", response.status_code == 200, response.text)
    creator_view = response.json()
    milestone = creator_view["milestones"][0]["milestone"]
    check("milestone in progress", milestone["status"] == "IN_PROGRESS", milestone["status"])

    # Upload required evidence
    for requirement in milestone["evidence_requirements"]:
        if not requirement.get("required", True):
            continue
        for _ in range(int(requirement.get("min_count") or 1)):
            if requirement["kind"] == "URL":
                response = client.post(
                    f"/api/v1/creator/milestones/{milestone['id']}/evidence",
                    headers=creator,
                    data={"requirement_key": requirement["key"], "kind": "URL",
                          "url": "https://youtube.com/watch?v=smoke"},
                )
            else:
                response = client.post(
                    f"/api/v1/creator/milestones/{milestone['id']}/evidence",
                    headers=creator,
                    data={"requirement_key": requirement["key"], "kind": requirement["kind"]},
                    files={"file": ("proof.png", png_bytes(), "image/png")},
                )
            check(f"upload {requirement['key']}", response.status_code == 200, response.text)

    # Submit
    response = client.post(f"/api/v1/creator/milestones/{milestone['id']}/submit", headers=creator)
    check("submit milestone", response.status_code == 200, response.text)
    case = response.json()
    check("report produced", case["report"] is not None)
    check("report recommends human review",
          case["report"]["recommended_decision"] == "HUMAN_REVIEW",
          case["report"]["recommended_decision"])
    check("report admits limits", len(case["report"]["limitations"]) >= 2)

    # Ops queue
    response = client.post(
        "/api/v1/auth/workflow-login",
        json={"identifier": "ops@sponsorplay.ke", "password": "Password123!"},
    )
    check("ops login", response.status_code == 200, response.text)
    ops = {"Authorization": f"Bearer {response.json()['token']}"}

    response = client.get("/api/v1/ops/queue", headers=ops)
    check("ops queue", response.status_code == 200, response.text)
    queue = response.json()
    check("queue has the case", len(queue) >= 1, len(queue))

    # Approve
    response = client.post(
        f"/api/v1/ops/milestones/{milestone['id']}/decision",
        headers=ops,
        json={"offer_id": first_offer["id"], "decision": "APPROVE", "reason": "Evidence reviewed."},
    )
    check("ops approve", response.status_code == 200, response.text)
    decided = response.json()
    check("payout created", decided.get("payout") is not None)
    check("payout status PAID", decided["payout"]["status"] == "PAID", decided.get("payout"))

    # Money
    response = client.get(f"/api/v1/proposals/{proposal['id']}/money", headers=brand)
    check("money summary", response.status_code == 200, response.text)
    money = response.json()
    check("committed recorded", money["committed_minor"] > 0)
    check("released recorded", money["released_minor"] > 0)
    check("ledger has entries", len(money["ledger"]) >= 3)

    # Idempotency: replaying the payout must not double-pay
    response = client.post(
        f"/api/v1/ops/milestones/{milestone['id']}/decision",
        headers=ops,
        json={"offer_id": first_offer["id"], "decision": "APPROVE", "reason": "retry"},
    )
    check("double decision rejected", response.status_code == 409, response.status_code)

    # Audit
    response = client.get(f"/api/v1/proposals/{proposal['id']}/audit", headers=brand)
    check("audit trail", response.status_code == 200, response.text)
    check("audit has events", len(response.json()) >= 6)

    # Restart survival
    from app.workflow import store
    reloaded = store.get("proposals", proposal["id"])
    check("persisted to disk", reloaded is not None)

    print()
    if FAILURES:
        print(f"{len(FAILURES)} failure(s): {FAILURES}")
        return 1
    print("All smoke checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
