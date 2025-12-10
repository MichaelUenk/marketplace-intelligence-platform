import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Calendar,
  FileText,
  Brain,
  MessageSquare,
  BookOpen,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Play,
  Lightbulb,
  TrendingUp,
  Users,
  Building2,
  Zap,
  RefreshCw,
} from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  company: string;
  attendees: string[];
  startTime: Date;
  type: 'discovery' | 'demo' | 'proposal' | 'negotiation';
  prepStatus: 'ready' | 'pending' | 'not_started';
  dealStage: string;
}

interface Insight {
  id: string;
  type: 'pain_point' | 'buying_signal' | 'objection' | 'competitor_mention';
  content: string;
  company: string;
  date: Date;
  confidence: number;
}

interface PendingResponse {
  id: string;
  channel: 'email' | 'linkedin' | 'slack';
  sender: string;
  preview: string;
  confidence: number;
  suggestedResponse: string;
  receivedAt: Date;
}

// Mock data for demonstration
const mockMeetings: Meeting[] = [
  {
    id: '1',
    title: 'Discovery Call - TechCorp',
    company: 'TechCorp',
    attendees: ['John Smith', 'Sarah Johnson'],
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    type: 'discovery',
    prepStatus: 'ready',
    dealStage: 'Discovery',
  },
  {
    id: '2',
    title: 'Product Demo - InnovateCo',
    company: 'InnovateCo',
    attendees: ['Mike Chen', 'Lisa Wong', 'Tom Brown'],
    startTime: new Date(Date.now() + 26 * 60 * 60 * 1000), // Tomorrow
    type: 'demo',
    prepStatus: 'pending',
    dealStage: 'Proposal',
  },
  {
    id: '3',
    title: 'Proposal Review - GlobalTech',
    company: 'GlobalTech',
    attendees: ['Emma Davis'],
    startTime: new Date(Date.now() + 50 * 60 * 60 * 1000), // 2 days from now
    type: 'proposal',
    prepStatus: 'not_started',
    dealStage: 'Negotiation',
  },
];

const mockInsights: Insight[] = [
  {
    id: '1',
    type: 'buying_signal',
    content: 'Mentioned Q1 budget allocation for sales tools',
    company: 'TechCorp',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    confidence: 0.92,
  },
  {
    id: '2',
    type: 'pain_point',
    content: 'Struggling with manual data entry taking 3+ hours daily',
    company: 'InnovateCo',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    confidence: 0.88,
  },
  {
    id: '3',
    type: 'objection',
    content: 'Concerned about implementation timeline for Q2 launch',
    company: 'GlobalTech',
    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    confidence: 0.85,
  },
  {
    id: '4',
    type: 'competitor_mention',
    content: 'Currently evaluating Salesforce and HubSpot alternatives',
    company: 'TechCorp',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    confidence: 0.95,
  },
];

