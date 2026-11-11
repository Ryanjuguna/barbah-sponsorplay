/**
 * Barbah SponsorPlay - Creator / Beneficiary Frontend Application
 * PayPal AI Hackathon - Track 02: Sponsor Play
 * Lead Developer: Beneficiary Talent Systems Lead
 */

let currentCurrency = 'USD';
const USD_TO_KES_RATE = 130.0;

let currentCreatorId = 'creator-001';
let currentCreator = null;
let currentDashboard = null;
let currentActiveProposal = null;
let selectedPresetScenario = 'PASS';
let selectedBase64Image = null;
let allCreatorsList = [];

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', async () => {
  initThreeCanvas();
  loadCreatorSessionState();
  setupUrlParams();
  await loadAllCreators();
  await loadCreatorDashboard(currentCreatorId);
  setupDropZone();
  logCreatorAgent("SYSTEM", "Creator & Beneficiary Platform connected to Barbah PlayEconomy.");
  logCreatorAgent("ORACLE", "PayPal Programmatic Milestone Ledger bridge & KRA Section 16 BII engine ONLINE.");
});

function loadCreatorSessionState() {
  try {
    const raw = localStorage.getItem('sponsorplay_auth');
    if (raw) {
      const auth = JSON.parse(raw);
      if (auth.role === 'creator' && auth.user) {
        currentCreatorId = auth.user.id;
        const tagEl = document.getElementById('navCreatorTag');
        if (tagEl && auth.user.gamer_tag) tagEl.innerText = `@${auth.user.gamer_tag}`;
      }
    }
  } catch (e) {
    console.error("Creator session load error:", e);
  }
}

// Parse URL params for direct link handling (e.g. from email notifications)
function setupUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const cId = urlParams.get('creator_id');
  const pId = urlParams.get('proposal');

  if (cId) currentCreatorId = cId;
  if (pId) {
    console.log("Direct proposal target:", pId);
  }
}

