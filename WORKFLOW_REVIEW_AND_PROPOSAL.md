# SponsorPlay — Workflow Review & Proposed Path to Product

**Status:** Discussion draft — no code changes made  
**Scope:** Product workflow, backend architecture, risk, and phased plan  
**Out of scope for now:** Visual design and palette (owned by the frontend developer)

---

## 1. What the prototype is today

### 1.1 The good parts

- The **story is strong**: brief → AI talent matching → milestone contract → funded ledger → proof-of-play → eTIMS invoice → payout → impact report.
- The **dual-rail differentiator** (PayPal + KRA eTIMS) is genuinely interesting and gives the product a reason to exist beyond "influencer marketplace".
- The **frontend already communicates the vision** well. The colour system, the agent narrative, and the step-by-step wizard make the demo easy to follow.
- The backend has a clean separation between **agents**, **API routers**, **integrations**, and **schemas**. That is a good foundation to build on.

### 1.2 What is actually implemented

| Area | Current state |
|---|---|
| Persistence | In-memory Python dictionaries, seeded from JSON. Restart = everything is lost. |
| Auth | A fake token is returned by `/auth/login`. No middleware checks it. Every API endpoint is open. |
| Proposal | Created by Agent 2 and **emailed immediately** in the same request. No draft, no edit, no preview, no versioning. |
| Syndicates | One proposal, one milestone list, one payout. Disbursement pays `creators[0]` only. No per-creator allocation or acceptance. |
| Creator onboarding | Email link points at `/creator?proposal=...`, but the React app only reads `creator_id`. The "Accept Offer" button navigates to `/creator/offers/:id/accept`, which the router does not handle. The handoff is broken. |
| Milestones | Hard-coded 30/40/30 templates. No deadlines, no evidence specification, no brand editing, no change orders. |
| Proof-of-play | A button runs OpenCV/Claude on a **synthetic generated image**. The API injects simulated metrics (3 hours airtime, slogans) regardless of what was uploaded. |
| Payments | PayPal is simulated unless credentials exist. "Escrow" is a status flag. No idempotency, no ledger entries, no webhook reconciliation, no refund path. |
| eTIMS | Mock invoice generator. Clearly labelled as prototype in some places, but the UI often presents it as certified. |
| Impact | Calculated from seeded profile numbers (`monthly_reach`, `450` per campus club, `12` badges per creator). Presented as "verified". |
| Frontends | Two separate apps: the legacy static HTML/JS wizard (`app/static`) and the React app (`frontend/`). The React app is partially wired; `CampaignDetail` is mostly a placeholder. |
| Money | Floats everywhere, hard-coded FX rate of 130. Rounding errors are inevitable. |
| Tests | Happy-path end-to-end only. No tests for rejection, revision, double payment, expiry, disputes, or permission boundaries. |

### 1.3 The core problem

The prototype is built as **a sequence of buttons that demonstrate agents**. A product needs to be **a sequence of decisions with an audit trail**. Right now the agents make decisions and the human clicks "next". You already identified this yourself: *"the key is not to have AI making the decisions, but an employee that makes work easier."*

That is the single most important change. Everything else follows from it.

---

## 2. What you are trying to achieve (restated)

1. A brand describes a campaign.
2. AI helps find the right creator or syndicate.
3. AI **drafts** a proposal and milestone plan.
4. The brand **reviews, edits, and sends** it.
5. The creator receives an email, creates an account, and lands in a campaign dashboard.
6. The creator accepts, counters, or declines.
7. The creator fulfils milestones by submitting evidence.
8. AI **pre-checks** the evidence and prepares a report.
9. A human **approves or requests changes**.
10. Approval triggers invoicing and payment.
11. The next milestone unlocks, or the campaign closes.
12. The brand gets a verifiable performance/impact report.

The product promise is not "AI runs sponsorships". It is **"AI does the paperwork and the checking; your team makes the decisions."**

---

