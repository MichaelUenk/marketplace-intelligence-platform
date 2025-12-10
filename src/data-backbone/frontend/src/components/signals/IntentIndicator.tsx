import React from 'react';
import type { IntentCategory, ScoreTrend } from '../../types/signals';
import { SIGNALS_COLORS, getIntentCategoryColor, getIntentCategoryLabel, getTrendColor, getTrendArrow } from '../../constants/signals';

interface IntentIndicatorProps {
  category: IntentCategory;
  score: number;
  trend?: ScoreTrend;
  scoreChange?: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showTrend?: boolean;
}

const IntentIndicator: React.FC<IntentIndicatorProps> = ({
  category,
  score,
  trend,
  scoreChange,
  size = 'medium',
  showLabel = true,
  showTrend = true,
}) => {
  const color = getIntentCategoryColor(category);
  const label = getIntentCategoryLabel(category);

  const sizes = {
    small: {
      badge: { padding: '0.125rem 0.5rem', fontSize: '0.625rem' },
      score: { fontSize: '1rem', fontWeight: 700 },
      trend: { fontSize: '0.625rem' },
    },
    medium: {
      badge: { padding: '0.25rem 0.75rem', fontSize: '0.75rem' },
      score: { fontSize: '1.5rem', fontWeight: 700 },
      trend: { fontSize: '0.75rem' },
    },
    large: {
      badge: { padding: '0.375rem 1rem', fontSize: '0.875rem' },
      score: { fontSize: '2rem', fontWeight: 700 },
      trend: { fontSize: '0.875rem' },
    },
  };

  const currentSize = sizes[size];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.25rem' }}>
      {/* Score */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
        <span style={{ ...currentSize.score, color: color }}>
          {score}
        </span>
        <span style={{ fontSize: currentSize.trend.fontSize, color: SIGNALS_COLORS.tertiaryText }}>
          /100
        </span>
      </div>

      {/* Category Badge */}
      {showLabel && (
        <span
          style={{
            ...currentSize.badge,
            backgroundColor: `${color}20`,
            color: color,
            borderRadius: '9999px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.025em',
          }}
        >
          {label}
        </span>
      )}

      {/* Trend */}
      {showTrend && trend && scoreChange !== undefined && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            ...currentSize.trend,
            color: getTrendColor(trend),
          }}
        >
          <span>{getTrendArrow(trend)}</span>
          <span>{scoreChange > 0 ? '+' : ''}{scoreChange}</span>
          <span style={{ color: SIGNALS_COLORS.tertiaryText }}>(7d)</span>
        </div>
      )}
    </div>
  );
};

export default IntentIndicator;
