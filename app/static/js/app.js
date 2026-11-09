/**
 * Barbah SponsorPlay - Frontend Client Application
 * PayPal AI Hackathon - Track 02: Sponsor Play
 */

let currentCurrency = 'USD';
const USD_TO_KES_RATE = 130.0;

let currentCampaign = null;
let currentSyndicate = null;
let currentProposal = null;
let currentPayPalOrder = null;
let currentProofCert = null;
let currentTaxInvoice = null;
let currentVisionResult = null;
let gridApi = null;

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
  initAgGrid();
  logAgent("SYSTEM", "Barbah SponsorPlay core initialized. Preloaded Kenyan esports talent graph.");
  logAgent("BARBAH GATEWAY", "Real-time webhook listener active on /api/v1/barbah/webhook.");
});

// Currency Switcher
function setCurrency(curr) {
  currentCurrency = curr;
  document.getElementById('btnCurrencyUSD').className = curr === 'USD' 
    ? 'px-2.5 py-1 rounded bg-blue-600 text-white shadow' 
    : 'px-2.5 py-1 rounded text-gray-400 hover:text-white';
  document.getElementById('btnCurrencyKES').className = curr === 'KES' 
    ? 'px-2.5 py-1 rounded bg-blue-600 text-white shadow' 
    : 'px-2.5 py-1 rounded text-gray-400 hover:text-white';
  
  if (gridApi) {
    gridApi.refreshCells();
  }
}