## 3. Critique of the current workflow

### Stage 1 — Brief

**What works:** Natural-language brief, budget, target audience, presets.

**What is missing for a product:**
- No brand organisation, user, or role. Anyone can act as any brand.
- No campaign objectives or KPIs beyond a text brief.
- No deliverables/usage rights/exclusivity/competitor restrictions.
- No schedule, geography constraints, or blackout dates.
- No approval chain (marketing, procurement, finance, legal).
- No budget currency or FX snapshot.
- Agent 1 output is a score without a transparent breakdown. "97.4% synergy" feels precise but is not explainable.

**Recommendation:** Treat the brief as a structured object, not a text blob. Keep the text box, but add optional structured fields: objective, KPI, audience, geography, dates, deliverables, exclusivity, competitor exclusions, approval contacts. Agent 1 returns a **shortlist with reasons and trade-offs**, not a single "correct" answer.

---

### Stage 2 — Talent selection

**What works:** Syndicate vs solo pathway, creator cards, rationale.

**What is missing:**
- No availability or conflict check (is the creator already booked? are they promoting a competitor?).
- No audience overlap/deduplication across a syndicate.
- No channel ownership verification. Anyone can claim to be a creator.
- No rate negotiation or rate-card transparency.
- No ability for the brand to swap a creator in or out of a syndicate.
- "Synergy score" is pseudo-precision. It should be explainable or removed.

**Recommendation:** Make the syndicate a **draft bundle** the brand can edit. Show "why this creator", "what they cost", "what they have delivered before", "what conflicts exist". Let the brand remove/add members and see the budget and reach recalculate. Verify channel ownership before the offer is sent.

---

### Stage 3 — Proposal drafting and sending (the biggest gap)

**Current behaviour:** `POST /campaigns/proposal` creates the proposal, calculates the split, generates the milestones, and **sends the email inside Agent 2**. The brand never sees the proposal before it goes out.

**Why this is a problem:**
- A brand employee cannot correct a wrong deliverable, date, amount, or legal clause.
- The email goes to `creator@sponsorplay.ke` (hard-coded in the React app) or to creator PayPal emails.
- There is no record of what was sent, when, to whom, or what version.
- For a syndicate, one email and one contract are sent for a multi-creator deal. Each creator needs their own offer, acceptance, deliverables, and payout.
- There is no counter-offer path.
- The email CTA does not lead to a working acceptance page.

**Recommendation:** Split this into four explicit actions:

1. **Draft** — Agent 2 produces a draft. Nothing is sent.
2. **Review & edit** — the brand can edit scope, milestones, amounts, dates, evidence requirements, legal clauses, and recipients. Validate totals and dates.
3. **Approve internally** — an explicit "Approve & send" action, with the approver recorded.
4. **Send** — generate one offer per creator/participant, with a unique magic link, expiry, and version.

This is the "meet in the middle": the agent still does the drafting work, but the employee owns the send button.

---

### Stage 4 — Funding

**Current behaviour:** `capture-order` marks the proposal `FUNDED` and sets **all** milestones to `COMMITTED_IN_LEDGER`.

**Risks:**
- **"Escrow" is not escrow.** A captured PayPal order settles to the platform/merchant account. Holding funds for third parties can trigger payment-service-provider and escrow licensing questions in Kenya. Calling it "locked in PayPal" in front of an investor or regulator is risky.
- No partial funding, no milestone-by-milestone funding, no refund/credit-note path.
- No reconciliation between the PayPal capture and the internal ledger.
- No idempotency: a double click or retry could double-commit.

**Recommendation:** Decide the funding model deliberately:
- **Option A (recommended for MVP):** brand funds the campaign (or the first milestone) into a platform ledger; release per approved milestone. Be explicit that this is a **platform-held committed balance**, not a licensed escrow. Add a partner/legal review before pilot.
- **Option B (cleaner legally):** create a separate payment order per milestone and capture it only when that milestone is approved. Less float risk, but less upfront certainty for the creator.
- **Option C (product-grade):** use a licensed PSP/escrow partner or a segregated client account. This is a Phase C decision.

