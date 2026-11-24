# SponsorPlay — Frontend Handoff & Vision Brief

**Audience:** visual/frontend developer
**From:** workflow & platform engineering
**Companion doc:** `SPEC_WORKFLOW_V1.md` (the contract behind every screen)
**Your ownership:** palette, typography, spacing, motion, illustration, overall craft
**My ownership:** routes, page structure, state logic, data wiring, component behaviour

---

## 1. The vision in one paragraph

SponsorPlay is the operating system for gaming sponsorships in Kenya. A brand describes a campaign; AI does the research, matching, drafting, and checking; a human makes every decision that matters; and the system enforces the rules, the money, and the audit trail. The interface should feel like **a calm, competent operations desk** — not a chatbot, and not a wizard that decides for you. The emotional target is *"I can see exactly what is happening, who is responsible, and what I need to do next."*

The current build is a **demo of agents**. We are turning it into a **workspace for decisions**. That is the single biggest shift, and it should be visible in the layout: fewer full-screen steps, more persistent context, clearer ownership.

---

## 2. What changes conceptually

| Before | After |
|---|---|
| A 7-step wizard you click through | A campaign workspace with tabs and persistent status |
| Agents act, human clicks "next" | Agents propose, human approves, system enforces |
| Status is a coloured badge | Status is a position in a named state machine |
| One contract for a syndicate | One offer per creator, grouped visually |
| "Verified" as a label | "Checked by AI, approved by ops" as a traceable fact |
| A demo that hides simulation | A demo that labels simulation honestly and still impresses |

**Do not** redesign the palette, type, or tone you have established. Everything below is about *structure, hierarchy, and states*. Style it in your language.

---

## 3. The one rule that must survive styling

> Every agent output must answer three questions on screen: **what it did**, **why**, and **what decision is needed now**.

If a card shows an AI score with no reason, it is wrong. If a screen shows a status with no next action, it is wrong. If a human decision is buried below an agent's opinion, it is wrong.

---

## 4. The three lanes

We use this as a visual language across the product. Keep it subtle, but consistent.

| Lane | Meaning | Suggested treatment (yours to refine) |
|---|---|---|
| **Agent** | Research, draft, check, summarise | Muted surface, monospace-ish metadata, "Drafted by Agent 2 · 14:02" |
| **Human** | A decision with a name attached | Clear primary action, reviewer avatar/initials, timestamp |
| **System** | Rules, money, audit, locks | Quiet, factual, never decorative; lock icons, ledger rows, IDs |

A screen should never leave the user guessing which lane they are in. The most common failure is an agent recommendation styled like a human decision.

---

## 5. Status vocabulary

Do not invent a colour per status string. There are **five families**, and every state in the system maps to one:

| Family | Meaning | States |
|---|---|---|
| **Neutral** | Not started / draft / locked | `DRAFT`, `IN_REVIEW`, `LOCKED`, `INVITED`, `SENT` |
| **Progress** | Active, waiting on someone | `VIEWED`, `COUNTERED`, `FUNDED`, `IN_PROGRESS`, `EVIDENCE_SUBMITTED`, `AI_REVIEWED` |
| **Attention** | Needs a human now | `CHANGES_REQUESTED`, `REVISION_REQUESTED`, `HUMAN_REVIEW`, `EXPIRED` |
| **Success** | Done and trustworthy | `APPROVED`, `ACCEPTED`, `PAID`, `CLOSED`, `COMPLETED` |
| **Risk** | Failed, disputed, cancelled | `REJECTED`, `FAILED`, `DISPUTED`, `CANCELLED`, `REVERSED` |

**Accessibility constraint (not a style preference):** status must be distinguishable **without colour alone** — pair every colour with an icon or a label. This will be projected at iHub on an unknown screen.

---

## 6. Screen inventory

Routes are fixed. Layout and visual treatment are yours. I will build the structural version of each; you refine.

### Brand side

| Route | Purpose | Key elements | Critical states |
|---|---|---|---|
| `/brand` | Campaign list | KPI strip, campaign cards with status family, "New campaign" | empty, loading, error |
| `/brand/campaigns/new` | Brief | Free-text brief + optional structured fields (objective, KPI, geography, dates), budget with currency | validation, AI running |
| `/brand/campaigns/:id` | **Campaign workspace** | Header with status + next action; tabs below | see tab list |
| ↳ Overview | Where am I? | Timeline of state changes, current owner, next action | — |
| ↳ Matches | Agent 1 output | Syndicate and solo cards, "why this creator", editable bundle, budget/reach recalculation | rerunning |
| ↳ Proposal | Draft and versions | Milestone table (editable), totals, validation panel | dirty, invalid, in review, approved, sent |
| ↳ Offers | Per-creator offers | One row per creator: sent/viewed/countered/accepted, token status | pending, countered, expired |
| ↳ Milestones | Execution | Milestone cards with evidence status and review state | locked, in progress, submitted, revision, paid |
| ↳ Money | Funding and payouts | Committed balance, ledger entries, invoices | unfunded, partially released, settled |
| ↳ Audit | Traceability | Reverse-chronological events with actor and before/after | — |
| `/brand/proposals/:id/edit` | Proposal editor | Milestone table, evidence requirements editor, clause editor, live totals | unsaved changes |
| `/brand/proposals/:id/preview` | **The send gate** | Rendered email, recipient list, validation summary, approve + send | blocked, ready |
| `/brand/campaigns/:id/report` | Performance & impact | Measured vs estimated split, methodology notes, evidence links | incomplete data |

