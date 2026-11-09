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
let gridApi = null;

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
  initAgGrid();
  logAgent("SYSTEM", "Barbah SponsorPlay core initialized. Preloaded Kenyan esports talent graph.");
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
  const timeStr = new Date().toLocaleTimeString();
  const line = document.createElement('div');
  line.className = color;
  line.innerHTML = `<span class="text-gray-500">[${timeStr}]</span> <span class="font-bold">[${agentName}]</span> ${message}`;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
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

    logAgent("AGENT 1: SCOUT", `Scored and synthesized ${syndicates.length} synergistic Sponsorship Syndicates!`, "text-emerald-300 font-bold");
    renderSyndicateCards(syndicates);
    document.getElementById('syndicateResults').classList.remove('hidden');

    currentCampaign = payload;
  } catch (err) {
    logAgent("ERROR", `Failed to run scout: ${err.message}`, "text-red-400");
  }
}

function renderSyndicateCards(syndicates) {
  const container = document.getElementById('syndicateCards');
  container.innerHTML = '';

  syndicates.forEach((syn, index) => {
    const card = document.createElement('div');
    card.className = "p-4 rounded-xl border border-gray-800 bg-gray-900/70 hover:border-emerald-500/50 transition-all cursor-pointer";
    card.innerHTML = `
      <div class="flex items-start justify-between">
        <div>
          <div class="flex items-center space-x-2">
            <span class="font-bold text-white text-base">${syn.title}</span>
            <span class="text-xs bg-emerald-500/20 text-emerald-400 font-semibold px-2 py-0.5 rounded border border-emerald-500/30">Synergy: ${syn.synergy_score}%</span>
            <span class="text-xs bg-purple-500/20 text-purple-300 font-semibold px-2 py-0.5 rounded">${syn.etims_compliance_mode}</span>
          </div>
          <p class="text-xs text-gray-400 mt-1">${syn.rationale}</p>
        </div>
        <div class="text-right">
          <span class="text-sm font-bold text-emerald-400 block font-mono">${formatMoney(syn.total_cost_usd)}</span>
          <span class="text-[11px] text-gray-500 block">Est. Reach: ${(syn.expected_reach || 0).toLocaleString()}</span>
        </div>
      </div>

      <div class="mt-3 pt-3 border-t border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-2">
        ${syn.creators.map(c => `
          <div class="p-2 rounded-lg bg-gray-950/60 border border-gray-800/80 text-xs">
            <div class="font-semibold text-gray-200 truncate">${c.name}</div>
            <div class="text-[10px] text-gray-400">${c.gamer_tag} &bull; ${c.location}</div>
            <div class="text-[10px] ${c.etims_registered ? 'text-emerald-400' : 'text-amber-400'}">
              ${c.etims_registered ? 'eTIMS Registered' : 'BII Invoicing Required'}
            </div>
          </div>
        `).join('')}
      </div>

      <div class="mt-4 flex justify-end">
        <button onclick="selectSyndicate('${syn.syndicate_id}', '${syn.campaign_id || (currentCampaign && currentCampaign.id) || ''}')" class="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all">
          Select Syndicate & Generate Contract &rarr;
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

// STEP 2: SELECT SYNDICATE & RUN ARCHITECT
async function selectSyndicate(syndicateId, campaignId) {
  const cId = campaignId || (currentCampaign && currentCampaign.id) || "CAMP-001";
  logAgent("AGENT 2: ARCHITECT", `Structuring milestone contract for Syndicate ${syndicateId}...`, "text-blue-400");

  try {
    const resp = await fetch('/api/v1/campaigns/proposal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign_id: cId,
        syndicate_id: syndicateId
      })
    });
    const data = await resp.json();
    if (!resp.ok) {
      throw new Error(data.detail || "Server error while generating milestone proposal");
    }
    currentProposal = data;

    logAgent("AGENT 2: ARCHITECT", `Generated 3-stage milestone schedule with 10% platform fee and 5% KRA Withholding Tax!`, "text-blue-300 font-bold");
    renderProposal(currentProposal);

    // Update Step Pills
    setStepActive(2);
  } catch (err) {
    logAgent("ERROR", `Failed to generate proposal: ${err.message}`, "text-red-400");
  }
}

function renderProposal(proposal) {
  document.getElementById('card-step-2').classList.remove('hidden');
  document.getElementById('card-step-2').scrollIntoView({ behavior: 'smooth' });

  const container = document.getElementById('proposalDetails');
  container.innerHTML = `
    <!-- Financial Schedule Breakdown -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-gray-900/90 border border-gray-800">
      <div>
        <span class="text-xs text-gray-400 block">Gross Sponsor Budget</span>
        <span class="text-base font-bold text-white font-mono">${formatMoney(proposal.total_budget_usd)}</span>
      </div>
      <div>
        <span class="text-xs text-blue-400 block">Barbah Facilitation (10%)</span>
        <span class="text-base font-bold text-blue-400 font-mono">${formatMoney(proposal.platform_fee_usd)}</span>
      </div>
      <div>
        <span class="text-xs text-red-400 block">KRA 5% Withholding Tax</span>
        <span class="text-base font-bold text-red-400 font-mono">${formatMoney(proposal.withholding_tax_usd)}</span>
      </div>
      <div>
        <span class="text-xs text-emerald-400 block">Net Creator Payout</span>
        <span class="text-base font-bold text-emerald-400 font-mono">${formatMoney(proposal.net_creator_disbursement_usd)}</span>
      </div>
    </div>

    <!-- Milestones Timeline -->
    <div class="space-y-3">
      <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider">Campaign Milestones (Bryntum Deliverables)</h3>
      ${proposal.milestones.map(m => `
        <div class="p-4 rounded-xl border border-gray-800 bg-gray-950/60 flex items-start justify-between">
          <div class="space-y-1">
            <div class="flex items-center space-x-2">
              <span class="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300">Phase ${m.milestone_number} (${m.percentage}%)</span>
              <span class="font-bold text-sm text-gray-200">${m.title}</span>
            </div>
            <p class="text-xs text-gray-400">${m.description}</p>
            <ul class="text-[11px] text-gray-400 list-disc list-inside mt-1 space-y-0.5">
              ${m.deliverables.map(d => `<li>${d}</li>`).join('')}
            </ul>
          </div>
          <div class="text-right">
            <span class="text-sm font-bold text-emerald-400 font-mono">${formatMoney(m.amount_usd)}</span>
            <span class="text-[10px] block text-amber-400 font-semibold mt-1">${m.status}</span>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Legal Compliance Clauses -->
    <div class="p-3 rounded-lg bg-gray-950 border border-gray-800 text-[11px] text-gray-400 space-y-1 font-mono">
      <span class="text-gray-300 font-bold block mb-1">Executable Agreement Compliance Terms:</span>
      ${proposal.legal_clauses.map(c => `<div>${c}</div>`).join('')}
    </div>

    <div class="flex justify-end pt-2">
      <button onclick="approveProposalAndProceedToPayPal()" class="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-500/20 flex items-center space-x-2">
        <i class="fa-brands fa-paypal"></i>
        <span>Approve Agreement & Fund via PayPal Sandbox</span>
      </button>
    </div>
  `;
}

// STEP 3: PAYPAL ESCROW CHECKOUT
async function approveProposalAndProceedToPayPal() {
  logAgent("AGENT 4: FINANCE", `Initializing PayPal Orders v2 multiparty order...`, "text-sky-400");

  try {
    const resp = await fetch('/api/v1/payments/create-escrow-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proposal_id: currentProposal.id })
    });
    const orderData = await resp.json();
    currentPayPalOrder = orderData.paypal_order;

    logAgent("AGENT 4: FINANCE", `PayPal Order Created! ID: ${currentPayPalOrder.id} &bull; Multiparty fee split configured.`, "text-sky-300 font-bold");
    renderPayPalCheckout(currentPayPalOrder);
    setStepActive(3);
  } catch (err) {
    logAgent("ERROR", `Failed to initialize PayPal order: ${err.message}`, "text-red-400");
  }
}

function renderPayPalCheckout(order) {
  document.getElementById('card-step-3').classList.remove('hidden');
  document.getElementById('card-step-3').scrollIntoView({ behavior: 'smooth' });

  const container = document.getElementById('paypalEscrowDetails');
  container.innerHTML = `
    <div class="p-5 rounded-2xl bg-[#001c38] border border-blue-500/40 space-y-4">
      <div class="flex items-center justify-between border-b border-blue-500/20 pb-3">
        <div class="flex items-center space-x-3">
          <i class="fa-brands fa-paypal text-3xl text-sky-400"></i>
          <div>
            <h3 class="font-bold text-white text-base">PayPal Complete Payments Escrow</h3>
            <span class="text-xs text-sky-300">Sandbox Developer Environment</span>
          </div>
        </div>
        <span class="font-mono text-xs px-2.5 py-1 bg-sky-950 text-sky-300 border border-sky-500/40 rounded">Order: ${order.id}</span>
      </div>

      <div class="space-y-2 text-xs">
        <div class="flex justify-between py-1 border-b border-blue-900/40">
          <span class="text-gray-300">Gross Campaign Authorization:</span>
          <span class="font-bold text-white font-mono">$${currentProposal.total_budget_usd.toFixed(2)} USD</span>
        </div>
        <div class="flex justify-between py-1 border-b border-blue-900/40">
          <span class="text-sky-300">Platform Facilitation Fee (payment_instruction):</span>
          <span class="font-bold text-sky-300 font-mono">-$${currentProposal.platform_fee_usd.toFixed(2)} USD</span>
        </div>
        <div class="flex justify-between py-1 border-b border-blue-900/40">
          <span class="text-emerald-300">Net Isolated in Milestone Escrow:</span>
          <span class="font-bold text-emerald-300 font-mono">$${currentProposal.gross_beneficiary_usd.toFixed(2)} USD</span>
        </div>
        <div class="flex justify-between py-1 pt-2">
          <span class="text-gray-400">Section 16 Tax Invoice Generated:</span>
          <span class="text-emerald-400 font-bold">YES &bull; Barbah Games KRA PIN: P051982736Z</span>
        </div>
      </div>

      <div class="pt-2">
        <button onclick="capturePayPalOrder('${order.id}')" id="btnCapturePayPal" class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-gray-950 font-extrabold text-sm shadow-lg flex items-center justify-center space-x-2 transition-all">
          <i class="fa-solid fa-lock"></i>
          <span>Authorize & Capture Payment into Milestone Escrow</span>
        </button>
      </div>
    </div>
  `;
}

async function capturePayPalOrder(orderId) {
  logAgent("AGENT 4: FINANCE", `Simulating PayPal authorization & capture...`, "text-sky-400");

  try {
    const resp = await fetch(`/api/v1/payments/capture-order/${orderId}`, {
      method: 'POST'
    });
    const captureData = await resp.json();

    logAgent("AGENT 4: FINANCE", `Capture confirmed! Escrow Status: FUNDED_IN_ESCROW. Campaign is now ACTIVE!`, "text-emerald-300 font-bold");

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

// STEP 4: MULTIMODAL PROOF-OF-PLAY
function renderVerificationStep() {
  document.getElementById('card-step-4').classList.remove('hidden');
  document.getElementById('card-step-4').scrollIntoView({ behavior: 'smooth' });

  const container = document.getElementById('verificationDetails');
  container.innerHTML = `
    <div class="space-y-4">
      <!-- Simulated Live Stream Preview Frame -->
      <div class="relative rounded-2xl overflow-hidden border border-gray-700 bg-gray-950 aspect-video flex items-center justify-center group">
        <div class="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 z-10"></div>
        <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80" alt="Esports Tournament" class="w-full h-full object-cover opacity-60">
        
        <!-- Bounding Box Simulated Overlay -->
        <div class="absolute top-6 left-6 z-20 border-2 border-emerald-400 bg-emerald-500/20 px-3 py-1.5 rounded-lg flex items-center space-x-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="text-xs font-bold text-white font-mono">SAFARICOM 5G [Occupancy: 8.4%]</span>
        </div>

        <!-- Shoutcaster Audio Waveform Simulation -->
        <div class="absolute bottom-6 left-6 right-6 z-20 bg-gray-900/80 backdrop-blur p-3 rounded-xl border border-gray-700 flex items-center justify-between text-xs">
          <div class="flex items-center space-x-2">
            <i class="fa-solid fa-microphone text-emerald-400"></i>
            <span class="text-gray-300 font-mono">"Shoutcaster: Big up Safaricom 5G powering today's LAN finals!"</span>
          </div>
          <span class="text-emerald-400 font-bold font-mono">STT Confidence: 94.2%</span>
        </div>
      </div>

      <!-- Verification Specs Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div class="p-3 rounded-xl bg-gray-900/80 border border-gray-800">
          <span class="text-xs text-gray-400 block">Computer Vision Area</span>
          <span class="text-sm font-bold text-emerald-400 font-mono">8.4% (Threshold: 3.5%)</span>
        </div>
        <div class="p-3 rounded-xl bg-gray-900/80 border border-gray-800">
          <span class="text-xs text-gray-400 block">Verbal Slogans Detected</span>
          <span class="text-sm font-bold text-emerald-400 font-mono">3 Callouts Verified</span>
        </div>
        <div class="p-3 rounded-xl bg-gray-900/80 border border-gray-800">
          <span class="text-xs text-gray-400 block">Brand Safety (Agent 5)</span>
          <span class="text-sm font-bold text-emerald-400 font-mono">0.0% Toxicity (SAFE)</span>
        </div>
      </div>

      <button onclick="executeMultimodalVerification()" id="btnVerifyDeliverable" class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-500/20 flex items-center justify-center space-x-2 transition-all">
        <i class="fa-solid fa-wand-magic-sparkles"></i>
        <span>Agent 3: Run Multimodal Consensus & Seal Certificate</span>
      </button>

      <div id="certificateContainer" class="hidden"></div>
    </div>
  `;
}

async function executeMultimodalVerification() {
  logAgent("AGENT 3: VERIFICATION", `Ingesting stream VOD and telemetry for Milestone 1...`, "text-purple-400");
  logAgent("AGENT 5: GUARDIAN", `Auditing 1,420 live chat comments: 0 slurs detected. Environment SAFE.`, "text-amber-400");

  const submission = {
    milestone_id: currentProposal.milestones[0].id,
    creator_id: currentProposal.creators[0].id,
    deliverable_type: "LIVE_STREAM_VOD",
    media_url: "https://twitch.tv/videos/safaricom_esports_finals_vod",
    simulated_metrics: {
      logo_screen_ratio_percent: 8.4,
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
    </div>
    <div class="pt-2">
      <button onclick="renderStep5Payout()" class="w-full py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-all">
        Proceed to KRA eTIMS Fiscal Invoicing & PayPal Payout &rarr;
      </button>
    </div>
  `;
}

// STEP 5: KRA eTIMS & DISBURSEMENT
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

  try {
    const resp = await fetch('/api/v1/campaigns/creators');
    const creators = await resp.json();
    gridApi.setGridOption('rowData', creators);
  } catch (err) {
    console.error("Failed to load creators for AG Grid:", err);
  }
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