Whichever you choose, add an append-only ledger and an idempotency key per funding/payout action.

---

### Stage 5 — Proof-of-play (your "Step 3")

**Current behaviour:** the brand clicks a button, Agent 3 analyses a synthetic frame, injects simulated metrics, and returns `PASSED` with ~96% confidence. The UI then offers "Proceed to payout".

**Why it does not survive an investor demo:**
- The evidence is not the creator's evidence. It is generated by the system.
- The airtime and verbal callouts are hard-coded, not measured.
- There is no creator submission queue, no reviewer, no rejection, no revision window.
- A "PASSED" certificate can be created without a real stream, real frame, or real audio.
- The payment path does not require a human approval.
- The certificate is a hash of a string, not a proof of the underlying media.

**What it should be:**

```
Creator uploads evidence
        ↓
Evidence is stored with hash + metadata
        ↓
Agent 3 produces a verification REPORT (not a verdict)
  - what it checked
  - what it found
  - confidence and limitations
  - links to the exact frames/timestamps
        ↓
Human reviewer (Barbah ops and/or brand employee) sees:
  - the evidence
  - the report
  - the milestone acceptance criteria
  - Approve / Request changes / Reject
        ↓
Only an APPROVED decision can trigger payment
```

**Important distinction:** Agent 3 recommends; a human decides. For low-risk, pre-agreed criteria you can allow **auto-approval with audit**, but the default should be human review. This is exactly the "employee makes work easier" principle.

**What evidence should a creator submit?** (answering your "what else?")

| Milestone type | Evidence |
|---|---|
| Stream/broadcast | Stream URL + VOD link, timestamps of brand mentions, overlay screenshots at required resolution, platform analytics export (concurrents, watch time), chat moderation log |
| Venue/activation | Wide venue photo, banner close-up, crowd/attendance photo, event date/time metadata, venue contact, attendee count, consent/release forms if filming |
| Short-form clips | Published clip URLs (TikTok/Reels/Shorts), post insights screenshots/exports, caption/hashtag proof, publication date |
| Tournament | Bracket/results, participant roster, winner list, organiser sign-off, venue photos |
| Brand assets | Overlay/asset screenshots, brand guideline compliance checklist, approval from brand |
| Financial/ops (if reimbursable) | Receipts/invoices for physical costs, delivery notes |
| Compliance | Competitor-conflict declaration, exclusivity confirmation, age/consent confirmation |

Each evidence item should have: accepted formats, required/optional, verification method (AI-assisted or manual), deadline, and who reviews it.

**Evidence integrity:** store the original file, SHA-256 hash, upload timestamp, uploader, and (where possible) platform API data. Do not rely on screenshots alone. For streams, prefer platform APIs or a screen-recorded continuous capture over a single frame.

---

### Stage 6 — Invoicing and payout

**Current behaviour:** `disburse-milestone` can be called with any certificate ID. It generates a mock eTIMS invoice, pays `milestone.amount * 0.95` to the first creator's PayPal email, and marks the milestone `DISBURSED`.

**Risks:**
- No check that the milestone was actually approved by a human.
- No check that the proposal was funded.
- No idempotency; retries can double-pay.
- Only the first creator is paid in a syndicate.
- No platform-fee invoice at the right time, no credit note/refund, no WHT remittance record.
- No handling of payout failure, reversal, chargeback, or FX difference.
- The eTIMS invoice is generated per milestone but the platform fee invoice is generated at order creation. The timing and tax treatment need a Kenyan tax advisor's review.
- PayPal Payouts to Kenyan creators and "instant M-Pesa off-ramp" are not native PayPal features. Validate the actual rail before promising it.

**Recommendation:** Model money as a ledger, not a status field:

```
FundingCommitment (brand → platform)
  → LedgerEntry (credit)
Milestone approval
  → Invoice (platform fee + creator service)
  → PaymentIntent (unique idempotency key)
  → Payout (PayPal / M-Pesa / bank)
  → LedgerEntry (debit)
  → Reconciliation
```

Every state change writes an audit event. A payout is only possible from an `APPROVED` milestone, with a valid tax profile, and an unused idempotency key. Failures go to a reconciliation queue, not to a silent exception.

---

### Stage 7 — Impact dossier

**Current behaviour:** Agent 6 sums `monthly_reach` from creator profiles and multiplies campus clubs by 450 and creators by 12 badges. The UI labels it "verified".

**My honest view:** The **idea** is valuable — corporate buyers increasingly need ESG/CSR reporting, and "we funded grassroots gaming" is a good story. But the current implementation is the weakest part of the product because the numbers are not derived from the campaign.

**Recommendation:** Keep it, but change its role and its claims:
- Rename it **"Campaign Performance & Impact Report"**.
- Generate it at campaign close, not as a required stage.
- Separate **measured** metrics (platform analytics, payout records, verified creator locations) from **estimated** metrics (reach, audience demographics).
- Show the methodology and limitations next to every number.
- Link each metric to evidence.
- Make it an optional add-on for brands that need ESG/CSR reporting, not a blocker for payment.

If you cannot verify a number, label it as an estimate. Investors and corporate buyers will trust a smaller, honest number more than a large, invented one.

---

## 4. The product principle: AI drafts, human decides, system enforces

Three lanes:

| Lane | Responsibility | Examples |
|---|---|---|
| **Agent lane** | Research, draft, analyse, detect anomalies, summarise | Parse brief, shortlist creators, draft milestones, pre-check evidence, draft impact report |
| **Human lane** | Decisions with accountability | Brand approves proposal and send; reviewer approves evidence; finance approves payout exceptions |
| **System lane** | Rules, permissions, state, money, audit | State transitions, role checks, idempotency, ledger, notifications, audit log |

The UI should always answer three questions for the human:
1. What did the agent do?
2. Why did it do it?
3. What decision is needed from me now?

---

## 5. Proposed target workflow

### 5.1 End-to-end

```
0. Accounts & verification
   Brand org + users/roles; creator profile + channel verification + payout/tax details

1. Brief
   Brand submits structured brief; Agent 1 returns shortlist + trade-offs

2. Selection
   Brand edits the bundle; removes/adds creators; sees budget/reach/conflicts

3. Proposal draft
   Agent 2 drafts scope, milestones, amounts, dates, evidence requirements
   Brand edits; internal approval; preview email; choose recipients

4. Offer delivery & creator onboarding
   One offer per creator; magic link; account creation; profile completion;
   offer review; accept / counter / decline

5. Negotiation
   Structured counter (amount, scope, dates, evidence); brand reviews;
   new version; accept; e-signature record

6. Funding
   Brand funds campaign or first milestone; ledger entry; receipt

7. Execution
   Creator sees only their milestones; submits evidence per milestone;
   system validates file types, hashes, deadlines

8. Verification
   Agent 3 pre-checks; human reviewer sees evidence + report;
   Approve / Request changes / Reject; revision window

9. Invoicing & payout
   Platform fee invoice + creator service invoice; WHT record;
   payout intent; payout; ledger entry; receipt

10. Next milestone or close
    Unlock next milestone if dependencies met; otherwise campaign close,
    reconciliation, final report, repeat/renewal prompt
```

### 5.2 What "fulfilled" means

A milestone is **fulfilled** when all of these are true:

1. The creator submitted the required evidence before the deadline.
2. The system validated the evidence (file type, size, hash, required fields).
3. Agent 3 produced a verification report.
4. A human reviewer approved it (or an auto-approval rule applied, with audit).
5. The dispute/review window passed.
6. The creator's tax/payout profile is valid.

