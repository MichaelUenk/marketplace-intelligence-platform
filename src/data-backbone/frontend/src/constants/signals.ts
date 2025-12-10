import type {
  SignalCategory,
  SignalTaxonomyEntry,
  DecayConfig,
  IntentCategory,
  HotAccount,
  SignalEvent,
  SignalStats,
} from '../types/signals';

// Color palette for signals module
export const SIGNALS_COLORS = {
  // Primary colors
  primary: '#6366F1', // Indigo
  primaryLight: '#818CF8',
  primaryDark: '#4F46E5',

  // Intent category colors
  hot: '#EF4444', // Red
  warm: '#F59E0B', // Amber
  engaged: '#3B82F6', // Blue
  aware: '#8B5CF6', // Purple
  cold: '#6B7280', // Gray

  // Signal category colors
  sustainability: '#10B981', // Emerald
  workplace: '#F59E0B', // Amber
  wellbeing: '#EC4899', // Pink
  growth: '#3B82F6', // Blue
  engagement: '#8B5CF6', // Purple

  // Trend colors
  rising: '#10B981', // Green
  stable: '#6B7280', // Gray
  falling: '#EF4444', // Red

  // UI colors
  background: '#F9FAFB',
  cardBg: '#FFFFFF',
  cardBgHover: '#F3F4F6',
  border: '#E5E7EB',
  primaryText: '#111827',
  secondaryText: '#6B7280',
  tertiaryText: '#9CA3AF',

  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
};

// Typography styles
export const SIGNALS_TYPOGRAPHY = {
  h1: {
    fontSize: '1.875rem',
    fontWeight: 700,
    lineHeight: 1.2,
  },
  h2: {
    fontSize: '1.5rem',
    fontWeight: 600,
    lineHeight: 1.3,
  },
  h3: {
    fontSize: '1.25rem',
    fontWeight: 600,
    lineHeight: 1.4,
  },
  h4: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: 1.5,
  },
  body: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  bodySmall: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  label: {
    fontSize: '0.75rem',
    fontWeight: 500,
    letterSpacing: '0.025em',
    textTransform: 'uppercase' as const,
  },
};

// Intent category configuration
export const INTENT_CATEGORIES: Record<IntentCategory, { label: string; color: string; minScore: number; maxScore: number }> = {
  hot: { label: 'Hot', color: SIGNALS_COLORS.hot, minScore: 80, maxScore: 100 },
  warm: { label: 'Warm', color: SIGNALS_COLORS.warm, minScore: 60, maxScore: 79 },
  engaged: { label: 'Engaged', color: SIGNALS_COLORS.engaged, minScore: 40, maxScore: 59 },
  aware: { label: 'Aware', color: SIGNALS_COLORS.aware, minScore: 20, maxScore: 39 },
  cold: { label: 'Cold', color: SIGNALS_COLORS.cold, minScore: 0, maxScore: 19 },
};

// Signal category labels
export const SIGNAL_CATEGORY_LABELS: Record<SignalCategory, string> = {
  sustainability: 'Sustainability',
  workplace_experience: 'Workplace Experience',
  employee_wellbeing: 'Employee Wellbeing',
  growth_expansion: 'Growth & Expansion',
  direct_engagement: 'Direct Engagement',
  operational: 'Operational',
  technology: 'Technology',
  relationship: 'Relationship',
};

// Signal category icons
export const SIGNAL_CATEGORY_ICONS: Record<SignalCategory, string> = {
  sustainability: '🌱',
  workplace_experience: '🏢',
  employee_wellbeing: '💚',
  growth_expansion: '📈',
  direct_engagement: '🎯',
  operational: '⚙️',
  technology: '💻',
  relationship: '🤝',
};

