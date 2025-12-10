import { useMemo } from 'react';

export interface ScoreIndicatorProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showMax?: boolean;
  className?: string;
}

export interface LinearScoreItem {
  label: string;
  value: number;
  max: number;
}

export interface LinearScoreIndicatorProps {
  items: LinearScoreItem[];
  className?: string;
}

// Helper function to get score level based on percentage
const getScoreLevel = (percentage: number): 'excellent' | 'good' | 'fair' | 'poor' => {
  if (percentage >= 90) return 'excellent';
  if (percentage >= 70) return 'good';
  if (percentage >= 50) return 'fair';
  return 'poor';
};

// Helper function to get color class based on percentage
const getColorClass = (percentage: number): string => {
  if (percentage >= 90) return 'var(--color-success-500)';
  if (percentage >= 70) return 'var(--color-chart-1)';
  if (percentage >= 50) return 'var(--color-warning-500)';
  return 'var(--color-danger-500)';
};

// Size configurations
const sizeConfig = {
  sm: { size: 32, strokeWidth: 3, radius: 12 },
  md: { size: 48, strokeWidth: 4, radius: 18 },
  lg: { size: 64, strokeWidth: 5, radius: 26 },
};

export function ScoreIndicator({
  value,
  max = 100,
  size = 'md',
  showMax = true,
  className = '',
}: ScoreIndicatorProps) {
  const config = sizeConfig[size];
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const scoreLevel = getScoreLevel(percentage);
  const color = getColorClass(percentage);

  const circumference = 2 * Math.PI * config.radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`score-indicator score-indicator-${size} score-indicator-${scoreLevel} ${className}`}>
      <svg
        className="score-indicator-circular"
        width={config.size}
        height={config.size}
        viewBox={`0 0 ${config.size} ${config.size}`}
      >
        <circle
          className="score-indicator-track"
          cx={config.size / 2}
          cy={config.size / 2}
          r={config.radius}
          strokeWidth={config.strokeWidth}
        />
        <circle
          className="score-indicator-fill"
          cx={config.size / 2}
          cy={config.size / 2}
          r={config.radius}
          strokeWidth={config.strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ stroke: color }}
        />
      </svg>
      <div className="score-indicator-label">
        <span className="score-indicator-value">{value}</span>
        {showMax && <span className="score-indicator-max">/{max}</span>}
      </div>
    </div>
  );
}

export function LinearScoreIndicator({ items, className = '' }: LinearScoreIndicatorProps) {
  return (
    <div className={`score-indicator-linear ${className}`}>
      {items.map((item, index) => {
        const percentage = Math.min(100, Math.max(0, (item.value / item.max) * 100));
        const color = getColorClass(percentage);

        return (
          <div key={index} className="score-indicator-linear-item">
            <span className="score-indicator-linear-label">{item.label}</span>
            <div className="score-indicator-linear-bar">
              <div
                className="score-indicator-linear-fill"
                style={{ width: `${percentage}%`, background: color }}
              />
            </div>
            <span className="score-indicator-linear-value">
              {item.value}/{item.max}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// BANT Scorecard (specialized version for BANT methodology)
export interface BANTScoreProps {
  budget: number;
  authority: number;
  need: number;
  timeline: number;
  maxScore?: number;
  className?: string;
}

export function BANTScorecard({
  budget,
  authority,
  need,
  timeline,
  maxScore = 25,
  className = '',
}: BANTScoreProps) {
  const items: LinearScoreItem[] = [
    { label: 'Budget', value: budget, max: maxScore },
    { label: 'Authority', value: authority, max: maxScore },
    { label: 'Need', value: need, max: maxScore },
    { label: 'Timeline', value: timeline, max: maxScore },
  ];

  const totalScore = budget + authority + need + timeline;
  const totalMax = maxScore * 4;

  return (
    <div className={`bant-scorecard ${className}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
        <ScoreIndicator value={totalScore} max={totalMax} size="lg" />
        <div>
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Total BANT Score</div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            {getScoreLevel((totalScore / totalMax) * 100).charAt(0).toUpperCase() +
             getScoreLevel((totalScore / totalMax) * 100).slice(1)} qualification
          </div>
        </div>
      </div>
      <LinearScoreIndicator items={items} />
    </div>
  );
}
