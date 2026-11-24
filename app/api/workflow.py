"""Workflow API — the product contract.

Legacy routers stay mounted for the old prototype frontend. These endpoints
are what the product UI uses.
"""

from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, File, Form, Header, Request, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel

from app.workflow import (
    campaign_service,
    demo_service,
    evidence_service,
    offer_service,
    payment_service,
    proposal_service,
    review_service,
    store,
)
from app.workflow.auth import (
    Principal,
    current_principal,
    optional_principal,
    require_brand,
    require_creator,
    require_ops,
    create_session,
    delete_session,
    SESSION_COOKIE,
)
from app.workflow.errors import DomainError, Unauthorized
from app.workflow.schemas import (
    AcceptOfferIn,
    CampaignCreate,
    CampaignUpdate,
    CounterOfferIn,
    DeclineOfferIn,
    FundingIntentIn,
    MilestoneIn,
    ProposalCreate,
    ProposalPatch,
    ReviewDecisionIn,
    SyndicatePatch,
)
from app.workflow.security import verify_password

router = APIRouter(tags=["Workflow"])


def _principal_out(principal: Principal) -> Dict[str, Any]:
    return {
        "user_id": principal.user_id,
        "email": principal.email,
        "name": principal.name,
        "role": principal.role,
        "org_id": principal.org_id,
        "creator_id": principal.creator_id,
        "is_ops": principal.is_ops,
        "is_brand": principal.is_brand,
    }


# --------------------------------------------------------------------------
# Session
# --------------------------------------------------------------------------

class WorkflowLoginRequest(BaseModel):
    identifier: str
    password: Optional[str] = None


@router.post("/api/v1/auth/workflow-login")
def workflow_login(payload: WorkflowLoginRequest):
    identifier = (payload.identifier or "").strip().lower()
    user = store.find_one("users", {"email": identifier})
    if not user:
        for candidate in store.find("users"):
            if identifier in candidate["email"].lower() or identifier in candidate["name"].lower():
                user = candidate
                break
    if not user:
        raise Unauthorized("No account matches those details.", code="INVALID_CREDENTIALS")
    if user.get("password_hash") and payload.password:
        if not verify_password(payload.password, user["password_hash"]):
            raise Unauthorized("Incorrect password.", code="INVALID_CREDENTIALS")

    token = create_session(
        user_id=user["id"],
        role=user["role"],
        org_id=user.get("org_id"),
        creator_id=None,
    )
    # Creator users need their creator_id on the session.
    creator = store.find_one("users", {"id": user["id"]})
    creator_id = None
    if user["role"] == "CREATOR":
        creator_id = _creator_id_for_user(user["id"])
        token = create_session(
            user_id=user["id"],
            role=user["role"],
            org_id=None,
            creator_id=creator_id,
        )

    principal = Principal(
        user_id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        org_id=user.get("org_id"),
        creator_id=creator_id,
    )
    redirect = "/brand" if principal.is_brand else ("/ops" if principal.is_ops else "/creator")
    return {
        "token": token,
        "principal": _principal_out(principal),
        "redirect_url": redirect,
    }


def _creator_id_for_user(user_id: str) -> Optional[str]:
    # Seed users encode the creator in the id (user-creator-001).
    if user_id.startswith("user-creator-"):
        return user_id.replace("user-", "", 1)
    return None


@router.post("/api/v1/auth/workflow-logout")
def workflow_logout(request: Request, principal: Principal = Depends(current_principal)):
    header = request.headers.get("authorization") or ""
    raw = header.split(" ", 1)[1] if header.lower().startswith("bearer ") else request.cookies.get(SESSION_COOKIE)
    if raw:
        delete_session(raw)
    return {"ok": True}


@router.get("/api/v1/workflow/me")
def me(principal: Principal = Depends(current_principal)):
    return _principal_out(principal)


# --------------------------------------------------------------------------
# Creators
# --------------------------------------------------------------------------

@router.get("/api/v1/workflow/creators")
def list_creators(principal: Optional[Principal] = Depends(optional_principal)):
    return campaign_service.list_creators()


# --------------------------------------------------------------------------
# Campaigns
# --------------------------------------------------------------------------

@router.post("/api/v1/campaigns")
def create_campaign(payload: CampaignCreate, principal: Principal = Depends(require_brand)):
    return campaign_service.create_campaign(principal, payload.model_dump())


@router.get("/api/v1/campaigns")
def list_campaigns(principal: Principal = Depends(current_principal)):
    return campaign_service.list_campaigns(principal)


@router.get("/api/v1/campaigns/{campaign_id}")
def get_campaign(campaign_id: str, principal: Principal = Depends(current_principal)):
    return campaign_service.get_campaign(campaign_id, principal)