// Signal type icons
export const SIGNAL_TYPE_ICONS: Record<string, string> = {
  // Growth & Expansion
  office_opening: '🏢',
  funding_round: '💰',
  ipo_ma_activity: '📊',
  revenue_milestone: '💵',
  employee_growth: '👥',
  geographic_expansion: '🌍',
  // Sustainability
  esg_initiative: '🌱',
  carbon_reduction: '🌿',
  plastic_free_pledge: '♻️',
  bcorp_certification: '🏆',
  sustainability_hire: '🌍',
  // Workplace
  office_redesign: '🎨',
  hybrid_work_policy: '🏠',
  employee_perks: '🎁',
  workplace_award: '🏅',
  culture_initiative: '🎭',
  // Wellbeing
  wellness_program: '💚',
  mental_health_focus: '🧠',
  fitness_benefits: '🏃',
  health_insurance: '🏥',
  // Operational
  lease_renewal: '📝',
  facility_upgrade: '🔧',
  move_announcement: '📦',
  space_expansion: '📐',
  contract_expiry: '⏰',
  vendor_complaint: '⚠️',
  rfp_published: '📋',
  vendor_review: '⭐',
  tech_stack_change: '🔄',
  iot_initiative: '📡',
  digital_transformation: '🚀',
  // Engagement
  pricing_page_view: '💲',
  multiple_page_views: '👀',
  case_study_download: '📥',
  demo_request: '🎯',
  return_visit: '🔄',
  email_open: '📧',
  email_click: '🔗',
  webinar_registration: '📅',
  webinar_attendance: '🎓',
  content_download: '📄',
  ad_click: '📣',
  ad_impression: '👁️',
  retargeting_engage: '🎯',
  // Employee signals
  new_role: '💼',
  promotion: '⬆️',
  title_change: '📝',
  department_move: '🔀',
  profile_update: '✏️',
  skills_addition: '📚',
  posted_content: '📝',
  relevant_content: '📰',
  linkedin_engagement: '💬',
  company_follow: '➕',
  competitor_research: '🔍',
  product_research: '🛒',
  vendor_comparison: '⚖️',
  // Relationship
  mutual_connection: '🔗',
  customer_connection: '🤝',
  team_connection: '👋',
  champion_connection: '⭐',
  former_customer: '🏷️',
  former_contact: '📇',
  event_attendee: '🎪',
  referral_source: '📨',
  // Direct engagement
  website_visit: '🌐',
  email_response: '✉️',
  meeting_accepted: '📆',
  inmail_response: '💬',
  profile_view: '👤',
  company_page_view: '🏢',
  job_page_view: '💼',
};

