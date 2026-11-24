/* ============================================================================
   SponsorPlay workflow client

   Talks to the product contract in `app/api/workflow.py`. Kept separate from
   the legacy `api.ts` so the new pages do not inherit the old shapes.
   ============================================================================ */

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');
const TOKEN_COOKIE = 'dhamini_session';
const ROLE_COOKIE = 'dhamini_role';

export type WorkflowRole = 'BRAND_ADMIN' | 'BRAND_MEMBER' | 'OPS_ADMIN' | 'CREATOR';

export interface Principal {
  user_id: string;
  email: string;
  name: string;
  role: WorkflowRole;
  org_id: string | null;
  creator_id: string | null;
  is_ops: boolean;
  is_brand: boolean;
}

export interface Creator {
  id: string;
  name: string;
  gamer_tag: string | null;
  type: string | null;
  primary_game: string | null;
  platform: string | null;
  channel_url: string | null;
  location: string | null;
  monthly_reach: number;
  base_rate_minor: number;
  base_rate: number;
  currency: string;
  brand_safety_score: number;
  channel_verified: boolean;
  tax_profile_status: string;
}

export interface Campaign {
  id: string;
  org_id: string;
  brand_name: string;
  brief: string;
  target_audience: string | null;
  objective: string | null;
  kpi: string | null;
  geography: string | null;
  budget_minor: number;
  budget: number;
  currency: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SyndicateMember {
  creator: Creator;
  role_in_syndicate: string | null;
  allocation_pct: number;
}

export interface Syndicate {
  id: string;
  campaign_id: string;
  title: string;
  rationale: string | null;
  expected_reach: number;
  status: string;
  members: SyndicateMember[];
}

export interface SoloMatch {
  creator: Creator;
  match_score: number;
  match_rationale: string;
  total_cost_minor: number;
  total_cost: number;
  currency: string;
}

export interface MatchRun {
  id: string;
  campaign_id: string;
  agent_version: string;
  model: string;
  created_at: string;
  analysis: {
    target_summary?: string;
    detected_intent?: string;
    recommended_path?: string;
    recommendation_title?: string;
    verdict_rationale?: string;
    syndicate_score?: number;
    solo_score?: number;
    reach_comparison?: { syndicate_reach: number; solo_reach: number };
    limitations?: string[];
  };
  syndicates: Syndicate[];
  solo_matches: SoloMatch[];
}

export interface EvidenceRequirement {
  key: string;
  label: string;
  kind: 'IMAGE' | 'FILE' | 'URL' | string;
  required: boolean;
  min_count?: number;
  accepted_types?: string[];
  accepted_hosts?: string[];
  min_width?: number;
  instructions?: string;
}

export interface Milestone {
  id: string;
  proposal_id: string;
  seq: number;
  title: string;
  description: string | null;
  amount_minor: number;
  amount: number;
  currency: string;
  due_at: string | null;
  evidence_requirements: EvidenceRequirement[];
  acceptance_criteria: string[];
  review_sla_hours: number;
  revision_window_hours: number;
  status: string;
  status_family: string;
}

export interface Offer {
  id: string;
  proposal_id: string;
  creator_id: string;
  creator: Creator | null;
  allocation_minor: number;
  allocation: number;
  currency: string;
  status: string;
  status_family: string;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  declined_at: string | null;
  decline_reason: string | null;
  token_expires_at: string | null;
  magic_link?: string | null;
}

export interface Proposal {
  id: string;
  campaign_id: string;
  org_id: string;
  brand_name: string | null;
  syndicate_id: string | null;
  version: number;
  status: string;
  status_family: string;
  total_minor: number;
  total: number;
  currency: string;
  fx_rate: number;
  platform_fee_minor: number;
  platform_fee: number;
  creator_pool_minor: number;
  creator_pool: number;
  withholding_minor: number;
  withholding: number;
  net_creator_minor: number;
  net_creator: number;
  legal_clauses: string[];
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  milestones: Milestone[];
  offers: Offer[];
}

export interface ValidationIssue {
  severity: 'BLOCKING' | 'WARNING';
  code: string;
  message: string;
  field?: string;
}

export interface ValidationResult {
  ok: boolean;
  blocking: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface Evidence {
  id: string;
  milestone_id: string;
  offer_id: string | null;
  requirement_key: string | null;
  kind: string;
  label: string | null;
  original_filename: string | null;
  content_type: string | null;
  size_bytes: number;
  sha256: string | null;
  url: string | null;
  external_url: string | null;
  metadata: Record<string, any>;
  captured_at: string | null;
  submitted_at: string | null;
  created_at: string;
}

export interface VerificationCheck {
  key: string;
  label: string;
  required: boolean;
  result: 'PASS' | 'FAIL' | 'INCONCLUSIVE';
  confidence: number;
  method: string;
  detail: string;
  artifacts: Array<{ kind: string; url?: string }>;
}

export interface VerificationReport {
  id: string;
  milestone_id: string;
  agent_version: string;
  model: string;
  started_at: string;
  completed_at: string;
  checks: VerificationCheck[];
  metrics: Record<string, any>;
  limitations: string[];
  recommended_decision: 'APPROVE' | 'REQUEST_CHANGES' | 'HUMAN_REVIEW';
  summary: string;
  created_at: string;
}

export interface ReviewDecision {
  id: string;
  milestone_id: string;
  reviewer_id: string;
  decision: string;
  reason: string | null;
  overrode_recommendation: boolean;
  decided_at: string;
}

export interface ReviewCase {
  offer_id: string;
  milestone: Milestone;
  proposal: Proposal;
  campaign: Campaign;
  creator: Creator | null;
  evidence: Evidence[];
  report: VerificationReport | null;
  decision: ReviewDecision | null;
  age_hours: number;
  sla_breached: boolean;
  payout?: Payout;
}

export interface Payout {
  id: string;
  milestone_id: string;
  offer_id: string;
  amount_minor: number;
  amount: number;
  currency: string;
  status: string;
  provider: string | null;
  provider_ref: string | null;
  invoice: Invoice | null;
}

export interface Invoice {
  id: string;
  milestone_id: string | null;
  proposal_id: string | null;
  invoice_type: string;
  amount_minor: number;
  amount: number;
  tax_minor: number;
  tax: number;
  currency: string;
  status: string;
  etims_ref: string | null;
  issued_at: string;
}

export interface LedgerEntry {
  id: string;
  account: string;
  direction: 'CREDIT' | 'DEBIT';
  amount_minor: number;
  amount: number;
  currency: string;
  ref_type: string | null;
  ref_id: string | null;
  description: string | null;
  created_at: string;
}

export interface MoneySummary {
  proposal_id: string;
  committed_minor: number;
  committed: number;
  released_minor: number;
  released: number;
  remaining_minor: number;
  remaining: number;
  currency: string;
  ledger: LedgerEntry[];
  invoices: Invoice[];
}

export interface PublicOffer {
  offer: Offer;
  proposal: Proposal;
  campaign: Campaign;
  brand_name: string;
  milestones: Milestone[];
  requires_account: boolean;
  expires_at: string | null;
}

export interface CreatorMilestoneView {
  milestone: Milestone;
  offer_id: string;
  proposal_id: string;
  brand_name: string;
  evidence: Evidence[];
  report: VerificationReport | null;
  decision: ReviewDecision | null;
}

export interface CreatorCampaignView {
  offer: Offer;
  proposal: Proposal;
  campaign: Campaign;
  milestones: CreatorMilestoneView[];
}

export interface CreatorHome {
  creator: Creator;
  offers: Offer[];
  campaigns: Array<{
    offer: Offer;
    proposal: Proposal;
    campaign: Campaign;
    milestones: Milestone[];
  }>;
  earnings_minor: number;
  earnings: number;
  currency: string;
}

export interface EmailPreview {
  offer_id: string;
  creator_id: string;
  recipient: string;
  subject: string;
  html: string;
  text: string;
  link: string | null;
  sent: boolean;
}

export interface AuditEvent {
  id: string;
  actor_id: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string;
  before: any;
  after: any;
  created_at: string;
}

/* ---- session helpers ---- */

export function setWorkflowSession(token: string, role: 'brand' | 'creator' | 'ops') {
  document.cookie = `${TOKEN_COOKIE}=${token}; path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`;
  document.cookie = `${ROLE_COOKIE}=${role}; path=/; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`;
}

export function getToken(): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${TOKEN_COOKIE}=([^;]+)`));
  return match ? match[2] : null;
}

export function clearWorkflowSession() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = `${ROLE_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export class WorkflowError extends Error {
  status: number;
  code?: string;
  details?: any;
  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = 'WorkflowError';
  }
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const isForm = typeof FormData !== 'undefined' && init.body instanceof FormData;
  const headers: Record<string, string> = {
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((init.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'include' });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    let code: string | undefined;
    let details: any;
    try {
      const body = await res.json();
      message = body.detail || message;
      code = body.code;
      details = body.details;
    } catch {
      /* ignore */
    }
    throw new WorkflowError(message, res.status, code, details);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

function post<T>(path: string, body?: any): Promise<T> {
  return call<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) });
}

function patch<T>(path: string, body: any): Promise<T> {
  return call<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
}

/* ---- auth ---- */

export async function login(identifier: string, password: string): Promise<{
  token: string;
  principal: Principal;
  redirect_url: string;
}> {
  const res = await post<{ token: string; principal: Principal; redirect_url: string }>(
    '/api/v1/auth/workflow-login',
    { identifier, password }
  );
  const role = res.principal.is_ops ? 'ops' : res.principal.is_brand ? 'brand' : 'creator';
  setWorkflowSession(res.token, role);
  return res;
}

export function logout(): Promise<any> {
  return post('/api/v1/auth/workflow-logout').catch(() => undefined);
}

export function me(): Promise<Principal> {
  return call<Principal>('/api/v1/workflow/me');
}

/* ---- campaigns ---- */

export function listCreators(): Promise<Creator[]> {
  return call<Creator[]>('/api/v1/workflow/creators');
}

export function createCampaign(payload: {
  brief: string;
  target_audience?: string;
  objective?: string;
  kpi?: string;
  geography?: string;
  budget: number;
  currency?: string;
  brand_name?: string;
}): Promise<Campaign> {
  return post<Campaign>('/api/v1/campaigns', payload);
}

export function listCampaigns(): Promise<Campaign[]> {
  return call<Campaign[]>('/api/v1/campaigns');
}

export function getCampaign(id: string): Promise<Campaign> {
  return call<Campaign>(`/api/v1/campaigns/${id}`);
}

export function getMatches(id: string): Promise<MatchRun> {
  return call<MatchRun>(`/api/v1/campaigns/${id}/matches`);
}

export function patchSyndicate(
  campaignId: string,
  syndicateId: string,
  payload: { add_creator_ids?: string[]; remove_creator_ids?: string[] }
): Promise<Syndicate> {
  return patch<Syndicate>(`/api/v1/campaigns/${campaignId}/syndicates/${syndicateId}`, payload);
}

/* ---- proposals ---- */

export function createProposal(
  campaignId: string,
  payload: { syndicate_id?: string; creator_ids?: string[]; total_budget?: number; currency?: string }
): Promise<Proposal> {
  return post<Proposal>(`/api/v1/campaigns/${campaignId}/proposals`, payload);
}

export function listProposals(campaignId: string): Promise<Proposal[]> {
  return call<Proposal[]>(`/api/v1/campaigns/${campaignId}/proposals`);
}

export function getProposal(id: string): Promise<Proposal> {
  return call<Proposal>(`/api/v1/proposals/${id}`);
}

export function patchProposal(id: string, payload: any): Promise<Proposal> {
  return patch<Proposal>(`/api/v1/proposals/${id}`, payload);
}

export function validateProposal(id: string): Promise<ValidationResult> {
  return post<ValidationResult>(`/api/v1/proposals/${id}/validate`);
}

export function submitProposal(id: string): Promise<Proposal> {
  return post<Proposal>(`/api/v1/proposals/${id}/submit-for-approval`);
}

export function approveProposal(id: string): Promise<Proposal> {
  return post<Proposal>(`/api/v1/proposals/${id}/approve`);
}

export function sendProposal(id: string): Promise<Proposal> {
  return post<Proposal>(`/api/v1/proposals/${id}/send`);
}

export function cancelProposal(id: string, reason?: string): Promise<Proposal> {
  return post<Proposal>(`/api/v1/proposals/${id}/cancel`, { reason });
}

export function emailPreview(id: string, offerId?: string): Promise<EmailPreview> {
  const query = offerId ? `?offer_id=${encodeURIComponent(offerId)}` : '';
  return call<EmailPreview>(`/api/v1/proposals/${id}/email-preview${query}`);
}

export function proposalAudit(id: string): Promise<AuditEvent[]> {
  return call<AuditEvent[]>(`/api/v1/proposals/${id}/audit`);
}

export function acceptCounter(proposalId: string, offerId: string): Promise<Proposal> {
  return post<Proposal>(`/api/v1/proposals/${proposalId}/offers/${offerId}/accept-counter`);
}

export function declineCounter(proposalId: string, offerId: string): Promise<Proposal> {
  return post<Proposal>(`/api/v1/proposals/${proposalId}/offers/${offerId}/decline-counter`);
}

/* ---- public offers ---- */

export function getOffer(token: string): Promise<PublicOffer> {
  return call<PublicOffer>(`/api/v1/offers/${token}`);
}

export function claimOffer(
  token: string,
  payload: { full_name?: string; password?: string; confirm_payout_ref?: string }
): Promise<{ token: string; principal: Principal; offer_id: string; redirect_url: string }> {
  return post(`/api/v1/offers/${token}/claim`, payload);
}

export function acceptOffer(token: string, payload: { full_name?: string; confirm_payout_ref?: string }): Promise<any> {
  return post(`/api/v1/offers/${token}/accept`, payload);
}

export function counterOffer(
  token: string,
  payload: { amount: number; message?: string; scope_changes?: string[]; proposed_dates?: any }
): Promise<any> {
  return post(`/api/v1/offers/${token}/counter`, payload);
}

export function declineOffer(token: string, payload: { reason?: string }): Promise<any> {
  return post(`/api/v1/offers/${token}/decline`, payload);
}

/* ---- creator ---- */

export function creatorHome(): Promise<CreatorHome> {
  return call<CreatorHome>('/api/v1/creator/me');
}

export function creatorCampaign(proposalId: string): Promise<CreatorCampaignView> {
  return call<CreatorCampaignView>(`/api/v1/creator/campaigns/${proposalId}`);
}

export function uploadEvidence(
  milestoneId: string,
  payload: {
    requirement_key: string;
    kind: string;
    label?: string;
    url?: string;
    file?: File | null;
  }
): Promise<Evidence> {
  const form = new FormData();
  form.append('requirement_key', payload.requirement_key);
  form.append('kind', payload.kind);
  if (payload.label) form.append('label', payload.label);
  if (payload.url) form.append('url', payload.url);
  if (payload.file) form.append('file', payload.file);
  return call<Evidence>(`/api/v1/creator/milestones/${milestoneId}/evidence`, {
    method: 'POST',
    body: form,
  });
}

export function deleteEvidence(evidenceId: string): Promise<any> {
  return call(`/api/v1/creator/evidence/${evidenceId}`, { method: 'DELETE' });
}

export function submitMilestone(milestoneId: string): Promise<ReviewCase> {
  return post<ReviewCase>(`/api/v1/creator/milestones/${milestoneId}/submit`);
}

/* ---- ops ---- */

export function opsQueue(): Promise<ReviewCase[]> {
  return call<ReviewCase[]>('/api/v1/ops/queue');
}

export function opsCase(milestoneId: string, offerId: string): Promise<ReviewCase> {
  return call<ReviewCase>(`/api/v1/ops/milestones/${milestoneId}/offers/${offerId}`);
}

export function opsDecide(
  milestoneId: string,
  payload: { offer_id: string; decision: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT'; reason?: string }
): Promise<ReviewCase> {
  return post<ReviewCase>(`/api/v1/ops/milestones/${milestoneId}/decision`, payload);
}

/* ---- money ---- */

export function createFundingIntent(
  proposalId: string,
  idempotencyKey: string,
  amount?: number
): Promise<{ id: string; status: string; amount: number; currency: string }> {
  return call('/api/v1/payments/funding-intents', {
    method: 'POST',
    headers: { 'Idempotency-Key': idempotencyKey },
    body: JSON.stringify({ proposal_id: proposalId, amount }),
  });
}

export function captureFunding(intentId: string): Promise<{ intent: any; proposal: Proposal }> {
  return post(`/api/v1/payments/funding-intents/${intentId}/capture`);
}

export function moneySummary(proposalId: string): Promise<MoneySummary> {
  return call<MoneySummary>(`/api/v1/proposals/${proposalId}/money`);
}

/* ---- demo ---- */

export function demoReset(scenario?: string): Promise<any> {
  return post(`/api/v1/demo/reset${scenario ? `?scenario=${encodeURIComponent(scenario)}` : ''}`);
}

export function demoSeed(scenario: string): Promise<any> {
  return post(`/api/v1/demo/seed/${scenario}`);
}

/* ---- formatting ---- */

export function money(amount: number, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency,
      maximumFractionDigits: currency === 'KES' ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function shortDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export const workflow = {
  login,
  logout,
  me,
  listCreators,
  createCampaign,
  listCampaigns,
  getCampaign,
  getMatches,
  patchSyndicate,
  createProposal,
  listProposals,
  getProposal,
  patchProposal,
  validateProposal,
  submitProposal,
  approveProposal,
  sendProposal,
  cancelProposal,
  emailPreview,
  proposalAudit,
  acceptCounter,
  declineCounter,
  getOffer,
  claimOffer,
  acceptOffer,
  counterOffer,
  declineOffer,
  creatorHome,
  creatorCampaign,
  uploadEvidence,
  deleteEvidence,
  submitMilestone,
  opsQueue,
  opsCase,
  opsDecide,
  createFundingIntent,
  captureFunding,
  moneySummary,
  demoReset,
  demoSeed,
};

export default workflow;
