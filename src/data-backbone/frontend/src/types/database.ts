// ============================================================================
// DATABASE ENTITY TYPES - Aligned with Neo4j/PostgreSQL Schema
// ============================================================================

// ============================================================================
// COMPANY TYPES
// ============================================================================

export interface Company {
  id: string;
  name: string;
  domain: string;
  description?: string;

  // Industry
  main_industry?: string;
  sub_industry?: string;

  // Size & Location
  employee_count?: number;
  office_count?: number;
  hq_country?: string;
  hq_country_iso?: string;
  hq_city?: string;
  location?: string;

  // Financial
  annual_revenue?: number;
  founded_year?: number;

  // Social
  linkedin_url?: string;
  twitter_url?: string;
  website?: string;

  // Relationship Flags
  is_prospect?: boolean;
  is_partner?: boolean;
  is_competitor?: boolean;
  is_influencer?: boolean;

  // Intent Scores (from Signals)
  intent_score?: number;
  sustainability_score?: number;
  wellbeing_score?: number;
  growth_score?: number;
  workplace_score?: number;

  // ICP Classification
  icp_tier?: number;
  classification?: 'TAM' | 'SAM' | 'SOM';

  // Metadata
  rating?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Location {
  id: string;
  company_id: string;
  location_title?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country_iso?: string;
  country_name?: string;
  latitude?: number;
  longitude?: number;
  is_hq?: boolean;
  employee_count?: number;
  status?: 'inactive' | 'active' | 'indirect' | 'rejected';
}

// ============================================================================
// EMPLOYEE/CONTACT TYPES
// ============================================================================

export interface Employee {
  id: string;
  company_id: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;

  // Professional
  job_title?: string;
  title?: string; // Alias for compatibility
  department?: string;
  seniority?: string;

  // LinkedIn
  linkedin_url?: string;
  linkedin_headline?: string;

  // Location
  city?: string;
  country?: string;

  // Buyer Persona
  buyer_persona_type?: BuyerPersonaType;
  buyer_persona_confidence?: number;
  decision_maker_score?: number;

  // Metadata
  created_at?: string;
  updated_at?: string;
}

export type BuyerPersonaType =
  | 'Champion'
  | 'Economic Buyer'
  | 'Technical Evaluator'
  | 'User Buyer'
  | 'Blocker'
  | 'Influencer'
  | 'Coach'
  | 'Legal'
  | 'Procurement'
  | 'Executive Sponsor';

export interface EmployeeProfile {
  id: string;
  employee_id: string;
  buyer_persona_type?: BuyerPersonaType;
  buyer_persona_match?: number;
  buyer_committee_role?: string;
  decision_maker_score?: number;
  sales_approach_summary?: string;
  key_talking_points?: string[];
}

// ============================================================================
// DEAL TYPES (MEDDPICC)
// ============================================================================

export type DealStage =
  | 'identified'
  | 'qualified'
  | 'engaged'
  | 'pipeline'
  | 'proposal'
  | 'negotiation'
  | 'committed'
  | 'closed_won'
  | 'closed_lost'
  | 'on_hold';

export type DealType =
  | 'new_business'
  | 'expansion'
  | 'renewal'
  | 'upsell'
  | 'cross_sell';

export type DealHealth =
  | 'at_risk'
  | 'needs_attention'
  | 'on_track'
  | 'strong';

export interface Deal {
  id: string;
  deal_name: string;
  deal_type: DealType;
  company_id: string;
  location_id?: string;

  // Stage
  stage: DealStage;
  stage_entered_at?: string;

  // Ownership
  owner_user_id?: string;

  // Financials
  amount?: number;
  currency?: string;
  recurring_amount?: number;
  one_time_amount?: number;
  probability?: number;
  weighted_amount?: number;
  system_count?: number;

  // Timing
  expected_close_date?: string;
  actual_close_date?: string;
  days_in_pipeline?: number;
  days_to_close?: number;