### Ops side

| Route | Purpose | Key elements | Critical states |
|---|---|---|---|
| `/ops/queue` | Review queue | Rows sorted by SLA, milestone, creator, age, recommendation | empty, overdue |
| `/ops/milestones/:id` | **Review detail** | Evidence gallery, verification report, acceptance criteria, decision form | needs decision, overridden |

This is the screen that proves the product is honest. It must show the evidence *and* the agent's limitations side by side, with the human decision as the primary action.

### Creator side

| Route | Purpose | Key elements | Critical states |
|---|---|---|---|
| `/offer/:token` | **Public offer page** | Brand, scope, milestones, payout schedule, fees explained, accept / counter / decline | expired, already accepted |
| `/offer/:token/counter` | Structured counter | Amount, scope, dates, message | validation |
| `/creator` | Dashboard | Active campaigns, next milestone, earnings, verification status | unverified, no offers |
| `/creator/campaigns/:id` | Campaign detail | Milestone cards, evidence requirements, submission history | locked, revision requested |
| `/creator/milestones/:id` | Milestone + evidence | Required items checklist, upload area, submit, report after review | missing items, submitted, approved |

The offer page is the first impression a creator gets. It should feel like a real contract, not a marketing page: clear money, clear obligations, clear dates, and no dark patterns.

---

## 7. The send gate (most important screen)

`/brand/proposals/:id/preview` is where the product earns trust. It should make three things unmissable:

1. **What will be sent** — the actual email, rendered.
2. **To whom** — one row per creator, with their allocation.
3. **What is still wrong** — a validation list that blocks send until resolved.

The primary action is **Approve & send**, and it must feel deliberate: a confirmation that names the recipients and the total. This is the moment where the human takes responsibility, and the UI should say so.

Copy direction: *"You are about to send 3 offers totalling KES 487,500. Each creator will receive their own link. Nothing is sent until you confirm."*

---

## 8. The review screen (second most important)

`/ops/milestones/:id` must never look like a rubber stamp. Structure:

```
┌ Evidence (what the creator sent) ────────────┐
│  thumbnails, VOD link, metadata, hashes      │
├ Verification report (what the agent found) ──┤
│  checks with PASS / FAIL / INCONCLUSIVE      │
│  confidence, method, limitations             │
│  recommended decision (clearly a suggestion) │
├ Acceptance criteria (what was promised) ─────┤
├ Your decision ───────────────────────────────┤
│  [ Approve ] [ Request changes ] [ Reject ]  │
│  reason required on override                 │
└──────────────────────────────────────────────┘
```

Visual rule: the agent's recommendation is **visually subordinate** to the human decision. Never render the recommendation as an already-pressed button.

---

## 9. Simulation honesty

Every simulated capability carries a visible, consistent marker: **`SIMULATED`** — PayPal capture, eTIMS invoice, payout settlement, FX. Use one treatment everywhere so it reads as integrity, not as a bug.

This is a pitch asset, not an apology. The line to hold in the design: *"We show you exactly what is real."*

---

## 10. Motion and feedback

- Motion should explain a state change, not decorate it. A milestone moving to `APPROVED` can transition; a card should not bounce.
- Agent work should feel like *work happening*: a quiet progress state with a named step ("Checking overlay visibility…"), not a fake typing animation.
- Optimistic updates are fine for edits, never for money or approvals. Those wait for the server.
- Never show a spinner where a skeleton preserves layout.

---

## 11. Copy and tone

- Plain, specific, calm. Name the actor: *"Ops requested a new VOD timestamp"*, not *"Action required"*.
- Never claim certainty the system does not have: *"Could not verify airtime from screenshots"* beats *"Verification failed"*.
- Money is always explicit about currency, fees, and what is withheld.
- Buttons say what happens: *"Approve & pay"*, *"Request new evidence"*, *"Send 3 offers"*.
- Empty states teach the next step, not just announce emptiness.

---

## 12. Demo conditions

The pitch is two browser windows side by side, projected.

- Assume a projector: high contrast, large type for status and money, no thin grey-on-grey.
- Assume 3 metres viewing distance: the current owner and the next action must be legible at a glance.
- Assume a cold room and a nervous presenter: no interaction should require more than one obvious next click.
- Design for a **6-minute run**. Every screen in the demo path should have one primary action.

---

## 13. Boundary of work

**I build:** routes, page shells, data fetching, state machines, forms, validation, upload, tables, status components, error/empty states, the API contract.

**You build:** palette application, typography scale, spacing rhythm, component styling, iconography, illustration, motion, responsive polish, the overall feel.

**We agree together:** the status component, the evidence gallery, the milestone card, and the review decision panel — these four are used everywhere and should be designed once.

**Process:** I land a structural screen → you restyle in place → we review against the demo script. No parallel rewrites of the same file.

---

## 14. What "done" looks like for the pitch

- A stranger can tell, within five seconds on any screen, **who owns the next action**.
- The agent's contribution is visible and clearly advisory.
- The human decision is obvious, named, and recorded.
- Simulated things are labelled without undermining confidence.
- The two windows tell one continuous story without narration.
- Nothing on screen claims a number the system cannot defend.

---

*Structure and behaviour are specified in `SPEC_WORKFLOW_V1.md`. Style is yours.*
