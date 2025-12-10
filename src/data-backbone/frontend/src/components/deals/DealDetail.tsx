import React from 'react';
import {
  ArrowLeft,
  Edit2,
  MoreHorizontal,
  Building2,
  MapPin,
  Users,
  Star,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';

// MEDDPICC Categories
const MEDDPICC_CATEGORIES = [
  { key: 'M', label: 'Metrics', description: 'Quantifiable business outcomes' },
  { key: 'E', label: 'Economic Buyer', description: 'Person with budget authority' },
  { key: 'D1', label: 'Decision Criteria', description: 'How they will decide' },
  { key: 'D2', label: 'Decision Process', description: 'Steps to make decision' },
  { key: 'P1', label: 'Paper Process', description: 'Legal/procurement process' },
  { key: 'I', label: 'Identify Pain', description: 'Business problem to solve' },
  { key: 'C', label: 'Champion', description: 'Internal advocate' },
  { key: 'C2', label: 'Competition', description: 'Competitive landscape' },
];

interface Contact {
  id: string;
  name: string;
  title: string;
  role: 'Champion' | 'Economic Buyer' | 'Evaluator' | 'Influencer' | 'Blocker';
  engagementScore: number;
  email?: string;
}

interface DealData {
  id: string;
  companyName: string;
  industry: string;
  location: string;
  employees: string;
  dealValue: number;
  stage: string;
  stageProgress: number;
  meddpicc: Record<string, number>;
  meddpiccTotal: number;
  contacts: Contact[];
  timeline: {
    stage: string;
    date: string;
    completed: boolean;
  }[];
  closeDate: string;
  daysInStage: number;
  healthScore: number;
}

interface DealDetailProps {
  deal?: DealData;
  onBack: () => void;
}

// Mock data for demonstration
const mockDeal: DealData = {
  id: 'deal-1',
  companyName: 'ACME Corporation',
  industry: 'Technology',
  location: 'Amsterdam',
  employees: '500-1000',
  dealValue: 45000,
  stage: 'SAL',
  stageProgress: 60,
  meddpicc: {
    M: 8,
    E: 9,
    D1: 7,
    D2: 6,
    P1: 5,
    I: 9,
    C: 10,
    C2: 10,
  },
  meddpiccTotal: 64,
  contacts: [
    { id: '1', name: 'Eva Visser', title: 'COO', role: 'Champion', engagementScore: 95 },
    { id: '2', name: 'Jan de Groot', title: 'CFO', role: 'Economic Buyer', engagementScore: 75 },
    { id: '3', name: 'Maria Santos', title: 'IT Director', role: 'Evaluator', engagementScore: 60 },
  ],
  timeline: [
    { stage: 'Lead', date: 'Nov 1', completed: true },
    { stage: 'MQL', date: 'Nov 15', completed: true },
    { stage: 'SQL', date: 'Nov 28', completed: true },
    { stage: 'SAL', date: 'Dec 5', completed: true },
    { stage: 'Commit', date: '?', completed: false },
    { stage: 'Close', date: 'Jan 15', completed: false },
  ],
  closeDate: 'Jan 15, 2025',
  daysInStage: 5,
  healthScore: 78,
};

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'Champion':
      return <Star size={14} />;
    case 'Economic Buyer':
      return <DollarSign size={14} />;
    case 'Evaluator':
      return <TrendingUp size={14} />;
    case 'Blocker':
      return <AlertCircle size={14} />;
    default:
      return <Users size={14} />;
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'Champion':
      return 'var(--color-warning-500)';
    case 'Economic Buyer':
      return 'var(--color-success-500)';
    case 'Evaluator':
      return 'var(--color-info-500)';
    case 'Blocker':
      return 'var(--color-danger-500)';
    default:
      return 'var(--text-secondary)';
  }
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const DealDetail: React.FC<DealDetailProps> = ({ deal = mockDeal, onBack }) => {
  const [activeTab, setActiveTab] = React.useState<'overview' | 'meddpicc' | 'contacts' | 'signals' | 'activity'>('overview');

  return (
    <div className="deal-detail">
      {/* Header */}
      <div className="deal-detail-header">
        <div className="deal-detail-header-left">
          <button className="btn btn-ghost" onClick={onBack}>
            <ArrowLeft size={18} />
            <span>Back to Deals</span>
          </button>
        </div>
        <div className="deal-detail-header-center">
          <h1 className="deal-detail-title">{deal.companyName}</h1>
          <div className="deal-detail-meta">
            <span><Building2 size={14} /> {deal.industry}</span>
            <span><MapPin size={14} /> {deal.location}</span>
            <span><Users size={14} /> {deal.employees} employees</span>
          </div>
        </div>
        <div className="deal-detail-header-right">
          <button className="btn btn-secondary">
            <Edit2 size={16} />
            Edit
          </button>
          <button className="btn btn-ghost">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="deal-metrics-grid">
        <div className="deal-metric-card">
          <div className="deal-metric-value">{formatCurrency(deal.dealValue)}</div>
          <div className="deal-metric-label">Deal Value</div>
        </div>
        <div className="deal-metric-card">
          <div className="deal-metric-value">{deal.stage}</div>
          <div className="deal-metric-label">
            <div className="deal-stage-progress">
              <div className="deal-stage-progress-bar" style={{ width: `${deal.stageProgress}%` }} />
            </div>
          </div>
        </div>
        <div className="deal-metric-card">
          <div className="deal-metric-value">{deal.meddpiccTotal}/80</div>
          <div className="deal-metric-label">MEDDPICC Score</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="deal-tabs">
        {(['overview', 'meddpicc', 'contacts', 'signals', 'activity'] as const).map((tab) => (
          <button
            key={tab}
            className={`deal-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="deal-tab-content">
        {activeTab === 'overview' && (
          <div className="deal-overview-grid">
            {/* MEDDPICC Scorecard */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">MEDDPICC Scorecard</h3>
              </div>
              <div className="card-content">
                <div className="meddpicc-visual">
                  <svg width="200" height="200" viewBox="0 0 200 200">
                    {MEDDPICC_CATEGORIES.map((cat, i) => {
                      const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
                      const score = deal.meddpicc[cat.key] || 0;
                      const radius = 70;
                      const x = 100 + Math.cos(angle) * radius;
                      const y = 100 + Math.sin(angle) * radius;
                      const barAngle = (i / 8) * 360;
                      const barLength = (score / 10) * 50;

                      return (
                        <g key={cat.key}>
                          {/* Segment line */}
                          <line
                            x1="100"
                            y1="100"
                            x2={100 + Math.cos(angle) * 80}
                            y2={100 + Math.sin(angle) * 80}
                            stroke="var(--border-secondary)"
                            strokeWidth="1"
                          />
                          {/* Score bar */}
                          <line
                            x1="100"
                            y1="100"
                            x2={100 + Math.cos(angle) * barLength}
                            y2={100 + Math.sin(angle) * barLength}
                            stroke={score >= 7 ? 'var(--color-success-500)' : score >= 5 ? 'var(--color-warning-500)' : 'var(--color-danger-500)'}
                            strokeWidth="8"
                            strokeLinecap="round"
                          />
                          {/* Label */}
                          <text
                            x={x}
                            y={y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize="12"
                            fontWeight="600"
                            fill="var(--text-primary)"
                          >
                            {cat.key}
                          </text>
                        </g>
                      );
                    })}
                    {/* Center score */}
                    <text
                      x="100"
                      y="95"
                      textAnchor="middle"
                      fontSize="24"
                      fontWeight="700"
                      fill="var(--text-primary)"
                    >
                      {deal.meddpiccTotal}
                    </text>
                    <text
                      x="100"
                      y="115"
                      textAnchor="middle"
                      fontSize="12"
                      fill="var(--text-tertiary)"
                    >
                      / 80
                    </text>
                  </svg>
                </div>
                <div className="meddpicc-legend">
                  {MEDDPICC_CATEGORIES.map((cat) => (
                    <div key={cat.key} className="meddpicc-legend-item">
                      <span className="meddpicc-legend-key">{cat.key}</span>
                      <span className="meddpicc-legend-label">{cat.label}</span>
                      <span className="meddpicc-legend-score">{deal.meddpicc[cat.key] || 0}/10</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Buying Committee */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Buying Committee</h3>
              </div>
              <div className="card-content">
                <div className="contact-list">
                  {deal.contacts.map((contact) => (
                    <div key={contact.id} className="contact-item list-item">
                      <div className="contact-avatar" style={{ color: getRoleColor(contact.role) }}>
                        {getRoleIcon(contact.role)}
                      </div>
                      <div className="contact-info">
                        <div className="contact-name">{contact.name}</div>
                        <div className="contact-title">{contact.title}</div>
                      </div>
                      <div className="contact-role">
                        <span className="badge" style={{
                          background: `${getRoleColor(contact.role)}15`,
                          color: getRoleColor(contact.role)
                        }}>
                          {contact.role}
                        </span>
                      </div>
                      <div className="contact-engagement">
                        <div className="engagement-dots">
                          {[1, 2, 3, 4].map((dot) => (
                            <span
                              key={dot}
                              className={`engagement-dot ${contact.engagementScore >= dot * 25 ? 'filled' : ''}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'meddpicc' && (
          <div className="meddpicc-detail-grid">
            {MEDDPICC_CATEGORIES.map((cat) => (
              <div key={cat.key} className="card meddpicc-detail-card">
                <div className="card-content">
                  <div className="meddpicc-detail-header">
                    <span className="meddpicc-detail-key">{cat.key}</span>
                    <span className="meddpicc-detail-score">{deal.meddpicc[cat.key] || 0}/10</span>
                  </div>
                  <h4 className="meddpicc-detail-label">{cat.label}</h4>
                  <p className="meddpicc-detail-description">{cat.description}</p>
                  <div className="meddpicc-detail-bar">
                    <div
                      className="meddpicc-detail-bar-fill"
                      style={{
                        width: `${(deal.meddpicc[cat.key] || 0) * 10}%`,
                        background: (deal.meddpicc[cat.key] || 0) >= 7
                          ? 'var(--color-success-500)'
                          : (deal.meddpicc[cat.key] || 0) >= 5
                            ? 'var(--color-warning-500)'
                            : 'var(--color-danger-500)'
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deal Timeline */}
      <div className="card deal-timeline-card">
        <div className="card-header">
          <h3 className="card-title">Deal Timeline</h3>
          <span className="deal-close-date">
            <Calendar size={14} />
            Expected close: {deal.closeDate}
          </span>
        </div>
        <div className="card-content">
          <div className="deal-timeline">
            {deal.timeline.map((stage, index) => (
              <div key={stage.stage} className={`timeline-stage ${stage.completed ? 'completed' : ''}`}>
                <div className="timeline-dot">
                  {stage.completed ? <CheckCircle size={16} /> : <Clock size={16} />}
                </div>
                <div className="timeline-content">
                  <div className="timeline-stage-name">{stage.stage}</div>
                  <div className="timeline-date">{stage.date}</div>
                </div>
                {index < deal.timeline.length - 1 && <div className="timeline-connector" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DealDetail;
