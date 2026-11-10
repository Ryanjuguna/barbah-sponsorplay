# Barbah SponsorPlay

## Autonomous Multi-Agent Sponsorship Marketplace with PayPal Programmatic Milestone Ledger and KRA eTIMS Tax Compliance

**Competition:** PayPal Global Hackathon  
**Track:** Challenge 02 - Sponsor Play  
**Ecosystem:** Barbah PlayEconomy (Barbah Games, Kenya)  
**Location:** Nairobi, Kenya  

---

## 0. Judge Setup (Start Here)

* **Hosted Demo:** `TODO: paste Render URL here once deployed (e.g. https://barbah-sponsorplay.onrender.com)` — no login or credentials needed. Render's free tier sleeps when idle; open the link a minute before judging if it's been quiet.
* **API Docs:** `<hosted URL>/docs`

### Run It Locally Instead

```bash
git clone https://github.com/Ryanjuguna/barbah-sponsorplay.git
cd barbah-sponsorplay
cp .env.example .env   # fill in your own PayPal Sandbox + Anthropic keys
pip install -r requirements.txt
PYTHONPATH=. python test_flow.py   # automated end-to-end verification
python run_demo.py                  # interactive dashboard at http://127.0.0.1:8000
```

See Section 6 for the full Quickstart and Section 7 for connecting your own PayPal Sandbox credentials.

> We are not distributing BARBAH's PayPal Sandbox login in this repo or README — the hosted demo above needs no credentials. If judges need direct sandbox access for any other reason, check with Andrew on how he wants that handled before sharing it.

---

## 1. Executive Summary

In Kenya, the video gaming and digital creator market is valued between $100 million and $137 million, with over 85% mobile and console penetration among urban youth. Major corporate enterprises such as Safaricom, Red Bull, KCB Bank, and international consumer brands want to connect with young gaming audiences. However, 95% of grassroots esports talent, campus gaming clubs, and neighborhood gaming lounges remain commercially unmonetized.

The primary obstacle is not a lack of audience or talent. It is a fundamental trust and regulatory compliance deficit between corporate marketing departments and grassroots creators.

### The Core Barriers

1. **The Tax Deductibility Wall (KRA Section 16):** Under Section 16(1)(c) of the Kenya Income Tax Act, any corporate expense not supported by a valid electronic tax invoice generated through KRA eTIMS is disallowed. This penalizes the corporate sponsor with an automatic 30% corporate income tax surcharge. Because grassroots gaming creators lack corporate tax registration and enterprise invoicing tools, corporate compliance officers actively block sponsorships.
2. **The Deliverable Verification Void:** Sponsors face vanity metric fraud (bought bot traffic, manipulated screenshots) and creator ghosting, while creators face uncompensated work, arbitrary scope creep, and payment defaults.
3. **Payment Liquidity Asymmetry:** Grassroots creators cannot survive on corporate Net-90 credit terms, while sponsors refuse to disburse 100% upfront capital without delivery guarantees.

Barbah SponsorPlay resolves this dilemma by deploying an autonomous multi-agent AI system operating on a dual-rail financial engine that integrates the PayPal Developer Platform with Kenya Revenue Authority (KRA) eTIMS tax compliance.

---

## 2. Core Architecture and Innovation

SponsorPlay replaces static directories and rigid algorithmic bounties with an autonomous multi-agent swarm managed through a deterministic state machine:

