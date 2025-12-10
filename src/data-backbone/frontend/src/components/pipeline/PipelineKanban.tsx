import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './PipelineKanban.css';
import {
  DollarSign,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  ChevronRight,
  Phone,
  Mail,
  FileText,
  Search,
  Filter,
  MoreVertical,
  TrendingUp,
  Target,
  Users,
  Building2,
  Zap,
} from 'lucide-react';

// Types
interface MEDDPICCScore {
  metrics: number;
  economicBuyer: number;
  decisionCriteria: number;
  decisionProcess: number;
  paperProcess: number;
  identifyPain: number;
  champion: number;
  competition: number;
}

interface Deal {
  id: string;
  company: string;
  companyLogo?: string;
  category: string;
  value: number;
  stage: 'discovery' | 'qualify' | 'propose' | 'negotiate' | 'commit';
  closeDate: Date;
  probability: number;
  meddpicc: MEDDPICCScore;
  owner: string;
  lastActivity: string;
  lastActivityDate: Date;
  nextAction?: string;
  risks: string[];
  isStale?: boolean;
  atRisk?: boolean;
}

interface PipelineStage {
  id: string;
  name: string;
  deals: Deal[];
  totalValue: number;
  color: string;
}

// Demo data
const demoDeals: Deal[] = [
  {
    id: '1',
    company: 'Philips',
    category: 'Personal Care',
    value: 450000,
    stage: 'propose',
    closeDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    probability: 68,
    meddpicc: { metrics: 3, economicBuyer: 2, decisionCriteria: 2, decisionProcess: 2, paperProcess: 2, identifyPain: 3, champion: 2, competition: 2 },
    owner: 'You',
    lastActivity: 'Email sent',
    lastActivityDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    nextAction: 'Call Jan to address Thomas blocker',
    risks: ['Blocker not neutralized'],
  },
  {
    id: '2',
    company: 'Sony',
    category: 'Audio',
    value: 180000,
    stage: 'qualify',
    closeDate: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
    probability: 52,
    meddpicc: { metrics: 3, economicBuyer: 2, decisionCriteria: 1, decisionProcess: 2, paperProcess: 1, identifyPain: 2, champion: 2, competition: 2 },
    owner: 'You',
    lastActivity: 'Meeting held',
    lastActivityDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    nextAction: 'Meet with economic buyer',
    risks: ['Pain unclear'],
  },
  {
    id: '3',
    company: 'Tefal',
    category: 'Cookware',
    value: 120000,
    stage: 'negotiate',
    closeDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    probability: 85,
    meddpicc: { metrics: 3, economicBuyer: 3, decisionCriteria: 3, decisionProcess: 3, paperProcess: 2, identifyPain: 3, champion: 2, competition: 2 },
    owner: 'You',
    lastActivity: 'Proposal sent',
    lastActivityDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    nextAction: 'Send contract terms',
    risks: [],
  },
  {
    id: '4',
    company: 'Xiaomi',
    category: 'Smart Home',
    value: 100000,
    stage: 'commit',
    closeDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    probability: 92,
    meddpicc: { metrics: 3, economicBuyer: 3, decisionCriteria: 3, decisionProcess: 3, paperProcess: 3, identifyPain: 3, champion: 2, competition: 2 },
    owner: 'You',
    lastActivity: 'Contract review',
    lastActivityDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    nextAction: 'Get PO',
    risks: [],
  },
  {
    id: '5',
    company: 'Bosch',
    category: 'Home Appliances',
    value: 120000,
    stage: 'discovery',
    closeDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    probability: 25,
    meddpicc: { metrics: 2, economicBuyer: 1, decisionCriteria: 0, decisionProcess: 0, paperProcess: 0, identifyPain: 2, champion: 0, competition: 0 },
    owner: 'You',
    lastActivity: 'Initial call',
    lastActivityDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    nextAction: 'Schedule discovery call',
    risks: ['No champion identified'],
    isStale: true,
  },
  {
    id: '6',
    company: 'Samsung',
    category: 'Electronics',
    value: 200000,
    stage: 'discovery',
    closeDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    probability: 20,
    meddpicc: { metrics: 1, economicBuyer: 0, decisionCriteria: 0, decisionProcess: 0, paperProcess: 0, identifyPain: 1, champion: 0, competition: 0 },
    owner: 'You',
    lastActivity: 'Signal detected',
    lastActivityDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    nextAction: 'Initial outreach',
    risks: [],
  },
  {
    id: '7',
    company: 'LG',
    category: 'Displays',
    value: 150000,
    stage: 'qualify',
    closeDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    probability: 45,
    meddpicc: { metrics: 2, economicBuyer: 1, decisionCriteria: 2, decisionProcess: 1, paperProcess: 0, identifyPain: 2, champion: 1, competition: 1 },
    owner: 'You',
    lastActivity: 'Demo scheduled',
    lastActivityDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    nextAction: 'Research decision process',
    risks: ['Stuck in qualify'],
    isStale: true,
  },
  {
    id: '8',
    company: 'Dyson',
    category: 'Home Care',
    value: 120000,
    stage: 'negotiate',
    closeDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    probability: 78,
    meddpicc: { metrics: 3, economicBuyer: 2, decisionCriteria: 2, decisionProcess: 2, paperProcess: 2, identifyPain: 3, champion: 2, competition: 2 },
    owner: 'You',
    lastActivity: 'Terms discussion',
    lastActivityDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    nextAction: 'Prepare negotiation strategy',
    risks: [],
  },
];

