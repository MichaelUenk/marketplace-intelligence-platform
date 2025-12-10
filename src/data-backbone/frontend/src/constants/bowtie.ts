// ============================================================================
// BOWTIE CRM CONSTANTS
// ============================================================================

import type { StageCode, StageConfig, BowtieSide } from '../types/bowtie';

// ============================================================================
// COLOR PALETTE
// ============================================================================

// ============================================================================
// DESIGN SYSTEM COLORS - Based on Sales Intelligence Platform UI Design System
// ============================================================================

// Bowtie Stage Colors (from design system)
export const stageColors = {
  // Acquisition Wing (Left) - Cool Blues
  vm1: '#E8F4FD',      // LEAD - Lightest blue
  vm2: '#C5E4F9',      // MQL - Light blue
  vm3: '#93CCF3',      // SQL - Medium blue
  vm4: '#5FB4ED',      // SAL - Rich blue

  // Commitment Knot (Center) - Teal
  vm5: '#00B4B4',      // COMMIT - The Knot (brand teal)
  vm5Glow: 'rgba(0, 180, 180, 0.2)',

  // Expansion Wing (Right) - Greens
  vm6: '#86EFAC',      // ACTIVATED - Light green
  vm7: '#4ADE80',      // RECURRING - Medium green
  vm8: '#22C55E',      // MAXIMUM - Rich green
};

// Light mode colors - matching design system
export const lightColors = {
  // Stage colors (primary) - using brand colors
  acquisition: '#0A84FF',     // Brand blue
  activation: '#00B4B4',      // Brand teal
  expansion: '#22C55E',       // Success green

  // Stage color variants (for gradients/depth)
  acquisitionLight: '#5AC8FA',
  acquisitionDark: '#0066CC',
  activationLight: '#64D2D2',
  activationDark: '#008B8B',
  expansionLight: '#4ADE80',
  expansionDark: '#15803D',

  // Status/alert colors (from design system)
  risk: '#F59E0B',            // Warning amber
  riskBg: '#FEF3C7',
  champion: '#FFD700',
  healthy: '#10B981',         // Success green
  stalled: '#EF4444',         // Danger red
  stalledBg: '#FEE2E2',

  // UI foundation colors (from design system)
  background: '#F9FAFB',      // gray-50
  cardBg: '#FFFFFF',          // gray-0
  cardBgHover: '#F3F4F6',     // gray-100
  primaryText: '#111827',     // gray-900
  secondaryText: '#4B5563',   // gray-600
  tertiaryText: '#6B7280',    // gray-500
  border: '#E5E7EB',          // gray-200
  borderHover: '#D1D5DB',     // gray-300
  divider: '#F3F4F6',         // gray-100
};

// Dark mode colors
export const darkColors = {
  // Stage colors (primary)
  acquisition: '#5AC8FA',     // Brand blue light
  activation: '#64D2D2',      // Brand teal light
  expansion: '#4ADE80',       // Success green light

  // Stage color variants (for gradients/depth)
  acquisitionLight: '#93C5FD',
  acquisitionDark: '#0A84FF',
  activationLight: '#5EEAD4',
  activationDark: '#00B4B4',
  expansionLight: '#86EFAC',
  expansionDark: '#22C55E',

  // Status/alert colors
  risk: '#FBBF24',
  riskBg: '#422006',
  champion: '#FCD34D',
  healthy: '#34D399',
  stalled: '#F87171',
  stalledBg: '#450A0A',

  // UI foundation colors
  background: '#111827',      // gray-900
  cardBg: '#1F2937',          // gray-800
  cardBgHover: '#374151',     // gray-700
  primaryText: '#F9FAFB',     // gray-50
  secondaryText: '#9CA3AF',   // gray-400
  tertiaryText: '#6B7280',    // gray-500
  border: '#374151',          // gray-700
  borderHover: '#4B5563',     // gray-600
  divider: '#374151',         // gray-700
};