// Format money in USD or KES
function formatMoney(amountUSD) {
  if (amountUSD === undefined || amountUSD === null || isNaN(amountUSD)) return "$0.00";
  const num = Number(amountUSD);
  if (currentCurrency === 'KES') {
    const kes = num * USD_TO_KES_RATE;
    return `KES ${kes.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `$${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Currency Switcher
function setCurrency(curr) {
  currentCurrency = curr;
  const btnUSD = document.getElementById('btnCurrencyUSD');
  const btnKES = document.getElementById('btnCurrencyKES');
  if (btnUSD) btnUSD.className = curr === 'USD' 
    ? 'px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md font-mono transition-all font-bold' 
    : 'px-3 py-1 rounded-full text-gray-400 hover:text-white font-mono transition-all font-bold';
  if (btnKES) btnKES.className = curr === 'KES' 
    ? 'px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md font-mono transition-all font-bold' 
    : 'px-3 py-1 rounded-full text-gray-400 hover:text-white font-mono transition-all font-bold';

  if (currentDashboard) {
    renderDashboard(currentDashboard);
  }
}

// Tab Switching
function switchCreatorTab(tabName) {
  ['deals', 'offers', 'earnings', 'tax', 'chat', 'passport', 'profile'].forEach(t => {
    const viewEl = document.getElementById(`view-${t}`);
    const tabEl = document.getElementById(`tab-${t}`);
    if (viewEl) viewEl.classList.add('hidden');
    if (tabEl) tabEl.className = 'py-2 px-4 rounded-full text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/[0.05] border border-transparent flex items-center space-x-2 whitespace-nowrap transition-all';
  });

  const activeView = document.getElementById(`view-${tabName}`);
  const activeTab = document.getElementById(`tab-${tabName}`);
  if (activeView) activeView.classList.remove('hidden');
  if (activeTab) activeTab.className = 'py-2 px-4 rounded-full text-xs font-bold text-white bg-white/[0.08] border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.06)] flex items-center space-x-2 whitespace-nowrap transition-all';

  if (tabName === 'chat' && currentActiveProposal) {
    loadChatMessages(currentActiveProposal.id);
  }
}

// Agent Copilot Terminal Logger
function logCreatorAgent(agentName, message, color = 'text-purple-300') {
  const terminal = document.getElementById('creatorAgentFeed');
  if (!terminal) return;
  const timeStr = new Date().toLocaleTimeString();
  const line = document.createElement('div');
  line.className = color;
  line.innerHTML = `<span class="text-gray-500">[${timeStr}]</span> <span class="font-bold text-[#a78bfa]">[${agentName}]</span> ${message}`;
  terminal.appendChild(line);
  terminal.scrollTop = terminal.scrollHeight;
}

// Load all creators for the persona switcher
async function loadAllCreators() {
  try {
    const resp = await fetch('/api/v1/campaigns/creators');
    if (!resp.ok) return;
    allCreatorsList = await resp.json();

    const select = document.getElementById('creatorPersonaSelect');
    if (!select) return;
    select.innerHTML = '';

    allCreatorsList.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.innerText = `${c.name} (@${c.gamer_tag}) - ${c.type}`;
      if (c.id === currentCreatorId) opt.selected = true;
      select.appendChild(opt);
    });
  } catch (err) {
    console.error("Failed to load creators list:", err);
  }
}

// Persona Switcher Handler
async function switchCreatorPersona(creatorId) {
  currentCreatorId = creatorId;
  const navTagEl = document.getElementById('navCreatorTag');
  const matched = allCreatorsList.find(x => x.id === creatorId);
  if (navTagEl && matched) navTagEl.innerText = `@${matched.gamer_tag}`;
  logCreatorAgent("IDENTITY", `Switched active creator profile to ${creatorId}...`, "text-sky-300");
  await loadCreatorDashboard(creatorId);
}

// Load Unified Dashboard State
async function loadCreatorDashboard(creatorId) {
  try {
    const resp = await fetch(`/api/v1/creator/dashboard/${creatorId}`);
    if (!resp.ok) {
      throw new Error(`Dashboard API returned HTTP ${resp.status}`);
    }
    const data = await resp.json();
    currentDashboard = data;
    currentCreator = data.creator;

    // Pick active proposal
    currentActiveProposal = (data.active_deals && data.active_deals.length > 0) 
      ? data.active_deals[0] 
      : ((data.pending_offers && data.pending_offers.length > 0) ? data.pending_offers[0] : null);

    renderDashboard(data);
  } catch (err) {
    console.error("Failed to load creator dashboard:", err);
    logCreatorAgent("ERROR", `Failed to load dashboard: ${err.message}`, "text-red-400");
  }
}

// Render Dashboard Data into DOM
function renderDashboard(data) {
  const c = data.creator;

  // 1. Hero Profile Elements
  document.getElementById('creatorNameHeading').innerText = c.name;
  document.getElementById('creatorGamerTagBadge').innerText = `@${c.gamer_tag}`;
  const navTagEl = document.getElementById('navCreatorTag');
  if (navTagEl) navTagEl.innerText = `@${c.gamer_tag}`;
  document.getElementById('creatorRoleSpan').innerHTML = `<i class="fa-solid fa-gamepad text-purple-400"></i> ${c.type}`;
  document.getElementById('creatorGameSpan').innerText = c.primary_game;
  document.getElementById('creatorLocationSpan').innerHTML = `<i class="fa-solid fa-location-dot text-rose-400"></i> ${c.location}`;
  document.getElementById('creatorReachSpan').innerText = `${c.monthly_reach.toLocaleString()} monthly reach`;

  const initials = c.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  document.getElementById('creatorAvatarBox').innerText = initials;

  // Telemetry Pills
  document.getElementById('statLedgerEscrow').innerText = formatMoney(data.ledger_escrow_usd);
  document.getElementById('statTotalEarned').innerText = formatMoney(data.total_earned_usd);
  document.getElementById('statBrandSafety').innerText = `${c.brand_safety_score}%`;
  document.getElementById('statTaxStatus').innerText = c.etims_registered ? 'KRA Direct' : 'BII Protected';

  // Badges
  document.getElementById('badgeActiveDealsCount').innerText = data.active_deals.length;
  document.getElementById('badgePendingOffersCount').innerText = data.pending_offers.length;

  // 2. Render Active Deals & Milestones Studio
  renderActiveDealView(data);

  // 3. Render Offers Inbox
  renderOffersInbox(data.pending_offers);

  // 4. Render Earnings Dashboard
  renderEarningsDashboard(data);

  // 5. Render eTIMS Tax Vault
  renderTaxVault(data);

  // 6. Render Skills Passport
  renderSkillsPassport(data.skills_passport, c);

  // 7. Render Profile Settings
  renderProfileSettings(c);
}

// RENDER TAB 1: ACTIVE DEALS & DELIVERABLES STUDIO
function renderActiveDealView(data) {
  const container = document.getElementById('activeDealHeaderCard');
  const proposal = currentActiveProposal;

  if (!proposal) {
    container.innerHTML = `
      <div class="text-center py-8 space-y-3">
        <div class="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-gray-400">
          <i class="fa-solid fa-handshake-slash text-xl"></i>
        </div>
        <h3 class="text-base font-bold text-white">No Active Sponsorship Campaign</h3>
        <p class="text-xs text-gray-400 max-w-md mx-auto">
          You do not have an active funded deal currently in execution. Check your <button onclick="switchCreatorTab('offers')" class="text-purple-400 underline font-bold">Offer Inbox</button> to accept new brand proposals!
        </p>
      </div>
    `;
    document.getElementById('creatorMilestonesList').innerHTML = `<p class="text-xs text-gray-500 text-center py-4">No active milestones</p>`;
    return;
  }

  const isFunded = proposal.status === 'FUNDED' || proposal.status === 'ACTIVE' || proposal.status === 'COMMITTED_IN_LEDGER';

  container.innerHTML = `
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
      <div>
        <div class="flex items-center space-x-2">
          <span class="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            ${isFunded ? 'PAYPAL MILESTONE LEDGER FUNDED' : 'PENDING SPONSOR FUNDING'}
          </span>
          <span class="text-xs text-gray-400 font-mono">Deal ID: ${proposal.id}</span>
        </div>
        <h2 class="text-xl font-black text-white mt-1">${proposal.brand_name}</h2>
        <p class="text-xs text-gray-300 mt-0.5">Campaign Budget: <strong class="text-emerald-400 font-mono">${formatMoney(proposal.total_budget_usd)}</strong> &bull; Net Creator Payout: <strong class="text-sky-400 font-mono">${formatMoney(proposal.net_creator_disbursement_usd)}</strong></p>
      </div>
      <div class="flex items-center space-x-2">
        <button onclick="switchCreatorTab('chat')" class="pill-btn px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs text-gray-300 hover:text-white font-medium flex items-center space-x-1.5 transition-all">
          <i class="fa-solid fa-comments text-amber-400"></i>
          <span>Open Deal Room</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs font-mono">
      <div>
        <span class="text-gray-400 block text-[11px]">Sponsor Brand:</span>
        <strong class="text-white text-sm">${proposal.brand_name}</strong>
      </div>
      <div>
        <span class="text-gray-400 block text-[11px]">Milestones:</span>
        <strong class="text-purple-300 text-sm">${proposal.milestones.length} Phases</strong>
      </div>
      <div>
        <span class="text-gray-400 block text-[11px]">Section 16 WHT:</span>
        <strong class="text-rose-400 text-sm">5% (${formatMoney(proposal.withholding_tax_usd)})</strong>
      </div>
      <div>
        <span class="text-gray-400 block text-[11px]">Ledger Status:</span>
        <strong class="text-emerald-400 text-sm">${proposal.status}</strong>
      </div>
    </div>
  `;

  // Render Milestones Checklist in right column & populate target selector
  renderMilestonesList(proposal.milestones);
}

// Render Milestones Checklist in Right Column
function renderMilestonesList(milestones) {
  const listContainer = document.getElementById('creatorMilestonesList');
  const selector = document.getElementById('selectDeliverableMilestone');

  listContainer.innerHTML = '';
  selector.innerHTML = '';

  milestones.forEach((m, idx) => {
    // Populate dropdown
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.innerText = `Milestone ${m.milestone_number}: ${m.title} (${m.percentage}%)`;
    selector.appendChild(opt);

    // Render Milestone Card
    const card = document.createElement('div');
    const isVerified = m.status === 'VERIFIED';
    const isDisbursed = m.status === 'DISBURSED' || m.status === 'PAID';
    const isInLedger = m.status === 'COMMITTED_IN_LEDGER' || m.status === 'IN_PROGRESS';

    let badgeClass = "bg-white/[0.05] text-gray-400 border-white/10";
    let badgeText = m.status;

    if (isDisbursed) {
      badgeClass = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
      badgeText = "PAID TO PAYPAL";
    } else if (isVerified) {
      badgeClass = "bg-purple-500/20 text-purple-300 border-purple-500/40";
      badgeText = "VERIFIED (READY FOR PAYOUT)";
    } else if (isInLedger) {
      badgeClass = "bg-sky-500/20 text-sky-300 border-sky-500/40";
      badgeText = "MILESTONES FUNDED";
    }

    card.className = `p-3.5 rounded-2xl border ${isVerified ? 'border-purple-500/40 bg-purple-950/20' : 'border-white/[0.06] bg-white/[0.02]'} space-y-2 text-xs transition-all`;
    card.innerHTML = `
      <div class="flex items-start justify-between">
        <div>
          <span class="text-[10px] font-mono font-bold text-gray-400">PHASE ${m.milestone_number} (${m.percentage}%)</span>
          <h4 class="font-bold text-white text-xs mt-0.5">${m.title}</h4>
        </div>
        <span class="text-[10px] font-mono px-2 py-0.5 rounded-full border ${badgeClass} font-bold">${badgeText}</span>
      </div>

      <div class="flex justify-between items-center text-xs font-mono pt-1 border-t border-white/[0.04]">
        <span class="text-gray-400">Payout Amount:</span>
        <span class="font-bold text-emerald-400">${formatMoney(m.amount_usd * 0.95)} <span class="text-[10px] text-gray-500">(Net)</span></span>
      </div>

      <div class="space-y-1 pt-1">
        <span class="text-[10px] text-gray-500 uppercase font-semibold block">Required Deliverables:</span>
        <ul class="text-[11px] text-gray-400 space-y-0.5 list-disc list-inside">
          ${m.deliverables.map(d => `<li>${d}</li>`).join('')}
        </ul>
      </div>

      ${isVerified && !isDisbursed ? `
        <div class="pt-2">
          <button onclick="claimMilestonePayout('${currentActiveProposal.id}', '${m.id}')" class="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow flex items-center justify-center space-x-1.5 transition-all">
            <i class="fa-brands fa-paypal"></i>
            <span>Claim ${formatMoney(m.amount_usd * 0.95)} Payout Now &rarr;</span>
          </button>
        </div>
      ` : ''}
    `;
    listContainer.appendChild(card);
  });
}

// =========================================================================
// 1-CLICK FAST-TRACK DELIVERABLE VERIFICATION & AUTO-CLAIM TRIGGER
// =========================================================================
async function fastTrackSubmitDeliverable(scenario) {
  if (!currentActiveProposal) {
    try {
      const resp = await fetch(`/api/v1/creator/offers/${currentCreatorId}`);
      if (resp.ok) {
        const offers = await resp.json();
        if (offers && offers.length > 0) {
          logCreatorAgent("AUTO-ACCEPT", `Auto-accepting offer from ${offers[0].brand_name} to fast-track verification...`, "text-sky-300 font-bold");
          await executeOfferAcceptance(offers[0].id);
        } else {
          alert("Please accept an offer or select an active deal first!");
          return;
        }
      }
    } catch (e) {
      alert("Please accept an offer or select an active deal first!");
      return;
    }
  }

  let deliverableType = "LIVE_STREAM_VOD";
  let notes = "Verified broadcast overlay via 1-click fast track.";
  if (scenario === "VENUE") {
    deliverableType = "VENUE_PHOTO";
    notes = "On-site physical roll-up banner staging in Nairobi LAN lounge.";
  } else if (scenario === "BRACKET") {
    deliverableType = "TOURNAMENT_BRACKET";
    notes = "Start.gg & Challonge tournament playoffs bracket certification.";
  } else if (scenario === "LOW_OCCUPANCY") {
    deliverableType = "LIVE_STREAM_VOD";
    notes = "Sub-threshold test frame for error remedy simulation.";
  }

  const delivTypeSelect = document.getElementById('selectDeliverableType');
  if (delivTypeSelect) delivTypeSelect.value = deliverableType;

  selectedPresetScenario = scenario;
  selectedBase64Image = null;

  logCreatorAgent("FAST-TRACK", `1-Click Fast Track engaged for ${deliverableType} [Scenario: ${scenario}]. Submitting to Agent 3...`, "text-[#4fd8e6] font-bold");

  const milestoneId = document.getElementById('selectDeliverableMilestone')?.value || (currentActiveProposal.milestones && currentActiveProposal.milestones[0].id) || "MLS-01";

  const payload = {
    proposal_id: currentActiveProposal.id,
    milestone_id: milestoneId,
    creator_id: currentCreatorId,
    deliverable_type: deliverableType,
    media_url: null,
    image_base64: null,
    preset_scenario: scenario,
    notes: notes,
    brand_name: currentActiveProposal.brand_name
  };

  const btn = document.getElementById('btnSubmitDeliverable');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>Agent 3 Ingesting & Verifying Multimodal Proof...</span>`;
  }

  try {
    const resp = await fetch('/api/v1/creator/deliverables/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.detail || "Verification failed");
    }

    const data = await resp.json();
    const cert = data.certificate;

    logCreatorAgent("CONSENSUS", `Multimodal Consensus: ${cert.verification_decision} (${cert.overall_confidence_percent}%) [Engine: ${cert.verification_engine || 'OPENCV'}]`, "text-emerald-300 font-extrabold");
    logCreatorAgent("PROOF SEAL", `Sealed Cryptographic Hash: ${cert.cryptographic_hash.substring(0, 24)}...`, "text-purple-300 font-mono");

    // Render Verification Result Card
    renderVerificationCertificate(cert, data.milestone);

    // Refresh Dashboard Data
    await loadCreatorDashboard(currentCreatorId);

    // Auto-Disbursement alert if PASSED
    if (cert.verification_decision === "PASSED") {
      logCreatorAgent("AUTO-DISBURSEMENT", `Deliverable verified! Programmatic payout of $${((data.milestone ? data.milestone.amount_usd : 200) * 0.95).toFixed(2)} USD ready in ledger. Click 'Claim Payout Now' or let sponsor execute final release.`, "text-emerald-400 font-bold");
    }

  } catch (err) {
    console.error("Fast track submission failed:", err);
    logCreatorAgent("ERROR", `Deliverable verification failed: ${err.message}`, "text-red-400");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i><span>Post Deliverable & Trigger Agent 3 Multimodal Verification</span>`;
    }
  }
}