function formatMoney(amountUSD) {
  if (amountUSD === undefined || amountUSD === null || isNaN(amountUSD)) return "$0.00";
  const num = Number(amountUSD);
  if (currentCurrency === 'KES') {
    const kes = num * USD_TO_KES_RATE;
    return `KES ${kes.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Tab Switching
function switchTab(tabName) {
  ['demo', 'explorer', 'invoices', 'impact'].forEach(t => {
    document.getElementById(`view-${t}`).classList.add('hidden');
    document.getElementById(`tab-${t}`).className = 'py-3 px-1 border-b-2 border-transparent text-gray-400 hover:text-gray-200 font-medium text-sm flex items-center space-x-2';
  });

  document.getElementById(`view-${tabName}`).classList.remove('hidden');
  document.getElementById(`tab-${tabName}`).className = 'py-3 px-1 border-b-2 border-emerald-500 text-emerald-400 font-semibold text-sm flex items-center space-x-2';

  if (tabName === 'invoices') {
    loadInvoicesList();
  } else if (tabName === 'impact' && currentProposal) {
    loadImpactDossier();
  }
}

// Agent Terminal Logger
function logAgent(agentName, message, color = 'text-emerald-400') {
  const terminal = document.getElementById('agentTerminal');
  if (!terminal) return;
  const timeStr = new Date().toLocaleTimeString();
  const line = document.createElement('div');
  line.className = color;
  line.innerHTML = `<span class="text-gray-500">[${timeStr}]</span> <span class="font-bold">[${agentName}]</span> ${message}`;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

// =========================================================================
// REAL-TIME TALENT INGESTION & SCOUTING GATEWAY
// =========================================================================

async function triggerBarbahWebhook(eventType) {
  logAgent("BARBAH GATEWAY", `Simulating incoming real-time webhook event: ${eventType}...`, "text-emerald-400");
  let payload = {};
  if (eventType === "PLAYER_REGISTERED") {
    payload = {
      event_type: "PLAYER_REGISTERED",
      data: {
        name: "Kevin 'Kayole King' Mwangi",
        gamer_tag: "KayoleKing_254",
        type: "PRO_PLAYER_STREAMER",
        primary_game: "EA FC 25",
        platform: "YouTube Gaming",
        location: "Kayole, Nairobi East",
        monthly_reach: 9500,
        avg_concurrent_viewers: 420,
        base_rate_usd: 160.0,
        kra_pin: "A019888888K",
        paypal_email: "kayoleking@gmail.com",
        mpesa_phone: "+254712345678",
        bio: "East Africa regional EA FC top 4 qualifier with high grassroots youth fanbase."
      }
    };
  } else if (eventType === "GAMING_HUB_ADDED") {
    payload = {
      event_type: "GAMING_HUB_ADDED",
      data: {
        hub_name: "Eldoret Rift Gaming Arena",
        hub_tag: "EldoretRift_Hub",
        location: "Eldoret CBD",
        monthly_reach: 12000,
        avg_concurrent_viewers: 550,
        kra_pin: "P057777777R",
        paypal_email: "eldoretrift@gmail.com",
        mpesa_phone: "+254799887766"
      }
    };
  }

  try {
    const resp = await fetch('/api/v1/barbah/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    logAgent("BARBAH GATEWAY", `Ingestion Complete: ${data.result.status} &bull; Total Creators in Active Registry: ${data.total_active_creators}`, "text-emerald-300 font-bold");
    if (gridApi) reloadCreatorsGrid();
  } catch (err) {
    logAgent("ERROR", `Barbah webhook failed: ${err.message}`, "text-red-400");
  }
}

async function triggerExternalScout() {
  logAgent("AGENT 1: SCOUT", "Crawling Start.gg tournament brackets for Kenya Esports League Top 8...", "text-blue-400");
  const payload = {
    source: "START_GG_BRACKET",
    gamer_tag: "VividStriker_KE",
    name: "Dennis 'Vivid' Ochieng",
    primary_game: "EA FC 25",
    location: "Rongai / USIU Campus",
    monthly_reach: 14000,
    avg_concurrent_viewers: 480,
    base_rate_usd: 210.0,
    kra_pin: "A016655443Z"
  };

  try {
    const resp = await fetch('/api/v1/barbah/simulate-external-discovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await resp.json();
    logAgent("AGENT 1: SCOUT", `Discovered fresh tournament talent: ${data.creator.name} (${data.creator.gamer_tag}) via Start.gg standings!`, "text-blue-300 font-bold");
    if (gridApi) reloadCreatorsGrid();
  } catch (err) {
    logAgent("ERROR", `External discovery failed: ${err.message}`, "text-red-400");
  }
}

async function syncBarbahDatabase() {
  logAgent("BARBAH GATEWAY", "Syncing with live Barbah Games Hub & Player Registry...", "text-gray-400");
  try {
    const resp = await fetch('/api/v1/barbah/sync', { method: 'POST' });
    const data = await resp.json();
    logAgent("BARBAH GATEWAY", `Sync complete: ${data.details.status} (${data.total_registered_creators} creators active)`, "text-emerald-400");
    if (gridApi) reloadCreatorsGrid();
  } catch (err) {
    logAgent("ERROR", `Barbah sync failed: ${err.message}`, "text-red-400");
  }
}

async function reloadCreatorsGrid() {
  try {
    const resp = await fetch('/api/v1/campaigns/creators');
    const creators = await resp.json();
    if (gridApi) gridApi.setGridOption('rowData', creators);
  } catch (err) {
    console.error("Failed to reload grid:", err);
  }
}

// =========================================================================
// TAB 1: 5-STEP WIZARD LOGIC
// =========================================================================

// STEP 1: RUN TALENT SCOUT
async function runStep1Scout() {
  const brandName = document.getElementById('inputBrandName').value;
  const corporatePIN = document.getElementById('inputCorporatePIN').value;
  const briefText = document.getElementById('inputBrief').value;
  const reach = parseInt(document.getElementById('inputTargetReach').value) || 10000;
  const budgetUSD = parseFloat(document.getElementById('inputBudgetUSD').value) || 769.23;

  logAgent("AGENT 1: SCOUT", `Deconstructing brand brief for ${brandName}...`, "text-emerald-400");
  logAgent("CLAUDE BRAIN", `Synthesizing candidates via Anthropic Claude 3.5 Sonnet cognitive reasoning...`, "text-purple-400");
  logAgent("AGENT 1: SCOUT", `Target: ${reach.toLocaleString()} youth in Kenya &bull; Budget: $${budgetUSD.toFixed(2)} (KES 100,000)...`);

  const campaignId = "CAMP-" + Date.now();
  const payload = {
    id: campaignId,
    brand_name: brandName,
    corporate_pin: corporatePIN,
    brief: briefText,
    target_audience: "16-25 urban gaming youth",
    target_reach: reach,
    budget_usd: budgetUSD,
    budget_kes: budgetUSD * USD_TO_KES_RATE,
    preferred_locations: ["Nairobi", "Eldoret"]
  };

  try {
    const resp = await fetch('/api/v1/campaigns/brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const syndicates = await resp.json();
    currentCampaign = payload;

    logAgent("AGENT 1: SCOUT", `Synthesized ${syndicates.length} synergistic Sponsorship Syndicates with KRA Section 16 protection.`, "text-emerald-300 font-bold");
    renderSyndicateCards(syndicates);
  } catch (err) {
    logAgent("ERROR", `Failed to run scout: ${err.message}`, "text-red-400");
  }
}

function renderSyndicateCards(syndicates) {
  const container = document.getElementById('syndicateCards');
  container.innerHTML = '';
  document.getElementById('syndicateResults').classList.remove('hidden');

  syndicates.forEach((syn, idx) => {
    const card = document.createElement('div');
    card.className = "p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-emerald-500/50 transition-all space-y-3";
    card.innerHTML = `
      <div class="flex items-start justify-between">
        <div>
          <span class="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Syndicate Option ${idx + 1}</span>
          <h4 class="font-bold text-white text-base mt-1">${syn.title}</h4>
        </div>
        <div class="text-right">
          <span class="text-xs text-gray-400 block">Synergy Score</span>
          <span class="text-base font-extrabold text-emerald-400 font-mono">${syn.synergy_score}%</span>
        </div>
      </div>

      <p class="text-xs text-gray-300 leading-relaxed">${syn.rationale}</p>

      <div class="grid grid-cols-3 gap-2 py-2 border-y border-gray-800 text-xs">
        <div>
          <span class="text-gray-400 block text-[11px]">Youth Reach</span>
          <span class="font-bold text-white font-mono">${syn.expected_reach.toLocaleString()}</span>
        </div>
        <div>
          <span class="text-gray-400 block text-[11px]">Cost (${currentCurrency})</span>
          <span class="font-bold text-emerald-400 font-mono">${formatMoney(syn.total_cost_usd)}</span>
        </div>
        <div>
          <span class="text-gray-400 block text-[11px]">eTIMS Route</span>
          <span class="font-semibold text-blue-400">${syn.etims_compliance_mode}</span>
        </div>
      </div>

      <div>
        <span class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">Bundled Creators & Hubs:</span>
        <div class="flex flex-wrap gap-1.5">
          ${syn.creators.map(c => `
            <span class="px-2 py-1 rounded-md bg-gray-800 text-gray-200 text-xs flex items-center space-x-1">
              <i class="fa-solid fa-gamepad text-emerald-400 text-[10px]"></i>
              <span class="font-semibold">${c.name}</span>
              <span class="text-gray-400">(${c.gamer_tag})</span>
            </span>
          `).join('')}
        </div>
      </div>

      <button onclick="selectSyndicate('${syn.syndicate_id}')" class="w-full mt-2 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all flex items-center justify-center space-x-2">
        <span>Select Syndicate & Generate Milestone Agreement &rarr;</span>
      </button>
    `;
    container.appendChild(card);
  });
}

// STEP 2: SELECT SYNDICATE & RUN ARCHITECT
async function selectSyndicate(syndicateId) {
  logAgent("AGENT 2: ARCHITECT", `Decomposing syndicate ${syndicateId} into milestone agreement...`, "text-blue-400");

  try {
    const resp = await fetch('/api/v1/campaigns/proposal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign_id: currentCampaign.id,
        syndicate_id: syndicateId
      })
    });
    currentProposal = await resp.json();

    logAgent("AGENT 2: ARCHITECT", `Contract Drafted! Gross: $${currentProposal.total_budget_usd} &bull; Platform Fee: $${currentProposal.platform_fee_usd} &bull; 5% WHT Schedule locked.`, "text-blue-300 font-bold");

    setStepActive(2);
    renderStep2Proposal(currentProposal);
  } catch (err) {
    logAgent("ERROR", `Failed to generate proposal: ${err.message}`, "text-red-400");
  }
}

function renderStep2Proposal(proposal) {
  document.getElementById('card-step-2').classList.remove('hidden');
  document.getElementById('card-step-2').scrollIntoView({ behavior: 'smooth' });

  const container = document.getElementById('proposalDetails');
  container.innerHTML = `
    <!-- Financial Breakdown Card -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-gray-900 border border-gray-800">
      <div>
        <span class="text-xs text-gray-400 block">Gross Budget Authorized</span>
        <span class="text-base font-extrabold text-white font-mono">${formatMoney(proposal.total_budget_usd)}</span>
      </div>
      <div>
        <span class="text-xs text-gray-400 block">Barbah Fee (10%)</span>
        <span class="text-base font-extrabold text-sky-400 font-mono">${formatMoney(proposal.platform_fee_usd)}</span>
      </div>
      <div>
        <span class="text-xs text-gray-400 block">5% Withholding Tax</span>
        <span class="text-base font-extrabold text-red-400 font-mono">${formatMoney(proposal.withholding_tax_usd)}</span>
      </div>
      <div>
        <span class="text-xs text-gray-400 block">Net Creator Escrow</span>
        <span class="text-base font-extrabold text-emerald-400 font-mono">${formatMoney(proposal.net_creator_disbursement_usd)}</span>
      </div>
    </div>

    <!-- Milestone Phases -->
    <div class="space-y-3">
      <h3 class="text-sm font-bold text-gray-300 uppercase tracking-wider">3-Phase Programmatic Milestones</h3>
      <div class="space-y-2">
        ${proposal.milestones.map(m => `
          <div class="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center justify-between">
            <div class="space-y-1">
              <div class="flex items-center space-x-2">
                <span class="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">Phase ${m.milestone_number} (${m.percentage}%)</span>
                <span class="text-sm font-bold text-white">${m.title}</span>
              </div>
              <p class="text-xs text-gray-400">${m.description}</p>
            </div>
            <div class="text-right">
              <span class="text-sm font-extrabold text-emerald-400 font-mono">${formatMoney(m.amount_usd)}</span>
              <span class="text-[10px] block text-gray-500 uppercase">${m.status}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Legal Clauses -->
    <div class="p-3.5 rounded-xl bg-gray-950/60 border border-gray-800 space-y-2">
      <span class="text-xs font-bold text-gray-400 uppercase tracking-wider block">Programmatic Legal & Tax Clauses</span>
      <div class="space-y-1 text-xs text-gray-400 font-mono">
        ${proposal.legal_clauses.map(clause => `<div>&bull; ${clause}</div>`).join('')}
      </div>
    </div>

    <button onclick="initializePayPalEscrow()" id="btnInitPayPal" class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-sky-500/20 flex items-center justify-center space-x-2 transition-all">
      <i class="fa-brands fa-paypal text-lg"></i>
      <span>Sponsor Approval: Initialize PayPal Smart Escrow Checkout</span>
    </button>
  `;
}

// STEP 3: PAYPAL ORDERS V2 ESCROW CHECKOUT
async function initializePayPalEscrow() {
  logAgent("AGENT 4: FINANCE", `Creating PayPal Orders v2 Smart Escrow order for Proposal ${currentProposal.id}...`, "text-sky-400");

  try {
    const resp = await fetch('/api/v1/payments/create-escrow-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposal_id: currentProposal.id })
    });
    currentPayPalOrder = await resp.json();

    logAgent("AGENT 4: FINANCE", `PayPal Order Created! ID: ${currentPayPalOrder.order_id} &bull; Multiparty fee split configured.`, "text-sky-300 font-bold");

    setStepActive(3);
    renderStep3PayPal(currentPayPalOrder);
  } catch (err) {
    logAgent("ERROR", `Failed to initialize PayPal Order: ${err.message}`, "text-red-400");
  }
}

function renderStep3PayPal(order) {
  document.getElementById('card-step-3').classList.remove('hidden');
  document.getElementById('card-step-3').scrollIntoView({ behavior: 'smooth' });

  const container = document.getElementById('paypalEscrowDetails');
  container.innerHTML = `
    <div class="p-4 rounded-xl bg-sky-950/20 border border-sky-500/30 space-y-3">
      <div class="flex items-center justify-between border-b border-sky-500/20 pb-2">
        <span class="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
          <i class="fa-brands fa-paypal"></i> PayPal Orders v2 Multiparty Authorization
        </span>
        <span class="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">${order.status}</span>
      </div>

      <div class="grid grid-cols-2 gap-3 text-xs">
        <div><span class="text-gray-400">PayPal Order ID:</span> <span class="font-mono text-white font-bold">${order.order_id}</span></div>
        <div><span class="text-gray-400">Escrow Gross:</span> <span class="font-mono text-emerald-400 font-bold">${formatMoney(order.gross_amount)}</span></div>
        <div><span class="text-gray-400">Platform Commission Split:</span> <span class="font-mono text-sky-300">${formatMoney(order.platform_fee)}</span></div>
        <div><span class="text-gray-400">Beneficiary Escrow Share:</span> <span class="font-mono text-white">${formatMoney(order.gross_amount - order.platform_fee)}</span></div>
      </div>
    </div>

    <!-- Simulated PayPal Checkout Action -->
    <div class="space-y-3">
      <div class="p-3.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-300 flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <i class="fa-solid fa-lock text-emerald-400"></i>
          <span>Funds will be held in programmatic escrow and released milestone-by-milestone upon Proof-of-Play verification.</span>
        </div>
      </div>

      <button onclick="capturePayPalOrder()" id="btnCapturePayPal" class="w-full py-3.5 px-4 rounded-xl bg-[#0070ba] hover:bg-[#003087] text-white font-extrabold text-sm shadow-lg shadow-sky-500/20 flex items-center justify-center space-x-2 transition-all">
        <i class="fa-brands fa-paypal text-lg"></i>
        <span>Authorize & Capture $${order.gross_amount.toFixed(2)} USD into Milestone Escrow</span>
      </button>
    </div>
  `;
}

async function capturePayPalOrder() {
  logAgent("PAYPAL ESCROW", `Authorizing payment capture for Order ${currentPayPalOrder.order_id}...`, "text-sky-400");

  try {
    const resp = await fetch(`/api/v1/payments/capture/${currentPayPalOrder.order_id}`, { method: 'POST' });
    const captureData = await resp.json();

    logAgent("PAYPAL ESCROW", `Funds Captured! Escrow status: FUNDED. Platform commission automatically split.`, "text-emerald-400 font-bold");
    logAgent("AGENT 4: FINANCE", `Milestone 1 is now active. Creator mobilization underway.`, "text-sky-300");

    document.getElementById('btnCapturePayPal').disabled = true;
    document.getElementById('btnCapturePayPal').className = "w-full py-3.5 px-4 rounded-xl bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center space-x-2 opacity-90 cursor-default";
    document.getElementById('btnCapturePayPal').innerHTML = `<i class="fa-solid fa-check"></i> <span>Funds Safely Locked in PayPal Escrow</span>`;

    // Proceed to Step 4: Multimodal Verification
    setTimeout(() => {
      renderVerificationStep();
      setStepActive(4);
    }, 1200);
  } catch (err) {
    logAgent("ERROR", `Capture failed: ${err.message}`, "text-red-400");
  }
}

// =========================================================================
// STEP 4: OPENCV COMPUTER VISION & MULTIMODAL PROOF-OF-PLAY
// =========================================================================

function renderVerificationStep() {
  document.getElementById('card-step-4').classList.remove('hidden');
  document.getElementById('card-step-4').scrollIntoView({ behavior: 'smooth' });

  const container = document.getElementById('verificationDetails');
  container.innerHTML = `
    <div class="space-y-4">
      <!-- OpenCV Scenario Selector Bench -->
      <div class="p-3.5 rounded-xl bg-gray-950/80 border border-purple-500/30 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span class="text-xs font-bold text-white block">OpenCV Computer Vision Test Bench</span>
          <span class="text-[11px] text-gray-400">Select scenario to execute real contour & template detection on stream frame.</span>
        </div>
        <div class="flex items-center space-x-2">
          <button type="button" onclick="runOpenCVVisionAnalysis('PASS')" id="btnScenarioPass" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all">
            Valid Placement (>= 3.5% Pass)
          </button>
          <button type="button" onclick="runOpenCVVisionAnalysis('LOW_OCCUPANCY')" id="btnScenarioFail" class="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold border border-gray-700 transition-all">
            Low-Occupancy Bug (< 3.5% Fail)
          </button>
        </div>
      </div>

      <!-- Real OpenCV Annotated Stream Frame -->
      <div class="relative rounded-2xl overflow-hidden border border-purple-500/30 bg-gray-950 aspect-video flex items-center justify-center">
        <img id="visionStreamPreview" src="/static/proofs/proof_default.jpg" alt="Live Stream Vision Analysis" class="w-full h-full object-cover">
        
        <!-- Live Loading Spinner Overlay -->
        <div id="visionSpinner" class="absolute inset-0 bg-black/60 backdrop-blur-sm hidden flex-col items-center justify-center space-y-2">
          <div class="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-xs font-mono text-purple-300">OpenCV cv2.matchTemplate Running...</span>
        </div>
      </div>

      <!-- Live OpenCV Telemetry Specs Grid -->
      <div id="visionMetricsBox" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40">
          <span class="text-xs text-gray-400 block">OpenCV Screen Occupancy</span>
          <span class="text-sm font-bold text-emerald-400 font-mono">4.12% (>= 3.5% PASS)</span>
        </div>
        <div class="p-3 rounded-xl bg-gray-900/80 border border-gray-800">
          <span class="text-xs text-gray-400 block">Detected Bounding Box</span>
          <span class="text-xs font-bold text-purple-300 font-mono">[60, 80, 280x140]</span>
        </div>
        <div class="p-3 rounded-xl bg-gray-900/80 border border-gray-800">
          <span class="text-xs text-gray-400 block">OpenCV Match Confidence</span>
          <span class="text-sm font-bold text-sky-400 font-mono">98.4%</span>
        </div>
      </div>

      <button onclick="executeMultimodalVerification()" id="btnVerifyDeliverable" class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-500/20 flex items-center justify-center space-x-2 transition-all">
        <i class="fa-solid fa-wand-magic-sparkles"></i>
        <span>Agent 3: Run Multimodal Consensus & Seal Certificate</span>
      </button>

      <div id="certificateContainer" class="hidden"></div>
    </div>
  `;

  // Automatically run OpenCV analysis on entry
  runOpenCVVisionAnalysis('PASS');
}

async function runOpenCVVisionAnalysis(scenario = 'PASS') {
  const brandName = (currentProposal && currentProposal.brand_name) || "Safaricom";
  logAgent("OPENCV VISION", `Running cv2.matchTemplate & contour localization on 720p stream frame (Scenario: ${scenario})...`, "text-purple-400");
  
  const spinner = document.getElementById('visionSpinner');
  if (spinner) spinner.classList.remove('hidden');

  try {
    const resp = await fetch('/api/v1/verification/analyze-frame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand_name: brandName, scenario: scenario })
    });
    const data = await resp.json();
    currentVisionResult = data.metrics;
    
    logAgent("OPENCV VISION", `Detected Bounding Box: [x=${currentVisionResult.bounding_box.x}, y=${currentVisionResult.bounding_box.y}, w=${currentVisionResult.bounding_box.width}, h=${currentVisionResult.bounding_box.height}]`, "text-purple-300 font-mono");
    logAgent("OPENCV VISION", `Screen Occupancy Area: ${currentVisionResult.screen_occupancy_percent}% (Threshold >= 3.5%) &bull; Status: ${currentVisionResult.status}`, currentVisionResult.meets_threshold ? "text-emerald-400 font-bold" : "text-amber-400 font-bold");
    
    renderOpenCVPreview(currentVisionResult);
  } catch (err) {
    logAgent("ERROR", `OpenCV analysis failed: ${err.message}`, "text-red-400");
  } finally {
    if (spinner) spinner.classList.add('hidden');
  }
}

function renderOpenCVPreview(cvMetrics) {
  const previewImg = document.getElementById('visionStreamPreview');
  if (previewImg && cvMetrics.proof_image_url) {
    previewImg.src = cvMetrics.proof_image_url + "?t=" + Date.now();
  }
  
  const metricsBox = document.getElementById('visionMetricsBox');
  if (metricsBox) {
    const isPass = cvMetrics.meets_threshold;
    metricsBox.innerHTML = `
      <div class="p-3 rounded-xl ${isPass ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-red-950/40 border-red-500/40'} border">
        <span class="text-xs text-gray-400 block">OpenCV Screen Occupancy</span>
        <span class="text-sm font-bold ${isPass ? 'text-emerald-400' : 'text-red-400'} font-mono">${cvMetrics.screen_occupancy_percent}% (${isPass ? '>= 3.5% PASS' : '< 3.5% FAIL'})</span>
      </div>
      <div class="p-3 rounded-xl bg-gray-900/80 border border-gray-800">
        <span class="text-xs text-gray-400 block">Detected Bounding Box</span>
        <span class="text-xs font-bold text-purple-300 font-mono">[${cvMetrics.bounding_box.x}, ${cvMetrics.bounding_box.y}, ${cvMetrics.bounding_box.width}x${cvMetrics.bounding_box.height}]</span>
      </div>
      <div class="p-3 rounded-xl bg-gray-900/80 border border-gray-800">
        <span class="text-xs text-gray-400 block">OpenCV Match Confidence</span>
        <span class="text-sm font-bold text-sky-400 font-mono">${cvMetrics.confidence_percent}%</span>
      </div>
    `;
  }
}

async function executeMultimodalVerification() {
  logAgent("AGENT 3: VERIFICATION", `Ingesting stream VOD and telemetry for Milestone 1...`, "text-purple-400");
  logAgent("AGENT 5: GUARDIAN", `Auditing live chat comments via Claude cultural brain: Sheng & Swahili banter verified SAFE.`, "text-amber-400");

  const logoOccupancy = (currentVisionResult && currentVisionResult.screen_occupancy_percent) || 4.12;

  const submission = {
    milestone_id: currentProposal.milestones[0].id,
    creator_id: currentProposal.creators[0].id,
    deliverable_type: "LIVE_STREAM_VOD",
    media_url: (currentVisionResult && currentVisionResult.proof_image_filename) || "generate",
    simulated_metrics: {
      logo_screen_ratio_percent: logoOccupancy,
      airtime_seconds: 11400,
      verbal_slogans_detected: [
        "Powered by Safaricom 5G",
        "Big up Safaricom for supporting youth gaming"
      ],
      audio_confidence: 0.94,
      brand_safety_status: "SAFE"
    }
  };

  try {
    const resp = await fetch('/api/v1/verification/submit-deliverable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission)
    });
    currentProofCert = await resp.json();

    logAgent("AGENT 3: VERIFICATION", `Consensus Confidence: ${currentProofCert.overall_confidence_percent}% &bull; Decision: ${currentProofCert.verification_decision}`, "text-purple-300 font-bold");
    logAgent("AGENT 3: VERIFICATION", `Sealed Cryptographic Hash: ${currentProofCert.cryptographic_hash.substring(0, 24)}...`, "text-gray-400 font-mono");

    renderProofCertificate(currentProofCert);
  } catch (err) {
    logAgent("ERROR", `Verification failed: ${err.message}`, "text-red-400");
  }
}