// Signal taxonomy - complete list of all signals
export const SIGNAL_TAXONOMY: SignalTaxonomyEntry[] = [
  // Strategic - Growth & Expansion
  { type: 'office_opening', category: 'growth_expansion', label: 'Office Opening', description: 'New office/location announcement', weight: 95, decay_days: 90, icon: '🏢' },
  { type: 'funding_round', category: 'growth_expansion', label: 'Funding Round', description: 'Series A/B/C or significant investment', weight: 90, decay_days: 180, icon: '💰' },
  { type: 'ipo_ma_activity', category: 'growth_expansion', label: 'IPO/M&A Activity', description: 'Going public or acquisition activity', weight: 85, decay_days: 120, icon: '📊' },
  { type: 'revenue_milestone', category: 'growth_expansion', label: 'Revenue Milestone', description: 'Revenue growth announcement', weight: 80, decay_days: 90, icon: '💵' },
  { type: 'employee_growth', category: 'growth_expansion', label: 'Employee Growth', description: '20%+ headcount increase', weight: 75, decay_days: 60, icon: '👥' },
  { type: 'geographic_expansion', category: 'growth_expansion', label: 'Geographic Expansion', description: 'Entering new markets', weight: 85, decay_days: 90, icon: '🌍' },

  // Strategic - Sustainability
  { type: 'esg_initiative', category: 'sustainability', label: 'ESG Initiative', description: 'New sustainability program announced', weight: 90, decay_days: 120, icon: '🌱' },
  { type: 'carbon_reduction', category: 'sustainability', label: 'Carbon Reduction', description: 'Carbon neutrality or reduction goals', weight: 85, decay_days: 180, icon: '🌿' },
  { type: 'plastic_free_pledge', category: 'sustainability', label: 'Plastic-Free Pledge', description: 'Reducing single-use plastics', weight: 95, decay_days: 180, icon: '♻️' },
  { type: 'bcorp_certification', category: 'sustainability', label: 'B-Corp Certification', description: 'Certified or pursuing B-Corp', weight: 80, decay_days: 365, icon: '🏆' },
  { type: 'sustainability_hire', category: 'sustainability', label: 'Sustainability Hire', description: 'CSR/Sustainability role posted', weight: 85, decay_days: 60, icon: '🌍' },

  // Strategic - Workplace
  { type: 'office_redesign', category: 'workplace_experience', label: 'Office Redesign', description: 'Workplace renovation/redesign', weight: 90, decay_days: 90, icon: '🎨' },
  { type: 'hybrid_work_policy', category: 'workplace_experience', label: 'Hybrid Work Policy', description: 'Return-to-office or hybrid announcement', weight: 80, decay_days: 60, icon: '🏠' },
  { type: 'employee_perks', category: 'workplace_experience', label: 'Employee Perks', description: 'New employee benefits program', weight: 75, decay_days: 90, icon: '🎁' },
  { type: 'workplace_award', category: 'workplace_experience', label: 'Workplace Award', description: 'Best Places to Work recognition', weight: 70, decay_days: 180, icon: '🏅' },
  { type: 'culture_initiative', category: 'workplace_experience', label: 'Culture Initiative', description: 'Employee engagement program', weight: 70, decay_days: 90, icon: '🎭' },

  // Strategic - Wellbeing
  { type: 'wellness_program', category: 'employee_wellbeing', label: 'Wellness Program', description: 'Health/wellness initiative launch', weight: 90, decay_days: 90, icon: '💚' },
  { type: 'mental_health_focus', category: 'employee_wellbeing', label: 'Mental Health Focus', description: 'Mental health benefits/programs', weight: 85, decay_days: 90, icon: '🧠' },
  { type: 'fitness_benefits', category: 'employee_wellbeing', label: 'Fitness Benefits', description: 'Gym/fitness program announcement', weight: 75, decay_days: 90, icon: '🏃' },
  { type: 'health_insurance', category: 'employee_wellbeing', label: 'Health Insurance', description: 'Enhanced health coverage', weight: 70, decay_days: 180, icon: '🏥' },

  // Engagement
  { type: 'demo_request', category: 'direct_engagement', label: 'Demo Request', description: 'Submitted demo form', weight: 100, decay_days: 7, icon: '🎯' },
  { type: 'pricing_page_view', category: 'direct_engagement', label: 'Pricing Page View', description: 'Visited pricing/plans page', weight: 90, decay_days: 7, icon: '💲' },
  { type: 'case_study_download', category: 'direct_engagement', label: 'Case Study Download', description: 'Downloaded customer story', weight: 85, decay_days: 14, icon: '📥' },
  { type: 'return_visit', category: 'direct_engagement', label: 'Return Visit', description: 'Multiple visits within 7 days', weight: 80, decay_days: 14, icon: '🔄' },
  { type: 'multiple_page_views', category: 'direct_engagement', label: 'Multiple Page Views', description: '3+ pages in single session', weight: 70, decay_days: 14, icon: '👀' },
  { type: 'webinar_attendance', category: 'direct_engagement', label: 'Webinar Attendance', description: 'Attended full webinar', weight: 85, decay_days: 30, icon: '🎓' },
  { type: 'webinar_registration', category: 'direct_engagement', label: 'Webinar Registration', description: 'Registered for webinar', weight: 75, decay_days: 30, icon: '📅' },
  { type: 'content_download', category: 'direct_engagement', label: 'Content Download', description: 'Downloaded whitepaper/guide', weight: 70, decay_days: 21, icon: '📄' },
  { type: 'email_click', category: 'direct_engagement', label: 'Email Click', description: 'Clicked link in email', weight: 60, decay_days: 14, icon: '🔗' },
  { type: 'email_open', category: 'direct_engagement', label: 'Email Open', description: 'Opened marketing email', weight: 40, decay_days: 14, icon: '📧' },
];