// Preset Scenario Selector for Zero-Friction Demo
function selectPresetScenario(scenario) {
  selectedPresetScenario = scenario;
  selectedBase64Image = null;

  const previewBox = document.getElementById('uploadPreviewBox');
  const previewImg = document.getElementById('uploadPreviewImg');
  const uploadPrompt = document.getElementById('uploadPrompt');
  const fileNameSpan = document.getElementById('uploadFileNameSpan');

  uploadPrompt.classList.add('hidden');
  previewBox.classList.remove('hidden');

  if (scenario === 'PASS') {
    previewImg.src = '/static/proofs/stream_pass_1794389138.jpg';
    fileNameSpan.innerText = "Preset: Safaricom 5G EA FC 25 Stream (4.12% Occupancy - PASS)";
    logCreatorAgent("PRESET", "Loaded 1080p verified broadcast frame with Safaricom overlay.", "text-emerald-300");
  } else if (scenario === 'LOW_OCCUPANCY') {
    previewImg.src = '/static/proofs/stream_low_occupancy_1794326696.jpg';
    fileNameSpan.innerText = "Preset: Sub-Threshold Frame (2.10% Occupancy - FAIL TEST)";
    logCreatorAgent("PRESET", "Loaded low occupancy frame for automated error remedy test.", "text-amber-300");
  } else if (scenario === 'VENUE') {
    previewImg.src = '/static/proofs/proof_default.jpg';
    fileNameSpan.innerText = "Preset: Gaming Lounge Venue Physical Banner Staging";
    logCreatorAgent("PRESET", "Loaded physical gaming lounge banner staging proof.", "text-sky-300");
  } else if (scenario === 'BRACKET') {
    previewImg.src = '/static/proofs/proof_default.jpg';
    fileNameSpan.innerText = "Preset: Tournament Bracket & Top 8 Leaderboard";
    logCreatorAgent("PRESET", "Loaded tournament bracket certification image.", "text-rose-300");
  }
}