```
+---------------------------------------------------------------------------------------------------+
|                                  SPONSORPLAY MULTI-AGENT SWARM                                    |
|                                                                                                   |
|  Agent 1: Talent Scout       --> Deconstructs brief; deduplicates reach; bundles micro-syndicates |
|  Agent 2: Campaign Architect --> Generates 3-phase milestone contracts (30/40/30) and pricing     |
|  Agent 4: Financial & Tax    --> Orchestrates PayPal Orders v2 multiparty splits and eTIMS BII    |
|  Agent 3: Multimodal Verifier--> Computes logo screen ratio (>=3.5%) and Whisper STT slogans      |
|  Agent 5: Brand Guardian     --> Audits live stream chat sentiment and competitor clashes         |
|  Agent 6: MetaTwin ESG       --> Generates C-Suite ESG and youth development impact dossiers      |
+---------------------------------------------------------------------------------------------------+
             |                                                                 |
             v (PayPal Orders v2 & Payouts)                                    v (KRA eTIMS Invoicing)
+-----------------------------+                                   +-----------------------------+
|   PayPal Developer Sandbox  |                                   |   KRA eTIMS Fiscal Engine   |
|  - Orders v2 Multiparty     |                                   |  - Section 16 Tax Invoice   |
|  - Programmatic Milestone   |                                   |  - Buyer-Initiated Invoice  |
|  - Programmatic Mass Payout |                                   |  - 5% Withholding Tax (WHT) |
|  - Instant M-Pesa Off-Ramp  |                                   |  - Scannable KRA QR Code    |
+-----------------------------+                                   +-----------------------------+
```

### The Six Specialized Autonomous Agents

* **Agent 1: Talent Discovery & Micro-Syndicate Scout:** Analyzes natural language briefs, evaluates creator community density, and bundles balanced syndicates (such as one tournament organizer, two competitive streamers, and three campus gaming dens).
* **Agent 2: Campaign Architect & Contract Generator:** Decomposes campaigns into three verifiable milestones (30% mobilization, 40% live broadcast airtime, 30% post-event archival) and calculates dynamic pricing based on purchasing power parity and actual concurrent viewers.
* **Agent 3: Multimodal Proof-of-Play Verifier:** Ingests live stream VODs and clips, running computer vision to evaluate brand logo screen occupancy (threshold >= 3.5%) and Whisper speech-to-text to verify shoutcaster verbal endorsements. It then seals a tamper-proof cryptographic certificate.
* **Agent 4: Financial Milestone Ledger & Tax Orchestrator:** Manages PayPal Orders v2 multiparty payment splits with programmatic delayed milestone release, executes KRA eTIMS Buyer-Initiated Invoicing (BII prototype), deducts statutory 5% Withholding Tax, and triggers automated payouts via PayPal Payouts API.
* **Agent 5: Real-Time Brand Safety Guardian:** Monitors live chat websockets for toxicity, harassment, and competitor product collisions, with an automated 15-minute creator remediation window.
* **Agent 6: MetaTwin ESG & Social Impact Attribution:** Connects to Barbah MetaTwin infrastructure, tracking youth reached in informal settlements, collegiate players supported, and female gamer participation to generate audit-ready corporate sustainability reports.

---

## 3. The Dual-Rail Financial Engine: PayPal + KRA eTIMS

SponsorPlay bridges international digital payments with Kenya's mandatory electronic fiscal receipting.

### Financial Flow on a KES 100,000 ($769.23 USD) Campaign

* **Gross Sponsor Budget Authorized:** $769.23 (KES 100,000.00)
<<<<<<< HEAD
  * Deposited via PayPal Orders v2 and committed into the programmatic milestone ledger.
=======
  * Deposited via PayPal Orders v2 and locked in the milestone ledger.
>>>>>>> origin/submission-fixes
* **Barbah Facilitation Commission (10%):** $76.92 (KES 10,000.00)
  * Split automatically via `payment_instruction.platform_fees`.
  * Barbah Games issues a platform fee eTIMS tax invoice to the sponsor.
* **Gross Beneficiary Allocation (90%):** $692.31 (KES 90,000.00)
  * Statutory Withholding Tax (WHT at 5% on creator services): $34.62 (KES 4,500.00)
  * Net Liquid Cash Disbursed to Creator: $657.69 (KES 85,500.00)
  * eTIMS Tax Invoice issued via Buyer-Initiated Invoicing (BII) under Section 23A of the Tax Procedures Act.
* **Total Tax-Deductible Invoices Delivered to Sponsor:** KES 100,000.00 (100% compliant under Section 16).

---