// Decay configurations
export const DECAY_CONFIGS: DecayConfig[] = [
  // Strategic signals decay slowly
  { signal_type: 'funding_round', half_life_days: 90, min_value: 10, max_age_days: 365 },
  { signal_type: 'office_opening', half_life_days: 60, min_value: 10, max_age_days: 180 },
  { signal_type: 'esg_initiative', half_life_days: 90, min_value: 15, max_age_days: 365 },

  // Engagement signals decay quickly
  { signal_type: 'website_visit', half_life_days: 7, min_value: 5, max_age_days: 30 },
  { signal_type: 'email_open', half_life_days: 7, min_value: 0, max_age_days: 30 },
  { signal_type: 'pricing_page_view', half_life_days: 5, min_value: 10, max_age_days: 21 },

  // Direct response never fully decays
  { signal_type: 'demo_request', half_life_days: 14, min_value: 50, max_age_days: 90 },
  { signal_type: 'meeting_accepted', half_life_days: 7, min_value: 60, max_age_days: 30 },

  // Role changes decay moderately
  { signal_type: 'new_role', half_life_days: 45, min_value: 20, max_age_days: 180 },
  { signal_type: 'promotion', half_life_days: 45, min_value: 15, max_age_days: 180 },
];

// Helper functions
export function getIntentCategoryColor(category: IntentCategory): string {
  return INTENT_CATEGORIES[category]?.color || SIGNALS_COLORS.cold;
}

export function getIntentCategoryLabel(category: IntentCategory): string {
  return INTENT_CATEGORIES[category]?.label || 'Unknown';
}

export function getSignalIcon(signalType: string): string {
  return SIGNAL_TYPE_ICONS[signalType] || '📌';
}

export function getCategoryColor(category: SignalCategory): string {
  const colors: Record<SignalCategory, string> = {
    sustainability: SIGNALS_COLORS.sustainability,
    workplace_experience: SIGNALS_COLORS.workplace,
    employee_wellbeing: SIGNALS_COLORS.wellbeing,
    growth_expansion: SIGNALS_COLORS.growth,
    direct_engagement: SIGNALS_COLORS.engagement,
    operational: SIGNALS_COLORS.secondaryText,
    technology: SIGNALS_COLORS.info,
    relationship: SIGNALS_COLORS.primary,
  };
  return colors[category] || SIGNALS_COLORS.secondaryText;
}

export function getTrendColor(trend: 'rising' | 'stable' | 'falling'): string {
  const colors = {
    rising: SIGNALS_COLORS.rising,
    stable: SIGNALS_COLORS.stable,
    falling: SIGNALS_COLORS.falling,
  };
  return colors[trend] || SIGNALS_COLORS.stable;
}

export function getTrendArrow(trend: 'rising' | 'stable' | 'falling'): string {
  const arrows = {
    rising: '↑',
    stable: '→',
    falling: '↓',
  };
  return arrows[trend] || '→';
}

export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

// Demo data for initial state
export const createDemoSignalStats = (): SignalStats => ({
  total_signals: 2847,
  signals_change_percent: 23,
  hot_accounts: 47,
  hot_accounts_change_percent: 12,
  warm_accounts: 186,
  warm_accounts_change_percent: 8,
  new_today: 124,
  new_today_change_percent: 34,
});

