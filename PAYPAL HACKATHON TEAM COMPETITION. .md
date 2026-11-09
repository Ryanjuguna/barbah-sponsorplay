

 **BARBAH PLAYECONOMY**

## **HACKATHON CHALLENGE 02: SPONSORPLAY**

**Challenge:** Connecting brands, gaming talent and measurable sponsorship opportunities.

**Theme:** Turning gaming into skills, income and global opportunities.

**Organiser:** BARBAH Games  
**Technology Ecosystem:** PayPal AI Hackathon  
**Product:** SponsorPlay

---

## **1\. THE OPPORTUNITY**

Brands increasingly want to connect with young digital audiences, gaming communities and emerging creators. Esports offers opportunities for brand visibility, community engagement, product activation and youth development.

However, discovering credible gaming communities, identifying suitable teams, structuring sponsorship agreements and measuring campaign performance can be difficult.

At the same time, gaming teams, individual gamers and community organisers need access to funding, equipment, training and commercial partnerships.

There is an opportunity to create a more organised sponsorship ecosystem where brands can discover talent, invest in gaming communities and measure what their sponsorship achieves.

**How might we use AI, digital platforms and integrated payments to make esports sponsorship easier to discover, transact, manage and measure?**

## **2\. THE CHALLENGE**

Design and build an AI-powered marketplace that connects companies with gamers, esports teams, gaming clubs, creators and community initiatives.

The platform should help brands identify suitable sponsorship opportunities, structure campaigns, manage commercial agreements, make payments and track delivery.

It should also help sponsored teams and gamers manage their sponsorship relationships, document deliverables, receive payments and maintain appropriate financial records.

These are opportunities to explore, not a prescribed product specification. Teams should decide which problem offers the strongest opportunity for a working solution.

## **3\. THE USERS**

**Brands and corporates**

Companies seeking to reach gaming audiences, sponsor esports activities, activate products or invest in youth development.

**Esports teams and gaming clubs**

Organised gaming groups seeking sponsorship for competitions, equipment, training, travel and operations.

**Individual gamers and creators**

Players, streamers and digital creators who can offer brand exposure, content, community engagement and campaign participation.

**Tournament organisers**

Organisations producing competitions, events and gaming experiences that attract audiences and sponsors.

**Youth development and education partners**

Schools, academies, NGOs and institutions interested in supporting digital skills, inclusion and employment pathways through gaming.

## **4\. DESIGN OPPORTUNITIES**

The following areas provide inspiration. Teams are not expected to build everything.

### **A. Brand and sponsor identity**

How can companies establish a presence and communicate what they want to sponsor?

Consider:

* Brand profiles and industry categories.  
* Campaign objectives and target audiences.  
* Sponsorship budgets and preferred activities.  
* Geographic reach and audience demographics.  
* CSR, ESG and youth development priorities.  
* Campaign history and previous partnerships.

### **B. Gaming talent and community discovery**

How can brands find the right people and communities to sponsor?

Consider:

* Team and gaming club profiles.  
* Individual gamer and creator profiles.  
* Game titles, competitive levels and community reach.  
* Tournament participation and achievements.  
* Social media and content performance.  
* Skills Passport and verified community information.  
* Audience engagement and campaign suitability.

### **C. AI-powered sponsor matching**

How might AI help a brand identify relevant sponsorship opportunities?

Consider a Sponsor Agent that can:

* Receive a campaign brief from a company.  
* Understand its objectives, budget and target audience.  
* Identify suitable teams, gamers and communities.  
* Recommend sponsorship combinations.  
* Generate draft proposals and campaign budgets.  
* Assist with campaign communication and reporting.

Teams should explore how matching can consider more than follower counts. Relevant factors might include audience relevance, engagement, competitive activity, geographic reach, inclusion and measurable social outcomes.

### **D. Campaign creation and management**

How can a sponsorship move from an idea to a delivered campaign?

Consider:

* Campaign briefs and objectives.  
* Sponsorship packages and budgets.  
* Proposals and approvals.  
* Digital agreements and deliverables.  
* Campaign timelines and milestones.  
* Content approvals and proof of delivery.  
* Sponsor and beneficiary communication.

### **E. Campaign measurement and impact**

How can brands know what their sponsorship achieved?

Consider:

* Social media reach and engagement.  
* Event attendance and participation.  
* Content delivery and brand visibility.  
* Equipment or training provided.  
* Number of gamers and teams supported.  
* Youth participation and digital skills outcomes.  
* Gender inclusion and community reach.  
* Campaign performance against agreed objectives.

A future opportunity is to connect campaign outcomes to BARBAH's MetaTwin ESG Social assurance infrastructure, translating sponsorship activity into traceable social impact indicators.

## **5\. THE COMMERCIAL WORKFLOW: PAYPAL \+ KRA eTIMS**

A central challenge for SponsorPlay is connecting international payment infrastructure with Kenya's electronic tax invoicing requirements.

