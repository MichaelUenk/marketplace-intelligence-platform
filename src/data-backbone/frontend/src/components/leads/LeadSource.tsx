import React from 'react';
import { LEAD_SOURCES, LEADS_COLORS } from '../../constants/leads';
import type { LeadSource as LeadSourceType } from '../../types/leads';

interface LeadSourceProps {
  source: LeadSourceType;
  campaign?: string;
  showPriority?: boolean;
}

const LeadSource: React.FC<LeadSourceProps> = ({ source, campaign, showPriority = false }) => {
  const config = LEAD_SOURCES[source];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      {/* Source Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.25rem 0.625rem',
            backgroundColor: `${config.color}15`,
            borderRadius: '9999px',
            border: `1px solid ${config.color}30`,
          }}
        >
          <span style={{ fontSize: '0.875rem' }}>{config.icon}</span>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 500,
              color: config.color,
            }}
          >
            {source}
          </span>
        </div>

        {showPriority && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.125rem 0.375rem',
              backgroundColor: LEADS_COLORS.background,
              borderRadius: '0.25rem',
            }}
          >
            <span style={{ fontSize: '0.625rem' }}>⚡</span>
            <span
              style={{
                fontSize: '0.625rem',
                fontWeight: 500,
                color: LEADS_COLORS.secondaryText,
              }}
            >
              {config.priorityWeight}x
            </span>
          </div>
        )}
      </div>

      {/* Campaign */}
      {campaign && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
          }}
        >
          <span
            style={{
              fontSize: '0.625rem',
              color: LEADS_COLORS.tertiaryText,
            }}
          >
            Campaign:
          </span>
          <span
            style={{
              fontSize: '0.75rem',
              color: LEADS_COLORS.secondaryText,
              fontWeight: 500,
            }}
          >
            {campaign}
          </span>
        </div>
      )}
    </div>
  );
};

export default LeadSource;
