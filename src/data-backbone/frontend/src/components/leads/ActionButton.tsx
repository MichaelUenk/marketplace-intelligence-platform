import React, { useState } from 'react';
import { LEADS_COLORS, formatTimeRemaining } from '../../constants/leads';
import type { Lead, LeadStatus } from '../../types/leads';

interface ActionButtonProps {
  lead: Lead;
  onAction: (leadId: string, action: 'contact' | 'followUp' | 'convert' | 'archive' | 'assign' | 'addNote') => void;
}

const ActionButton: React.FC<ActionButtonProps> = ({ lead, onAction }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const timerInfo = formatTimeRemaining(lead.createdAt);
  const isOverdue = timerInfo.isExpired;

  // Determine button config based on status
  const getButtonConfig = (status: LeadStatus) => {
    if (isOverdue) {
      return {
        label: 'Act Now!',
        action: status === 'New' ? 'contact' : status === 'Contacted' ? 'followUp' : 'convert',
        color: LEADS_COLORS.timerRed,
        hoverColor: '#DC2626',
      };
    }

    switch (status) {
      case 'New':
        return {
          label: 'Contact Now',
          action: 'contact',
          color: LEADS_COLORS.statusNew,
          hoverColor: '#2563EB',
        };
      case 'Contacted':
        return {
          label: 'Follow Up',
          action: 'followUp',
          color: LEADS_COLORS.statusContacted,
          hoverColor: '#059669',
        };
      case 'Qualified':
        return {
          label: 'Convert',
          action: 'convert',
          color: LEADS_COLORS.statusQualified,
          hoverColor: '#7C3AED',
        };
      default:
        return {
          label: 'View',
          action: 'contact',
          color: LEADS_COLORS.secondaryText,
          hoverColor: LEADS_COLORS.primaryText,
        };
    }
  };

  const buttonConfig = getButtonConfig(lead.status);

  const secondaryActions = [
    { label: 'Archive', action: 'archive', icon: '📁' },
    { label: 'Assign', action: 'assign', icon: '👤' },
    { label: 'Add Note', action: 'addNote', icon: '📝' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
      {/* Primary Action Button */}
      <button
        onClick={() => onAction(lead.id, buttonConfig.action as 'contact' | 'followUp' | 'convert')}
        style={{
          padding: '0.5rem 1rem',
          backgroundColor: buttonConfig.color,
          color: 'white',
          border: 'none',
          borderRadius: '0.375rem',
          fontSize: '0.8125rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          boxShadow: isOverdue ? `0 0 0 2px ${buttonConfig.color}40` : 'none',
          animation: isOverdue ? 'urgentPulse 1s ease-in-out infinite' : 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = buttonConfig.hoverColor;
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = buttonConfig.color;
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {isOverdue && <span>⚡</span>}
        {buttonConfig.label}
      </button>

      {/* Secondary Actions Dropdown */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          style={{
            padding: '0.5rem',
            backgroundColor: 'transparent',
            color: LEADS_COLORS.secondaryText,
            border: `1px solid ${LEADS_COLORS.border}`,
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2rem',
            height: '2rem',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = LEADS_COLORS.background;
            e.currentTarget.style.borderColor = LEADS_COLORS.secondaryText;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = LEADS_COLORS.border;
          }}
        >
          ⋯
        </button>

        {showDropdown && (
          <>
            {/* Backdrop */}
            <div
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 10,
              }}
              onClick={() => setShowDropdown(false)}
            />

            {/* Dropdown Menu */}
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '100%',
                marginTop: '0.25rem',
                backgroundColor: 'white',
                borderRadius: '0.375rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                border: `1px solid ${LEADS_COLORS.border}`,
                zIndex: 20,
                minWidth: '140px',
                overflow: 'hidden',
              }}
            >
              {secondaryActions.map((action) => (
                <button
                  key={action.action}
                  onClick={() => {
                    onAction(lead.id, action.action as 'archive' | 'assign' | 'addNote');
                    setShowDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    backgroundColor: 'transparent',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.8125rem',
                    color: LEADS_COLORS.primaryText,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = LEADS_COLORS.background;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <span>{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Urgent pulse animation */}
      <style>{`
        @keyframes urgentPulse {
          0%, 100% { box-shadow: 0 0 0 2px ${buttonConfig.color}40; }
          50% { box-shadow: 0 0 0 4px ${buttonConfig.color}20; }
        }
      `}</style>
    </div>
  );
};

export default ActionButton;
