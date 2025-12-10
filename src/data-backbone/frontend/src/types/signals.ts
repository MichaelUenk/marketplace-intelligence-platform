// Signal Types and Interfaces

// Intent categories
export type IntentCategory = 'hot' | 'warm' | 'engaged' | 'aware' | 'cold';

// Score trend direction
export type ScoreTrend = 'rising' | 'stable' | 'falling';

// Signal entity type
export type EntityType = 'company' | 'contact';

// Signal status
export type SignalStatus = 'active' | 'expired' | 'dismissed';

// Data source types
export type DataSourceType = 'api' | 'webhook' | 'scraper' | 'manual';

// Signal category types
export type SignalCategory =
  | 'sustainability'
  | 'workplace_experience'
  | 'employee_wellbeing'
  | 'growth_expansion'
  | 'direct_engagement'
  | 'operational'
  | 'technology'
  | 'relationship';

// Signal type definitions
export type SignalType =
  // Strategic - Growth & Expansion
  | 'office_opening'
  | 'funding_round'
  | 'ipo_ma_activity'
  | 'revenue_milestone'
  | 'employee_growth'
  | 'geographic_expansion'
  // Strategic - Sustainability
  | 'esg_initiative'
  | 'carbon_reduction'
  | 'plastic_free_pledge'
  | 'bcorp_certification'
  | 'sustainability_hire'
  // Strategic - Workplace
  | 'office_redesign'
  | 'hybrid_work_policy'
  | 'employee_perks'
  | 'workplace_award'
  | 'culture_initiative'
  // Strategic - Wellbeing
  | 'wellness_program'
  | 'mental_health_focus'
  | 'fitness_benefits'
  | 'health_insurance'
  // Operational
  | 'lease_renewal'
  | 'facility_upgrade'
  | 'move_announcement'
  | 'space_expansion'
  | 'contract_expiry'
  | 'vendor_complaint'
  | 'rfp_published'
  | 'vendor_review'
  | 'tech_stack_change'
  | 'iot_initiative'
  | 'digital_transformation'
  // Engagement
  | 'pricing_page_view'
  | 'multiple_page_views'
  | 'case_study_download'
  | 'demo_request'
  | 'return_visit'
  | 'email_open'
  | 'email_click'
  | 'webinar_registration'
  | 'webinar_attendance'
  | 'content_download'
  | 'ad_click'
  | 'ad_impression'
  | 'retargeting_engage'
  // Employee-level
  | 'new_role'
  | 'promotion'
  | 'title_change'
  | 'department_move'
  | 'profile_update'
  | 'skills_addition'
  | 'posted_content'
  | 'relevant_content'
  | 'linkedin_engagement'
  | 'company_follow'
  | 'competitor_research'
  | 'product_research'
  | 'vendor_comparison'
  // Relationship
  | 'mutual_connection'
  | 'customer_connection'
  | 'team_connection'
  | 'champion_connection'
  | 'former_customer'
  | 'former_contact'
  | 'event_attendee'
  | 'referral_source'
  // Direct engagement
  | 'website_visit'
  | 'email_response'
  | 'meeting_accepted'
  | 'inmail_response'
  | 'profile_view'
  | 'company_page_view'
  | 'job_page_view';

// Signal event
export interface SignalEvent {
  id: string;
  entity_type: EntityType;
  company_id: string;
  contact_id?: string;
  signal_type: SignalType;
  signal_category: SignalCategory;
  base_weight: number;
  relevance_score?: number;
  confidence?: number;
  current_score: number;
  title: string;
  description?: string;
  source_url?: string;
  raw_data?: Record<string, unknown>;
  extracted_data?: Record<string, unknown>;
  data_source: string;
  source_event_id?: string;
  status: SignalStatus;
  detected_at: Date;
  expires_at?: Date;
  created_at: Date;
  updated_at: Date;
}

