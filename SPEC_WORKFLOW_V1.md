# SponsorPlay — Workflow Specification v1

**Status:** Draft for sign-off
**Target:** iHub pitch, 11 December
**Build mode:** Demo-grade, product-shaped
**Companion doc:** `FRONTEND_HANDOFF.md` (vision, screens, routes for the visual developer)
**Predecessor:** `WORKFLOW_REVIEW_AND_PROPOSAL.md` (critique and rationale)

---

## 0. Locked decisions

| # | Decision | Choice |
|---|---|---|
| 1 | Who reviews evidence in the MVP | **Barbah ops** reviews and decides. Brand sees the outcome and the report. |
| 2 | Syndicate contracting | **One offer per creator.** A syndicate is a grouping, not a single contract. |
| 3 | Counter-offers | **Structured** (amount, scope, dates) **plus a message thread.** |
| 4 | Immediate goal | Investor demo (11 Dec), product-shaped so the pilot does not require a rewrite. |
| 5 | Frontend boundary | I own workflow, API contract, and page structure. Visual developer owns palette, typography, motion, polish. |

---

## 1. The principle

> **AI drafts. A human decides. The system enforces.**

Three lanes, and every screen should make it obvious which lane you are in:

| Lane | Owns | Never does |
|---|---|---|
| **Agent** | Parse, match, draft, pre-check, summarise, flag anomalies | Send an offer, approve evidence, move money |
| **Human** | Approve a proposal, approve evidence, decide an exception | Type in a payment amount the system cannot validate |
| **System** | State transitions, permissions, idempotency, ledger, audit, notifications | Guess |

Every agent output in the UI carries: *what it did*, *why*, *what it is unsure about*, and *what decision is now needed*.

---

## 2. Roles and permissions

| Role | Scope | Can |
|---|---|---|
| `BRAND_ADMIN` | One organisation | Create campaigns, edit drafts, approve and send, fund, view reports, invite members |
| `BRAND_MEMBER` | One organisation | Create and edit drafts, cannot approve/send/fund unless granted |
| `OPS_REVIEWER` | Platform-wide | Review evidence, approve/request changes/reject, rerun verification, view all campaigns |
| `OPS_ADMIN` | Platform-wide | Everything ops, plus demo reset, provider config, exceptions |
| `CREATOR` | Own offers only | View own offer, accept/counter/decline, submit evidence, view own payouts |

Rules enforced server-side, not in the UI:

- A brand user can only read/write entities belonging to their `org_id`.
- A creator can only read/write their own `offer_id`.
- Offer tokens are single-purpose, expiring, hashed at rest, and scoped to one offer.
- Every state transition checks role + guard conditions.
- Every transition writes an `AuditEvent`.

**Demo exception:** personas remain (`brand`, `creator`, `ops`), but the token is actually validated and the role is actually checked. This is cheap and prevents an embarrassing cross-tenant moment on stage.

---

## 3. Domain model

Money is **integer minor units** (`amount_minor`) plus a `currency` code. No floats anywhere. FX rate is snapshotted at proposal creation.

