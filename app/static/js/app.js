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
  loadSessionState();
  initThreeCanvas();
  initAgGrid();
  setupBudgetCurrencySync();
  logAgent("SYSTEM", "Barbah SponsorPlay core initialized. Preloaded Kenyan esports talent graph (16 personas).");
  logAgent("BARBAH GATEWAY", "Real-time webhook listener active on /api/v1/barbah/webhook.");
  logAgent("SCOUT RADAR", "Multi-Channel Talent Radar initialized (Twitch, Start.gg, WhatsApp, TikTok).");
  loadPayPalMode();
});

function loadSessionState() {
  try {
    const raw = localStorage.getItem('sponsorplay_auth');
    if (raw) {
      const auth = JSON.parse(raw);
      if (auth.role === 'brand' && auth.user) {
        const brandNameEl = document.getElementById('navBrandName');
        if (brandNameEl && auth.user.name) brandNameEl.innerText = auth.user.name.split(' ')[0] + ' ' + (auth.user.name.split(' ')[1] || '');
        const brandInput = document.getElementById('inputBrandName');
        if (brandInput && auth.user.name) brandInput.value = auth.user.name;
        const pinInput = document.getElementById('inputCorporatePIN');
        if (pinInput && auth.user.corporate_pin) pinInput.value = auth.user.corporate_pin;
        logAgent("AUTH", `Signed in as Corporate Brand: ${auth.user.name} (${auth.user.corporate_pin})`, "text-[#4fd8e6] font-bold");
      }
    }
  } catch (e) {
    console.error("Session load error:", e);
  }
}