**PayPal records and processes payment transactions. KRA eTIMS supports the generation and management of electronic tax invoices. They perform different functions and should be connected, not confused.**

The platform should explore how these systems can work together.

### **A. Sponsor pays a gaming team or creator**

Example: A company agrees to sponsor a gaming team with KES 100,000 for a tournament campaign.

A possible workflow:

1. The brand approves the sponsorship proposal.  
2. The team or its authorised business entity issues an invoice through its appropriate eTIMS solution.  
3. The invoice reference and amount are recorded in SponsorPlay.  
4. The brand receives a payment request or checkout option.  
5. PayPal processes the payment through an available and approved payment arrangement.  
6. PayPal sends a payment notification to SponsorPlay.  
7. SponsorPlay reconciles the transaction against the invoice.  
8. The campaign moves to its funded status.  
9. The team delivers the agreed sponsorship activities.  
10. SponsorPlay records deliverables and campaign completion.

### **B. PayPal invoicing and eTIMS integration**

Explore two possible approaches:

**Approach 1: eTIMS-first invoicing**

* The supplier generates the tax invoice through eTIMS.  
* SponsorPlay stores the invoice number and relevant tax details.  
* PayPal is used to collect the payment.  
* PayPal's payment notification updates the transaction status.  
* SponsorPlay reconciles the PayPal transaction against the original eTIMS invoice.

**Approach 2: PayPal-first commercial workflow**

* A sponsor approves a sponsorship package.  
* The platform generates a PayPal invoice or payment request where appropriate.  
* The supplier's eTIMS invoice is also generated through the applicable tax invoicing process.  
* SponsorPlay links the two records.  
* Payment confirmation updates the commercial transaction record.

The second approach must not treat a PayPal invoice as a substitute for an eTIMS tax invoice.

### **C. KRA eTIMS requirements**

Teams should investigate how a sponsorship marketplace can support:

* Supplier business information and KRA PIN details.  
* Customer and sponsor information.  
* Tax invoice references and invoice status.  
* Invoice amounts, applicable taxes and currency.  
* Credit notes and adjustments where required.  
* Payment reconciliation.  
* Transaction and campaign records.  
* Supplier reporting and financial history.

KRA provides system-to-system integration through the Online Sales Control Unit (OSCU) and Virtual Sales Control Unit (VSCU). Taxpayers and third-party software integrators must follow KRA's applicable testing and certification process before using these integrations in production.

Teams may demonstrate the invoicing workflow with a mock eTIMS service or clearly labelled prototype integration. They should not claim that a simulated invoice is a KRA-certified tax invoice.

### **D. Who issues the invoice?**

This is an important design consideration.

The legal supplier of the sponsorship service should generally be responsible for the appropriate tax invoice. Depending on the arrangement, this could be a team business, registered creator, event organiser or another contracting entity.

SponsorPlay may also need to issue its own invoice for a platform commission or other service it supplies.

The product should distinguish:

* Sponsorship value paid to the beneficiary.  
* Platform fees or commissions.  
* Payment processing charges.  
* Tax invoices issued by the relevant suppliers.  
* PayPal transaction confirmations.  
* Actual amounts received by beneficiaries.

Teams should avoid assuming that BARBAH Games automatically becomes the supplier of every sponsorship simply because the transaction happens through its platform.

### **E. Buyer-initiated invoicing**

KRA also provides Buyer Initiated Invoicing (BII) for qualifying circumstances where a registered buyer generates an invoice on behalf of a seller who cannot issue one directly.

Teams may investigate whether this is relevant to any proposed SponsorPlay user journey. It should not be treated as a universal workaround for suppliers who have not onboarded to eTIMS. Its applicability and eligibility must be confirmed with KRA.

## **6\. TECHNOLOGY FOUNDATION**

BARBAH Games wants teams to experiment freely while building on a common technology foundation.

| Tool | Suggested application |
| ----- | ----- |
| **PayPal Developer Platform** | Sponsor payments, invoicing, subscriptions, eligible payouts and transaction notifications. |
| **AG Grid / AG Studio** | Sponsor dashboards, campaign analytics, audience insights and impact reporting. |
| **Bryntum** | Campaign calendars, event schedules, deliverable timelines and resource planning. |
| **Postman** | API design, testing and documentation for PayPal and other integrations. |
| **Render** | Hosting applications, databases, APIs and background services. |
| **Zapier MCP** | Connecting AI workflows to supported business applications. |
| **Kernel** | Optional infrastructure for authorised AI agents interacting with web applications. |

### **Required technology foundation**

**PayPal Developer Platform must be incorporated into the solution.**

Teams should demonstrate a meaningful PayPal integration using the developer environment and Sandbox where applicable.

The proposed solution should demonstrate at least one relevant commercial transaction, such as a sponsor payment, invoice payment or subscription.

Teams should also:

* Use Postman or an equivalent API testing workflow.  
* Deploy a working application or demonstrable prototype.  
* Explain how their chosen tools support the proposed solution.

The other tools are suggestions, not mandatory integrations. Select tools based on the problem being solved.