// Default export (light mode for backward compatibility)
export const colors = lightColors;

// Function to get colors based on dark mode
export const getColors = (isDarkMode: boolean) => isDarkMode ? darkColors : lightColors;

// ============================================================================
// LAYOUT SPECIFICATIONS
// ============================================================================

export const layout = {
  bowtieHeight: '60vh',
  bowtieMinHeight: '400px',
  bowtieMaxHeight: '600px',

  panelWidth: '320px',
  panelWidthExpanded: '480px',

  cardBorderRadius: '12px',
  cardShadow: '0 1px 3px rgba(0,0,0,0.1)',
  cardShadowHover: '0 4px 12px rgba(0,0,0,0.15)',
  cardPadding: '16px',

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },

  breakpoints: {
    mobile: '640px',
    tablet: '768px',
    desktop: '1024px',
    wide: '1280px',
  },
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontFamilyMono: "'JetBrains Mono', 'Fira Code', monospace",

  stageLabel: {
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },

  metricLarge: {
    fontSize: '32px',
    fontWeight: 700,
    lineHeight: 1.2,
  },
  metricMedium: {
    fontSize: '24px',
    fontWeight: 700,
    lineHeight: 1.2,
  },
  metricSmall: {
    fontSize: '18px',
    fontWeight: 600,
    lineHeight: 1.3,
  },

  body: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.5,
  },
  bodySmall: {
    fontSize: '13px',
    fontWeight: 400,
    lineHeight: 1.5,
  },

  h1: { fontSize: '28px', fontWeight: 700 },
  h2: { fontSize: '22px', fontWeight: 600 },
  h3: { fontSize: '18px', fontWeight: 600 },
  h4: { fontSize: '16px', fontWeight: 600 },
};

// ============================================================================
// STAGE CONFIGURATIONS
// ============================================================================

export const STAGES: StageConfig[] = [
  {
    code: 'VM1',
    name: 'IDENTIFIED',
    label: 'LEAD',
    description: 'Email address captured, in defined audience',
    side: 'left',
    order: 1,
  },
  {
    code: 'VM2',
    name: 'INTERESTED',
    label: 'MQL',
    description: 'Matches ICP criteria',
    side: 'left',
    order: 2,
  },
  {
    code: 'VM3',
    name: 'ENGAGED',
    label: 'SQL',
    description: 'Sales process started, conversion in progress',
    side: 'left',
    order: 3,
  },
  {
    code: 'VM4',
    name: 'PIPELINE',
    label: 'SAL',
    description: 'Active opportunity, in pipeline',
    side: 'left',
    order: 4,
  },
  {
    code: 'VM5',
    name: 'COMMITTED',
    label: 'COMMIT',
    description: 'Contract signed, deal closed',
    side: 'center',
    order: 5,
  },
  {
    code: 'VM6',
    name: 'ACTIVATED',
    label: 'ACTIVATED',
    description: 'First impact delivered, solution live',
    side: 'right',
    order: 6,
  },
  {
    code: 'VM7',
    name: 'RECURRING IMPACT',
    label: 'RECURRING',
    description: 'Hitting MRR milestones, renewals',
    side: 'right',
    order: 7,
  },
  {
    code: 'VM8',
    name: 'MAXIMUM IMPACT',
    label: 'MAX IMPACT',
    description: 'Expanded purchase, max consumption',
    side: 'right',
    order: 8,
  },
];

// ============================================================================
// STAGE HELPERS
// ============================================================================

export const getStageConfig = (code: StageCode): StageConfig => {
  const stage = STAGES.find((s) => s.code === code);
  if (!stage) throw new Error(`Unknown stage code: ${code}`);
  return stage;
};

export const getStagesByCode = (): Record<StageCode, StageConfig> => {
  return STAGES.reduce((acc, stage) => {
    acc[stage.code] = stage;
    return acc;
  }, {} as Record<StageCode, StageConfig>);
};

