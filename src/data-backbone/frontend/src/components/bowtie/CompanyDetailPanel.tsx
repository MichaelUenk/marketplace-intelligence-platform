import React, { useState } from 'react';
import { colors, layout, typography, getStageConfig, getStageColor, PERSONA_COLORS } from '../../constants/bowtie';
import type { CompanyCardData, StageCode, Contact } from '../../types/bowtie';
import { formatCurrency, getHealthLabel, getHealthColor } from '../../utils/bowtie';
import IntentSignalBars from './IntentSignalBars';
import RiverTimeline from './RiverTimeline';

interface CompanyDetailPanelProps {
  company: CompanyCardData;
  onClose: () => void;
  onMoveStage: (newStage: StageCode) => void;
}

// Mock contacts for demo
const mockContacts: Contact[] = [
  {
    id: '1',
    company_id: '1',
    full_name: 'Eva Visser',
    first_name: 'Eva',
    last_name: 'Visser',
    job_title: 'COO',
    department: 'Operations',
    seniority: 'C-Level',
    email: 'eva.visser@acme.nl',
    phone_number: '+31 6 1234 5678',
    linkedin_url: 'https://linkedin.com/in/evavisser',
    linkedin_headline: 'COO | Operations Excellence | Sustainability Champion',
    buyer_persona_type: 'Champion',
    buyer_persona_confidence: 0.91,
    is_primary_contact: true,
    work_history_relevance: 'High',
    educational_background: 'MBA from Rotterdam School of Management',
    sales_approach_summary: 'Lead with sustainability angle. Reference her Philips experience.',
    key_talking_points: [
      'Experience with iBood at Philips',
      'Published article on workplace wellness',
      'Connected to 3 existing customers',
    ],
    schooling_summary: 'MBA Rotterdam School of Management, Focus on operations & sustainability',
    job_history_summary: 'Previously managed facilities at Philips. 15+ years in operations.',
    engagement_score: 85,
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: '2',
    company_id: '1',
    full_name: 'Pieter Jansen',
    first_name: 'Pieter',
    last_name: 'Jansen',
    job_title: 'CFO',
    department: 'Finance',
    seniority: 'C-Level',
    email: 'pieter.jansen@acme.nl',
    phone_number: '+31 6 2345 6789',
    linkedin_url: 'https://linkedin.com/in/pieterjansen',
    linkedin_headline: 'CFO | Financial Strategy | M&A',
    buyer_persona_type: 'Economic Buyer',
    buyer_persona_confidence: 0.87,
    is_primary_contact: false,
    work_history_relevance: 'Medium',
    educational_background: 'MSc Finance from University of Amsterdam',
    sales_approach_summary: 'Focus on ROI and cost savings. Prepare detailed financial projections.',
    key_talking_points: [
      'Interested in cost optimization',
      'Previously approved similar deals',
      'Prefers data-driven proposals',
    ],
    schooling_summary: 'MSc Finance, University of Amsterdam',
    job_history_summary: 'CFO for 8 years, previously at Unilever finance department.',
    engagement_score: 62,
    created_at: new Date(),
    updated_at: new Date(),
  },
];

// Mock stage history
const mockStageHistory = [
  { stage: 'VM1' as StageCode, entered_at: new Date('2024-01-15'), duration_days: 7 },
  { stage: 'VM2' as StageCode, entered_at: new Date('2024-01-22'), duration_days: 12 },
  { stage: 'VM3' as StageCode, entered_at: new Date('2024-02-03'), duration_days: 15 },
  { stage: 'VM4' as StageCode, entered_at: new Date('2024-02-18'), duration_days: 11 },
  { stage: 'VM5' as StageCode, entered_at: new Date('2024-03-01'), duration_days: null },
];

