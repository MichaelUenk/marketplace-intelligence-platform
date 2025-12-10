import React, { useState, useEffect } from 'react';
import { layout, typography, getStageColor } from '../../constants/bowtie';
import { useThemeColors, useIsDarkMode } from '../../hooks/useThemeColors';
import type { BowtieStageData, StageCode, DashboardData, CompanyCardData } from '../../types/bowtie';
import { mockDashboardData, mockCompanies } from '../../data/mockBowtieData';
import { formatCurrency } from '../../utils/bowtie';
import BowtieVisualization from './BowtieVisualization';
import ConversionRateBar from './ConversionRateBar';
import StageListView from './StageListView';
import Sidebar from './Sidebar';
import { api } from '../../services/api';
import type { Deal, DealPipelineStats } from '../../types/database';

// Map deal stages to bowtie stages
const STAGE_TO_BOWTIE: Record<string, StageCode> = {
  'identified': 'VM1',
  'qualified': 'VM2',
  'engaged': 'VM3',
  'pipeline': 'VM4',
  'proposal': 'VM4',
  'negotiation': 'VM4',
  'committed': 'VM5',
  'closed_won': 'VM6',
  'on_hold': 'VM4',
};

const BOWTIE_TO_STAGE: Record<StageCode, string[]> = {
  'VM1': ['identified'],
  'VM2': ['qualified'],
  'VM3': ['engaged'],
  'VM4': ['pipeline', 'proposal', 'negotiation', 'on_hold'],
  'VM5': ['committed'],
  'VM6': ['closed_won'],
  'VM7': ['closed_won'], // recurring (subset)
  'VM8': ['closed_won'], // max impact (subset)
};

