// ============================================================================
// BOWTIE CRM UTILITY FUNCTIONS
// ============================================================================

import type { StageCode, VelocityStatus, BowtieSide } from '../types/bowtie';
import { VELOCITY_THRESHOLDS, getStageConfig } from '../constants/bowtie';

// ============================================================================
// VELOCITY CALCULATIONS
// ============================================================================

export const calculateVelocityStatus = (
  stage: StageCode,
  daysInStage: number
): VelocityStatus => {
  const thresholds = VELOCITY_THRESHOLDS[stage];

  if (daysInStage <= thresholds.fast) return 'fast';
  if (daysInStage <= thresholds.slow) return 'on-track';
  if (daysInStage <= thresholds.stalled) return 'slow';
  return 'stalled';
};

export const getVelocityColor = (status: VelocityStatus): string => {
  switch (status) {
    case 'fast':
      return '#10B981'; // green
    case 'on-track':
      return '#3B82F6'; // blue
    case 'slow':
      return '#F59E0B'; // amber
    case 'stalled':
      return '#EF4444'; // red
  }
};

export const getVelocityLabel = (status: VelocityStatus): string => {
  switch (status) {
    case 'fast':
      return 'Fast';
    case 'on-track':
      return 'On Track';
    case 'slow':
      return 'Slow';
    case 'stalled':
      return 'Stalled';
  }
};

// ============================================================================
// HEALTH SCORE HELPERS
// ============================================================================

export const getHealthLabel = (score: number): string => {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'At Risk';
  return 'Critical';
};

export const getHealthColor = (score: number): string => {
  if (score >= 80) return '#10B981'; // green
  if (score >= 60) return '#3B82F6'; // blue
  if (score >= 40) return '#F59E0B'; // amber
  return '#EF4444'; // red
};

// ============================================================================
// FORMATTERS
// ============================================================================

export const formatCurrency = (
  value: number,
  currency: string = 'EUR',
  locale: string = 'en-EU'
): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(0)}K`;
  }
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatNumber = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
};

export const formatPercentage = (value: number, decimals: number = 0): string => {
  return `${value.toFixed(decimals)}%`;
};

export const formatDays = (days: number): string => {
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? '1 week' : `${weeks} weeks`;
  }
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month' : `${months} months`;
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(date));
};

export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
};

// ============================================================================
// STAGE HELPERS
// ============================================================================

export const isAcquisitionStage = (stage: StageCode): boolean => {
  const config = getStageConfig(stage);
  return config.side === 'left';
};

export const isExpansionStage = (stage: StageCode): boolean => {
  const config = getStageConfig(stage);
  return config.side === 'right';
};

export const isCommitmentStage = (stage: StageCode): boolean => {
  return stage === 'VM5';
};

export const getNextStage = (stage: StageCode): StageCode | null => {
  const order: StageCode[] = ['VM1', 'VM2', 'VM3', 'VM4', 'VM5', 'VM6', 'VM7', 'VM8'];
  const index = order.indexOf(stage);
  if (index === -1 || index === order.length - 1) return null;
  return order[index + 1];
};

export const getPreviousStage = (stage: StageCode): StageCode | null => {
  const order: StageCode[] = ['VM1', 'VM2', 'VM3', 'VM4', 'VM5', 'VM6', 'VM7', 'VM8'];
  const index = order.indexOf(stage);
  if (index <= 0) return null;
  return order[index - 1];
};

export const canMoveToStage = (from: StageCode, to: StageCode): boolean => {
  const order: StageCode[] = ['VM1', 'VM2', 'VM3', 'VM4', 'VM5', 'VM6', 'VM7', 'VM8'];
  const fromIndex = order.indexOf(from);
  const toIndex = order.indexOf(to);

  // Can only move one step at a time (forward or backward)
  return Math.abs(toIndex - fromIndex) === 1;
};

// ============================================================================
// SCORE HELPERS
// ============================================================================

export const getIntentScoreLabel = (score: number): string => {
  if (score >= 80) return 'High Intent';
  if (score >= 60) return 'Medium Intent';
  if (score >= 40) return 'Low Intent';
  return 'No Intent';
};

export const getScoreBarWidth = (score: number, max: number = 100): string => {
  return `${(score / max) * 100}%`;
};

// ============================================================================
// BOWTIE SHAPE CALCULATIONS
// ============================================================================

export const calculateBowtieShapePoints = (
  width: number,
  height: number,
  side: BowtieSide
): string => {
  const centerY = height / 2;
  const knotWidth = width * 0.15;
  const wingWidth = (width - knotWidth) / 2;

  if (side === 'left') {
    // Left triangle (wide left, narrow right)
    return `
      0,${centerY * 0.3}
      ${wingWidth},${centerY}
      0,${height - centerY * 0.3}
    `;
  } else if (side === 'right') {
    // Right triangle (narrow left, wide right)
    const startX = width - wingWidth;
    return `
      ${startX},${centerY}
      ${width},${centerY * 0.3}
      ${width},${height - centerY * 0.3}
    `;
  } else {
    // Center knot (diamond shape)
    const startX = wingWidth;
    const endX = width - wingWidth;
    return `
      ${startX},${centerY}
      ${(startX + endX) / 2},${centerY * 0.5}
      ${endX},${centerY}
      ${(startX + endX) / 2},${height - centerY * 0.5}
    `;
  }
};

// ============================================================================
// AGGREGATION HELPERS
// ============================================================================

export const calculateConversionRate = (
  fromCount: number,
  toCount: number
): number => {
  if (fromCount === 0) return 0;
  return (toCount / fromCount) * 100;
};

export const aggregateByMotion = <T extends { motion_type: string }>(
  items: T[]
): { direct: T[]; indirect: T[]; hybrid: T[] } => {
  return {
    direct: items.filter((i) => i.motion_type === 'direct'),
    indirect: items.filter((i) => i.motion_type === 'indirect'),
    hybrid: items.filter((i) => i.motion_type === 'hybrid'),
  };
};

export const aggregateByStage = <T extends { current_stage: StageCode }>(
  items: T[]
): Record<StageCode, T[]> => {
  const result: Record<StageCode, T[]> = {
    VM1: [],
    VM2: [],
    VM3: [],
    VM4: [],
    VM5: [],
    VM6: [],
    VM7: [],
    VM8: [],
  };

  items.forEach((item) => {
    result[item.current_stage].push(item);
  });

  return result;
};