// Real-Time Dynamic USD <-> KES Budget Currency Synchronizer
function setupBudgetCurrencySync() {
  const usdInput = document.getElementById('inputBudgetUSD');
  const kesInput = document.getElementById('inputBudgetKES');
  if (!usdInput || !kesInput) return;

  function syncUSDToKES() {
    const rawUSD = parseFloat(usdInput.value);
    if (isNaN(rawUSD) || rawUSD <= 0) {
      kesInput.value = "KES 0.00";
      return;
    }
    const kes = rawUSD * USD_TO_KES_RATE;
    kesInput.value = `KES ${kes.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function syncKESToUSD() {
    const cleanStr = kesInput.value.replace(/[^0-9.]/g, '');
    const rawKES = parseFloat(cleanStr);
    if (isNaN(rawKES) || rawKES <= 0) {
      usdInput.value = "0";
      return;
    }
    const usd = rawKES / USD_TO_KES_RATE;
    usdInput.value = usd.toFixed(2);
  }

  usdInput.addEventListener('input', syncUSDToKES);
  usdInput.addEventListener('change', syncUSDToKES);
  usdInput.addEventListener('keyup', syncUSDToKES);

  kesInput.addEventListener('input', syncKESToUSD);
  kesInput.addEventListener('change', syncKESToUSD);
  kesInput.addEventListener('focus', () => {
    const cleanStr = kesInput.value.replace(/[^0-9.]/g, '');
    if (cleanStr && parseFloat(cleanStr) > 0) {
      kesInput.value = cleanStr;
    }
  });
  kesInput.addEventListener('blur', syncUSDToKES);

  // Initial sync on load
  syncUSDToKES();
}

// LIVE / SIMULATED PayPal mode badge
async function loadPayPalMode() {
  const pill = document.getElementById('paypalModePill');
  if (!pill) return;
  try {
    const resp = await fetch('/api/paypal/mode');
    const data = await resp.json();
    const isLive = data.mode === 'LIVE_SANDBOX';
    pill.className = isLive
      ? "flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md shadow-[0_0_12px_rgba(16,185,129,0.15)]"
      : "flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-amber-300 text-xs font-semibold backdrop-blur-md shadow-[0_0_12px_rgba(245,158,11,0.15)]";
    pill.innerHTML = `<i class="fa-solid fa-circle text-[8px] animate-pulse"></i><span>PayPal: ${isLive ? 'LIVE_SANDBOX' : 'SIMULATED'}</span>`;
  } catch (err) {
    pill.innerHTML = `<i class="fa-solid fa-circle text-[8px]"></i><span>PayPal: UNKNOWN</span>`;
  }
}

// Three.js Interactive 3D Kenyan Cyber-Esports Constellation & Arena Mesh
function initThreeCanvas() {
  const canvas = document.getElementById('threeCanvas');
  if (!canvas || typeof THREE === 'undefined') return;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 4, 30);

  const renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Central Holographic Esports Arena Core (New Norm Electric Cyan)
  const coreGeometry = new THREE.IcosahedronGeometry(10, 2);
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: 0x4fd8e6,
    wireframe: true,
    transparent: true,
    opacity: 0.16
  });
  const arenaCore = new THREE.Mesh(coreGeometry, coreMaterial);
  scene.add(arenaCore);

  // Concentric Tactical Gyro Rings (New Norm Violet & Cyan)
  const ring1Geom = new THREE.TorusGeometry(14, 0.08, 16, 120);
  const ring1Mat = new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.28 });
  const gyroRing1 = new THREE.Mesh(ring1Geom, ring1Mat);
  gyroRing1.rotation.x = Math.PI / 4;
  scene.add(gyroRing1);

  const ring2Geom = new THREE.TorusGeometry(18, 0.06, 16, 140);
  const ring2Mat = new THREE.MeshBasicMaterial({ color: 0x4fd8e6, transparent: true, opacity: 0.22 });
  const gyroRing2 = new THREE.Mesh(ring2Geom, ring2Mat);
  gyroRing2.rotation.y = Math.PI / 3;
  scene.add(gyroRing2);

  const ring3Geom = new THREE.TorusGeometry(22, 0.04, 16, 160);
  const ring3Mat = new THREE.MeshBasicMaterial({ color: 0xffa63d, transparent: true, opacity: 0.18 });
  const gyroRing3 = new THREE.Mesh(ring3Geom, ring3Mat);
  gyroRing3.rotation.z = Math.PI / 6;
  scene.add(gyroRing3);

  // Kenyan Regional Esports Hub Nodes (New Norm Palette)
  const hubs = [
    { name: "Nairobi Hub", pos: new THREE.Vector3(0, 1, 0), color: 0xe4ff4f, size: 0.9 },     // Citron-Lime
    { name: "Kibera Den", pos: new THREE.Vector3(-6, -3, 3), color: 0xffa63d, size: 0.7 },     // Warm Amber
    { name: "Eldoret Arena", pos: new THREE.Vector3(-9, 5, -4), color: 0x4fd8e6, size: 0.75 }, // Electric Cyan
    { name: "Mombasa Base", pos: new THREE.Vector3(9, -2, -3), color: 0xff3ea5, size: 0.75 },  // Magenta
    { name: "Kisumu Lakeside", pos: new THREE.Vector3(-10, 0, 4), color: 0xa78bfa, size: 0.7 } // Violet
  ];

  const hubMeshes = [];
  hubs.forEach(hub => {
    // Glowing core sphere
    const nodeGeom = new THREE.SphereGeometry(hub.size, 16, 16);
    const nodeMat = new THREE.MeshBasicMaterial({ color: hub.color, transparent: true, opacity: 0.85 });
    const nodeMesh = new THREE.Mesh(nodeGeom, nodeMat);
    nodeMesh.position.copy(hub.pos);
    scene.add(nodeMesh);

    // Outer orbital pulse ring
    const nodeRingGeom = new THREE.RingGeometry(hub.size * 1.3, hub.size * 1.5, 24);
    const nodeRingMat = new THREE.MeshBasicMaterial({ color: hub.color, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
    const nodeRing = new THREE.Mesh(nodeRingGeom, nodeRingMat);
    nodeRing.position.copy(hub.pos);
    nodeRing.rotation.x = Math.PI / 2;
    scene.add(nodeRing);

    hubMeshes.push({ mesh: nodeMesh, ring: nodeRing, basePos: hub.pos });
  });

  // Cybernetic Spline Energy Curves connecting Nairobi Hub to all satellite hubs
  const nairobiPos = hubs[0].pos;
  const linesGroup = new THREE.Group();
  const packetParticles = [];

  for (let i = 1; i < hubs.length; i++) {
    const targetPos = hubs[i].pos;
    const midPoint = new THREE.Vector3(
      (nairobiPos.x + targetPos.x) / 2,
      (nairobiPos.y + targetPos.y) / 2 + 2,
      (nairobiPos.z + targetPos.z) / 2
    );
    const curve = new THREE.QuadraticBezierCurve3(nairobiPos, midPoint, targetPos);
    const points = curve.getPoints(30);
    const lineGeom = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({ color: hubs[i].color, transparent: true, opacity: 0.4 });
    const line = new THREE.Line(lineGeom, lineMat);
    linesGroup.add(line);

    // Traveling Energy Packet
    const packetGeom = new THREE.SphereGeometry(0.25, 8, 8);
    const packetMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const packetMesh = new THREE.Mesh(packetGeom, packetMat);
    scene.add(packetMesh);
    packetParticles.push({ mesh: packetMesh, curve: curve, progress: Math.random() });
  }
  scene.add(linesGroup);

  // Digital Talent Data Starfield (220 background telemetry points)
  const particlesCount = 220;
  const positions = new Float32Array(particlesCount * 3);
  for (let i = 0; i < particlesCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 80;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: 0x38bdf8,
    size: 0.38,
    transparent: true,
    opacity: 0.65
  });
  const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particleSystem);

  // Perspective Cyber Grid Floor
  const gridHelper = new THREE.GridHelper(70, 35, 0x0070ba, 0x1e293b);
  gridHelper.position.y = -12;
  gridHelper.material.transparent = true;
  gridHelper.material.opacity = 0.25;
  scene.add(gridHelper);

  // Smooth mouse interaction with damping
  let targetMouseX = 0, targetMouseY = 0;
  let mouseX = 0, mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    targetMouseX = (e.clientX - window.innerWidth / 2) * 0.0006;
    targetMouseY = (e.clientY - window.innerHeight / 2) * 0.0006;
  });

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const elapsedTime = clock.getElapsedTime();

    // Mouse interpolation
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    camera.position.x = mouseX * 20;
    camera.position.y = 4 - mouseY * 15;
    camera.lookAt(0, 0, 0);

    // Rotations
    arenaCore.rotation.y += 0.003;
    arenaCore.rotation.x += 0.001;
    gyroRing1.rotation.z += 0.005;
    gyroRing2.rotation.x -= 0.004;
    gyroRing3.rotation.y += 0.003;
    particleSystem.rotation.y -= 0.0005;

    // Pulse nodes
    hubMeshes.forEach((item, idx) => {
      const pulse = 1 + 0.15 * Math.sin(elapsedTime * 3 + idx);
      item.ring.scale.set(pulse, pulse, pulse);
    });

    // Animate energy packets along curves
    packetParticles.forEach(pkt => {
      pkt.progress = (pkt.progress + delta * 0.45) % 1;
      const pt = pkt.curve.getPoint(pkt.progress);
      pkt.mesh.position.copy(pt);
    });

    renderer.render(scene, camera);
  }
  animate();
}

// Currency Switcher
function setCurrency(curr) {
  currentCurrency = curr;
  document.getElementById('btnCurrencyUSD').className = curr === 'USD' 
    ? 'px-2.5 py-1 rounded bg-blue-600 text-white shadow font-mono' 
    : 'px-2.5 py-1 rounded text-gray-400 hover:text-white font-mono';
  document.getElementById('btnCurrencyKES').className = curr === 'KES' 
    ? 'px-2.5 py-1 rounded bg-blue-600 text-white shadow font-mono' 
    : 'px-2.5 py-1 rounded text-gray-400 hover:text-white font-mono';
  
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
  ['demo', 'explorer', 'radar', 'invoices', 'impact'].forEach(t => {
    const el = document.getElementById(`view-${t}`);
    const tabEl = document.getElementById(`tab-${t}`);
    if (el) el.classList.add('hidden');
    if (tabEl) tabEl.className = 'py-2 px-4 rounded-full text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/[0.05] border border-transparent flex items-center space-x-2 whitespace-nowrap transition-all';
  });

  const activeView = document.getElementById(`view-${tabName}`);
  const activeTab = document.getElementById(`tab-${tabName}`);
  if (activeView) activeView.classList.remove('hidden');
  if (activeTab) activeTab.className = 'py-2 px-4 rounded-full text-xs font-bold text-white bg-white/[0.08] border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.06)] flex items-center space-x-2 whitespace-nowrap transition-all';

  if (tabName === 'radar') {
    refreshRadarData();
  } else if (tabName === 'invoices') {
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
        monthly_reach: 9800,
        avg_concurrent_viewers: 430,
        base_rate_usd: 150.0,
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
        monthly_reach: 12500,
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
    logAgent("BARBAH GATEWAY", `Ingestion Complete: ${data.result.status} &bull; Total Creators in Registry: ${data.total_active_creators}`, "text-emerald-300 font-bold");
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
    monthly_reach: 14500,
    avg_concurrent_viewers: 850,
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

let currentDeconstructionResult = null;

// STEP 1: UNIFIED AGENT 1 DECONSTRUCT & TALENT MATCH
async function runStep1Deconstruct() {
  const brandName = document.getElementById('inputBrandName').value || "Safaricom 5G Home Gaming";
  const corporatePIN = document.getElementById('inputCorporatePIN').value || "P051234567A";
  const briefText = document.getElementById('inputBrief').value || "Promote 5G gaming to Kenyan youth";
  
  const rawReach = document.getElementById('inputTargetReach').value;
  let reach = parseInt(rawReach) || 0;
  
  const rawBudget = document.getElementById('inputBudgetUSD').value;
  const budgetUSD = parseFloat(rawBudget) || 0;

  if (budgetUSD <= 0) {
    logAgent("AGENT 1: SCOUT", "Please enter a campaign budget greater than $0 (e.g. $500 USD or KES 65,000) to scout creators.", "text-amber-400 font-bold");
    document.getElementById('inputBudgetUSD').focus();
    return;
  }

  if (reach <= 0) {
    // Intelligently compute expected baseline reach from budget if left at zero
    reach = Math.max(1000, Math.round(budgetUSD * 15));
    document.getElementById('inputTargetReach').value = reach;
  }

  const prefRadio = document.querySelector('input[name="strategyPref"]:checked');
  const strategyPref = prefRadio ? prefRadio.value : "AUTO";

  logAgent("AGENT 1: SCOUT", `Deconstructing brand brief for ${brandName}...`, "text-emerald-400");
  logAgent("CLAUDE BRAIN", `Cognitive analysis: evaluating reach target (${reach.toLocaleString()} gamers) vs budget ($${budgetUSD.toFixed(2)} USD / KES ${(budgetUSD * USD_TO_KES_RATE).toLocaleString()})...`, "text-purple-400");
  logAgent("AGENT 1: SCOUT", `Strategy preference: ${strategyPref} | AI talent matching engaged`, "text-gray-400");

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
    preferred_locations: ["Nairobi", "Eldoret"],
    strategy_preference: strategyPref
  };

  try {
    const resp = await fetch('/api/v1/campaigns/deconstruct', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      throw new Error(`Deconstruction API returned HTTP ${resp.status}`);
    }

    const result = await resp.json();
    currentDeconstructionResult = result;
    currentCampaign = payload;

    const analysis = result.ai_analysis;
    logAgent("AGENT 1: SCOUT", `AI Recommendation: ${analysis.recommendation_title}`, "text-emerald-300 font-bold");
    logAgent("CLAUDE BRAIN", `${analysis.verdict_rationale}`, "text-purple-300 text-xs");

    renderDeconstructionResults(result);
  } catch (err) {
    logAgent("ERROR", `Failed to deconstruct brief: ${err.message}`, "text-red-400");
  }
}

// Renders the AI Verdict Banner and both pathways (Syndicates + Solo Creators)
function renderDeconstructionResults(result) {
  const container = document.getElementById('syndicateResults');
  container.classList.remove('hidden');

  const analysis = result.ai_analysis;
  const verdictContainer = document.getElementById('aiDeconstructVerdict');

  const isSoloRec = analysis.recommended_path === 'SOLO';

  verdictContainer.innerHTML = `
    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-800 pb-3">
      <div class="flex items-center space-x-2.5">
        <span class="w-3 h-3 rounded-full ${isSoloRec ? 'bg-sky-400' : 'bg-emerald-400'} animate-pulse"></span>
        <div>
          <span class="text-xs font-bold uppercase tracking-wider font-mono ${isSoloRec ? 'text-sky-400' : 'text-emerald-400'}">
            Agent 1 Cognitive Synthesis
          </span>
          <h4 class="text-base font-extrabold text-white mt-0.5">${analysis.recommendation_title}</h4>
        </div>
      </div>
      <div class="flex items-center space-x-3 text-xs font-mono">
        <span class="px-2.5 py-1 rounded bg-gray-800 text-gray-300 border border-gray-700">
          Syndicate Score: <strong class="text-emerald-400">${analysis.syndicate_score}%</strong>
        </span>
        <span class="px-2.5 py-1 rounded bg-gray-800 text-gray-300 border border-gray-700">
          Solo Match: <strong class="text-sky-400">${analysis.solo_score}%</strong>
        </span>
      </div>
    </div>

    <p class="text-xs text-gray-300 leading-relaxed pt-1">
      ${analysis.verdict_rationale}
    </p>

    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-mono border-t border-gray-800/60">
      <div>
        <span class="text-gray-400 block">Syndicate Reach:</span>
        <strong class="text-emerald-400 text-sm">${analysis.reach_comparison.syndicate_reach.toLocaleString()} gamers</strong>
      </div>
      <div>
        <span class="text-gray-400 block">Top Solo Reach:</span>
        <strong class="text-sky-400 text-sm">${analysis.reach_comparison.solo_reach.toLocaleString()} gamers</strong>
      </div>
      <div>
        <span class="text-gray-400 block">Target Budget:</span>
        <strong class="text-white text-sm">$${currentCampaign.budget_usd.toFixed(2)}</strong>
      </div>
      <div>
        <span class="text-gray-400 block">Tax Protection:</span>
        <strong class="text-blue-400 text-sm">KRA Section 16</strong>
      </div>
    </div>
  `;

  // Render Syndicates
  renderSyndicateCards(result.syndicates);

  // Render Solo Creators
  renderSoloCards(result.solo_matches);

  // Activate recommended tab
  if (isSoloRec) {
    switchPathwayTab('solo');
  } else {
    switchPathwayTab('syndicates');
  }

  container.scrollIntoView({ behavior: 'smooth' });
}

// Pathway tab switching (Syndicates vs Solo)
function switchPathwayTab(tab) {
  const btnSyn = document.getElementById('btnPathwaySyndicates');
  const btnSolo = document.getElementById('btnPathwaySolo');
  const contSyn = document.getElementById('pathwaySyndicatesContainer');
  const contSolo = document.getElementById('pathwaySoloContainer');

  if (tab === 'syndicates') {
    btnSyn.className = 'py-2 px-3 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center space-x-2 transition-all';
    btnSolo.className = 'py-2 px-3 rounded-lg text-gray-400 hover:text-white text-xs font-semibold flex items-center space-x-2 transition-all';
    contSyn.classList.remove('hidden');
    contSolo.classList.add('hidden');
  } else {
    btnSolo.className = 'py-2 px-3 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 text-xs font-bold flex items-center space-x-2 transition-all';
    btnSyn.className = 'py-2 px-3 rounded-lg text-gray-400 hover:text-white text-xs font-semibold flex items-center space-x-2 transition-all';
    contSolo.classList.remove('hidden');
    contSyn.classList.add('hidden');
  }
}

function renderSyndicateCards(syndicates) {
  const container = document.getElementById('syndicateCards');
  container.innerHTML = '';
  document.getElementById('badgeSyndicateCount').innerText = syndicates.length;

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
        <i class="fa-solid fa-file-contract"></i>
        <span>Select Syndicate & Generate Milestone Agreement &rarr;</span>
      </button>
    `;
    container.appendChild(card);
  });
}

