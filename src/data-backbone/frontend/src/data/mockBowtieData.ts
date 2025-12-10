// ============================================================================
// MOCK DATA FOR BOWTIE CRM
// ============================================================================

import type {
  BowtieStageData,
  ConversionMetrics,
  DashboardData,
  CompanyCardData,
  StageCode,
} from '../types/bowtie';

// ============================================================================
// MOCK COMPANIES
// ============================================================================

export const mockCompanies: CompanyCardData[] = [
  // VM1 - LEAD
  {
    id: '1',
    company_name: 'TechFlow Solutions',
    domain: 'techflow.nl',
    main_industry: 'Technology',
    hq_city: 'Amsterdam',
    current_stage: 'VM1',
    days_in_stage: 5,
    pipeline_value: 25000,
    intent_score: 45,
    health_score: 65,
    velocity_status: 'on-track',
    icp_tier: 'Tier 2',
  },
  {
    id: '2',
    company_name: 'DataDriven BV',
    domain: 'datadriven.nl',
    main_industry: 'Software',
    hq_city: 'Rotterdam',
    current_stage: 'VM1',
    days_in_stage: 12,
    pipeline_value: 18000,
    intent_score: 38,
    health_score: 52,
    velocity_status: 'slow',
    icp_tier: 'Tier 3',
  },

  // VM2 - MQL
  {
    id: '3',
    company_name: 'GreenOffice NL',
    domain: 'greenoffice.nl',
    main_industry: 'Facilities Management',
    hq_city: 'Utrecht',
    current_stage: 'VM2',
    days_in_stage: 8,
    pipeline_value: 42000,
    intent_score: 72,
    health_score: 78,
    velocity_status: 'on-track',
    icp_tier: 'Tier 1',
    champion: {
      name: 'Lisa Bakker',
      title: 'Facilities Director',
      persona: 'Champion',
      confidence: 0.89,
    },
  },
  {
    id: '4',
    company_name: 'Innovate Corp',
    domain: 'innovatecorp.com',
    main_industry: 'Technology',
    hq_city: 'The Hague',
    current_stage: 'VM2',
    days_in_stage: 15,
    pipeline_value: 35000,
    intent_score: 65,
    health_score: 70,
    velocity_status: 'on-track',
    icp_tier: 'Tier 1',
  },

  // VM3 - SQL
  {
    id: '5',
    company_name: 'Acme Corporation',
    domain: 'acme.nl',
    main_industry: 'Manufacturing',
    hq_city: 'Eindhoven',
    current_stage: 'VM3',
    days_in_stage: 12,
    pipeline_value: 85000,
    intent_score: 78,
    health_score: 82,
    velocity_status: 'on-track',
    icp_tier: 'Tier 1',
    champion: {
      name: 'Jan de Vries',
      title: 'Operations Manager',
      persona: 'Champion',
      confidence: 0.94,
    },
  },
  {
    id: '6',
    company_name: 'NextGen Industries',
    domain: 'nextgen.nl',
    main_industry: 'Technology',
    hq_city: 'Amsterdam',
    current_stage: 'VM3',
    days_in_stage: 28,
    pipeline_value: 62000,
    intent_score: 61,
    health_score: 48,
    velocity_status: 'slow',
    icp_tier: 'Tier 2',
  },
  {
    id: '7',
    company_name: 'CloudFirst BV',
    domain: 'cloudfirst.nl',
    main_industry: 'Cloud Services',
    hq_city: 'Rotterdam',
    current_stage: 'VM3',
    days_in_stage: 5,
    pipeline_value: 95000,
    intent_score: 92,
    health_score: 88,
    velocity_status: 'fast',
    icp_tier: 'Tier 1',
    champion: {
      name: 'Emma van den Berg',
      title: 'CTO',
      persona: 'Champion',
      confidence: 0.97,
    },
  },

  // VM4 - SAL
  {
    id: '8',
    company_name: 'Enterprise Solutions',
    domain: 'enterprise-solutions.nl',
    main_industry: 'Consulting',
    hq_city: 'Amsterdam',
    current_stage: 'VM4',
    days_in_stage: 18,
    pipeline_value: 120000,
    intent_score: 85,
    health_score: 75,
    velocity_status: 'on-track',
    icp_tier: 'Tier 1',
    champion: {
      name: 'Pieter Jansen',
      title: 'VP Operations',
      persona: 'Decision Maker',
      confidence: 0.91,
    },
  },
  {
    id: '9',
    company_name: 'Smart Buildings Co',
    domain: 'smartbuildings.nl',
    main_industry: 'Real Estate',
    hq_city: 'Utrecht',
    current_stage: 'VM4',
    days_in_stage: 45,
    pipeline_value: 78000,
    intent_score: 58,
    health_score: 42,
    velocity_status: 'stalled',
    icp_tier: 'Tier 2',
  },

  // VM5 - COMMIT
  {
    id: '10',
    company_name: 'Digital First Agency',
    domain: 'digitalfirst.nl',
    main_industry: 'Marketing',
    hq_city: 'Amsterdam',
    current_stage: 'VM5',
    days_in_stage: 7,
    contract_value: 156000,
    intent_score: 95,
    health_score: 92,
    velocity_status: 'fast',
    icp_tier: 'Tier 1',
    champion: {
      name: 'Sophie de Groot',
      title: 'CEO',
      persona: 'Champion',
      confidence: 0.98,
    },
  },

  // VM6 - ACTIVATED
  {
    id: '11',
    company_name: 'HealthTech Plus',
    domain: 'healthtechplus.nl',
    main_industry: 'Healthcare',
    hq_city: 'Leiden',
    current_stage: 'VM6',
    days_in_stage: 21,
    contract_value: 89000,
    intent_score: 88,
    health_score: 85,
    velocity_status: 'on-track',
    icp_tier: 'Tier 1',
    champion: {
      name: 'Dr. Mark Visser',
      title: 'Medical Director',
      persona: 'Champion',
      confidence: 0.92,
    },
  },
  {
    id: '12',
    company_name: 'EcoSmart BV',
    domain: 'ecosmart.nl',
    main_industry: 'Sustainability',
    hq_city: 'Groningen',
    current_stage: 'VM6',
    days_in_stage: 14,
    contract_value: 67000,
    intent_score: 82,
    health_score: 79,
    velocity_status: 'on-track',
    icp_tier: 'Tier 1',
  },

  // VM7 - RECURRING
  {
    id: '13',
    company_name: 'GlobalTech Industries',
    domain: 'globaltech.nl',
    main_industry: 'Technology',
    hq_city: 'Amsterdam',
    current_stage: 'VM7',
    days_in_stage: 90,
    contract_value: 245000,
    mrr: 20400,
    intent_score: 91,
    health_score: 94,
    velocity_status: 'on-track',
    icp_tier: 'Tier 1',
    champion: {
      name: 'Hans Smit',
      title: 'COO',
      persona: 'Champion',
      confidence: 0.96,
    },
  },
  {
    id: '14',
    company_name: 'Nordic Partners',
    domain: 'nordicpartners.nl',
    main_industry: 'Consulting',
    hq_city: 'Rotterdam',
    current_stage: 'VM7',
    days_in_stage: 120,
    contract_value: 178000,
    mrr: 14800,
    intent_score: 76,
    health_score: 72,
    velocity_status: 'on-track',
    icp_tier: 'Tier 2',
  },

  // VM8 - MAXIMUM IMPACT
  {
    id: '15',
    company_name: 'Philips Netherlands',
    domain: 'philips.nl',
    main_industry: 'Technology',
    hq_city: 'Eindhoven',
    current_stage: 'VM8',
    days_in_stage: 365,
    contract_value: 1200000,
    mrr: 100000,
    intent_score: 98,
    health_score: 97,
    velocity_status: 'on-track',
    icp_tier: 'Tier 1',
    champion: {
      name: 'Eva van Dijk',
      title: 'VP Facilities',
      persona: 'Champion',
      confidence: 0.99,
    },
  },
];

