import type { ChannelConfig, ChannelCode, SequenceSettings, SequenceTemplate } from '../types/outreach';

// ============================================================================
// CHANNEL CONFIGURATIONS
// ============================================================================

export const CHANNEL_CONFIGS: Record<ChannelCode, ChannelConfig> = {
  email: {
    code: 'email',
    name: 'Email',
    icon: '📧',
    category: 'direct',
    automation: {
      level: 'full',
      requiresApproval: false,
      canSchedule: true,
      canAutoReply: true,
    },
    limits: {
      daily: 200,
      weekly: null,
      hourly: 50,
      concurrent: null,
    },
    content: {
      maxLength: null,
      supportsHtml: true,
      supportsAttachments: true,
      supportsImages: true,
      supportsLinks: true,
      supportsEmoji: true,
    },
    personalization: {
      level: 'high',
      supportsMergeFields: true,
      supportsConditionalContent: true,
      supportsDynamicImages: true,
    },
    tracking: {
      canTrackOpen: true,
      canTrackClick: true,
      canTrackReply: true,
      canTrackConversion: true,
    },
    requirements: {
      needsConnection: false,
      needsOptIn: false,
      needsVerification: true,
      costPerMessage: 0.001,
    },
  },

  li_invite: {
    code: 'li_invite',
    name: 'LinkedIn Invite',
    icon: '🔗',
    category: 'social',
    automation: {
      level: 'semi',
      requiresApproval: true,
      canSchedule: true,
      canAutoReply: false,
    },
    limits: {
      daily: 20,
      weekly: 100,
      hourly: 5,
      concurrent: null,
    },
    content: {
      maxLength: 300,
      supportsHtml: false,
      supportsAttachments: false,
      supportsImages: false,
      supportsLinks: false,
      supportsEmoji: true,
    },
    personalization: {
      level: 'medium',
      supportsMergeFields: true,
      supportsConditionalContent: false,
      supportsDynamicImages: false,
    },
    tracking: {
      canTrackOpen: false,
      canTrackClick: false,
      canTrackReply: true,
      canTrackConversion: false,
    },
    requirements: {
      needsConnection: false,
      needsOptIn: false,
      needsVerification: false,
      costPerMessage: null,
    },
  },

  li_chat: {
    code: 'li_chat',
    name: 'LinkedIn Chat',
    icon: '💬',
    category: 'social',
    automation: {
      level: 'semi',
      requiresApproval: true,
      canSchedule: true,
      canAutoReply: false,
    },
    limits: {
      daily: 150,
      weekly: null,
      hourly: 30,
      concurrent: null,
    },
    content: {
      maxLength: 8000,
      supportsHtml: false,
      supportsAttachments: true,
      supportsImages: true,
      supportsLinks: true,
      supportsEmoji: true,
    },
    personalization: {
      level: 'high',
      supportsMergeFields: true,
      supportsConditionalContent: true,
      supportsDynamicImages: false,
    },
    tracking: {
      canTrackOpen: true,
      canTrackClick: false,
      canTrackReply: true,
      canTrackConversion: false,
    },
    requirements: {
      needsConnection: true,
      needsOptIn: false,
      needsVerification: false,
      costPerMessage: null,
    },
  },

  li_inmail: {
    code: 'li_inmail',
    name: 'LinkedIn InMail',
    icon: '✉️',
    category: 'social',
    automation: {
      level: 'full',
      requiresApproval: false,
      canSchedule: true,
      canAutoReply: false,
    },
    limits: {
      daily: 50,
      weekly: null,
      hourly: 10,
      concurrent: null,
    },
    content: {
      maxLength: 1900,
      supportsHtml: false,
      supportsAttachments: false,
      supportsImages: false,
      supportsLinks: true,
      supportsEmoji: true,
    },
    personalization: {
      level: 'high',
      supportsMergeFields: true,
      supportsConditionalContent: true,
      supportsDynamicImages: false,
    },
    tracking: {
      canTrackOpen: true,
      canTrackClick: false,
      canTrackReply: true,
      canTrackConversion: false,
    },
    requirements: {
      needsConnection: false,
      needsOptIn: false,
      needsVerification: false,
      costPerMessage: 0.80,
    },
  },

  whatsapp: {
    code: 'whatsapp',
    name: 'WhatsApp',
    icon: '📱',
    category: 'direct',
    automation: {
      level: 'semi',
      requiresApproval: true,
      canSchedule: true,
      canAutoReply: true,
    },
    limits: {
      daily: 256,
      weekly: null,
      hourly: 50,
      concurrent: null,
    },
    content: {
      maxLength: 4096,
      supportsHtml: false,
      supportsAttachments: true,
      supportsImages: true,
      supportsLinks: true,
      supportsEmoji: true,
    },
    personalization: {
      level: 'high',
      supportsMergeFields: true,
      supportsConditionalContent: true,
      supportsDynamicImages: true,
    },
    tracking: {
      canTrackOpen: true,
      canTrackClick: false,
      canTrackReply: true,
      canTrackConversion: false,
    },
    requirements: {
      needsConnection: false,
      needsOptIn: true,
      needsVerification: true,
      costPerMessage: 0.05,
    },
  },

  phone_task: {
    code: 'phone_task',
    name: 'Phone (Manual)',
    icon: '📞',
    category: 'voice',
    automation: {
      level: 'manual',
      requiresApproval: false,
      canSchedule: true,
      canAutoReply: false,
    },
    limits: {
      daily: null,
      weekly: null,
      hourly: null,
      concurrent: null,
    },
    content: {
      maxLength: null,
      supportsHtml: true,
      supportsAttachments: true,
      supportsImages: false,
      supportsLinks: true,
      supportsEmoji: false,
    },
    personalization: {
      level: 'high',
      supportsMergeFields: true,
      supportsConditionalContent: true,
      supportsDynamicImages: false,
    },
    tracking: {
      canTrackOpen: false,
      canTrackClick: false,
      canTrackReply: true,
      canTrackConversion: true,
    },
    requirements: {
      needsConnection: false,
      needsOptIn: false,
      needsVerification: false,
      costPerMessage: null,
    },
  },

  phone_auto: {
    code: 'phone_auto',
    name: 'Phone (AI)',
    icon: '🤖',
    category: 'voice',
    automation: {
      level: 'full',
      requiresApproval: true,
      canSchedule: true,
      canAutoReply: false,
    },
    limits: {
      daily: 500,
      weekly: null,
      hourly: 100,
      concurrent: 10,
    },
    content: {
      maxLength: 2000,
      supportsHtml: false,
      supportsAttachments: false,
      supportsImages: false,
      supportsLinks: false,
      supportsEmoji: false,
    },
    personalization: {
      level: 'medium',
      supportsMergeFields: true,
      supportsConditionalContent: true,
      supportsDynamicImages: false,
    },
    tracking: {
      canTrackOpen: true,
      canTrackClick: false,
      canTrackReply: true,
      canTrackConversion: true,
    },
    requirements: {
      needsConnection: false,
      needsOptIn: false,
      needsVerification: true,
      costPerMessage: 0.15,
    },
  },

  sms: {
    code: 'sms',
    name: 'SMS',
    icon: '💬',
    category: 'direct',
    automation: {
      level: 'full',
      requiresApproval: false,
      canSchedule: true,
      canAutoReply: true,
    },
    limits: {
      daily: 500,
      weekly: null,
      hourly: 100,
      concurrent: null,
    },
    content: {
      maxLength: 160,
      supportsHtml: false,
      supportsAttachments: false,
      supportsImages: false,
      supportsLinks: true,
      supportsEmoji: true,
    },
    personalization: {
      level: 'medium',
      supportsMergeFields: true,
      supportsConditionalContent: false,
      supportsDynamicImages: false,
    },
    tracking: {
      canTrackOpen: true,
      canTrackClick: true,
      canTrackReply: true,
      canTrackConversion: true,
    },
    requirements: {
      needsConnection: false,
      needsOptIn: true,
      needsVerification: true,
      costPerMessage: 0.03,
    },
  },

  instagram_dm: {
    code: 'instagram_dm',
    name: 'Instagram DM',
    icon: '📸',
    category: 'social',
    automation: {
      level: 'semi',
      requiresApproval: true,
      canSchedule: true,
      canAutoReply: false,
    },
    limits: {
      daily: 50,
      weekly: null,
      hourly: 10,
      concurrent: null,
    },
    content: {
      maxLength: 1000,
      supportsHtml: false,
      supportsAttachments: false,
      supportsImages: true,
      supportsLinks: true,
      supportsEmoji: true,
    },
    personalization: {
      level: 'high',
      supportsMergeFields: true,
      supportsConditionalContent: false,
      supportsDynamicImages: true,
    },
    tracking: {
      canTrackOpen: true,
      canTrackClick: false,
      canTrackReply: true,
      canTrackConversion: false,
    },
    requirements: {
      needsConnection: false,
      needsOptIn: false,
      needsVerification: false,
      costPerMessage: null,
    },
  },

  fb_messenger: {
    code: 'fb_messenger',
    name: 'FB Messenger',
    icon: '💬',
    category: 'social',
    automation: {
      level: 'semi',
      requiresApproval: true,
      canSchedule: true,
      canAutoReply: true,
    },
    limits: {
      daily: 50,
      weekly: null,
      hourly: 10,
      concurrent: null,
    },
    content: {
      maxLength: 2000,
      supportsHtml: false,
      supportsAttachments: true,
      supportsImages: true,
      supportsLinks: true,
      supportsEmoji: true,
    },
    personalization: {
      level: 'high',
      supportsMergeFields: true,
      supportsConditionalContent: true,
      supportsDynamicImages: true,
    },
    tracking: {
      canTrackOpen: true,
      canTrackClick: false,
      canTrackReply: true,
      canTrackConversion: false,
    },
    requirements: {
      needsConnection: false,
      needsOptIn: false,
      needsVerification: false,
      costPerMessage: null,
    },
  },

  google_ads: {
    code: 'google_ads',
    name: 'Google Ads',
    icon: '🔍',
    category: 'advertising',
    automation: {
      level: 'full',
      requiresApproval: true,
      canSchedule: true,
      canAutoReply: false,
    },
    limits: {
      daily: null,
      weekly: null,
      hourly: null,
      concurrent: null,
    },
    content: {
      maxLength: 90,
      supportsHtml: false,
      supportsAttachments: false,
      supportsImages: true,
      supportsLinks: true,
      supportsEmoji: false,
    },
    personalization: {
      level: 'low',
      supportsMergeFields: false,
      supportsConditionalContent: false,
      supportsDynamicImages: true,
    },
    tracking: {
      canTrackOpen: true,
      canTrackClick: true,
      canTrackReply: false,
      canTrackConversion: true,
    },
    requirements: {
      needsConnection: false,
      needsOptIn: false,
      needsVerification: true,
      costPerMessage: null,
    },
  },

  fb_ads: {
    code: 'fb_ads',
    name: 'Facebook Ads',
    icon: '📘',
    category: 'advertising',
    automation: {
      level: 'full',
      requiresApproval: true,
      canSchedule: true,
      canAutoReply: false,
    },
    limits: {
      daily: null,
      weekly: null,
      hourly: null,
      concurrent: null,
    },
    content: {
      maxLength: 125,
      supportsHtml: false,
      supportsAttachments: false,
      supportsImages: true,
      supportsLinks: true,
      supportsEmoji: true,
    },
    personalization: {
      level: 'medium',
      supportsMergeFields: false,
      supportsConditionalContent: false,
      supportsDynamicImages: true,
    },
    tracking: {
      canTrackOpen: true,
      canTrackClick: true,
      canTrackReply: false,
      canTrackConversion: true,
    },
    requirements: {
      needsConnection: false,
      needsOptIn: false,
      needsVerification: true,
      costPerMessage: null,
    },
  },

  li_ads: {
    code: 'li_ads',
    name: 'LinkedIn Ads',
    icon: '📊',
    category: 'advertising',
    automation: {
      level: 'full',
      requiresApproval: true,
      canSchedule: true,
      canAutoReply: false,
    },
    limits: {
      daily: null,
      weekly: null,
      hourly: null,
      concurrent: null,
    },
    content: {
      maxLength: 150,
      supportsHtml: false,
      supportsAttachments: false,
      supportsImages: true,
      supportsLinks: true,
      supportsEmoji: false,
    },
    personalization: {
      level: 'high',
      supportsMergeFields: false,
      supportsConditionalContent: false,
      supportsDynamicImages: true,
    },
    tracking: {
      canTrackOpen: true,
      canTrackClick: true,
      canTrackReply: false,
      canTrackConversion: true,
    },
    requirements: {
      needsConnection: false,
      needsOptIn: false,
      needsVerification: true,
      costPerMessage: null,
    },
  },
};

// Channel categories for grouping in UI
export const CHANNEL_CATEGORIES = {
  direct: { name: 'Direct Channels', channels: ['email', 'sms', 'whatsapp'] as ChannelCode[] },
  social: { name: 'Social Channels', channels: ['li_invite', 'li_chat', 'li_inmail', 'instagram_dm', 'fb_messenger'] as ChannelCode[] },
  voice: { name: 'Voice Channels', channels: ['phone_task', 'phone_auto'] as ChannelCode[] },
  advertising: { name: 'Advertising', channels: ['google_ads', 'fb_ads', 'li_ads'] as ChannelCode[] },
};

// Default sequence settings
export const DEFAULT_SEQUENCE_SETTINGS: SequenceSettings = {
  timezone: 'Europe/Amsterdam',
  send_window: {
    enabled: true,
    start_hour: 9,
    end_hour: 17,
    days: ['mon', 'tue', 'wed', 'thu', 'fri'],
  },
  stop_on_reply: true,
  stop_on_meeting_booked: true,
  stop_on_stage_change: false,
  stop_on_unsubscribe: true,
  max_contacts_per_day: 50,
  delay_between_contacts: 60,
  ab_testing: {
    enabled: false,
    test_percentage: 20,
    winning_metric: 'reply_rate',
    auto_select_winner: true,
    min_sample_size: 100,
  },
};

