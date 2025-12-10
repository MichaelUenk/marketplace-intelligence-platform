import React from 'react';
import { layout, typography, lightColors, darkColors } from '../../constants/bowtie';
import { useIsDarkMode } from '../../hooks/useThemeColors';
import type { DashboardData, CompanyCardData } from '../../types/bowtie';
import { formatCurrency, getHealthColor, getVelocityColor } from '../../utils/bowtie';

interface SidebarProps {
  data: DashboardData;
  recentCompanies: CompanyCardData[];
  onCompanyClick: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ data, recentCompanies, onCompanyClick }) => {
  const isDarkMode = useIsDarkMode();
  const colors = isDarkMode ? darkColors : lightColors;

  // Calculate key metrics
  const totalAccounts = data.stages.reduce((sum, s) => sum + s.company_count, 0);
  const totalValue = data.stages.reduce((sum, s) => sum + s.total_value, 0);
  const atRiskCount = data.stages.reduce((sum, s) => sum + s.at_risk_count, 0);
  const stalledCount = data.stages.reduce((sum, s) => sum + s.stalled_count, 0);

  // Get average conversion rate
  const avgConversion = (
    data.conversions.cr1 +
    data.conversions.cr2 +
    data.conversions.cr3 +
    data.conversions.cr4 +
    data.conversions.cr5 +
    data.conversions.cr6 +
    data.conversions.cr7
  ) / 7;

  return (
    <div
      style={{
        width: '320px',
        backgroundColor: colors.cardBg,
        borderLeft: `1px solid ${colors.border}`,
        height: '100%',
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
        }}
      >
        <h3
          style={{
            ...typography.h4,
            color: colors.primaryText,
            margin: 0,
          }}
        >
          Overview
        </h3>
      </div>

      {/* Quick Stats */}
      <div
        style={{
          padding: layout.spacing.lg,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: layout.spacing.md,
          }}
        >
          <StatCard
            label="Total Accounts"
            value={totalAccounts.toString()}
            color={colors.primaryText}
            colors={colors}
          />
          <StatCard
            label="Pipeline Value"
            value={formatCurrency(totalValue)}
            color={colors.acquisition}
            colors={colors}
          />
          <StatCard
            label="At Risk"
            value={atRiskCount.toString()}
            color={colors.risk}
            alert={atRiskCount > 5}
            colors={colors}
          />
          <StatCard
            label="Stalled"
            value={stalledCount.toString()}
            color={colors.stalled}
            alert={stalledCount > 3}
            colors={colors}
          />
        </div>

        {/* Avg Conversion */}
        <div
          style={{
            marginTop: layout.spacing.md,
            padding: layout.spacing.md,
            backgroundColor: colors.background,
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ ...typography.bodySmall, color: colors.secondaryText }}>
              Avg Conversion Rate
            </span>
            <span
              style={{
                ...typography.metricSmall,
                color: avgConversion >= 50 ? colors.healthy : colors.risk,
              }}
            >
              {avgConversion.toFixed(1)}%
            </span>
          </div>
          <div
            style={{
              marginTop: layout.spacing.sm,
              height: '6px',
              backgroundColor: colors.divider,
              borderRadius: '3px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(avgConversion, 100)}%`,
                height: '100%',
                backgroundColor: avgConversion >= 50 ? colors.healthy : colors.risk,
                borderRadius: '3px',
              }}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div
        style={{
          padding: layout.spacing.lg,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <h4
          style={{
            ...typography.stageLabel,
            color: colors.secondaryText,
            margin: 0,
            marginBottom: layout.spacing.md,
          }}
        >
          Quick Actions
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: layout.spacing.sm }}>
          <ActionButton icon="+" label="Add New Lead" color={colors.acquisition} colors={colors} />
          <ActionButton icon="📊" label="View Reports" color={colors.secondaryText} colors={colors} />
          <ActionButton icon="⚠️" label="Review At-Risk" color={colors.risk} colors={colors} />
          <ActionButton icon="📤" label="Export Data" color={colors.secondaryText} colors={colors} />
        </div>
      </div>

      {/* Recent Activity */}
      <div
        style={{
          padding: layout.spacing.lg,
          flex: 1,
          overflow: 'auto',
        }}
      >
        <h4
          style={{
            ...typography.stageLabel,
            color: colors.secondaryText,
            margin: 0,
            marginBottom: layout.spacing.md,
          }}
        >
          Recent Companies
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: layout.spacing.sm }}>
          {recentCompanies.slice(0, 5).map((company) => (
            <CompanyQuickCard
              key={company.id}
              company={company}
              onClick={() => onCompanyClick(company.id)}
              colors={colors}
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          padding: layout.spacing.md,
          borderTop: `1px solid ${colors.border}`,
          backgroundColor: colors.background,
        }}
      >
        <div
          style={{
            ...typography.bodySmall,
            color: colors.tertiaryText,
            textAlign: 'center',
          }}
        >
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  label: string;
  value: string;
  color: string;
  alert?: boolean;
  colors: typeof lightColors;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color, alert, colors }) => (
  <div
    style={{
      padding: layout.spacing.sm,
      backgroundColor: alert ? `${color}10` : colors.background,
      borderRadius: '8px',
      borderLeft: alert ? `3px solid ${color}` : 'none',
    }}
  >
    <div style={{ ...typography.bodySmall, color: colors.secondaryText }}>{label}</div>
    <div style={{ ...typography.metricSmall, color, marginTop: '2px' }}>{value}</div>
  </div>
);

// Action Button Component
interface ActionButtonProps {
  icon: string;
  label: string;
  color: string;
  colors: typeof lightColors;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, color, colors }) => (
  <button
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: layout.spacing.sm,
      padding: layout.spacing.sm,
      backgroundColor: 'transparent',
      border: `1px solid ${colors.border}`,
      borderRadius: '8px',
      cursor: 'pointer',
      ...typography.bodySmall,
      color: colors.primaryText,
      transition: 'all 0.2s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = colors.background;
      e.currentTarget.style.borderColor = color;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.borderColor = colors.border;
    }}
  >
    <span>{icon}</span>
    <span>{label}</span>
  </button>
);

// Company Quick Card Component
interface CompanyQuickCardProps {
  company: CompanyCardData;
  onClick: () => void;
  colors: typeof lightColors;
}

const CompanyQuickCard: React.FC<CompanyQuickCardProps> = ({ company, onClick, colors }) => {
  const healthColor = getHealthColor(company.health_score);
  const velocityColor = getVelocityColor(company.velocity_status);

  return (
    <div
      onClick={onClick}
      style={{
        padding: layout.spacing.sm,
        backgroundColor: colors.background,
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.cardBgHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = colors.background;
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <div style={{ ...typography.bodySmall, color: colors.primaryText, fontWeight: 500 }}>
            {company.company_name}
          </div>
          <div style={{ ...typography.bodySmall, color: colors.tertiaryText, fontSize: '11px' }}>
            {company.current_stage} • {company.days_in_stage}d
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '4px',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: healthColor,
            }}
            title={`Health: ${company.health_score}`}
          />
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: velocityColor,
            }}
            title={`Velocity: ${company.velocity_status}`}
          />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
