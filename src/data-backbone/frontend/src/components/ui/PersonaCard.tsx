import { Wallet, Settings, User, Star, ShieldX, DoorOpen, Check, AlertTriangle, HelpCircle } from 'lucide-react';
import { Button } from './Button';

export type PersonaType = 'economic-buyer' | 'technical-buyer' | 'user-buyer' | 'champion' | 'blocker' | 'gatekeeper';
export type EngagementLevel = 'engaged' | 'cautious' | 'blocking' | 'unknown';

export interface PersonaCardProps {
  name: string;
  title: string;
  company?: string;
  personaType: PersonaType;
  engagement: EngagementLevel;
  influence: number; // 1-5
  canApprove?: boolean;
  lastContact?: string;
  avatar?: string;
  className?: string;
  onClick?: () => void;
}

export interface PersonaCardExpandedProps extends PersonaCardProps {
  motivations?: string[];
  concerns?: string[];
  signals?: { text: string; positive: boolean }[];
  responseTime?: string;
  onViewProfile?: () => void;
  onLogInteraction?: () => void;
  onScheduleCall?: () => void;
}

// Persona type configuration
const personaConfig: Record<PersonaType, { icon: typeof Wallet; label: string; emoji: string }> = {
  'economic-buyer': { icon: Wallet, label: 'Economic Buyer', emoji: '💰' },
  'technical-buyer': { icon: Settings, label: 'Technical Buyer', emoji: '⚙️' },
  'user-buyer': { icon: User, label: 'User Buyer', emoji: '👤' },
  champion: { icon: Star, label: 'Champion', emoji: '⭐' },
  blocker: { icon: ShieldX, label: 'Blocker', emoji: '🚫' },
  gatekeeper: { icon: DoorOpen, label: 'Gatekeeper', emoji: '🚪' },
};

// Engagement configuration
const engagementConfig: Record<EngagementLevel, { icon: typeof Check; label: string }> = {
  engaged: { icon: Check, label: 'Engaged' },
  cautious: { icon: AlertTriangle, label: 'Cautious' },
  blocking: { icon: ShieldX, label: 'Blocking' },
  unknown: { icon: HelpCircle, label: 'Unknown' },
};

