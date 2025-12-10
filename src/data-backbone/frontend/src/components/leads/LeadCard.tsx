import React from 'react';
import { LEADS_COLORS, LEADS_TYPOGRAPHY, formatTimeRemaining } from '../../constants/leads';
import type { Lead } from '../../types/leads';
import CountdownTimer from './CountdownTimer';
import LeadSource from './LeadSource';
import LeadBackground from './LeadBackground';
import ActionButton from './ActionButton';

interface LeadCardProps {
  lead: Lead;
  onAction: (leadId: string, action: 'contact' | 'followUp' | 'convert' | 'archive' | 'assign' | 'addNote') => void;
  onSelect?: (lead: Lead) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onAction, onSelect }) => {
  const timerInfo = formatTimeRemaining(lead.createdAt);
  const isOverdue = timerInfo.isExpired;
  const isUrgent = timerInfo.state === 'orange' || timerInfo.state === 'red';

  const getStatusBadge = () => {
    const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
      'New': { color: '#3B82F6', bg: '#3B82F615', label: 'New' },
      'Contacted': { color: '#10B981', bg: '#10B98115', label: 'Contacted' },
      'Qualified': { color: '#8B5CF6', bg: '#8B5CF615', label: 'Qualified' },
      'Converted': { color: '#059669', bg: '#05966915', label: 'Converted' },
      'Lost': { color: '#6B7280', bg: '#6B728015', label: 'Lost' },
    };

    const config = statusConfig[lead.status] || statusConfig['New'];

    return (
      <span
        style={{
          display: 'inline-block',
          padding: '0.25rem 0.5rem',
          backgroundColor: config.bg,
          color: config.color,
          fontSize: '0.6875rem',
          fontWeight: 600,
          borderRadius: '0.25rem',
          textTransform: 'uppercase',
          letterSpacing: '0.025em',
        }}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div
      style={{
        backgroundColor: LEADS_COLORS.cardBg,
        borderRadius: '0.5rem',
        border: `1px solid ${isOverdue ? LEADS_COLORS.timerRed + '40' : isUrgent ? LEADS_COLORS.timerOrange + '40' : LEADS_COLORS.border}`,
        boxShadow: isOverdue
          ? `0 0 0 1px ${LEADS_COLORS.timerRed}20, 0 2px 8px rgba(0, 0, 0, 0.08)`
          : '0 1px 3px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Header Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: '1rem 1.25rem',
          borderBottom: `1px solid ${LEADS_COLORS.border}`,
          backgroundColor: isOverdue ? `${LEADS_COLORS.timerRed}05` : 'transparent',
        }}
      >
        {/* Left: Name and Contact */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <h4
              onClick={() => onSelect?.(lead)}
              style={{
                ...LEADS_TYPOGRAPHY.h4,
                margin: 0,
                color: LEADS_COLORS.primaryText,
                cursor: onSelect ? 'pointer' : 'default',
              }}
              onMouseEnter={(e) => {
                if (onSelect) e.currentTarget.style.color = LEADS_COLORS.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = LEADS_COLORS.primaryText;
              }}
            >
              {lead.name}
            </h4>
            {getStatusBadge()}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.25rem' }}>
            <a
              href={`mailto:${lead.email}`}
              style={{
                fontSize: '0.8125rem',
                color: LEADS_COLORS.secondaryText,
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = LEADS_COLORS.primary;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = LEADS_COLORS.secondaryText;
              }}
            >
              {lead.email}
            </a>
            {lead.phone && (
              <a
                href={`tel:${lead.phone}`}
                style={{
                  fontSize: '0.8125rem',
                  color: LEADS_COLORS.secondaryText,
                  textDecoration: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = LEADS_COLORS.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = LEADS_COLORS.secondaryText;
                }}
              >
                {lead.phone}
              </a>
            )}
          </div>
        </div>

        {/* Right: Timer */}
        <div style={{ minWidth: '120px', textAlign: 'right' }}>
          <CountdownTimer createdAt={lead.createdAt} />
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '1rem 1.25rem' }}>
        {/* Source Section */}
        <div style={{ marginBottom: '1rem' }}>
          <LeadSource source={lead.source} campaign={lead.campaign} showPriority />
        </div>

        {/* Background Section */}
        <LeadBackground background={lead.background} />
      </div>

      {/* Action Footer */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: '0.75rem 1.25rem',
          borderTop: `1px solid ${LEADS_COLORS.border}`,
          backgroundColor: LEADS_COLORS.background,
        }}
      >
        <ActionButton lead={lead} onAction={onAction} />
      </div>
    </div>
  );
};

export default LeadCard;
