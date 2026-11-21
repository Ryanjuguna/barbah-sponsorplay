/* ============================================================================
   DHAMINI — Shared Types
   Aligned with FastAPI backend schemas (app/models/schemas.py)
   ============================================================================ */

export type UserRole = 'brand' | 'creator';

export interface SimulationAccount {
  id: string;
  email: string;
  username: string;
  name: string;
  role: UserRole;
  tier?: string;
  target_campaign?: string;
  budget_usd?: number;
  avatar_text?: string;
  location?: string;
  paypal_email?: string;
  description?: string;
  // Creator-specific
  gamer_tag?: string;
  type?: string;
  primary_game?: string;
  base_rate_usd?: number;
  brand_safety_score?: number;
  etims_registered?: boolean;
  kra_pin?: string;
  mpesa_phone?: string;
}

export interface DemoAccountsResponse {
  simulation_accounts: Record<string, SimulationAccount>;
  brands: SimulationAccount[];
  creators: SimulationAccount[];
}

export interface LoginRequest {
  role: UserRole;
  identifier?: string;
  password?: string;
  demo_id?: string;
}

export interface LoginResponse {
  status: string;
  token: string;
  role: UserRole;
  user: SimulationAccount;
  redirect_url: string;
}

/* ---- Creator Profile ---- */
export type CreatorType =
  | 'PRO_PLAYER_STREAMER'
  | 'CAMPUS_ESPORTS_CLUB'
  | 'GRASSROOTS_GAMING_DEN'
  | 'TOURNAMENT_ORGANIZER';

export interface CreatorProfile {
  id: string;
  name: string;
  gamer_tag: string;
  type: CreatorType;
  primary_game: string;
  location: string;
  paypal_email: string;
  mpesa_phone: string;
  base_rate_usd: number;
  brand_safety_score: number;
  etims_registered: boolean;
  kra_pin?: string;
  monthly_reach?: number;
  avatar_text?: string;
  description?: string;
  tier?: 'ELITE PRO' | 'REGIONAL RISING STAR' | 'GRASSROOTS LEADER';
  credibility_index?: number;
  total_campaigns_completed?: number;
  verified_certificates_count?: number;
  badges?: Array<{
    id: string;
    name: string;
    issuer: string;
    icon: string;
    color: string;
  }>;
  passport_hash?: string;
}

/* ---- Campaign Brief ---- */
export interface CampaignBrief {
  id: string;
  brand_name: string;
  corporate_pin: string;
  brief: string;
  target_audience: string;
  budget_usd: number;
  status?: string;
  created_at?: string;
}

/* ---- Syndicate Recommendation ---- */
export interface SyndicateMember {
  creator_id: string;
  name: string;
  gamer_tag: string;
  type: string;
  role_in_syndicate: string;
  rate_usd: number;
}

export interface SyndicateRecommendation {
  syndicate_id: string;
  name: string;
  description: string;
  total_budget_usd: number;
  members: SyndicateMember[];
  match_score: number;
  audience_overlap: number;
  community_density: number;
}

/* ---- Proposal / Milestone ---- */
export interface Milestone {
  id: string;
  milestone_number: number;
  title: string;
  description: string;
  amount_usd: number;
  status: 'DRAFT' | 'COMMITTED_IN_LEDGER' | 'PENDING_FUNDING' | 'IN_PROGRESS' | 'VERIFIED' | 'REQUIRES_REVISION' | 'FAILED' | 'DISBURSED' | 'PAID';
  verification_criteria?: Record<string, any>;
  deliverable_type?: string;
}

export interface Proposal {
  id: string;
  campaign_id: string;
  campaign?: CampaignBrief;
  creator_id?: string;
  syndicate_id?: string;
  creators?: CreatorProfile[];
  status: string;
  total_budget_usd: number;
  platform_fee_usd: number;
  net_creator_disbursement_usd: number;
  milestones: Milestone[];
  beneficiary_emails?: string[];
  created_at: string;
  updated_at: string;
}

/* ---- Proof of Play Certificate ---- */
export interface ProofOfPlayCertificate {
  certificate_id: string;
  milestone_id: string;
  creator_id: string;
  timestamp: string;
  logo_screen_ratio_percent: number;
  airtime_seconds: number;
  verbal_slogans_detected: string[];
  audio_confidence: number;
  brand_safety_status: string;
  overall_confidence_percent: number;
  verification_decision: 'PASSED' | 'REQUIRES_REVISION' | 'FAILED';
  cryptographic_hash: string;
  physical_authenticity?: boolean;
  competitor_clash_detected?: boolean;
  multimodal_findings?: string;
  proof_image_url?: string;
  verification_engine?: string;
}

/* ---- Creator Dashboard ---- */
export interface CreatorDashboardResponse {
  creator: CreatorProfile;
  pending_offers: Proposal[];
  active_deals: Proposal[];
  completed_deals: Proposal[];
  certificates: ProofOfPlayCertificate[];
  total_earned_usd: number;
  total_earned_kes: number;
  ledger_escrow_usd: number;
  skills_passport: {
    tier: string;
    credibility_index: number;
    total_campaigns_completed: number;
    verified_certificates_count: number;
    badges: Array<{ id: string; name: string; issuer: string; icon: string; color: string }>;
    passport_hash: string;
  };
}

/* ---- eTIMS Invoice ---- */
export interface eTIMSInvoice {
  id: string;
  invoice_number: string;
  cu_invoice_number: string;
  supplier_pin: string;
  supplier_name: string;
  buyer_pin: string;
  buyer_name: string;
  amount_usd: amount_usd;
  amount_kes: number;
  wht_amount_usd: number;
  vat_amount_usd: number;
  total_amount_usd: number;
  qr_code_url?: string;
  status: string;
  created_at: string;
}

interface amount_usd {
  value: number;
}

/* ---- Collaboration Message ---- */
export interface CreatorCollaborationMessage {
  id: string;
  proposal_id: string;
  sender_type: 'CREATOR' | 'AGENT' | 'BRAND';
  sender_name: string;
  content: string;
  timestamp: string;
  attachment_url?: string;
}

/* ---- Deliverable Submission ---- */
export interface DeliverableSubmissionRequest {
  proposal_id: string;
  creator_id: string;
  milestone_id: string;
  deliverable_type: string;
  media_url?: string;
  image_base64?: string;
  notes?: string;
  preset_scenario?: string;
  brand_name?: string;
}

/* ---- Payout ---- */
export interface MilestonePayoutResult {
  status: string;
  milestone_id: string;
  disbursement_result: any;
  net_payout_usd: number;
  net_payout_kes: number;
  paypal_destination: string;
  mpesa_ready: boolean;
}

/* ---- API Error ---- */
export interface ApiError {
  detail: string;
  status_code?: number;
}