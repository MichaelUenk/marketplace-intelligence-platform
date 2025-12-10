import React, { useState } from 'react';
import { layout, typography, PERSONA_COLORS, lightColors, darkColors } from '../../constants/bowtie';
import { useIsDarkMode } from '../../hooks/useThemeColors';
import type { CompanyCardData } from '../../types/bowtie';
import {
  formatCurrency,
  getHealthLabel,
  getHealthColor,
  getVelocityColor,
  getVelocityLabel,
} from '../../utils/bowtie';

interface CompanyCardProps {
  company: CompanyCardData;
  stageColor: string;
  onClick: () => void;
}

const CompanyCard: React.FC<CompanyCardProps> = ({ company, stageColor, onClick }) => {
  const isDarkMode = useIsDarkMode();
  const colors = isDarkMode ? darkColors : lightColors;
  const [isHovered, setIsHovered] = useState(false);

  const healthColor = getHealthColor(company.health_score);
  const healthLabel = getHealthLabel(company.health_score);
  const velocityColor = getVelocityColor(company.velocity_status);
  const velocityLabel = getVelocityLabel(company.velocity_status);

  const isAtRisk = company.health_score < 50;
  const isStalled = company.velocity_status === 'stalled';

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        backgroundColor: colors.cardBg,
        borderRadius: layout.cardBorderRadius,
        boxShadow: isHovered ? layout.cardShadowHover : layout.cardShadow,
        padding: layout.cardPadding,
        cursor: 'pointer',
        borderLeft: `4px solid ${stageColor}`,
        transition: 'all 0.2s ease',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        position: 'relative',
      }}
    >
      {/* Alert Badges */}
      {(isAtRisk || isStalled) && (
        <div
          style={{
            position: 'absolute',
            top: layout.spacing.sm,
            right: layout.spacing.sm,
            display: 'flex',
            gap: layout.spacing.xs,
          }}
        >
          {isStalled && (
            <span
              style={{
                backgroundColor: colors.stalledBg,
                color: colors.stalled,
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              STALLED
            </span>
          )}
          {isAtRisk && (
            <span
              style={{
                backgroundColor: colors.riskBg,
                color: colors.risk,
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              AT RISK
            </span>
          )}
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto auto',
          gap: layout.spacing.lg,
          alignItems: 'start',
        }}
      >
        {/* Company Info */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: layout.spacing.sm }}>
            <span style={{ fontSize: '20px' }}>🏢</span>
            <div>
              <h3
                style={{
                  ...typography.h4,
                  color: colors.primaryText,
                  margin: 0,
                }}
              >
                {company.company_name}
              </h3>
              <div
                style={{
                  ...typography.bodySmall,
                  color: colors.secondaryText,
                  marginTop: '2px',
                }}
              >
                {company.main_industry} • {company.hq_city} • {company.icp_tier}
              </div>
            </div>
          </div>

          {/* Champion Info */}
          {company.champion ? (
            <div
              style={{
                marginTop: layout.spacing.sm,
                display: 'flex',
                alignItems: 'center',
                gap: layout.spacing.sm,
              }}
            >
              <span
                style={{
                  color: PERSONA_COLORS[company.champion.persona] || colors.champion,
                  fontSize: '14px',
                }}
              >
                ★
              </span>
              <span
                style={{
                  ...typography.bodySmall,
                  color: colors.primaryText,
                }}
              >
                {company.champion.name}
              </span>
              <span
                style={{
                  ...typography.bodySmall,
                  color: colors.secondaryText,
                }}
              >
                {company.champion.title}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  color: PERSONA_COLORS[company.champion.persona] || colors.secondaryText,
                  backgroundColor: `${PERSONA_COLORS[company.champion.persona] || colors.secondaryText}15`,
                  padding: '2px 6px',
                  borderRadius: '4px',
                }}
              >
                {company.champion.persona}
              </span>
            </div>
          ) : (
            <div
              style={{
                marginTop: layout.spacing.sm,
                ...typography.bodySmall,
                color: colors.tertiaryText,
                fontStyle: 'italic',
              }}
            >
              Champion: Not identified
            </div>
          )}

          {/* Intent & Health Bars */}
          <div
            style={{
              marginTop: layout.spacing.md,
              display: 'flex',
              gap: layout.spacing.lg,
            }}
          >
            {/* Intent Score */}
            <div style={{ flex: 1, maxWidth: '200px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}
              >
                <span
                  style={{
                    ...typography.bodySmall,
                    color: colors.secondaryText,
                  }}
                >
                  Intent
                </span>
                <span
                  style={{
                    ...typography.bodySmall,
                    color: colors.primaryText,
                    fontWeight: 600,
                  }}
                >
                  {company.intent_score}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: colors.divider,
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${company.intent_score}%`,
                    height: '100%',
                    backgroundColor: stageColor,
                    borderRadius: '3px',
                  }}
                />
              </div>
            </div>

            {/* Health Score */}
            <div style={{ flex: 1, maxWidth: '200px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                }}
              >
                <span
                  style={{
                    ...typography.bodySmall,
                    color: colors.secondaryText,
                  }}
                >
                  Health
                </span>
                <span
                  style={{
                    ...typography.bodySmall,
                    color: healthColor,
                    fontWeight: 600,
                  }}
                >
                  {healthLabel}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: colors.divider,
                  borderRadius: '3px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${company.health_score}%`,
                    height: '100%',
                    backgroundColor: healthColor,
                    borderRadius: '3px',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Value & Days */}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              ...typography.metricMedium,
              color: colors.primaryText,
            }}
          >
            {formatCurrency(company.pipeline_value || 0)}
          </div>
          <div
            style={{
              ...typography.bodySmall,
              color: colors.secondaryText,
              marginTop: '4px',
            }}
          >
            pipeline value
          </div>
        </div>

        {/* Days in Stage */}
        <div
          style={{
            textAlign: 'right',
            minWidth: '100px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: layout.spacing.xs,
            }}
          >
            <span
              style={{
                ...typography.metricSmall,
                color: velocityColor,
              }}
            >
              {company.days_in_stage}
            </span>
            <span
              style={{
                ...typography.bodySmall,
                color: colors.secondaryText,
              }}
            >
              days
            </span>
            {isStalled && <span style={{ fontSize: '14px' }}>⚠️</span>}
          </div>
          <div
            style={{
              ...typography.bodySmall,
              color: velocityColor,
              marginTop: '4px',
            }}
          >
            {velocityLabel}
          </div>
        </div>
      </div>

      {/* Action Buttons (on hover) */}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            bottom: layout.spacing.md,
            right: layout.spacing.md,
            display: 'flex',
            gap: layout.spacing.sm,
          }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('View details');
            }}
            style={{
              padding: `${layout.spacing.xs} ${layout.spacing.sm}`,
              borderRadius: '6px',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.cardBg,
              color: colors.primaryText,
              cursor: 'pointer',
              ...typography.bodySmall,
            }}
          >
            View
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              console.log('Move to next stage');
            }}
            style={{
              padding: `${layout.spacing.xs} ${layout.spacing.sm}`,
              borderRadius: '6px',
              border: 'none',
              backgroundColor: stageColor,
              color: 'white',
              cursor: 'pointer',
              ...typography.bodySmall,
            }}
          >
            Move →
          </button>
        </div>
      )}
    </div>
  );
};

export default CompanyCard;