Only then does the system create the invoice and payment intent.

### 5.3 What happens after payment

- Mark the milestone `PAID` and `CLOSED`.
- If there is a next milestone and its dependencies are met, move it to `IN_PROGRESS` and notify the creator.
- If the campaign is complete, mark the contract `COMPLETED`, run reconciliation, generate the final report, and prompt the brand for a repeat campaign.
- If the creator fails or disappears, move to `EXPIRED`/`DISPUTED`; offer reassignment or a credit/refund per the contract.
- If the brand wants new scope, create a **change order** (new version), not an edit to the signed contract.

---

## 6. State machines

### 6.1 Proposal / contract

```
DRAFT
  → IN_REVIEW
  → CHANGES_REQUESTED → IN_REVIEW
  → APPROVED
  → SENT
  → VIEWED
  → COUNTERED → IN_REVIEW (new version)
  → ACCEPTED
  → FUNDED
  → ACTIVE
  → COMPLETED

Any state → DECLINED / EXPIRED / CANCELLED
Active → DISPUTED → ACTIVE / CANCELLED
```

### 6.2 Milestone

```
DRAFT
  → LOCKED (contract accepted)
  → FUNDED
  → IN_PROGRESS
  → EVIDENCE_SUBMITTED
  → AI_REVIEWED
  → APPROVED
  → INVOICED
  → PAID
  → CLOSED

EVIDENCE_SUBMITTED / AI_REVIEWED → REVISION_REQUESTED → EVIDENCE_SUBMITTED
AI_REVIEWED → REJECTED → DISPUTED / CLOSED
Any state → CANCELLED
```

### 6.3 Participant (per creator in a syndicate)

```
INVITED → ONBOARDING → OFFER_VIEWED → ACCEPTED / COUNTERED / DECLINED
ACCEPTED → ACTIVE → COMPLETED
```

### 6.4 Payment

```
INTENT_CREATED → APPROVED → PROCESSING → PAID → RECONCILED
PROCESSING → FAILED → RETRY / MANUAL_REVIEW
PAID → REFUNDED / REVERSED
```

Every transition needs:
- allowed actor/role
- guard conditions
- audit event
- notification
- idempotency where money is involved

---

## 7. Data model changes

The current schema is a good sketch, but it cannot support per-creator offers, versioning, evidence, or audit. Add:

| Entity | Purpose |
|---|---|
| `Organization` | Brand/agency tenant |
| `User`, `Membership` | People and roles inside an organisation |
| `CreatorProfile` | Creator/team/venue profile |
| `CreatorVerification` | Channel ownership, identity, payout/tax status |
| `Campaign`, `Brief` | Campaign and structured brief |
| `MatchRun`, `Syndicate`, `SyndicateMember` | Agent 1 output and editable bundle |
| `Proposal`, `ProposalVersion` | Draft and immutable versions |
| `ParticipantOffer` | Per-creator offer, allocation, acceptance |
| `Milestone`, `MilestoneVersion` | Milestone plan, versioned |
| `Evidence` | Uploaded proof with hash, metadata, uploader |
| `VerificationReport` | Agent 3 output, model/version, findings |
| `ReviewDecision` | Human approve/reject/revision, reviewer, reason |
| `ContractSignature` | Consent/e-signature record |
| `FundingCommitment` | Brand funding event |
| `LedgerEntry` | Append-only money movements |
| `PaymentIntent`, `Payout` | Idempotent payment execution |
| `Invoice`, `TaxProfile`, `WHTRecord` | Tax documents and remittance |
| `Notification`, `Message` | Email/in-app/chat |
| `Dispute` | Dispute lifecycle |
| `AuditEvent` | Who did what, when, from where |
| `ImpactReport` | Final report with measured vs estimated metrics |

**Money:** use integer minor units (cents) plus currency, never floats. Store the FX rate used at the time of each transaction. Add a `currency` field to every amount.