```
Organization
  id, name, kra_pin, billing_email, created_at

User
  id, org_id?, email, name, role, password_hash?, status, created_at

Campaign
  id, org_id, brand_name, brief_text, target_audience, budget_minor, currency,
  objective?, kpi?, geography?, starts_at?, ends_at?, status, created_at

MatchRun
  id, campaign_id, agent_version, model, input_hash, result_json, created_at

Syndicate
  id, campaign_id, title, rationale, expected_reach, status

SyndicateMember
  id, syndicate_id, creator_id, role_in_syndicate, allocation_pct

CreatorProfile
  id, name, gamer_tag, type, primary_game, location, monthly_reach,
  base_rate_minor, currency, brand_safety_score, payout_method, payout_ref,
  tax_profile_status, channel_verification_status

Proposal
  id, campaign_id, syndicate_id?, version, status,
  total_minor, currency, fx_rate_usd_kes, platform_fee_minor,
  created_by, approved_by?, approved_at?, sent_at?, created_at, updated_at

ProposalMilestone
  id, proposal_id, seq, title, description, amount_minor, currency,
  due_at, evidence_requirements_json, acceptance_criteria_json,
  review_sla_hours, revision_window_hours, status

ParticipantOffer
  id, proposal_id, creator_id, allocation_minor, currency, status,
  token_hash, token_expires_at, sent_at, viewed_at,
  accepted_at, declined_at, decline_reason?, version

CounterOffer
  id, offer_id, amount_minor, scope_changes_json, proposed_dates_json,
  message, status, created_at

Evidence
  id, milestone_id, offer_id, uploaded_by, kind, label,
  original_filename, content_type, size_bytes, sha256, storage_key,
  captured_at?, submitted_at, metadata_json

VerificationReport
  id, milestone_id, agent_version, model, started_at, completed_at,
  checks_json, metrics_json, limitations_json,
  recommended_decision, summary, evidence_refs_json

ReviewDecision
  id, milestone_id, reviewer_id, decision, reason, overrode_recommendation,
  decided_at

FundingCommitment
  id, proposal_id, amount_minor, currency, provider, provider_ref,
  status, idempotency_key, created_at

LedgerEntry
  id, account, direction, amount_minor, currency,
  ref_type, ref_id, created_at  -- append only

Invoice
  id, milestone_id, type, amount_minor, tax_minor, currency,
  status, etims_ref?, issued_at

PaymentIntent
  id, milestone_id, offer_id, amount_minor, currency,
  idempotency_key, status, created_at

Payout
  id, intent_id, provider, provider_ref, status, failure_reason?, created_at

Message
  id, thread_type, thread_id, sender_id, sender_role, body, created_at

Dispute
  id, milestone_id, opened_by, reason, status, resolution?, created_at

AuditEvent
  id, actor_id, actor_role, action, entity_type, entity_id,
  before_json, after_json, request_id, created_at
```

**Immutability:** a sent proposal is never mutated. Edits create a new `version` and repoint `current_version_id`. Same for signed contracts. This is what makes disputes and audits tractable.

---

## 4. State machines

### 4.1 Proposal

```
DRAFT
  → IN_REVIEW            (submit-for-approval)
  → CHANGES_REQUESTED    (reviewer rejects draft)
  → APPROVED             (brand admin approves)
  → SENT                 (offers created, emails dispatched)
  → PARTIALLY_ACCEPTED   (some creators accepted)
  → ACCEPTED             (all required creators accepted)
  → FUNDED               (funding captured)
  → ACTIVE               (first milestone in progress)
  → COMPLETED

DRAFT | IN_REVIEW | APPROVED → CANCELLED
SENT → EXPIRED (all offers expired)
ACTIVE → DISPUTED → ACTIVE | CANCELLED
```

**Guards**

| Transition | Guard |
|---|---|
| `DRAFT → IN_REVIEW` | ≥1 milestone, total = sum of milestones, all due dates in future, all evidence requirements defined |
| `IN_REVIEW → APPROVED` | Actor is `BRAND_ADMIN`; totals valid; no blocking validation errors |
| `APPROVED → SENT` | At least one `ParticipantOffer`; all recipient emails valid; token generated |
| `ACCEPTED → FUNDED` | Funding commitment captured with idempotency key |
| `FUNDED → ACTIVE` | First milestone set `IN_PROGRESS` |

### 4.2 Milestone

```
DRAFT
  → LOCKED               (proposal sent)
  → FUNDED               (funding captured)
  → IN_PROGRESS          (unlocked)
  → EVIDENCE_SUBMITTED   (creator submits)
  → AI_REVIEWED          (report generated)
  → APPROVED             (ops decision)
  → INVOICED             (invoice issued)
  → PAID                 (payout settled)
  → CLOSED

EVIDENCE_SUBMITTED | AI_REVIEWED → REVISION_REQUESTED → IN_PROGRESS
AI_REVIEWED → REJECTED → DISPUTED | CLOSED
Any pre-PAID state → CANCELLED
PAID → DISPUTED (chargeback/reversal)
```

**Guard:** `APPROVED → INVOICED` requires a `ReviewDecision` with `decision = APPROVE`, a valid creator tax profile, and a unique idempotency key.