const CompanyDetailPanel: React.FC<CompanyDetailPanelProps> = ({
  company,
  onClose,
  onMoveStage,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'timeline' | 'intelligence'>('overview');

  const stageConfig = getStageConfig(company.current_stage);
  const stageColor = getStageColor(stageConfig.side);
  const healthColor = getHealthColor(company.health_score);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: layout.panelWidthExpanded,
        height: '100vh',
        backgroundColor: colors.cardBg,
        boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: typography.fontFamily,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: layout.spacing.lg,
          borderBottom: `1px solid ${colors.border}`,
          backgroundColor: stageColor,
          color: 'white',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: layout.spacing.sm }}>
              <span style={{ fontSize: '24px' }}>🏢</span>
              <h2 style={{ ...typography.h2, margin: 0, color: 'white' }}>
                {company.company_name}
              </h2>
            </div>
            <div style={{ ...typography.body, opacity: 0.9, marginTop: layout.spacing.xs }}>
              {company.main_industry} • {company.hq_city}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '8px',
              padding: layout.spacing.sm,
              color: 'white',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Stage Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: layout.spacing.md,
            marginTop: layout.spacing.md,
          }}
        >
          <span
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              padding: '6px 12px',
              borderRadius: '16px',
              ...typography.stageLabel,
            }}
          >
            {stageConfig.label}
          </span>
          <span style={{ ...typography.bodySmall, opacity: 0.9 }}>
            {company.days_in_stage} days in stage
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        {(['overview', 'contacts', 'timeline', 'intelligence'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              padding: layout.spacing.md,
              border: 'none',
              backgroundColor: activeTab === tab ? colors.cardBg : colors.background,
              borderBottom: activeTab === tab ? `2px solid ${stageColor}` : '2px solid transparent',
              color: activeTab === tab ? stageColor : colors.secondaryText,
              cursor: 'pointer',
              ...typography.bodySmall,
              fontWeight: activeTab === tab ? 600 : 400,
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: layout.spacing.lg }}>
        {activeTab === 'overview' && (
          <OverviewTab company={company} stageColor={stageColor} healthColor={healthColor} />
        )}
        {activeTab === 'contacts' && (
          <ContactsTab contacts={mockContacts} />
        )}
        {activeTab === 'timeline' && (
          <RiverTimeline
            history={mockStageHistory}
            currentStage={company.current_stage}
          />
        )}
        {activeTab === 'intelligence' && (
          <IntelligenceTab company={company} />
        )}
      </div>

      {/* Footer Actions */}
      <div
        style={{
          padding: layout.spacing.lg,
          borderTop: `1px solid ${colors.border}`,
          display: 'flex',
          gap: layout.spacing.sm,
        }}
      >
        <button
          style={{
            flex: 1,
            padding: layout.spacing.md,
            borderRadius: '8px',
            border: `1px solid ${colors.border}`,
            backgroundColor: 'white',
            color: colors.primaryText,
            cursor: 'pointer',
            ...typography.body,
          }}
        >
          Edit
        </button>
        <button
          onClick={() => {
            const nextStages: Record<StageCode, StageCode | null> = {
              VM1: 'VM2', VM2: 'VM3', VM3: 'VM4', VM4: 'VM5',
              VM5: 'VM6', VM6: 'VM7', VM7: 'VM8', VM8: null,
            };
            const next = nextStages[company.current_stage];
            if (next) onMoveStage(next);
          }}
          style={{
            flex: 1,
            padding: layout.spacing.md,
            borderRadius: '8px',
            border: 'none',
            backgroundColor: stageColor,
            color: 'white',
            cursor: 'pointer',
            ...typography.body,
            fontWeight: 500,
          }}
        >
          Move to Next Stage →
        </button>
      </div>
    </div>
  );
};