// Company intent score
export interface CompanyIntentScore {
  id: string;
  company_id: string;
  overall_score: number;
  intent_category: IntentCategory;
  sustainability_score: number;
  workplace_experience_score: number;
  employee_wellbeing_score: number;
  growth_expansion_score: number;
  direct_engagement_score: number;
  score_7d_ago?: number;
  score_30d_ago?: number;
  score_trend: ScoreTrend;
  active_signal_count: number;
  strongest_signal_type?: SignalType;
  strongest_signal_score?: number;
  newest_signal_type?: SignalType;
  newest_signal_at?: Date;
  company_narrative?: string;
  recommended_approach?: string;
  talking_points?: string[];
  timing_analysis?: TimingAnalysis;
  calculated_at: Date;
  created_at: Date;
  updated_at: Date;
}

// Contact intent score
export interface ContactIntentScore {
  id: string;
  contact_id: string;
  company_id: string;
  overall_score: number;
  engagement_score: number;
  fit_score: number;
  timing_score: number;
  priority_rank?: number;
  is_champion: boolean;
  is_decision_maker: boolean;
  active_signal_count: number;
  recent_activity?: string;
  last_engaged_at?: Date;
  recommended_channel?: string;
  best_contact_time?: string;
  talking_points?: string[];
  outreach_approach?: string;
  calculated_at: Date;
  created_at: Date;
  updated_at: Date;
}

// Timing analysis from AI
export interface TimingAnalysis {
  urgency_level: 'high' | 'medium' | 'low';
  best_contact_window: string;
  timing_rationale: string;
  key_dates?: string[];
}

// Hot account (materialized view result)
export interface HotAccount {
  id: string;
  company_name: string;
  domain?: string;
  main_industry?: string;
  hq_city?: string;
  hq_country?: string;
  overall_score: number;
  intent_category: IntentCategory;
  score_trend: ScoreTrend;
  active_signal_count: number;
  strongest_signal_type?: string;
  newest_signal_at?: Date;
  company_narrative?: string;
  recommended_approach?: string;
  icp_tier?: string;
  marketing_tier?: string;
  champion?: {
    id: string;
    name: string;
    title: string;
    score: number;
  };
  recent_signals?: RecentSignal[];
}

// Recent signal summary
export interface RecentSignal {
  type: SignalType;
  title: string;
  detected_at: Date;
  score: number;
}

// Signal taxonomy entry
export interface SignalTaxonomyEntry {
  type: SignalType;
  category: SignalCategory;
  label: string;
  description: string;
  weight: number;
  decay_days: number;
  icon: string;
}

// Decay configuration
export interface DecayConfig {
  signal_type: SignalType;
  half_life_days: number;
  min_value: number;
  max_age_days: number;
}

// Data source configuration
export interface DataSource {
  id: string;
  name: string;
  code: string;
  source_type: DataSourceType;
  connection_config: Record<string, unknown>;
  schedule_config?: {
    frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
    cron?: string;
    batch_size?: number;
  };
  signal_mappings: SignalMapping[];
  status: 'active' | 'paused' | 'error';
  last_sync_at?: Date;
  last_error?: string;
  error_count: number;
  total_signals_generated: number;
  created_at: Date;
  updated_at: Date;
}

// Signal mapping
export interface SignalMapping {
  source_field: string;
  signal_type: SignalType;
  transform?: string;
  conditions?: Record<string, unknown>;
}

// Signal alert configuration
export interface SignalAlert {
  id: string;
  user_id: string;
  alert_type: string;
  conditions: Record<string, unknown>;
  channels: ('slack' | 'email' | 'sms' | 'in_app')[];
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// Signal statistics
export interface SignalStats {
  total_signals: number;
  signals_change_percent: number;
  hot_accounts: number;
  hot_accounts_change_percent: number;
  warm_accounts: number;
  warm_accounts_change_percent: number;
  new_today: number;
  new_today_change_percent: number;
}

// Signal trend data point
export interface SignalTrendPoint {
  date: string;
  count: number;
}

// Category score for display
export interface CategoryScore {
  category: SignalCategory;
  label: string;
  score: number;
  maxScore: number;
  trend: 'up' | 'down' | 'stable';
  strength: 'very_strong' | 'strong' | 'moderate' | 'weak';
}

// AI Insights
export interface AIInsights {
  company_narrative: string;
  recommended_approach: string;
  talking_points: TalkingPoint[];
  timing: TimingAnalysis;
}

// Talking point
export interface TalkingPoint {
  hook: string;
  value_connection: string;
  question: string;
  proof_point?: string;
}