### 4.3 Participant offer

```
INVITED → SENT → VIEWED → ACCEPTED
                        → COUNTERED → (brand accepts → new proposal version, or declines)
                        → DECLINED
SENT → EXPIRED
ACCEPTED → ACTIVE → COMPLETED
```

### 4.4 Payment

```
INTENT_CREATED → PROCESSING → PAID → RECONCILED
PROCESSING → FAILED → RETRY | MANUAL_REVIEW
PAID → REFUNDED | REVERSED
```

Every money transition requires an `idempotency_key` with a unique constraint. Replaying a key returns the original result, never a second payment.

---

## 5. The end-to-end flow

```
 1  Brand creates campaign brief
 2  Agent 1 returns shortlist + trade-offs (syndicate and solo)
 3  Brand edits the bundle (add/remove creators, see budget and reach recalculate)
 4  Agent 2 drafts proposal + milestones          [no email sent]
 5  Brand edits milestones, dates, amounts, evidence requirements, legal clauses
 6  Brand previews the email, then approves and sends
 7  System creates one ParticipantOffer per creator, with a unique magic link
 8  Creator opens the link, creates/claims an account, views the offer
 9  Creator accepts / counters / declines
10  Brand accepts a counter (new version) or declines
11  Brand funds the campaign (or the first milestone)
12  Creator's first milestone unlocks; creator submits evidence
13  System validates files, hashes, required fields
14  Agent 3 produces a verification report
15  Ops reviewer sees evidence + report, decides: approve / request changes / reject
16  On approve: invoice issued, payout intent created, payout simulated/settled
17  Ledger entries written; milestone PAID; next milestone unlocks
18  Campaign closes: reconciliation, performance & impact report
```

---

## 6. Evidence model

Each milestone declares **typed evidence requirements** at draft time. The creator sees exactly what to provide; the system validates before accepting a submission.

```json
{
  "evidence_requirements": [
    {
      "key": "stream_vod_url",
      "label": "Stream VOD link",
      "kind": "URL",
      "required": true,
      "accepted_hosts": ["youtube.com", "twitch.tv", "kick.com", "tiktok.com"],
      "instructions": "Public or unlisted link. Private links cannot be verified."
    },
    {
      "key": "overlay_screenshot",
      "label": "Overlay screenshots",
      "kind": "IMAGE",
      "required": true,
      "min_count": 2,
      "accepted_types": ["image/png", "image/jpeg"],
      "min_width": 1280,
      "instructions": "One wide shot, one close-up of the brand overlay."
    },
    {
      "key": "platform_analytics",
      "label": "Platform analytics export",
      "kind": "FILE",
      "required": false,
      "accepted_types": ["application/pdf", "text/csv", "image/png"],
      "instructions": "Concurrent viewers and watch time from the platform dashboard."
    }
  ],
  "acceptance_criteria": [
    "Brand overlay visible for at least 60 seconds cumulative",
    "Brand mentioned verbally at least twice",
    "No competitor branding visible"
  ],
  "review_sla_hours": 48,
  "revision_window_hours": 72
}
```

**Evidence integrity**

- Store the original file, never a re-encode.
- Record `sha256`, `content_type`, `size_bytes`, uploader, and upload time.
- Store on disk (demo) behind a storage interface (pilot: object storage + signed URLs).
- Never trust client-declared MIME type; sniff server-side.
- Cap file size and count per submission.

**Evidence by milestone type** (starter library the brand can pick from):

| Milestone type | Evidence |
|---|---|
| Stream / broadcast | VOD URL, overlay screenshots, platform analytics, chat log |
| Venue activation | Wide photo, banner close-up, crowd photo, date/time metadata, venue contact |
| Short-form clips | Published URLs, post insights, caption/hashtag proof, publish date |
| Tournament | Bracket, roster, results, organiser sign-off, venue photos |
| Brand assets | Asset screenshots, guideline checklist, brand sign-off |
| Compliance | Competitor-conflict declaration, exclusivity confirmation, consent |

---

## 7. Verification report

Agent 3 produces a **report**, not a verdict.

