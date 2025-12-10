import React from 'react';
import type { SignalEvent } from '../../types/signals';
import { SIGNALS_COLORS, getSignalIcon, formatTimeAgo, DEMO_COMPANY_NAMES } from '../../constants/signals';

interface SignalCardProps {
  signal: SignalEvent;
  companyName?: string;
  onClick?: () => void;
  compact?: boolean;
}

const SignalCard: React.FC<SignalCardProps> = ({
  signal,
  companyName,
  onClick,
  compact = false,
}) => {
  const icon = getSignalIcon(signal.signal_type);
  const resolvedCompanyName = companyName || DEMO_COMPANY_NAMES[signal.company_id] || 'Unknown Company';

  if (compact) {
    return (
      <div
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          padding: '0.5rem 0',
          cursor: onClick ? 'pointer' : 'default',
        }}
      >
        <span style={{ fontSize: '1rem' }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: '0.75rem',
              color: SIGNALS_COLORS.primaryText,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {signal.title}
          </div>
          <div style={{ fontSize: '0.625rem', color: SIGNALS_COLORS.tertiaryText }}>
            {formatTimeAgo(new Date(signal.detected_at))}
          </div>
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            color: SIGNALS_COLORS.success,
            fontWeight: 600,
          }}
        >
          +{signal.current_score}
        </span>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: SIGNALS_COLORS.cardBg,
        borderRadius: '0.5rem',
        border: `1px solid ${SIGNALS_COLORS.border}`,
        padding: '1rem',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.backgroundColor = SIGNALS_COLORS.cardBgHover;
          e.currentTarget.style.borderColor = SIGNALS_COLORS.primary;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = SIGNALS_COLORS.cardBg;
        e.currentTarget.style.borderColor = SIGNALS_COLORS.border;
      }}
    >
      <div style={{ display: 'flex', gap: '0.75rem' }}>
        {/* Icon */}
        <div
          style={{
            width: '2.5rem',
            height: '2.5rem',
            borderRadius: '0.5rem',
            backgroundColor: `${SIGNALS_COLORS.primary}10`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            flexShrink: 0,
          }}
        >
          {icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
            <div>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: SIGNALS_COLORS.primaryText,
                }}
              >
                {signal.title}
              </div>
              <div style={{ fontSize: '0.75rem', color: SIGNALS_COLORS.secondaryText }}>
                {resolvedCompanyName}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.125rem' }}>
              <span
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: SIGNALS_COLORS.success,
                }}
              >
                +{signal.current_score}
              </span>
              <span style={{ fontSize: '0.625rem', color: SIGNALS_COLORS.tertiaryText }}>
                {formatTimeAgo(new Date(signal.detected_at))}
              </span>
            </div>
          </div>

          {signal.description && (
            <p
              style={{
                fontSize: '0.75rem',
                color: SIGNALS_COLORS.secondaryText,
                margin: '0.5rem 0 0 0',
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {signal.description}
            </p>
          )}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <span
              style={{
                fontSize: '0.625rem',
                padding: '0.125rem 0.375rem',
                backgroundColor: SIGNALS_COLORS.background,
                color: SIGNALS_COLORS.secondaryText,
                borderRadius: '0.25rem',
              }}
            >
              {signal.data_source}
            </span>
            {signal.confidence && (
              <span
                style={{
                  fontSize: '0.625rem',
                  padding: '0.125rem 0.375rem',
                  backgroundColor: SIGNALS_COLORS.background,
                  color: SIGNALS_COLORS.secondaryText,
                  borderRadius: '0.25rem',
                }}
              >
                {Math.round(signal.confidence * 100)}% confidence
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignalCard;