## **7\. AI AND AGENTIC OPPORTUNITIES**

Think beyond a conventional sponsorship directory.

Potential AI applications include:

**Sponsor Agent**

Receives a brand brief, understands its objectives and recommends suitable teams, gamers and communities.

**Campaign Proposal Agent**

Assists with sponsorship packages, budgets, campaign proposals and draft agreements.

**Talent Discovery Agent**

Identifies relevant gaming teams and creators based on skills, competitive history, audience and campaign requirements.

**Campaign Monitoring Agent**

Tracks campaign milestones, requests evidence of delivery and identifies incomplete commitments.

**Impact Reporting Agent**

Consolidates campaign data into sponsor reports, including participation, reach, inclusion and youth development outcomes.

**Finance and Compliance Assistant**

Helps organise invoices, payment records, transaction references and reconciliation information. It should distinguish PayPal payment records from eTIMS tax invoices and flag missing documentation for review.

AI can assist with recommendations and administration. Human approval should remain part of financial commitments, supplier verification and formal tax-document workflows.

## **8\. KENYAN MARKET CONTEXT**

Design for a marketplace operating in Kenya and potentially serving international sponsors.

Consider:

* KES and international currency requirements.  
* Local and international sponsor payment journeys.  
* Registered businesses and individual service providers.  
* KRA eTIMS invoicing and supplier compliance.  
* Clear platform commissions and beneficiary payments.  
* Data protection and responsible use of audience information.  
* Consent and safeguarding for under-18 gamers.  
* Transparent sponsorship agreements and deliverables.  
* Payment disputes, refunds and reconciliation.

Do not assume every PayPal product or payout method is available to every Kenyan account. Confirm account eligibility and supported functionality before designing a live payment flow.

## **9\. WHAT TEAMS SHOULD BUILD**

We are not prescribing a complete product.

Choose a meaningful problem within the SponsorPlay opportunity and develop a working solution.

Your submission should communicate:

1. **The problem:** What sponsorship challenge are you solving?  
2. **The user:** Who benefits from your solution?  
3. **The experience:** How does the platform work?  
4. **The AI:** What does AI make easier or more effective?  
5. **The technology:** Which tools and integrations did you use?  
6. **The commercial model:** How does money move between sponsors, beneficiaries and the platform?  
7. **The compliance approach:** How are payment records, tax invoices and campaign records connected?  
8. **The demonstration:** What can users actually do in your prototype?

A focused, working solution is more valuable than a broad concept with many incomplete features.

## **10\. SUGGESTED MVP DEMONSTRATION**

Use this scenario as inspiration, not a mandatory user journey.

A consumer brand wants to reach 10,000 young people in Kenya through gaming and digital skills development.

The company creates a campaign brief, sets a sponsorship budget and identifies its objectives.

SponsorPlay's AI agent recommends five gaming teams and communities based on their audience, location, activities and suitability.

The brand reviews the recommendations, selects its beneficiaries and receives a sponsorship proposal.

The company approves the campaign and pays a sample invoice through PayPal Sandbox.

SponsorPlay records the payment reference and links it to the relevant invoice record. The beneficiary's tax invoice workflow is represented through an eTIMS prototype or documented integration approach.

The campaign is activated. Each team receives a list of agreed deliverables and submits evidence of campaign activity.

The sponsor views a dashboard showing campaign progress, audience reach and social impact.

**How would your solution make this experience easier, more transparent and more valuable for everyone involved?**

## **11\. SUCCESS CRITERIA**

Teams will be encouraged to demonstrate:

* A clear understanding of sponsorship challenges in esports.  
* A useful brand-to-team discovery experience.  
* Innovative application of AI or automation.  
* Meaningful use of PayPal technology.  
* A credible approach to KRA eTIMS invoicing.  
* A clear distinction between payments, invoices and tax records.  
* Campaign management and evidence of delivery.  
* Potential to scale across brands, teams and communities.  
* A sustainable commercial model.

## **12\. THE BIGGER VISION: BARBAH PLAYECONOMY**

SponsorPlay is one of four independent products being developed within the BARBAH PlayEconomy ecosystem.

* **Coach2Earn:** Connecting gaming talent with credible coaching.  
* **SponsorPlay:** Connecting brands with gamers, teams and esports communities.  
* **ArenaPay:** Enabling tournament payments, prize distribution and team earnings.  
* **Play2Pro:** Turning gaming experience and demonstrated skills into professional opportunities.

Each product can operate independently while contributing to a connected gaming economy.

SponsorPlay has the potential to make esports sponsorship more accessible, measurable and accountable. It can help brands move beyond visibility and support the development of talent, communities and future workforce skills.

## **13\. FINAL CHALLENGE**

**Don't just build a sponsorship directory.**

Build a marketplace where brands can discover talent, invest in communities, transact with confidence and measure the value they create.

Explore. Experiment. Build. Demonstrate.

**BARBAH GAMES**  
*Turning gaming into skills, income and global opportunities.*

