/**
 * Reasoning Log View Component
 *
 * View all AI decisions and their reasoning with full transparency.
 * Filter by type, status, date, and agent.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './ReasoningLogView.css'

interface ReasoningChunk {
  id: string
  created_at: string
  type: string
  agent: string
  decision: {
    action: string
    result: string
    confidence: number
  }
  reasoning: {
    chain: Array<{ step: number; thought: string; evidence: string }>
  }
  flags: {
    flagged_for_review: boolean
    flag_reason: string
  }
  review: {
    status: string
    notes: string
  }
}

const DECISION_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'signal_classification', label: 'Signal Classification' },
  { value: 'confidence_scoring', label: 'Confidence Scoring' },
  { value: 'deal_potential', label: 'Deal Potential' },
  { value: 'priority_ranking', label: 'Priority Ranking' },
  { value: 'contact_recommendation', label: 'Contact Recommendation' },
  { value: 'bant_scoring', label: 'BANT Scoring' },
  { value: 'paranoid_twin', label: 'Paranoid Twin' },
]

const REVIEW_STATUSES = [
  { value: '', label: 'Any Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'validated', label: 'Validated' },
  { value: 'corrected', label: 'Corrected' },
  { value: 'rejected', label: 'Rejected' },
]

// Demo reasoning chunks for demonstration
const DEMO_CHUNKS: ReasoningChunk[] = [
  {
    id: 'log-001',
    created_at: new Date().toISOString(),
    type: 'signal_classification',
    agent: 'Signal Classifier',
    decision: { action: 'classify', result: 'High-priority signal: TechFlow BV expanding cloud infrastructure', confidence: 0.89 },
    reasoning: {
      chain: [
        { step: 1, thought: 'Detected AWS infrastructure expansion', evidence: 'Tech stack monitoring flagged changes' },
        { step: 2, thought: 'Combined with recent Series B funding', evidence: 'Funding round closed 2 months ago' },
        { step: 3, thought: 'High correlation with buying intent', evidence: 'Historical pattern: 85% accuracy' },
      ],
    },
    flags: { flagged_for_review: false, flag_reason: '' },
    review: { status: 'validated', notes: 'Confirmed - good signal detection' },
  },
  {
    id: 'log-002',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    type: 'priority_ranking',
    agent: 'Priority Ranker',
    decision: { action: 'rank', result: 'DataSphere NL moved to #2 priority based on engagement signals', confidence: 0.85 },
    reasoning: {
      chain: [
        { step: 1, thought: 'Multiple engagement touchpoints detected', evidence: '4 email opens, 2 pricing page visits' },
        { step: 2, thought: 'CTO public intent signal', evidence: 'LinkedIn post about "evaluating data tools"' },
        { step: 3, thought: 'Budget timing creates urgency', evidence: 'Q1 budget cycle ending' },
      ],
    },
    flags: { flagged_for_review: true, flag_reason: 'Borderline confidence - validate timing' },
    review: { status: 'pending', notes: '' },
  },
  {
    id: 'log-003',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    type: 'confidence_scoring',
    agent: 'Confidence Scorer',
    decision: { action: 'score', result: 'CloudNine Systems: 78% conversion likelihood', confidence: 0.78 },
    reasoning: {
      chain: [
        { step: 1, thought: 'Strong engagement pattern', evidence: 'Demo requested, whitepaper downloaded' },
        { step: 2, thought: 'Multiple stakeholders involved', evidence: '3 contacts from same company engaged' },
      ],
    },
    flags: { flagged_for_review: false, flag_reason: '' },
    review: { status: 'validated', notes: '' },
  },
  {
    id: 'log-004',
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    type: 'contact_recommendation',
    agent: 'Contact Strategist',
    decision: { action: 'recommend', result: 'Suggest LinkedIn InMail to Sarah van den Berg (VP Eng)', confidence: 0.68 },
    reasoning: {
      chain: [
        { step: 1, thought: 'Prior engagement exists', evidence: 'Liked 2 company posts last month' },
        { step: 2, thought: 'VP Engineering has decision influence', evidence: 'Pattern: 70% influence at mid-market' },
      ],
    },
    flags: { flagged_for_review: true, flag_reason: 'Lower confidence - human judgment needed' },
    review: { status: 'corrected', notes: 'Good approach but recommend email first, InMail as follow-up' },
  },
  {
    id: 'log-005',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    type: 'deal_potential',
    agent: 'Deal Analyzer',
    decision: { action: 'analyze', result: 'TechFlow BV estimated deal value: €45,000-65,000', confidence: 0.72 },
    reasoning: {
      chain: [
        { step: 1, thought: 'Company size indicates mid-market pricing', evidence: '150 employees, €20M revenue' },
        { step: 2, thought: 'Use case suggests standard tier', evidence: 'Integration requirements align with Pro plan' },
      ],
    },
    flags: { flagged_for_review: false, flag_reason: '' },
    review: { status: 'validated', notes: '' },
  },
  {
    id: 'log-006',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000 - 30 * 60 * 1000).toISOString(),
    type: 'bant_scoring',
    agent: 'BANT Scorer',
    decision: { action: 'score_bant', result: 'InnovateTech BV: Budget=High, Authority=Medium, Need=High, Timeline=Q1', confidence: 0.81 },
    reasoning: {
      chain: [
        { step: 1, thought: 'Budget confirmed through job posting', evidence: 'Looking for tools with €50K+ budget' },
        { step: 2, thought: 'Need evident from pain point discussions', evidence: 'CTO mentioned inefficiencies in webinar' },
        { step: 3, thought: 'Timeline pressure from fiscal year', evidence: 'March fiscal year end' },
      ],
    },
    flags: { flagged_for_review: false, flag_reason: '' },
    review: { status: 'validated', notes: 'Good BANT assessment' },
  },
]

const DEMO_STATS = {
  total: 147,
  validated: 112,
  corrected: 18,
  rejected: 5,
  pending_review: 12,
  correction_rate: 0.14,
}

export function ReasoningLogView() {
  const { t } = useTranslation(['deepWork', 'common'])
  const [chunks, setChunks] = useState<ReasoningChunk[]>([])
  const [stats, setStats] = useState<Record<string, unknown> | null>(null)
  const [selectedType, setSelectedType] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [expandedChunk, setExpandedChunk] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [selectedType, selectedStatus])

  const loadData = async () => {
    try {
      setIsLoading(true)

      let chunksLoaded = false
      let statsLoaded = false

      // Build query params
      const params = new URLSearchParams()
      if (selectedType) params.set('type', selectedType)
      if (selectedStatus) params.set('review_status', selectedStatus)

      try {
        const chunksRes = await fetch(`/api/deep-work/reasoning-chunks?${params.toString()}`)
        if (chunksRes.ok) {
          const data = await chunksRes.json()
          if (data.chunks && data.chunks.length > 0) {
            setChunks(data.chunks)
            chunksLoaded = true
          }
        }
      } catch {}

      try {
        const statsRes = await fetch('/api/deep-work/reasoning-chunks/stats')
        if (statsRes.ok) {
          const data = await statsRes.json()
          if (data.total > 0) {
            setStats(data)
            statsLoaded = true
          }
        }
      } catch {}

      // Use demo data if API didn't return data
      if (!chunksLoaded) {
        let filteredChunks = DEMO_CHUNKS
        if (selectedType) {
          filteredChunks = filteredChunks.filter(c => c.type === selectedType)
        }
        if (selectedStatus) {
          filteredChunks = filteredChunks.filter(c => c.review.status === selectedStatus)
        }
        setChunks(filteredChunks)
      }
      if (!statsLoaded) {
        setStats(DEMO_STATS)
      }
    } catch (error) {
      console.error('Failed to load reasoning log:', error)
      setChunks(DEMO_CHUNKS)
      setStats(DEMO_STATS)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'validated':
        return (
          <svg className="status-icon valid" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )
      case 'corrected':
        return (
          <svg className="status-icon corrected" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
        )
      case 'rejected':
        return (
          <svg className="status-icon rejected" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        )
      default:
        return (
          <svg className="status-icon pending" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )
    }
  }

  const getConfidenceClass = (confidence: number) => {
    if (confidence >= 0.8) return 'high'
    if (confidence >= 0.6) return 'medium'
    return 'low'
  }

  const getTypeLabel = (type: string) => {
    const found = DECISION_TYPES.find(t => t.value === type)
    return found ? found.label : type
  }

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return t('deepWork:reasoningLog.today')
    } else if (date.toDateString() === yesterday.toDateString()) {
      return t('deepWork:reasoningLog.yesterday')
    }

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
  }

  // Group chunks by date
  const groupedChunks = chunks.reduce((groups, chunk) => {
    const date = new Date(chunk.created_at).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(chunk)
    return groups
  }, {} as Record<string, ReasoningChunk[]>)

  return (
    <div className="reasoning-log-view">
      {/* Header */}
      <div className="log-header">
        <h3>{t('deepWork:reasoningLog.title')}</h3>
        <p>{t('deepWork:reasoningLog.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="log-filters">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
        >
          {DECISION_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          {REVIEW_STATUSES.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="log-stats">
          <div className="stat">
            <span className="stat-value">{(stats as { total: number }).total}</span>
            <span className="stat-label">{t('deepWork:reasoningLog.totalDecisions')}</span>
          </div>
          <div className="stat">
            <span className="stat-value">{(stats as { validated: number }).validated}</span>
            <span className="stat-label">{t('deepWork:reasoningLog.validated')}</span>
          </div>
          <div className="stat">
            <span className="stat-value">{(stats as { corrected: number }).corrected}</span>
            <span className="stat-label">{t('deepWork:reasoningLog.corrected')}</span>
          </div>
          <div className="stat">
            <span className="stat-value">{Math.round((1 - ((stats as { correction_rate: number }).correction_rate || 0)) * 100)}%</span>
            <span className="stat-label">{t('deepWork:reasoningLog.accuracy')}</span>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="log-timeline">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
          </div>
        ) : Object.keys(groupedChunks).length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <h3 className="empty-state-title">{t('deepWork:reasoningLog.noDecisions')}</h3>
            <p className="empty-state-description">{t('deepWork:reasoningLog.noDecisionsDescription')}</p>
          </div>
        ) : (
          Object.entries(groupedChunks).map(([date, dateChunks]) => (
            <div key={date} className="log-date-group">
              <div className="date-header">
                {formatDate(dateChunks[0].created_at)}
              </div>

              <div className="log-entries">
                {dateChunks.map((chunk) => (
                  <div
                    key={chunk.id}
                    className={`log-entry ${chunk.flags.flagged_for_review ? 'flagged' : ''} ${expandedChunk === chunk.id ? 'expanded' : ''}`}
                  >
                    <div className="entry-time">{formatTime(chunk.created_at)}</div>

                    <div className="entry-main" onClick={() => setExpandedChunk(expandedChunk === chunk.id ? null : chunk.id)}>
                      <div className="entry-status">
                        {getStatusIcon(chunk.review.status)}
                      </div>

                      <div className="entry-info">
                        <div className="entry-type">{getTypeLabel(chunk.type)}</div>
                        <div className="entry-result">{chunk.decision.result}</div>
                        {chunk.flags.flagged_for_review && (
                          <span className="flagged-badge">{t('deepWork:reasoningLog.needsReview')}</span>
                        )}
                      </div>

                      <div className={`confidence-badge ${getConfidenceClass(chunk.decision.confidence)}`}>
                        {Math.round(chunk.decision.confidence * 100)}%
                      </div>

                      <div className="expand-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {expandedChunk === chunk.id && (
                      <div className="entry-details">
                        <div className="detail-section">
                          <h4>{t('deepWork:reasoningLog.reasoning')}</h4>
                          <div className="reasoning-chain compact">
                            {chunk.reasoning.chain.map((step) => (
                              <div key={step.step} className="reasoning-step">
                                <span className="step-number">{step.step}</span>
                                <div className="step-content">
                                  <div className="step-thought">{step.thought}</div>
                                  {step.evidence && (
                                    <div className="step-evidence">{step.evidence}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {chunk.review.notes && (
                          <div className="detail-section">
                            <h4>{t('deepWork:reasoningLog.reviewNotes')}</h4>
                            <p>{chunk.review.notes}</p>
                          </div>
                        )}

                        <div className="detail-actions">
                          <button className="btn btn-sm btn-secondary">
                            {t('deepWork:reasoningLog.viewFull')}
                          </button>
                          {chunk.review.status === 'pending' && (
                            <button className="btn btn-sm btn-primary">
                              {t('deepWork:reasoningLog.reviewNow')}
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ReasoningLogView