## 4. Repository Structure

```
barbah-sponsorplay/
|-- app/
|   |-- main.py                     # FastAPI application and static mount
|   |-- config.py                   # Application settings and environment variables
|   |-- models/
|   |   |-- schemas.py              # Pydantic data schemas
|   |   |-- database.py             # Data access layer and preloaded Kenyan talent graph
|   |-- agents/
|   |   |-- scout_agent.py          # Agent 1: Talent Scout and Syndicate Bundler
|   |   |-- architect_agent.py      # Agent 2: Campaign Architect and Pricing Oracle
|   |   |-- verification_agent.py   # Agent 3: Multimodal Proof-of-Play Verifier
<<<<<<< HEAD
|   |   |-- financial_agent.py      # Agent 4: Financial Milestone Ledger & Tax Orchestrator
=======
|   |   |-- financial_agent.py      # Agent 4: Financial Milestone Ledger and Tax Orchestrator
>>>>>>> origin/submission-fixes
|   |   |-- guardian_agent.py       # Agent 5: Real-Time Brand Safety Guardian
|   |   |-- impact_agent.py         # Agent 6: MetaTwin ESG Impact Attribution
|   |-- integrations/
|   |   |-- paypal_client.py        # PayPal REST v2 client (Orders v2, Payouts, Invoicing)
|   |   |-- etims_client.py         # KRA eTIMS client (OSCU, VSCU, and BII engine)
|   |-- api/
|   |   |-- campaigns.py            # Endpoints for briefs, syndicates, and proposals
|   |   |-- payments.py             # Endpoints for the milestone ledger, captures, payouts, and invoices
|   |   |-- verification.py         # Endpoints for deliverable verification and chat audit
|   |   |-- impact.py               # Endpoints for MetaTwin ESG reports
|   |-- static/
|       |-- index.html              # Single-page web dashboard and 5-step wizard
|       |-- css/style.css           # Styling and layout
|       |-- js/app.js               # Frontend logic and AG Grid initialization
|-- data/
|   |-- seed_creators.json          # Preloaded Kenyan creators, clubs, and gaming lounges
|   |-- seed_campaigns.json         # Preloaded sample campaign briefs
|-- postman/
|   |-- SponsorPlay_API_Collection.json # Postman API test collection for judges
|-- test_flow.py                    # End-to-end automated verification test suite
|-- run_demo.py                     # Local demo server runner script
|-- SPONSORPLAY_MASTER_BLUEPRINT.md # Master engineering and venture strategy specification
|-- README.md                       # Project documentation
```

---

## 5. Technology Foundation

* **Backend:** Python 3.10+, FastAPI, Pydantic v2, Uvicorn, SQLite/JSON persistence.
* **Agentic AI:** LangGraph-style state machine, multimodal reasoning, Whisper speech-to-text, computer vision heuristics.
* **Fintech and Payments:** PayPal Developer Platform (`Orders v2`, `payment_instruction.platform_fees`, `Payouts API`, `Webhooks`).
* **Tax Compliance:** KRA eTIMS OSCU/VSCU protocol, Buyer-Initiated Invoicing (BII under Section 23A of the Tax Procedures Act).
* **Frontend:** AG Grid Community, Tailwind CSS, custom milestone timeline renderer, QRCode.js.
* **API Testing:** Postman Collection v2.1 format.

---

## 6. Quickstart Guide

### 6.1 Prerequisites

* Python 3.10 or higher.
* Install dependencies from `requirements.txt`:
  ```bash
  pip install -r requirements.txt
  ```

### 6.2 Run Automated Verification Test Suite

Run the end-to-end test verifying all eight stages of the sponsorship lifecycle:
```bash
PYTHONPATH=. python test_flow.py
```

