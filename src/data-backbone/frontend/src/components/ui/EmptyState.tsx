import { ReactNode } from 'react';
import {
  Flame,
  Target,
  Users,
  ShieldCheck,
  BookOpen,
  Search,
  Bookmark,
  AlertTriangle,
  ChevronDown,
} from 'lucide-react';
import { Button } from './Button';

export type EmptyStateType =
  | 'signals'
  | 'deals'
  | 'personas'
  | 'risks'
  | 'knowledge'
  | 'search'
  | 'watchlist'
  | 'custom';

export interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  description?: string;
  icon?: ReactNode;
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  compact?: boolean;
  className?: string;
}

// Default content for each empty state type
const defaultContent: Record<EmptyStateType, { icon: typeof Flame; title: string; description: string }> = {
  signals: {
    icon: Flame,
    title: 'No signals detected',
    description: 'Adjust your filters or check back later for new deal opportunities.',
  },
  deals: {
    icon: Target,
    title: 'No deals in this stage',
    description: 'Deals will appear here as they move through your pipeline.',
  },
  personas: {
    icon: Users,
    title: 'No personas mapped',
    description: 'Add key stakeholders to track their engagement and influence.',
  },
  risks: {
    icon: ShieldCheck,
    title: 'No risks identified',
    description: 'Great news! No deal risks have been detected at this time.',
  },
  knowledge: {
    icon: BookOpen,
    title: 'Knowledge base is empty',
    description: 'Start adding learnings and patterns to build your knowledge base.',
  },
  search: {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search terms or filters to find what you\'re looking for.',
  },
  watchlist: {
    icon: Bookmark,
    title: 'Your watchlist is empty',
    description: 'Save signals and companies to track them in your watchlist.',
  },
  custom: {
    icon: Search,
    title: 'Nothing here yet',
    description: 'There\'s no data to display at the moment.',
  },
};

export function EmptyState({
  type = 'custom',
  title,
  description,
  icon,
  primaryAction,
  secondaryAction,
  compact = false,
  className = '',
}: EmptyStateProps) {
  const content = defaultContent[type];
  const IconComponent = content.icon;

  return (
    <div className={`empty-state ${compact ? 'empty-state-compact' : ''} ${className}`}>
      <div className="empty-state-icon">
        {icon || <IconComponent size={compact ? 32 : 48} />}
      </div>

      <h3 className="empty-state-title">{title || content.title}</h3>

      <p className="empty-state-description">{description || content.description}</p>

      {(primaryAction || secondaryAction) && (
        <div className="empty-state-actions">
          {primaryAction && (
            <Button variant="primary" size={compact ? 'sm' : 'md'} onClick={primaryAction.onClick}>
              {primaryAction.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" size={compact ? 'sm' : 'md'} onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Error State Component
export interface ErrorStateProps {
  title?: string;
  description?: string;
  errorCode?: string;
  onRetry?: () => void;
  onContactSupport?: () => void;
  showErrorCode?: boolean;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  description = 'We couldn\'t load the requested data. This might be a temporary issue — please try again.',
  errorCode,
  onRetry,
  onContactSupport,
  showErrorCode = false,
  className = '',
}: ErrorStateProps) {
  return (
    <div className={`error-state ${className}`}>
      <div className="error-state-header">
        <div className="error-state-icon">
          <AlertTriangle size={24} />
        </div>
        <h3 className="error-state-title">{title}</h3>
      </div>

      <p className="error-state-description">{description}</p>

      {(onRetry || onContactSupport) && (
        <div className="error-state-actions">
          {onRetry && (
            <Button variant="primary" size="sm" onClick={onRetry}>
              Try Again
            </Button>
          )}
          {onContactSupport && (
            <Button variant="ghost" size="sm" onClick={onContactSupport}>
              Contact Support
            </Button>
          )}
        </div>
      )}

      {errorCode && (
        <div className="error-state-code">
          <details>
            <summary className="error-state-code-toggle">
              <ChevronDown size={12} />
              Error details
            </summary>
            <div className="error-state-code-content">
              Error code: {errorCode}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

// Loading State Component (skeleton version of empty state)
export interface LoadingStateProps {
  lines?: number;
  compact?: boolean;
  className?: string;
}

export function LoadingState({ lines = 3, compact = false, className = '' }: LoadingStateProps) {
  const iconSize = compact ? 32 : 48;
  const lineHeight = compact ? 14 : 16;
  const spacing = compact ? 'var(--space-3)' : 'var(--space-4)';

  return (
    <div className={`empty-state ${compact ? 'empty-state-compact' : ''} ${className}`}>
      <div
        className="skeleton skeleton-circular"
        style={{ width: iconSize, height: iconSize, marginBottom: spacing }}
      />
      <div
        className="skeleton skeleton-text"
        style={{ width: '60%', height: compact ? 18 : 24, marginBottom: spacing }}
      />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="skeleton skeleton-text"
          style={{
            width: i === lines - 1 ? '40%' : '80%',
            height: lineHeight,
            marginBottom: i < lines - 1 ? 'var(--space-2)' : spacing,
          }}
        />
      ))}
      <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: spacing }}>
        <div
          className="skeleton skeleton-rectangular"
          style={{ width: 100, height: compact ? 32 : 40 }}
        />
        <div
          className="skeleton skeleton-rectangular"
          style={{ width: 80, height: compact ? 32 : 40 }}
        />
      </div>
    </div>
  );
}
