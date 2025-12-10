import React from 'react';
import { LEADS_COLORS, LEADS_TYPOGRAPHY, LEAD_SOURCES } from '../../constants/leads';
import type { LeadFilters, LeadSource, LeadStatus, LeadStats } from '../../types/leads';

interface LeadsFiltersProps {
  filters: LeadFilters;
  stats: LeadStats;
  onFiltersChange: (filters: LeadFilters) => void;
}

const LeadsFilters: React.FC<LeadsFiltersProps> = ({ filters, stats, onFiltersChange }) => {
  const statuses: { value: LeadStatus | undefined; label: string; count: number }[] = [
    { value: undefined, label: 'All', count: stats.total },
    { value: 'New', label: 'New', count: stats.new },
    { value: 'Contacted', label: 'Contacted', count: stats.contacted },
    { value: 'Qualified', label: 'Qualified', count: stats.qualified },
    { value: 'Converted', label: 'Converted', count: stats.converted },
  ];

  const sources: LeadSource[] = ['Website', 'Referral', 'LinkedIn', 'Event', 'Cold Outreach', 'Partner'];

  return (
    <div
      style={{
        backgroundColor: LEADS_COLORS.cardBg,
        borderRadius: '0.5rem',
        border: `1px solid ${LEADS_COLORS.border}`,
        padding: '1rem 1.25rem',
        marginBottom: '1rem',
      }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem' }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: '200px', maxWidth: '300px' }}>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '0.75rem',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '0.875rem',
                color: LEADS_COLORS.tertiaryText,
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Search leads..."
              value={filters.searchQuery || ''}
              onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem 0.5rem 2.25rem',
                border: `1px solid ${LEADS_COLORS.border}`,
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none',
                backgroundColor: LEADS_COLORS.background,
                color: LEADS_COLORS.primaryText,
                transition: 'border-color 0.15s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = LEADS_COLORS.primary;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = LEADS_COLORS.border;
              }}
            />
          </div>
        </div>

        {/* Status Tabs */}
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {statuses.map((status) => (
            <button
              key={status.label}
              onClick={() => onFiltersChange({ ...filters, status: status.value })}
              style={{
                padding: '0.375rem 0.75rem',
                backgroundColor: filters.status === status.value
                  ? LEADS_COLORS.primary
                  : 'transparent',
                color: filters.status === status.value
                  ? 'white'
                  : LEADS_COLORS.secondaryText,
                border: 'none',
                borderRadius: '0.375rem',
                fontSize: '0.8125rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
              }}
              onMouseEnter={(e) => {
                if (filters.status !== status.value) {
                  e.currentTarget.style.backgroundColor = LEADS_COLORS.background;
                }
              }}
              onMouseLeave={(e) => {
                if (filters.status !== status.value) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              {status.label}
              <span
                style={{
                  padding: '0.125rem 0.375rem',
                  backgroundColor: filters.status === status.value
                    ? 'rgba(255,255,255,0.2)'
                    : LEADS_COLORS.background,
                  borderRadius: '0.25rem',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                }}
              >
                {status.count}
              </span>
            </button>
          ))}
        </div>

        {/* Source Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ ...LEADS_TYPOGRAPHY.bodySmall, color: LEADS_COLORS.secondaryText }}>
            Source:
          </span>
          <select
            value={filters.source || ''}
            onChange={(e) => onFiltersChange({
              ...filters,
              source: e.target.value ? e.target.value as LeadSource : undefined
            })}
            style={{
              padding: '0.375rem 0.75rem',
              border: `1px solid ${LEADS_COLORS.border}`,
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
              backgroundColor: 'white',
              color: LEADS_COLORS.primaryText,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">All Sources</option>
            {sources.map((source) => (
              <option key={source} value={source}>
                {LEAD_SOURCES[source].icon} {source}
              </option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ ...LEADS_TYPOGRAPHY.bodySmall, color: LEADS_COLORS.secondaryText }}>
            Sort:
          </span>
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-') as [LeadFilters['sortBy'], LeadFilters['sortOrder']];
              onFiltersChange({ ...filters, sortBy, sortOrder });
            }}
            style={{
              padding: '0.375rem 0.75rem',
              border: `1px solid ${LEADS_COLORS.border}`,
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
              backgroundColor: 'white',
              color: LEADS_COLORS.primaryText,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="createdAt-asc">Urgency (Most Urgent)</option>
            <option value="createdAt-desc">Newest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
          </select>
        </div>

        {/* Urgent Indicator */}
        {(stats.urgentCount > 0 || stats.overdue > 0) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.375rem 0.75rem',
              backgroundColor: stats.overdue > 0 ? `${LEADS_COLORS.timerRed}15` : `${LEADS_COLORS.timerOrange}15`,
              borderRadius: '0.375rem',
              border: `1px solid ${stats.overdue > 0 ? LEADS_COLORS.timerRed + '30' : LEADS_COLORS.timerOrange + '30'}`,
            }}
          >
            <span style={{ fontSize: '0.875rem' }}>{stats.overdue > 0 ? '🔴' : '⚠️'}</span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                color: stats.overdue > 0 ? LEADS_COLORS.timerRed : LEADS_COLORS.timerOrange,
              }}
            >
              {stats.overdue > 0
                ? `${stats.overdue} overdue`
                : `${stats.urgentCount} urgent`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadsFilters;