Expected output:
```
===========================================================================
BARBAH SPONSORPLAY: END-TO-END AUTOMATED VERIFICATION TEST
PayPal AI Hackathon - Challenge 02: Sponsor Play (Barbah Games Kenya)
===========================================================================

[STEP 1] Verifying System State & Preloaded Kenyan Talent Graph...
  [+] Loaded 7 Kenyan esports creators and communities
[STEP 2] Submitting Brand Brief to Agent 1 (Scout)...
  [+] Agent 1 analyzed brief and synthesized 2 Sponsorship Syndicates
[STEP 3] Generating Executable Milestone Agreement via Agent 2 (Architect)...
  [+] Proposal Generated ID: PROP-511417E2
[STEP 4] Initializing PayPal Orders v2 Multiparty Milestone Ledger (Agent 4)...
  [+] PayPal Order Created: PAYPAL-ORD-3785E1DDEA (Status: CREATED)
  [+] PayPal Payment Captured: Funds safely committed to PayPal Milestone Ledger
[STEP 5] Auditing Live Stream Chat via Agent 5 (Brand Guardian)...
  [+] Chat Safety Status: SAFE (Clean Rate: 100.0%)
[STEP 6] Ingesting Live Stream VOD & Verifying via Agent 3 (Proof-of-Play)...
  [+] Certificate ID: CERT-POP-2C55A0FC4C
  [+] Overall Verification Confidence: 96.2% -> PASSED
[STEP 7] Disbursing Milestone Funds with KRA eTIMS Fiscal Invoicing...
  [+] KRA eTIMS CU Invoice Number: KRA-CU-20261109-7D0EEC
  [+] Tax Invoice Mode: MOCK_ETIMS_PROTOTYPE
  [+] PayPal Payout Item ID: PYITM-2EC4AE9DAD
[STEP 8] Generating Barbah MetaTwin ESG Social Impact Dossier (Agent 6)...
  [+] Total Youth Reach Logged: 38,000

===========================================================================
>>> SUCCESS: ALL 8 STEPS OF THE HACKATHON MVP WORKFLOW VERIFIED! <<<
===========================================================================
```

### 6.3 Launch the Interactive Platform

Start the local server:
```bash
python run_demo.py
```

Open your browser to:
* **Interactive Dashboard:** http://127.0.0.1:8000
* **Interactive Swagger API Documentation:** http://127.0.0.1:8000/docs
* **ReDoc API Documentation:** http://127.0.0.1:8000/redoc

---

## 7. Connecting PayPal Sandbox Credentials

The system operates in dual mode. It runs with an integrated high-fidelity sandbox simulator by default, and seamlessly connects to live PayPal Sandbox endpoints when credentials are provided.

To configure live PayPal Sandbox access:
1. Log in to developer.paypal.com and navigate to Apps & Credentials.
2. Create or select a Sandbox App.
3. Set environment variables or create a `.env` file:
   ```env
   PAYPAL_MODE=sandbox
   PAYPAL_CLIENT_ID=your_sandbox_client_id_here
   PAYPAL_CLIENT_SECRET=your_sandbox_client_secret_here
   ```
4. Restart the server. The application will authenticate directly against `api-m.sandbox.paypal.com`.

---

## 8. Five-Minute Hackathon Demonstration Script

1. **Step 1 - Campaign Brief and Talent Scout:**
   The brand selects the preloaded Safaricom 5G Home Gaming brief with a budget of $769.23 (KES 100,000). The user clicks "Agent 1: Deconstruct Brief & Assemble Syndicates." Agent 1 evaluates community density and bundles the Collegiate & Community Grassroots Syndicate (The Beast, USIU Esports Clan, and Kayole Gaming Lounge).
2. **Step 2 - Campaign Architect and Milestone Schedule:**
   The user clicks "Select Syndicate & Generate Contract." Agent 2 structures a three-phase milestone schedule (30% mobilization, 40% live broadcast airtime, 30% archival) with dynamic pricing, 10% platform facilitation fee, and 5% Withholding Tax deduction.
3. **Step 3 - PayPal Orders v2 Programmatic Milestone Ledger:**
   The user clicks "Sponsor Action: Initialize PayPal Milestone Ledger." Agent 4 initializes a multiparty order with `payment_instruction.platform_fees`. The user authorizes payment capture, committing funds into the milestone ledger with delayed programmatic release.