// Drag & Drop / File Select Handlers
function setupDropZone() {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileDeliverableInput');

  if (!dropZone || !fileInput) return;

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('border-[#a78bfa]', 'bg-white/[0.04]');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('border-[#a78bfa]', 'bg-white/[0.04]');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('border-[#a78bfa]', 'bg-white/[0.04]');
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  });
}

function handleFileSelect(event) {
  if (event.target.files && event.target.files[0]) {
    processSelectedFile(event.target.files[0]);
  }
}

function processSelectedFile(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    selectedBase64Image = e.target.result;
    const previewBox = document.getElementById('uploadPreviewBox');
    const previewImg = document.getElementById('uploadPreviewImg');
    const uploadPrompt = document.getElementById('uploadPrompt');
    const fileNameSpan = document.getElementById('uploadFileNameSpan');

    uploadPrompt.classList.add('hidden');
    previewBox.classList.remove('hidden');
    previewImg.src = selectedBase64Image;
    fileNameSpan.innerText = `Uploaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;

    logCreatorAgent("UPLOAD", `Loaded local deliverable file: ${file.name}. Ready for Agent 3 verification.`, "text-purple-300 font-bold");
  };
  reader.readAsDataURL(file);
}

// =========================================================================
// SUBMIT DELIVERABLE & TRIGGER AGENT 3 MULTIMODAL VERIFICATION
// =========================================================================
async function triggerCreatorVerification() {
  if (!currentActiveProposal) {
    alert("Please accept an offer or select an active deal first!");
    return;
  }

  const milestoneId = document.getElementById('selectDeliverableMilestone').value;
  const deliverableType = document.getElementById('selectDeliverableType').value;
  const mediaUrl = document.getElementById('inputMediaUrl').value;
  const notes = document.getElementById('inputDeliverableNotes').value;

  const btn = document.getElementById('btnSubmitDeliverable');
  btn.disabled = true;
  btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i><span>Agent 3 Ingesting & Verifying Multimodal Proof...</span>`;

  logCreatorAgent("INGESTION", `Ingesting ${deliverableType} for Milestone ID: ${milestoneId}...`, "text-sky-300");
  logCreatorAgent("OPENCV", "Executing Computer Vision logo bounding box localization & screen area calculation...", "text-purple-400");
  logCreatorAgent("WHISPER", "Transcribing audio track: searching for brand phonetic keyphrases...", "text-emerald-400");
  logCreatorAgent("GUARDIAN", "Auditing live chat stream: Swahili & Sheng sentiment analysis...", "text-amber-400");

  const payload = {
    proposal_id: currentActiveProposal.id,
    milestone_id: milestoneId,
    creator_id: currentCreatorId,
    deliverable_type: deliverableType,
    media_url: mediaUrl || null,
    image_base64: selectedBase64Image || null,
    preset_scenario: selectedBase64Image ? null : selectedPresetScenario,
    notes: notes || "Submitted via Creator Portal",
    brand_name: currentActiveProposal.brand_name
  };

  try {
    const resp = await fetch('/api/v1/creator/deliverables/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.detail || "Verification failed");
    }

    const data = await resp.json();
    const cert = data.certificate;

    logCreatorAgent("CONSENSUS", `Multimodal Consensus: ${cert.verification_decision} (${cert.overall_confidence_percent}%)`, "text-emerald-300 font-extrabold");
    logCreatorAgent("PROOF SEAL", `Sealed Cryptographic Hash: ${cert.cryptographic_hash.substring(0, 24)}...`, "text-purple-300 font-mono");

    // Render Verification Result Card
    renderVerificationCertificate(cert, data.milestone);

    // Refresh Dashboard Data
    await loadCreatorDashboard(currentCreatorId);

  } catch (err) {
    console.error("Submission failed:", err);
    logCreatorAgent("ERROR", `Deliverable verification failed: ${err.message}`, "text-red-400");
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i><span>Post Deliverable & Trigger Agent 3 Multimodal Verification</span>`;
  }
}

// Render Verification Result & Cryptographic Proof Card
function renderVerificationCertificate(cert, milestone) {
  const box = document.getElementById('creatorVerificationResultBox');
  box.classList.remove('hidden');
  box.scrollIntoView({ behavior: 'smooth' });

  const isPass = cert.verification_decision === 'PASSED';
  const bbox = cert.bounding_box || { x: 60, y: 80, width: 280, height: 140 };

  box.innerHTML = `
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
      <div class="flex items-center space-x-2.5">
        <span class="w-3 h-3 rounded-full ${isPass ? 'bg-emerald-400' : 'bg-amber-400'} animate-ping"></span>
        <div>
          <span class="text-xs font-bold uppercase tracking-wider font-mono ${isPass ? 'text-emerald-400' : 'text-amber-400'}">
            Agent 3 Proof-of-Play Certificate Sealed
          </span>
          <h3 class="text-base font-extrabold text-white mt-0.5">Verification Result: ${cert.verification_decision}</h3>
        </div>
      </div>
      <div class="flex items-center space-x-2 text-xs font-mono">
        <span class="px-2.5 py-1 rounded-full ${isPass ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'} font-bold">
          Confidence: ${cert.overall_confidence_percent}%
        </span>
      </div>
    </div>

    <!-- Dual Layout: OpenCV Visual Evidence & Metrics Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
      
      <!-- OpenCV Visual Frame with glowing bounding box -->
      <div class="space-y-2">
        <span class="text-xs font-bold text-gray-300 flex items-center gap-1.5">
          <i class="fa-solid fa-video text-purple-400"></i>
          <span>OpenCV 5.0 Computer Vision Analysis Frame:</span>
        </span>
        <div class="relative rounded-2xl overflow-hidden border border-purple-500/40 shadow-xl bg-black">
          <img src="${cert.proof_image_url || '/static/proofs/stream_pass_1794389138.jpg'}?t=${Date.now()}" class="w-full object-cover max-h-56">
          <div class="absolute bottom-2 left-2 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono text-[#4fd8e6] border border-[#4fd8e6]/30">
            Detected Area: ${cert.logo_screen_ratio_percent}% (Threshold >= 3.5%)
          </div>
        </div>
      </div>

      <!-- Multimodal Consensus Breakdown -->
      <div class="space-y-3">
        <div class="p-3 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs font-mono space-y-1.5">
          <div class="flex justify-between">
            <span class="text-gray-400">Certificate ID:</span>
            <span class="text-white font-bold">${cert.certificate_id}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Logo Screen Ratio:</span>
            <span class="${cert.logo_screen_ratio_percent >= 3.5 ? 'text-emerald-400' : 'text-amber-400'} font-bold">${cert.logo_screen_ratio_percent}%</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Bounding Box:</span>
            <span class="text-purple-300">[${bbox.x}, ${bbox.y}, ${bbox.width}x${bbox.height}]</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Audio Verbal Mentions:</span>
            <span class="text-emerald-400 font-bold">${cert.verbal_slogans_detected ? cert.verbal_slogans_detected.length : 2} Detected</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Brand Safety Audit:</span>
            <span class="text-emerald-400 font-bold">${cert.brand_safety_status}</span>
          </div>
          <div class="pt-1 border-t border-white/[0.08] text-[10px] text-gray-500 truncate">
            SHA-256: ${cert.cryptographic_hash}
          </div>
        </div>

        ${isPass ? `
          <div class="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 space-y-2">
            <div class="font-bold flex items-center gap-1.5">
              <i class="fa-solid fa-circle-check"></i>
              <span>Milestone Verified! Funds Ready for Release</span>
            </div>
            <p class="text-[11px] text-emerald-400/90 leading-relaxed">
              Your stream deliverable has met all contractual sponsor conditions. You can now execute instant disbursement to your registered PayPal account with eTIMS BII fiscalization.
            </p>
            <button onclick="claimMilestonePayout('${currentActiveProposal.id}', '${milestone ? milestone.id : 'MLS-01'}')" class="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow flex items-center justify-center space-x-1.5 transition-all">
              <i class="fa-brands fa-paypal"></i>
              <span>Claim Payout (${formatMoney((milestone ? milestone.amount_usd : 207.69) * 0.95)} Net) &rarr;</span>
            </button>
          </div>
        ` : `
          <div class="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
            <span class="font-bold flex items-center gap-1.5"><i class="fa-solid fa-triangle-exclamation"></i> Action Required: Remedy Window (48h)</span>
            <p class="text-[11px] text-amber-200/90 leading-relaxed">Logo screen presence was below 3.5%. Please re-position your broadcast overlay and re-submit a fresh screenshot or stream clip.</p>
          </div>
        `}
      </div>

    </div>
  `;
}

// =========================================================================
// RENDER TAB 2: OFFER INBOX & BILATERAL AGREEMENTS
// =========================================================================
function renderOffersInbox(offers) {
  const container = document.getElementById('offersContainer');
  container.innerHTML = '';

  if (!offers || offers.length === 0) {
    container.innerHTML = `
      <div class="glass-panel p-8 rounded-3xl border border-white/[0.08] text-center space-y-3">
        <div class="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-gray-400">
          <i class="fa-solid fa-inbox text-xl"></i>
        </div>
        <h3 class="text-base font-bold text-white">No Pending Sponsorship Offers</h3>
        <p class="text-xs text-gray-400 max-w-md mx-auto">
          All dispatched offers have been accepted or processed. You will be notified when brands scout your profile.
        </p>
      </div>
    `;
    return;
  }

  offers.forEach(proposal => {
    const card = document.createElement('div');
    card.className = "glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] space-y-4 hover:border-purple-500/40 transition-all";

    card.innerHTML = `
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div>
          <div class="flex items-center space-x-2">
            <span class="text-xs font-mono font-bold text-purple-400 bg-purple-500/10 px-2.5 py-0.5 rounded-full border border-purple-500/30">
              OFFICIAL SPONSORSHIP PROPOSAL
            </span>
            <span class="text-xs text-gray-400 font-mono">${proposal.id}</span>
          </div>
          <h3 class="text-xl font-extrabold text-white mt-1">${proposal.brand_name}</h3>
        </div>
        <div class="text-left sm:text-right font-mono">
          <span class="text-xs text-gray-400 block font-medium">Guaranteed Net Creator Payout</span>
          <span class="text-2xl font-black text-emerald-400">${formatMoney(proposal.net_creator_disbursement_usd)}</span>
        </div>
      </div>

      <!-- Financial Reconciliation Schedule -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-xs font-mono">
        <div>
          <span class="text-gray-400 block text-[11px]">Total Campaign Budget:</span>
          <strong class="text-white">${formatMoney(proposal.total_budget_usd)}</strong>
        </div>
        <div>
          <span class="text-gray-400 block text-[11px]">Barbah Platform Fee (10%):</span>
          <strong class="text-gray-400">-${formatMoney(proposal.platform_fee_usd)}</strong>
        </div>
        <div>
          <span class="text-gray-400 block text-[11px]">KRA Section 16 WHT (5%):</span>
          <strong class="text-rose-400">-${formatMoney(proposal.withholding_tax_usd)}</strong>
        </div>
        <div>
          <span class="text-gray-400 block text-[11px]">PayPal Payout Rail:</span>
          <strong class="text-sky-400 font-bold">${currentCreator.paypal_email || 'Verified Personal Wallet'}</strong>
        </div>
      </div>

      <!-- Milestone Deliverables Table -->
      <div>
        <span class="text-xs font-bold text-gray-300 uppercase tracking-wider block mb-2">Milestone Deliverable Commitments:</span>
        <div class="space-y-2">
          ${proposal.milestones.map(m => `
            <div class="p-3 rounded-xl bg-white/[0.01] border border-white/[0.04] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
              <div>
                <span class="font-mono text-purple-400 font-bold">Phase ${m.milestone_number} (${m.percentage}%)</span>
                <span class="font-bold text-white ml-1.5">${m.title}</span>
                <p class="text-[11px] text-gray-400 mt-0.5">${m.description}</p>
              </div>
              <span class="font-mono font-bold text-emerald-400 whitespace-nowrap">${formatMoney(m.amount_usd * 0.95)} Net</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Legal & Tax Compliance Note -->
      <div class="p-3.5 rounded-xl bg-sky-950/20 border border-sky-500/30 text-xs text-sky-200 leading-relaxed">
        <strong>KRA Buyer-Initiated Invoicing (BII) Protection:</strong> By countersigning, you authorize Barbah Games to issue a certified Section 16 compliant electronic tax invoice on your behalf under Section 23A of the Tax Procedures Act. You are 100% tax-shielded with 5% WHT remitted directly to KRA.
      </div>

      <!-- 1-CLICK ACCEPT BUTTON -->
      <div class="pt-2 flex flex-col sm:flex-row gap-3">
        <button onclick="acceptSponsorshipOffer('${proposal.id}')" class="pill-btn flex-1 py-3.5 px-6 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-[#4fd8e6] hover:brightness-110 text-[#060814] font-black text-sm tracking-wide shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2">
          <i class="fa-solid fa-signature"></i>
          <span>1-Click Countersign & Accept Sponsorship Terms</span>
        </button>
        <button onclick="switchCreatorTab('chat')" class="pill-btn py-3.5 px-6 rounded-full bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-white font-bold text-xs transition-all flex items-center justify-center space-x-1.5">
          <i class="fa-solid fa-comments text-amber-400"></i>
          <span>Discuss Terms with Sponsor</span>
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

// 1-Click Offer Acceptance Handler
async function acceptSponsorshipOffer(proposalId) {
  logCreatorAgent("ACCEPTANCE", `Countersigning sponsorship proposal ${proposalId}...`, "text-emerald-300 font-bold");

  const payload = {
    proposal_id: proposalId,
    creator_id: currentCreatorId,
    accepted_terms: true,
    countersigned_by: currentCreator.name,
    confirmed_paypal_email: currentCreator.paypal_email,
    confirmed_mpesa_phone: currentCreator.mpesa_phone,
    notes: "Accepted via Creator 1-Click Portal"
  };

  try {
    const resp = await fetch(`/api/v1/creator/offers/${proposalId}/accept`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.detail || "Acceptance failed");
    }

    const updatedProposal = await resp.json();
    currentActiveProposal = updatedProposal;

    logCreatorAgent("ACCEPTANCE", `Agreement active! Deal status: ${updatedProposal.status}. Milestone 1 deliverable studio unlocked!`, "text-emerald-400 font-black");

    // Refresh and auto-switch to active deals tab
    await loadCreatorDashboard(currentCreatorId);
    switchCreatorTab('deals');

  } catch (err) {
    console.error("Acceptance failed:", err);
    logCreatorAgent("ERROR", `Failed to accept offer: ${err.message}`, "text-red-400");
  }
}

// =========================================================================
// RENDER TAB 3: EARNINGS & PAYPAL / M-PESA VAULT
// =========================================================================
function renderEarningsDashboard(data) {
  const container = document.getElementById('earningsDashboardDetails');
  const c = data.creator;

  container.innerHTML = `
    <!-- Earnings KPI Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      
      <div class="glass-panel p-5 rounded-3xl border border-white/[0.08] space-y-1">
        <span class="text-xs text-gray-400 uppercase tracking-wider font-mono font-medium">Guaranteed Milestone Ledger Funds</span>
        <div class="text-2xl font-black text-[#4fd8e6] font-mono">${formatMoney(data.ledger_escrow_usd)}</div>
        <span class="text-[11px] text-gray-500">Locked in PayPal Orders v2 multiparty ledger</span>
      </div>

      <div class="glass-panel p-5 rounded-3xl border border-white/[0.08] space-y-1">
        <span class="text-xs text-gray-400 uppercase tracking-wider font-mono font-medium">Total Liquid Cleared Cash</span>
        <div class="text-2xl font-black text-emerald-400 font-mono">${formatMoney(data.total_earned_usd)}</div>
        <span class="text-[11px] text-emerald-500/80">Disbursed directly to PayPal</span>
      </div>

      <div class="glass-panel p-5 rounded-3xl border border-white/[0.08] space-y-1">
        <span class="text-xs text-gray-400 uppercase tracking-wider font-mono font-medium">Statutory 5% WHT Remitted</span>
        <div class="text-2xl font-black text-rose-400 font-mono">${formatMoney(data.total_earned_usd * 0.05 / 0.95)}</div>
        <span class="text-[11px] text-gray-500">KRA Section 16 certificates issued</span>
      </div>

    </div>

    <!-- Dual Payment Rails: PayPal + M-Pesa -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <!-- Rail 1: PayPal Orders v2 & Payouts Engine -->
      <div class="glass-panel p-6 rounded-3xl border border-white/[0.08] space-y-4">
        <div class="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div class="flex items-center space-x-2.5">
            <i class="fa-brands fa-paypal text-sky-400 text-xl"></i>
            <div>
              <h3 class="font-bold text-white text-sm">PayPal Payout Destination Wallet</h3>
              <p class="text-[11px] text-gray-400">Milestone disbursements arrive directly into your PayPal account</p>
            </div>
          </div>
          <span class="text-[10px] font-mono bg-sky-500/10 text-sky-300 px-2 py-0.5 rounded-full border border-sky-500/30">PAYPAL LIVE API</span>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Registered PayPal Email</label>
            <div class="flex gap-2">
              <input type="email" id="inputWalletPayPalEmail" value="${c.paypal_email || ''}" class="flex-1 bg-[#080d1e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-sky-400">
              <button onclick="updatePaymentWallet()" class="pill-btn px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-all shadow">
                Save
              </button>
            </div>
          </div>
          <p class="text-[11px] text-gray-500">
            For testing: You can enter your personal PayPal email to receive live payouts from the hackathon sandbox.
          </p>
        </div>
      </div>

      <!-- Rail 2: Instant M-Pesa Mobile Money Off-Ramp -->
      <div class="glass-panel p-6 rounded-3xl border border-white/[0.08] space-y-4">
        <div class="flex items-center justify-between border-b border-white/[0.08] pb-3">
          <div class="flex items-center space-x-2.5">
            <div class="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs font-mono">
              MP
            </div>
            <div>
              <h3 class="font-bold text-white text-sm">Kenyan M-Pesa Mobile Off-Ramp</h3>
              <p class="text-[11px] text-gray-400">Convert USD payouts to KES instant mobile money via Safaricom/Equity bridge</p>
            </div>
          </div>
          <span class="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-bold">M-PESA READY</span>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Registered Safaricom M-Pesa Number</label>
            <div class="flex gap-2">
              <input type="text" id="inputWalletMpesaPhone" value="${c.mpesa_phone || '+254712345678'}" class="flex-1 bg-[#080d1e] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-400">
              <button onclick="updatePaymentWallet()" class="pill-btn px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all shadow">
                Save
              </button>
            </div>
          </div>
          <div class="flex justify-between items-center text-[11px] font-mono text-gray-400 pt-1">
            <span>Fx Conversion Rate:</span>
            <span class="text-white font-bold">1 USD = ${USD_TO_KES_RATE} KES</span>
          </div>
        </div>
      </div>

    </div>
  `;
}

// Update payment wallet handler
async function updatePaymentWallet() {
  const paypalEmail = document.getElementById('inputWalletPayPalEmail').value;
  const mpesaPhone = document.getElementById('inputWalletMpesaPhone').value;

  try {
    const resp = await fetch(`/api/v1/creator/profile/${currentCreatorId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paypal_email: paypalEmail,
        mpesa_phone: mpesaPhone
      })
    });
    if (!resp.ok) throw new Error("Failed to update wallet");
    logCreatorAgent("WALLET", `Saved payout destinations: PayPal: ${paypalEmail} | M-Pesa: ${mpesaPhone}`, "text-emerald-300 font-bold");
    await loadCreatorDashboard(currentCreatorId);
    alert("Payment wallets updated successfully!");
  } catch (err) {
    alert("Error updating wallet: " + err.message);
  }
}