export const getStagesBySide = (side: BowtieSide): StageConfig[] => {
  return STAGES.filter((s) => s.side === side);
};

export const getStageColor = (side: BowtieSide, isDarkMode = false): string => {
  const c = isDarkMode ? darkColors : lightColors;
  switch (side) {
    case 'left':
      return c.acquisition;
    case 'center':
      return c.activation;
    case 'right':
      return c.expansion;
  }
};

export const getStageColorLight = (side: BowtieSide, isDarkMode = false): string => {
  const c = isDarkMode ? darkColors : lightColors;
  switch (side) {
    case 'left':
      return c.acquisitionLight;
    case 'center':
      return c.activationLight;
    case 'right':
      return c.expansionLight;
  }
};

// ============================================================================
// CONVERSION RATE LABELS
// ============================================================================

export const CONVERSION_LABELS: Record<string, { from: string; to: string; description: string }> = {
  cr1: { from: 'Lead', to: 'MQL', description: 'Contact to primary CTA conversion' },
  cr2: { from: 'MQL', to: 'SQL', description: 'New selling opportunity created' },
  cr3: { from: 'SQL', to: 'SAL', description: 'Entered pipeline stage 2' },
  cr4: { from: 'SAL', to: 'Commit', description: 'Contract signed' },
  cr5: { from: 'Commit', to: 'Activated', description: 'First impact delivered' },
  cr6: { from: 'Activated', to: 'Recurring', description: 'First renewal achieved' },
  cr7: { from: 'Recurring', to: 'Maximum', description: 'MRR increase from initial contract' },
};

// ============================================================================
// VELOCITY THRESHOLDS (days)
// ============================================================================

export const VELOCITY_THRESHOLDS: Record<StageCode, { fast: number; slow: number; stalled: number }> = {
  VM1: { fast: 3, slow: 14, stalled: 30 },
  VM2: { fast: 5, slow: 21, stalled: 45 },
  VM3: { fast: 7, slow: 30, stalled: 60 },
  VM4: { fast: 14, slow: 45, stalled: 90 },
  VM5: { fast: 7, slow: 21, stalled: 45 },
  VM6: { fast: 14, slow: 30, stalled: 60 },
  VM7: { fast: 30, slow: 90, stalled: 180 },
  VM8: { fast: 60, slow: 180, stalled: 365 },
};

// ============================================================================
// FILTER PRESETS
// ============================================================================

export const FILTER_PRESETS = {
  'high-priority': {
    name: 'High Priority',
    filters: {
      icp_tiers: ['Tier 1'],
      intent_score_min: 70,
      stalled_only: false,
    },
  },
  'needs-attention': {
    name: 'Needs Attention',
    filters: {
      at_risk_only: true,
    },
  },
  'ready-to-advance': {
    name: 'Ready to Advance',
    filters: {
      intent_score_min: 80,
      champion_identified: true,
    },
  },
  'stalled-pipeline': {
    name: 'Stalled Pipeline',
    filters: {
      stages: ['VM3', 'VM4'] as StageCode[],
      stalled_only: true,
    },
  },
};

// ============================================================================
// STAGE MOVEMENT REASONS
// ============================================================================

export const STAGE_MOVEMENT_REASONS = [
  'Qualification criteria met',
  'Meeting scheduled',
  'Proposal sent',
  'Contract signed',
  'Implementation started',
  'First value delivered',
  'Renewal confirmed',
  'Expansion opportunity',
  'Other (specify)',
];

// ============================================================================
// BUYER PERSONA COLORS
// ============================================================================

export const PERSONA_COLORS: Record<string, string> = {
  Champion: colors.champion,
  'Decision Maker': '#8B5CF6',
  'Economic Buyer': '#3B82F6',
  Influencer: '#10B981',
  User: '#6B7280',
  Blocker: colors.stalled,
  'Technical Evaluator': '#F59E0B',
  Gatekeeper: '#EC4899',
};