const mockPendingResponses: PendingResponse[] = [
  {
    id: '1',
    channel: 'email',
    sender: 'John Smith (TechCorp)',
    preview: 'Can you send over the pricing breakdown we discussed?',
    confidence: 0.91,
    suggestedResponse: 'Hi John, Absolutely! I\'ve attached the detailed pricing breakdown...',
    receivedAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '2',
    channel: 'linkedin',
    sender: 'Sarah Johnson',
    preview: 'Thanks for the demo, do you have case studies for our industry?',
    confidence: 0.78,
    suggestedResponse: 'Hi Sarah, Great question! Yes, we have several case studies...',
    receivedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
];

export const ThoughtLeadershipDashboard: React.FC = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const [searchQuery, setSearchQuery] = useState('');
  const [calendarConnected] = useState(false);

  const getTimeLabel = (date: Date): string => {
    const now = new Date();
    const diffHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (diffHours < 24) {
      return t('thoughtLeadership.meetings.today');
    } else if (diffHours < 48) {
      return t('thoughtLeadership.meetings.tomorrow');
    }
    return t('thoughtLeadership.meetings.thisWeek');
  };

  const getInsightTypeLabel = (type: Insight['type']): string => {
    const labels: Record<Insight['type'], string> = {
      pain_point: t('thoughtLeadership.knowledge.painPoint'),
      buying_signal: t('thoughtLeadership.knowledge.buyingSignal'),
      objection: t('thoughtLeadership.knowledge.objection'),
      competitor_mention: t('thoughtLeadership.knowledge.competitorMention'),
    };
    return labels[type];
  };

  const getInsightTypeColor = (type: Insight['type']): string => {
    const colors: Record<Insight['type'], string> = {
      pain_point: 'badge-red',
      buying_signal: 'badge-green',
      objection: 'badge-amber',
      competitor_mention: 'badge-purple',
    };
    return colors[type];
  };

  const getPrepStatusIcon = (status: Meeting['prepStatus']) => {
    switch (status) {
      case 'ready':
        return <CheckCircle size={16} className="text-success" />;
      case 'pending':
        return <Clock size={16} className="text-warning" />;
      default:
        return <AlertCircle size={16} className="text-error" />;
    }
  };

  return (
    <div className="thought-leadership-dashboard">
      {/* Metrics Overview */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-primary-light)' }}>
            <Calendar size={24} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div className="stat-content">
            <span className="stat-value">5</span>
            <span className="stat-label">{t('thoughtLeadership.upcomingMeetings')}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-success-light)' }}>
            <CheckCircle size={24} style={{ color: 'var(--color-success)' }} />
          </div>
          <div className="stat-content">
            <span className="stat-value">95%</span>
            <span className="stat-label">{t('thoughtLeadership.metrics.prepCompletion')}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-info-light)' }}>
            <Brain size={24} style={{ color: 'var(--color-info)' }} />
          </div>
          <div className="stat-content">
            <span className="stat-value">1,247</span>
            <span className="stat-label">{t('thoughtLeadership.knowledge.transcriptsIndexed')}</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--color-warning-light)' }}>
            <MessageSquare size={24} style={{ color: 'var(--color-warning)' }} />
          </div>
          <div className="stat-content">
            <span className="stat-value">85%</span>
            <span className="stat-label">{t('thoughtLeadership.metrics.responseAccuracy')}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Left Column */}
        <div className="dashboard-column">
          {/* Calendar Connection */}
          {!calendarConnected && (
            <div className="card" style={{ marginBottom: '24px', border: '2px dashed var(--color-border)' }}>
              <div className="card-content" style={{ textAlign: 'center', padding: '32px' }}>
                <Calendar size={48} style={{ color: 'var(--color-text-tertiary)', marginBottom: '16px' }} />
                <h3 style={{ marginBottom: '8px' }}>{t('thoughtLeadership.calendar.connectCalendar')}</h3>
                <p className="text-body-sm" style={{ color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
                  Connect your calendar to enable automatic meeting prep
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button className="btn btn-primary">
                    {t('thoughtLeadership.calendar.googleCalendar')}
                  </button>
                  <button className="btn btn-secondary">
                    {t('thoughtLeadership.calendar.outlookCalendar')}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Upcoming Meetings */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <h3 className="card-title">
                <Calendar size={20} style={{ marginRight: '8px' }} />
                {t('thoughtLeadership.upcomingMeetings')}
              </h3>
              <button className="btn btn-ghost btn-sm">
                <RefreshCw size={16} />
                {t('thoughtLeadership.calendar.syncNow')}
              </button>
            </div>
            <div className="card-content" style={{ padding: 0 }}>
              {mockMeetings.map((meeting, index) => (
                <div
                  key={meeting.id}
                  className="meeting-item"
                  style={{
                    padding: '16px',
                    borderBottom: index < mockMeetings.length - 1 ? '1px solid var(--color-border)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="badge badge-secondary">{getTimeLabel(meeting.startTime)}</span>
                      <span className="text-body-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {meeting.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <h4 style={{ marginBottom: '4px' }}>{meeting.title}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="text-body-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Building2 size={14} />
                        {meeting.company}
                      </span>
                      <span className="text-body-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={14} />
                        {meeting.attendees.length}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {getPrepStatusIcon(meeting.prepStatus)}
                    <span className="text-body-sm">
                      {meeting.prepStatus === 'ready'
                        ? t('thoughtLeadership.meetings.prepReady')
                        : t('thoughtLeadership.meetings.prepPending')}
                    </span>
                  </div>
                  <button className="btn btn-primary btn-sm">
                    {meeting.prepStatus === 'ready'
                      ? t('thoughtLeadership.meetings.viewBrief')
                      : t('thoughtLeadership.meetings.generateBrief')}
                    <ChevronRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Responses */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <MessageSquare size={20} style={{ marginRight: '8px' }} />
                {t('thoughtLeadership.autoResponses')}
              </h3>
              <span className="badge badge-primary">{mockPendingResponses.length} {t('thoughtLeadership.responses.pendingReview')}</span>
            </div>
            <div className="card-content" style={{ padding: 0 }}>
              {mockPendingResponses.map((response, index) => (
                <div
                  key={response.id}
                  className="response-item"
                  style={{
                    padding: '16px',
                    borderBottom: index < mockPendingResponses.length - 1 ? '1px solid var(--color-border)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="text-body-sm font-medium">{response.sender}</span>
                    <span className="badge badge-secondary" style={{ textTransform: 'capitalize' }}>
                      {response.channel}
                    </span>
                  </div>
                  <p className="text-body-sm" style={{ marginBottom: '8px', color: 'var(--color-text-secondary)' }}>
                    {response.preview}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span className="text-body-sm">
                      {t('thoughtLeadership.responses.confidenceScore')}:
                    </span>
                    <span className={`badge ${response.confidence >= 0.85 ? 'badge-green' : 'badge-amber'}`}>
                      {Math.round(response.confidence * 100)}%
                    </span>
                  </div>
                  <div className="suggested-response" style={{
                    background: 'var(--color-bg-secondary)',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                  }}>
                    <p className="text-body-sm" style={{ fontStyle: 'italic' }}>
                      "{response.suggestedResponse}"
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary btn-sm">
                      {t('thoughtLeadership.responses.approve')}
                    </button>
                    <button className="btn btn-secondary btn-sm">
                      {t('thoughtLeadership.responses.edit')}
                    </button>
                    <button className="btn btn-ghost btn-sm">
                      {t('thoughtLeadership.responses.escalate')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard-column">
          {/* Knowledge Base Search */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <h3 className="card-title">
                <Brain size={20} style={{ marginRight: '8px' }} />
                {t('thoughtLeadership.knowledgeBase')}
              </h3>
            </div>
            <div className="card-content">
              <div className="input-wrapper" style={{ marginBottom: '16px' }}>
                <Search size={18} className="input-icon" />
                <input
                  type="text"
                  className="input"
                  placeholder={t('thoughtLeadership.knowledge.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
              <div className="stats-row" style={{ display: 'flex', gap: '16px' }}>
                <div className="mini-stat" style={{ flex: 1, textAlign: 'center', padding: '12px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                  <span className="stat-value" style={{ fontSize: '24px', fontWeight: 600 }}>1,247</span>
                  <span className="stat-label text-body-sm">{t('thoughtLeadership.knowledge.transcriptsIndexed')}</span>
                </div>
                <div className="mini-stat" style={{ flex: 1, textAlign: 'center', padding: '12px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                  <span className="stat-value" style={{ fontSize: '24px', fontWeight: 600 }}>342</span>
                  <span className="stat-label text-body-sm">{t('thoughtLeadership.knowledge.insightsExtracted')}</span>
                </div>
                <div className="mini-stat" style={{ flex: 1, textAlign: 'center', padding: '12px', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}>
                  <span className="stat-value" style={{ fontSize: '24px', fontWeight: 600 }}>28</span>
                  <span className="stat-label text-body-sm">{t('thoughtLeadership.knowledge.articlesGenerated')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Insights */}
          <div className="card" style={{ marginBottom: '24px' }}>
            <div className="card-header">
              <h3 className="card-title">
                <Lightbulb size={20} style={{ marginRight: '8px' }} />
                {t('thoughtLeadership.knowledge.recentInsights')}
              </h3>
              <button className="btn btn-ghost btn-sm">
                {t('common:actions.viewAll')}
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="card-content" style={{ padding: 0 }}>
              {mockInsights.map((insight, index) => (
                <div
                  key={insight.id}
                  className="insight-item"
                  style={{
                    padding: '16px',
                    borderBottom: index < mockInsights.length - 1 ? '1px solid var(--color-border)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span className={`badge ${getInsightTypeColor(insight.type)}`}>
                      {getInsightTypeLabel(insight.type)}
                    </span>
                    <span className="text-body-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                      {insight.company}
                    </span>
                  </div>
                  <p className="text-body-sm" style={{ marginBottom: '8px' }}>
                    {insight.content}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="text-body-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                      {insight.date.toLocaleDateString()}
                    </span>
                    <span className="badge badge-secondary">
                      {Math.round(insight.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Content Library */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <BookOpen size={20} style={{ marginRight: '8px' }} />
                {t('thoughtLeadership.contentLibrary')}
              </h3>
              <button className="btn btn-primary btn-sm">
                <Zap size={16} />
                Generate Content
              </button>
            </div>
            <div className="card-content">
              <div className="content-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="content-item" style={{
                  padding: '16px',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}>
                  <FileText size={24} style={{ marginBottom: '8px', color: 'var(--color-primary)' }} />
                  <h4 style={{ fontSize: '14px', marginBottom: '4px' }}>Blog Posts</h4>
                  <span className="text-body-sm" style={{ color: 'var(--color-text-secondary)' }}>12 generated</span>
                </div>
                <div className="content-item" style={{
                  padding: '16px',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}>
                  <TrendingUp size={24} style={{ marginBottom: '8px', color: 'var(--color-success)' }} />
                  <h4 style={{ fontSize: '14px', marginBottom: '4px' }}>Case Studies</h4>
                  <span className="text-body-sm" style={{ color: 'var(--color-text-secondary)' }}>8 generated</span>
                </div>
                <div className="content-item" style={{
                  padding: '16px',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}>
                  <Play size={24} style={{ marginBottom: '8px', color: 'var(--color-warning)' }} />
                  <h4 style={{ fontSize: '14px', marginBottom: '4px' }}>Presentations</h4>
                  <span className="text-body-sm" style={{ color: 'var(--color-text-secondary)' }}>24 generated</span>
                </div>
                <div className="content-item" style={{
                  padding: '16px',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}>
                  <MessageSquare size={24} style={{ marginBottom: '8px', color: 'var(--color-info)' }} />
                  <h4 style={{ fontSize: '14px', marginBottom: '4px' }}>Email Templates</h4>
                  <span className="text-body-sm" style={{ color: 'var(--color-text-secondary)' }}>36 generated</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThoughtLeadershipDashboard;
