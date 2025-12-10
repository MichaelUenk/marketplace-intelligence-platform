import { AlertOctagon, AlertTriangle, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { Button } from './Button';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'mitigated';

export interface RiskCardProps {
  title: string;
  description: string;
  severity: Severity;
  probability?: number;
  impact?: string;
  evidence?: string[];
  updatedAt?: string;
  onAddressRisk?: () => void;
  onAccept?: () => void;
  onChallenge?: () => void;
  className?: string;
}

// Severity configuration
const severityConfig: Record<Severity, { icon: typeof AlertOctagon; label: string }> = {
  critical: { icon: AlertOctagon, label: 'Critical' },
  high: { icon: AlertTriangle, label: 'High' },
  medium: { icon: AlertCircle, label: 'Medium' },
  low: { icon: Info, label: 'Low' },
  mitigated: { icon: CheckCircle, label: 'Mitigated' },
};

export function RiskCard({
  title,
  description,
  severity,
  probability,
  impact,
  evidence = [],
  updatedAt,
  onAddressRisk,
  onAccept,
  onChallenge,
  className = '',
}: RiskCardProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div className={`risk-card risk-card-${severity} ${className}`}>
      <div className="risk-card-header">
        <div className="risk-card-icon">
          <Icon size={18} />
        </div>
        <div className="risk-card-title-area">
          <h4 className="risk-card-title">{title}</h4>
          <p className="risk-card-description">{description}</p>
        </div>
        <div className="risk-card-severity-badge">
          <span className={`severity-badge severity-badge-${severity}`}>
            {config.label}
          </span>
        </div>
      </div>

      {(probability !== undefined || impact) && (
        <div className="risk-card-metrics">
          {probability !== undefined && (
            <div className="risk-card-metric">
              <span className="risk-card-metric-label">Probability</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span className="risk-card-metric-value">{probability}%</span>
                <div className="risk-card-probability-bar">
                  <div
                    className="risk-card-probability-fill"
                    style={{ width: `${probability}%` }}
                  />
                </div>
              </div>
            </div>
          )}
          {impact && (
            <div className="risk-card-metric">
              <span className="risk-card-metric-label">Impact</span>
              <span className="risk-card-metric-value">{impact}</span>
            </div>
          )}
        </div>
      )}

      {evidence.length > 0 && (
        <div className="risk-card-evidence">
          <h5 className="risk-card-evidence-title">Counter-evidence needed:</h5>
          <ul className="risk-card-evidence-list">
            {evidence.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="risk-card-footer">
        <div className="risk-card-actions">
          {onAddressRisk && (
            <Button variant="primary" size="sm" onClick={onAddressRisk}>
              Address Risk
            </Button>
          )}
          {onAccept && (
            <Button variant="ghost" size="sm" onClick={onAccept}>
              Accept
            </Button>
          )}
          {onChallenge && (
            <Button variant="ghost" size="sm" onClick={onChallenge}>
              Challenge
            </Button>
          )}
        </div>
        {updatedAt && (
          <span className="risk-card-updated">Updated: {updatedAt}</span>
        )}
      </div>
    </div>
  );
}

// Compact version for list views
export interface RiskCardCompactProps {
  title: string;
  severity: Severity;
  probability?: number;
  onClick?: () => void;
  className?: string;
}

export function RiskCardCompact({
  title,
  severity,
  probability,
  onClick,
  className = '',
}: RiskCardCompactProps) {
  const config = severityConfig[severity];
  const Icon = config.icon;

  return (
    <div
      className={`risk-card risk-card-${severity} ${className}`}
      style={{ cursor: onClick ? 'pointer' : 'default', padding: 'var(--space-3)' }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div className="risk-card-icon" style={{ width: 28, height: 28 }}>
          <Icon size={14} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>
            {title}
          </span>
        </div>
        {probability !== undefined && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <div className="risk-card-probability-bar" style={{ width: 60 }}>
              <div
                className="risk-card-probability-fill"
                style={{ width: `${probability}%` }}
              />
            </div>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums' }}>
              {probability}%
            </span>
          </div>
        )}
        <span className={`severity-badge severity-badge-${severity}`} style={{ fontSize: '10px', padding: '2px 6px' }}>
          {config.label}
        </span>
      </div>
    </div>
  );
}

// Risk summary component for dashboards
export interface RiskSummaryProps {
  critical: number;
  high: number;
  medium: number;
  low: number;
  mitigated: number;
  className?: string;
}

export function RiskSummary({ critical, high, medium, low, mitigated, className = '' }: RiskSummaryProps) {
  const total = critical + high + medium + low;

  return (
    <div className={className} style={{ display: 'flex', gap: 'var(--space-4)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <span className="severity-badge severity-badge-critical">{critical}</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Critical</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <span className="severity-badge severity-badge-high">{high}</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>High</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <span className="severity-badge severity-badge-medium">{medium}</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Medium</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <span className="severity-badge severity-badge-low">{low}</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Low</span>
      </div>
      {mitigated > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span className="severity-badge severity-badge-mitigated">{mitigated}</span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Mitigated</span>
        </div>
      )}
    </div>
  );
}