// Merge fields available for personalization
export const MERGE_FIELDS = {
  contact: {
    '{{contact.first_name}}': 'First name',
    '{{contact.last_name}}': 'Last name',
    '{{contact.full_name}}': 'Full name',
    '{{contact.email}}': 'Email address',
    '{{contact.phone}}': 'Phone number',
    '{{contact.job_title}}': 'Job title',
    '{{contact.department}}': 'Department',
    '{{contact.seniority}}': 'Seniority level',
    '{{contact.linkedin_url}}': 'LinkedIn URL',
  },
  company: {
    '{{company.name}}': 'Company name',
    '{{company.domain}}': 'Website domain',
    '{{company.industry}}': 'Industry',
    '{{company.hq_city}}': 'HQ city',
    '{{company.hq_country}}': 'HQ country',
    '{{company.employee_count}}': 'Employee count',
  },
  intelligence: {
    '{{intelligence.intent_score}}': 'Intent score',
    '{{intelligence.icp_tier}}': 'ICP tier',
    '{{intelligence.key_talking_point}}': 'Key talking point',
    '{{intelligence.pain_point}}': 'Identified pain point',
  },
  sender: {
    '{{sender.first_name}}': 'Your first name',
    '{{sender.last_name}}': 'Your last name',
    '{{sender.full_name}}': 'Your full name',
    '{{sender.email}}': 'Your email',
    '{{sender.title}}': 'Your job title',
    '{{sender.calendar_link}}': 'Calendar booking link',
  },
  ai: {
    '{{ai.personalized_intro}}': 'AI personalized intro',
    '{{ai.company_compliment}}': 'AI company compliment',
    '{{ai.value_proposition}}': 'AI value proposition',
    '{{ai.cta}}': 'AI call to action',
  },
};