```json
{
  "id": "vr_01H...",
  "milestone_id": "ms_01H...",
  "agent_version": "3.0.0",
  "model": "claude-sonnet | opencv | heuristic-fallback",
  "started_at": "2026-11-28T10:00:00Z",
  "completed_at": "2026-11-28T10:00:14Z",
  "evidence_refs": ["ev_01H...", "ev_01J..."],
  "checks": [
    {
      "key": "brand_overlay_visible",
      "label": "Brand overlay visible",
      "required": true,
      "result": "PASS",
      "confidence": 0.94,
      "method": "vision",
      "detail": "Overlay detected across 6 of 8 sampled frames.",
      "artifacts": [
        { "kind": "frame", "url": "/api/v1/evidence/ev_01H/frame/3", "timestamp": "00:12:04" }
      ]
    },
    {
      "key": "cumulative_airtime",
      "label": "Cumulative airtime ≥ 60s",
      "required": true,
      "result": "INCONCLUSIVE",
      "confidence": 0.4,
      "method": "sampling",
      "detail": "Sampled frames cannot prove continuous airtime.",
      "artifacts": []
    }
  ],
  "metrics": {
    "measured": { "screenshots_reviewed": 8, "logo_present_frames": 6 },
    "estimated": { "estimated_airtime_seconds": 180 },
    "unavailable": ["concurrent_viewers", "verbal_callouts"]
  },
  "limitations": [
    "Airtime estimated from sampled frames, not a continuous capture.",
    "Audio not analysed; verbal callouts unverified."
  ],
  "recommended_decision": "HUMAN_REVIEW",
  "summary": "Brand overlay is clearly present. Airtime cannot be proven from screenshots alone; a VOD link or analytics export would close the gap."
}
```

**Decision rules**

| Condition | Recommendation |
|---|---|
| All required checks PASS and min confidence ≥ 0.85 | `APPROVE` |
| Any required check FAIL | `REQUEST_CHANGES` |
| Any required check INCONCLUSIVE | `HUMAN_REVIEW` |
| Evidence missing required items | Blocked before agent runs |

**Human decision**

- `ReviewDecision` is always recorded, even when the human agrees with the agent.
- If the human overrides the recommendation, a reason is mandatory.
- Ops can rerun verification after new evidence arrives; reports are versioned, not overwritten.

**Honesty rule:** if no vision model or API key is available, the report says `heuristic-fallback` and every check is `INCONCLUSIVE`. It never fabricates a PASS.

---

## 8. Money model

### 8.1 Funding options

| Option | Model | Verdict |
|---|---|---|
| **A** | Brand funds campaign (or first milestone) into a platform-held committed balance; release per approved milestone | **Recommended for demo.** Must be described as a committed balance, **not** escrow. |
| B | One payment order per milestone, captured on approval | Cleaner legally, weaker creator certainty |
| C | Licensed PSP / segregated client account | Pilot phase |

The demo uses **A**, with the UI saying *"Committed balance — held by SponsorPlay, released per approved milestone."* Never the word "escrow" without a legal opinion.

### 8.2 Ledger

Append-only. Balances are derived, never stored as a mutable number.

```
FUNDING_CAPTURED     brand → platform      +total
PLATFORM_FEE_EARNED  platform → revenue    +fee
MILESTONE_PAYABLE    platform → creator    +creator_share (liability)
PAYOUT_SETTLED       creator → external    -creator_share
REFUND_ISSUED        platform → brand      -amount
```

### 8.3 Payout preconditions

A payout can only be created when **all** are true:

1. Milestone status is `APPROVED`.
2. A `ReviewDecision` exists with `decision = APPROVE`.
3. The proposal is `FUNDED` or later.
4. The creator's tax profile is valid.
5. The idempotency key is unused.
6. The dispute window has passed or was waived.

### 8.4 Tax and invoicing (demo)

- Platform fee invoice: 10% of gross, issued at funding capture.
- Creator service invoice: issued per approved milestone.
- WHT: 5% withheld and recorded, not remitted (simulated).
- VAT: 16% where applicable, shown separately.
- eTIMS: mock generator, labelled `SIMULATED — not a valid KRA tax invoice` in the UI and on the PDF.
- FX: `USD_TO_KES_RATE` snapshotted at proposal creation; every KES figure derived from that snapshot.