export const createDemoHotAccounts = (): HotAccount[] => [
  {
    id: 'demo-1',
    company_name: 'ACME Corporation',
    domain: 'acme.com',
    main_industry: 'Technology',
    hq_city: 'Amsterdam',
    hq_country: 'Netherlands',
    overall_score: 94,
    intent_category: 'hot',
    score_trend: 'rising',
    active_signal_count: 8,
    strongest_signal_type: 'sustainability_hire',
    newest_signal_at: new Date(Date.now() - 2 * 3600000), // 2 hours ago
    company_narrative: 'ACME is a fast-growing tech company in active expansion mode with strong sustainability focus.',
    recommended_approach: 'Lead with sustainability angle - their plastic-free pledge aligns perfectly.',
    icp_tier: 'Tier 1',
    champion: {
      id: 'c1',
      name: 'Eva Visser',
      title: 'COO',
      score: 87,
    },
    recent_signals: [
      { type: 'esg_initiative', title: 'Announced new sustainability initiative', detected_at: new Date(Date.now() - 2 * 3600000), score: 15 },
      { type: 'sustainability_hire', title: 'Posted "Office Manager" role', detected_at: new Date(Date.now() - 5 * 3600000), score: 10 },
      { type: 'pricing_page_view', title: 'Visited pricing page 3x this week', detected_at: new Date(Date.now() - 48 * 3600000), score: 8 },
    ],
  },
  {
    id: 'demo-2',
    company_name: 'TechFlow BV',
    domain: 'techflow.nl',
    main_industry: 'SaaS',
    hq_city: 'Rotterdam',
    hq_country: 'Netherlands',
    overall_score: 88,
    intent_category: 'hot',
    score_trend: 'rising',
    active_signal_count: 5,
    strongest_signal_type: 'funding_round',
    newest_signal_at: new Date(Date.now() - 24 * 3600000), // 1 day ago
    company_narrative: 'Recently funded SaaS company expanding rapidly with new office opening.',
    recommended_approach: 'Reference their growth and new office as natural timing for vendor evaluation.',
    icp_tier: 'Tier 1',
    recent_signals: [
      { type: 'funding_round', title: 'Series B funding announced - €15M', detected_at: new Date(Date.now() - 24 * 3600000), score: 20 },
      { type: 'office_opening', title: 'Opening second office in Amsterdam', detected_at: new Date(Date.now() - 24 * 3600000), score: 14 },
    ],
  },
  {
    id: 'demo-3',
    company_name: 'GreenOffice NL',
    domain: 'greenoffice.nl',
    main_industry: 'Professional Services',
    hq_city: 'Utrecht',
    hq_country: 'Netherlands',
    overall_score: 82,
    intent_category: 'hot',
    score_trend: 'rising',
    active_signal_count: 4,
    strongest_signal_type: 'plastic_free_pledge',
    newest_signal_at: new Date(Date.now() - 3 * 3600000),
    company_narrative: 'Consulting firm with strong sustainability commitment and growing team.',
    recommended_approach: 'Direct sustainability alignment - they are actively pursuing plastic-free certification.',
    icp_tier: 'Tier 2',
    champion: {
      id: 'c2',
      name: 'Mark de Jong',
      title: 'Facilities Director',
      score: 72,
    },
    recent_signals: [
      { type: 'plastic_free_pledge', title: 'Announced plastic-free office goal', detected_at: new Date(Date.now() - 3 * 3600000), score: 18 },
      { type: 'wellness_program', title: 'Launched employee wellness program', detected_at: new Date(Date.now() - 72 * 3600000), score: 12 },
    ],
  },
];

export const createDemoRecentSignals = (): SignalEvent[] => [
  {
    id: 's1',
    entity_type: 'company',
    company_id: 'demo-1',
    signal_type: 'esg_initiative',
    signal_category: 'sustainability',
    base_weight: 90,
    current_score: 15,
    confidence: 0.95,
    title: 'Sustainability Initiative',
    description: 'ACME announces commitment to eliminate single-use plastic across all offices by 2025',
    data_source: 'news',
    status: 'active',
    detected_at: new Date(Date.now() - 2 * 60000), // 2 min ago
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 's2',
    entity_type: 'company',
    company_id: 'demo-4',
    signal_type: 'pricing_page_view',
    signal_category: 'direct_engagement',
    base_weight: 90,
    current_score: 8,
    confidence: 1.0,
    title: 'Pricing Page View',
    description: 'Visited pricing page from Utrecht IP',
    data_source: 'website',
    status: 'active',
    detected_at: new Date(Date.now() - 15 * 60000), // 15 min ago
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 's3',
    entity_type: 'company',
    company_id: 'demo-5',
    signal_type: 'sustainability_hire',
    signal_category: 'sustainability',
    base_weight: 85,
    current_score: 12,
    confidence: 0.88,
    title: 'Facilities Manager Hire',
    description: 'Posted job opening for Facilities Manager with sustainability focus',
    data_source: 'linkedin',
    status: 'active',
    detected_at: new Date(Date.now() - 23 * 60000), // 23 min ago
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 's4',
    entity_type: 'contact',
    company_id: 'demo-6',
    contact_id: 'contact-1',
    signal_type: 'relevant_content',
    signal_category: 'direct_engagement',
    base_weight: 90,
    current_score: 6,
    confidence: 0.82,
    title: 'LinkedIn: Wellness Post',
    description: 'Posted about workplace wellness initiatives',
    data_source: 'linkedin',
    status: 'active',
    detected_at: new Date(Date.now() - 60 * 60000), // 1 hour ago
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 's5',
    entity_type: 'company',
    company_id: 'demo-2',
    signal_type: 'funding_round',
    signal_category: 'growth_expansion',
    base_weight: 90,
    current_score: 20,
    confidence: 0.99,
    title: 'Funding Announced',
    description: 'TechFlow BV raises €15M Series B to fuel European expansion',
    data_source: 'crunchbase',
    status: 'active',
    detected_at: new Date(Date.now() - 60 * 60000), // 1 hour ago
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 's6',
    entity_type: 'company',
    company_id: 'demo-7',
    signal_type: 'office_opening',
    signal_category: 'growth_expansion',
    base_weight: 95,
    current_score: 14,
    confidence: 0.92,
    title: 'Office Expansion',
    description: 'CleanTech NL to add 2,000 sqm to Amsterdam headquarters',
    data_source: 'news',
    status: 'active',
    detected_at: new Date(Date.now() - 2 * 3600000), // 2 hours ago
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 's7',
    entity_type: 'company',
    company_id: 'demo-1',
    signal_type: 'sustainability_hire',
    signal_category: 'sustainability',
    base_weight: 85,
    current_score: 10,
    confidence: 0.90,
    title: 'Office Manager Role',
    description: 'ACME posted Office Manager role with sustainability responsibilities',
    data_source: 'linkedin',
    status: 'active',
    detected_at: new Date(Date.now() - 2 * 3600000), // 2 hours ago
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 's8',
    entity_type: 'company',
    company_id: 'demo-8',
    signal_type: 'multiple_page_views',
    signal_category: 'direct_engagement',
    base_weight: 70,
    current_score: 5,
    confidence: 1.0,
    title: 'Website Visit (5 pages)',
    description: 'Browsed pricing, features, and case studies',
    data_source: 'website',
    status: 'active',
    detected_at: new Date(Date.now() - 3 * 3600000), // 3 hours ago
    created_at: new Date(),
    updated_at: new Date(),
  },
];

// Company name lookup for demo data
export const DEMO_COMPANY_NAMES: Record<string, string> = {
  'demo-1': 'ACME Corp',
  'demo-2': 'TechFlow BV',
  'demo-3': 'GreenOffice NL',
  'demo-4': 'GreenOffice NL',
  'demo-5': 'Nordic Hotels',
  'demo-6': 'DataDriven BV',
  'demo-7': 'CleanTech NL',
  'demo-8': 'FinServe Group',
};