@router.patch("/api/v1/campaigns/{campaign_id}")
def update_campaign(
    campaign_id: str, payload: CampaignUpdate, principal: Principal = Depends(require_brand)
):
    return campaign_service.update_campaign(campaign_id, principal, payload.model_dump(exclude_unset=True))


@router.get("/api/v1/campaigns/{campaign_id}/matches")
def get_matches(campaign_id: str, principal: Principal = Depends(current_principal)):
    return campaign_service.latest_matches(campaign_id, principal)


@router.patch("/api/v1/campaigns/{campaign_id}/syndicates/{syndicate_id}")
def patch_syndicate(
    campaign_id: str,
    syndicate_id: str,
    payload: SyndicatePatch,
    principal: Principal = Depends(require_brand),
):
    return campaign_service.patch_syndicate(
        campaign_id, syndicate_id, principal, payload.model_dump()
    )


# --------------------------------------------------------------------------
# Proposals
# --------------------------------------------------------------------------

@router.post("/api/v1/campaigns/{campaign_id}/proposals")
def create_proposal(
    campaign_id: str, payload: ProposalCreate, principal: Principal = Depends(require_brand)
):
    return proposal_service.create_draft(principal, campaign_id, payload.model_dump())


@router.get("/api/v1/campaigns/{campaign_id}/proposals")
def list_proposals(campaign_id: str, principal: Principal = Depends(current_principal)):
    return proposal_service.list_proposals(campaign_id, principal)


@router.get("/api/v1/proposals/{proposal_id}")
def get_proposal(proposal_id: str, principal: Principal = Depends(current_principal)):
    return proposal_service.get_proposal(proposal_id, principal)


@router.patch("/api/v1/proposals/{proposal_id}")
def patch_proposal(
    proposal_id: str, payload: ProposalPatch, principal: Principal = Depends(require_brand)
):
    return proposal_service.patch_draft(
        proposal_id, principal, payload.model_dump(exclude_unset=True)
    )


@router.post("/api/v1/proposals/{proposal_id}/validate")
def validate_proposal(proposal_id: str, principal: Principal = Depends(require_brand)):
    proposal_service.get_proposal_row(proposal_id)
    return proposal_service.validate(proposal_id)


@router.post("/api/v1/proposals/{proposal_id}/submit-for-approval")
def submit_proposal(proposal_id: str, principal: Principal = Depends(require_brand)):
    return proposal_service.submit_for_approval(proposal_id, principal)


@router.post("/api/v1/proposals/{proposal_id}/approve")
def approve_proposal(proposal_id: str, principal: Principal = Depends(current_principal)):
    return proposal_service.approve(proposal_id, principal)


@router.post("/api/v1/proposals/{proposal_id}/send")
def send_proposal(proposal_id: str, principal: Principal = Depends(current_principal)):
    return proposal_service.send(proposal_id, principal)


class CancelRequest(BaseModel):
    reason: Optional[str] = None


@router.post("/api/v1/proposals/{proposal_id}/cancel")
def cancel_proposal(
    proposal_id: str, payload: CancelRequest = CancelRequest(), principal: Principal = Depends(current_principal)
):
    return proposal_service.cancel(proposal_id, principal, payload.reason)


@router.get("/api/v1/proposals/{proposal_id}/email-preview")
def email_preview(
    proposal_id: str,
    offer_id: Optional[str] = None,
    principal: Principal = Depends(current_principal),
):
    return proposal_service.email_preview(proposal_id, principal, offer_id)


@router.get("/api/v1/proposals/{proposal_id}/audit")
def proposal_audit(proposal_id: str, principal: Principal = Depends(current_principal)):
    return proposal_service.audit_trail(proposal_id, principal)


@router.post("/api/v1/proposals/{proposal_id}/offers/{offer_id}/accept-counter")
def accept_counter(proposal_id: str, offer_id: str, principal: Principal = Depends(require_brand)):
    return offer_service.accept_counter(proposal_id, offer_id, principal)


@router.post("/api/v1/proposals/{proposal_id}/offers/{offer_id}/decline-counter")
def decline_counter(proposal_id: str, offer_id: str, principal: Principal = Depends(require_brand)):
    return offer_service.decline_counter(proposal_id, offer_id, principal)


# --------------------------------------------------------------------------
# Public offers
# --------------------------------------------------------------------------

@router.get("/api/v1/offers/{token}")
def get_offer(token: str):
    return offer_service.public_offer(token)


@router.post("/api/v1/offers/{token}/claim")
def claim_offer(token: str, payload: Dict[str, Any]):
    return offer_service.claim(token, payload)


@router.post("/api/v1/offers/{token}/accept")
def accept_offer(token: str, payload: Dict[str, Any]):
    return offer_service.accept(token, payload)


@router.post("/api/v1/offers/{token}/counter")
def counter_offer(token: str, payload: CounterOfferIn):
    return offer_service.counter(token, payload.model_dump())