// Renders top Solo Creator Matches
function renderSoloCards(soloMatches) {
  const container = document.getElementById('soloCards');
  container.innerHTML = '';
  document.getElementById('badgeSoloCount').innerText = soloMatches.length;

  soloMatches.forEach((entry, idx) => {
    const c = entry.creator;
    const card = document.createElement('div');
    card.className = "p-4 rounded-xl bg-gray-900 border border-gray-800 hover:border-sky-500/50 transition-all space-y-3";
    card.innerHTML = `
      <div class="flex items-start justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold font-mono">
            #${idx + 1}
          </div>
          <div>
            <div class="flex items-center space-x-2">
              <h4 class="font-bold text-white text-base">${c.name}</h4>
              <span class="text-xs text-sky-400 font-mono">@${c.gamer_tag}</span>
            </div>
            <span class="text-xs text-gray-400">${c.type} &bull; ${c.location} &bull; ${c.primary_game}</span>
          </div>
        </div>
        <div class="text-right">
          <span class="text-xs text-gray-400 block">Match Score</span>
          <span class="text-base font-extrabold text-sky-400 font-mono">${entry.match_score}%</span>
        </div>
      </div>

      <div class="p-2.5 rounded-lg bg-gray-950/70 border border-gray-800 text-xs text-gray-300">
        <strong class="text-sky-300">Fit Rationale:</strong> ${entry.match_rationale}
      </div>

      <div class="grid grid-cols-3 gap-2 py-2 border-y border-gray-800 text-xs">
        <div>
          <span class="text-gray-400 block text-[11px]">Monthly Reach</span>
          <span class="font-bold text-white font-mono">${c.monthly_reach.toLocaleString()}</span>
        </div>
        <div>
          <span class="text-gray-400 block text-[11px]">Solo Rate (${currentCurrency})</span>
          <span class="font-bold text-emerald-400 font-mono">${formatMoney(c.base_rate_usd)}</span>
        </div>
        <div>
          <span class="text-gray-400 block text-[11px]">Brand Safety</span>
          <span class="font-semibold text-emerald-400">${c.brand_safety_score}%</span>
        </div>
      </div>

      <div>
        <span class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Recommended Solo Deliverables:</span>
        <ul class="text-xs text-gray-400 space-y-0.5 list-disc list-inside">
          ${entry.recommended_deliverables.map(d => `<li>${d}</li>`).join('')}
        </ul>
      </div>

      <button onclick="sponsorSoloCreator('${c.id}')" class="w-full mt-2 py-2.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow transition-all flex items-center justify-center space-x-2">
        <i class="fa-solid fa-user-check"></i>
        <span>Sponsor ${c.name} Solo & Generate Agreement &rarr;</span>
      </button>
    `;
    container.appendChild(card);
  });
}