// Helper to get initials from name
const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// Compact Persona Card (for list views)
export function PersonaCard({
  name,
  title,
  company,
  personaType,
  engagement,
  influence,
  lastContact,
  avatar,
  className = '',
  onClick,
}: PersonaCardProps) {
  const persona = personaConfig[personaType];
  const engagementInfo = engagementConfig[engagement];
  const EngagementIcon = engagementInfo.icon;

  return (
    <div
      className={`persona-card persona-card-compact ${className}`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <div className="persona-card-avatar">
        {avatar ? (
          <img src={avatar} alt={name} />
        ) : (
          <span className="persona-card-avatar-initials">{getInitials(name)}</span>
        )}
      </div>

      <div className="persona-card-info">
        <h4 className="persona-card-name">{name}</h4>
        <p className="persona-card-title">
          {title}
          {company && `, ${company}`}
        </p>
        {lastContact && (
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
            Last contact: {lastContact}
          </span>
        )}
      </div>

      <div className="persona-card-meta-compact">
        <span className={`persona-type-badge persona-type-${personaType}`}>
          {persona.emoji} {persona.label.split(' ')[0]}
        </span>

        <div className="persona-influence">
          <div className="persona-influence-dots">
            {[1, 2, 3, 4, 5].map((level) => (
              <span
                key={level}
                className={`persona-influence-dot ${level <= influence ? 'active' : ''}`}
              />
            ))}
          </div>
          <span className="persona-influence-label">Influence</span>
        </div>

        <span className={`persona-engagement persona-engagement-${engagement}`}>
          <EngagementIcon size={12} />
          {engagementInfo.label}
        </span>
      </div>
    </div>
  );
}

// Expanded Persona Card (for detail views)
export function PersonaCardExpanded({
  name,
  title,
  company,
  personaType,
  engagement,
  influence,
  canApprove,
  avatar,
  motivations = [],
  concerns = [],
  signals = [],
  responseTime,
  className = '',
  onViewProfile,
  onLogInteraction,
  onScheduleCall,
}: PersonaCardExpandedProps) {
  const persona = personaConfig[personaType];
  const engagementInfo = engagementConfig[engagement];
  const EngagementIcon = engagementInfo.icon;

  return (
    <div className={`persona-card persona-card-expanded ${className}`}>
      <div className="persona-card-expanded-header">
        <div className="persona-card-avatar persona-card-avatar-lg">
          {avatar ? (
            <img src={avatar} alt={name} />
          ) : (
            <span className="persona-card-avatar-initials">{getInitials(name)}</span>
          )}
        </div>

        <div className="persona-card-header-info">
          <h3 className="persona-card-name-lg">{name}</h3>
          <p className="persona-card-role">
            {title}
            {company && `, ${company}`}
          </p>
          <span className={`persona-type-badge persona-type-${personaType}`}>
            {persona.emoji} {persona.label}
          </span>
        </div>
      </div>

      <div className="persona-card-stats">
        <div className="persona-card-stat">
          <span className="persona-card-stat-label">Engagement</span>
          <span className="persona-card-stat-value">
            <span className={`persona-engagement persona-engagement-${engagement}`}>
              <EngagementIcon size={14} />
              {engagementInfo.label}
            </span>
          </span>
          {responseTime && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-1)' }}>
              {responseTime} resp
            </span>
          )}
        </div>

        <div className="persona-card-stat">
          <span className="persona-card-stat-label">Influence</span>
          <span className="persona-card-stat-value">
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{influence * 20}/100</span>
          </span>
          <div className="persona-influence-dots" style={{ marginTop: 'var(--space-1)', justifyContent: 'center' }}>
            {[1, 2, 3, 4, 5].map((level) => (
              <span
                key={level}
                className={`persona-influence-dot ${level <= influence ? 'active' : ''}`}
              />
            ))}
          </div>
        </div>

        <div className="persona-card-stat">
          <span className="persona-card-stat-label">Can Approve</span>
          <span className="persona-card-stat-value">{canApprove ? 'Yes' : 'No'}</span>
        </div>
      </div>

      {motivations.length > 0 && (
        <div className="persona-card-section">
          <h5 className="persona-card-section-title">Motivations</h5>
          <ul className="persona-card-list">
            {motivations.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {concerns.length > 0 && (
        <div className="persona-card-section">
          <h5 className="persona-card-section-title">Concerns</h5>
          <ul className="persona-card-list">
            {concerns.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      {signals.length > 0 && (
        <div className="persona-card-section">
          <h5 className="persona-card-section-title">Intent Signals</h5>
          <div className="persona-card-signals">
            {signals.map((signal, index) => (
              <span
                key={index}
                className={`persona-signal ${signal.positive ? 'persona-signal-positive' : 'persona-signal-negative'}`}
              >
                {signal.positive ? <Check size={12} /> : <AlertTriangle size={12} />}
                {signal.text}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="persona-card-expanded-footer">
        {onViewProfile && (
          <Button variant="secondary" size="sm" onClick={onViewProfile}>
            View Full Profile
          </Button>
        )}
        {onLogInteraction && (
          <Button variant="ghost" size="sm" onClick={onLogInteraction}>
            Log Interaction
          </Button>
        )}
        {onScheduleCall && (
          <Button variant="ghost" size="sm" onClick={onScheduleCall}>
            Schedule Call
          </Button>
        )}
      </div>
    </div>
  );
}

// Persona Grid for displaying multiple personas
export interface PersonaGridProps {
  personas: PersonaCardProps[];
  onPersonaClick?: (persona: PersonaCardProps) => void;
  className?: string;
}

export function PersonaGrid({ personas, onPersonaClick, className = '' }: PersonaGridProps) {
  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: 'var(--space-3)',
      }}
    >
      {personas.map((persona, index) => (
        <PersonaCard
          key={index}
          {...persona}
          onClick={() => onPersonaClick?.(persona)}
        />
      ))}
    </div>
  );
}