@router.post("/api/v1/offers/{token}/decline")
def decline_offer(token: str, payload: DeclineOfferIn):
    return offer_service.decline(token, payload.model_dump())


# --------------------------------------------------------------------------
# Creator
# --------------------------------------------------------------------------

@router.get("/api/v1/creator/me")
def creator_home(principal: Principal = Depends(require_creator)):
    return offer_service.creator_home(principal)


@router.get("/api/v1/creator/campaigns")
def creator_campaigns(principal: Principal = Depends(require_creator)):
    return offer_service.creator_home(principal)["campaigns"]


@router.get("/api/v1/creator/campaigns/{proposal_id}")
def creator_campaign(proposal_id: str, principal: Principal = Depends(require_creator)):
    return offer_service.creator_campaign(principal, proposal_id)


@router.post("/api/v1/creator/milestones/{milestone_id}/evidence")
async def upload_evidence(
    milestone_id: str,
    requirement_key: str = Form(...),
    kind: str = Form("FILE"),
    label: Optional[str] = Form(None),
    url: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    principal: Principal = Depends(require_creator),
):
    data = await file.read() if file else None
    return evidence_service.add_evidence(
        milestone_id=milestone_id,
        principal=principal,
        requirement_key=requirement_key,
        kind=kind,
        label=label,
        filename=file.filename if file else None,
        content_type=file.content_type if file else None,
        data=data,
        url=url,
    )


@router.delete("/api/v1/creator/evidence/{evidence_id}")
def remove_evidence(evidence_id: str, principal: Principal = Depends(require_creator)):
    evidence_service.delete_evidence(evidence_id, principal)
    return {"ok": True}


@router.post("/api/v1/creator/milestones/{milestone_id}/submit")
def submit_milestone(milestone_id: str, principal: Principal = Depends(require_creator)):
    return evidence_service.submit(milestone_id, principal)


@router.get("/api/v1/workflow/evidence/{evidence_id}/file")
def get_evidence_file(evidence_id: str):
    path, content_type, filename = evidence_service.evidence_path(evidence_id)
    return FileResponse(path, media_type=content_type, filename=filename)


# --------------------------------------------------------------------------
# Ops
# --------------------------------------------------------------------------

@router.get("/api/v1/ops/queue")
def ops_queue(principal: Principal = Depends(require_ops)):
    return review_service.queue(principal)


@router.get("/api/v1/ops/campaigns")
def ops_campaigns(principal: Principal = Depends(require_ops)):
    return review_service.all_campaigns(principal)


@router.get("/api/v1/ops/milestones/{milestone_id}/offers/{offer_id}")
def ops_case(
    milestone_id: str, offer_id: str, principal: Principal = Depends(require_ops)
):
    return review_service.case(milestone_id, offer_id, principal)


class DecisionRequest(BaseModel):
    offer_id: str
    decision: str
    reason: Optional[str] = None


@router.post("/api/v1/ops/milestones/{milestone_id}/decision")
def ops_decide(
    milestone_id: str, payload: DecisionRequest, principal: Principal = Depends(require_ops)
):
    return review_service.decide(
        milestone_id, payload.offer_id, principal, payload.decision, payload.reason
    )


@router.post("/api/v1/ops/milestones/{milestone_id}/offers/{offer_id}/rerun")
def ops_rerun(
    milestone_id: str, offer_id: str, principal: Principal = Depends(require_ops)
):
    return review_service.rerun_verification(milestone_id, offer_id, principal)


# --------------------------------------------------------------------------
# Money
# --------------------------------------------------------------------------

@router.post("/api/v1/payments/funding-intents")
def create_funding(
    payload: FundingIntentIn,
    principal: Principal = Depends(require_brand),
    idempotency_key: Optional[str] = Header(None, alias="Idempotency-Key"),
):
    return payment_service.create_funding_intent(
        principal,
        payload.proposal_id,
        amount=payload.amount,
        provider=payload.provider,
        idempotency_key=idempotency_key,
    )


@router.post("/api/v1/payments/funding-intents/{intent_id}/capture")
def capture_funding(intent_id: str, principal: Principal = Depends(require_brand)):
    return payment_service.capture_funding(principal, intent_id)


@router.get("/api/v1/proposals/{proposal_id}/money")
def money_summary(proposal_id: str, principal: Principal = Depends(current_principal)):
    return payment_service.money_summary(proposal_id, principal)


# --------------------------------------------------------------------------
# Demo
# --------------------------------------------------------------------------

@router.post("/api/v1/demo/reset")
def demo_reset(scenario: Optional[str] = None):
    return demo_service.reset(scenario)


@router.post("/api/v1/demo/seed/{scenario}")
def demo_seed(scenario: str):
    return demo_service.seed_scenario(scenario)


@router.get("/api/v1/demo/state")
def demo_state():
    return demo_service.state()
