import React, { useState } from 'react';
import { LEADS_COLORS, getIndustryColor } from '../../constants/leads';
import type { LeadBackground as LeadBackgroundType } from '../../types/leads';

interface LeadBackgroundProps {
  background: LeadBackgroundType;
  isEnriched?: boolean;
}

const LeadBackground: React.FC<LeadBackgroundProps> = ({ background, isEnriched = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const industryColor = getIndustryColor(background.industry);

  const hasNotes = background.notes && background.notes.length > 0;
  const shouldTruncate = hasNotes && background.notes!.length > 120 && !isExpanded;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {/* Company and Role */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              color: LEADS_COLORS.primaryText,
            }}
          >
            {background.company}
          </span>
          {isEnriched && (
            <span
              style={{
                fontSize: '0.625rem',
                padding: '0.125rem 0.375rem',
                backgroundColor: '#10B98115',
                color: '#10B981',
                borderRadius: '0.25rem',
                fontWeight: 500,
              }}
            >
              ✓ Verified
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: '0.8125rem',
            color: LEADS_COLORS.secondaryText,
          }}
        >
          {background.role}
        </span>
      </div>

      {/* Industry Tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span
          style={{
            display: 'inline-block',
            padding: '0.1875rem 0.5rem',
            backgroundColor: `${industryColor}15`,
            color: industryColor,
            fontSize: '0.6875rem',
            fontWeight: 500,
            borderRadius: '0.25rem',
            border: `1px solid ${industryColor}30`,
          }}
        >
          {background.industry}
        </span>

        {/* LinkedIn Link */}
        {background.linkedInUrl && (
          <a
            href={`https://${background.linkedInUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.75rem',
              color: '#0A66C2',
              textDecoration: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.textDecoration = 'underline';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.textDecoration = 'none';
            }}
          >
            <span>💼</span>
            <span>LinkedIn</span>
          </a>
        )}
      </div>

      {/* Notes */}
      {hasNotes && (
        <div
          style={{
            marginTop: '0.25rem',
            padding: '0.5rem 0.75rem',
            backgroundColor: LEADS_COLORS.background,
            borderRadius: '0.375rem',
            borderLeft: `3px solid ${LEADS_COLORS.border}`,
          }}
        >
          <p
            style={{
              fontSize: '0.8125rem',
              color: LEADS_COLORS.secondaryText,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            {shouldTruncate
              ? `${background.notes!.substring(0, 120)}...`
              : background.notes}
          </p>
          {background.notes!.length > 120 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              style={{
                marginTop: '0.375rem',
                padding: 0,
                backgroundColor: 'transparent',
                border: 'none',
                color: LEADS_COLORS.primary,
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {isExpanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LeadBackground;
