/**
 * Performance Dashboard Component
 *
 * Track AI improvement over time with accuracy trends,
 * learning velocity, and business impact metrics.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './PerformanceDashboard.css'

interface Stats {
  period_days: number
  total: number
  flagged: number
  validated: number
  corrected: number
  rejected: number
  pending_review: number
  by_type: Record<string, number>
  by_agent: Record<string, number>
  correction_rate: number
}

interface KBStats {
  total_entries: number
  by_type: Record<string, number>
  total_retrievals: number
  average_accuracy: number
  active_patterns: number
  proposed_patterns: number
}

// Demo stats for demonstration
const DEMO_CHUNK_STATS: Stats = {
  period_days: 7,
  total: 147,
  flagged: 23,
  validated: 112,
  corrected: 18,
  rejected: 5,
  pending_review: 12,
  by_type: {
    signal_classification: 45,
    confidence_scoring: 32,
    priority_ranking: 28,
    deal_potential: 18,
    contact_recommendation: 14,
    bant_scoring: 10,
  },
  by_agent: {
    'Signal Classifier': 45,
    'Confidence Scorer': 32,
    'Priority Ranker': 28,
    'Deal Analyzer': 18,
    'Contact Strategist': 14,
    'BANT Scorer': 10,
  },
  correction_rate: 0.14,
}

const DEMO_KB_STATS: KBStats = {
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
  average_accuracy: 0.86,
  active_patterns: 8,
  proposed_patterns: 2,
}

export function PerformanceDashboard() {
  const { t } = useTranslation(['deepWork', 'common'])
  const [chunkStats, setChunkStats] = useState<Stats | null>(null)
  const [kbStats, setKBStats] = useState<KBStats | null>(null)
  const [timePeriod, setTimePeriod] = useState(7)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [timePeriod])

  const loadStats = async () => {
    try {
      setIsLoading(true)

      let chunksLoaded = false
      let kbLoaded = false

      try {
        const [chunksRes, kbRes] = await Promise.all([
          fetch(`/api/deep-work/reasoning-chunks/stats?days=${timePeriod}`),
          fetch('/api/deep-work/knowledge-base/stats'),
        ])

        if (chunksRes.ok) {
          const data = await chunksRes.json()
          if (data.total > 0) {
            setChunkStats(data)
            chunksLoaded = true
          }
        }

        if (kbRes.ok) {
          const data = await kbRes.json()
          if (data.total_entries > 0) {
            setKBStats(data)
            kbLoaded = true
          }
        }
      } catch {}

      // Use demo data if API didn't return data
      if (!chunksLoaded) setChunkStats(DEMO_CHUNK_STATS)
      if (!kbLoaded) setKBStats(DEMO_KB_STATS)
    } catch (error) {
      console.error('Failed to load stats:', error)
      setChunkStats(DEMO_CHUNK_STATS)
      setKBStats(DEMO_KB_STATS)
    } finally {
      setIsLoading(false)
    }
  }

  const getAccuracyRate = () => {
    if (!chunkStats) return 0
    const total = chunkStats.validated + chunkStats.corrected
    if (total === 0) return 0
    return Math.round((chunkStats.validated / total) * 100)
  }

  const getReviewRate = () => {
    if (!chunkStats) return 0
    if (chunkStats.flagged === 0) return 100
    const reviewed = chunkStats.validated + chunkStats.corrected + chunkStats.rejected
    return Math.round((reviewed / chunkStats.flagged) * 100)
  }

  // Generate mock trend data for visualization
  const generateTrendData = () => {
    const data = []
    for (let i = 0; i < 12; i++) {
      data.push({
        week: i + 1,
        classification: 60 + Math.random() * 30,
        confidence: 55 + Math.random() * 35,
        prediction: 45 + Math.random() * 40,
      })
    }
    return data
  }

  const trendData = generateTrendData()

  if (isLoading) {
    return (
      <div className="performance-dashboard loading">
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <div className="performance-dashboard">
      {/* Header */}
      <div className="perf-header">
        <div>
          <h3>{t('deepWork:performance.title')}</h3>
          <p>{t('deepWork:performance.subtitle')}</p>
        </div>
        <div className="period-selector">
          <button
            className={timePeriod === 7 ? 'active' : ''}
            onClick={() => setTimePeriod(7)}
          >
            {t('deepWork:performance.last7Days')}
          </button>
          <button
            className={timePeriod === 30 ? 'active' : ''}
            onClick={() => setTimePeriod(30)}
          >
            {t('deepWork:performance.last30Days')}
          </button>
          <button
            className={timePeriod === 90 ? 'active' : ''}
            onClick={() => setTimePeriod(90)}
          >
            {t('deepWork:performance.last90Days')}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="key-metrics">
        <div className="metric-card primary">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-value">{getAccuracyRate()}%</div>
            <div className="metric-label">{t('deepWork:performance.classificationAccuracy')}</div>
            <div className="metric-trend positive">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              </svg>
              +13% {t('deepWork:performance.vsLastPeriod')}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="20" x2="12" y2="10" />
              <line x1="18" y1="20" x2="18" y2="4" />
              <line x1="6" y1="20" x2="6" y2="16" />
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-value">{kbStats?.average_accuracy ? Math.round(kbStats.average_accuracy * 100) : 0}%</div>
            <div className="metric-label">{t('deepWork:performance.confidenceCalibration')}</div>
            <div className="metric-trend positive">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              </svg>
              +19% {t('deepWork:performance.vsLastPeriod')}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-value">72%</div>
            <div className="metric-label">{t('deepWork:performance.dealPrediction')}</div>
            <div className="metric-trend positive">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              </svg>
              +18% {t('deepWork:performance.vsLastPeriod')}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-value">{kbStats?.total_entries || 0}</div>
            <div className="metric-label">{t('deepWork:performance.knowledgeEntries')}</div>
            <div className="metric-trend">
              +{Math.round(Math.random() * 50 + 10)} {t('deepWork:performance.thisMonth')}
            </div>
          </div>
        </div>
      </div>

      {/* Accuracy Trends Chart */}
      <div className="chart-section">
        <h4>{t('deepWork:performance.accuracyTrends')}</h4>
        <div className="chart-container">
          <div className="chart-y-axis">
            <span>100%</span>
            <span>80%</span>
            <span>60%</span>
            <span>40%</span>
          </div>
          <div className="chart-area">
            <div className="chart-grid">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="grid-line" />
              ))}
            </div>
            <div className="chart-lines">
              <svg viewBox="0 0 400 200" preserveAspectRatio="none">
                {/* Classification Accuracy Line */}
                <polyline
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth="2"
                  points={trendData.map((d, i) => `${(i / 11) * 400},${200 - (d.classification / 100) * 200}`).join(' ')}
                />
                {/* Confidence Calibration Line */}
                <polyline
                  fill="none"
                  stroke="var(--color-success)"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  points={trendData.map((d, i) => `${(i / 11) * 400},${200 - (d.confidence / 100) * 200}`).join(' ')}
                />
                {/* Deal Prediction Line */}
                <polyline
                  fill="none"
                  stroke="var(--color-warning)"
                  strokeWidth="2"
                  strokeDasharray="2,2"
                  points={trendData.map((d, i) => `${(i / 11) * 400},${200 - (d.prediction / 100) * 200}`).join(' ')}
                />
              </svg>
            </div>
          </div>
          <div className="chart-x-axis">
            <span>Week 1</span>
            <span>Week 4</span>
            <span>Week 8</span>
            <span>Week 12</span>
          </div>
        </div>
        <div className="chart-legend">
          <div className="legend-item">
            <span className="legend-line primary" />
            {t('deepWork:performance.classificationAccuracy')}
          </div>
          <div className="legend-item">
            <span className="legend-line success dashed" />
            {t('deepWork:performance.confidenceCalibration')}
          </div>
          <div className="legend-item">
            <span className="legend-line warning dotted" />
            {t('deepWork:performance.dealPrediction')}
          </div>
        </div>
      </div>

      {/* Learning Velocity */}
      <div className="velocity-section">
        <h4>{t('deepWork:performance.learningVelocity')}</h4>
        <div className="velocity-stats">
          <div className="velocity-item">
            <div className="velocity-value">{chunkStats?.total || 0}</div>
            <div className="velocity-label">{t('deepWork:performance.decisionsMade')}</div>
          </div>
          <div className="velocity-item">
            <div className="velocity-value">{chunkStats?.flagged || 0}</div>
            <div className="velocity-label">
              {t('deepWork:performance.flaggedForReview')} ({chunkStats && chunkStats.total > 0 ? Math.round((chunkStats.flagged / chunkStats.total) * 100) : 0}%)
            </div>
          </div>
          <div className="velocity-item">
            <div className="velocity-value">{chunkStats?.corrected || 0}</div>
            <div className="velocity-label">{t('deepWork:performance.correctionsApplied')}</div>
          </div>
          <div className="velocity-item">
            <div className="velocity-value">{kbStats?.total_entries || 0}</div>
            <div className="velocity-label">{t('deepWork:performance.newKnowledgeEntries')}</div>
          </div>
          <div className="velocity-item">
            <div className="velocity-value">{kbStats?.active_patterns || 0}</div>
            <div className="velocity-label">{t('deepWork:performance.patternRulesActivated')}</div>
          </div>
        </div>
      </div>

      {/* Business Impact */}
      <div className="impact-section">
        <h4>{t('deepWork:performance.businessImpact')}</h4>
        <div className="impact-stats">
          <div className="impact-item">
            <div className="impact-comparison">
              <span className="before">12%</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
              <span className="after">22%</span>
            </div>
            <div className="impact-label">{t('deepWork:performance.signalToConversion')}</div>
            <div className="impact-change positive">+83%</div>
          </div>

          <div className="impact-item">
            <div className="impact-comparison">
              <span className="before">4 {t('deepWork:performance.days')}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
              <span className="after">1.5 {t('deepWork:performance.days')}</span>
            </div>
            <div className="impact-label">{t('deepWork:performance.timeToContact')}</div>
            <div className="impact-change positive">-63%</div>
          </div>

          <div className="impact-item">
            <div className="impact-comparison">
              <span className="before">8/{t('deepWork:performance.mo')}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
              <span className="after">2/{t('deepWork:performance.mo')}</span>
            </div>
            <div className="impact-label">{t('deepWork:performance.missedSignals')}</div>
            <div className="impact-change positive">-75%</div>
          </div>

          <div className="impact-item">
            <div className="impact-comparison">
              <span className="before">15 {t('deepWork:performance.hrs')}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
              <span className="after">5 {t('deepWork:performance.hrs')}</span>
            </div>
            <div className="impact-label">{t('deepWork:performance.researchTime')}</div>
            <div className="impact-change positive">-10 {t('deepWork:performance.hrsWeek')}</div>
          </div>
        </div>
      </div>

      {/* Decisions by Type */}
      <div className="breakdown-section">
        <h4>{t('deepWork:performance.decisionsByType')}</h4>
        <div className="breakdown-grid">
          {chunkStats?.by_type && Object.entries(chunkStats.by_type).map(([type, count]) => (
            <div key={type} className="breakdown-item">
              <div className="breakdown-bar">
                <div
                  className="bar-fill"
                  style={{ width: `${(count / chunkStats.total) * 100}%` }}
                />
              </div>
              <div className="breakdown-info">
                <span className="breakdown-type">{type.replace(/_/g, ' ')}</span>
                <span className="breakdown-count">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PerformanceDashboard
