// ============================================================================
// BOWTIE CRM TYPE DEFINITIONS
// ============================================================================

// Stage codes
export type StageCode = 'VM1' | 'VM2' | 'VM3' | 'VM4' | 'VM5' | 'VM6' | 'VM7' | 'VM8';

export type BowtieSide = 'left' | 'center' | 'right';

export type MotionType = 'direct' | 'indirect' | 'hybrid';

export type VelocityStatus = 'on-track' | 'slow' | 'stalled' | 'fast';

export type BuyerPersona =
  | 'Champion'
  | 'Decision Maker'
  | 'Economic Buyer'
  | 'Influencer'
  | 'User'
  | 'Blocker'
  | 'Technical Evaluator'
  | 'Gatekeeper';

export type Seniority = 'C-Level' | 'VP' | 'Director' | 'Manager' | 'Individual Contributor';

// ============================================================================
// TIER SCORE
// ============================================================================

export interface TierScore {
  tier: string;
  confidence: number;
}

// ============================================================================
// INTENT SIGNALS
// ============================================================================

export interface IntentSignals {
  overall_score: number;
  intent_category: string;
  sustainability: number;
  workplace_experience: number;
  employee_wellbeing: number;
  growth_expansion: number;
  sales_summary: string;
  recommended_next_steps: string[];
}

// ============================================================================
// COMPANY MODEL
// ============================================================================

export interface Company {
  id: string;
  company_name: string;
  domain: string;
  website: string;
  linkedin_url: string;
  main_industry: string;
  sub_industries: string[];
  hq_country: string;
  hq_city: string;
  amount_of_offices: number;

  // Current lifecycle stage
  current_stage: StageCode;
  stage_entered_at: Date;
  days_in_stage: number;

  // Motion type
  motion_type: MotionType;
  channel_partner_id?: string;
  channel_partner_name?: string;

  // Intelligence scores & tiers
  intent_signals: IntentSignals;
  icp_tier: TierScore;
  marketing_tier: TierScore;

  // Financial metrics
  pipeline_value?: number;
  contract_value?: number;
  mrr?: number;
  arr?: number;
  ltv?: number;

  // Health & velocity
  health_score: number;
  velocity_status: VelocityStatus;

  // Ownership
  owner_id: string;
  owner_name: string;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// CONTACT MODEL
// ============================================================================

export interface Contact {
  id: string;
  company_id: string;

  // Basic info
  full_name: string;
  first_name: string;
  last_name: string;
  job_title: string;
  department: string;
  seniority: Seniority;

  // Contact details
  email: string;
  phone_number: string;
  linkedin_url: string;
  linkedin_headline: string;

  // Buyer intelligence
  buyer_persona_type: BuyerPersona;
  buyer_persona_confidence: number;
  is_primary_contact: boolean;

  // AI-generated insights
  work_history_relevance: 'High' | 'Medium' | 'Low';
  educational_background: string;
  sales_approach_summary: string;
  key_talking_points: string[];
  schooling_summary: string;
  job_history_summary: string;

  // Engagement tracking
  last_contacted_at?: Date;
  engagement_score: number;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// STAGE HISTORY MODEL
// ============================================================================

export interface StageHistory {
  id: string;
  company_id: string;
  stage: StageCode;
  entered_at: Date;
  exited_at?: Date;
  duration_days?: number;
  motion_type: MotionType;
  changed_by_id: string;
  changed_by_name: string;
  notes?: string;
  created_at: Date;
}

// ============================================================================
// AGGREGATED DASHBOARD DATA
// ============================================================================

export interface BowtieStageData {
  stage: StageCode;
  stage_name: string;
  stage_label: string;
  side: BowtieSide;

  // Counts
  company_count: number;
  direct_count: number;
  indirect_count: number;

  // Values
  total_value: number;
  avg_value: number;

  // Velocity
  avg_days_in_stage: number;
  median_days_in_stage: number;

  // Health
  healthy_count: number;
  at_risk_count: number;
  stalled_count: number;
}

export interface ConversionMetrics {
  cr1: number; // Lead → MQL
  cr2: number; // MQL → SQL
  cr3: number; // SQL → SAL
  cr4: number; // SAL → Commit
  cr5: number; // Commit → Activated
  cr6: number; // Activated → Recurring
  cr7: number; // Recurring → Maximum
}

export interface DashboardData {
  stages: BowtieStageData[];
  conversions: ConversionMetrics;
  totals: {
    acquisition_value: number;
    activation_count: number;
    expansion_revenue: number;
    total_accounts: number;
  };
  updated_at: Date;
}

// ============================================================================
// FILTER STATE
// ============================================================================

export interface FilterState {
  stages: StageCode[];
  side: 'all' | BowtieSide;
  motion_type: 'all' | MotionType;
  icp_tiers: string[];
  marketing_tiers: string[];
  intent_score_min: number;
  intent_score_max: number;
  health_score_min: number;
  owner_ids: string[];
  date_range: {
    start: Date | null;
    end: Date | null;
  };
  stage_entered_after: Date | null;
  stage_entered_before: Date | null;
  stalled_only: boolean;
  at_risk_only: boolean;
  champion_identified: boolean;
  search: string;
  sort_by: 'name' | 'value' | 'days_in_stage' | 'health_score' | 'intent_score';
  sort_order: 'asc' | 'desc';
}

// ============================================================================
// STAGE CONFIGURATION
// ============================================================================

export interface StageConfig {
  code: StageCode;
  name: string;
  label: string;
  description: string;
  side: BowtieSide;
  order: number;
}

// ============================================================================
// COMPANY CARD (for list views)
// ============================================================================

export interface CompanyCardData {
  id: string;
  company_name: string;
  domain: string;
  main_industry: string;
  hq_city: string;
  current_stage: StageCode;
  days_in_stage: number;
  pipeline_value?: number;
  contract_value?: number;
  mrr?: number;
  intent_score: number;
  health_score: number;
  velocity_status: VelocityStatus;
  icp_tier: string;
  champion?: {
    name: string;
    title: string;
    persona: BuyerPersona;
    confidence: number;
  };
}
