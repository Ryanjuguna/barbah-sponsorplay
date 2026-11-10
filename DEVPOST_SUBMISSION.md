# Barbah SponsorPlay: Devpost & Hackathon Portal Submission Copy

> **PayPal Global AI Hackathon &bull; Challenge Track 02: Sponsor Play**  
> **Ecosystem Partner:** Barbah Games Limited (Nairobi, Kenya)  
> **Repository:** [https://github.com/Ryanjuguna/barbah-sponsorplay](https://github.com/Ryanjuguna/barbah-sponsorplay)  
> **Team:** Ryan Juguna & Barbah Games Engineering Team

---

### 1. Project Title
**Barbah SponsorPlay**

### 2. Elevator Pitch / Tagline (Under 200 Characters)
*Autonomous multi-agent sponsorship marketplace bridging corporate brands with African gaming talent via PayPal Orders v2 Milestone Ledgers, OpenCV Proof-of-Play, and KRA eTIMS tax compliance.*

---

### 3. Inspiration
In Kenya and Sub-Saharan Africa, digital gaming is exploding into a **$137 million market** with over 85% mobile and console penetration among urban youth. Corporate sponsors like Safaricom, Red Bull, and multinational consumer brands are desperate to engage this demographic. Yet, **95% of Kenyan grassroots esports talent, campus gaming clubs, and neighborhood console lounges remain commercially unmonetized**.

Partnering with **Andrew, founder of Barbah Games in Nairobi**, we uncovered the true root cause: it wasn't a lack of talent or audience—it was an insurmountable **commercial trust and regulatory compliance wall**. Under Section 16(1)(c) of the Kenya Income Tax Act, any corporate marketing expense lacking an electronic tax invoice is disallowed, triggering an automatic **30% corporate income tax surcharge**. Because grassroots youth creators lack corporate tax registration and enterprise billing systems, enterprise marketing departments are legally prohibited from sponsoring them. Combined with fears of bought bot views and creator ghosting, millions of dollars in youth marketing budgets remain locked.

We built **Barbah SponsorPlay** to eliminate this friction entirely.

---

### 4. What It Does
Barbah SponsorPlay is an autonomous multi-agent sponsorship operating system powered by a **Dual-Rail Financial Engine**:
1. **Agent 1 (Multi-Channel Talent Scout & Radar):** Ingests natural language campaign briefs and continuously crawls Twitch Live, Start.gg tournament brackets, WhatsApp clan webhooks, and TikTok clips to assemble balanced micro-syndicates or match top solo creators.
2. **Agent 2 (Campaign Architect & Legal Oracle):** Decomposes campaigns into three verifiable milestones (30% mobilization, 40% live broadcast, 30% archival) with dynamic pricing and bilateral agreement generation.
3. **Agent 4 (Financial Milestone Ledger & Tax Orchestrator):** Communicates with the PayPal Orders v2 API using multiparty payment splitting (`payment_instruction`), automatically partitioning Barbah's 10% platform fee and locking milestone funds into a programmatic delayed-disbursement ledger.
4. **Agent 3 (Multimodal Proof-of-Play Verifier):** Ingests live stream frames and runs real OpenCV Computer Vision to localize the sponsor's logo and verify exact screen area occupancy ($ \ge 3.5\% $), combined with Whisper speech-to-text verbal shoutouts and brand safety chat audits to stamp a cryptographic SHA-256 certificate.
5. **KRA eTIMS Fiscal Engine & PayPal Payout:** Unlocks verified milestone funds, issues an official KRA electronic tax invoice via Buyer-Initiated Invoicing (BII) with a scannable QR code (making the expense 100% tax-deductible for the sponsor), deducts statutory 5% Withholding Tax, and executes instant net payouts via the **PayPal Payouts API** for immediate creator withdrawal to M-Pesa.
6. **Agent 6 (MetaTwin ESG Impact Engine):** Measures informal settlement youth reach and gender inclusion into auditable corporate sustainability reports.

---

### 5. How We Built It & PayPal Integration Depth
- **PayPal Orders v2 API:** Implemented multiparty authorization with `intent: CAPTURE` and `payment_instruction.platform_fees`, routing Barbah's 10% facilitation commission to treasury while maintaining programmatic delayed disbursement for creator deliverables.
- **PayPal Payouts API:** Executes automated mass disbursements to creator PayPal accounts and sandbox test wallets with batch headers and item tracking.
- **Claude Sonnet Swarm:** Provides reasoning brains for natural language brief deconstruction, cultural Sheng/Swahili live chat brand safety audits, and dynamic contract drafting.
- **OpenCV Computer Vision Engine:** Runs contour localization, HSV color-space thresholding, and template matching to verify visual brand placement on 720p/1080p stream frames.
- **Three.js Cyber-Esports Constellation:** Renders an interactive 3D geospatial network of Kenyan gaming hubs (Nairobi, Kibera, Eldoret, Mombasa, Kisumu) with animated energy splines and responsive camera parallax.
- **AG Grid Community Edition:** Enterprise talent explorer featuring live search, custom cell renderers, and instant "Sponsor Solo" execution.
- **FastAPI & Python 3.11:** High-throughput asynchronous backend with auto-generated Swagger docs at `/docs` and containerized Docker support.

---

### 6. Challenges We Ran Into
- **Regulatory Precision (Milestone Ledger vs. Escrow):** Ensuring our PayPal integration strictly complied with PayPal Developer Terms. PayPal is legally not an escrow bank, and mislabeling payment flows triggers compliance red flags. We architected a **Programmatic Milestone Ledger** with delayed release that maintains complete milestone security without violating regulatory definitions.
- **Dual-Rail Tax Synchronization:** Translating Kenyan electronic fiscal receipting (KRA eTIMS Section 16 BII) into automated digital payment webhooks so that international corporate sponsors receive verifiable tax deductions with scannable QR codes in real time.
- **Live Stream Bot Inflation Detection:** Filtering out inflated viewer metrics by building Channel 1 of our Talent Radar, which compares live chat velocity (comments per minute) against concurrent viewers (CCV).

---

### 7. Accomplishments That We're Proud Of
- **Real Sandbox Execution:** Verified live sandbox transactions with actual PayPal Order IDs and Payout Item IDs generated against `api-m.sandbox.paypal.com`.
- **Zero-Setup Custom Testing:** Judges and evaluators can enter their own personal PayPal or Sandbox email in Step 5 and upload their own stream screenshots in Step 4 to test computer vision and payout flows in real time.
- **100% Automated Test Suite:** Built `test_flow.py` covering all 8 stages of the multi-agent lifecycle, running cleanly on local and CI environments.
- **Real African Ecosystem Grounding:** Designed directly alongside Barbah Games' network of 1,000+ registered competitive gamers and local esports hubs.

---

### 8. What We Learned
Grassroots digital creators in emerging markets don't need charity; they need **enterprise-compatible financial rails**. By pairing PayPal's global payment infrastructure with local tax compliance (KRA eTIMS) and automated AI verification, we can turn informal community gaming into a formalized, venture-backed digital economy.

---

### 9. What's Next for Barbah SponsorPlay
- **Pilot Rollout:** Commercial pilot across 50 gaming lounges in Nairobi, Eldoret, and Mombasa through Barbah Games.
- **Automated Twitch & YouTube Webhooks:** Direct RTMP stream ingest for continuous frame sampling.
- **Regional Expansion:** Extending the dual-rail model to Uganda (URA EFRIS) and Tanzania (TRA VFD).
- **Entry into PayPal Ventures Accelerator:** Scaling SponsorPlay as the definitive sponsorship operating system for emerging market youth economies.

---

### 10. Built With
`paypal-orders-v2`, `paypal-payouts-api`, `fastapi`, `python-3.11`, `opencv`, `claude-3-5-sonnet`, `three.js`, `ag-grid`, `kra-etims`, `whisper-stt`, `docker`, `tailwind-css`