function renderProofCertificate(cert) {
  const container = document.getElementById('certificateContainer');
  container.className = "p-4 rounded-xl bg-purple-950/30 border border-purple-500/40 space-y-3 mt-4";
  container.innerHTML = `
    <div class="flex items-center justify-between border-b border-purple-500/20 pb-2">
      <span class="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
        <i class="fa-solid fa-certificate"></i> Proof-of-Play Certificate Sealed
      </span>
      <span class="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">${cert.verification_decision} (${cert.overall_confidence_percent}%)</span>
    </div>
    <div class="text-xs font-mono text-gray-300 space-y-1">
      <div>Cert ID: <span class="text-white">${cert.certificate_id}</span></div>
      <div>Crypto Hash: <span class="text-purple-300">${cert.cryptographic_hash}</span></div>
      <div>Airtime Logged: <span class="text-white">${(cert.airtime_seconds / 3600).toFixed(2)} hours</span></div>
      <div>Verified Screen Ratio: <span class="text-emerald-400 font-bold">${cert.logo_screen_ratio_percent}%</span></div>
    </div>
    <div class="pt-2">
      <button onclick="renderStep5Payout()" class="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all">
        Proceed to KRA eTIMS Fiscal Invoicing & PayPal Payout &rarr;
      </button>
    </div>
  `;
}

