import React, { useState } from 'react';
import type { SequenceStep, ChannelCode, StepType } from '../../types/outreach';
import { CHANNEL_CONFIGS, MERGE_FIELDS, OUTREACH_COLORS, OUTREACH_TYPOGRAPHY, getChannelColor } from '../../constants/outreach';
import ChannelSelector from './ChannelSelector';

interface StepEditorProps {
  step: SequenceStep;
  onChange: (step: SequenceStep) => void;
}

const StepEditor: React.FC<StepEditorProps> = ({ step, onChange }) => {
  const [showChannelSelector, setShowChannelSelector] = useState(false);
  const [showMergeFields, setShowMergeFields] = useState(false);

  const handleChannelSelect = (channel: ChannelCode) => {
    onChange({
      ...step,
      channel,
      content: {
        ...step.content,
        body: step.content?.body || '',
        tokens_used: step.content?.tokens_used || [],
      },
    });
    setShowChannelSelector(false);
  };

  const handleContentChange = (field: string, value: string) => {
    onChange({
      ...step,
      content: {
        ...step.content,
        body: step.content?.body || '',
        tokens_used: step.content?.tokens_used || [],
        [field]: value,
      },
    });
  };

  const handleWaitChange = (type: 'business_days' | 'fixed', value: number) => {
    onChange({
      ...step,
      wait: type === 'business_days'
        ? { type: 'business_days', business_days: value }
        : { type: 'fixed', duration: { min: value, max: value, unit: 'days' } },
    });
  };

  const insertMergeField = (field: string) => {
    const body = step.content?.body || '';
    handleContentChange('body', body + field);
    setShowMergeFields(false);
  };

  const renderMessageEditor = () => {
    const channelConfig = step.channel ? CHANNEL_CONFIGS[step.channel] : null;
    const color = step.channel ? getChannelColor(step.channel) : OUTREACH_COLORS.primary;

    return (
      <div>
        {/* Channel Selection */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ ...OUTREACH_TYPOGRAPHY.label, color: OUTREACH_COLORS.secondaryText, display: 'block', marginBottom: '0.5rem' }}>
            Channel
          </label>
          <button
            onClick={() => setShowChannelSelector(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: OUTREACH_COLORS.background,
              border: `1px solid ${OUTREACH_COLORS.border}`,
              borderRadius: '0.375rem',
              cursor: 'pointer',
              width: '100%',
              textAlign: 'left',
            }}
          >
            {channelConfig ? (
              <>
                <span style={{ fontSize: '1.25rem' }}>{channelConfig.icon}</span>
                <span style={{ ...OUTREACH_TYPOGRAPHY.body, color: OUTREACH_COLORS.primaryText, fontWeight: 500 }}>
                  {channelConfig.name}
                </span>
                <span style={{
                  marginLeft: 'auto',
                  padding: '0.125rem 0.5rem',
                  backgroundColor: `${color}20`,
                  color: color,
                  borderRadius: '0.25rem',
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}>
                  {channelConfig.category}
                </span>
              </>
            ) : (
              <span style={{ ...OUTREACH_TYPOGRAPHY.body, color: OUTREACH_COLORS.tertiaryText }}>
                Select a channel...
              </span>
            )}
          </button>
        </div>

        {channelConfig && (
          <>
            {/* Subject Line (for email) */}
            {step.channel === 'email' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ ...OUTREACH_TYPOGRAPHY.label, color: OUTREACH_COLORS.secondaryText, display: 'block', marginBottom: '0.5rem' }}>
                  Subject Line
                </label>
                <input
                  type="text"
                  value={step.content?.subject || ''}
                  onChange={(e) => handleContentChange('subject', e.target.value)}
                  placeholder="Enter subject line..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: `1px solid ${OUTREACH_COLORS.border}`,
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )}

            {/* Message Body */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ ...OUTREACH_TYPOGRAPHY.label, color: OUTREACH_COLORS.secondaryText }}>
                  {step.channel === 'phone_task' || step.channel === 'phone_auto' ? 'Call Script' : 'Message Body'}
                </label>
                <button
                  onClick={() => setShowMergeFields(!showMergeFields)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: OUTREACH_COLORS.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                  }}
                >
                  + Insert Field
                </button>
              </div>

              {/* Merge Fields Dropdown */}
              {showMergeFields && (
                <div style={{
                  marginBottom: '0.5rem',
                  padding: '0.75rem',
                  backgroundColor: OUTREACH_COLORS.background,
                  border: `1px solid ${OUTREACH_COLORS.border}`,
                  borderRadius: '0.375rem',
                }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {Object.entries(MERGE_FIELDS).map(([category, fields]) => (
                      <div key={category} style={{ minWidth: '150px' }}>
                        <div style={{ ...OUTREACH_TYPOGRAPHY.bodySmall, color: OUTREACH_COLORS.secondaryText, fontWeight: 600, marginBottom: '0.25rem' }}>
                          {category}
                        </div>
                        {Object.entries(fields).map(([field, label]) => (
                          <button
                            key={field}
                            onClick={() => insertMergeField(field)}
                            style={{
                              display: 'block',
                              padding: '0.25rem 0.5rem',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              fontSize: '0.75rem',
                              color: OUTREACH_COLORS.primary,
                              textAlign: 'left',
                              width: '100%',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = OUTREACH_COLORS.cardBgHover;
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <textarea
                value={step.content?.body || ''}
                onChange={(e) => handleContentChange('body', e.target.value)}
                placeholder="Write your message here... Use {{merge_fields}} for personalization."
                style={{
                  width: '100%',
                  minHeight: '200px',
                  padding: '0.75rem',
                  border: `1px solid ${OUTREACH_COLORS.border}`,
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />

              {/* Character count */}
              {channelConfig.content.maxLength && (
                <div style={{
                  ...OUTREACH_TYPOGRAPHY.bodySmall,
                  color: (step.content?.body?.length || 0) > channelConfig.content.maxLength ? OUTREACH_COLORS.danger : OUTREACH_COLORS.tertiaryText,
                  textAlign: 'right',
                  marginTop: '0.25rem',
                }}>
                  {step.content?.body?.length || 0} / {channelConfig.content.maxLength} characters
                </div>
              )}
            </div>

            {/* AI Content Generation */}
            <div style={{
              padding: '1rem',
              backgroundColor: `${OUTREACH_COLORS.primary}10`,
              border: `1px solid ${OUTREACH_COLORS.primary}30`,
              borderRadius: '0.375rem',
              marginBottom: '1rem',
            }}>
              <div style={{ ...OUTREACH_TYPOGRAPHY.body, color: OUTREACH_COLORS.primaryText, fontWeight: 600, marginBottom: '0.5rem' }}>
                AI Content Assistant
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: OUTREACH_COLORS.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                }}>
                  Generate Full Message
                </button>
                <button style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'white',
                  color: OUTREACH_COLORS.primary,
                  border: `1px solid ${OUTREACH_COLORS.primary}`,
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                }}>
                  Personalize Opening
                </button>
                <button style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: 'white',
                  color: OUTREACH_COLORS.primary,
                  border: `1px solid ${OUTREACH_COLORS.primary}`,
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                }}>
                  Improve CTA
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderWaitEditor = () => {
    return (
      <div>
        <label style={{ ...OUTREACH_TYPOGRAPHY.label, color: OUTREACH_COLORS.secondaryText, display: 'block', marginBottom: '0.5rem' }}>
          Wait Duration
        </label>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="number"
              min="1"
              max="30"
              value={step.wait?.business_days || step.wait?.duration?.min || 1}
              onChange={(e) => handleWaitChange(
                step.wait?.type === 'business_days' ? 'business_days' : 'fixed',
                parseInt(e.target.value) || 1
              )}
              style={{
                width: '80px',
                padding: '0.5rem',
                border: `1px solid ${OUTREACH_COLORS.border}`,
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                textAlign: 'center',
              }}
            />
            <select
              value={step.wait?.type === 'business_days' ? 'business_days' : 'days'}
              onChange={(e) => handleWaitChange(
                e.target.value === 'business_days' ? 'business_days' : 'fixed',
                step.wait?.business_days || step.wait?.duration?.min || 1
              )}
              style={{
                padding: '0.5rem',
                border: `1px solid ${OUTREACH_COLORS.border}`,
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                backgroundColor: 'white',
              }}
            >
              <option value="days">Days</option>
              <option value="business_days">Business Days</option>
            </select>
          </div>
        </div>
        <p style={{ ...OUTREACH_TYPOGRAPHY.bodySmall, color: OUTREACH_COLORS.tertiaryText, marginTop: '0.5rem' }}>
          {step.wait?.type === 'business_days'
            ? 'Business days exclude weekends (Sat/Sun)'
            : 'Calendar days include all days'}
        </p>
      </div>
    );
  };

  const renderConditionEditor = () => {
    return (
      <div>
        <label style={{ ...OUTREACH_TYPOGRAPHY.label, color: OUTREACH_COLORS.secondaryText, display: 'block', marginBottom: '0.5rem' }}>
          Condition Type
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          <button
            onClick={() => onChange({ ...step, condition: { ...step.condition, type: 'if_then_else', branches: step.condition?.branches || [] } })}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: step.condition?.type === 'if_then_else' ? OUTREACH_COLORS.primary : 'white',
              color: step.condition?.type === 'if_then_else' ? 'white' : OUTREACH_COLORS.primaryText,
              border: `1px solid ${step.condition?.type === 'if_then_else' ? OUTREACH_COLORS.primary : OUTREACH_COLORS.border}`,
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            If/Then/Else
          </button>
          <button
            onClick={() => onChange({ ...step, condition: { ...step.condition, type: 'split', branches: step.condition?.branches || [] } })}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: step.condition?.type === 'split' ? OUTREACH_COLORS.primary : 'white',
              color: step.condition?.type === 'split' ? 'white' : OUTREACH_COLORS.primaryText,
              border: `1px solid ${step.condition?.type === 'split' ? OUTREACH_COLORS.primary : OUTREACH_COLORS.border}`,
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Percentage Split
          </button>
        </div>

        {step.condition?.type === 'if_then_else' && (
          <div>
            <select
              style={{
                width: '100%',
                padding: '0.75rem',
                border: `1px solid ${OUTREACH_COLORS.border}`,
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                marginBottom: '0.5rem',
              }}
            >
              <option value="">Select condition...</option>
              <option value="email_opened">Previous email was opened</option>
              <option value="link_clicked">Link was clicked</option>
              <option value="replied">Contact replied</option>
              <option value="linkedin_connected">LinkedIn connection accepted</option>
            </select>
          </div>
        )}
      </div>
    );
  };

  const renderActionEditor = () => {
    return (
      <div>
        <label style={{ ...OUTREACH_TYPOGRAPHY.label, color: OUTREACH_COLORS.secondaryText, display: 'block', marginBottom: '0.5rem' }}>
          Action Type
        </label>
        <select
          value={step.action?.type || ''}
          onChange={(e) => onChange({ ...step, action: { type: e.target.value as 'tag' | 'move_stage' | 'assign_owner' | 'create_task' | 'webhook' | 'slack_notify' } })}
          style={{
            width: '100%',
            padding: '0.75rem',
            border: `1px solid ${OUTREACH_COLORS.border}`,
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            marginBottom: '1rem',
          }}
        >
          <option value="">Select action...</option>
          <option value="tag">Add/Remove Tag</option>
          <option value="move_stage">Move to Stage</option>
          <option value="assign_owner">Assign Owner</option>
          <option value="create_task">Create Task</option>
          <option value="slack_notify">Send Slack Notification</option>
          <option value="webhook">Trigger Webhook</option>
        </select>

        {step.action?.type === 'tag' && (
          <input
            type="text"
            placeholder="Tag name..."
            value={step.action.tag?.tag_name || ''}
            onChange={(e) => onChange({ ...step, action: { ...step.action, type: 'tag', tag: { action: 'add', tag_name: e.target.value } } })}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: `1px solid ${OUTREACH_COLORS.border}`,
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              boxSizing: 'border-box',
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div style={{
      backgroundColor: OUTREACH_COLORS.cardBg,
      borderRadius: '0.5rem',
      padding: '1.5rem',
    }}>
      <h3 style={{ ...OUTREACH_TYPOGRAPHY.h3, color: OUTREACH_COLORS.primaryText, marginBottom: '1rem' }}>
        Edit Step {step.order}
      </h3>

      {/* Step Type Selector */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ ...OUTREACH_TYPOGRAPHY.label, color: OUTREACH_COLORS.secondaryText, display: 'block', marginBottom: '0.5rem' }}>
          Step Type
        </label>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['message', 'wait', 'condition', 'action'] as StepType[]).map((type) => (
            <button
              key={type}
              onClick={() => onChange({ ...step, type })}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: step.type === type ? OUTREACH_COLORS[type] : 'white',
                color: step.type === type ? 'white' : OUTREACH_COLORS.primaryText,
                border: `1px solid ${step.type === type ? OUTREACH_COLORS[type] : OUTREACH_COLORS.border}`,
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                textTransform: 'capitalize',
              }}
            >
              {type === 'message' && '📨 '}
              {type === 'wait' && '⏱️ '}
              {type === 'condition' && '◇ '}
              {type === 'action' && '⚡ '}
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Type-specific editor */}
      {step.type === 'message' && renderMessageEditor()}
      {step.type === 'wait' && renderWaitEditor()}
      {step.type === 'condition' && renderConditionEditor()}
      {step.type === 'action' && renderActionEditor()}

      {/* Channel Selector Modal */}
      {showChannelSelector && (
        <ChannelSelector
          selectedChannel={step.channel}
          onSelect={handleChannelSelect}
          onClose={() => setShowChannelSelector(false)}
        />
      )}
    </div>
  );
};

export default StepEditor;