4. **Step 4 - Multimodal Proof-of-Play Verification:**
   The creator submits the live stream deliverable. Agent 3 evaluates computer vision metrics (logo screen occupancy at 8.4% against the 3.5% threshold), Whisper speech-to-text verbal endorsements, and brand safety chat moderation. A cryptographic SHA-256 certificate is generated.
5. **Step 5 - KRA eTIMS Tax Invoicing and Payout Release:**
   The user clicks "Execute Programmatic Disbursement & eTIMS Invoicing." Agent 4 issues an official KRA eTIMS electronic tax invoice via Buyer-Initiated Invoicing (BII) with a scannable QR code and Section 16 compliance certification. PayPal Payouts releases the net funds to the creator's wallet for instant M-Pesa withdrawal.
6. **AG Grid and MetaTwin Impact Exploration:**
   The user navigates to the "AG Grid Creator Explorer" tab to demonstrate talent discovery, and the "Barbah MetaTwin ESG" tab to showcase youth skills and gender inclusion metrics.

---

## 9. Venture Strategy and Business Model

SponsorPlay is designed to transition from a hackathon submission into a sustainable, venture-backed startup.

* **Market Sizing:**
  * Total Addressable Market (Sub-Saharan Africa digital youth marketing by 2030): $4.2 Billion.
  * Serviceable Addressable Market (Kenya and East Africa youth activations): $450 Million.
  * Serviceable Obtainable Market (Years 1-2 focused on Kenya esports): $15 Million ($1.5M net revenue).
* **Revenue Model:**
  * Marketplace Take Rate: 10% platform fee on settled campaign volume.
  * Enterprise Brand SaaS Tier: $499 to $1,500 monthly for real-time live guardian monitoring and enterprise accounting synchronization.
  * MetaTwin ESG Assurance Certification: $250 per certified audit dossier.
* **Unit Economics:**
  * On a typical $1,000 GMV campaign, the 10% platform fee ($100) minus direct COGS (PayPal processing, multimodal AI inference, and cloud infrastructure) delivers a 61.0% net contribution margin.

---

## 10. Master Documentation Index

Detailed architectural blueprints and research analyses are available in the repository:

* [SPONSORPLAY_MASTER_BLUEPRINT.md](SPONSORPLAY_MASTER_BLUEPRINT.md) - Master Technical Specification.
* [research/01_STAKEHOLDER_EMPATHY_AND_MISTRUST_ANALYSIS.md](research/01_STAKEHOLDER_EMPATHY_AND_MISTRUST_ANALYSIS.md) - Deep Persona Empathy and Root-Cause Mistrust Analysis.
* [research/02_INDUSTRY_CASE_STUDIES_AND_POST_MORTEMS.md](research/02_INDUSTRY_CASE_STUDIES_AND_POST_MORTEMS.md) - Forensic Post-Mortems of Predecessor Platforms (Twitch Bounty Board, StreamElements, Matcherino, FaZe Clan).
* [architecture/03_AGENTIC_AI_SYSTEMS_DESIGN.md](architecture/03_AGENTIC_AI_SYSTEMS_DESIGN.md) - Multi-Agent Swarm and Multimodal Verification Pipeline.
* [architecture/04_TECHNICAL_ARCHITECTURE_AND_PAYPAL_ETIMS_INTEGRATION.md](architecture/04_TECHNICAL_ARCHITECTURE_AND_PAYPAL_ETIMS_INTEGRATION.md) - Dual-Rail Financial Engineering and Database Schema.
* [specs/05_VENTURE_STRATEGY_ACCELERATOR_PITCH_AND_ROADMAP.md](specs/05_VENTURE_STRATEGY_ACCELERATOR_PITCH_AND_ROADMAP.md) - Venture Strategy, Accelerator Investment Thesis, and Demo Script.

---

Barbah Games Limited - Turning African gaming into verified skills, sustainable income, and global opportunities.
