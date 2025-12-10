import React from 'react';

export type BadgeVariant =
  | 'blue' | 'green' | 'amber' | 'red' | 'gray'
  | 'stage-lead' | 'stage-mql' | 'stage-sql' | 'stage-sal'
  | 'stage-commit' | 'stage-activated' | 'stage-recurring' | 'stage-maximum';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  dot?: boolean;
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gray',
  dot = false,
  pulse = false,
  className = '',
}) => {
  const variantClass = `badge-${variant}`;
  const dotClass = dot ? 'badge-dot' : '';
  const pulseClass = pulse ? 'badge-pulse' : '';

  return (
    <span className={`badge ${variantClass} ${dotClass} ${pulseClass} ${className}`.trim()}>
      {children}
    </span>
  );
};

// Stage badge helper
export const StageBadge: React.FC<{ stage: string; className?: string }> = ({ stage, className }) => {
  const stageMap: Record<string, BadgeVariant> = {
    VM1: 'stage-lead',
    VM2: 'stage-mql',
    VM3: 'stage-sql',
    VM4: 'stage-sal',
    VM5: 'stage-commit',
    VM6: 'stage-activated',
    VM7: 'stage-recurring',
    VM8: 'stage-maximum',
    LEAD: 'stage-lead',
    MQL: 'stage-mql',
    SQL: 'stage-sql',
    SAL: 'stage-sal',
    COMMIT: 'stage-commit',
    ACTIVATED: 'stage-activated',
    RECURRING: 'stage-recurring',
    MAXIMUM: 'stage-maximum',
  };

  const variant = stageMap[stage.toUpperCase()] || 'gray';
  const label = stage.toUpperCase();

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  );
};

// Intent badge helper
export const IntentBadge: React.FC<{ score: number; className?: string }> = ({ score, className }) => {
  let variant: BadgeVariant;
  let label: string;

  if (score >= 80) {
    variant = 'red';
    label = 'Hot';
  } else if (score >= 60) {
    variant = 'amber';
    label = 'Warm';
  } else if (score >= 40) {
    variant = 'blue';
    label = 'Engaged';
  } else if (score >= 20) {
    variant = 'gray';
    label = 'Aware';
  } else {
    variant = 'gray';
    label = 'Cold';
  }

  return (
    <Badge variant={variant} dot className={className}>
      {label}
    </Badge>
  );
};

export default Badge;