**All of this needs a Kenyan tax advisor before pilot.** The demo must not imply certification.

---

## 9. API contract

Base: `/api/v1`. All responses JSON. All errors `{ "detail": string, "code": string, "request_id": string }`.

Auth: `Authorization: Bearer <token>` or session cookie. Every route declares required roles.

### 9.1 Auth

| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/auth/login` | public | Persona or credential login |
| POST | `/auth/logout` | any | Clear session |
| GET | `/auth/me` | any | Current user + role + org |
| GET | `/auth/demo-accounts` | public (demo only) | Persona list |

### 9.2 Campaigns (brand)

| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/campaigns` | BRAND_* | Create campaign + run matching |
| GET | `/campaigns` | BRAND_* | List own org campaigns |
| GET | `/campaigns/{id}` | BRAND_*, OPS | Campaign detail |
| PATCH | `/campaigns/{id}` | BRAND_* | Edit brief fields |
| GET | `/campaigns/{id}/matches` | BRAND_*, OPS | Latest match run |
| POST | `/campaigns/{id}/matches/rerun` | BRAND_* | Re-run Agent 1 |
| PATCH | `/campaigns/{id}/syndicates/{sid}` | BRAND_* | Add/remove members, adjust allocation |

### 9.3 Proposals (brand)

| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/campaigns/{id}/proposals` | BRAND_* | **Create DRAFT only. No email.** |
| GET | `/proposals/{id}` | BRAND_*, OPS | Proposal + milestones + offers |
| PATCH | `/proposals/{id}` | BRAND_* | Edit draft (milestones, dates, amounts, clauses) |
| POST | `/proposals/{id}/validate` | BRAND_* | Return blocking + warning issues |
| POST | `/proposals/{id}/submit-for-approval` | BRAND_* | `DRAFT → IN_REVIEW` |
| POST | `/proposals/{id}/approve` | BRAND_ADMIN | `IN_REVIEW → APPROVED` |
| POST | `/proposals/{id}/send` | BRAND_ADMIN | Create offers, dispatch emails |
| GET | `/proposals/{id}/email-preview?offer_id=` | BRAND_* | Rendered email HTML |
| POST | `/proposals/{id}/cancel` | BRAND_ADMIN | Cancel |
| GET | `/proposals/{id}/audit` | BRAND_*, OPS | Audit trail |

### 9.4 Offers (public, token-scoped)

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/offers/{token}` | token | Offer summary, no PII beyond the creator |
| POST | `/offers/{token}/claim` | token | Verify email, create/attach account |
| POST | `/offers/{token}/accept` | token | Accept + signature record |
| POST | `/offers/{token}/counter` | token | Structured counter |
| POST | `/offers/{token}/decline` | token | Decline + reason |

Token is hashed at rest, single-use for acceptance, expires in 14 days, rate-limited.

### 9.5 Creator (authenticated)

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/creator/me` | CREATOR | Profile + verification status |
| PATCH | `/creator/me` | CREATOR | Update profile/payout/tax |
| GET | `/creator/campaigns` | CREATOR | Own offers and active campaigns |
| GET | `/creator/milestones/{id}` | CREATOR (own) | Milestone + evidence requirements |
| POST | `/creator/milestones/{id}/evidence` | CREATOR (own) | Multipart upload |
| DELETE | `/creator/evidence/{id}` | CREATOR (own) | Remove before submission |
| POST | `/creator/milestones/{id}/submit` | CREATOR (own) | Submit for review |
| GET | `/creator/milestones/{id}/report` | CREATOR (own) | Verification report + decision |
| GET | `/creator/earnings` | CREATOR | Payouts and invoices |

### 9.6 Ops review

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/ops/queue` | OPS | Milestones awaiting review, sorted by SLA |
| GET | `/ops/milestones/{id}/review` | OPS | Evidence + report + criteria |
| POST | `/ops/milestones/{id}/decision` | OPS | Approve / request changes / reject |
| POST | `/ops/milestones/{id}/rerun-verification` | OPS | New report version |
| GET | `/ops/campaigns` | OPS | All campaigns |

### 9.7 Money

| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/payments/funding-intents` | BRAND_ADMIN | Create funding intent (`Idempotency-Key` header) |
| POST | `/payments/funding-intents/{id}/capture` | BRAND_ADMIN | Capture; write ledger |
| GET | `/payments/ledger?proposal_id=` | BRAND_*, OPS | Ledger entries |
| POST | `/payments/payouts` | OPS_ADMIN, system | Create payout (`Idempotency-Key`) |
| GET | `/payments/invoices?proposal_id=` | BRAND_*, OPS | Invoices |
| POST | `/payments/webhooks/paypal` | signed | Provider callback |

### 9.8 Impact

| Method | Path | Roles | Purpose |
|---|---|---|---|
| GET | `/impact/{proposal_id}` | BRAND_*, OPS | Performance & impact report |
| POST | `/impact/{proposal_id}/generate` | BRAND_*, OPS | Regenerate at close |

### 9.9 Demo

| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/demo/reset` | OPS_ADMIN | Wipe and reseed |
| POST | `/demo/seed/{scenario}` | OPS_ADMIN | `syndicate_live`, `solo_live`, `review_pending` |
| GET | `/demo/state` | OPS_ADMIN | Debug snapshot |

---

## 10. Notification model

Every transition that a human needs to know about emits a `Notification` and (where configured) an email.

| Event | To | Channel |
|---|---|---|
| Proposal sent | Each creator | Email + in-app |
| Offer viewed | Brand | In-app |
| Counter received | Brand | Email + in-app |
| Counter accepted/declined | Creator | Email + in-app |
| Funding captured | Creator, brand | Email + in-app |
| Milestone unlocked | Creator | Email + in-app |
| Evidence submitted | Ops | In-app |
| Report ready | Ops | In-app |
| Changes requested | Creator | Email + in-app |
| Approved + paid | Creator, brand | Email + in-app |
| Milestone overdue | Creator, brand | Email + in-app |
| Campaign closed | Both | Email |

Emails are rendered from templates and **logged** whether or not SMTP is configured, so the demo can show exactly what was sent. A "View email" drawer in the UI renders the same HTML.

---

## 11. Two-session demo script

Two browser windows side by side. Brand left, creator right. Reset before every run.

| Beat | Brand window | Creator window |
|---|---|---|
| 1 | Create brief: "Safaricom 5G gaming push, 18–28 Nairobi, KES 500k" | — |
| 2 | Agent 1 returns 2 syndicates + 3 solo matches; brand swaps one creator out | — |
| 3 | Agent 2 drafts proposal; brand edits milestone 2 amount and due date, adds a required VOD link | — |
| 4 | Brand previews email, approves, sends | — |
| 5 | — | Email lands in the demo inbox; creator clicks the magic link |
| 6 | — | Creator claims account, sees offer, counters milestone 2 (+15%) |
| 7 | Brand sees counter, accepts → new version | — |
| 8 | Brand funds committed balance | — |
| 9 | — | Milestone 1 unlocks; creator uploads 2 screenshots + VOD link, submits |
| 10 | — | Agent 3 report appears: overlay PASS, airtime INCONCLUSIVE |
| 11 | Ops queue (third tab) shows the case; reviewer requests a VOD timestamp | — |
| 12 | — | Creator adds the timestamp, resubmits |
| 13 | Ops approves | — |
| 14 | Brand sees invoice + ledger entry | Creator sees payout, milestone 2 unlocks |
| 15 | Campaign close: performance report with measured vs estimated clearly split | — |

**Fallback:** if the network or an API key fails, `DEMO_MODE=offline` serves seeded fixtures for every beat. A recorded backup video sits on the presenter's machine.

---

## 12. Vertical slice — what we build first

Scope is deliberately narrow. Everything here is needed for the 15-beat demo.

### Backend