// Claim Milestone Payout Execution
async function claimMilestonePayout(proposalId, milestoneId) {
  logCreatorAgent("PAYOUT", `Triggering Agent 4 disbursement for Milestone ${milestoneId}...`, "text-sky-300");

  try {
    const resp = await fetch(`/api/v1/creator/payout/${proposalId}/${milestoneId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paypal_email: currentCreator.paypal_email
      })
    });

    if (!resp.ok) {
      const err = await resp.json();
      throw new Error(err.detail || "Payout failed");
    }

    const data = await resp.json();
    logCreatorAgent("PAYOUT SUCCESS", `Disbursed $${data.net_payout_usd} USD (KES ${data.net_payout_kes.toLocaleString()}) to PayPal!`, "text-emerald-400 font-black");

    alert(`Payout Successful!\n\nDisbursed: $${data.net_payout_usd} USD (KES ${data.net_payout_kes.toLocaleString()})\nRecipient: ${data.paypal_destination}\neTIMS BII Invoice Generated with 5% WHT deducted.`);

    await loadCreatorDashboard(currentCreatorId);
  } catch (err) {
    console.error("Payout error:", err);
    logCreatorAgent("ERROR", `Payout failed: ${err.message}`, "text-red-400");
    alert("Payout error: " + err.message);
  }
}

// =========================================================================
// RENDER TAB 4: eTIMS BII TAX VAULT
// =========================================================================
async function renderTaxVault(data) {
  const container = document.getElementById('creatorTaxVaultContainer');
  const c = data.creator;

  // Fetch creator invoices
  let invoices = [];
  try {
    const resp = await fetch(`/api/v1/creator/invoices/${c.id}`);
    if (resp.ok) invoices = await resp.json();
  } catch (e) {
    console.error(e);
  }

  container.innerHTML = `
    <!-- Educational Section 16 & BII Explainer -->
    <div class="glass-panel p-6 sm:p-7 rounded-3xl border border-red-500/30 bg-red-950/10 space-y-3">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-2xl bg-red-500/20 text-rose-400 flex items-center justify-center text-lg">
          <i class="fa-solid fa-shield-halved"></i>
        </div>
        <div>
          <h3 class="text-base font-bold text-white">How Barbah Solves the KRA Section 16 Dilemma for Grassroots Gamers</h3>
          <p class="text-xs text-gray-300">Buyer-Initiated Invoicing (BII) under Section 23A of the Kenya Tax Procedures Act</p>
        </div>
      </div>
      <p class="text-xs text-gray-400 leading-relaxed">
        Under Section 16(1)(c) of the Kenya Income Tax Act, corporate brands cannot legally claim a tax deduction for sponsorship payments unless supported by an official electronic tax invoice. Informal youth creators cannot afford enterprise ETR/VSCU hardware. <strong>Barbah SponsorPlay automatically issues a KRA-compliant Buyer-Initiated Invoice (BII) on your behalf</strong>, remits the mandatory 5% Withholding Tax directly to KRA, and sends an official QR code receipt to the sponsor.
      </p>
    </div>

    <!-- Invoices List -->
    <div class="space-y-4">
      <h3 class="text-sm font-bold text-white uppercase tracking-wider font-mono">Issued Fiscal Invoices & Withholding Tax Slips</h3>
      <div id="creatorInvoicesGrid" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        ${invoices.length > 0 ? invoices.map(inv => `
          <div class="glass-card p-5 rounded-2xl border border-white/[0.08] space-y-3 font-mono text-xs">
            <div class="flex justify-between items-start border-b border-white/[0.08] pb-2">
              <div>
                <span class="text-[10px] text-gray-400 block">${inv.invoice_type}</span>
                <span class="font-bold text-white text-sm">${inv.cu_invoice_number}</span>
              </div>
              <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-500/40">KRA COMPLIANT</span>
            </div>
            <div class="space-y-1 text-gray-300 text-[11px]">
              <div>Buyer: <strong class="text-white">${inv.buyer_name}</strong> (${inv.buyer_pin})</div>
              <div>Supplier: <strong class="text-white">${inv.supplier_name}</strong> (${inv.supplier_pin})</div>
              <div>Taxable Amount: <span class="text-emerald-400">KES ${inv.taxable_amount_kes.toLocaleString()}</span></div>
              <div>5% WHT Remitted: <span class="text-rose-400">KES ${inv.withholding_tax_kes.toLocaleString()}</span></div>
            </div>
            <div class="pt-2 flex justify-between items-center text-[10px] text-gray-500 border-t border-white/[0.04]">
              <span>Date: ${inv.invoice_date}</span>
              <a href="${inv.qr_code_url}" target="_blank" class="text-purple-400 underline font-bold">Verify KRA QR Code</a>
            </div>
          </div>
        `).join('') : `
          <div class="col-span-2 p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center text-xs text-gray-500">
            No eTIMS invoices generated yet. Invoices are automatically issued when your milestone deliverables are verified and paid!
          </div>
        `}
      </div>
    </div>
  `;
}

// =========================================================================
// RENDER TAB 5: BILATERAL DEAL ROOM & CHAT
// =========================================================================
async function loadChatMessages(proposalId) {
  try {
    const resp = await fetch(`/api/v1/creator/collaboration/${proposalId}`);
    if (!resp.ok) return;
    const messages = await resp.json();
    renderChatMessages(messages);
  } catch (e) {
    console.error(e);
  }
}

function renderChatMessages(messages) {
  const container = document.getElementById('chatMessagesContainer');
  if (!container) return;
  container.innerHTML = '';

  messages.forEach(msg => {
    const el = document.createElement('div');
    const isCreator = msg.sender_type === 'CREATOR';
    const isAgent = msg.sender_type === 'AGENT';

    let bubbleClass = isCreator 
      ? 'bg-purple-950/40 border-purple-500/40 text-purple-200 ml-auto max-w-lg' 
      : (isAgent ? 'bg-sky-950/40 border-sky-500/30 text-sky-200 max-w-lg' : 'bg-gray-900 border-gray-700 text-gray-200 max-w-lg');

    el.className = `p-3 rounded-2xl border ${bubbleClass} text-xs space-y-1`;
    el.innerHTML = `
      <div class="flex items-center justify-between text-[10px] font-mono opacity-70">
        <span class="font-bold">${msg.sender_name}</span>
        <span>${new Date(msg.timestamp).toLocaleTimeString()}</span>
      </div>
      <p class="leading-relaxed">${msg.content}</p>
      ${msg.attachment_url ? `
        <div class="pt-1.5">
          <img src="${msg.attachment_url}" class="max-h-36 rounded-lg border border-white/10">
        </div>
      ` : ''}
    `;
    container.appendChild(el);
  });
  container.scrollTop = container.scrollHeight;
}

async function sendChatMessage() {
  const input = document.getElementById('inputChatMessage');
  const text = input.value.trim();
  if (!text || !currentActiveProposal) return;

  try {
    const resp = await fetch(`/api/v1/creator/collaboration/${currentActiveProposal.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_type: "CREATOR",
        sender_name: `${currentCreator.name} (@${currentCreator.gamer_tag})`,
        content: text
      })
    });
    if (resp.ok) {
      input.value = '';
      await loadChatMessages(currentActiveProposal.id);
    }
  } catch (e) {
    console.error(e);
  }
}