**Versioning:** never mutate a sent proposal or signed contract. Create a new version and point `current_version_id` at it. This is essential for disputes and audits.

---

## 8. Risk register

| Risk | Why it matters | Mitigation |
|---|---|---|
| **"Escrow" is not legally escrow** | Holding third-party funds may require a licence; investor/regulator scrutiny | Call it a committed balance; use a licensed PSP/escrow partner before pilot; legal review |
| **Payment double-spend / retries** | Double payout destroys trust and margins | Idempotency keys, unique constraints, ledger, reconciliation queue |
| **No auth / tenant isolation** | Anyone can read or act on any brand/creator | Real auth, RBAC, org scoping, audit log |
| **Fake evidence / bots / collusion** | Proof-of-play loses credibility | Platform APIs, hashes, metadata, human review, anomaly detection, sample audits |
| **AI makes a wrong payment decision** | Financial and reputational loss | AI recommends, human approves; confidence thresholds; appeal path |
| **Tax non-compliance** | eTIMS/WHT/VAT errors can invalidate deductibility | Kenyan tax advisor, KRA-certified integrator, clear prototype labels |
| **PayPal/M-Pesa rail assumptions** | "Instant M-Pesa" may not exist natively | Validate rails; abstract payout provider; fallback bank/Payoneer |
| **Chargebacks/refunds** | Creator or brand disputes | Contract terms, dispute state, credit notes, reserve policy |
| **Creator no-show** | Brand paid for nothing | Milestone funding, expiry, reassignment, reputation score |
| **Brand non-payment / slow review** | Creator distrust | Pre-funding, review SLA, escalation, auto-release rules with audit |
| **Data protection (Kenya DPA 2019)** | PII, KYC, evidence, minors | Consent, retention policy, encryption, access control, DPIA |
| **Minors in gaming audiences** | Consent and safeguarding | Age gates, creator eligibility, attendee consent for filming |
| **Cold start** | No creators = no brands and vice versa | Start with Barbah's existing community; curated supply; concierge onboarding |
| **Disintermediation** | Brand and creator go direct after intro | Contracts, payment rails, verification, reputation, ongoing value |
| **Two frontends** | Inconsistent behaviour and double maintenance | Consolidate on React; keep static as a demo fallback only |
| **Demo failure** | Live sandbox/network/API issues | Deterministic demo mode, seeded data, reset endpoint, offline fallback, recorded backup |
| **Secret leakage** | Runtime SMTP config endpoint is unauthenticated | Remove/secure admin endpoints; rotate secrets; env-only config |

---

## 9. Phased plan

### Phase A — Credible investor demo (1–2 weeks)

Goal: a two-session demo that tells the truth about what is simulated.

1. Single explicit state machine for proposal, milestone, evidence, payment.
2. Split proposal **draft** from **send**. Brand can edit milestones and preview the email.
3. Creator magic-link onboarding page: view offer → create account → accept/counter/decline.
4. Creator evidence upload page tied to a specific milestone (no typing IDs).
5. Evidence review queue for the brand/ops: evidence + AI report + Approve/Request changes.
6. Payment only from an approved milestone; simulated payout with a ledger entry.
7. Clear "SIMULATED" labels on PayPal/eTIMS/AI where applicable.
8. Demo reset endpoint and a scripted two-session walkthrough.
9. Fix the broken routes (`/creator/offers/:id/accept`, campaign detail).

### Phase B — Product foundation (3–6 weeks)

1. Postgres + migrations; remove in-memory store.
2. Real auth, RBAC, organisation scoping, audit log.
3. Per-creator participant offers and allocations in syndicates.
4. Counter-offer and change-order flows.
5. Idempotency, ledger, reconciliation, webhook scaffolding.
6. File storage with signed URLs, hashes, type/size validation.
7. Notification centre (email + in-app).
8. Tests for rejection, revision, expiry, double payment, permissions.
9. Observability: structured logs, request IDs, error tracking.