// ============================================================================
// MOCK STAGE DATA
// ============================================================================

export const mockStageData: BowtieStageData[] = [
  {
    stage: 'VM1',
    stage_name: 'IDENTIFIED',
    stage_label: 'LEAD',
    side: 'left',
    company_count: 45,
    direct_count: 28,
    indirect_count: 17,
    total_value: 425000,
    avg_value: 9444,
    avg_days_in_stage: 8,
    median_days_in_stage: 6,
    healthy_count: 32,
    at_risk_count: 8,
    stalled_count: 5,
  },
  {
    stage: 'VM2',
    stage_name: 'INTERESTED',
    stage_label: 'MQL',
    side: 'left',
    company_count: 32,
    direct_count: 20,
    indirect_count: 12,
    total_value: 580000,
    avg_value: 18125,
    avg_days_in_stage: 12,
    median_days_in_stage: 10,
    healthy_count: 24,
    at_risk_count: 5,
    stalled_count: 3,
  },
  {
    stage: 'VM3',
    stage_name: 'ENGAGED',
    stage_label: 'SQL',
    side: 'left',
    company_count: 24,
    direct_count: 15,
    indirect_count: 9,
    total_value: 720000,
    avg_value: 30000,
    avg_days_in_stage: 18,
    median_days_in_stage: 15,
    healthy_count: 18,
    at_risk_count: 4,
    stalled_count: 2,
  },
  {
    stage: 'VM4',
    stage_name: 'PIPELINE',
    stage_label: 'SAL',
    side: 'left',
    company_count: 15,
    direct_count: 10,
    indirect_count: 5,
    total_value: 890000,
    avg_value: 59333,
    avg_days_in_stage: 25,
    median_days_in_stage: 22,
    healthy_count: 10,
    at_risk_count: 3,
    stalled_count: 2,
  },
  {
    stage: 'VM5',
    stage_name: 'COMMITTED',
    stage_label: 'COMMIT',
    side: 'center',
    company_count: 8,
    direct_count: 5,
    indirect_count: 3,
    total_value: 456000,
    avg_value: 57000,
    avg_days_in_stage: 10,
    median_days_in_stage: 8,
    healthy_count: 7,
    at_risk_count: 1,
    stalled_count: 0,
  },
  {
    stage: 'VM6',
    stage_name: 'ACTIVATED',
    stage_label: 'ACTIVATED',
    side: 'right',
    company_count: 18,
    direct_count: 12,
    indirect_count: 6,
    total_value: 678000,
    avg_value: 37667,
    avg_days_in_stage: 28,
    median_days_in_stage: 25,
    healthy_count: 15,
    at_risk_count: 2,
    stalled_count: 1,
  },
  {
    stage: 'VM7',
    stage_name: 'RECURRING IMPACT',
    stage_label: 'RECURRING',
    side: 'right',
    company_count: 42,
    direct_count: 28,
    indirect_count: 14,
    total_value: 2340000,
    avg_value: 55714,
    avg_days_in_stage: 95,
    median_days_in_stage: 85,
    healthy_count: 38,
    at_risk_count: 3,
    stalled_count: 1,
  },
  {
    stage: 'VM8',
    stage_name: 'MAXIMUM IMPACT',
    stage_label: 'MAX IMPACT',
    side: 'right',
    company_count: 12,
    direct_count: 8,
    indirect_count: 4,
    total_value: 4800000,
    avg_value: 400000,
    avg_days_in_stage: 280,
    median_days_in_stage: 250,
    healthy_count: 11,
    at_risk_count: 1,
    stalled_count: 0,
  },
];

// ============================================================================
// MOCK CONVERSION METRICS
// ============================================================================

export const mockConversionMetrics: ConversionMetrics = {
  cr1: 71.1, // Lead → MQL
  cr2: 75.0, // MQL → SQL
  cr3: 62.5, // SQL → SAL
  cr4: 53.3, // SAL → Commit
  cr5: 88.9, // Commit → Activated
  cr6: 91.7, // Activated → Recurring
  cr7: 28.6, // Recurring → Maximum
};

// ============================================================================
// MOCK DASHBOARD DATA
// ============================================================================

export const mockDashboardData: DashboardData = {
  stages: mockStageData,
  conversions: mockConversionMetrics,
  totals: {
    acquisition_value: 2615000,
    activation_count: 47,
    expansion_revenue: 7818000,
    total_accounts: 196,
  },
  updated_at: new Date(),
};

// ============================================================================
// HELPER TO GET COMPANIES BY STAGE
// ============================================================================

export const getCompaniesByStage = (stage: StageCode): CompanyCardData[] => {
  return mockCompanies.filter((c) => c.current_stage === stage);
};

// Add pipeline_value or contract_value helper
export const getCompanyValue = (company: CompanyCardData): number => {
  return company.pipeline_value || (company as any).contract_value || 0;
};