  // MEDDPICC Scores (0-10 each)
  meddpicc_metrics_score?: number;
  meddpicc_economic_buyer_score?: number;
  meddpicc_decision_criteria_score?: number;
  meddpicc_decision_process_score?: number;
  meddpicc_paper_process_score?: number;
  meddpicc_pain_score?: number;
  meddpicc_champion_score?: number;
  meddpicc_competition_score?: number;
  meddpicc_total_score?: number; // Auto-calculated 0-80

  // MEDDPICC Details
  metrics_summary?: string;
  economic_buyer_id?: string;
  economic_buyer_access?: 'none' | 'indirect' | 'direct' | 'sponsor';
  decision_criteria_summary?: string;
  decision_process_summary?: string;
  paper_process_summary?: string;
  pain_summary?: string;
  pain_urgency?: 'low' | 'medium' | 'high' | 'critical';
  champion_id?: string;
  champion_strength?: 'weak' | 'developing' | 'strong' | 'mobilizer';
  competition_summary?: string;

  // Health
  deal_health?: DealHealth;
  deal_health_reasons?: string[];

  // Outcome (for closed deals)
  outcome_reason?: string;
  outcome_competitor?: string;

  // Attribution
  source_channel?: string;
  source_campaign?: string;

  // Metadata
  notes?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  closed_at?: string;
}

export interface DealContact {
  id: string;
  deal_id: string;
  employee_id: string;
  committee_role: BuyerPersonaType;
  influence_level?: number;
  is_primary_contact?: boolean;
  sentiment?: 'negative' | 'neutral' | 'positive' | 'advocate';
  is_champion?: boolean;
  is_economic_buyer?: boolean;
  is_blocker?: boolean;
  engagement_score?: number;
  last_contacted_at?: string;
}

export interface DealActivity {
  id: string;
  deal_id: string;
  activity_type: 'meeting' | 'call' | 'email' | 'task' | 'demo' | 'proposal_sent' | 'contract_sent' | 'site_visit' | 'note' | 'stage_change';
  subject: string;
  description?: string;
  scheduled_at?: string;
  completed_at?: string;
  duration_minutes?: number;
  outcome?: 'completed' | 'no_show' | 'rescheduled' | 'cancelled' | 'positive' | 'neutral' | 'negative';
  outcome_notes?: string;
  next_steps?: string;
  contact_ids?: string[];
  owner_user_id?: string;
}

export interface DealPipelineStats {
  stage: DealStage;
  deal_count: number;
  total_value: number;
  weighted_value: number;
}

// ============================================================================
// OUTREACH & SEQUENCE TYPES
// ============================================================================

export type SequenceStatus = 'draft' | 'active' | 'paused' | 'archived';

export type ChannelType =
  | 'email'
  | 'li_invite'
  | 'li_chat'
  | 'li_inmail'
  | 'whatsapp'
  | 'phone_task'
  | 'phone_auto'
  | 'sms'
  | 'instagram_dm'
  | 'fb_messenger'
  | 'google_ads'
  | 'fb_ads'
  | 'li_ads';

export type EnrollmentStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'replied'
  | 'meeting_booked'
  | 'bounced'
  | 'unsubscribed'
  | 'stopped';

export interface OutreachSequence {
  id: string;
  name: string;
  description?: string;
  status: SequenceStatus;
  created_by_user_id?: string;

  // Stats (denormalized)
  total_enrolled?: number;
  total_completed?: number;
  total_replied?: number;
  total_meetings?: number;
  reply_rate?: number;

  // Channels used
  channels?: ChannelType[];