1. `TransitionService` — one place that knows legal transitions and guards.
2. `AuditEvent` on every transition.
3. SQLite persistence (SQLModel or SQLAlchemy) behind the existing `db` interface; seed loader retained.
4. Proposal `DRAFT` creation **without** email; `PATCH` for draft edits; `validate`; `approve`; `send`.
5. `ParticipantOffer` creation with hashed magic tokens + email templates.
6. Offer endpoints: view, claim, accept, counter, decline.
7. Evidence upload with hashing, type sniffing, size/count limits, storage interface.
8. Verification report generation with honest fallback; no fabricated PASS.
9. Ops queue + decision endpoint with mandatory reason on override.
10. Invoice + payment intent + simulated payout + ledger entries, all idempotent.
11. `demo/reset` and three seeded scenarios.
12. Role enforcement middleware.

### Frontend (structure, not polish)

1. Brand campaign workspace with tabs: Overview, Matches, Proposal, Offers, Milestones, Money, Audit.
2. Proposal editor with milestone table (edit amount, date, evidence requirements) and a validation panel.
3. Email preview + approve/send panel.
4. Public offer page at `/offer/:token` (view, accept, counter, decline).
5. Creator campaign view with milestone cards and evidence upload.
6. Ops review queue and review detail (evidence gallery, report, decision form).
7. Shared status components driven by the state machine (no hard-coded status strings).

### Explicitly out of scope for the slice

- Real PayPal live, real eTIMS, real KYC.
- Postgres, migrations, multi-region.
- WhatsApp/USSD.
- Audience-overlap deduplication beyond a simple heuristic.
- Full impact analytics integrations (report stays estimate-labelled).
- Brand-side evidence review (ops only, per decision 1).

---

## 13. Timeline to 11 December

| Window | Work | Gate |
|---|---|---|
| 22–24 Nov | Spec sign-off; data model; transition map; route map | **You approve this doc** |
| 25 Nov–2 Dec | Backend slice: persistence, transitions, draft/send, offers, evidence, review, ledger, demo reset | API smoke tests green |
| 3–6 Dec | Frontend structure for all screens; wire to API | End-to-end click-through works |
| 7–8 Dec | Two-session rehearsal; seeded data; copy pass; simulated labels | Full 15-beat run under 6 minutes |
| 9 Dec | Freeze features; record backup video; offline fallback | Reset → run → reset works twice in a row |
| 10 Dec | Rehearse on the actual laptop/network; fix only blockers | No new scope |
| 11 Dec | iHub pitch | — |

**If we slip, cut in this order:** counter-offer flow (show accept/decline only) → impact report detail → audit view. **Never cut:** the human review step, the draft/send gate, or the reset endpoint.

---

## 14. Open items that need you (or a lawyer/accountant)

1. **Funding language** — confirm "committed balance" wording. "Escrow" needs legal sign-off.
2. **Payout rail** — PayPal sandbox only for the demo? Any M-Pesa plan before pilot?
3. **Creator account model** — email + password, magic-link only, or both?
4. **Tax profile fields** — KRA PIN required to accept an offer, or required before first payout?
5. **Brand approval** — is one `BRAND_ADMIN` enough, or do you want a second approver above a threshold?
6. **Data retention** — how long do we keep evidence, and who can delete it?
7. **Which company names can appear in the demo** — real brands (Safaricom) or fictional ones?
8. **Domain** — what URL goes in the email magic link for the demo?

---

## 15. Definition of done for the slice

- A brand can create a campaign, edit a draft, approve, and send — and no email leaves before the send action.
- Each creator in a syndicate receives their own offer and can accept independently.
- A creator can submit evidence and cannot submit without the required items.
- Ops can see evidence and the report and must record a decision with a reason.
- No payout is possible without an `APPROVE` decision.
- Replaying any funding or payout request does not create a second movement.
- Restarting the server does not lose a campaign.
- A brand user cannot read another org's campaign; a creator cannot read another creator's offer.
- Every state change appears in the audit trail.
- `POST /demo/reset` returns the system to a clean, seeded state in under 5 seconds.
- Every simulated integration is visibly labelled as simulated.

---

*Draft v1 — awaiting sign-off before implementation.*