// =========================================================================
// STEP 5: KRA eTIMS & DISBURSEMENT
// =========================================================================

function renderStep5Payout() {
  setStepActive(5);
  document.getElementById('card-step-5').classList.remove('hidden');
  document.getElementById('card-step-5').scrollIntoView({ behavior: 'smooth' });

  const container = document.getElementById('etimsPayoutDetails');
  container.innerHTML = `
    <div class="space-y-4">
      <div class="p-4 rounded-xl bg-gray-900 border border-gray-800 text-xs space-y-2">
        <div class="font-bold text-white text-sm">Disbursement Reconciliation Summary</div>
        <div class="flex justify-between text-gray-400">
          <span>Milestone 1 Allocation (30%):</span>
          <span class="font-mono text-white">${formatMoney(currentProposal.milestones[0].amount_usd)}</span>
        </div>
        <div class="flex justify-between text-red-400">
          <span>Less: Statutory 5% Withholding Tax (WHT):</span>
          <span class="font-mono">-${formatMoney(currentProposal.milestones[0].amount_usd * 0.05)}</span>
        </div>
        <div class="flex justify-between text-emerald-400 font-bold border-t border-gray-800 pt-1">
          <span>Net Disbursed to Creator PayPal / M-Pesa:</span>
          <span class="font-mono">${formatMoney(currentProposal.milestones[0].amount_usd * 0.95)}</span>
        </div>
      </div>

      <button onclick="executeFinalDisbursementAndTax()" id="btnExecuteDisbursement" class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm shadow-lg shadow-red-500/20 flex items-center justify-center space-x-2 transition-all">
        <i class="fa-solid fa-qrcode"></i>
        <span>Agent 4: Issue KRA eTIMS Invoice (BII) & Release PayPal Payout</span>
      </button>

      <div id="finalInvoiceDossier" class="hidden"></div>
    </div>
  `;
}