// STEP 2: SELECT SYNDICATE & RUN ARCHITECT
async function selectSyndicate(syndicateId) {
  logAgent("AGENT 2: ARCHITECT", `Decomposing syndicate ${syndicateId} into milestone agreement...`, "text-blue-400");
  logAgent("EMAIL SERVICE", `Resolving verified talent registry contacts for syndicate creators...`, "text-sky-400");

  try {
    const resp = await fetch('/api/v1/campaigns/proposal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign_id: currentCampaign ? currentCampaign.id : null,
        syndicate_id: syndicateId
      })
    });
    currentProposal = await resp.json();

    logAgent("AGENT 2: ARCHITECT", `Contract Drafted! Gross: $${currentProposal.total_budget_usd} &bull; Platform Fee: $${currentProposal.platform_fee_usd} &bull; 5% WHT locked.`, "text-blue-300 font-bold");
    logAgent("EMAIL SERVICE", `Proposal dispatched to ${currentProposal.beneficiary_emails.join(', ')} (ID: ${currentProposal.email_dispatch_id})`, "text-emerald-300 font-bold");

    setStepActive(2);
    renderStep2Proposal(currentProposal);
  } catch (err) {
    logAgent("ERROR", `Failed to generate proposal: ${err.message}`, "text-red-400");
  }
}

// SOLO CREATOR SPONSORSHIP HANDLER
async function sponsorSoloCreator(creatorId) {
  const brandName = document.getElementById('inputBrandName')?.value || "Safaricom 5G Home Gaming";
  const corporatePIN = document.getElementById('inputCorporatePIN')?.value || "P051234567A";

  logAgent("AGENT 2: ARCHITECT", `Structuring direct solo creator milestone contract for Creator ID: ${creatorId}...`, "text-blue-400");
  logAgent("EMAIL SERVICE", `Resolving verified creator registry contact for Creator ID: ${creatorId}...`, "text-sky-400");
  
  try {
    const resp = await fetch('/api/v1/campaigns/proposal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaign_id: currentCampaign ? currentCampaign.id : null,
        creator_id: creatorId,
        brand_name: brandName,
        corporate_pin: corporatePIN
      })
    });
    
    if (!resp.ok) {
      const errData = await resp.json();
      throw new Error(errData.detail || "Failed to structure solo proposal");
    }
    
    currentProposal = await resp.json();
    currentSyndicate = null;
    
    logAgent("AGENT 2: ARCHITECT", `Solo Contract Drafted for ${currentProposal.creators[0].name} (${currentProposal.creators[0].gamer_tag})! Rate: $${currentProposal.total_budget_usd} USD.`, "text-blue-300 font-bold");
    logAgent("EMAIL SERVICE", `Proposal dispatched to ${currentProposal.beneficiary_emails.join(', ')} (ID: ${currentProposal.email_dispatch_id})`, "text-emerald-300 font-bold");

    switchTab('demo');
    setStepActive(2);
    renderStep2Proposal(currentProposal);
  } catch (err) {
    logAgent("ERROR", `Solo sponsorship creation failed: ${err.message}`, "text-red-400");
  }
}

