/**
 * Knowledge Base View Component
 *
 * Browse and manage validated learnings in the knowledge base.
 * Displays signal rules, company intelligence, patterns, and more.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './KnowledgeBaseView.css'

interface KnowledgeEntry {
  id: string
  type: string
  title: string
  content: string
  source: {
    type: string
    validated_by: string | null
  }
  performance: {
    times_retrieved: number
    times_helpful: number
    accuracy_rate: number | null
    last_used_at: string | null
  }
  status: string
  created_at: string
  updated_at: string
}

const KNOWLEDGE_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'signal_rule', label: 'Signal Rules' },
  { value: 'company_intel', label: 'Company Intelligence' },
  { value: 'pattern', label: 'Patterns' },
  { value: 'timing_insight', label: 'Timing Insights' },
  { value: 'contact_preference', label: 'Contact Preferences' },
  { value: 'competitive_intel', label: 'Competitive Intelligence' },
  { value: 'negative_learning', label: 'Negative Learnings' },
]

const TYPE_ICONS: Record<string, string> = {
  signal_rule: 'book-open',
  company_intel: 'building',
  pattern: 'activity',
  timing_insight: 'calendar',
  contact_preference: 'user',
  competitive_intel: 'users',
  negative_learning: 'x-circle',
}

// Demo knowledge base entries
const DEMO_ENTRIES: KnowledgeEntry[] = [
  {
    id: 'kb-001',
    type: 'signal_rule',
    title: 'Infrastructure Expansion = Buying Intent',
    content: 'When a company expands cloud infrastructure (AWS, Azure, GCP) alongside technical hiring, there is an 85% correlation with upcoming software purchasing decisions within 90 days. This pattern is especially strong for SaaS companies in growth phase. Action: Prioritize outreach within 2 weeks of signal detection.',
    source: { type: 'pattern_validation', validated_by: 'Hugo de Vries' },
    performance: { times_retrieved: 47, times_helpful: 42, accuracy_rate: 0.89, last_used_at: '2024-12-09T14:30:00Z' },
    status: 'active',
    created_at: '2024-10-15T10:00:00Z',
    updated_at: '2024-12-05T16:00:00Z',
  },
  {
    id: 'kb-002',
    type: 'company_intel',
    title: 'TechFlow BV - Decision Making Process',
    content: 'TechFlow BV uses a consensus-based procurement process. The CTO (Jan de Vries) has final sign-off but VP Engineering and Finance Director must approve first. Budget cycles are quarterly with Q1 being the largest allocation. They prefer vendors with EU data residency. Previous vendor evaluation took 6-8 weeks.',
    source: { type: 'human_input', validated_by: 'Hugo de Vries' },
    performance: { times_retrieved: 12, times_helpful: 11, accuracy_rate: 0.92, last_used_at: '2024-12-08T09:15:00Z' },
    status: 'active',
    created_at: '2024-11-20T14:00:00Z',
    updated_at: '2024-12-01T11:30:00Z',
  },
  {
    id: 'kb-003',
    type: 'pattern',
    title: 'Q1 Budget Urgency Window',
    content: 'Companies with fiscal year ending in March show 3x higher response rates to outreach in January-February. Budget holders are motivated to allocate remaining budget before it expires. Best approach: Lead with "before your Q1 budget closes" messaging. Optimal contact: Finance-aware decision makers.',
    source: { type: 'ai_discovered', validated_by: 'Hugo de Vries' },
    performance: { times_retrieved: 34, times_helpful: 28, accuracy_rate: 0.82, last_used_at: '2024-12-07T16:45:00Z' },
    status: 'active',
    created_at: '2024-09-10T08:00:00Z',
    updated_at: '2024-11-28T13:00:00Z',
  },
  {
    id: 'kb-004',
    type: 'timing_insight',
    title: 'Tuesday-Wednesday Optimal Contact Window',
    content: 'Analysis of 500+ successful meetings shows Tuesday and Wednesday between 10:00-11:30 and 14:00-15:30 have the highest meeting acceptance rates (42% vs 23% baseline). Monday mornings and Friday afternoons should be avoided. LinkedIn InMail performs best on Tuesday mornings.',
    source: { type: 'ai_discovered', validated_by: null },
    performance: { times_retrieved: 89, times_helpful: 71, accuracy_rate: 0.80, last_used_at: '2024-12-10T10:00:00Z' },
    status: 'active',
    created_at: '2024-08-05T12:00:00Z',
    updated_at: '2024-12-02T09:00:00Z',
  },
  {
    id: 'kb-005',
    type: 'negative_learning',
    title: 'Avoid "Quick Call" Language with Enterprise',
    content: 'Enterprise prospects (500+ employees) respond 60% worse to "quick call" or "15 minutes" language. These companies have formal procurement processes and perceive informal language as unprofessional. Use "structured evaluation session" or "discovery conversation" instead.',
    source: { type: 'correction_learning', validated_by: 'Hugo de Vries' },
    performance: { times_retrieved: 23, times_helpful: 21, accuracy_rate: 0.91, last_used_at: '2024-12-06T11:20:00Z' },
    status: 'active',
    created_at: '2024-10-01T15:00:00Z',
    updated_at: '2024-11-15T10:00:00Z',
  },
  {
    id: 'kb-006',
    type: 'competitive_intel',
    title: 'Competitor X Pricing Vulnerability',
    content: 'Competitor X recently increased prices 40% for existing customers. Several of their customers (DataSphere, CloudNine) have expressed frustration publicly on LinkedIn. This creates opportunity for competitive displacement with messaging around pricing transparency and long-term partnership.',
    source: { type: 'human_input', validated_by: 'Hugo de Vries' },
    performance: { times_retrieved: 8, times_helpful: 7, accuracy_rate: 0.88, last_used_at: '2024-12-04T14:00:00Z' },
    status: 'active',
    created_at: '2024-11-25T09:00:00Z',
    updated_at: '2024-12-03T16:30:00Z',
  },
  {
    id: 'kb-007',
    type: 'contact_preference',
    title: 'IT Directors Prefer Technical Content First',
    content: 'IT Directors respond 2.5x better when initial outreach includes technical documentation or architecture diagrams rather than ROI-focused messaging. They want to validate technical fit before engaging in business discussions. Lead with technical credibility, follow with business value.',
    source: { type: 'pattern_validation', validated_by: null },
    performance: { times_retrieved: 56, times_helpful: 48, accuracy_rate: 0.86, last_used_at: '2024-12-09T08:30:00Z' },
    status: 'active',
    created_at: '2024-09-20T11:00:00Z',
    updated_at: '2024-11-30T14:15:00Z',
  },
]

const DEMO_STATS = {
  total_entries: 47,
  by_type: {
    signal_rule: 12,
    company_intel: 15,
    pattern: 8,
    timing_insight: 5,
    contact_preference: 4,
    competitive_intel: 2,
    negative_learning: 1,
  },
  total_retrievals: 342,
  average_accuracy: 0.85,
  active_patterns: 8,
  proposed_patterns: 2,
}

export function KnowledgeBaseView() {
  const { t } = useTranslation(['deepWork', 'common'])
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [stats, setStats] = useState<{ total_entries: number; by_type: Record<string, number> } | null>(null)
  const [selectedType, setSelectedType] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEntry, setSelectedEntry] = useState<KnowledgeEntry | null>(null)

  useEffect(() => {
    loadData()
  }, [selectedType])

  const loadData = async () => {
    try {
      setIsLoading(true)

      let entriesLoaded = false
      let statsLoaded = false

      // Load entries
      try {
        const url = selectedType
          ? `/api/deep-work/knowledge-base?type=${selectedType}`
          : '/api/deep-work/knowledge-base'
        const entriesRes = await fetch(url)
        if (entriesRes.ok) {
          const data = await entriesRes.json()
          if (data.entries && data.entries.length > 0) {
            setEntries(data.entries)
            entriesLoaded = true
          }
        }
      } catch {}

      // Load stats
      try {
        const statsRes = await fetch('/api/deep-work/knowledge-base/stats')
        if (statsRes.ok) {
          const data = await statsRes.json()
          if (data.total_entries > 0) {
            setStats(data)
            statsLoaded = true
          }
        }
      } catch {}

      // Use demo data if API didn't return data
      if (!entriesLoaded) {
        const filteredEntries = selectedType
          ? DEMO_ENTRIES.filter(e => e.type === selectedType)
          : DEMO_ENTRIES
        setEntries(filteredEntries)
      }
      if (!statsLoaded) {
        setStats(DEMO_STATS)
      }
    } catch (error) {
      console.error('Failed to load knowledge base:', error)
      // Use demo data on complete failure
      setEntries(DEMO_ENTRIES)
      setStats(DEMO_STATS)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadData()
      return
    }

    try {
      setIsLoading(true)
      const res = await fetch(`/api/deep-work/knowledge-base/search/${encodeURIComponent(searchQuery)}`)
      if (res.ok) {
        const data = await res.json()
        setEntries(data.entries || [])
      }
    } catch (error) {
      console.error('Failed to search:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'signal_rule':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
        )
      case 'company_intel':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
            <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
            <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
          </svg>
        )
      case 'pattern':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        )
      case 'timing_insight':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        )
      case 'negative_learning':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        )
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
          </svg>
        )
    }
  }

  const getTypeLabel = (type: string) => {
    const found = KNOWLEDGE_TYPES.find(t => t.value === type)
    return found ? found.label : type
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="knowledge-base-view">
      {/* Header */}
      <div className="kb-header">
        <div className="kb-stats">
          <span className="stat-highlight">{stats?.total_entries || 0}</span>
          <span>{t('deepWork:knowledgeBase.validatedLearnings')}</span>
        </div>
        <button className="btn btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t('deepWork:knowledgeBase.addLearning')}
        </button>
      </div>

      {/* Filters */}
      <div className="kb-filters">
        <div className="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder={t('deepWork:knowledgeBase.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <div className="type-filter">
          {KNOWLEDGE_TYPES.map((type) => (
            <button
              key={type.value}
              className={`filter-btn ${selectedType === type.value ? 'active' : ''}`}
              onClick={() => setSelectedType(type.value)}
            >
              {type.label}
              {type.value && stats?.by_type[type.value] && (
                <span className="count">{stats.by_type[type.value]}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="kb-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
          </div>
        ) : entries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
            <h3 className="empty-state-title">{t('deepWork:knowledgeBase.noEntries')}</h3>
            <p className="empty-state-description">{t('deepWork:knowledgeBase.noEntriesDescription')}</p>
          </div>
        ) : (
          <div className="kb-entries">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className={`kb-entry ${entry.type}`}
                onClick={() => setSelectedEntry(entry)}
              >
                <div className="entry-icon">{getTypeIcon(entry.type)}</div>
                <div className="entry-content">
                  <div className="entry-header">
                    <span className="entry-type">{getTypeLabel(entry.type)}</span>
                    <h4 className="entry-title">{entry.title}</h4>
                  </div>
                  <p className="entry-preview">{entry.content.slice(0, 150)}...</p>
                  <div className="entry-meta">
                    <span className="meta-item">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      {entry.performance.times_retrieved} {t('deepWork:knowledgeBase.retrievals')}
                    </span>
                    {entry.performance.accuracy_rate && (
                      <span className="meta-item accuracy">
                        {Math.round(entry.performance.accuracy_rate * 100)}% {t('deepWork:knowledgeBase.accuracy')}
                      </span>
                    )}
                    <span className="meta-item">
                      {t('deepWork:knowledgeBase.updated')} {formatDate(entry.updated_at)}
                    </span>
                  </div>
                </div>
                <div className="entry-actions">
                  <button className="icon-btn" title={t('deepWork:knowledgeBase.edit')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                    </svg>
                  </button>
                  <button className="icon-btn" title={t('deepWork:knowledgeBase.viewUsage')}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedEntry && (
        <div className="kb-modal-overlay" onClick={() => setSelectedEntry(null)}>
          <div className="kb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <span className="entry-type">{getTypeLabel(selectedEntry.type)}</span>
                <h3>{selectedEntry.title}</h3>
              </div>
              <button className="close-btn" onClick={() => setSelectedEntry(null)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="modal-content">
              <div className="content-text">{selectedEntry.content}</div>

              <div className="modal-stats">
                <div className="stat">
                  <span className="stat-value">{selectedEntry.performance.times_retrieved}</span>
                  <span className="stat-label">{t('deepWork:knowledgeBase.timesRetrieved')}</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{selectedEntry.performance.times_helpful}</span>
                  <span className="stat-label">{t('deepWork:knowledgeBase.timesHelpful')}</span>
                </div>
                {selectedEntry.performance.accuracy_rate && (
                  <div className="stat">
                    <span className="stat-value">{Math.round(selectedEntry.performance.accuracy_rate * 100)}%</span>
                    <span className="stat-label">{t('deepWork:knowledgeBase.accuracyRate')}</span>
                  </div>
                )}
              </div>

              <div className="modal-meta">
                <p>
                  <strong>{t('deepWork:knowledgeBase.source')}:</strong> {selectedEntry.source.type}
                  {selectedEntry.source.validated_by && ` (${t('deepWork:knowledgeBase.validatedBy')} ${selectedEntry.source.validated_by})`}
                </p>
                <p>
                  <strong>{t('deepWork:knowledgeBase.created')}:</strong> {formatDate(selectedEntry.created_at)}
                </p>
                <p>
                  <strong>{t('deepWork:knowledgeBase.lastUsed')}:</strong>{' '}
                  {selectedEntry.performance.last_used_at ? formatDate(selectedEntry.performance.last_used_at) : t('deepWork:knowledgeBase.never')}
                </p>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary">{t('deepWork:knowledgeBase.edit')}</button>
              <button className="btn btn-secondary">{t('deepWork:knowledgeBase.deactivate')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default KnowledgeBaseView