// Overview Tab
const OverviewTab: React.FC<{
  company: CompanyCardData;
  stageColor: string;
  healthColor: string;
}> = ({ company, stageColor, healthColor }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: layout.spacing.lg }}>
    {/* Key Metrics */}
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: layout.spacing.md,
      }}
    >
      <MetricCard label="Pipeline Value" value={formatCurrency(company.pipeline_value || 0)} />
      <MetricCard label="ICP Tier" value={company.icp_tier} />
      <MetricCard label="Intent Score" value={`${company.intent_score}/100`} color={stageColor} />
      <MetricCard label="Health Score" value={getHealthLabel(company.health_score)} color={healthColor} />
    </div>

    {/* Intent Signals */}
    <div>
      <h4 style={{ ...typography.h4, color: colors.primaryText, marginBottom: layout.spacing.md }}>
        Intent Signals
      </h4>
      <IntentSignalBars
        signals={{
          sustainability: 4,
          workplace_experience: 3,
          employee_wellbeing: 4,
          growth_expansion: 5,
        }}
      />
    </div>

    {/* Recommended Actions */}
    <div>
      <h4 style={{ ...typography.h4, color: colors.primaryText, marginBottom: layout.spacing.md }}>
        Recommended Next Steps
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: layout.spacing.sm }}>
        {[
          'Schedule facility walkthrough',
          'Share sustainability case study',
          'Introduce to similar customer',
          'Propose pilot for new floor',
        ].map((step, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: layout.spacing.sm,
              padding: layout.spacing.sm,
              backgroundColor: colors.background,
              borderRadius: '8px',
              ...typography.bodySmall,
            }}
          >
            <span style={{ color: stageColor, fontWeight: 600 }}>{i + 1}.</span>
            <span style={{ color: colors.primaryText }}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Metric Card
const MetricCard: React.FC<{ label: string; value: string; color?: string }> = ({
  label,
  value,
  color,
}) => (
  <div
    style={{
      padding: layout.spacing.md,
      backgroundColor: colors.background,
      borderRadius: '8px',
    }}
  >
    <div style={{ ...typography.bodySmall, color: colors.secondaryText }}>{label}</div>
    <div style={{ ...typography.metricSmall, color: color || colors.primaryText, marginTop: '4px' }}>
      {value}
    </div>
  </div>
);

// Contacts Tab
const ContactsTab: React.FC<{ contacts: Contact[] }> = ({ contacts }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: layout.spacing.md }}>
    {contacts.map((contact) => (
      <div
        key={contact.id}
        style={{
          padding: layout.spacing.md,
          backgroundColor: colors.background,
          borderRadius: '12px',
          borderLeft: `3px solid ${PERSONA_COLORS[contact.buyer_persona_type] || colors.secondaryText}`,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: layout.spacing.sm }}>
              {contact.is_primary_contact && <span style={{ color: colors.champion }}>★</span>}
              <span style={{ ...typography.h4, color: colors.primaryText }}>{contact.full_name}</span>
            </div>
            <div style={{ ...typography.bodySmall, color: colors.secondaryText, marginTop: '2px' }}>
              {contact.job_title} • {contact.department}
            </div>
          </div>
          <span
            style={{
              ...typography.stageLabel,
              fontSize: '10px',
              color: PERSONA_COLORS[contact.buyer_persona_type],
              backgroundColor: `${PERSONA_COLORS[contact.buyer_persona_type]}15`,
              padding: '4px 8px',
              borderRadius: '4px',
            }}
          >
            {contact.buyer_persona_type}
          </span>
        </div>

        <div style={{ marginTop: layout.spacing.sm, ...typography.bodySmall, color: colors.secondaryText }}>
          {contact.email}
        </div>

        {contact.key_talking_points && (
          <div style={{ marginTop: layout.spacing.sm }}>
            <div style={{ ...typography.bodySmall, color: colors.primaryText, fontWeight: 500 }}>
              Key Talking Points:
            </div>
            <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
              {contact.key_talking_points.slice(0, 3).map((point, i) => (
                <li key={i} style={{ ...typography.bodySmall, color: colors.secondaryText }}>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    ))}
  </div>
);

// Intelligence Tab
const IntelligenceTab: React.FC<{ company: CompanyCardData }> = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: layout.spacing.lg }}>
    <div
      style={{
        padding: layout.spacing.md,
        backgroundColor: colors.background,
        borderRadius: '12px',
      }}
    >
      <h4 style={{ ...typography.h4, color: colors.primaryText, margin: 0, marginBottom: layout.spacing.sm }}>
        Sales Summary
      </h4>
      <p style={{ ...typography.body, color: colors.secondaryText, margin: 0 }}>
        High-growth tech company actively investing in workplace wellness. Recent office expansion
        indicates strong hydration solution fit. Previous experience with competitor products
        suggests readiness for premium solution upgrade.
      </p>
    </div>

    <div
      style={{
        padding: layout.spacing.md,
        backgroundColor: colors.background,
        borderRadius: '12px',
      }}
    >
      <h4 style={{ ...typography.h4, color: colors.primaryText, margin: 0, marginBottom: layout.spacing.sm }}>
        ICP Analysis
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: layout.spacing.sm }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ ...typography.bodySmall, color: colors.secondaryText }}>Company Size</span>
          <span style={{ ...typography.bodySmall, color: colors.primaryText }}>Enterprise (500+)</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ ...typography.bodySmall, color: colors.secondaryText }}>Industry Fit</span>
          <span style={{ ...typography.bodySmall, color: colors.healthy }}>High</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ ...typography.bodySmall, color: colors.secondaryText }}>Budget Indicator</span>
          <span style={{ ...typography.bodySmall, color: colors.primaryText }}>Above Average</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ ...typography.bodySmall, color: colors.secondaryText }}>Decision Timeline</span>
          <span style={{ ...typography.bodySmall, color: colors.primaryText }}>Q2 2024</span>
        </div>
      </div>
    </div>
  </div>
);

export default CompanyDetailPanel;
