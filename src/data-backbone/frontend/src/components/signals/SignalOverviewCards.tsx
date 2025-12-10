import React from 'react';
import type { SignalStats } from '../../types/signals';
import { SIGNALS_COLORS, SIGNALS_TYPOGRAPHY } from '../../constants/signals';

interface SignalOverviewCardsProps {
  stats: SignalStats;
}

const SignalOverviewCards: React.FC<SignalOverviewCardsProps> = ({ stats }) => {
  const cards = [
    {
      label: 'Total Signals',
      value: stats.total_signals.toLocaleString(),
      change: stats.signals_change_percent,
      color: SIGNALS_COLORS.primary,
    },
    {
      label: 'Hot Accounts',
      value: stats.hot_accounts.toString(),
      change: stats.hot_accounts_change_percent,
      color: SIGNALS_COLORS.hot,
    },
    {
      label: 'Warm Accounts',
      value: stats.warm_accounts.toString(),
      change: stats.warm_accounts_change_percent,
      color: SIGNALS_COLORS.warm,
    },
    {
      label: 'New Today',
      value: stats.new_today.toString(),
      change: stats.new_today_change_percent,
      color: SIGNALS_COLORS.success,
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '1rem',
      }}
    >
      {cards.map((card, index) => (
        <div
          key={index}
          style={{
            backgroundColor: SIGNALS_COLORS.cardBg,
            borderRadius: '0.5rem',
            padding: '1rem',
            border: `1px solid ${SIGNALS_COLORS.border}`,
          }}
        >
          <div
            style={{
              ...SIGNALS_TYPOGRAPHY.bodySmall,
              color: SIGNALS_COLORS.secondaryText,
              marginBottom: '0.25rem',
            }}
          >
            {card.label}
          </div>
          <div
            style={{
              ...SIGNALS_TYPOGRAPHY.h2,
              color: card.color,
              marginBottom: '0.25rem',
            }}
          >
            {card.value}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.75rem',
              color: card.change >= 0 ? SIGNALS_COLORS.success : SIGNALS_COLORS.danger,
            }}
          >
            <span>{card.change >= 0 ? '↑' : '↓'}</span>
            <span>{Math.abs(card.change)}%</span>
            <span style={{ color: SIGNALS_COLORS.tertiaryText }}>vs last period</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SignalOverviewCards;
