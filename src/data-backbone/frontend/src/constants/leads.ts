import type { Lead, LeadSource, LeadSourceConfig, TimerInfo, TimerState, LeadStats } from '../types/leads';

// Color palette for leads
export const LEADS_COLORS = {
  // Timer colors
  timerGreen: '#22C55E',
  timerYellow: '#EAB308',
  timerOrange: '#F97316',
  timerRed: '#EF4444',

  // Status colors
  statusNew: '#3B82F6',
  statusContacted: '#10B981',
  statusQualified: '#8B5CF6',
  statusConverted: '#059669',
  statusLost: '#6B7280',

  // UI colors
  primaryText: '#111827',
  secondaryText: '#4B5563',
  tertiaryText: '#9CA3AF',
  border: '#E5E7EB',
  cardBg: '#FFFFFF',
  background: '#F9FAFB',

  // Accent
  primary: '#10B981',
  primaryHover: '#059669',
};

// Typography
export const LEADS_TYPOGRAPHY = {
  h2: { fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.3 },
  h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
  h4: { fontSize: '1rem', fontWeight: 600, lineHeight: 1.4 },
  body: { fontSize: '0.875rem', fontWeight: 400, lineHeight: 1.5 },
  bodySmall: { fontSize: '0.75rem', fontWeight: 400, lineHeight: 1.5 },
  label: { fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.5, textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
};

// Lead source configuration
export const LEAD_SOURCES: Record<LeadSource, LeadSourceConfig> = {
  'Website': {
    source: 'Website',
    icon: '🌐',
    color: '#3B82F6',
    priorityWeight: 1.0,
  },
  'Referral': {
    source: 'Referral',
    icon: '👥',
    color: '#10B981',
    priorityWeight: 1.5,
  },
  'LinkedIn': {
    source: 'LinkedIn',
    icon: '💼',
    color: '#0A66C2',
    priorityWeight: 1.2,
  },
  'Event': {
    source: 'Event',
    icon: '📅',
    color: '#8B5CF6',
    priorityWeight: 1.3,
  },
  'Cold Outreach': {
    source: 'Cold Outreach',
    icon: '📧',
    color: '#6B7280',
    priorityWeight: 0.8,
  },
  'Partner': {
    source: 'Partner',
    icon: '🤝',
    color: '#F59E0B',
    priorityWeight: 1.4,
  },
};

// Timer thresholds in milliseconds
export const TIMER_THRESHOLDS = {
  totalTime: 4 * 60 * 60 * 1000, // 4 hours
  yellowThreshold: 2 * 60 * 60 * 1000, // 2 hours
  orangeThreshold: 1 * 60 * 60 * 1000, // 1 hour
};

// Get timer state based on remaining time
export function getTimerState(remainingMs: number): TimerState {
  if (remainingMs <= 0) return 'red';
  if (remainingMs <= TIMER_THRESHOLDS.orangeThreshold) return 'orange';
  if (remainingMs <= TIMER_THRESHOLDS.yellowThreshold) return 'yellow';
  return 'green';
}

// Get timer color based on state
export function getTimerColor(state: TimerState): string {
  switch (state) {
    case 'green': return LEADS_COLORS.timerGreen;
    case 'yellow': return LEADS_COLORS.timerYellow;
    case 'orange': return LEADS_COLORS.timerOrange;
    case 'red': return LEADS_COLORS.timerRed;
  }
}

// Format time remaining
export function formatTimeRemaining(createdAt: Date): TimerInfo {
  const now = new Date();
  const elapsed = now.getTime() - createdAt.getTime();
  const remaining = TIMER_THRESHOLDS.totalTime - elapsed;

  if (remaining <= 0) {
    const overdueMs = Math.abs(remaining);
    const overdueHours = Math.floor(overdueMs / (60 * 60 * 1000));
    const overdueMinutes = Math.floor((overdueMs % (60 * 60 * 1000)) / (60 * 1000));

    return {
      text: `OVERDUE +${overdueHours}:${overdueMinutes.toString().padStart(2, '0')}`,
      state: 'red',
      isExpired: true,
      overdueMinutes: Math.floor(overdueMs / (60 * 1000)),
      percentRemaining: 0,
    };
  }

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  const seconds = Math.floor((remaining % (60 * 1000)) / 1000);

  const state = getTimerState(remaining);
  const percentRemaining = (remaining / TIMER_THRESHOLDS.totalTime) * 100;

  let text: string;
  if (hours > 0) {
    text = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    text = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  return {
    text,
    state,
    isExpired: false,
    percentRemaining,
  };
}

// Industry tags with colors
export const INDUSTRY_COLORS: Record<string, string> = {
  'SaaS': '#3B82F6',
  'FinTech': '#10B981',
  'Healthcare': '#EF4444',
  'E-commerce': '#F59E0B',
  'Manufacturing': '#6B7280',
  'Consulting': '#8B5CF6',
  'Real Estate': '#EC4899',
  'Education': '#14B8A6',
  'Media': '#F97316',
  'default': '#6B7280',
};

export function getIndustryColor(industry: string): string {
  return INDUSTRY_COLORS[industry] || INDUSTRY_COLORS.default;
}

// Calculate lead statistics
export function calculateLeadStats(leads: Lead[]): LeadStats {
  const now = new Date();

  return leads.reduce((stats, lead) => {
    // Count by status
    switch (lead.status) {
      case 'New': stats.new++; break;
      case 'Contacted': stats.contacted++; break;
      case 'Qualified': stats.qualified++; break;
      case 'Converted': stats.converted++; break;
    }

    // Check timer status
    const elapsed = now.getTime() - lead.createdAt.getTime();
    const remaining = TIMER_THRESHOLDS.totalTime - elapsed;

    if (remaining <= 0) {
      stats.overdue++;
    } else if (remaining <= TIMER_THRESHOLDS.orangeThreshold) {
      stats.urgentCount++;
    }

    stats.total++;
    return stats;
  }, {
    total: 0,
    new: 0,
    contacted: 0,
    qualified: 0,
    converted: 0,
    overdue: 0,
    urgentCount: 0,
  });
}

// Demo data generator
export function createDemoLeads(): Lead[] {
  const sources: LeadSource[] = ['Website', 'Referral', 'LinkedIn', 'Event', 'Cold Outreach', 'Partner'];
  const industries = ['SaaS', 'FinTech', 'Healthcare', 'E-commerce', 'Manufacturing', 'Consulting'];

  const demoLeads: Lead[] = [
    {
      id: 'lead_001',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@techcorp.com',
      phone: '+1 (555) 123-4567',
      source: 'LinkedIn',
      campaign: 'Q4_Enterprise_Outreach',
      background: {
        company: 'TechCorp Industries',
        role: 'VP of Engineering',
        industry: 'SaaS',
        linkedInUrl: 'linkedin.com/in/sarahjohnson',
        notes: 'Met at SaaStr conference. Interested in automation solutions for their 50-person engineering team. Currently evaluating 3 vendors.',
      },
      createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
      status: 'New',
    },
    {
      id: 'lead_002',
      name: 'Michael Chen',
      email: 'mchen@globalfinance.io',
      phone: '+1 (555) 234-5678',
      source: 'Referral',
      campaign: 'Customer_Referral_Program',
      background: {
        company: 'Global Finance Partners',
        role: 'CTO',
        industry: 'FinTech',
        linkedInUrl: 'linkedin.com/in/michaelchen',
        notes: 'Referred by John Smith at DataFlow Inc. Looking for real-time analytics platform. Budget approved for Q1.',
      },
      createdAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
      status: 'New',
    },
    {
      id: 'lead_003',
      name: 'Emily Rodriguez',
      email: 'erodriguez@healthplus.com',
      phone: '+1 (555) 345-6789',
      source: 'Website',
      campaign: 'Healthcare_Landing_Page',
      background: {
        company: 'HealthPlus Medical',
        role: 'Director of Operations',
        industry: 'Healthcare',
        linkedInUrl: 'linkedin.com/in/emilyrodriguez',
        notes: 'Downloaded case study on HIPAA compliance. Viewed pricing page 3 times in last week.',
      },
      createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000), // 2.5 hours ago
      status: 'Contacted',
    },
    {
      id: 'lead_004',
      name: 'James Williams',
      email: 'jwilliams@retailnow.com',
      phone: '+1 (555) 456-7890',
      source: 'Event',
      campaign: 'RetailTech_Summit_2024',
      background: {
        company: 'RetailNow Inc',
        role: 'Head of Digital',
        industry: 'E-commerce',
        linkedInUrl: 'linkedin.com/in/jameswilliams',
        notes: 'Attended our booth demo at RetailTech Summit. Asked about integration with Shopify. Team of 200+.',
      },
      createdAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000), // 3.5 hours ago - urgent!
      status: 'New',
    },
    {
      id: 'lead_005',
      name: 'Lisa Park',
      email: 'lpark@innovate.co',
      phone: '+1 (555) 567-8901',
      source: 'Partner',
      campaign: 'AWS_Partner_Program',
      background: {
        company: 'Innovate Solutions',
        role: 'Product Manager',
        industry: 'SaaS',
        linkedInUrl: 'linkedin.com/in/lisapark',
        notes: 'Came through AWS marketplace. Looking for data pipeline solution. Current contract with competitor expires in 60 days.',
      },
      createdAt: new Date(Date.now() - 4.2 * 60 * 60 * 1000), // 4.2 hours ago - expired!
      status: 'New',
    },
    {
      id: 'lead_006',
      name: 'David Kim',
      email: 'dkim@manufacturing.io',
      phone: '+1 (555) 678-9012',
      source: 'Cold Outreach',
      campaign: 'Manufacturing_Email_Sequence',
      background: {
        company: 'Precision Manufacturing Co',
        role: 'VP of Operations',
        industry: 'Manufacturing',
        linkedInUrl: 'linkedin.com/in/davidkim',
        notes: 'Responded to cold email sequence. Interested in IoT integration for factory floor monitoring.',
      },
      createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 mins ago
      status: 'Contacted',
    },
    {
      id: 'lead_007',
      name: 'Amanda Foster',
      email: 'afoster@consultco.com',
      phone: '+1 (555) 789-0123',
      source: 'LinkedIn',
      campaign: 'LinkedIn_Ads_Consultants',
      background: {
        company: 'ConsultCo Global',
        role: 'Managing Director',
        industry: 'Consulting',
        linkedInUrl: 'linkedin.com/in/amandafoster',
        notes: 'Clicked LinkedIn ad. 500+ consultants in the firm. Looking for client reporting solution.',
      },
      createdAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000), // 5.5 hours ago - very expired
      status: 'New',
    },
    {
      id: 'lead_008',
      name: 'Robert Taylor',
      email: 'rtaylor@startup.io',
      phone: '+1 (555) 890-1234',
      source: 'Website',
      background: {
        company: 'NextGen Startup',
        role: 'Founder & CEO',
        industry: 'SaaS',
        linkedInUrl: 'linkedin.com/in/roberttaylor',
        notes: 'Signed up for free trial. Series A funded. Looking to scale data infrastructure.',
      },
      createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 mins ago
      status: 'Qualified',
    },
  ];

  return demoLeads;
}
