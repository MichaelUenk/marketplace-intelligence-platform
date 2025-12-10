import React, { useState } from 'react';
import type { OutreachSequence, SequenceStep, SequenceStatus } from '../../types/outreach';
import { OUTREACH_COLORS, OUTREACH_TYPOGRAPHY, getStatusColor } from '../../constants/outreach';
import StepCard from './StepCard';
import StepEditor from './StepEditor';

interface SequenceBuilderProps {
  sequence: OutreachSequence;
  onSave: (sequence: OutreachSequence) => void;
  onClose: () => void;
}

const SequenceBuilder: React.FC<SequenceBuilderProps> = ({
  sequence: initialSequence,
  onSave,
  onClose,
}) => {
  const [sequence, setSequence] = useState<OutreachSequence>(initialSequence);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(
    initialSequence.steps.length > 0 ? initialSequence.steps[0].id : null
  );

  const selectedStep = sequence.steps.find((s) => s.id === selectedStepId);

  const handleAddStep = () => {
    const newStep: SequenceStep = {
      id: `step-${Date.now()}`,
      sequence_id: sequence.id,
      order: sequence.steps.length + 1,
      type: 'message',
      content: { body: '', tokens_used: [] },
    };

    setSequence({
      ...sequence,
      steps: [...sequence.steps, newStep],
    });
    setSelectedStepId(newStep.id);
  };

  const handleDeleteStep = (stepId: string) => {
    const newSteps = sequence.steps
      .filter((s) => s.id !== stepId)
      .map((s, index) => ({ ...s, order: index + 1 }));

    setSequence({
      ...sequence,
      steps: newSteps,
    });

    if (selectedStepId === stepId) {
      setSelectedStepId(newSteps.length > 0 ? newSteps[0].id : null);
    }
  };

  const handleStepChange = (updatedStep: SequenceStep) => {
    setSequence({
      ...sequence,
      steps: sequence.steps.map((s) => (s.id === updatedStep.id ? updatedStep : s)),
    });
  };

  const handleStatusChange = (status: SequenceStatus) => {
    setSequence({
      ...sequence,
      status,
      activated_at: status === 'active' ? new Date() : sequence.activated_at,
    });
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: OUTREACH_COLORS.background,
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.5rem',
        backgroundColor: OUTREACH_COLORS.cardBg,
        borderBottom: `1px solid ${OUTREACH_COLORS.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.25rem',
              cursor: 'pointer',
              color: OUTREACH_COLORS.secondaryText,
              padding: '0.25rem',
            }}
          >
            &larr;
          </button>
          <div>
            <input
              type="text"
              value={sequence.name}
              onChange={(e) => setSequence({ ...sequence, name: e.target.value })}
              style={{
                ...OUTREACH_TYPOGRAPHY.h2,
                color: OUTREACH_COLORS.primaryText,
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                padding: 0,
                width: '300px',
              }}
              placeholder="Sequence Name"
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
              <span style={{
                padding: '0.125rem 0.5rem',
                backgroundColor: `${getStatusColor(sequence.status)}20`,
                color: getStatusColor(sequence.status),
                borderRadius: '0.25rem',
                fontSize: '0.625rem',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}>
                {sequence.status}
              </span>
              <span style={{ ...OUTREACH_TYPOGRAPHY.bodySmall, color: OUTREACH_COLORS.tertiaryText }}>
                {sequence.steps.length} steps
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {sequence.status === 'draft' && (
            <button
              onClick={() => handleStatusChange('active')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: OUTREACH_COLORS.success,
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span>&#9654;</span> Activate
            </button>
          )}
          {sequence.status === 'active' && (
            <button
              onClick={() => handleStatusChange('paused')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: OUTREACH_COLORS.warning,
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Pause
            </button>
          )}
          {sequence.status === 'paused' && (
            <button
              onClick={() => handleStatusChange('active')}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: OUTREACH_COLORS.success,
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Resume
            </button>
          )}
          <button
            onClick={() => onSave(sequence)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: OUTREACH_COLORS.primary,
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Save
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
      }}>
        {/* Steps Panel (Left) */}
        <div style={{
          width: '320px',
          borderRight: `1px solid ${OUTREACH_COLORS.border}`,
          backgroundColor: OUTREACH_COLORS.cardBg,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <div style={{
            padding: '1rem',
            borderBottom: `1px solid ${OUTREACH_COLORS.border}`,
          }}>
            <h3 style={{ ...OUTREACH_TYPOGRAPHY.h4, color: OUTREACH_COLORS.primaryText, margin: 0 }}>
              Sequence Steps
            </h3>
          </div>

          {/* Steps List */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: '1rem',
          }}>
            {/* Start Node */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}>
              <div style={{
                padding: '0.5rem 1rem',
                backgroundColor: OUTREACH_COLORS.success,
                color: 'white',
                borderRadius: '0.375rem',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}>
                START
              </div>
              <div style={{
                width: '2px',
                height: '20px',
                backgroundColor: OUTREACH_COLORS.border,
              }} />
            </div>

            {/* Steps */}
            {sequence.steps.map((step, index) => (
              <div key={step.id} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}>
                <StepCard
                  step={step}
                  isSelected={selectedStepId === step.id}
                  onClick={() => setSelectedStepId(step.id)}
                  onDelete={() => handleDeleteStep(step.id)}
                />
                {index < sequence.steps.length - 1 && (
                  <div style={{
                    width: '2px',
                    height: '20px',
                    backgroundColor: OUTREACH_COLORS.border,
                    margin: '0.5rem 0',
                  }} />
                )}
              </div>
            ))}

            {/* Add Step Button */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: '0.5rem',
            }}>
              {sequence.steps.length > 0 && (
                <div style={{
                  width: '2px',
                  height: '20px',
                  backgroundColor: OUTREACH_COLORS.border,
                  marginBottom: '0.5rem',
                }} />
              )}
              <button
                onClick={handleAddStep}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: 'transparent',
                  color: OUTREACH_COLORS.primary,
                  border: `2px dashed ${OUTREACH_COLORS.primary}`,
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = `${OUTREACH_COLORS.primary}10`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>+</span>
                Add Step
              </button>
            </div>

            {/* End Node */}
            {sequence.steps.length > 0 && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginTop: '0.5rem',
              }}>
                <div style={{
                  width: '2px',
                  height: '20px',
                  backgroundColor: OUTREACH_COLORS.border,
                }} />
                <div style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: OUTREACH_COLORS.secondaryText,
                  color: 'white',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}>
                  END
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Editor Panel (Right) */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '1.5rem',
        }}>
          {selectedStep ? (
            <StepEditor
              step={selectedStep}
              onChange={handleStepChange}
            />
          ) : (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: OUTREACH_COLORS.tertiaryText,
            }}>
              <p style={{ ...OUTREACH_TYPOGRAPHY.body, marginBottom: '1rem' }}>
                No step selected
              </p>
              <button
                onClick={handleAddStep}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: OUTREACH_COLORS.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                Add Your First Step
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SequenceBuilder;