// Helper functions
const getMEDDPICCTotal = (meddpicc: MEDDPICCScore): number => {
  return Object.values(meddpicc).reduce((sum, score) => sum + score, 0);
};

const getMEDDPICCLabel = (total: number): string => {
  if (total >= 20) return 'Strong';
  if (total >= 15) return 'Good';
  if (total >= 10) return 'Developing';
  if (total >= 5) return 'Weak';
  return 'Unqualified';
};

const getMEDDPICCColor = (total: number): string => {
  if (total >= 20) return 'var(--color-success)';
  if (total >= 15) return 'var(--color-success-600)';
  if (total >= 10) return 'var(--color-warning)';
  if (total >= 5) return 'var(--color-warning-600)';
  return 'var(--color-danger)';
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-EU', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const getDaysUntilClose = (closeDate: Date): number => {
  const now = new Date();
  const diff = closeDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Deal Card Component
const DealCard: React.FC<{ deal: Deal; onSelect: (deal: Deal) => void }> = ({ deal, onSelect }) => {
  const meddpicTotal = getMEDDPICCTotal(deal.meddpicc);
  const daysUntilClose = getDaysUntilClose(deal.closeDate);

  const cardClass = deal.atRisk
    ? 'deal-card at-risk'
    : deal.isStale
    ? 'deal-card stale'
    : meddpicTotal >= 20
    ? 'deal-card on-track'
    : 'deal-card';

  return (
    <div className={cardClass} onClick={() => onSelect(deal)}>
      <div className="deal-card-header">
        <div className="deal-company">
          <div className="company-avatar">
            {deal.company.charAt(0)}
          </div>
          <div className="company-info">
            <span className="company-name">{deal.company}</span>
            <span className="company-category">{deal.category}</span>
          </div>
        </div>
        <div className="deal-close-date">
          <Calendar size={12} />
          <span>{formatDate(deal.closeDate)}</span>
        </div>
      </div>

      <div className="deal-value">
        <span className="value">{formatCurrency(deal.value)}</span>
        <span className="probability">{deal.probability}% prob</span>
      </div>

      <div className="deal-meddpicc">
        <div className="meddpicc-label">
          MEDDPICC: <span style={{ color: getMEDDPICCColor(meddpicTotal) }}>{meddpicTotal}/24</span>
        </div>
        <div className="meddpicc-dots">
          {Object.entries(deal.meddpicc).map(([key, value], idx) => (
            <div
              key={key}
              className={`meddpicc-dot score-${value}`}
              title={`${key}: ${value}/3`}
            />
          ))}
        </div>
      </div>

      {deal.risks.length > 0 && (
        <div className="deal-risk">
          <AlertTriangle size={12} />
          <span>{deal.risks[0]}</span>
        </div>
      )}

      {deal.nextAction && (
        <div className="deal-next-action">
          <span className="action-label">Next:</span>
          <span className="action-text">{deal.nextAction}</span>
          <button className="action-btn">
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      <div className="deal-footer">
        <span className="last-activity">
          <Clock size={12} />
          {deal.lastActivity}
        </span>
        <span className="deal-owner">
          <User size={12} />
          {deal.owner}
        </span>
      </div>
    </div>
  );
};

// Main Pipeline Kanban Component
export const PipelineKanban: React.FC = () => {
  const { t } = useTranslation(['common', 'deals']);
  const [deals] = useState<Deal[]>(demoDeals);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [viewMode, setViewMode] = useState<'kanban' | 'list' | 'forecast'>('kanban');

  const stages: { id: Deal['stage']; name: string; color: string }[] = [
    { id: 'discovery', name: 'Discovery', color: 'var(--color-gray-500)' },
    { id: 'qualify', name: 'Qualify', color: 'var(--color-info)' },
    { id: 'propose', name: 'Propose', color: 'var(--color-primary)' },
    { id: 'negotiate', name: 'Negotiate', color: 'var(--color-warning)' },
    { id: 'commit', name: 'Commit', color: 'var(--color-success)' },
  ];

  const getStageDeals = (stageId: Deal['stage']) => deals.filter(d => d.stage === stageId);
  const getStageValue = (stageId: Deal['stage']) => getStageDeals(stageId).reduce((sum, d) => sum + d.value, 0);

  const totalPipeline = deals.reduce((sum, d) => sum + d.value, 0);
  const weightedPipeline = deals.reduce((sum, d) => sum + (d.value * d.probability / 100), 0);
  const avgMeddpicc = Math.round(deals.reduce((sum, d) => sum + getMEDDPICCTotal(d.meddpicc), 0) / deals.length);

  return (
    <div className="pipeline-kanban">
      {/* Header */}
      <div className="pipeline-header">
        <div className="pipeline-title">
          <h1>Pipeline</h1>
          <span className="pipeline-subtitle">MEDDPICC-Driven Deal Management</span>
        </div>

        <div className="pipeline-summary">
          <div className="summary-stat">
            <span className="stat-value">{formatCurrency(totalPipeline)}</span>
            <span className="stat-label">Total Pipeline</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value">{formatCurrency(weightedPipeline)}</span>
            <span className="stat-label">Weighted</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value">{avgMeddpicc}/24</span>
            <span className="stat-label">Avg MEDDPICC</span>
          </div>
          <div className="summary-stat">
            <span className="stat-value">{deals.length}</span>
            <span className="stat-label">Active Deals</span>
          </div>
        </div>

        <div className="pipeline-actions">
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'kanban' ? 'active' : ''}`}
              onClick={() => setViewMode('kanban')}
            >
              Kanban
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              List
            </button>
            <button
              className={`view-btn ${viewMode === 'forecast' ? 'active' : ''}`}
              onClick={() => setViewMode('forecast')}
            >
              Forecast
            </button>
          </div>
          <button className="btn-primary">
            <Zap size={16} />
            Add Deal
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {stages.map(stage => (
          <div key={stage.id} className="kanban-column">
            <div className="column-header" style={{ borderTopColor: stage.color }}>
              <div className="column-title">
                <span className="stage-name">{stage.name}</span>
                <span className="stage-count">{getStageDeals(stage.id).length}</span>
              </div>
              <div className="column-value">{formatCurrency(getStageValue(stage.id))}</div>
            </div>
            <div className="column-content">
              {getStageDeals(stage.id).map(deal => (
                <DealCard
                  key={deal.id}
                  deal={deal}
                  onSelect={setSelectedDeal}
                />
              ))}
              {stage.id === 'discovery' && (
                <button className="add-deal-btn">
                  + Add Deal
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Next Best Actions Panel */}
      <div className="nba-panel">
        <div className="nba-header">
          <h3>
            <Target size={18} />
            Next Best Actions
          </h3>
          <span className="nba-subtitle">AI-prioritized actions to move your pipeline</span>
        </div>
        <div className="nba-list">
          {deals
            .filter(d => d.nextAction)
            .sort((a, b) => b.value - a.value)
            .slice(0, 3)
            .map((deal, idx) => (
              <div key={deal.id} className="nba-item">
                <div className="nba-priority">{idx + 1}</div>
                <div className="nba-content">
                  <div className="nba-company">{deal.company} - {formatCurrency(deal.value)}</div>
                  <div className="nba-action">{deal.nextAction}</div>
                  {deal.risks.length > 0 && (
                    <div className="nba-why">Why: {deal.risks[0]}</div>
                  )}
                </div>
                <div className="nba-actions">
                  <button className="nba-btn" title="Call">
                    <Phone size={14} />
                  </button>
                  <button className="nba-btn" title="Email">
                    <Mail size={14} />
                  </button>
                  <button className="nba-btn primary" title="Do It">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Legend */}
      <div className="pipeline-legend">
        <div className="legend-item">
          <div className="legend-dot on-track"></div>
          <span>On Track (MEDDPICC 20+)</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot at-risk"></div>
          <span>At Risk</span>
        </div>
        <div className="legend-item">
          <div className="legend-dot stale"></div>
          <span>Stale (7+ days inactive)</span>
        </div>
        <div className="legend-item meddpicc-legend">
          <span>MEDDPICC:</span>
          <div className="meddpicc-dots">
            <div className="meddpicc-dot score-3" title="Score 3"></div>
            <div className="meddpicc-dot score-2" title="Score 2"></div>
            <div className="meddpicc-dot score-1" title="Score 1"></div>
            <div className="meddpicc-dot score-0" title="Score 0"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PipelineKanban;
