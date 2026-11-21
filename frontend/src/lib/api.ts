/* ============================================================================
   DHAMINI — API Client
   Cookie-based session storage. Tokens are held in a SameSite=Strict cookie,
   never in localStorage or exposed in memory longer than needed.
   ============================================================================ */

import type {
  LoginRequest,
  LoginResponse,
  DemoAccountsResponse,
  CreatorProfile,
  CampaignBrief,
  SyndicateRecommendation,
  Proposal,
  CreatorDashboardResponse,
  eTIMSInvoice,
  CreatorCollaborationMessage,
  DeliverableSubmissionRequest,
  MilestonePayoutResult,
  UserRole,
} from '@/types/index';

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

/* ---- Cookie helpers (secure, SameSite=Strict) ---- */

const TOKEN_COOKIE = 'dhamini_session';
const ROLE_COOKIE = 'dhamini_role';

export function setSession(token: string, role: UserRole) {
  document.cookie = `${TOKEN_COOKIE}=${token}; path=/; SameSite=Strict; Secure; Max-Age=${60 * 60 * 24 * 7}`;
  document.cookie = `${ROLE_COOKIE}=${role}; path=/; SameSite=Strict; Secure; Max-Age=${60 * 60 * 24 * 7}`;
}

export function getSessionToken(): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${TOKEN_COOKIE}=([^;]+)`));
  return match ? match[2] : null;
}

export function getSessionRole(): UserRole | null {
  const match = document.cookie.match(new RegExp(`(^| )${ROLE_COOKIE}=([^;]+)`));
  return match ? (match[2] as UserRole) : null;
}

export function clearSession() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  document.cookie = `${ROLE_COOKIE}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

/* ---- Fetch wrapper ---- */

class ApiError extends Error {
  status: number;
  detail: string;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.detail = message;
    this.name = 'ApiError';
  }
}

async function request<T>(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<T> {
  const token = getSessionToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(init.headers as Record<string, string> || {}),
  };

  const res = await fetch(`${API_BASE}${input}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as ApiError;
      detail = body.detail || detail;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(detail, res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

/* ---- Auth ---- */

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await request<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });

  // Persist session in secure cookie
  setSession(res.token, res.role);

  return res;
}

export async function logout(): Promise<void> {
  try {
    await request('/api/v1/auth/logout', { method: 'POST' });
  } catch {
    // ignore — clear session anyway
  }
  clearSession();
}

export async function getDemoAccounts(): Promise<DemoAccountsResponse> {
  return request<DemoAccountsResponse>('/api/v1/auth/demo-accounts');
}

/* ---- Campaigns ---- */

export async function listCreators(): Promise<CreatorProfile[]> {
  return request<CreatorProfile[]>('/api/v1/campaigns/creators');
}

export async function getCreator(creatorId: string): Promise<CreatorProfile> {
  return request<CreatorProfile>(`/api/v1/campaigns/creators/${creatorId}`);
}

export async function listSeedCampaigns(): Promise<CampaignBrief[]> {
  return request<CampaignBrief[]>('/api/v1/campaigns/seed');
}

export async function deconstructBrief(brief: CampaignBrief): Promise<any> {
  return request<any>('/api/v1/campaigns/deconstruct', {
    method: 'POST',
    body: JSON.stringify(brief),
  });
}

export async function submitBrief(brief: CampaignBrief): Promise<SyndicateRecommendation[]> {
  return request<SyndicateRecommendation[]>('/api/v1/campaigns/brief', {
    method: 'POST',
    body: JSON.stringify(brief),
  });
}

export async function createProposal(payload: {
  campaign_id: string;
  syndicate_id?: string;
  creator_id?: string;
  beneficiary_email?: string;
  beneficiary_emails?: string[];
  brand_name?: string;
  budget_usd?: number;
}): Promise<Proposal> {
  return request<Proposal>('/api/v1/campaigns/proposal', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getProposal(proposalId: string): Promise<Proposal> {
  return request<Proposal>(`/api/v1/campaigns/proposal/${proposalId}`);
}

/* ---- Creator Portal ---- */

export async function getCreatorProfile(creatorId: string): Promise<CreatorProfile> {
  return request<CreatorProfile>(`/api/v1/creator/profile/${creatorId}`);
}

export async function updateCreatorProfile(
  creatorId: string,
  updates: Partial<CreatorProfile>
): Promise<CreatorProfile> {
  return request<CreatorProfile>(`/api/v1/creator/profile/${creatorId}`, {
    method: 'POST',
    body: JSON.stringify(updates),
  });
}

export async function getCreatorDashboard(creatorId: string): Promise<CreatorDashboardResponse> {
  return request<CreatorDashboardResponse>(`/api/v1/creator/dashboard/${creatorId}`);
}

export async function getCreatorOffers(creatorId: string): Promise<Proposal[]> {
  return request<Proposal[]>(`/api/v1/creator/offers/${creatorId}`);
}

export async function acceptOffer(
  proposalId: string,
  payload: { creator_id: string; confirmed_paypal_email?: string; confirmed_mpesa_phone?: string; countersigned_by?: string }
): Promise<Proposal> {
  return request<Proposal>(`/api/v1/creator/offers/${proposalId}/accept`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function submitDeliverable(
  payload: DeliverableSubmissionRequest
): Promise<any> {
  return request<any>('/api/v1/creator/deliverables/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getCollaborationFeed(proposalId: string): Promise<CreatorCollaborationMessage[]> {
  return request<CreatorCollaborationMessage[]>(`/api/v1/creator/collaboration/${proposalId}`);
}

export async function postCollaborationMessage(
  proposalId: string,
  payload: { sender_type?: string; sender_name?: string; content?: string; attachment_url?: string }
): Promise<CreatorCollaborationMessage> {
  return request<CreatorCollaborationMessage>(`/api/v1/creator/collaboration/${proposalId}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function claimPayout(
  proposalId: string,
  milestoneId: string,
  payload?: { paypal_email?: string }
): Promise<MilestonePayoutResult> {
  return request<MilestonePayoutResult>(
    `/api/v1/creator/payout/${proposalId}/${milestoneId}`,
    { method: 'POST', body: JSON.stringify(payload || {}) }
  );
}

export async function getCreatorInvoices(creatorId: string): Promise<eTIMSInvoice[]> {
  return request<eTIMSInvoice[]>(`/api/v1/creator/invoices/${creatorId}`);
}

/* ---- Health ---- */

export async function healthCheck(): Promise<any> {
  return request<any>('/api/health');
}

/* ---- Auth state helpers ---- */

export const api = {
  login,
  logout,
  getDemoAccounts,
  listCreators,
  getCreator,
  listSeedCampaigns,
  deconstructBrief,
  submitBrief,
  createProposal,
  getProposal,
  getCreatorProfile,
  updateCreatorProfile,
  getCreatorDashboard,
  getCreatorOffers,
  acceptOffer,
  submitDeliverable,
  getCollaborationFeed,
  postCollaborationMessage,
  claimPayout,
  getCreatorInvoices,
  healthCheck,
  getSessionToken,
  getSessionRole,
  clearSession,
};

export default api;