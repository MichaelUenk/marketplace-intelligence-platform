import React from 'react';
import type { OutreachSequence, SequenceStatus } from '../../types/outreach';
import { OUTREACH_COLORS, OUTREACH_TYPOGRAPHY, getStatusColor, SEQUENCE_TEMPLATES, DEFAULT_SEQUENCE_SETTINGS } from '../../constants/outreach';

interface SequenceListProps {
  sequences: OutreachSequence[];
  onSelectSequence: (sequence: OutreachSequence) => void;
  onCreateSequence: (sequence: OutreachSequence) => void;
  onDeleteSequence: (id: string) => void;
}

const SequenceList: React.FC<SequenceListProps> = ({
  sequences,
  onSelectSequence,
  onCreateSequence,
  onDeleteSequence,
}) => {
  const [showTemplates, setShowTemplates] = React.useState(false);

  const createBlankSequence = (): OutreachSequence => ({
    id: `seq-${Date.now()}`,
    name: 'New Sequence',
    description: '',
    status: 'draft',
    targeting: {
      audience_type: 'manual',
      exclusions: {
        exclude_existing_sequences: true,
        exclude_replied: true,
        exclude_bounced: true,
        exclude_unsubscribed: true,
        exclude_company_ids: [],
        exclude_contact_ids: [],
      },
    },
    steps: [],
    settings: DEFAULT_SEQUENCE_SETTINGS,
    stats: {
      total_enrolled: 0,
      active: 0,
      completed: 0,
      replied: 0,
      bounced: 0,
      unsubscribed: 0,
      open_rate: 0,
      click_rate: 0,
      reply_rate: 0,
      conversion_rate: 0,
      step_stats: [],
    },
    created_by: 'user-1',
    team_id: 'team-1',
    created_at: new Date(),
    updated_at: new Date(),
  });

  const createFromTemplate = (templateIndex: number) => {
    const template = SEQUENCE_TEMPLATES[templateIndex];
    const newSequence = createBlankSequence();
    newSequence.name = template.name;
    newSequence.description = template.description;
    newSequence.steps = template.template.steps || [];
    onCreateSequence(newSequence);
    setShowTemplates(false);
  };

  const getStatusBadge = (status: SequenceStatus) => {
    const color = getStatusColor(status);
    return (
      <span style={{
        padding: '0.25rem 0.75rem',
        backgroundColor: `${color}20`,
        color: color,
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
      }}>
        {status}
      </span>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
      }}>
        <div>
          <h2 style={{ ...OUTREACH_TYPOGRAPHY.h2, color: OUTREACH_COLORS.primaryText, margin: 0 }}>
            Outreach Sequences
          </h2>
          <p style={{ ...OUTREACH_TYPOGRAPHY.body, color: OUTREACH_COLORS.secondaryText, margin: '0.25rem 0 0 0' }}>
            Create and manage multi-channel outreach campaigns
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowTemplates(true)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'white',
              color: OUTREACH_COLORS.primary,
              border: `1px solid ${OUTREACH_COLORS.primary}`,
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Use Template
          </button>
          <button
            onClick={() => onCreateSequence(createBlankSequence())}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: OUTREACH_COLORS.primary,
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
            <span style={{ fontSize: '1.125rem' }}>+</span>
            New Sequence
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        {[
          { label: 'Total Sequences', value: sequences.length, color: OUTREACH_COLORS.primary },
          { label: 'Active', value: sequences.filter(s => s.status === 'active').length, color: OUTREACH_COLORS.success },
          { label: 'Total Enrolled', value: sequences.reduce((sum, s) => sum + s.stats.total_enrolled, 0), color: OUTREACH_COLORS.info },
          { label: 'Avg Reply Rate', value: `${sequences.length > 0 ? (sequences.reduce((sum, s) => sum + s.stats.reply_rate, 0) / sequences.length).toFixed(1) : 0}%`, color: OUTREACH_COLORS.secondary },
        ].map((stat, index) => (
          <div key={index} style={{
            backgroundColor: OUTREACH_COLORS.cardBg,
            borderRadius: '0.5rem',
            padding: '1rem',
            border: `1px solid ${OUTREACH_COLORS.border}`,
          }}>
            <div style={{ ...OUTREACH_TYPOGRAPHY.bodySmall, color: OUTREACH_COLORS.secondaryText, marginBottom: '0.25rem' }}>
              {stat.label}
            </div>
            <div style={{ ...OUTREACH_TYPOGRAPHY.h2, color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Sequences List */}
      {sequences.length === 0 ? (
        <div style={{
          backgroundColor: OUTREACH_COLORS.cardBg,
          borderRadius: '0.5rem',
          padding: '3rem',
          textAlign: 'center',
          border: `1px solid ${OUTREACH_COLORS.border}`,
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📨</div>
          <h3 style={{ ...OUTREACH_TYPOGRAPHY.h3, color: OUTREACH_COLORS.primaryText, margin: '0 0 0.5rem 0' }}>
            No sequences yet
          </h3>
          <p style={{ ...OUTREACH_TYPOGRAPHY.body, color: OUTREACH_COLORS.secondaryText, margin: '0 0 1.5rem 0' }}>
            Create your first outreach sequence to start engaging with prospects
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
            <button
              onClick={() => setShowTemplates(true)}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'white',
                color: OUTREACH_COLORS.primary,
                border: `1px solid ${OUTREACH_COLORS.primary}`,
                borderRadius: '0.375rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
              }}
            >
              Start from Template
            </button>
            <button
              onClick={() => onCreateSequence(createBlankSequence())}
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
              Create Blank Sequence
            </button>
          </div>
        </div>
      ) : (
        <div style={{
          backgroundColor: OUTREACH_COLORS.cardBg,
          borderRadius: '0.5rem',
          border: `1px solid ${OUTREACH_COLORS.border}`,
          overflow: 'hidden',
        }}>
          {/* Table Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px',
            gap: '1rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: OUTREACH_COLORS.background,
            borderBottom: `1px solid ${OUTREACH_COLORS.border}`,
            ...OUTREACH_TYPOGRAPHY.label,
            color: OUTREACH_COLORS.secondaryText,
          }}>
            <div>Sequence</div>
            <div>Status</div>
            <div>Steps</div>
            <div>Enrolled</div>
            <div>Reply Rate</div>
            <div>Actions</div>
          </div>

          {/* Table Rows */}
          {sequences.map((sequence) => (
            <div
              key={sequence.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 100px',
                gap: '1rem',
                padding: '1rem 1.5rem',
                borderBottom: `1px solid ${OUTREACH_COLORS.border}`,
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onClick={() => onSelectSequence(sequence)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = OUTREACH_COLORS.cardBgHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {/* Name & Description */}
              <div>
                <div style={{ ...OUTREACH_TYPOGRAPHY.body, color: OUTREACH_COLORS.primaryText, fontWeight: 600 }}>
                  {sequence.name}
                </div>
                {sequence.description && (
                  <div style={{ ...OUTREACH_TYPOGRAPHY.bodySmall, color: OUTREACH_COLORS.tertiaryText, marginTop: '0.125rem' }}>
                    {sequence.description.substring(0, 60)}{sequence.description.length > 60 ? '...' : ''}
                  </div>
                )}
              </div>

              {/* Status */}
              <div>{getStatusBadge(sequence.status)}</div>

              {/* Steps */}
              <div style={{ ...OUTREACH_TYPOGRAPHY.body, color: OUTREACH_COLORS.primaryText }}>
                {sequence.steps.length} steps
              </div>

              {/* Enrolled */}
              <div style={{ ...OUTREACH_TYPOGRAPHY.body, color: OUTREACH_COLORS.primaryText }}>
                {sequence.stats.total_enrolled.toLocaleString()}
              </div>

              {/* Reply Rate */}
              <div style={{ ...OUTREACH_TYPOGRAPHY.body, color: sequence.stats.reply_rate >= 10 ? OUTREACH_COLORS.success : OUTREACH_COLORS.primaryText }}>
                {sequence.stats.reply_rate.toFixed(1)}%
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onSelectSequence(sequence)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: 'transparent',
                    color: OUTREACH_COLORS.primary,
                    border: `1px solid ${OUTREACH_COLORS.primary}`,
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => onDeleteSequence(sequence.id)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: 'transparent',
                    color: OUTREACH_COLORS.danger,
                    border: `1px solid ${OUTREACH_COLORS.danger}`,
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                  }}
                >
                  &times;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
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
            maxWidth: '700px',
            width: '95%',
            maxHeight: '80vh',
            overflow: 'auto',
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '1.5rem',
              borderBottom: `1px solid ${OUTREACH_COLORS.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h2 style={{ ...OUTREACH_TYPOGRAPHY.h2, color: OUTREACH_COLORS.primaryText, margin: 0 }}>
                  Sequence Templates
                </h2>
                <p style={{ ...OUTREACH_TYPOGRAPHY.body, color: OUTREACH_COLORS.secondaryText, margin: '0.25rem 0 0 0' }}>
                  Choose a pre-built template to get started quickly
                </p>
              </div>
              <button
                onClick={() => setShowTemplates(false)}
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

            {/* Templates */}
            <div style={{ padding: '1.5rem' }}>
              {SEQUENCE_TEMPLATES.map((template, index) => (
                <div
                  key={index}
                  onClick={() => createFromTemplate(index)}
                  style={{
                    padding: '1rem',
                    backgroundColor: OUTREACH_COLORS.background,
                    border: `1px solid ${OUTREACH_COLORS.border}`,
                    borderRadius: '0.5rem',
                    marginBottom: '1rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = OUTREACH_COLORS.primary;
                    e.currentTarget.style.backgroundColor = `${OUTREACH_COLORS.primary}05`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = OUTREACH_COLORS.border;
                    e.currentTarget.style.backgroundColor = OUTREACH_COLORS.background;
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ ...OUTREACH_TYPOGRAPHY.h4, color: OUTREACH_COLORS.primaryText }}>
                      {template.name}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span style={{
                        padding: '0.125rem 0.5rem',
                        backgroundColor: `${OUTREACH_COLORS.success}20`,
                        color: OUTREACH_COLORS.success,
                        borderRadius: '0.25rem',
                        fontSize: '0.625rem',
                        fontWeight: 600,
                      }}>
                        {template.avg_reply_rate}% Reply Rate
                      </span>
                      <span style={{
                        padding: '0.125rem 0.5rem',
                        backgroundColor: `${OUTREACH_COLORS.info}20`,
                        color: OUTREACH_COLORS.info,
                        borderRadius: '0.25rem',
                        fontSize: '0.625rem',
                        fontWeight: 600,
                      }}>
                        {template.use_count} uses
                      </span>
                    </div>
                  </div>
                  <div style={{ ...OUTREACH_TYPOGRAPHY.body, color: OUTREACH_COLORS.secondaryText }}>
                    {template.description}
                  </div>
                  <div style={{ ...OUTREACH_TYPOGRAPHY.bodySmall, color: OUTREACH_COLORS.tertiaryText, marginTop: '0.5rem' }}>
                    {template.template.steps?.length || 0} steps
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SequenceList;
