import React, { useState } from 'react';
import type { SignalEvent, SignalCategory } from '../../types/signals';
import {
  SIGNALS_COLORS,
  SIGNALS_TYPOGRAPHY,
  getSignalIcon,
  formatTimeAgo,
  DEMO_COMPANY_NAMES,
  SIGNAL_CATEGORY_LABELS,
} from '../../constants/signals';

interface RecentSignalsTableProps {
  signals: SignalEvent[];
  onSelectSignal?: (signal: SignalEvent) => void;
}

const RecentSignalsTable: React.FC<RecentSignalsTableProps> = ({
  signals,
  onSelectSignal,
}) => {
  const [filter, setFilter] = useState<SignalCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSignals = signals.filter((signal) => {
    const matchesFilter = filter === 'all' || signal.signal_category === filter;
    const matchesSearch = searchQuery === '' ||
      signal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (DEMO_COMPANY_NAMES[signal.company_id] || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const categories: (SignalCategory | 'all')[] = [
    'all',
    'sustainability',
    'workplace_experience',
    'employee_wellbeing',
    'growth_expansion',
    'direct_engagement',
  ];

  return (
    <div
      style={{
        backgroundColor: SIGNALS_COLORS.cardBg,
        borderRadius: '0.5rem',
        border: `1px solid ${SIGNALS_COLORS.border}`,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '1rem 1.5rem',
          borderBottom: `1px solid ${SIGNALS_COLORS.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
        }}
      >
        <h3 style={{ ...SIGNALS_TYPOGRAPHY.h4, color: SIGNALS_COLORS.primaryText, margin: 0 }}>
          Recent Signals
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as SignalCategory | 'all')}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '0.375rem',
              border: `1px solid ${SIGNALS_COLORS.border}`,
              backgroundColor: SIGNALS_COLORS.cardBg,
              fontSize: '0.75rem',
              color: SIGNALS_COLORS.primaryText,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : SIGNAL_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>

          {/* Search */}
          <input
            type="text"
            placeholder="Search signals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '0.375rem 0.75rem',
              borderRadius: '0.375rem',
              border: `1px solid ${SIGNALS_COLORS.border}`,
              fontSize: '0.75rem',
              width: '150px',
              outline: 'none',
            }}
          />
        </div>
      </div>

      {/* Table Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '80px 1fr 1.5fr 80px 80px',
          gap: '1rem',
          padding: '0.75rem 1.5rem',
          backgroundColor: SIGNALS_COLORS.background,
          borderBottom: `1px solid ${SIGNALS_COLORS.border}`,
          ...SIGNALS_TYPOGRAPHY.label,
          color: SIGNALS_COLORS.secondaryText,
        }}
      >
        <div>Time</div>
        <div>Company</div>
        <div>Signal Type</div>
        <div style={{ textAlign: 'right' }}>Score</div>
        <div style={{ textAlign: 'center' }}>Action</div>
      </div>

      {/* Table Body */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {filteredSignals.length === 0 ? (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              color: SIGNALS_COLORS.tertiaryText,
            }}
          >
            No signals found
          </div>
        ) : (
          filteredSignals.map((signal) => (
            <div
              key={signal.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 1.5fr 80px 80px',
                gap: '1rem',
                padding: '0.75rem 1.5rem',
                borderBottom: `1px solid ${SIGNALS_COLORS.border}`,
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onClick={() => onSelectSignal?.(signal)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = SIGNALS_COLORS.cardBgHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {/* Time */}
              <div style={{ ...SIGNALS_TYPOGRAPHY.bodySmall, color: SIGNALS_COLORS.tertiaryText }}>
                {formatTimeAgo(new Date(signal.detected_at))}
              </div>

              {/* Company */}
              <div style={{ ...SIGNALS_TYPOGRAPHY.body, color: SIGNALS_COLORS.primaryText, fontWeight: 500 }}>
                {DEMO_COMPANY_NAMES[signal.company_id] || 'Unknown'}
              </div>

              {/* Signal Type */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1rem' }}>{getSignalIcon(signal.signal_type)}</span>
                <span style={{ ...SIGNALS_TYPOGRAPHY.body, color: SIGNALS_COLORS.primaryText }}>
                  {signal.title}
                </span>
              </div>

              {/* Score */}
              <div
                style={{
                  ...SIGNALS_TYPOGRAPHY.body,
                  color: SIGNALS_COLORS.success,
                  fontWeight: 600,
                  textAlign: 'right',
                }}
              >
                +{signal.current_score}
              </div>

              {/* Action */}
              <div style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onSelectSignal?.(signal)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: 'transparent',
                    color: SIGNALS_COLORS.primary,
                    border: `1px solid ${SIGNALS_COLORS.primary}`,
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                  }}
                >
                  View
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {filteredSignals.length > 0 && (
        <div
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: SIGNALS_COLORS.background,
            borderTop: `1px solid ${SIGNALS_COLORS.border}`,
          }}
        >
          <button
            style={{
              width: '100%',
              padding: '0.5rem',
              backgroundColor: 'transparent',
              color: SIGNALS_COLORS.primary,
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Load More Signals
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentSignalsTable;
