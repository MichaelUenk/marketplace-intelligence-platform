import React, { useState } from 'react';
import { layout, typography, getStageConfig, getStageColor, lightColors, darkColors } from '../../constants/bowtie';
import { useIsDarkMode } from '../../hooks/useThemeColors';
import type { StageCode, CompanyCardData } from '../../types/bowtie';
import { formatCurrency } from '../../utils/bowtie';
import CompanyCard from './CompanyCard';

interface StageListViewProps {
  stage: StageCode;
  companies: CompanyCardData[];
  onBack: () => void;
  onCompanyClick: (id: string) => void;
}

const StageListView: React.FC<StageListViewProps> = ({
  stage,
  companies,
  onBack,
  onCompanyClick,
}) => {
  const isDarkMode = useIsDarkMode();
  const colors = isDarkMode ? darkColors : lightColors;
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'days' | 'value' | 'intent' | 'health'>('days');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const stageConfig = getStageConfig(stage);
  const stageColor = getStageColor(stageConfig.side, isDarkMode);

  // Filter and sort companies
  const filteredCompanies = companies
    .filter((c) =>
      c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.main_industry.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'days':
          comparison = a.days_in_stage - b.days_in_stage;
          break;
        case 'value':
          comparison = (a.pipeline_value || 0) - (b.pipeline_value || 0);
          break;
        case 'intent':
          comparison = a.intent_score - b.intent_score;
          break;
        case 'health':
          comparison = a.health_score - b.health_score;
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

  const totalValue = companies.reduce((sum, c) => sum + (c.pipeline_value || 0), 0);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: colors.background,
        fontFamily: typography.fontFamily,
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: colors.cardBg,
          borderBottom: `1px solid ${colors.border}`,
          padding: layout.spacing.lg,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '1400px',
            margin: '0 auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: layout.spacing.md }}>
            <button
              onClick={onBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: layout.spacing.xs,
                padding: `${layout.spacing.sm} ${layout.spacing.md}`,
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.cardBg,
                color: colors.primaryText,
                cursor: 'pointer',
                ...typography.body,
              }}
            >
              ← Back
            </button>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: layout.spacing.sm }}>
                <h1
                  style={{
                    ...typography.h2,
                    color: colors.primaryText,
                    margin: 0,
                  }}
                >
                  {stageConfig.name}
                </h1>
                <span
                  style={{
                    ...typography.stageLabel,
                    color: 'white',
                    backgroundColor: stageColor,
                    padding: '4px 12px',
                    borderRadius: '12px',
                  }}
                >
                  {stageConfig.label}
                </span>
              </div>
              <p
                style={{
                  ...typography.bodySmall,
                  color: colors.secondaryText,
                  margin: 0,
                  marginTop: '4px',
                }}
              >
                {stageConfig.description}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: layout.spacing.lg }}>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  ...typography.metricMedium,
                  color: colors.primaryText,
                }}
              >
                {companies.length}
              </div>
              <div
                style={{
                  ...typography.bodySmall,
                  color: colors.secondaryText,
                }}
              >
                companies
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  ...typography.metricMedium,
                  color: colors.primaryText,
                }}
              >
                {formatCurrency(totalValue)}
              </div>
              <div
                style={{
                  ...typography.bodySmall,
                  color: colors.secondaryText,
                }}
              >
                total value
              </div>
            </div>
            <button
              style={{
                padding: `${layout.spacing.sm} ${layout.spacing.md}`,
                borderRadius: '8px',
                border: 'none',
                backgroundColor: stageColor,
                color: 'white',
                cursor: 'pointer',
                ...typography.body,
                fontWeight: 500,
              }}
            >
              + Add Company
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div
        style={{
          backgroundColor: colors.cardBg,
          borderBottom: `1px solid ${colors.border}`,
          padding: `${layout.spacing.md} ${layout.spacing.lg}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '1400px',
            margin: '0 auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: layout.spacing.md }}>
            <input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: `${layout.spacing.sm} ${layout.spacing.md}`,
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.cardBg,
                color: colors.primaryText,
                ...typography.body,
                width: '280px',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: layout.spacing.sm }}>
            <span style={{ ...typography.bodySmall, color: colors.secondaryText }}>
              Sort by:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              style={{
                padding: `${layout.spacing.sm} ${layout.spacing.md}`,
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                ...typography.body,
                backgroundColor: colors.cardBg,
                color: colors.primaryText,
              }}
            >
              <option value="days">Days in Stage</option>
              <option value="value">Pipeline Value</option>
              <option value="intent">Intent Score</option>
              <option value="health">Health Score</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              style={{
                padding: layout.spacing.sm,
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                backgroundColor: colors.cardBg,
                color: colors.primaryText,
                cursor: 'pointer',
                ...typography.body,
              }}
            >
              {sortOrder === 'desc' ? '↓' : '↑'}
            </button>
          </div>
        </div>
      </div>

      {/* Company List */}
      <div
        style={{
          padding: layout.spacing.lg,
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        {filteredCompanies.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: layout.spacing.xxl,
              color: colors.secondaryText,
            }}
          >
            {searchQuery
              ? 'No companies match your search'
              : 'No companies in this stage'}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: layout.spacing.md,
            }}
          >
            {filteredCompanies.map((company) => (
              <CompanyCard
                key={company.id}
                company={company}
                stageColor={stageColor}
                onClick={() => onCompanyClick(company.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StageListView;