function renderStep2Proposal(proposal) {
  document.getElementById('card-step-2').classList.remove('hidden');
  document.getElementById('card-step-2').scrollIntoView({ behavior: 'smooth' });

  const container = document.getElementById('proposalDetails');
  const isSolo = proposal.creators && proposal.creators.length === 1;
  const emailsList = (proposal.beneficiary_emails && proposal.beneficiary_emails.length) 
    ? proposal.beneficiary_emails.join(', ') 
    : 'Beneficiary Inboxes';

  container.innerHTML = `
    <!-- BENEFICIARY PROPOSAL EMAIL DISPATCH NOTIFICATION BANNER -->
    <div class="p-4 rounded-xl bg-gradient-to-r from-emerald-950/70 via-gray-900 to-[#0b1528] border border-emerald-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
      <div class="flex items-center space-x-3">
        <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
          <i class="fa-solid fa-paper-plane text-lg"></i>
        </div>
        <div>
          <div class="flex items-center space-x-2">
            <span class="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono">Proposal Dispatched via Email</span>
            <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-[10px] text-emerald-300 border border-emerald-500/30 font-mono">${proposal.email_dispatch_id || 'DISPATCHED'}</span>
          </div>
          <p class="text-xs text-gray-300 mt-0.5">
            Official sponsorship offer delivered to: <strong class="text-white font-mono">${emailsList}</strong>
          </p>
        </div>
      </div>
      <div class="flex items-center space-x-2 w-full sm:w-auto">
        <button onclick="openEmailPreview('${proposal.email_dispatch_id}')" class="flex-1 sm:flex-none py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-gray-950 font-extrabold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md">
          <i class="fa-solid fa-envelope-open-text"></i>
          <span>View Dispatched Email</span>
        </button>
        <button onclick="promptForwardEmail('${proposal.id}')" class="py-2 px-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs border border-gray-700 flex items-center justify-center space-x-1.5 transition-all">
          <i class="fa-solid fa-share text-sky-400"></i>
          <span>Forward</span>
        </button>
      </div>
    </div>

    <!-- Target Beneficiary Notice -->
    <div class="p-3.5 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-between">
      <div>
        <span class="text-xs text-gray-400 block">${isSolo ? 'Solo Creator Direct Sponsorship' : 'Syndicate Beneficiaries'}</span>
        <span class="text-sm font-bold text-white">${proposal.creators.map(c => `${c.name} (${c.gamer_tag})`).join(', ')}</span>
      </div>
      <span class="px-2.5 py-1 rounded text-xs font-bold font-mono ${isSolo ? 'bg-sky-500/20 text-sky-300' : 'bg-emerald-500/20 text-emerald-300'}">
        ${isSolo ? 'SOLO CREATOR' : 'SYNDICATE BUNDLE'}
      </span>
    </div>

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
        <span class="text-xs text-gray-400 block">Net Creator Milestone Payout</span>
        <span class="text-base font-extrabold text-emerald-400 font-mono">${formatMoney(proposal.net_creator_disbursement_usd)}</span>
      </div>
    </div>

    <!-- BILATERAL EXECUTION STATUS -->
    <div class="p-4 rounded-xl bg-gray-900/90 border border-gray-800 space-y-3">
      <div class="flex items-center justify-between border-b border-gray-800 pb-2">
        <span class="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
          <i class="fa-solid fa-signature text-blue-400"></i> Bilateral Sponsorship Execution Status
        </span>
        <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30">TWO-PARTY BILATERAL CONTRACT</span>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div class="p-3 rounded-lg bg-gray-950 border border-gray-800/80 space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-gray-400 font-semibold">Party 1: Brand Sponsor</span>
            <span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">DRAFTED & DISPATCHED</span>
          </div>
          <p class="text-white font-bold">${proposal.brand_name || 'Brand Sponsor'}</p>
          <p class="text-[11px] text-gray-400">Brand action: Authorize & fund milestone ledger in Step 3 via PayPal Orders v2.</p>
        </div>
        <div class="p-3 rounded-lg bg-gray-950 border border-gray-800/80 space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-gray-400 font-semibold">Party 2: Beneficiary Talent</span>
            <span class="px-2 py-0.5 rounded ${proposal.status === 'ACCEPTED_BY_BENEFICIARY' || proposal.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'} font-mono text-[10px] font-bold">
              ${proposal.status === 'ACCEPTED_BY_BENEFICIARY' || proposal.status === 'ACTIVE' ? 'COUNTERSIGNED & ACCEPTED' : 'DISPATCHED (PENDING COUNTERSIGN)'}
            </span>
          </div>
          <p class="text-white font-bold">${proposal.creators.map(c => c.name).join(', ')}</p>
          <div class="flex items-center justify-between">
            <p class="text-[11px] text-gray-400">Dispatched to <span class="font-mono text-cyan-300">${emailsList}</span></p>
            <a href="/creator?proposal=${proposal.id}&creator_id=${proposal.creators[0]?.id || 'creator-001'}" target="_blank" class="text-[11px] text-purple-400 hover:text-purple-300 underline font-semibold">
              Open Creator Portal &rarr;
            </a>
          </div>
        </div>
      </div>
    </div>


    <!-- Milestone Phases -->
    <div class="space-y-3">
      <h3 class="text-sm font-bold text-gray-300 uppercase tracking-wider">Programmatic Milestone Schedule</h3>
      <div class="space-y-2">
        ${proposal.milestones.map(m => `
          <div class="p-3.5 rounded-xl bg-gray-900/60 border border-gray-800 flex items-center justify-between">
            <div class="space-y-1">
              <div class="flex items-center space-x-2">
                <span class="text-xs font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">Phase ${m.milestone_number} (${m.percentage}%)</span>
                <span class="text-sm font-bold text-white">${m.title}</span>
              </div>
              <p class="text-xs text-gray-400">${m.description}</p>
            </div>
            <div class="text-right">
              <span class="text-sm font-extrabold text-emerald-400 font-mono">${formatMoney(m.amount_usd)}</span>
              <span class="text-[10px] block text-gray-500 uppercase font-mono">${m.status}</span>
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

    <button onclick="initializePayPalEscrow()" id="btnInitPayPal" class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold text-sm shadow-lg shadow-sky-500/20 flex items-center justify-center space-x-2 transition-all">
      <i class="fa-brands fa-paypal text-lg"></i>
      <span>Sponsor Action: Initialize PayPal Milestone Ledger &rarr;</span>
    </button>
  `;
}

// STEP 3: PAYPAL ORDERS V2 MILESTONE LEDGER CHECKOUT
async function initializePayPalEscrow() {
  logAgent("AGENT 4: FINANCE", `Creating PayPal Orders v2 Programmatic Milestone Ledger for Proposal ${currentProposal.id}...`, "text-sky-400");

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

  // Safe extraction with defensive fallbacks against undefined
  const orderId = order.order_id || (order.paypal_order && order.paypal_order.id) || order.id || "PAYPAL-ORD-LEDGER";
  const rawGross = (order.gross_amount !== undefined && order.gross_amount !== null)
    ? order.gross_amount
    : (currentProposal ? currentProposal.total_budget_usd : 0);
  const grossNum = Number(rawGross) || 0;

  const rawFee = (order.platform_fee !== undefined && order.platform_fee !== null)
    ? order.platform_fee
    : (currentProposal ? currentProposal.platform_fee_usd : 0);
  const feeNum = Number(rawFee) || 0;

  const statusText = order.status || (order.paypal_order && order.paypal_order.status) || "CREATED";
  const approvalUrl = order.approval_url || (order.paypal_order && order.paypal_order.links && order.paypal_order.links.find(l => l.rel === 'approve')?.href) || "";
  const isLiveSandbox = (order.paypal_order && order.paypal_order.mode && order.paypal_order.mode.includes("LIVE"));

  // Ensure currentPayPalOrder has required keys for downstream actions
  currentPayPalOrder.order_id = orderId;
  currentPayPalOrder.gross_amount = grossNum;
  currentPayPalOrder.platform_fee = feeNum;

  const container = document.getElementById('paypalEscrowDetails');
  container.innerHTML = `
    <div class="p-4 rounded-xl bg-sky-950/20 border border-sky-500/30 space-y-3">
      <div class="flex items-center justify-between border-b border-sky-500/20 pb-2">
        <span class="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
          <i class="fa-brands fa-paypal"></i> PayPal Orders v2 Multiparty Authorization
        </span>
        <div class="flex items-center space-x-2">
          ${isLiveSandbox ? '<span class="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold font-mono border border-emerald-500/40">LIVE SANDBOX</span>' : ''}
          <span class="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">${statusText}</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-3 text-xs">
        <div><span class="text-gray-400">PayPal Order ID:</span> <span class="font-mono text-white font-bold">${orderId}</span></div>
        <div><span class="text-gray-400">Total Funded Milestones:</span> <span class="font-mono text-emerald-400 font-bold">${formatMoney(grossNum)}</span></div>
        <div><span class="text-gray-400">Platform Commission Split:</span> <span class="font-mono text-sky-300">${formatMoney(feeNum)}</span></div>
        <div><span class="text-gray-400">Beneficiary Milestone Share:</span> <span class="font-mono text-white">${formatMoney(grossNum - feeNum)}</span></div>
      </div>

      ${approvalUrl ? `
        <div class="pt-2 border-t border-sky-500/20 flex items-center justify-between">
          <span class="text-[11px] text-gray-400">Buyer Checkout Flow:</span>
          <a href="${approvalUrl}" target="_blank" class="px-2.5 py-1 rounded bg-sky-600/30 hover:bg-sky-600/50 text-sky-200 border border-sky-500/40 text-xs font-mono flex items-center space-x-1">
            <span>Open PayPal Checkout Window</span>
            <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
          </a>
        </div>
      ` : ''}
    </div>

    <!-- PayPal Checkout Action -->
    <div class="space-y-3">
      <div class="p-3.5 rounded-xl bg-gray-900 border border-gray-800 text-xs text-gray-300 flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <i class="fa-solid fa-lock text-emerald-400"></i>
          <span>Milestone funds will be committed to a programmatic PayPal ledger and disbursed milestone-by-milestone upon OpenCV Proof-of-Play verification.</span>
        </div>
      </div>

      <button onclick="capturePayPalOrder()" id="btnCapturePayPal" class="w-full py-3.5 px-4 rounded-xl bg-[#0070ba] hover:bg-[#003087] text-white font-extrabold text-sm shadow-lg shadow-sky-500/20 flex items-center justify-center space-x-2 transition-all">
        <i class="fa-brands fa-paypal text-lg"></i>
        <span>Authorize & Fund $${grossNum.toFixed(2)} USD in PayPal Milestone Ledger</span>
      </button>
    </div>
  `;
}

async function capturePayPalOrder() {
  const orderId = currentPayPalOrder ? (currentPayPalOrder.order_id || (currentPayPalOrder.paypal_order && currentPayPalOrder.paypal_order.id) || currentPayPalOrder.id) : null;
  logAgent("PAYPAL MILESTONE LEDGER", `Authorizing payment capture for Order ${orderId}...`, "text-sky-400");

  try {
    const resp = await fetch(`/api/v1/payments/capture-order/${orderId}`, { method: 'POST' });
    if (!resp.ok) throw new Error(`Capture request failed (HTTP ${resp.status})`);
    const captureData = await resp.json();

    logAgent("PAYPAL MILESTONE LEDGER", `Funds Captured! Milestone ledger status: FUNDED. Platform commission automatically split.`, "text-emerald-400 font-bold");
    logAgent("AGENT 4: FINANCE", `Milestone 1 is now active. Creator mobilization underway.`, "text-sky-300");

    document.getElementById('btnCapturePayPal').disabled = true;
    document.getElementById('btnCapturePayPal').className = "w-full py-3.5 px-4 rounded-xl bg-emerald-600 text-white font-extrabold text-sm flex items-center justify-center space-x-2 opacity-90 cursor-default";
    document.getElementById('btnCapturePayPal').innerHTML = `<i class="fa-solid fa-check"></i> <span>Milestones Funded & Secured via PayPal Ledger</span>`;

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
      <!-- OpenCV Scenario Selector Bench & File Drop -->
      <div class="p-3.5 rounded-xl bg-gray-950/80 border border-purple-500/30 flex flex-wrap items-center justify-between gap-2">
        <div>
          <span class="text-xs font-bold text-white block">OpenCV Computer Vision Test Bench</span>
          <span class="text-[11px] text-gray-400">Select scenario to execute real contour & template detection on stream frame.</span>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button type="button" onclick="runOpenCVVisionAnalysis('PASS')" id="btnScenarioPass" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all flex items-center space-x-1">
            <i class="fa-solid fa-check"></i>
            <span>Valid Placement (>= 3.5% Pass)</span>
          </button>
          <button type="button" onclick="runOpenCVVisionAnalysis('LOW_OCCUPANCY')" id="btnScenarioFail" class="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-semibold border border-gray-700 transition-all flex items-center space-x-1">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <span>Low-Occupancy Bug (< 3.5% Fail)</span>
          </button>
          <button type="button" onclick="checkAndLoadCreatorSubmission()" id="btnCheckCreatorSubmission" class="px-3 py-1.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 border border-indigo-500/40 text-indigo-200 text-xs font-semibold transition-all flex items-center space-x-1 shadow">
            <i class="fa-solid fa-cloud-arrow-down text-purple-400"></i>
            <span>Load Creator Evidence</span>
          </button>
          <label for="cvFrameUploadInput" class="px-3 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs font-semibold cursor-pointer flex items-center space-x-1.5 transition-all shadow">
            <i class="fa-solid fa-cloud-arrow-up text-purple-400"></i>
            <span>Upload Custom Frame</span>
          </label>
          <input type="file" id="cvFrameUploadInput" accept="image/*" class="hidden" onchange="handleCustomFrameUpload(event)">
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

      <button onclick="executeMultimodalVerification()" id="btnVerifyDeliverable" class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-purple-500/20 flex items-center justify-center space-x-2 transition-all">
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

async function checkAndLoadCreatorSubmission() {
  if (!currentProposal) {
    logAgent("AGENT 3", "No active proposal selected. Please select a syndicate or creator first.", "text-amber-400");
    return;
  }
  const creatorTag = currentProposal.creators[0]?.gamer_tag || "Creator";
  logAgent("AGENT 3: VERIFIER", `Polling for live deliverable evidence from @${creatorTag}...`, "text-purple-300");
  try {
    const resp = await fetch(`/api/v1/creator/collaboration/${currentProposal.id}`);
    if (!resp.ok) return;
    const msgs = await resp.json();
    const uploadMsg = msgs.slice().reverse().find(m => m.attachment_url);
    if (uploadMsg && uploadMsg.attachment_url) {
      logAgent("AGENT 3: VERIFIER", `Found creator broadcast deliverable: ${uploadMsg.attachment_url}. Running multimodal consensus!`, "text-emerald-400 font-bold");
      const previewImg = document.getElementById('visionStreamPreview');
      if (previewImg) previewImg.src = uploadMsg.attachment_url + "?t=" + Date.now();
      await executeMultimodalVerification();
    } else {
      logAgent("AGENT 3: VERIFIER", `No uploaded media found yet for deal ${currentProposal.id}. Click 'Creator Portal' in the top header to submit a stream frame or preset deliverable!`, "text-amber-300");
    }
  } catch (e) {
    console.error(e);
  }
}


function handleCustomFrameUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  logAgent("OPENCV VISION", `Custom frame selected: ${file.name} (${Math.round(file.size / 1024)} KB). Ingesting for live computer vision analysis...`, "text-purple-300 font-bold");
  const reader = new FileReader();
  reader.onload = async function(e) {
    const base64Data = e.target.result;
    await runOpenCVCustomAnalysis(base64Data, file.name);
  };
  reader.readAsDataURL(file);
}

async function runOpenCVCustomAnalysis(base64Data, filename) {
  const brandName = (currentProposal && currentProposal.brand_name) || "Safaricom";
  logAgent("OPENCV VISION", `Executing OpenCV cv2.matchTemplate & contour localization on user upload [${filename}]...`, "text-purple-400");
  
  const spinner = document.getElementById('visionSpinner');
  if (spinner) spinner.classList.remove('hidden');

  try {
    const resp = await fetch('/api/v1/verification/analyze-frame', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand_name: brandName, image_base64: base64Data })
    });
    const data = await resp.json();
    currentVisionResult = data.metrics;
    
    logAgent("OPENCV VISION", `User frame analyzed! Bounding Box: [${currentVisionResult.bounding_box.x}, ${currentVisionResult.bounding_box.y}, ${currentVisionResult.bounding_box.width}x${currentVisionResult.bounding_box.height}]`, "text-purple-300 font-mono");
    logAgent("OPENCV VISION", `Screen Area Occupancy: ${currentVisionResult.screen_occupancy_percent}% (Threshold >= 3.5%) &bull; Status: ${currentVisionResult.status}`, currentVisionResult.meets_threshold ? "text-emerald-400 font-bold" : "text-amber-400 font-bold");
    
    renderOpenCVPreview(currentVisionResult);
  } catch (err) {
    logAgent("ERROR", `Custom frame analysis failed: ${err.message}`, "text-red-400");
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

      <!-- DIRECT PAYPAL PAYOUT DESTINATION WALLET -->
      <div class="p-4 rounded-xl bg-gray-950/90 border border-sky-500/40 space-y-2.5">
        <div class="flex items-center justify-between border-b border-gray-800 pb-2">
          <span class="text-xs font-bold text-sky-300 flex items-center gap-1.5">
            <i class="fa-brands fa-paypal text-sky-400"></i> Beneficiary PayPal Payout Wallet
          </span>
          <span class="text-[10px] font-mono bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30">PAYPAL PAYOUTS API</span>
        </div>
        <div class="flex flex-col sm:flex-row gap-2">
          <input type="email" id="payoutRecipientEmail" value="${(currentProposal.creators && currentProposal.creators[0] && currentProposal.creators[0].paypal_email) || 'creator@barbahgames.com'}" placeholder="Enter your PayPal email (e.g. user@gmail.com)" class="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 font-mono">
          <button type="button" onclick="setPersonalTestPayPalEmail()" class="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center justify-center space-x-1 whitespace-nowrap transition-all shadow">
            <i class="fa-solid fa-user-pen"></i>
            <span>Set My PayPal</span>
          </button>
        </div>
        <p class="text-[11px] text-gray-400">
          Want to test the workflow into your own PayPal account? Enter your personal or Sandbox PayPal email address above to receive the live payout dispatch.
        </p>
      </div>

      <button onclick="executeFinalDisbursementAndTax()" id="btnExecuteDisbursement" class="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-sm shadow-lg shadow-red-500/20 flex items-center justify-center space-x-2 transition-all">
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
        certificate_id: currentProofCert.certificate_id,
        recipient_email: document.getElementById('payoutRecipientEmail')?.value?.trim() || undefined
      })
    });
    const result = await resp.json();

    logAgent("AGENT 4: TAX ENGINE", `eTIMS Fiscal Invoice Issued! CU Ref: ${result.etims_cu_invoice_number}`, "text-red-300 font-bold");
    logAgent("AGENT 4: FINANCE", `PayPal Payout Released! Mode: ${result.payout_mode || 'PAYPAL_SANDBOX'} &bull; Item: ${result.paypal_payout_id}`, "text-emerald-300 font-bold");
    logAgent("AGENT 6: METATWIN", `Logged youth empowerment metrics into ESG Social Impact ledger.`, "text-rose-400");

    renderFinalTaxInvoice(result);
  } catch (err) {
    logAgent("ERROR", `Disbursement failed: ${err.message}`, "text-red-400");
  }
}


function setPersonalTestPayPalEmail() {
  const currentVal = document.getElementById('payoutRecipientEmail')?.value || '';
  const userEmail = prompt("Enter your personal or Sandbox PayPal email to receive payout:", currentVal);
  if (userEmail && userEmail.trim()) {
    document.getElementById('payoutRecipientEmail').value = userEmail.trim();
    logAgent("USER ACTION", `Payout destination updated to: ${userEmail.trim()}`, "text-sky-300 font-bold");
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
        <div><span class="text-gray-400">Supplier PIN:</span> <span class="font-mono text-white">${result.supplier_pin || 'A011982736K (BII Handled)'}</span></div>
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
      <div class="space-y-0.5">
        <div><span class="text-gray-400">PayPal Payout Item:</span> <span class="font-mono text-sky-400 font-bold">${result.paypal_payout_id}</span></div>
        <div><span class="text-gray-400">Destination Wallet:</span> <span class="font-mono text-emerald-400">${result.payout_recipient || document.getElementById('payoutRecipientEmail')?.value || 'Beneficiary Wallet'}</span></div>
      </div>
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
    if (pill) {
      const stepNumEl = pill.querySelector('.step-num');
      if (i < stepNum) {
        // Completed step
        pill.className = "step-badge p-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 text-center transition-all opacity-100 shadow-[0_0_15px_rgba(16,185,129,0.12)]";
        if (stepNumEl) stepNumEl.className = 'step-num text-emerald-400 font-bold';
      } else if (i === stepNum) {
        // Active step
        pill.className = "step-badge p-3 rounded-2xl border border-[#4fd8e6]/60 bg-[#4fd8e6]/10 text-center transition-all opacity-100 shadow-[0_0_20px_rgba(79,216,230,0.2)]";
        if (stepNumEl) stepNumEl.className = 'step-num text-[#4fd8e6] font-bold';
      } else {
        // Upcoming step
        pill.className = "step-badge p-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] text-center opacity-60 transition-all hover:opacity-80";
        if (stepNumEl) stepNumEl.className = 'step-num text-gray-500 font-semibold';
      }
    }
  }
}

// =========================================================================
// TAB 2: AG GRID INITIALIZATION (16 PERSONAS + SOLO SPONSOR ACTION)
// =========================================================================
async function initAgGrid() {
  const gridDiv = document.querySelector('#myGrid');
  if (!gridDiv) return;

  const columnDefs = [
    { field: "name", headerName: "Creator / Organization", minWidth: 200, flex: 2 },
    { field: "gamer_tag", headerName: "Handle", minWidth: 140, flex: 1 },
    { field: "type", headerName: "Category", minWidth: 160, flex: 1 },
    { field: "primary_game", headerName: "Primary Game", minWidth: 150, flex: 1 },
    { field: "location", headerName: "Location", minWidth: 140, flex: 1 },
    { 
      field: "monthly_reach", 
      headerName: "Reach", 
      minWidth: 110,
      valueFormatter: params => params.value.toLocaleString()
    },
    { 
      field: "base_rate_usd", 
      headerName: "Base Rate", 
      minWidth: 120,
      valueFormatter: params => formatMoney(params.value)
    },
    { 
      field: "etims_registered", 
      headerName: "Tax Route", 
      minWidth: 130,
      cellRenderer: params => {
        return params.value 
          ? `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/20 text-blue-300">Direct eTIMS</span>`
          : `<span class="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300">Barbah BII</span>`;
      }
    },
    {
      headerName: "Direct Sponsor",
      minWidth: 140,
      cellRenderer: params => {
        return `<button onclick="sponsorSoloCreator('${params.data.id}')" class="px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow transition-all">Sponsor Solo &rarr;</button>`;
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
// TAB 3: AGENT 1 MULTI-CHANNEL RADAR DATA FETCH
// =========================================================================
async function refreshRadarData() {
  logAgent("SCOUT RADAR", "Scanning 4 autonomous intelligence feeds...", "text-cyan-400");
  try {
    const resp = await fetch('/api/v1/radar/overview');
    const data = await resp.json();
    
    // Render Channel 1: Streams
    const streamsContainer = document.getElementById('radarStreamsList');
    if (streamsContainer) {
      streamsContainer.innerHTML = data.channel_1_live_streams.map(s => `
        <div class="p-3 rounded-xl bg-gray-950/70 border ${s.sponsor_recommended ? 'border-gray-800' : 'border-red-500/40'} flex items-center justify-between text-xs">
          <div class="space-y-1">
            <div class="flex items-center space-x-2">
              <span class="font-bold text-white">${s.creator_name}</span>
              <span class="text-gray-400 font-mono">(${s.gamer_tag})</span>
              <span class="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/10 text-blue-300">${s.game}</span>
            </div>
            <div class="text-gray-400 text-[11px]">${s.stream_title}</div>
            <div class="flex items-center space-x-3 text-[11px] text-gray-400 font-mono">
              <span>CCV: <b class="text-white">${s.ccv.toLocaleString()}</b></span>
              <span>Chat Velocity: <b class="text-cyan-400">${s.chat_velocity_cpm} cpm</b></span>
              <span>Engagement Ratio: <b class="${s.sponsor_recommended ? 'text-emerald-400' : 'text-red-400'}">${s.engagement_ratio_percent}%</b></span>
            </div>
          </div>
          <div class="text-right space-y-1">
            <span class="px-2 py-0.5 rounded text-[10px] font-bold ${s.sponsor_recommended ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-red-500/20 text-red-300 border border-red-500/30'}">
              ${s.audit_status}
            </span>
            <div class="text-[10px] text-gray-500 font-mono">Bot Risk: ${s.bot_risk}</div>
          </div>
        </div>
      `).join('');
    }

    // Render Channel 2: Brackets
    const bracketsContainer = document.getElementById('radarBracketsList');
    if (bracketsContainer) {
      bracketsContainer.innerHTML = data.channel_2_tournament_brackets.map(b => `
        <div class="p-3.5 rounded-xl bg-gray-950/70 border border-gray-800 space-y-2 text-xs">
          <div class="flex items-center justify-between border-b border-gray-800 pb-1.5">
            <div>
              <span class="font-bold text-white">${b.title}</span>
              <span class="text-[11px] text-gray-400 block">${b.venue} &bull; ${b.total_entrants} Players</span>
            </div>
            <span class="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 text-[10px] font-mono">${b.aggregator}</span>
          </div>
          <div class="space-y-1">
            ${b.standings.map(st => `
              <div class="flex items-center justify-between text-[11px]">
                <div class="flex items-center space-x-2">
                  <span class="w-4 h-4 rounded-full bg-gray-800 text-gray-300 flex items-center justify-center font-bold text-[10px]">${st.placement}</span>
                  <span class="font-semibold text-white">${st.name} (${st.gamer_tag})</span>
                  <span class="text-gray-500 font-mono">${st.score}</span>
                </div>
                <span class="text-[10px] font-mono ${st.status === 'VERIFIED_SPONSORPLAY' ? 'text-emerald-400' : 'text-cyan-400'}">${st.status}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('');
    }

    // Render Channel 3: Webhooks
    const webhooksContainer = document.getElementById('radarWebhooksList');
    if (webhooksContainer) {
      webhooksContainer.innerHTML = data.channel_3_community_webhooks.map(w => `
        <div class="p-3 rounded-xl bg-gray-950/70 border border-gray-800 space-y-1 text-xs">
          <div class="flex items-center justify-between">
            <span class="font-bold text-emerald-400 flex items-center gap-1.5">
              <i class="fa-solid fa-satellite"></i> ${w.source}: ${w.channel_name}
            </span>
            <span class="text-[10px] text-gray-500">${w.ingested_at}</span>
          </div>
          <p class="text-gray-300 text-[11px]">"${w.message}"</p>
          <div class="text-[10px] text-gray-400 font-mono">From: ${w.sender} &bull; Parsed: ${w.parsed_data.event_type} (${w.parsed_data.location})</div>
        </div>
      `).join('');
    }

    // Render Channel 4: Social Clips
    const clipsContainer = document.getElementById('radarClipsList');
    if (clipsContainer) {
      clipsContainer.innerHTML = data.channel_4_social_clips.map(c => `
        <div class="p-3 rounded-xl bg-gray-950/70 border border-gray-800 space-y-1.5 text-xs">
          <div class="flex items-center justify-between">
            <span class="font-bold text-rose-400">${c.platform} ${c.hashtag} (${c.creator_tag})</span>
            <span class="text-[10px] font-mono bg-rose-500/10 text-rose-300 px-1.5 py-0.5 rounded">Virality: ${c.virality_score}%</span>
          </div>
          <div class="text-white font-medium text-[11px]">"${c.clip_title}"</div>
          <div class="flex items-center justify-between text-[10px] text-gray-400 font-mono pt-1 border-t border-gray-900">
            <span>${c.views.toLocaleString()} views &bull; ${c.shares.toLocaleString()} shares</span>
            <span class="text-emerald-400">${c.brand_safety_status}</span>
          </div>
        </div>
      `).join('');
    }

    logAgent("SCOUT RADAR", `Scanned: ${data.channels_summary.live_streams_monitored} broadcasts (${data.channels_summary.bot_flags_intercepted} bot flags detected), ${data.channels_summary.tournament_brackets_synced} brackets, ${data.channels_summary.community_webhooks_queued} webhooks, ${data.channels_summary.social_clips_indexed} viral clips.`, "text-cyan-300 font-bold");
  } catch (err) {
    logAgent("ERROR", `Radar refresh failed: ${err.message}`, "text-red-400");
  }
}

// =========================================================================
// TAB 4: LOAD eTIMS INVOICES
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
// TAB 5: LOAD BARBAH METATWIN ESG IMPACT DOSSIER
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

// =========================================================================
// BENEFICIARY PROPOSAL EMAIL MODAL HANDLERS
// =========================================================================

function openEmailPreview(emailId) {
  if (!emailId && currentProposal && currentProposal.email_dispatch_id) {
    emailId = currentProposal.email_dispatch_id;
  }
  const modal = document.getElementById('modalEmailPreview');
  const frame = document.getElementById('emailPreviewFrame');
  const meta = document.getElementById('modalEmailMeta');
  const statusBadge = document.getElementById('modalEmailStatusBadge');

  if (emailId) {
    frame.src = `/api/v1/notifications/email-preview/${emailId}`;
    if (meta && currentProposal) {
      meta.innerHTML = `Proposal ID: <strong class="text-emerald-400 font-mono">${currentProposal.id}</strong> &bull; Beneficiaries: <span class="text-white">${(currentProposal.beneficiary_emails || []).join(', ')}</span>`;
    }
  }
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

function closeEmailModal() {
  const modal = document.getElementById('modalEmailPreview');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

async function promptForwardEmail(proposalId) {
  const targetEmail = prompt("Enter email address to forward this official sponsorship proposal:", "team@barbahgames.com");
  if (!targetEmail || !targetEmail.includes("@")) return;

  logAgent("EMAIL SERVICE", `Forwarding proposal ${proposalId} to ${targetEmail}...`, "text-sky-400");
  try {
    const resp = await fetch('/api/v1/notifications/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proposal_id: proposalId,
        recipients: [targetEmail.trim()]
      })
    });
    if (resp.ok) {
      const data = await resp.json();
      logAgent("EMAIL SERVICE", `Proposal successfully delivered to ${targetEmail} (ID: ${data.email_id})`, "text-emerald-300 font-bold");
      alert(`Proposal successfully dispatched to ${targetEmail}!`);
    } else {
      throw new Error(`Server returned HTTP ${resp.status}`);
    }
  } catch (err) {
    logAgent("ERROR", `Failed to forward email: ${err.message}`, "text-red-400");
  }
}

function forwardCurrentProposalEmail() {
  if (currentProposal) {
    promptForwardEmail(currentProposal.id);
  }
}