const BowtieDashboard: React.FC = () => {
  const colors = useThemeColors();
  const isDarkMode = useIsDarkMode();
  const [selectedStage, setSelectedStage] = useState<StageCode | null>(null);
  const [viewMode, setViewMode] = useState<'bowtie' | 'list'>('bowtie');
  const [dashboardData, setDashboardData] = useState<DashboardData>(mockDashboardData);
  const [companies, setCompanies] = useState<CompanyCardData[]>(mockCompanies);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch pipeline stats and deals in parallel
        const [pipelineStats, dealsData] = await Promise.all([
          api.getDealPipelineStats().catch(() => [] as DealPipelineStats[]),
          api.getDeals().catch(() => []),
        ]);

        // If we have real data, transform it
        if (pipelineStats.length > 0 || dealsData.length > 0) {
          // Transform pipeline stats to bowtie stage data
          const stageDataMap: Record<string, Partial<BowtieStageData>> = {};

          pipelineStats.forEach((stat) => {
            const bowtieStage = STAGE_TO_BOWTIE[stat.stage];
            if (bowtieStage) {
              if (!stageDataMap[bowtieStage]) {
                stageDataMap[bowtieStage] = {
                  company_count: 0,
                  total_value: 0,
                  direct_count: 0,
                  indirect_count: 0,
                };
              }
              stageDataMap[bowtieStage].company_count = (stageDataMap[bowtieStage].company_count || 0) + stat.deal_count;
              stageDataMap[bowtieStage].total_value = (stageDataMap[bowtieStage].total_value || 0) + stat.total_value;
            }
          });

          // Merge with default stage data
          const updatedStages = mockDashboardData.stages.map((stage) => ({
            ...stage,
            company_count: stageDataMap[stage.stage]?.company_count ?? stage.company_count,
            total_value: stageDataMap[stage.stage]?.total_value ?? stage.total_value,
          }));

          // Transform deals to company cards
          const dealCompanies: CompanyCardData[] = dealsData.map((d) => ({
            id: d.deal.id,
            company_name: d.company.name,
            domain: d.company.domain || '',
            main_industry: d.company.domain?.split('.').pop() || 'Unknown',
            hq_city: '',
            current_stage: STAGE_TO_BOWTIE[d.deal.stage] || 'VM1',
            days_in_stage: d.deal.days_in_pipeline || 0,
            pipeline_value: d.deal.amount || 0,
            intent_score: d.deal.probability || 50,
            health_score: d.deal.meddpicc_total_score ? (d.deal.meddpicc_total_score / 80) * 100 : 70,
            velocity_status: d.deal.deal_health === 'strong' ? 'fast' : d.deal.deal_health === 'at_risk' ? 'slow' : 'on-track',
            icp_tier: 'Tier 1',
            champion: d.champion_name ? {
              name: d.champion_name,
              title: '',
              persona: 'Champion',
              confidence: 0.8,
            } : undefined,
          }));

          if (dealCompanies.length > 0) {
            setCompanies(dealCompanies);
          }

          setDashboardData({
            ...mockDashboardData,
            stages: updatedStages,
            updated_at: new Date(),
          });
        }
      } catch (err) {
        console.error('Failed to fetch bowtie data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
        // Keep using mock data on error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Calculate totals for each side
  const leftStages = dashboardData.stages.filter((s) => s.side === 'left');
  const centerStage = dashboardData.stages.find((s) => s.side === 'center');
  const rightStages = dashboardData.stages.filter((s) => s.side === 'right');

  const acquisitionValue = leftStages.reduce((sum, s) => sum + s.total_value, 0);
  const acquisitionCount = leftStages.reduce((sum, s) => sum + s.company_count, 0);
  const expansionValue = rightStages.reduce((sum, s) => sum + s.total_value, 0);
  const expansionCount = rightStages.reduce((sum, s) => sum + s.company_count, 0);

  const handleStageClick = (stage: StageCode) => {
    setSelectedStage(stage);
    setViewMode('list');
  };

  const handleBackToBowtie = () => {
    setSelectedStage(null);
    setViewMode('bowtie');
  };

  if (viewMode === 'list' && selectedStage) {
    return (
      <StageListView
        stage={selectedStage}
        companies={companies.filter((c) => c.current_stage === selectedStage)}
        onBack={handleBackToBowtie}
        onCompanyClick={(id) => console.log('Company clicked:', id)}
      />
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.background,
        fontFamily: typography.fontFamily,
      }}
    >
      {/* Header with Title */}
      <div
        style={{
          backgroundColor: colors.cardBg,
          borderBottom: `1px solid ${colors.border}`,
          padding: layout.spacing.lg,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            maxWidth: '1600px',
            margin: '0 auto',
          }}
        >
          <div>
            <h1
              style={{
                ...typography.h1,
                color: colors.primaryText,
                margin: 0,
              }}
            >
              Sales Intelligence Platform
            </h1>
          </div>
          <div style={{ display: 'flex', gap: layout.spacing.sm }}>
            <button
              style={{
                padding: `${layout.spacing.sm} ${layout.spacing.md}`,
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                backgroundColor: viewMode === 'bowtie' ? colors.acquisition : 'white',
                color: viewMode === 'bowtie' ? 'white' : colors.primaryText,
                cursor: 'pointer',
                ...typography.bodySmall,
                fontWeight: 500,
              }}
              onClick={() => setViewMode('bowtie')}
            >
              Bowtie View
            </button>
            <button
              style={{
                padding: `${layout.spacing.sm} ${layout.spacing.md}`,
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                backgroundColor: 'white',
                color: colors.primaryText,
                cursor: 'pointer',
                ...typography.bodySmall,
                fontWeight: 500,
              }}
            >
              Filters
            </button>
          </div>
        </div>
      </div>

      {/* Bowtie Visualization - Right below title */}
      <div
        style={{
          backgroundColor: colors.cardBg,
          borderBottom: `1px solid ${colors.border}`,
          padding: `${layout.spacing.lg} ${layout.spacing.xl}`,
        }}
      >
        <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
          <BowtieVisualization
            stages={dashboardData.stages}
            onStageClick={handleStageClick}
            selectedStage={selectedStage}
          />

          {/* Side Summaries */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: layout.spacing.xl,
              marginTop: layout.spacing.xl,
              paddingTop: layout.spacing.lg,
              borderTop: `1px solid ${colors.divider}`,
            }}
          >
            {/* Acquisition Summary */}
            <div style={{ textAlign: 'center' }}>
              <h3
                style={{
                  ...typography.stageLabel,
                  color: colors.acquisition,
                  marginBottom: layout.spacing.sm,
                }}
              >
                ACQUISITION
              </h3>
              <div
                style={{
                  ...typography.metricLarge,
                  color: colors.primaryText,
                }}
              >
                {formatCurrency(acquisitionValue)}
              </div>
              <div
                style={{
                  ...typography.body,
                  color: colors.secondaryText,
                }}
              >
                {acquisitionCount} accounts in pipeline
              </div>
            </div>

            {/* Activation Summary */}
            <div style={{ textAlign: 'center' }}>
              <h3
                style={{
                  ...typography.stageLabel,
                  color: colors.activation,
                  marginBottom: layout.spacing.sm,
                }}
              >
                ACTIVATION
              </h3>
              <div
                style={{
                  ...typography.metricLarge,
                  color: colors.primaryText,
                }}
              >
                {centerStage?.company_count || 0}
              </div>
              <div
                style={{
                  ...typography.body,
                  color: colors.secondaryText,
                }}
              >
                new commitments this period
              </div>
            </div>

            {/* Expansion Summary */}
            <div style={{ textAlign: 'center' }}>
              <h3
                style={{
                  ...typography.stageLabel,
                  color: colors.expansion,
                  marginBottom: layout.spacing.sm,
                }}
              >
                EXPANSION
              </h3>
              <div
                style={{
                  ...typography.metricLarge,
                  color: colors.primaryText,
                }}
              >
                {formatCurrency(expansionValue)}
              </div>
              <div
                style={{
                  ...typography.body,
                  color: colors.secondaryText,
                }}
              >
                {expansionCount} active customers
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area with Sidebar */}
      <div
        style={{
          display: 'flex',
          maxWidth: '1600px',
          margin: '0 auto',
        }}
      >
        {/* Main Content */}
        <div
          style={{
            flex: 1,
            padding: layout.spacing.lg,
          }}
        >
          {/* Conversion Rate Bar */}
          <ConversionRateBar conversions={dashboardData.conversions} />

          {/* Stage Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: layout.spacing.md,
              marginTop: layout.spacing.lg,
            }}
          >
            {dashboardData.stages.map((stage) => (
              <StageCard
                key={stage.stage}
                data={stage}
                onClick={() => handleStageClick(stage.stage)}
                colors={colors}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <Sidebar
          data={dashboardData}
          recentCompanies={companies}
          onCompanyClick={(id) => console.log('Company clicked:', id)}
        />
      </div>
    </div>
  );
};

// Stage Card Component
interface StageCardProps {
  data: BowtieStageData;
  onClick: () => void;
  colors: ReturnType<typeof useThemeColors>;
  isDarkMode: boolean;
}

const StageCard: React.FC<StageCardProps> = ({ data, onClick, colors, isDarkMode }) => {
  const stageColor = getStageColor(data.side, isDarkMode);

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: colors.cardBg,
        borderRadius: layout.cardBorderRadius,
        boxShadow: layout.cardShadow,
        padding: layout.spacing.md,
        cursor: 'pointer',
        borderLeft: `4px solid ${stageColor}`,
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = layout.cardShadowHover;
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = layout.cardShadow;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: layout.spacing.sm,
        }}
      >
        <div>
          <div
            style={{
              ...typography.stageLabel,
              color: stageColor,
            }}
          >
            {data.stage_label}
          </div>
          <div
            style={{
              ...typography.bodySmall,
              color: colors.secondaryText,
              marginTop: '2px',
            }}
          >
            {data.stage}
          </div>
        </div>
        <div
          style={{
            ...typography.metricMedium,
            color: colors.primaryText,
          }}
        >
          {data.company_count}
        </div>
      </div>

      <div
        style={{
          ...typography.bodySmall,
          color: colors.primaryText,
          marginBottom: layout.spacing.xs,
        }}
      >
        {formatCurrency(data.total_value)}
      </div>

      <div
        style={{
          display: 'flex',
          gap: layout.spacing.sm,
          marginTop: layout.spacing.sm,
        }}
      >
        <StatusBadge
          count={data.healthy_count}
          color={colors.healthy}
          label="Healthy"
        />
        {data.at_risk_count > 0 && (
          <StatusBadge
            count={data.at_risk_count}
            color={colors.risk}
            label="At Risk"
          />
        )}
        {data.stalled_count > 0 && (
          <StatusBadge
            count={data.stalled_count}
            color={colors.stalled}
            label="Stalled"
          />
        )}
      </div>

      <div
        style={{
          ...typography.bodySmall,
          color: colors.tertiaryText,
          marginTop: layout.spacing.sm,
        }}
      >
        Avg: {data.avg_days_in_stage} days
      </div>
    </div>
  );
};

// Status Badge Component
interface StatusBadgeProps {
  count: number;
  color: string;
  label: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ count, color }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '11px',
      color: color,
    }}
  >
    <span
      style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: color,
      }}
    />
    {count}
  </div>
);

export default BowtieDashboard;