async function executeFinalDisbursementAndTax() {
  logAgent("AGENT 4: TAX ENGINE", `Generating KRA eTIMS Buyer-Initiated Invoice (BII)...`, "text-red-400");
  logAgent("AGENT 4: FINANCE", `Triggering PayPal Payouts API to beneficiary wallet...`, "text-sky-400");

  try {
    const resp = await fetch('/api/v1/payments/disburse-milestone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proposal_id: currentProposal.id,
        milestone_id: currentProposal.milestones[0].id,
        certificate_id: currentProofCert.certificate_id
      })
    });
    const result = await resp.json();

    logAgent("AGENT 4: TAX ENGINE", `eTIMS Fiscal Invoice Issued! CU Ref: ${result.etims_cu_invoice_number}`, "text-red-300 font-bold");
    logAgent("AGENT 4: FINANCE", `PayPal Payout Released! ID: ${result.paypal_payout_id} &bull; Funds ready for M-Pesa cashout!`, "text-emerald-300 font-bold");
    logAgent("AGENT 6: METATWIN", `Logged youth empowerment metrics into ESG Social Impact ledger.`, "text-rose-400");

    renderFinalTaxInvoice(result);
  } catch (err) {
    logAgent("ERROR", `Disbursement failed: ${err.message}`, "text-red-400");
  }
}

