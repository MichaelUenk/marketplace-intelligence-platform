import React from 'react';

export interface MetricCardProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    period?: string;
  };
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  change,
  icon,
  trend,
  className = '',
  size = 'md',
}) => {
  const getTrendClass = () => {
    if (!trend) return '';
    return `metric-trend-${trend}`;
  };

  const getTrendIcon = () => {
    if (!trend || trend === 'neutral') return null;
    return trend === 'up' ? '↑' : '↓';
  };

  return (
    <div className={`metric-card metric-card-${size} ${className}`.trim()}>
      <div className="metric-card-header">
        <span className="metric-card-label">{label}</span>
        {icon && <span className="metric-card-icon">{icon}</span>}
      </div>
      <div className="metric-card-value">{value}</div>
      {change && (
        <div className={`metric-card-change ${getTrendClass()}`}>
          {getTrendIcon()}
          <span className="metric-card-change-value">
            {change.value > 0 ? '+' : ''}{change.value}%
          </span>
          {change.period && (
            <span className="metric-card-change-period">{change.period}</span>
          )}
        </div>
      )}
    </div>
  );
};

// Sparkline mini chart for metric cards
export interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 80,
  height = 24,
  color = 'var(--color-brand-primary)',
  className = '',
}) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      className={`sparkline ${className}`.trim()}
      viewBox={`0 0 ${width} ${height}`}
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

// Metric card with sparkline
export interface MetricCardWithSparklineProps extends MetricCardProps {
  sparklineData?: number[];
  sparklineColor?: string;
}

export const MetricCardWithSparkline: React.FC<MetricCardWithSparklineProps> = ({
  sparklineData,
  sparklineColor,
  ...props
}) => {
  return (
    <div className="metric-card-with-sparkline">
      <MetricCard {...props} />
      {sparklineData && sparklineData.length > 1 && (
        <div className="metric-card-sparkline">
          <Sparkline data={sparklineData} color={sparklineColor} />
        </div>
      )}
    </div>
  );
};

export default MetricCard;
