import React from 'react';
import type { SequenceStep } from '../../types/outreach';
import { CHANNEL_CONFIGS, OUTREACH_COLORS, OUTREACH_TYPOGRAPHY, getChannelColor } from '../../constants/outreach';

interface StepCardProps {
  step: SequenceStep;
  isSelected: boolean;
  onClick: () => void;
  onDelete?: () => void;
}

const StepCard: React.FC<StepCardProps> = ({
  step,
  isSelected,
  onClick,
  onDelete,
}) => {
  const getStepIcon = () => {
    switch (step.type) {
      case 'message':
        return step.channel ? CHANNEL_CONFIGS[step.channel].icon : '📨';
      case 'wait':
        return '⏱️';
      case 'condition':
        return '◇';
      case 'action':
        return '⚡';
      default:
        return '•';
    }
  };

  const getStepTitle = () => {
    switch (step.type) {
      case 'message':
        return step.channel ? CHANNEL_CONFIGS[step.channel].name : 'Message';
      case 'wait':
        if (step.wait?.type === 'business_days') {
          return `Wait ${step.wait.business_days} business day${step.wait.business_days !== 1 ? 's' : ''}`;
        }
        if (step.wait?.duration) {
          return `Wait ${step.wait.duration.min}${step.wait.duration.min !== step.wait.duration.max ? `-${step.wait.duration.max}` : ''} ${step.wait.duration.unit}`;
        }
        return 'Wait';
      case 'condition':
        return step.condition?.type === 'if_then_else' ? 'If/Then' : 'Split';
      case 'action':
        return step.action?.type ? step.action.type.replace('_', ' ') : 'Action';
      default:
        return 'Step';
    }
  };

  const getStepDescription = () => {
    switch (step.type) {
      case 'message':
        if (step.content?.subject) return step.content.subject;
        if (step.content?.body) return step.content.body.substring(0, 50) + (step.content.body.length > 50 ? '...' : '');
        return 'Configure message content';
      case 'wait':
        return step.wait?.event ? `Until ${step.wait.event.type.replace('_', ' ')}` : '';
      case 'condition':
        return step.condition?.condition?.field || 'Configure condition';
      case 'action':
        return step.action?.tag?.tag_name || step.action?.stage?.stage_code || 'Configure action';
      default:
        return '';
    }
  };

  const getStepColor = () => {
    if (step.type === 'message' && step.channel) {
      return getChannelColor(step.channel);
    }
    return OUTREACH_COLORS[step.type] || OUTREACH_COLORS.secondaryText;
  };

  const color = getStepColor();

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: isSelected ? `${color}10` : OUTREACH_COLORS.cardBg,
        border: `2px solid ${isSelected ? color : OUTREACH_COLORS.border}`,
        borderRadius: '0.5rem',
        padding: '0.75rem 1rem',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        position: 'relative',
        minWidth: '200px',
      }}
      onMouseEnter={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = color;
        }
      }}
      onMouseLeave={(e) => {
        if (!isSelected) {
          e.currentTarget.style.borderColor = OUTREACH_COLORS.border;
        }
      }}
    >
      {/* Delete button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: OUTREACH_COLORS.danger,
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: 0.8,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.8';
          }}
        >
          &times;
        </button>
      )}

      {/* Step content */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.125rem',
          flexShrink: 0,
        }}>
          {getStepIcon()}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            ...OUTREACH_TYPOGRAPHY.body,
            fontWeight: 600,
            color: OUTREACH_COLORS.primaryText,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <span>Step {step.order}</span>
            <span style={{ color: color }}>{getStepTitle()}</span>
          </div>
          <div style={{
            ...OUTREACH_TYPOGRAPHY.bodySmall,
            color: OUTREACH_COLORS.tertiaryText,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {getStepDescription()}
          </div>
        </div>
      </div>

      {/* Stats (if available) */}
      {step.stats && step.type === 'message' && (
        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '0.5rem',
          paddingTop: '0.5rem',
          borderTop: `1px solid ${OUTREACH_COLORS.border}`,
        }}>
          <div style={{ ...OUTREACH_TYPOGRAPHY.bodySmall, color: OUTREACH_COLORS.secondaryText }}>
            Opens: <span style={{ color: OUTREACH_COLORS.primaryText, fontWeight: 500 }}>{step.stats.open_rate.toFixed(1)}%</span>
          </div>
          <div style={{ ...OUTREACH_TYPOGRAPHY.bodySmall, color: OUTREACH_COLORS.secondaryText }}>
            Replies: <span style={{ color: OUTREACH_COLORS.primaryText, fontWeight: 500 }}>{step.stats.reply_rate.toFixed(1)}%</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StepCard;