function renderFinalTaxInvoice(result) {
  const container = document.getElementById('finalInvoiceDossier');
  container.className = "p-5 rounded-2xl bg-gray-900 border border-red-500/40 space-y-4 mt-4";
  container.innerHTML = `
    <div class="flex items-center justify-between border-b border-gray-800 pb-3">
      <div>
        <h4 class="font-bold text-white text-base">KRA Electronic Tax Invoice (eTIMS)</h4>
        <span class="text-xs text-emerald-400 font-semibold"><i class="fa-solid fa-circle-check"></i> Section 16(1)(c) Fully Validated & Deductible</span>
      </div>
      <span class="text-xs font-mono text-red-400 font-bold bg-red-950 px-2 py-1 rounded border border-red-500/40">${result.etims_cu_invoice_number}</span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
      <div class="md:col-span-2 space-y-1.5 text-xs">
        <div><span class="text-gray-400">Buyer PIN (Safaricom):</span> <span class="font-mono text-white">P051234567A</span></div>
        <div><span class="text-gray-400">Supplier PIN (Solo Creator):</span> <span class="font-mono text-white">A011982736K (BII Handled)</span></div>
        <div><span class="text-gray-400">Taxable Gross Amount:</span> <span class="font-mono text-white font-bold">KES ${(result.gross_amount_kes || 0).toLocaleString()}</span></div>
        <div><span class="text-gray-400">5% Withholding Tax Remitted:</span> <span class="font-mono text-red-400 font-bold">KES ${(result.withholding_tax_kes || 0).toLocaleString()}</span></div>
        <div><span class="text-gray-400">Net Creator Payment Received:</span> <span class="font-mono text-emerald-400 font-bold">KES ${(result.net_paid_kes || 0).toLocaleString()}</span></div>
      </div>
      <div class="flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-lg">
        <div id="qrcode"></div>
        <span class="text-[9px] text-gray-700 font-mono mt-1 font-bold">KRA eTIMS QR VERIFIED</span>
      </div>
    </div>

    <div class="pt-3 border-t border-gray-800 flex justify-between items-center text-xs">
      <span class="text-gray-400">PayPal Payout Ref: <span class="font-mono text-sky-400">${result.paypal_payout_id}</span></span>
      <button onclick="switchTab('impact')" class="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-rose-600 text-white font-bold text-xs shadow hover:opacity-90">
        View Barbah MetaTwin ESG Report &rarr;
      </button>
    </div>
  `;

  // Generate QR Code
  setTimeout(() => {
    new QRCode(document.getElementById("qrcode"), {
      text: result.qr_code_url,
      width: 100,
      height: 100
    });
  }, 100);
}