// Pre-built sequence templates
export const SEQUENCE_TEMPLATES: Omit<SequenceTemplate, 'id' | 'created_by' | 'created_at'>[] = [
  {
    name: 'Cold Outreach - Enterprise',
    description: 'Multi-channel sequence for cold outreach to enterprise accounts. 12 touches over 4 weeks.',
    category: 'cold_outreach',
    template: {
      name: 'Cold Outreach - Enterprise',
      steps: [
        { id: '1', sequence_id: '', order: 1, type: 'message', channel: 'email', content: { body: '', tokens_used: [] } },
        { id: '2', sequence_id: '', order: 2, type: 'wait', wait: { type: 'business_days', business_days: 2 } },
        { id: '3', sequence_id: '', order: 3, type: 'message', channel: 'li_invite', content: { body: '', tokens_used: [] } },
        { id: '4', sequence_id: '', order: 4, type: 'wait', wait: { type: 'business_days', business_days: 3 } },
        { id: '5', sequence_id: '', order: 5, type: 'message', channel: 'li_chat', content: { body: '', tokens_used: [] } },
        { id: '6', sequence_id: '', order: 6, type: 'wait', wait: { type: 'business_days', business_days: 2 } },
        { id: '7', sequence_id: '', order: 7, type: 'message', channel: 'email', content: { body: '', tokens_used: [] } },
        { id: '8', sequence_id: '', order: 8, type: 'wait', wait: { type: 'business_days', business_days: 3 } },
        { id: '9', sequence_id: '', order: 9, type: 'message', channel: 'phone_task', content: { body: '', tokens_used: [] } },
        { id: '10', sequence_id: '', order: 10, type: 'wait', wait: { type: 'business_days', business_days: 5 } },
        { id: '11', sequence_id: '', order: 11, type: 'message', channel: 'email', content: { body: '', subject: 'Breaking up', tokens_used: [] } },
      ],
    },
    is_public: true,
    use_count: 156,
    avg_reply_rate: 8.2,
  },
  {
    name: 'Warm Lead Follow-up',
    description: 'Quick follow-up sequence for warm leads. 6 touches over 2 weeks.',
    category: 'warm_nurture',
    template: {
      name: 'Warm Lead Follow-up',
      steps: [
        { id: '1', sequence_id: '', order: 1, type: 'message', channel: 'email', content: { body: '', tokens_used: [] } },
        { id: '2', sequence_id: '', order: 2, type: 'wait', wait: { type: 'fixed', duration: { min: 1, max: 1, unit: 'days' } } },
        { id: '3', sequence_id: '', order: 3, type: 'message', channel: 'phone_task', content: { body: '', tokens_used: [] } },
        { id: '4', sequence_id: '', order: 4, type: 'wait', wait: { type: 'business_days', business_days: 2 } },
        { id: '5', sequence_id: '', order: 5, type: 'message', channel: 'li_chat', content: { body: '', tokens_used: [] } },
        { id: '6', sequence_id: '', order: 6, type: 'wait', wait: { type: 'business_days', business_days: 3 } },
        { id: '7', sequence_id: '', order: 7, type: 'message', channel: 'email', content: { body: '', tokens_used: [] } },
      ],
    },
    is_public: true,
    use_count: 243,
    avg_reply_rate: 15.4,
  },
  {
    name: 'Event Follow-up',
    description: 'Post-event outreach sequence. 5 touches over 10 days.',
    category: 'event_follow_up',
    template: {
      name: 'Event Follow-up',
      steps: [
        { id: '1', sequence_id: '', order: 1, type: 'message', channel: 'email', content: { body: '', subject: 'Great meeting you at [Event]', tokens_used: [] } },
        { id: '2', sequence_id: '', order: 2, type: 'wait', wait: { type: 'fixed', duration: { min: 1, max: 1, unit: 'days' } } },
        { id: '3', sequence_id: '', order: 3, type: 'message', channel: 'li_invite', content: { body: '', tokens_used: [] } },
        { id: '4', sequence_id: '', order: 4, type: 'wait', wait: { type: 'business_days', business_days: 3 } },
        { id: '5', sequence_id: '', order: 5, type: 'message', channel: 'email', content: { body: '', tokens_used: [] } },
        { id: '6', sequence_id: '', order: 6, type: 'wait', wait: { type: 'business_days', business_days: 3 } },
        { id: '7', sequence_id: '', order: 7, type: 'message', channel: 'phone_task', content: { body: '', tokens_used: [] } },
      ],
    },
    is_public: true,
    use_count: 89,
    avg_reply_rate: 22.1,
  },
];