// =========================================================================
// RENDER TAB 6: SKILLS PASSPORT & REPUTATION
// =========================================================================
function renderSkillsPassport(passport, creator) {
  const container = document.getElementById('passportDetailsContainer');

  container.innerHTML = `
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- Passport Credentials Card -->
      <div class="md:col-span-2 glass-panel p-6 sm:p-7 rounded-3xl border border-white/[0.08] space-y-5">
        <div class="flex items-center justify-between border-b border-white/[0.08] pb-4">
          <div class="flex items-center space-x-3">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-[#060814] flex items-center justify-center text-xl font-black font-mono">
              BP
            </div>
            <div>
              <span class="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">Verifiable Creator Passport</span>
              <h3 class="text-lg font-black text-white">${creator.name}</h3>
            </div>
          </div>
          <span class="text-xs font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">
            ${passport.tier}
          </span>
        </div>

        <!-- Badges Grid -->
        <div>
          <span class="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-3">Earned Cryptographic Badges:</span>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${passport.badges.map(b => `
              <div class="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex items-center space-x-3 text-xs">
                <div class="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center text-sm">
                  <i class="fa-solid ${b.icon}"></i>
                </div>
                <div>
                  <h4 class="font-bold text-white text-xs">${b.name}</h4>
                  <span class="text-[10px] text-gray-400">Issuer: ${b.issuer}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="p-3 rounded-xl bg-white/[0.01] border border-white/[0.06] text-xs font-mono text-gray-400 flex justify-between items-center">
          <span>Passport Cryptographic Seal:</span>
          <span class="text-emerald-400 font-bold">${passport.passport_hash}</span>
        </div>
      </div>

      <!-- Trust Metrics Column -->
      <div class="glass-panel p-6 rounded-3xl border border-white/[0.08] space-y-4">
        <h3 class="text-sm font-bold text-white uppercase tracking-wider font-mono">Credibility Score</h3>
        <div class="text-center py-4">
          <div class="text-5xl font-black text-emerald-400 font-mono">${passport.credibility_index}%</div>
          <span class="text-xs text-gray-400 mt-1 block font-medium">Algorithmic Trust Rating</span>
        </div>

        <div class="space-y-2 text-xs font-mono border-t border-white/[0.08] pt-3 text-gray-300">
          <div class="flex justify-between">
            <span class="text-gray-400">Completed Campaigns:</span>
            <span class="text-white font-bold">${passport.total_campaigns_completed}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Proof-of-Play Certs:</span>
            <span class="text-purple-300 font-bold">${passport.verified_certificates_count}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">On-Time Delivery:</span>
            <span class="text-emerald-400 font-bold">100%</span>
          </div>
        </div>
      </div>

    </div>
  `;
}

// =========================================================================
// RENDER TAB 7: PROFILE & REQUIREMENTS SETTINGS
// =========================================================================
function renderProfileSettings(c) {
  const container = document.getElementById('profileSettingsContainer');

  container.innerHTML = `
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Gamer Tag / Brand Name</label>
        <input type="text" id="profGamerTag" value="${c.gamer_tag}" class="w-full bg-[#080d1e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-400">
      </div>
      <div>
        <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Primary Game / Title</label>
        <input type="text" id="profPrimaryGame" value="${c.primary_game}" class="w-full bg-[#080d1e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400">
      </div>
    </div>

    <div>
      <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Stream Channel URL</label>
      <input type="text" id="profChannelUrl" value="${c.channel_url}" class="w-full bg-[#080d1e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-400">
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Base Sponsorship Rate (USD)</label>
        <input type="number" id="profBaseRate" value="${c.base_rate_usd}" class="w-full bg-[#080d1e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-400">
      </div>
      <div>
        <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Personal / Business KRA PIN</label>
        <input type="text" id="profKraPin" value="${c.kra_pin || 'A019888888K'}" class="w-full bg-[#080d1e] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-purple-400">
      </div>
    </div>

    <div>
      <label class="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Creator Bio & Community Identity</label>
      <textarea id="profBio" rows="3" class="w-full bg-[#080d1e] border border-white/10 rounded-xl p-3.5 text-xs text-white leading-relaxed focus:outline-none focus:border-purple-400">${c.bio}</textarea>
    </div>

    <div class="pt-2">
      <button onclick="saveFullProfileSettings()" class="pill-btn w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:brightness-110 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center space-x-2">
        <i class="fa-solid fa-floppy-disk"></i>
        <span>Save Creator Requirements & Profile Settings</span>
      </button>
    </div>
  `;
}

async function saveFullProfileSettings() {
  const payload = {
    channel_url: document.getElementById('profChannelUrl').value,
    base_rate_usd: parseFloat(document.getElementById('profBaseRate').value) || 200.0,
    bio: document.getElementById('profBio').value,
    kra_pin: document.getElementById('profKraPin').value
  };

  try {
    const resp = await fetch(`/api/v1/creator/profile/${currentCreatorId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error("Failed to save profile");
    logCreatorAgent("PROFILE", "Updated creator requirements and rate card.", "text-emerald-300 font-bold");
    alert("Profile settings saved successfully!");
    await loadCreatorDashboard(currentCreatorId);
  } catch (e) {
    alert("Error saving profile: " + e.message);
  }
}