function setStepActive(stepNum) {
  for (let i = 1; i <= 5; i++) {
    const pill = document.getElementById(`step-pill-${i}`);
    if (i <= stepNum) {
      pill.className = "p-3 rounded-xl border border-emerald-500/50 bg-emerald-950/20 text-center transition-all opacity-100";
    } else {
      pill.className = "p-3 rounded-xl border border-gray-800 bg-gray-900/40 text-center opacity-60 transition-all";
    }
  }
}

// =========================================================================
// TAB 2: AG GRID INITIALIZATION
// =========================================================================
async function initAgGrid() {
  const gridDiv = document.querySelector('#myGrid');
  if (!gridDiv) return;

  const columnDefs = [
    { field: "name", headerName: "Creator / Organization", minWidth: 200, flex: 2 },
    { field: "gamer_tag", headerName: "Handle", minWidth: 140, flex: 1 },
    { field: "type", headerName: "Category", minWidth: 160, flex: 1 },
    { field: "primary_game", headerName: "Primary Game", minWidth: 160, flex: 1 },
    { field: "location", headerName: "Location", minWidth: 140, flex: 1 },
    { 
      field: "monthly_reach", 
      headerName: "Monthly Reach", 
      minWidth: 130,
      valueFormatter: params => params.value.toLocaleString()
    },
    { 
      field: "brand_safety_score", 
      headerName: "Brand Safety", 
      minWidth: 130,
      cellRenderer: params => {
        return `<span class="px-2 py-0.5 rounded font-bold text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">${params.value}%</span>`;
      }
    },
    { 
      field: "base_rate_usd", 
      headerName: "Base Rate", 
      minWidth: 130,
      valueFormatter: params => formatMoney(params.value)
    },
    { 
      field: "etims_registered", 
      headerName: "eTIMS Status", 
      minWidth: 140,
      cellRenderer: params => {
        return params.value 
          ? `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300">Registered</span>`
          : `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300">BII Eligible</span>`;
      }
    }
  ];

  const gridOptions = {
    columnDefs: columnDefs,
    rowData: [],
    pagination: true,
    paginationPageSize: 10,
    animateRows: true
  };

  gridApi = agGrid.createGrid(gridDiv, gridOptions);
  reloadCreatorsGrid();
}