### Phase C — Pilot readiness

1. Real SMTP/email provider with deliverability and unsubscribe.
2. PayPal sandbox → live review; payout provider decision.
3. KYC/AML and creator verification.
4. KRA eTIMS partner/certification; tax advisor sign-off.
5. Dispute/support workflow and SLAs.
6. Legal: terms, privacy, contract templates, e-signature.
7. Reconciliation and finance reporting.

### Phase D — Differentiation

1. Real platform analytics integrations.
2. Evidence-based impact report.
3. Syndicate optimisation and audience deduplication.
4. WhatsApp/USSD creator notifications.
5. Creator reputation/skills passport with real completed work.

---

## 10. What I would change in the code first (after sign-off)

1. **Introduce enums and a transition service.** Remove ad-hoc status strings. One place decides what transitions are legal and who can perform them.
2. **Split `createProposal` from `sendProposal`.** Add `PATCH /proposals/{id}` for draft edits and a `POST /proposals/{id}/send` action.
3. **Add `ParticipantOffer`.** A syndicate is a bundle of individual offers, each with its own allocation, milestones, acceptance, and payout.
4. **Add `Evidence`, `VerificationReport`, `ReviewDecision`.** Payment requires an approved decision, not just a certificate.
5. **Add idempotency and a ledger.** Every funding/payout action gets a unique key and an append-only entry.
6. **Add auth middleware and org scoping.** Stop trusting client-supplied creator IDs, emails, and proposal IDs.
7. **Add the creator magic-link route and onboarding page.** Fix the email CTA and the accept route.
8. **Consolidate the frontend or define a clear API contract.** `CampaignDetail` needs real data; the static wizard should be demo-only.
9. **Replace floats with integer minor units and FX snapshots.**
10. **Add a demo mode flag and a reset endpoint.** Label every simulated integration honestly.

---

## 11. What to keep, what to change (meeting in the middle)

| Keep | Change |
|---|---|
| The six-agent narrative | Agents become assistants that draft and recommend, not decide |
| The step-by-step wizard | Add review checkpoints and real state between steps |
| Syndicate vs solo pathways | Syndicates become editable bundles of individual offers |
| PayPal + eTIMS dual rail | Be precise about what is real, simulated, or pending certification |
| The 30/40/30 milestone idea | Make milestones editable, dated, evidence-specific, and versioned |
| The impact dossier | Make it optional, evidence-based, and honest about estimates |
| The frontend look and palette | Keep it; wire it to the new workflow |
| The hackathon demo energy | Add a two-session, human-in-the-loop demo that investors can believe |

---

## 12. Open questions for you

1. **Who is the human reviewer in the MVP?** Barbah ops, the brand employee, or both? My recommendation: Barbah ops prepares the review; the brand approves high-value or brand-sensitive milestones.
2. **Syndicates: one contract with a lead creator, or one offer per creator?** My recommendation: one offer per creator, with a syndicate grouping. It is the only way to handle payouts, deliverables, and tax correctly.
3. **What does "counter" mean?** A structured counter (amount, scope, dates, evidence) plus a chat thread, or free-text negotiation? My recommendation: structured counter with an optional message.
4. **Payment rail for the MVP:** keep PayPal sandbox + mock eTIMS, or integrate a real M-Pesa/Daraja path? My recommendation: keep sandbox/mock for the demo, but design a payout-provider abstraction now.
5. **Is the immediate goal an investor demo or a real pilot?** This changes how much we invest in auth, persistence, and compliance before the next conversation.
6. **How much of the frontend should I touch?** I would prefer to own the workflow/API contract and leave visual implementation to the frontend developer, with a shared component/route spec.
7. **Do you want me to write the detailed spec first, or start with a thin vertical slice?** My recommendation: a thin vertical slice of the two-session demo (draft → send → accept → evidence → review → payout), then expand.

---

*Prepared as a discussion document. No code has been changed.*