// UI Colors for outreach module
export const OUTREACH_COLORS = {
  primary: '#6366F1',      // Indigo
  secondary: '#8B5CF6',    // Violet
  success: '#10B981',      // Green
  warning: '#F59E0B',      // Amber
  danger: '#EF4444',       // Red
  info: '#3B82F6',         // Blue

  // Channel category colors
  direct: '#3B82F6',       // Blue
  social: '#8B5CF6',       // Violet
  voice: '#10B981',        // Green
  advertising: '#F59E0B',  // Amber

  // Status colors
  draft: '#6B7280',
  active: '#10B981',
  paused: '#F59E0B',
  archived: '#9CA3AF',

  // Step type colors
  message: '#3B82F6',
  wait: '#6B7280',
  condition: '#8B5CF6',
  action: '#10B981',

  // Background
  background: '#F9FAFB',
  cardBg: '#FFFFFF',
  cardBgHover: '#F3F4F6',

  // Text
  primaryText: '#111827',
  secondaryText: '#6B7280',
  tertiaryText: '#9CA3AF',

  // Borders
  border: '#E5E7EB',
  borderHover: '#D1D5DB',
};

// Typography for outreach module
export const OUTREACH_TYPOGRAPHY = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  h1: { fontSize: '1.875rem', fontWeight: 700, lineHeight: 1.2 },
  h2: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 },
  h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
  h4: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.5 },
  body: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.5 },
  bodySmall: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.5 },
  label: { fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' as const },
};

// Get channel color by code
export const getChannelColor = (channel: ChannelCode): string => {
  const config = CHANNEL_CONFIGS[channel];
  return OUTREACH_COLORS[config.category];
};

// Get automation badge color
export const getAutomationColor = (level: 'full' | 'semi' | 'manual'): string => {
  switch (level) {
    case 'full': return OUTREACH_COLORS.success;
    case 'semi': return OUTREACH_COLORS.warning;
    case 'manual': return OUTREACH_COLORS.info;
    default: return OUTREACH_COLORS.secondaryText;
  }
};

// Get status color
export const getStatusColor = (status: 'draft' | 'active' | 'paused' | 'archived'): string => {
  return OUTREACH_COLORS[status];
};