// =========================================================================
// THREE.JS INTERACTIVE 3D BACKGROUND (CYBER-CONSTELLATION)
// =========================================================================
function initThreeCanvas() {
  const canvas = document.getElementById('threeCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 4, 30);

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Holographic 3D Arena Mesh (Violet & Soft Cyan for Creator theme)
  const coreGeometry = new THREE.IcosahedronGeometry(9, 2);
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: 0xa78bfa,
    wireframe: true,
    transparent: true,
    opacity: 0.18
  });
  const arenaCore = new THREE.Mesh(coreGeometry, coreMaterial);
  scene.add(arenaCore);

  const ringGeom = new THREE.TorusGeometry(15, 0.07, 16, 120);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x4fd8e6, transparent: true, opacity: 0.25 });
  const ringMesh = new THREE.Mesh(ringGeom, ringMat);
  ringMesh.rotation.x = Math.PI / 3;
  scene.add(ringMesh);

  // Background Particles
  const particlesCount = 200;
  const positions = new Float32Array(particlesCount * 3);
  for (let i = 0; i < particlesCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 80;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xa78bfa,
    size: 0.35,
    transparent: true,
    opacity: 0.6
  });
  const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particleSystem);

  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX - window.innerWidth / 2) * 0.0004;
    mouseY = (e.clientY - window.innerHeight / 2) * 0.0004;
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  function animate() {
    requestAnimationFrame(animate);
    arenaCore.rotation.y += 0.002;
    arenaCore.rotation.x += 0.001;
    ringMesh.rotation.z += 0.003;
    particleSystem.rotation.y -= 0.0004;

    camera.position.x += (mouseX * 15 - camera.position.x) * 0.05;
    camera.position.y += (4 - mouseY * 10 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);
  }
  animate();
}