  created_at?: string;
  activated_at?: string;
}

export interface SequenceStep {
  id: string;
  sequence_id: string;
  step_order: number;
  step_type: 'message' | 'wait' | 'condition' | 'action';
  channel?: ChannelType;
  content?: {
    subject?: string;
    body?: string;
    duration_value?: number;
    duration_unit?: 'hours' | 'days' | 'weeks';
  };
  stats?: {
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    replied: number;
    bounced: number;
  };
}

export interface OutreachEnrollment {
  id: string;
  sequence_id: string;
  employee_id: string;
  company_id: string;
  deal_id?: string;
  status: EnrollmentStatus;
  current_step_order?: number;
  next_step_at?: string;
  enrolled_at?: string;
  completed_at?: string;
  replied_at?: string;
}

export interface OutreachMessage {
  id: string;
  enrollment_id: string;
  step_id: string;
  channel: ChannelType;
  subject?: string;
  body?: string;
  status: 'pending' | 'scheduled' | 'sending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  scheduled_at?: string;
  sent_at?: string;
  delivered_at?: string;
  opened_at?: string;
  clicked_at?: string;
  replied_at?: string;
}

// ============================================================================
// ATTRIBUTION TYPES
// ============================================================================

export type TouchpointType =
  // Inbound
  | 'website_visit'
  | 'form_submission'
  | 'content_download'
  | 'webinar_registration'
  | 'webinar_attendance'
  | 'demo_request'
  | 'pricing_page'
  | 'chat_initiated'
  | 'inbound_call'
  | 'referral'
  // Outbound
  | 'email_sent'
  | 'email_opened'
  | 'email_clicked'
  | 'email_replied'
  | 'linkedin_invite'
  | 'linkedin_message'
  | 'linkedin_inmail'
  | 'phone_call'
  | 'phone_connected'
  | 'sms_sent'
  | 'whatsapp_sent'
  | 'social_dm'
  // Advertising
  | 'ad_impression'
  | 'ad_click'
  | 'ad_conversion'
  // Sales
  | 'meeting_scheduled'
  | 'meeting_completed'
  | 'demo_completed'
  | 'proposal_sent'
  | 'contract_sent'
  // Events
  | 'event_registration'
  | 'event_attendance'
  | 'tradeshow_scan';

export type AttributionModelType =
  | 'first_touch'
  | 'last_touch'
  | 'linear'
  | 'time_decay'
  | 'position_based'
  | 'w_shaped'
  | 'custom';

export interface AttributionTouchpoint {
  id: string;
  company_id?: string;
  employee_id?: string;
  deal_id?: string;
  touchpoint_type: TouchpointType;
  channel?: ChannelType;

  // Source tracking (UTM)
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;

  // Links
  sequence_id?: string;
  message_id?: string;

  // Attribution
  attribution_weight?: number;
  attributed_value?: number;

  occurred_at: string;
  created_at?: string;
}

export interface Campaign {
  name: string;
  source?: string;
  medium?: string;
  touchpoint_count?: number;
  deals_influenced?: number;
  attributed_revenue?: number;
  start_date?: string;
  end_date?: string;
}

// ============================================================================
// SIGNAL TYPES (Re-export from signals.ts with additions)
// ============================================================================

export interface Signal {
  id: string;
  entity_type: 'company' | 'contact';
  company_id: string;
  contact_id?: string;
  signal_type: string;
  signal_category: string;
  base_weight: number;
  current_score: number;
  title: string;
  description?: string;
  source_url?: string;
  data_source: string;
  status: 'active' | 'expired' | 'dismissed';
  detected_at: string;
  expires_at?: string;
}

export interface HotAccount {
  company: Company;
  signal_count: number;
  newest_signal?: string;
  champion_name?: string;
  champion_title?: string;
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface CompanyWithPeople {
  company: Company;
  people: Employee[];
  emails: string[];
}

export interface DealWithDetails {
  deal: Deal;
  company: Company;
  owner?: User;
  champion?: Employee;
  economic_buyer?: Employee;
  location?: Location;
  contacts: Array<{
    person: Employee;
    role: BuyerPersonaType;
    influence_level?: number;
    sentiment?: string;
  }>;
}

export interface SequenceWithEnrollments {
  sequence: OutreachSequence;
  created_by?: string;
  channels: ChannelType[];
  enrollments: Array<{
    person: Pick<Employee, 'id' | 'full_name' | 'title'>;
    company: Pick<Company, 'id' | 'name'>;
    status: EnrollmentStatus;
    enrolled_at?: string;
    replied_at?: string;
  }>;
}

export interface AttributionJourney {
  touchpoint_type: TouchpointType;
  occurred_at: string;
  channel?: ChannelType;
  campaign?: string;
  deal_name?: string;
  weight?: number;
}
