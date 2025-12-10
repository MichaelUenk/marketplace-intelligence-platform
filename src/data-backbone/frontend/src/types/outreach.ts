// ============================================================================
// OUTREACH SEQUENCES - TYPE DEFINITIONS
// ============================================================================

// Channel codes for all 13 supported channels
export type ChannelCode =
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

export type ChannelCategory = 'direct' | 'social' | 'advertising' | 'voice';

export type AutomationLevel = 'full' | 'semi' | 'manual';

export type PersonalizationLevel = 'high' | 'medium' | 'low';

// Channel Configuration
export interface ChannelConfig {
  code: ChannelCode;
  name: string;
  icon: string;
  category: ChannelCategory;

  automation: {
    level: AutomationLevel;
    requiresApproval: boolean;
    canSchedule: boolean;
    canAutoReply: boolean;
  };

  limits: {
    daily: number | null;
    weekly: number | null;
    hourly: number | null;
    concurrent: number | null;
  };

  content: {
    maxLength: number | null;
    supportsHtml: boolean;
    supportsAttachments: boolean;
    supportsImages: boolean;
    supportsLinks: boolean;
    supportsEmoji: boolean;
  };

  personalization: {
    level: PersonalizationLevel;
    supportsMergeFields: boolean;
    supportsConditionalContent: boolean;
    supportsDynamicImages: boolean;
  };

  tracking: {
    canTrackOpen: boolean;
    canTrackClick: boolean;
    canTrackReply: boolean;
    canTrackConversion: boolean;
  };

  requirements: {
    needsConnection: boolean;
    needsOptIn: boolean;
    needsVerification: boolean;
    costPerMessage: number | null;
  };
}

// Sequence Status
export type SequenceStatus = 'draft' | 'active' | 'paused' | 'archived';

// Sequence Step Types
export type StepType = 'message' | 'wait' | 'condition' | 'action';

// Wait Configuration
export interface WaitConfig {
  type: 'fixed' | 'random' | 'business_days' | 'until_event';
  duration?: {
    min: number;
    max: number;
    unit: 'minutes' | 'hours' | 'days';
  };
  business_days?: number;
  event?: {
    type: 'email_opened' | 'link_clicked' | 'replied' | 'profile_viewed';
    timeout_days: number;
  };
}

// Condition Configuration
export interface ConditionConfig {
  type: 'if_then_else' | 'split';
  condition?: {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
    value: unknown;
  };
  branches: {
    id: string;
    name: string;
    condition_met: boolean;
    next_step_id: string;
  }[];
  splits?: {
    id: string;
    name: string;
    percentage: number;
    next_step_id: string;
  }[];
}

// Action Configuration
export interface ActionConfig {
  type: 'tag' | 'move_stage' | 'assign_owner' | 'create_task' | 'webhook' | 'slack_notify';
  tag?: {
    action: 'add' | 'remove';
    tag_name: string;
  };
  stage?: {
    stage_code: string;
  };
  owner?: {
    user_id: string;
    round_robin_group?: string;
  };
  task?: {
    title: string;
    description: string;
    due_in_days: number;
    priority: 'low' | 'medium' | 'high';
    assign_to: string;
  };
  webhook?: {
    url: string;
    method: 'POST' | 'PUT';
    headers: Record<string, string>;
    payload_template: string;
  };
  slack?: {
    channel: string;
    message_template: string;
  };
}

// Step Content
export interface StepContent {
  subject?: string;
  body: string;
  message?: string;
  script?: string;
  headline?: string;
  description?: string;
  cta?: string;
  image_url?: string;
  landing_page_url?: string;
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[];
  tokens_used: string[];
}

// Step Variant for A/B Testing
export interface StepVariant {
  id: string;
  name: string;
  weight: number;
  content: StepContent;
  stats?: StepStats;
}

// Step Statistics
export interface StepStats {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  open_rate: number;
  click_rate: number;
  reply_rate: number;
}

// Sequence Step
export interface SequenceStep {
  id: string;
  sequence_id: string;
  order: number;
  type: StepType;
  channel?: ChannelCode;
  content?: StepContent;
  wait?: WaitConfig;
  condition?: ConditionConfig;
  action?: ActionConfig;
  variants?: StepVariant[];
  stats?: StepStats;
}

// Sequence Targeting
export interface SequenceTargeting {
  audience_type: 'manual' | 'dynamic' | 'segment';
  filters?: {
    stages?: string[];
    icp_tiers?: string[];
    marketing_tiers?: string[];
    intent_score_min?: number;
    buyer_personas?: string[];
    industries?: string[];
    company_sizes?: string[];
    regions?: string[];
  };
  segment_id?: string;
  exclusions: {
    exclude_existing_sequences: boolean;
    exclude_replied: boolean;
    exclude_bounced: boolean;
    exclude_unsubscribed: boolean;
    exclude_company_ids: string[];
    exclude_contact_ids: string[];
  };
}

// Sequence Settings
export interface SequenceSettings {
  timezone: string;
  send_window: {
    enabled: boolean;
    start_hour: number;
    end_hour: number;
    days: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[];
  };
  stop_on_reply: boolean;
  stop_on_meeting_booked: boolean;
  stop_on_stage_change: boolean;
  stop_on_unsubscribe: boolean;
  max_contacts_per_day: number;
  delay_between_contacts: number;
  ab_testing: {
    enabled: boolean;
    test_percentage: number;
    winning_metric: 'open_rate' | 'reply_rate' | 'click_rate' | 'conversion_rate';
    auto_select_winner: boolean;
    min_sample_size: number;
  };
}

// Sequence Statistics
export interface SequenceStats {
  total_enrolled: number;
  active: number;
  completed: number;
  replied: number;
  bounced: number;
  unsubscribed: number;
  open_rate: number;
  click_rate: number;
  reply_rate: number;
  conversion_rate: number;
  step_stats: StepStats[];
}

// Outreach Sequence
export interface OutreachSequence {
  id: string;
  name: string;
  description: string;
  status: SequenceStatus;
  targeting: SequenceTargeting;
  steps: SequenceStep[];
  settings: SequenceSettings;
  stats: SequenceStats;
  created_by: string;
  team_id: string;
  created_at: Date;
  updated_at: Date;
  activated_at?: Date;
}

// Contact Enrollment
export type EnrollmentStatus = 'active' | 'paused' | 'completed' | 'replied' | 'bounced' | 'unsubscribed' | 'stopped';

export interface ContactEnrollment {
  id: string;
  sequence_id: string;
  contact_id: string;
  company_id: string;
  status: EnrollmentStatus;
  current_step_id: string;
  current_step_order: number;
  variant_assignments: Record<string, string>;
  enrolled_at: Date;
  next_step_at?: Date;
  completed_at?: Date;
  events: EnrollmentEvent[];
}

// Enrollment Event
export type EventType = 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'unsubscribed' | 'converted';

export interface EnrollmentEvent {
  id: string;
  enrollment_id: string;
  step_id: string;
  type: EventType;
  metadata?: {
    link_url?: string;
    reply_content?: string;
    bounce_reason?: string;
  };
  created_at: Date;
}

// Sequence Template
export interface SequenceTemplate {
  id: string;
  name: string;
  description: string;
  category: 'cold_outreach' | 'warm_nurture' | 'event_follow_up' | 'win_back' | 'onboarding';
  template: Partial<OutreachSequence>;
  is_public: boolean;
  use_count: number;
  avg_reply_rate?: number;
  created_by: string;
  created_at: Date;
}