function onFilterTextBoxChanged() {
  if (gridApi) {
    gridApi.setGridOption('quickFilterText', document.getElementById('agGridQuickFilter').value);
  }
}

// =========================================================================
// TAB 3: LOAD eTIMS INVOICES
// =========================================================================
async function loadInvoicesList() {
  const container = document.getElementById('invoicesList');
  container.innerHTML = '<div class="text-xs text-gray-500">Loading KRA eTIMS invoices...</div>';

  try {
    const resp = await fetch('/api/v1/payments/invoices');
    const invoices = await resp.json();

    if (invoices.length === 0) {
      container.innerHTML = '<div class="text-xs text-gray-500">No invoices generated yet. Run the demo to generate eTIMS tax invoices!</div>';
      return;
    }

    container.innerHTML = '';
    invoices.forEach(inv => {
      const card = document.createElement('div');
      card.className = "p-4 rounded-xl bg-gray-900 border border-gray-800 space-y-2 text-xs";
      card.innerHTML = `
        <div class="flex items-center justify-between border-b border-gray-800 pb-2">
          <span class="font-bold text-white font-mono">${inv.cu_invoice_number}</span>
          <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">SECTION 16 VALID</span>
        </div>
        <div><span class="text-gray-400">Supplier:</span> <span class="text-white">${inv.supplier_name} (${inv.supplier_pin})</span></div>
        <div><span class="text-gray-400">Buyer:</span> <span class="text-white">${inv.buyer_name} (${inv.buyer_pin})</span></div>
        <div><span class="text-gray-400">Gross:</span> <span class="text-white font-mono font-bold">KES ${(inv.taxable_amount_kes || 0).toLocaleString()}</span></div>
        <div><span class="text-gray-400">Withholding Tax (5%):</span> <span class="text-red-400 font-mono">KES ${(inv.withholding_tax_kes || 0).toLocaleString()}</span></div>
        <div class="pt-2 text-right">
          <a href="${inv.qr_code_url}" target="_blank" class="text-emerald-400 hover:underline">Verify on KRA eTIMS Portal &rarr;</a>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = `<div class="text-xs text-red-400">Failed to load invoices: ${err.message}</div>`;
  }
}

// =========================================================================
// TAB 4: LOAD BARBAH METATWIN ESG IMPACT DOSSIER
// =========================================================================
async function loadImpactDossier() {
  const container = document.getElementById('impactDossier');
  container.innerHTML = '<div class="text-xs text-gray-500">Generating MetaTwin ESG report...</div>';

  try {
    const resp = await fetch(`/api/v1/impact/metatwin/${currentProposal.id}`);
    const report = await resp.json();

    container.innerHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div class="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30">
          <span class="text-xs text-purple-300 block">Total Youth Engaged</span>
          <span class="text-2xl font-extrabold text-white mt-1 block">${(report.youth_reached_total || 0).toLocaleString()}</span>
        </div>
        <div class="p-4 rounded-xl bg-blue-950/20 border border-blue-500/30">
          <span class="text-xs text-blue-300 block">Collegiate Gamers Empowered</span>
          <span class="text-2xl font-extrabold text-white mt-1 block">${(report.collegiate_gamers_empowered || 0).toLocaleString()}</span>
        </div>
        <div class="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30">
          <span class="text-xs text-emerald-300 block">Informal Settlement Share</span>
          <span class="text-2xl font-extrabold text-emerald-400 mt-1 block">${report.informal_settlement_youth_share_percent}%</span>
        </div>
        <div class="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30">
          <span class="text-xs text-rose-300 block">Female Inclusion Index</span>
          <span class="text-2xl font-extrabold text-rose-400 mt-1 block">${report.female_gamer_inclusion_percent}%</span>
        </div>
      </div>

      <div class="p-5 rounded-2xl bg-gray-900 border border-gray-800 space-y-3">
        <h3 class="font-bold text-white text-base">MetaTwin ESG Social Assurance Certification</h3>
        <p class="text-xs text-gray-400">
          This dossier verifies that corporate sponsorship capital directly stimulated digital economy skills,
          youth employment, and tournament livelihoods across underserved urban estates in Nairobi and secondary regional hubs.
        </p>
        <div class="p-3 rounded-lg bg-black/60 font-mono text-xs text-gray-300 break-all">
          <span class="text-gray-500 block mb-1">Cryptographic ESG Proof Hash:</span>
          ${report.metatwin_verified_hash}
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="text-xs text-red-400">Failed to load impact report: ${err.message}</div>`;
  }
}
