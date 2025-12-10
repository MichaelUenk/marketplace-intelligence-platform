import { ReactNode } from 'react';
import { Flame, Star, TrendingUp, Handshake, Bookmark, ExternalLink, MessageSquare } from 'lucide-react';
import { Button } from './Button';

export type SignalType = 'hot' | 'strategic' | 'market' | 'relationship';

export interface SignalCardProps {
  company: string;
  type: SignalType;
  signalType: string;
  description: string;
  tags?: string[];
  confidence: number;
  time: string;
  logo?: string;
  onViewDetails?: () => void;
  onContact?: () => void;
  onSave?: () => void;
  className?: string;
}

// Signal type configuration
const signalConfig: Record<SignalType, { icon: typeof Flame; label: string }> = {
  hot: { icon: Flame, label: 'Hot' },
  strategic: { icon: Star, label: 'Strategic' },
  market: { icon: TrendingUp, label: 'Market' },
  relationship: { icon: Handshake, label: 'Relationship' },
};

// Confidence level helpers
const getConfidenceLevel = (confidence: number): 'very-high' | 'high' | 'medium' | 'low' => {
  if (confidence >= 90) return 'very-high';
  if (confidence >= 75) return 'high';
  if (confidence >= 60) return 'medium';
  return 'low';
};

const getConfidenceLabel = (confidence: number): string => {
  if (confidence >= 90) return 'Very High';
  if (confidence >= 75) return 'High';
  if (confidence >= 60) return 'Medium';
  return 'Low';
};

export function SignalCard({
  company,
  type,
  signalType,
  description,
  tags = [],
  confidence,
  time,
  logo,
  onViewDetails,
  onContact,
  onSave,
  className = '',
}: SignalCardProps) {
  const config = signalConfig[type];
  const Icon = config.icon;
  const confidenceLevel = getConfidenceLevel(confidence);

  return (
    <div className={`signal-card-v2 ${className}`}>
      <div className="signal-card-header">
        <div className="signal-card-logo">
          {logo ? (
            <img src={logo} alt={company} />
          ) : (
            <span>{company.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="signal-card-title-area">
          <h3 className="signal-card-company">{company}</h3>
          <p className="signal-card-type">{signalType}</p>
        </div>
        <div className="signal-card-badge">
          <span className={`signal-badge signal-badge-${type}`}>
            <Icon size={12} />
            {config.label}
          </span>
        </div>
      </div>

      <p className="signal-card-body">{description}</p>

      {tags.length > 0 && (
        <div className="signal-card-meta">
          {tags.map((tag, index) => (
            <span key={index} className="signal-card-tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className={`confidence-meter confidence-meter-${confidenceLevel}`} style={{ marginBottom: 'var(--space-4)' }}>
        <span className="confidence-meter-label">Confidence</span>
        <div className="confidence-meter-bar">
          <div className="confidence-meter-fill" style={{ width: `${confidence}%` }} />
        </div>
        <span className="confidence-meter-value">{confidence}%</span>
      </div>

      <div className="signal-card-footer">
        <div className="signal-card-actions">
          {onViewDetails && (
            <Button variant="ghost" size="sm" onClick={onViewDetails}>
              <ExternalLink size={14} />
              View Details
            </Button>
          )}
          {onContact && (
            <Button variant="ghost" size="sm" onClick={onContact}>
              <MessageSquare size={14} />
              Contact
            </Button>
          )}
          {onSave && (
            <Button variant="ghost" size="sm" onClick={onSave}>
              <Bookmark size={14} />
              Save
            </Button>
          )}
        </div>
        <span className="signal-card-time">{time}</span>
      </div>
    </div>
  );
}

// Compact version for list views
export interface SignalCardCompactProps {
  company: string;
  type: SignalType;
  signalType: string;
  confidence: number;
  time: string;
  onClick?: () => void;
  className?: string;
}

export function SignalCardCompact({
  company,
  type,
  signalType,
  confidence,
  time,
  onClick,
  className = '',
}: SignalCardCompactProps) {
  const config = signalConfig[type];
  const Icon = config.icon;
  const confidenceLevel = getConfidenceLevel(confidence);

  return (
    <div
      className={`signal-card-v2 ${className}`}
      style={{ cursor: onClick ? 'pointer' : 'default', padding: 'var(--space-3)' }}
      onClick={onClick}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <span className={`signal-badge signal-badge-${type}`} style={{ padding: 'var(--space-1)' }}>
          <Icon size={14} />
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <span style={{ fontWeight: 'var(--weight-medium)', color: 'var(--text-primary)' }}>
              {company}
            </span>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
              {signalType}
            </span>
          </div>
        </div>
        <div className={`confidence-meter confidence-meter-${confidenceLevel}`}>
          <div className="confidence-meter-bar" style={{ width: 40 }}>
            <div className="confidence-meter-fill" style={{ width: `${confidence}%` }} />
          </div>
          <span className="confidence-meter-value">{confidence}%</span>
        </div>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{time}</span>
      </div>
    </div>
  );
}
