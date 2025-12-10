// UI Component Library
// Based on Sales Intelligence Platform UI Design System
// Updated with Design Audit Components (December 2024)

export { Button } from './Button';
export type { ButtonProps } from './Button';

export { Input } from './Input';
export type { InputProps } from './Input';

export { Badge, StageBadge, IntentBadge } from './Badge';
export type { BadgeProps, BadgeVariant } from './Badge';

export { Card, CardHeader, CardTitle, CardContent, CardFooter } from './Card';
export type { CardProps, CardHeaderProps, CardTitleProps, CardContentProps, CardFooterProps } from './Card';

export { MetricCard, MetricCardWithSparkline, Sparkline } from './MetricCard';
export type { MetricCardProps, MetricCardWithSparklineProps, SparklineProps } from './MetricCard';

export { DataTable } from './DataTable';
export type { DataTableProps, Column } from './DataTable';

export {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarLogo,
  SidebarContent,
  SidebarGroup,
  SidebarItem,
  SidebarFooter,
  SidebarToggle,
  NavIcons,
  useSidebar,
} from './Sidebar';
export type { SidebarProps, SidebarProviderProps, SidebarItemProps } from './Sidebar';

export { Modal, ConfirmDialog } from './Modal';
export type { ModalProps, ConfirmDialogProps } from './Modal';

export { Tooltip, InfoTooltip } from './Tooltip';
export type { TooltipProps, InfoTooltipProps } from './Tooltip';

export { ProgressBar, CircularProgress, Spinner, Skeleton } from './Progress';
export type { ProgressBarProps, CircularProgressProps, SpinnerProps, SkeletonProps } from './Progress';

export { Select } from './Select';
export type { SelectProps, SelectOption } from './Select';

// ═══════════════════════════════════════════════════════════════════════
// NEW COMPONENTS FROM DESIGN AUDIT (December 2024)
// ═══════════════════════════════════════════════════════════════════════

// Score Indicator - Circular and linear progress indicators for scores
export { ScoreIndicator, LinearScoreIndicator, BANTScorecard } from './ScoreIndicator';
export type { ScoreIndicatorProps, LinearScoreIndicatorProps, LinearScoreItem, BANTScoreProps } from './ScoreIndicator';

// Signal Card - Display deal signals with type badges and confidence meters
export { SignalCard, SignalCardCompact } from './SignalCard';
export type { SignalCardProps, SignalCardCompactProps, SignalType } from './SignalCard';

// Risk Card - Display deal risks with severity levels and probability
export { RiskCard, RiskCardCompact, RiskSummary } from './RiskCard';
export type { RiskCardProps, RiskCardCompactProps, RiskSummaryProps, Severity } from './RiskCard';

// Persona Card - Display buyer personas with engagement and influence indicators
export { PersonaCard, PersonaCardExpanded, PersonaGrid } from './PersonaCard';
export type { PersonaCardProps, PersonaCardExpandedProps, PersonaGridProps, PersonaType, EngagementLevel } from './PersonaCard';

// Empty State - Consistent empty and error states
export { EmptyState, ErrorState, LoadingState } from './EmptyState';
export type { EmptyStateProps, EmptyStateType, ErrorStateProps, LoadingStateProps } from './EmptyState';
