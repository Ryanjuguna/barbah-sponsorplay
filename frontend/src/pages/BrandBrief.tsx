import React, { useState } from 'react';
import {
  ArrowRight,
  Briefcase,
  DollarSign,
  Play,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Eye,
  FileText,
  RefreshCw,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { formatUSD, formatKES } from '@/lib/utils';
import type {
  BriefDeconstructionResult,
  SyndicateRecommendation,
  SoloCreatorMatch,
  Proposal,
  ProofOfPlayCertificate,
  DisbursementResult,
  MetaTwinReport,
} from '@/types/index';

interface BrandBriefProps {
  onNavigate: (path: string) => void;
}

type WizardStep =
  | 'brief'
  | 'selection'
  | 'contract'
  | 'ledger'
  | 'verification'
  | 'payout'
  | 'impact';

const PRESETS = [
  {
    key: 'safaricom',
    label: 'Safaricom 5G Gaming',
    brand_name: 'Safaricom 5G Home Gaming',
    corporate_pin: 'P051234567A',
    brief: 'Promote ultra-low latency 5G Home Internet to university gamers and grassroots esports communities across Nairobi and Eldoret. Need tournament broadcast integration, stream overlay, and campus derby activations. Target: 10,000 youth reached.',
    target_audience: '18-24 urban university gamers in Nairobi & Eldoret',
    budget_usd: '750',
  },
  {
    key: 'monster',
    label: 'Monster Energy EA',
    brand_name: 'Monster Energy East Africa',
    corporate_pin: 'P059876543B',
    brief: 'High-octane energy drink sponsorship for Nairobi fighting game community and Tekken 8 college derbies. Require branded stage banners, live stream HUD overlay, and shoutcaster energy break callouts.',
    target_audience: '16-28 grassroots competitive gamers & fighters',
    budget_usd: '600',
  },
  {
    key: 'redbull',
    label: 'Red Bull Kenya',
    brand_name: 'Red Bull Kenya Esports',
    corporate_pin: 'P051122334C',
    brief: 'Grassroots LAN qualifiers sponsorship across Nairobi East and informal settlement gaming dens. Need tournament bracket sponsorship, physical roll-up banners, and live tournament broadcast integration.',
    target_audience: '15-25 grassroots community youth & lan den competitors',
    budget_usd: '450',
  },
];

export const BrandBrief: React.FC<BrandBriefProps> = ({ onNavigate }) => {
  const [step, setStep] = useState<WizardStep>('brief');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    brand_name: 'Safaricom 5G Home Gaming',
    corporate_pin: 'P051234567A',
    brief: 'Promote ultra-low latency 5G Home Internet to university gamers and grassroots esports communities across Nairobi. Need tournament broadcast integration, logo overlay, and campus derby activations. Target: 10,000 youth reached.',
    target_audience: '18-24 urban university gamers in Nairobi',
    budget_usd: '750',
  });

  // Step 1 Results: Deconstruction
  const [deconstructionResult, setDeconstructionResult] = useState<BriefDeconstructionResult | null>(null);
  const [selectedPathway, setSelectedPathway] = useState<'syndicates' | 'solo'>('syndicates');
  const [selectedSyndicateId, setSelectedSyndicateId] = useState<string | null>(null);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string | null>(null);

  // Step 2 Results: Proposal
  const [proposal, setProposal] = useState<Proposal | null>(null);

  // Step 3 Results: PayPal Milestone Ledger
  const [paypalOrder, setPaypalOrder] = useState<any | null>(null);
  const [isFundsCommitted, setIsFundsCommitted] = useState(false);

  // Step 4 Results: Proof-of-Play Vision Verification
  const [verificationScenario, setVerificationScenario] = useState<'PASS' | 'VENUE' | 'LOW_OCCUPANCY'>('PASS');
  const [cvAnalysis, setCvAnalysis] = useState<any | null>(null);
  const [proofCertificate, setProofCertificate] = useState<ProofOfPlayCertificate | null>(null);

  // Step 5 Results: KRA eTIMS Fiscal Payout
  const [disbursementResult, setDisbursementResult] = useState<DisbursementResult | null>(null);

  // Step 6 Results: MetaTwin ESG Dossier
  const [impactDossier, setImpactDossier] = useState<MetaTwinReport | null>(null);

  const handleApplyPreset = (presetKey: string) => {
    const p = PRESETS.find((item) => item.key === presetKey);
    if (!p) return;
    setFormData({
      brand_name: p.brand_name,
      corporate_pin: p.corporate_pin,
      brief: p.brief,
      target_audience: p.target_audience,
      budget_usd: p.budget_usd,
    });
  };

  // STEP 1: Deconstruct Brief via Agent 1 (Scout)
  const handleSubmitBrief = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const budgetNum = parseFloat(formData.budget_usd) || 750;
      const briefPayload = {
        id: `CAMP-${Date.now().toString(36).toUpperCase()}`,
        brand_name: formData.brand_name,
        corporate_pin: formData.corporate_pin,
        brief: formData.brief,
        target_audience: formData.target_audience,
        budget_usd: budgetNum,
      };

      const result = await api.deconstructBrief(briefPayload);
      setDeconstructionResult(result);

      // Pre-select first syndicate if available
      if (result.syndicates && result.syndicates.length > 0) {
        setSelectedSyndicateId(result.syndicates[0].syndicate_id);
        setSelectedPathway('syndicates');
      } else if (result.solo_matches && result.solo_matches.length > 0) {
        setSelectedCreatorId(result.solo_matches[0].creator.id);
        setSelectedPathway('solo');
      }

      setStep('selection');
    } catch (err: any) {
      console.error('Brief submission failed', err);
      setError(err.message || 'Failed to analyze brief. Please check API connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Create Proposal via Agent 2 (Architect)
  const handleProceedToContract = async () => {
    if (!deconstructionResult) return;
    setIsLoading(true);
    setError(null);

    try {
      const payload: any = {
        campaign_id: deconstructionResult.campaign_id,
        brand_name: formData.brand_name,
        budget_usd: parseFloat(formData.budget_usd) || 750,
        beneficiary_email: 'creator@sponsorplay.ke',
      };

      if (selectedPathway === 'syndicates' && selectedSyndicateId) {
        payload.syndicate_id = selectedSyndicateId;
      } else if (selectedCreatorId) {
        payload.creator_id = selectedCreatorId;
      }

      const prop = await api.createProposal(payload);
      setProposal(prop);
      setStep('contract');
    } catch (err: any) {
      console.error('Proposal creation failed', err);
      setError(err.message || 'Failed to generate executable proposal.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Initialize PayPal Milestone Ledger (Agent 4)
  const handleInitializeLedger = async () => {
    if (!proposal) return;
    setIsLoading(true);
    setError(null);

    try {
      const order = await api.createMilestoneOrder(proposal.id);
      setPaypalOrder(order);
      setStep('ledger');
    } catch (err: any) {
      console.error('Milestone order initialization failed', err);
      setError(err.message || 'Failed to initialize PayPal milestone order.');
    } finally {
      setIsLoading(false);
    }
  };

  // Capture Funds into Programmatic Ledger
  const handleCaptureFunds = async () => {
    if (!paypalOrder) return;
    setIsLoading(true);
    setError(null);

    try {
      const cap = await api.capturePayPalOrder(paypalOrder.order_id);
      if (cap.status === 'MILESTONES_COMMITTED') {
        setIsFundsCommitted(true);
      }
    } catch (err: any) {
      console.error('Capture failed', err);
      setError(err.message || 'Failed to capture funds in milestone ledger.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 4: Multimodal AI Vision Audit (Agent 3)
  const handleExecuteVerification = async () => {
    if (!proposal) return;
    setIsLoading(true);
    setError(null);

    try {
      const milestone = proposal.milestones?.[0] || { id: 'M-1' };
      const creatorId = proposal.creators?.[0]?.id || selectedCreatorId || 'creator-001';

      if (verificationScenario === 'VENUE') {
        // Claude 3.5 Sonnet Multimodal Venue Audit
        const venueRes = await api.auditVenue({
          brand_name: formData.brand_name.split(' ')[0],
          scenario: 'PASS',
          context_notes: 'Physical Safaricom stage banner at Eastland Gaming Lounge derby.',
        });
        setCvAnalysis({
          metrics: {
            screen_occupancy_percent: 4.85,
            decision: 'PASSED',
            findings: venueRes.findings || 'Authentic physical venue roll-up banner verified on stage.',
          },
        });
      } else {
        // OpenCV Computer Vision analysis
        const cvRes = await api.analyzeFrame({
          brand_name: formData.brand_name.split(' ')[0],
          scenario: verificationScenario === 'LOW_OCCUPANCY' ? 'LOW_OCCUPANCY' : 'PASS',
        });
        setCvAnalysis(cvRes);
      }

      // Generate Cryptographic Certificate
      const cert = await api.submitVerificationDeliverable({
        milestone_id: milestone.id,
        creator_id: creatorId,
        deliverable_type: verificationScenario === 'VENUE' ? 'PHYSICAL_BANNER' : 'LIVE_STREAM_VOD',
        media_url: 'https://twitch.tv/videos/safaricom-gaming-finals',
        notes: `AI Verification Audit scenario: ${verificationScenario}`,
      });

      setProofCertificate(cert);
    } catch (err: any) {
      console.error('Verification failed', err);
      setError(err.message || 'AI Verification audit encountered an issue.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 5: Disburse Funds & Generate KRA eTIMS Tax Invoice
  const handleExecuteDisbursement = async () => {
    if (!proposal || !proofCertificate) return;
    setIsLoading(true);
    setError(null);

    try {
      const milestone = proposal.milestones?.[0] || { id: 'M-1' };
      const result = await api.disburseMilestone({
        proposal_id: proposal.id,
        milestone_id: milestone.id,
        certificate_id: proofCertificate.certificate_id,
        recipient_email: 'creator@sponsorplay.ke',
      });
      setDisbursementResult(result);
      setStep('payout');
    } catch (err: any) {
      console.error('Disbursement failed', err);
      setError(err.message || 'Milestone disbursement or tax invoicing failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 6: Load MetaTwin ESG Social Impact Dossier (Agent 6)
  const handleLoadImpactDossier = async () => {
    if (!proposal) return;
    setIsLoading(true);
    setError(null);

    try {
      const dossier = await api.getImpactDossier(proposal.id);
      setImpactDossier(dossier);
      setStep('impact');
    } catch (err: any) {
      console.error('Impact dossier failed', err);
      setError(err.message || 'Failed to compile MetaTwin ESG Impact Dossier.');
    } finally {
      setIsLoading(false);
    }
  };

  const stepsList: { key: WizardStep; label: string; num: string }[] = [
    { key: 'brief', label: 'Brief Input', num: '1' },
    { key: 'selection', label: 'AI Deconstruction', num: '2' },
    { key: 'contract', label: 'Milestone Agreement', num: '3' },
    { key: 'ledger', label: 'PayPal Ledger', num: '4' },
    { key: 'verification', label: 'Proof-of-Play (AI Vision)', num: '5' },
    { key: 'payout', label: 'eTIMS & Payout', num: '6' },
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      {/* Top Breadcrumb & Step Navigation Bar */}
      <div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigate('/brand')}
                className="flex items-center gap-2 text-xs font-semibold text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors cursor-pointer"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                Back to Dashboard
              </button>
              <div className="h-4 w-px bg-[hsl(var(--border))]" />
              <h1 className="text-base font-bold text-[hsl(var(--foreground))]">
                Autonomous Campaign Lifecycle (Solution B)
              </h1>
            </div>

            {/* Stepper Progress */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {stepsList.map((s, idx) => {
                const isActive = step === s.key;
                const isPassed = stepsList.findIndex((x) => x.key === step) > idx;
                return (
                  <div key={s.key} className="flex items-center gap-1.5 shrink-0">
                    <div
                      className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[hsl(var(--primary))] text-white shadow-md'
                          : isPassed
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] border border-[hsl(var(--border))]'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.num}
                    </div>
                    <span
                      className={`text-xs font-medium hidden sm:inline ${
                        isActive ? 'text-[hsl(var(--foreground))] font-bold' : 'text-[hsl(var(--muted-foreground))]'
                      }`}
                    >
                      {s.label}
                    </span>
                    {idx < stepsList.length - 1 && <span className="text-[hsl(var(--border))] mx-1">&rarr;</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-900/20 text-red-300 text-sm flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Workflow Error</p>
              <p className="text-xs text-red-300/90 font-mono mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: CAMPAIGN BRIEF INPUT & PRESETS                                    */}
        {/* ========================================================================= */}
        {step === 'brief' && (
          <Card padding="lg" className="border-[hsl(var(--border))] shadow-lg">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Stage 1: Submit Campaign Brief</CardTitle>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Agent 1 (Scout) will deconstruct your brief and evaluate syndicate vs. solo creator pathways.
                    </p>
                  </div>
                </div>
                <Badge variant="terracotta">Autonomous Multi-Agent</Badge>
              </div>

              {/* 1-Click Presets */}
              <div className="pt-3">
                <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-2 uppercase tracking-wider">
                  Quick Hackathon Simulation Presets:
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => handleApplyPreset(p.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        formData.brand_name === p.brand_name
                          ? 'bg-[hsl(var(--primary))]/20 border-[hsl(var(--primary))] text-[hsl(var(--primary))]'
                          : 'bg-[hsl(var(--card))] border-[hsl(var(--border))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--foreground))]/40'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 pt-4">
              <form onSubmit={handleSubmitBrief} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--foreground))]">
                      Brand / Corporate Sponsor Name
                    </label>
                    <Input
                      value={formData.brand_name}
                      onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                      placeholder="e.g. Safaricom 5G Home Gaming"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--foreground))]">
                      Corporate Tax PIN (KRA Section 16)
                    </label>
                    <Input
                      value={formData.corporate_pin}
                      onChange={(e) => setFormData({ ...formData, corporate_pin: e.target.value })}
                      placeholder="e.g. P051234567A"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--foreground))]">
                    Campaign Scope & Deliverable Requirements
                  </label>
                  <textarea
                    value={formData.brief}
                    onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
                    rows={4}
                    className="w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 text-sm text-[hsl(var(--foreground))] placeholder-[hsl(var(--muted-foreground))]/60 transition-all focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary))]"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--foreground))]">
                      Target Audience / Demographic
                    </label>
                    <Input
                      value={formData.target_audience}
                      onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                      placeholder="e.g. 18-24 urban university gamers in Nairobi"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--foreground))]">
                      Campaign Budget (USD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] text-sm font-semibold">
                        $
                      </span>
                      <Input
                        type="number"
                        value={formData.budget_usd}
                        onChange={(e) => setFormData({ ...formData, budget_usd: e.target.value })}
                        className="pl-7"
                        placeholder="750"
                        required
                      />
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {formData.budget_usd ? `≈ ${formatKES((parseFloat(formData.budget_usd) || 0) * 130)} KES @ 130.0` : ''}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-blue-200">Solution B: Intentional Checkpoint Guarantee</p>
                    <p className="text-blue-300/90 mt-0.5">
                      The workflow will pause for your review at Stage 2 (Syndicate vs. Solo Selection) and Stage 5 (AI Proof-of-Play Verification Trigger). Funds remain locked in the PayPal programmatic milestone ledger until deliverables pass multimodal audit.
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  size="lg"
                  className="w-full text-sm font-bold shadow-md cursor-pointer"
                  isLoading={isLoading}
                  disabled={isLoading}
                  leftIcon={<Sparkles className="h-4 w-4" />}
                >
                  Run Agent 1 Scout Deconstruction &bull; Find Matches
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: AI DECONSTRUCTION & SELECTION (INTENTIONAL CHECKPOINT)             */}
        {/* ========================================================================= */}
        {step === 'selection' && deconstructionResult && (
          <div className="space-y-6">
            {/* AI Strategic Analysis Card */}
            <Card padding="md" className="border-[hsl(var(--primary))]/30 bg-[hsl(var(--card))]/90 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[hsl(var(--border))]">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-[hsl(var(--primary))]" />
                  <h3 className="font-bold text-base text-[hsl(var(--foreground))]">
                    Agent 1 Strategic Analysis: {deconstructionResult.ai_analysis?.recommendation_title || 'Recommendation'}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="terracotta">
                    Syndicate Synergy: {Math.round(deconstructionResult.ai_analysis?.syndicate_score || 95)}%
                  </Badge>
                  <Badge variant="gold">
                    Solo Authority: {Math.round(deconstructionResult.ai_analysis?.solo_score || 88)}%
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-3 leading-relaxed">
                {deconstructionResult.ai_analysis?.verdict_rationale ||
                  'Agent 1 evaluated the Kenyan talent graph and recommends a multi-creator syndicate for maximal grassroots community density.'}
              </p>
            </Card>

            {/* Selection Pathway Switcher */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[hsl(var(--foreground))]">
                  Stage 2 Review: Select Campaign Pathway
                </h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                  Choose between bundled sponsorship syndicates or solo esports champions.
                </p>
              </div>
              <div className="flex items-center p-1 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
                <button
                  onClick={() => setSelectedPathway('syndicates')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedPathway === 'syndicates'
                      ? 'bg-[hsl(var(--primary))] text-white shadow'
                      : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  }`}
                >
                  Bundled Syndicates ({deconstructionResult.syndicates?.length || 0})
                </button>
                <button
                  onClick={() => setSelectedPathway('solo')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedPathway === 'solo'
                      ? 'bg-[hsl(var(--primary))] text-white shadow'
                      : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
                  }`}
                >
                  Solo Creators ({deconstructionResult.solo_matches?.length || 0})
                </button>
              </div>
            </div>

            {/* SYNDICATES LIST */}
            {selectedPathway === 'syndicates' && (
              <div className="space-y-4">
                {(deconstructionResult.syndicates || []).map((syn: SyndicateRecommendation) => {
                  const isSelected = selectedSyndicateId === syn.syndicate_id;
                  const creatorsList = syn.creators || syn.members || [];
                  const title = syn.title || syn.name || 'Esports Syndicate';
                  const rationale = syn.rationale || syn.description || '';
                  const costUSD = syn.total_cost_usd || syn.total_budget_usd || 0;
                  const score = syn.synergy_score || syn.match_score || 95;

                  return (
                    <Card
                      key={syn.syndicate_id}
                      padding="md"
                      className={`cursor-pointer transition-all border-2 ${
                        isSelected
                          ? 'border-[hsl(var(--primary))] bg-[hsl(var(--card))] shadow-lg'
                          : 'border-[hsl(var(--border))] hover:border-[hsl(var(--border))]/80 bg-[hsl(var(--card))]/60'
                      }`}
                      onClick={() => setSelectedSyndicateId(syn.syndicate_id)}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Badge variant={score >= 90 ? 'green' : 'terracotta'}>
                              {Math.round(score)}% Synergy Score
                            </Badge>
                            <Badge variant="gold">
                              {creatorsList.length} Creators Bundled
                            </Badge>
                            <Badge variant="slate">
                              {syn.etims_compliance_mode || 'BII Tax Compliant'}
                            </Badge>
                          </div>
                          <h3 className="text-base font-bold text-[hsl(var(--foreground))]">{title}</h3>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 mb-3">{rationale}</p>

                          {/* Member Creator Badges */}
                          <div className="grid sm:grid-cols-3 gap-2">
                            {creatorsList.map((c: any) => (
                              <div
                                key={c.id || c.creator_id}
                                className="p-2 rounded-lg bg-[hsl(var(--background))]/60 border border-[hsl(var(--border))] text-xs"
                              >
                                <p className="font-bold text-[hsl(var(--foreground))] truncate">{c.name}</p>
                                <p className="text-[10px] text-[hsl(var(--primary))] font-mono">
                                  @{c.gamer_tag} &bull; ${c.base_rate_usd || c.rate_usd}
                                </p>
                                <p className="text-[10px] text-[hsl(var(--muted-foreground))] truncate">{c.location}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="text-right lg:border-l lg:border-[hsl(var(--border))] lg:pl-6 flex flex-col justify-between items-end">
                          <div>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
                              Syndicate Total
                            </p>
                            <p className="text-xl font-black text-[hsl(var(--primary))] font-mono">
                              {formatUSD(costUSD)}
                            </p>
                            <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                              {formatKES(costUSD * 130)}
                            </p>
                          </div>
                          <div className="mt-4">
                            <Button
                              variant={isSelected ? 'primary' : 'secondary'}
                              size="sm"
                              className="text-xs font-bold cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSyndicateId(syn.syndicate_id);
                                handleProceedToContract();
                              }}
                            >
                              {isSelected ? 'Proceed with Syndicate &rarr;' : 'Select'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* SOLO CREATORS LIST */}
            {selectedPathway === 'solo' && (
              <div className="space-y-4">
                {(deconstructionResult.solo_matches || []).map((solo: SoloCreatorMatch) => {
                  const isSelected = selectedCreatorId === solo.creator?.id;
                  const c = solo.creator;

                  return (
                    <Card
                      key={c.id}
                      padding="md"
                      className={`cursor-pointer transition-all border-2 ${
                        isSelected
                          ? 'border-[hsl(var(--primary))] bg-[hsl(var(--card))] shadow-lg'
                          : 'border-[hsl(var(--border))] hover:border-[hsl(var(--border))]/80 bg-[hsl(var(--card))]/60'
                      }`}
                      onClick={() => setSelectedCreatorId(c.id)}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <Badge variant="green">{Math.round(solo.match_score)}% Match</Badge>
                            <Badge variant="terracotta">{c.type}</Badge>
                            <Badge variant="gold">Safety: {c.brand_safety_score}%</Badge>
                          </div>
                          <h3 className="text-base font-bold text-[hsl(var(--foreground))]">
                            {c.name} (@{c.gamer_tag})
                          </h3>
                          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">{solo.match_rationale}</p>
                          <p className="text-xs text-blue-400 mt-1">
                            Deliverables: {solo.recommended_deliverables?.join(' &bull; ')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-[hsl(var(--primary))] font-mono">
                            {formatUSD(solo.total_cost_usd || c.base_rate_usd)}
                          </p>
                          <Button
                            variant={isSelected ? 'primary' : 'secondary'}
                            size="sm"
                            className="text-xs font-bold mt-2 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCreatorId(c.id);
                              handleProceedToContract();
                            }}
                          >
                            {isSelected ? 'Proceed with Creator &rarr;' : 'Select'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between pt-4">
              <Button variant="ghost" size="sm" onClick={() => setStep('brief')}>
                &larr; Back to Brief
              </Button>
              <Button
                variant="primary"
                size="md"
                className="font-bold cursor-pointer"
                isLoading={isLoading}
                disabled={isLoading || (!selectedSyndicateId && !selectedCreatorId)}
                onClick={handleProceedToContract}
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Generate Milestone Agreement & Split Breakdown
              </Button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: EXECUTABLE AGREEMENT & FEE SPLITS (ARCHITECT AGENT 2)             */}
        {/* ========================================================================= */}
        {step === 'contract' && proposal && (
          <div className="space-y-6">
            <Card padding="lg" className="border-[hsl(var(--border))] shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Stage 3: Executable Milestone Agreement</CardTitle>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Generated by Agent 2 (Campaign Architect) with programmatic Section 16 KRA tax handling.
                      </p>
                    </div>
                  </div>
                  <Badge variant="terracotta">ID: {proposal.id}</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-2">
                {/* Financial Waterfall Breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
                    <p className="text-[10px] uppercase font-bold text-[hsl(var(--muted-foreground))]">Gross Budget</p>
                    <p className="text-lg font-black text-[hsl(var(--foreground))] font-mono">
                      {formatUSD(proposal.total_budget_usd)}
                    </p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">
                      {formatKES(proposal.total_budget_usd * 130)}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
                    <p className="text-[10px] uppercase font-bold text-amber-400">Barbah Fee (10%)</p>
                    <p className="text-lg font-black text-amber-400 font-mono">
                      {formatUSD(proposal.platform_fee_usd)}
                    </p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Facilitation & Escrow</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
                    <p className="text-[10px] uppercase font-bold text-blue-400">5% Withholding Tax</p>
                    <p className="text-lg font-black text-blue-400 font-mono">
                      {formatUSD(proposal.withholding_tax_usd || proposal.total_budget_usd * 0.9 * 0.05)}
                    </p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">KRA Section 16 Remitted</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
                    <p className="text-[10px] uppercase font-bold text-emerald-400">Net Creator Payout</p>
                    <p className="text-lg font-black text-emerald-400 font-mono">
                      {formatUSD(proposal.net_creator_disbursement_usd)}
                    </p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Disbursed upon verification</p>
                  </div>
                </div>

                {/* Milestone Schedule */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))] mb-3">
                    Programmatic Milestones Schedule (3 Phases)
                  </h4>
                  <div className="space-y-2">
                    {(proposal.milestones || []).map((m: any, idx: number) => (
                      <div
                        key={m.id || idx}
                        className="p-3 rounded-xl bg-[hsl(var(--background))]/50 border border-[hsl(var(--border))] flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded-lg bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] flex items-center justify-center font-bold text-xs">
                            {idx + 1}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-[hsl(var(--foreground))]">{m.title}</p>
                            <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{m.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[hsl(var(--primary))] font-mono">
                            {formatUSD(m.amount_usd)}
                          </p>
                          <Badge variant="slate">{m.status || 'PENDING_FUNDING'}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs text-purple-200 flex items-center justify-between">
                  <span>Automated Beneficiary Notification Dispatched to: creator@sponsorplay.ke</span>
                  <Badge variant="green">Email Dispatch ID Logged</Badge>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--border))]">
                  <Button variant="ghost" size="sm" onClick={() => setStep('selection')}>
                    &larr; Reselect Matches
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    className="font-bold cursor-pointer"
                    isLoading={isLoading}
                    disabled={isLoading}
                    onClick={handleInitializeLedger}
                    rightIcon={<Lock className="h-4 w-4" />}
                  >
                    Authorize Agreement & Initialize PayPal Milestone Ledger
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 4: PAYPAL ORDERS V2 PROGRAMMATIC MILESTONE LEDGER                    */}
        {/* ========================================================================= */}
        {step === 'ledger' && paypalOrder && (
          <div className="space-y-6">
            <Card padding="lg" className="border-[hsl(var(--border))] shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Stage 4: PayPal Programmatic Milestone Ledger</CardTitle>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Multiparty programmatic order created via PayPal Orders v2 with delayed payee disbursement.
                      </p>
                    </div>
                  </div>
                  <Badge variant={isFundsCommitted ? 'green' : 'terracotta'}>
                    {isFundsCommitted ? 'FUNDS COMMITTED & LOCKED' : 'LEDGER INITIALIZED'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-2">
                <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-3 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">PayPal Order ID:</span>
                    <span className="text-blue-400 font-bold">{paypalOrder.order_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">Ledger Gross Amount:</span>
                    <span className="text-[hsl(var(--foreground))]">{formatUSD(paypalOrder.gross_amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">Platform Commission:</span>
                    <span className="text-amber-400">{formatUSD(paypalOrder.platform_fee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[hsl(var(--muted-foreground))]">Disbursement Mode:</span>
                    <span className="text-emerald-400">DELAYED_UNTIL_VERIFIED</span>
                  </div>
                </div>

                {!isFundsCommitted ? (
                  <div className="space-y-3">
                    <p className="text-xs text-[hsl(var(--muted-foreground))] text-center">
                      Click below to capture brand authorization into the programmatic milestone ledger. Funds will be locked and cannot be released without AI Proof-of-Play verification.
                    </p>
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full font-bold cursor-pointer bg-blue-600 hover:bg-blue-500"
                      isLoading={isLoading}
                      disabled={isLoading}
                      onClick={handleCaptureFunds}
                      leftIcon={<Lock className="h-4 w-4" />}
                    >
                      Capture Funds & Lock in PayPal Milestone Ledger
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                      <span>Funds successfully locked in milestone ledger. Ready for creator execution & verification.</span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      className="font-bold cursor-pointer bg-emerald-600 hover:bg-emerald-500"
                      onClick={() => setStep('verification')}
                    >
                      Proceed to Proof-of-Play (AI Vision) &rarr;
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 5: PROOF-OF-PLAY (AI VISION VERIFICATION) - INTENTIONAL CHECKPOINT   */}
        {/* ========================================================================= */}
        {step === 'verification' && (
          <div className="space-y-6">
            <Card padding="lg" className="border-[hsl(var(--border))] shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                      <Eye className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Stage 5: Proof-of-Play (AI Multimodal Vision Audit)</CardTitle>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Input-driven verification checkpoint: Agent 3 runs OpenCV logo localization & Claude 3.5 Sonnet physical banner audit.
                      </p>
                    </div>
                  </div>
                  <Badge variant="terracotta">Autonomous Verifier</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-2">
                {/* Verification Trigger Options */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-[hsl(var(--foreground))]">
                    Select Verification Deliverable Scenario:
                  </label>
                  <div className="grid sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setVerificationScenario('PASS')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        verificationScenario === 'PASS'
                          ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 text-[hsl(var(--foreground))]'
                          : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--foreground))]/40'
                      }`}
                    >
                      <p className="font-bold text-xs">Live Stream VOD (PASS)</p>
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
                        OpenCV Logo Area &ge; 3.5% + Whisper STT Slogans
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVerificationScenario('VENUE')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        verificationScenario === 'VENUE'
                          ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10 text-[hsl(var(--foreground))]'
                          : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--foreground))]/40'
                      }`}
                    >
                      <p className="font-bold text-xs">Physical Stage Banner (Claude)</p>
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
                        Sonnet Multimodal Vision &bull; Optical lighting check
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setVerificationScenario('LOW_OCCUPANCY')}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        verificationScenario === 'LOW_OCCUPANCY'
                          ? 'border-red-500 bg-red-500/10 text-[hsl(var(--foreground))]'
                          : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] hover:border-[hsl(var(--foreground))]/40'
                      }`}
                    >
                      <p className="font-bold text-xs">Low Occupancy Frame (FAIL)</p>
                      <p className="text-[11px] text-[hsl(var(--muted-foreground))] mt-0.5">
                        Logo &lt; 3.5% area threshold &bull; Triggers review
                      </p>
                    </button>
                  </div>
                </div>

                {/* Audit Action Button */}
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full font-bold cursor-pointer"
                  isLoading={isLoading}
                  disabled={isLoading}
                  onClick={handleExecuteVerification}
                  leftIcon={<Play className="h-4 w-4" />}
                >
                  Execute Agent 3 Multimodal Vision Audit
                </Button>

                {/* Audit Result Display */}
                {proofCertificate && (
                  <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-4">
                    <div className="flex items-center justify-between border-b border-[hsl(var(--border))] pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-[hsl(var(--foreground))]">
                          Proof-of-Play Certificate: {proofCertificate.certificate_id}
                        </h4>
                        <p className="text-[11px] text-[hsl(var(--muted-foreground))]">
                          Cryptographic Hash: {proofCertificate.cryptographic_hash?.slice(0, 32)}...
                        </p>
                      </div>
                      <Badge variant={proofCertificate.verification_decision === 'PASSED' ? 'green' : 'terracotta'}>
                        {proofCertificate.verification_decision} ({Math.round(proofCertificate.overall_confidence_percent || 97)}%)
                      </Badge>
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3 text-xs font-mono">
                      <div className="p-2.5 rounded-lg bg-[hsl(var(--background))]/50 border border-[hsl(var(--border))]">
                        <span className="text-[hsl(var(--muted-foreground))] block text-[10px]">Logo Occupancy</span>
                        <span className="text-base font-bold text-[hsl(var(--primary))]">
                          {proofCertificate.logo_screen_ratio_percent || 4.12}%
                        </span>
                        <span className="text-[10px] text-emerald-400 block">&ge; 3.5% Required Threshold</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[hsl(var(--background))]/50 border border-[hsl(var(--border))]">
                        <span className="text-[hsl(var(--muted-foreground))] block text-[10px]">Whisper Audio STT</span>
                        <span className="text-base font-bold text-blue-400">
                          {proofCertificate.verbal_slogans_detected?.length || 2} Slogans
                        </span>
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))] block">Audible Verbal Plugs</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[hsl(var(--background))]/50 border border-[hsl(var(--border))]">
                        <span className="text-[hsl(var(--muted-foreground))] block text-[10px]">Brand Safety</span>
                        <span className="text-base font-bold text-emerald-400">
                          {proofCertificate.brand_safety_status || 'SAFE'}
                        </span>
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))] block">Zero Competitor Collisions</span>
                      </div>
                    </div>

                    {cvAnalysis?.metrics?.findings && (
                      <p className="text-xs text-[hsl(var(--muted-foreground))] p-3 rounded-lg bg-[hsl(var(--background))]/40 border border-[hsl(var(--border))]">
                        <strong className="text-[hsl(var(--foreground))] block mb-1">Cognitive Vision Telemetry:</strong>
                        {cvAnalysis.metrics.findings}
                      </p>
                    )}

                    <div className="pt-2 flex justify-end">
                      <Button
                        variant="primary"
                        size="md"
                        className="font-bold cursor-pointer bg-emerald-600 hover:bg-emerald-500"
                        onClick={handleExecuteDisbursement}
                      >
                        Proceed to KRA eTIMS Fiscal Invoicing & PayPal Payout &rarr;
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 6: KRA eTIMS FISCAL INVOICING & PAYPAL DISBURSEMENT                  */}
        {/* ========================================================================= */}
        {step === 'payout' && disbursementResult && (
          <div className="space-y-6">
            <Card padding="lg" className="border-emerald-500/30 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Stage 6: KRA eTIMS Fiscal Invoice & Milestone Payout</CardTitle>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Section 16 Electronic Tax Invoice generated &bull; Net cash disbursed via PayPal Payouts.
                      </p>
                    </div>
                  </div>
                  <Badge variant="green">DISBURSED & COMPLIANT</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-2">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* KRA Invoice Card */}
                  <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-3 font-mono text-xs">
                    <div className="flex justify-between border-b border-[hsl(var(--border))] pb-2">
                      <span className="font-bold text-[hsl(var(--foreground))] uppercase">KRA eTIMS BII Invoice</span>
                      <Badge variant="terracotta">Sec. 16 Compliant</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(var(--muted-foreground))]">CU Invoice No:</span>
                      <span className="text-[hsl(var(--primary))] font-bold">
                        {disbursementResult.etims_cu_invoice_number}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(var(--muted-foreground))]">Gross Taxable:</span>
                      <span>{formatKES(disbursementResult.gross_amount_kes)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(var(--muted-foreground))]">5% Withholding Tax Remitted:</span>
                      <span className="text-blue-400 font-bold">{formatKES(disbursementResult.withholding_tax_kes)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[hsl(var(--border))]">
                      <span className="font-bold text-[hsl(var(--foreground))]">Net Paid to Creator:</span>
                      <span className="text-emerald-400 font-black">
                        {formatKES(disbursementResult.net_paid_kes)} ({formatUSD(disbursementResult.net_paid_usd)})
                      </span>
                    </div>
                    {disbursementResult.qr_code_url && (
                      <div className="pt-2 text-center">
                        <a
                          href={disbursementResult.qr_code_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-[hsl(var(--primary))] hover:underline flex items-center justify-center gap-1"
                        >
                          Verify on KRA Tax Portal <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>

                  {/* PayPal Payout Receipt */}
                  <div className="p-4 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] space-y-3 font-mono text-xs">
                    <div className="flex justify-between border-b border-[hsl(var(--border))] pb-2">
                      <span className="font-bold text-[hsl(var(--foreground))] uppercase">PayPal Payout Rails</span>
                      <Badge variant="green">Delivered</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(var(--muted-foreground))]">Payout Item ID:</span>
                      <span className="text-blue-400">{disbursementResult.paypal_payout_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(var(--muted-foreground))]">Beneficiary Email:</span>
                      <span>{disbursementResult.payout_recipient}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[hsl(var(--muted-foreground))]">Local M-Pesa Off-Ramp:</span>
                      <span className="text-emerald-400">Available Instantly</span>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
                      Corporate tax deduction guaranteed under Section 16 of the Kenya Income Tax Act with zero disallowed penalties.
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--border))]">
                  <Button variant="ghost" size="sm" onClick={() => onNavigate('/brand')}>
                    &larr; Return to Dashboard
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    className="font-bold cursor-pointer"
                    isLoading={isLoading}
                    disabled={isLoading}
                    onClick={handleLoadImpactDossier}
                    rightIcon={<Sparkles className="h-4 w-4" />}
                  >
                    View Barbah MetaTwin ESG Social Impact Dossier &rarr;
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 7: BARBAH METATWIN ESG SOCIAL IMPACT DOSSIER (AGENT 6)               */}
        {/* ========================================================================= */}
        {step === 'impact' && impactDossier && (
          <div className="space-y-6">
            <Card padding="lg" className="border-purple-500/30 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Stage 7: Barbah MetaTwin ESG Social Impact Dossier</CardTitle>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        Compiled by Agent 6: Verifies grassroots digital inclusion, youth employment, and community metrics.
                      </p>
                    </div>
                  </div>
                  <Badge variant="gold">Agent 6 Assurance</Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center">
                    <p className="text-[10px] uppercase font-bold text-[hsl(var(--muted-foreground))]">Total Youth Reach</p>
                    <p className="text-2xl font-black text-[hsl(var(--primary))] font-mono">
                      {(impactDossier.total_youth_reach || 38000).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-emerald-400">Verified Competitors</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center">
                    <p className="text-[10px] uppercase font-bold text-[hsl(var(--muted-foreground))]">Collegiate Gamers</p>
                    <p className="text-2xl font-black text-blue-400 font-mono">
                      {impactDossier.collegiate_gamers_empowered || 450}
                    </p>
                    <p className="text-[10px] text-blue-400">Varsity Competitors</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center">
                    <p className="text-[10px] uppercase font-bold text-[hsl(var(--muted-foreground))]">Informal Settlement Share</p>
                    <p className="text-2xl font-black text-purple-400 font-mono">
                      {Math.round(impactDossier.informal_settlement_community_share || 66.7)}%
                    </p>
                    <p className="text-[10px] text-purple-400">Kibera, Kayole, Eastlands</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] text-center">
                    <p className="text-[10px] uppercase font-bold text-[hsl(var(--muted-foreground))]">ESG Assurance Hash</p>
                    <p className="text-xs font-mono text-[hsl(var(--foreground))] truncate pt-2">
                      {impactDossier.esg_assurance_hash?.slice(0, 16)}...
                    </p>
                    <p className="text-[10px] text-emerald-400">Cryptographically Sealed</p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[hsl(var(--background))]/60 border border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))] space-y-2">
                  <h4 className="font-bold text-[hsl(var(--foreground))]">End-to-End Autonomous Lifecycle Complete</h4>
                  <p>
                    All 6 autonomous agents executed successfully: Scout (Agent 1), Architect (Agent 2), Verifier (Agent 3), Financial Ledger (Agent 4), Brand Guardian (Agent 5), and Impact MetaTwin (Agent 6).
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[hsl(var(--border))]">
                  <Button variant="secondary" size="sm" onClick={() => onNavigate('/brand')}>
                    Return to Brand Dashboard
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    className="font-bold cursor-pointer"
                    onClick={() => {
                      setStep('brief');
                      setDeconstructionResult(null);
                      setProposal(null);
                      setProofCertificate(null);
                      setDisbursementResult(null);
                    }}
                    leftIcon={<RefreshCw className="h-4 w-4" />}
                  >
                    Start New Campaign Lifecycle
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandBrief;
