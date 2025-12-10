import React from 'react';
import type { ChannelCode } from '../../types/outreach';
import { CHANNEL_CONFIGS, CHANNEL_CATEGORIES, OUTREACH_COLORS, OUTREACH_TYPOGRAPHY, getChannelColor, getAutomationColor } from '../../constants/outreach';

interface ChannelSelectorProps {
  selectedChannel?: ChannelCode;
  onSelect: (channel: ChannelCode) => void;
  onClose: () => void;
  scores?: Record<ChannelCode, number>;
}

const ChannelSelector: React.FC<ChannelSelectorProps> = ({
  selectedChannel,
  onSelect,
  onClose,
  scores,
}) => {
  const renderChannelCard = (channelCode: ChannelCode) => {
    const config = CHANNEL_CONFIGS[channelCode];
    const score = scores?.[channelCode] ?? 50;
    const isSelected = selectedChannel === channelCode;
    const color = getChannelColor(channelCode);

    return (
      <div
        key={channelCode}
        onClick={() => onSelect(channelCode)}
        style={{
          padding: '1rem',
          backgroundColor: isSelected ? `${color}10` : OUTREACH_COLORS.cardBg,
          border: `2px solid ${isSelected ? color : OUTREACH_COLORS.border}`,
          borderRadius: '0.5rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          minWidth: '140px',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.borderColor = color;
            e.currentTarget.style.backgroundColor = OUTREACH_COLORS.cardBgHover;
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.borderColor = OUTREACH_COLORS.border;
            e.currentTarget.style.backgroundColor = OUTREACH_COLORS.cardBg;
          }
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.5rem' }}>{config.icon}</span>
        </div>
        <div style={{
          ...OUTREACH_TYPOGRAPHY.body,
          fontWeight: 600,
          color: OUTREACH_COLORS.primaryText,
          textAlign: 'center',
          marginBottom: '0.5rem',
        }}>
          {config.name}
        </div>

        {/* Score Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.5rem',
        }}>
          <div style={{
            flex: 1,
            height: '6px',
            backgroundColor: OUTREACH_COLORS.border,
            borderRadius: '3px',
            overflow: 'hidden',
          }}>
            <div style={{
              width: `${score}%`,
              height: '100%',
              backgroundColor: score >= 70 ? OUTREACH_COLORS.success : score >= 50 ? OUTREACH_COLORS.warning : OUTREACH_COLORS.danger,
              borderRadius: '3px',
            }} />
          </div>
          <span style={{
            ...OUTREACH_TYPOGRAPHY.bodySmall,
            color: OUTREACH_COLORS.secondaryText,
            minWidth: '28px',
          }}>
            {score}%
          </span>
        </div>

        {/* Requirements/Notes */}
        <div style={{
          ...OUTREACH_TYPOGRAPHY.bodySmall,
          color: OUTREACH_COLORS.tertiaryText,
          textAlign: 'center',
        }}>
          {config.requirements.needsConnection && 'Needs connection'}
          {config.requirements.needsOptIn && 'Needs opt-in'}
          {config.automation.level === 'full' && !config.requirements.needsConnection && !config.requirements.needsOptIn && 'Full automation'}
          {config.automation.level === 'semi' && !config.requirements.needsConnection && !config.requirements.needsOptIn && 'Semi-automated'}
          {config.automation.level === 'manual' && 'Manual'}
        </div>

        {/* Automation Badge */}
        <div style={{ textAlign: 'center', marginTop: '0.5rem' }}>
          <span style={{
            display: 'inline-block',
            padding: '0.125rem 0.5rem',
            backgroundColor: `${getAutomationColor(config.automation.level)}20`,
            color: getAutomationColor(config.automation.level),
            borderRadius: '9999px',
            fontSize: '0.625rem',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}>
            {config.automation.level}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        backgroundColor: OUTREACH_COLORS.cardBg,
        borderRadius: '0.75rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        maxWidth: '900px',
        width: '95%',
        maxHeight: '90vh',
        overflow: 'auto',
      }}>
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: `1px solid ${OUTREACH_COLORS.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div>
            <h2 style={{ ...OUTREACH_TYPOGRAPHY.h2, color: OUTREACH_COLORS.primaryText, margin: 0 }}>
              Select Channel
            </h2>
            <p style={{ ...OUTREACH_TYPOGRAPHY.body, color: OUTREACH_COLORS.secondaryText, margin: '0.25rem 0 0 0' }}>
              Choose the best channel for this step based on your contact data
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: OUTREACH_COLORS.secondaryText,
              padding: '0.5rem',
            }}
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem' }}>
          {/* Direct Channels */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              ...OUTREACH_TYPOGRAPHY.label,
              color: OUTREACH_COLORS.direct,
              marginBottom: '0.75rem',
            }}>
              {CHANNEL_CATEGORIES.direct.name}
            </h3>
            <div style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
            }}>
              {CHANNEL_CATEGORIES.direct.channels.map(renderChannelCard)}
            </div>
          </div>

          {/* Social Channels */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              ...OUTREACH_TYPOGRAPHY.label,
              color: OUTREACH_COLORS.social,
              marginBottom: '0.75rem',
            }}>
              {CHANNEL_CATEGORIES.social.name}
            </h3>
            <div style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
            }}>
              {CHANNEL_CATEGORIES.social.channels.map(renderChannelCard)}
            </div>
          </div>

          {/* Voice Channels */}
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{
              ...OUTREACH_TYPOGRAPHY.label,
              color: OUTREACH_COLORS.voice,
              marginBottom: '0.75rem',
            }}>
              {CHANNEL_CATEGORIES.voice.name}
            </h3>
            <div style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
            }}>
              {CHANNEL_CATEGORIES.voice.channels.map(renderChannelCard)}
            </div>
          </div>

          {/* Advertising Channels */}
          <div>
            <h3 style={{
              ...OUTREACH_TYPOGRAPHY.label,
              color: OUTREACH_COLORS.advertising,
              marginBottom: '0.75rem',
            }}>
              {CHANNEL_CATEGORIES.advertising.name}
            </h3>
            <div style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
            }}>
              {CHANNEL_CATEGORIES.advertising.channels.map(renderChannelCard)}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '1rem 1.5rem',
          borderTop: `1px solid ${OUTREACH_COLORS.border}`,
          backgroundColor: OUTREACH_COLORS.background,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '0.75rem',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              border: `1px solid ${OUTREACH_COLORS.border}`,
              borderRadius: '0.375rem',
              color: OUTREACH_COLORS.secondaryText,
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            disabled={!selectedChannel}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: selectedChannel ? OUTREACH_COLORS.primary : OUTREACH_COLORS.border,
              border: 'none',
              borderRadius: '0.375rem',
              color: 'white',
              cursor: selectedChannel ? 'pointer' : 'not-allowed',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChannelSelector;
