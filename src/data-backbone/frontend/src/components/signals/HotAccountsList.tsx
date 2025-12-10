import React from 'react';
import type { HotAccount } from '../../types/signals';
import {
  SIGNALS_COLORS,
  SIGNALS_TYPOGRAPHY,
  getIntentCategoryColor,
  getTrendArrow,
  getTrendColor,
  getSignalIcon,
  formatTimeAgo,
} from '../../constants/signals';

interface HotAccountsListProps {
  accounts: HotAccount[];
  onSelectAccount?: (account: HotAccount) => void;
  onStartSequence?: (account: HotAccount) => void;
}

const HotAccountsList: React.FC<HotAccountsListProps> = ({
  accounts,
  onSelectAccount,
  onStartSequence,
}) => {
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
        }}
      >
        <h3 style={{ ...SIGNALS_TYPOGRAPHY.h4, color: SIGNALS_COLORS.primaryText, margin: 0 }}>
          Hot Accounts (Score 80+)
        </h3>
        <span
          style={{
            ...SIGNALS_TYPOGRAPHY.bodySmall,
            color: SIGNALS_COLORS.tertiaryText,
          }}
        >
          {accounts.length} accounts
        </span>
      </div>

      {/* Accounts List */}
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {accounts.map((account) => (
          <div
            key={account.id}
            style={{
              padding: '1rem 1.5rem',
              borderBottom: `1px solid ${SIGNALS_COLORS.border}`,
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onClick={() => onSelectAccount?.(account)}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = SIGNALS_COLORS.cardBgHover;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {/* Account Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.25rem' }}>🔥</span>
                <div>
                  <div style={{ ...SIGNALS_TYPOGRAPHY.body, fontWeight: 600, color: SIGNALS_COLORS.primaryText }}>
                    {account.company_name}
                  </div>
                  <div style={{ ...SIGNALS_TYPOGRAPHY.bodySmall, color: SIGNALS_COLORS.tertiaryText }}>
                    {account.main_industry} • {account.hq_city}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: getIntentCategoryColor(account.intent_category),
                  }}
                >
                  {account.overall_score}
                </span>
                {account.score_trend && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: getTrendColor(account.score_trend),
                    }}
                  >
                    {getTrendArrow(account.score_trend)}
                  </span>
                )}
              </div>
            </div>

            {/* Recent Signals */}
            {account.recent_signals && account.recent_signals.length > 0 && (
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ ...SIGNALS_TYPOGRAPHY.bodySmall, color: SIGNALS_COLORS.secondaryText, marginBottom: '0.5rem' }}>
                  {account.recent_signals.length} new signals:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  {account.recent_signals.slice(0, 3).map((signal, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.75rem',
                        color: SIGNALS_COLORS.secondaryText,
                      }}
                    >
                      <span>{getSignalIcon(signal.type)}</span>
                      <span style={{ flex: 1 }}>{signal.title}</span>
                      <span style={{ color: SIGNALS_COLORS.tertiaryText }}>
                        ({formatTimeAgo(new Date(signal.detected_at))})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Champion & Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ ...SIGNALS_TYPOGRAPHY.bodySmall, color: SIGNALS_COLORS.secondaryText }}>
                {account.champion ? (
                  <>
                    Champion: <span style={{ fontWeight: 500, color: SIGNALS_COLORS.primaryText }}>{account.champion.name}</span> ({account.champion.title})
                  </>
                ) : (
                  <span style={{ color: SIGNALS_COLORS.tertiaryText }}>Champion: Not identified</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => onSelectAccount?.(account)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: 'transparent',
                    color: SIGNALS_COLORS.primary,
                    border: `1px solid ${SIGNALS_COLORS.primary}`,
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                  }}
                >
                  View Details
                </button>
                <button
                  onClick={() => onStartSequence?.(account)}
                  style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: SIGNALS_COLORS.primary,
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.25rem',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 500,
                  }}
                >
                  Start Sequence
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {accounts.length > 3 && (
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
            View All {accounts.length} Hot Accounts →
          </button>
        </div>
      )}
    </div>
  );
};

export default HotAccountsList;
