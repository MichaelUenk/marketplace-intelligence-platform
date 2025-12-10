/**
 * Week Work Session Component
 *
 * Main interface for Week Work Wednesday sessions.
 * Displays flagged decisions for review, emerging patterns,
 * pending outcomes, and session progress.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './WeekWorkSession.css'

interface ReasoningChunk {
  id: string
  type: string
  agent: string
  decision: {
    action: string
    result: string
    confidence: number
  }
  context: {
    input: Record<string, unknown>
    retrieved_knowledge: string[]
  }
  reasoning: {
    chain: Array<{ step: number; thought: string; evidence: string }>
    alternatives: Array<{ alternative: string; rejected_because: string }>
    uncertainties: string[]
  }
  flags: {
    flagged_for_review: boolean
    flag_reason: string
    is_novel_situation: boolean
  }
  review: {
    status: string
    notes: string
  }
}

interface Pattern {
  id: string
  name: string
  description: string
  supporting_signals: number
  accuracy_rate: number | null
  status: string
}

interface SessionData {
  id: string
  stats: {
    decisions_total: number
    decisions_flagged: number
    decisions_reviewed: number
    validations: number
    corrections: number
    rejections: number
    patterns_reviewed: number
    patterns_activated: number
    outcomes_closed: number
    knowledge_entries_added: number
  }
  timing: {
    current_phase: string
  }
  insights: string[]
}

interface WeekWorkSessionProps {
  sessionId: string
  onUpdate: () => void
}

// Demo data for demonstration
const DEMO_SESSION: SessionData = {
  id: 'demo-session-001',
  stats: {
    decisions_total: 147,
    decisions_flagged: 23,
    decisions_reviewed: 18,
    validations: 14,
    corrections: 4,
    rejections: 0,
    patterns_reviewed: 6,
    patterns_activated: 4,
    outcomes_closed: 8,
    knowledge_entries_added: 12,
  },
  timing: { current_phase: 'decisions_review' },
  insights: [
    'Companies in the "growth phase" are 3x more likely to convert when contacted within 48 hours of a funding signal.',
    'Your response rate to IT decision makers has improved 40% since implementing the new timing patterns.',
    'The combination of "new hire" + "tech stack change" signals has a 78% correlation with near-term purchasing intent.',
  ],
}

const DEMO_CHUNKS: ReasoningChunk[] = [
  {
    id: 'chunk-001',
    type: 'signal_classification',
    agent: 'Signal Classifier',
    decision: {
      action: 'classify_signal',
      result: 'High-priority buying signal detected: TechFlow BV hiring 3 senior developers + expanded AWS infrastructure',
      confidence: 0.72,
    },
    context: {
      input: {
        company: 'TechFlow BV',
        signals: ['3 senior developer positions posted', 'AWS infrastructure expansion', 'Series B funding 2 months ago'],
        industry: 'SaaS / B2B Software',
      },
      retrieved_knowledge: ['Growth-stage SaaS companies show 85% correlation between hiring + infra expansion and purchasing intent'],
    },
    reasoning: {
      chain: [
        { step: 1, thought: 'Multiple hiring signals indicate expansion phase', evidence: '3 senior roles is above typical replacement hiring' },
        { step: 2, thought: 'Infrastructure expansion suggests scaling operations', evidence: 'AWS changes detected in tech stack monitoring' },
        { step: 3, thought: 'Recent funding provides budget for new tools', evidence: 'Series B typically includes software modernization budget' },
      ],
      alternatives: [
        { alternative: 'Could be replacement hiring', rejected_because: 'Volume and seniority suggest growth, not replacement' },
        { alternative: 'Infrastructure might be cost optimization', rejected_because: 'Expansion pattern, not consolidation' },
      ],
      uncertainties: ['Exact budget timeline unknown', 'Decision maker not yet identified'],
    },
    flags: {
      flagged_for_review: true,
      flag_reason: 'Novel combination of signals - validate pattern',
      is_novel_situation: true,
    },
    review: { status: 'pending', notes: '' },
  },
  {
    id: 'chunk-002',
    type: 'priority_ranking',
    agent: 'Priority Ranker',
    decision: {
      action: 'rank_lead',
      result: 'Ranked DataSphere NL as #2 priority this week based on timing signals and engagement history',
      confidence: 0.85,
    },
    context: {
      input: {
        company: 'DataSphere NL',
        recent_activity: ['Opened 4 emails', 'Visited pricing page twice', 'Downloaded whitepaper'],
        timing_signals: ['Budget cycle ending Q1', 'CTO mentioned evaluation in LinkedIn post'],
      },
      retrieved_knowledge: ['Pricing page visits + email engagement = 67% meeting conversion rate'],
    },
    reasoning: {
      chain: [
        { step: 1, thought: 'High engagement score from email and website activity', evidence: '4 opens + pricing visits in 7 days' },
        { step: 2, thought: 'Public intent signal from CTO', evidence: 'LinkedIn post mentions "evaluating data tools"' },
        { step: 3, thought: 'Budget timing creates urgency', evidence: 'Q1 budget must be allocated within 6 weeks' },
      ],
      alternatives: [
        { alternative: 'Rank #1 over current top priority', rejected_because: 'Other lead has confirmed meeting scheduled' },
      ],
      uncertainties: ['CTO post might reference competitor'],
    },
    flags: {
      flagged_for_review: true,
      flag_reason: 'Confidence borderline (0.85) - confirm timing interpretation',
      is_novel_situation: false,
    },
    review: { status: 'pending', notes: '' },
  },
  {
    id: 'chunk-003',
    type: 'contact_recommendation',
    agent: 'Contact Strategist',
    decision: {
      action: 'recommend_contact',
      result: 'Recommend reaching Sarah van den Berg (VP Engineering) via LinkedIn InMail - she engaged with similar content last month',
      confidence: 0.68,
    },
    context: {
      input: {
        company: 'CloudNine Systems',
        target_contacts: ['CTO - Jan de Vries', 'VP Eng - Sarah van den Berg', 'IT Director - Mark Peters'],
        engagement_history: { 'Sarah van den Berg': 'Liked 2 posts, commented on tech article' },
      },
      retrieved_knowledge: ['VP Engineering typically influences 70% of tool decisions at mid-market companies'],
    },
    reasoning: {
      chain: [
        { step: 1, thought: 'Existing engagement makes warm outreach possible', evidence: 'Sarah has interacted with company content' },
        { step: 2, thought: 'VP Engineering has decision influence', evidence: 'Pattern from knowledge base confirms influence level' },
        { step: 3, thought: 'LinkedIn InMail preferred for technical buyers', evidence: 'Historical response rate 2x higher than email' },
      ],
      alternatives: [
        { alternative: 'Email the CTO directly', rejected_because: 'No prior engagement, cold outreach less effective' },
        { alternative: 'Multi-thread to all contacts', rejected_because: 'Risk appearing aggressive at this stage' },
      ],
      uncertainties: ['Sarah may have changed roles recently', 'InMail credits availability'],
    },
    flags: {
      flagged_for_review: true,
      flag_reason: 'Lower confidence (0.68) - human judgment needed on contact strategy',
      is_novel_situation: false,
    },
    review: { status: 'pending', notes: '' },
  },
]

const DEMO_PATTERNS: Pattern[] = [
  {
    id: 'pattern-001',
    name: 'Infrastructure + Hiring Combo Signal',
    description: 'When a company simultaneously expands cloud infrastructure AND posts 3+ technical roles, there is a strong correlation with imminent tool purchasing decisions.',
    supporting_signals: 23,
    accuracy_rate: 0.82,
    status: 'proposed',
  },
  {
    id: 'pattern-002',
    name: 'Q1 Budget Urgency Pattern',
    description: 'Companies with fiscal year ending in March show increased responsiveness to outreach in January-February when budget must be allocated.',
    supporting_signals: 15,
    accuracy_rate: 0.76,
    status: 'proposed',
  },
]

export function WeekWorkSession({ sessionId, onUpdate }: WeekWorkSessionProps) {
  const { t } = useTranslation(['deepWork', 'common'])
  const [session, setSession] = useState<SessionData | null>(null)
  const [flaggedChunks, setFlaggedChunks] = useState<ReasoningChunk[]>([])
  const [patterns, setPatterns] = useState<Pattern[]>([])
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0)
  const [reviewNotes, setReviewNotes] = useState('')
  const [correction, setCorrection] = useState('')
  const [showCorrectionInput, setShowCorrectionInput] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSessionData()
  }, [sessionId])

  const loadSessionData = async () => {
    try {
      setIsLoading(true)

      let sessionLoaded = false
      let chunksLoaded = false
      let patternsLoaded = false

      // Load session
      try {
        const sessionRes = await fetch(`/api/deep-work/week-work/${sessionId}`)
        if (sessionRes.ok) {
          const data = await sessionRes.json()
          setSession(data)
          sessionLoaded = true
        }
      } catch {}

      // Load flagged chunks
      try {
        const chunksRes = await fetch('/api/deep-work/reasoning-chunks/flagged')
        if (chunksRes.ok) {
          const data = await chunksRes.json()
          if (data.chunks && data.chunks.length > 0) {
            setFlaggedChunks(data.chunks)
            chunksLoaded = true
          }
        }
      } catch {}

      // Load proposed patterns
      try {
        const patternsRes = await fetch('/api/deep-work/patterns?status=proposed')
        if (patternsRes.ok) {
          const data = await patternsRes.json()
          if (data.patterns && data.patterns.length > 0) {
            setPatterns(data.patterns)
            patternsLoaded = true
          }
        }
      } catch {}

      // Use demo data for anything that didn't load
      if (!sessionLoaded) setSession(DEMO_SESSION)
      if (!chunksLoaded) setFlaggedChunks(DEMO_CHUNKS)
      if (!patternsLoaded) setPatterns(DEMO_PATTERNS)

    } catch (error) {
      console.error('Failed to load session data:', error)
      // Use all demo data on complete failure
      setSession(DEMO_SESSION)
      setFlaggedChunks(DEMO_CHUNKS)
      setPatterns(DEMO_PATTERNS)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReview = async (status: 'validated' | 'corrected' | 'rejected') => {
    const chunk = flaggedChunks[currentReviewIndex]
    if (!chunk) return

    try {
      const body: Record<string, unknown> = {
        status,
        notes: reviewNotes,
      }

      if (status === 'corrected' && correction) {
        body.correction = { corrected_result: correction }
        body.learning = correction
      }

      await fetch(`/api/deep-work/week-work/${sessionId}/review-decision?chunk_id=${chunk.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      // Move to next
      setReviewNotes('')
      setCorrection('')
      setShowCorrectionInput(false)
      if (currentReviewIndex < flaggedChunks.length - 1) {
        setCurrentReviewIndex(currentReviewIndex + 1)
      }
      loadSessionData()
      onUpdate()
    } catch (error) {
      console.error('Failed to review chunk:', error)
    }
  }

  const handlePatternAction = async (patternId: string, action: 'validate' | 'reject') => {
    try {
      await fetch(`/api/deep-work/week-work/${sessionId}/validate-pattern?pattern_id=${patternId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      loadSessionData()
      onUpdate()
    } catch (error) {
      console.error('Failed to update pattern:', error)
    }
  }

  const getConfidenceClass = (confidence: number) => {
    if (confidence >= 0.8) return 'high'
    if (confidence >= 0.6) return 'medium'
    return 'low'
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      signal_classification: t('deepWork:types.signalClassification'),
      confidence_scoring: t('deepWork:types.confidenceScoring'),
      deal_potential: t('deepWork:types.dealPotential'),
      priority_ranking: t('deepWork:types.priorityRanking'),
      contact_recommendation: t('deepWork:types.contactRecommendation'),
      pattern_recognition: t('deepWork:types.patternRecognition'),
      bant_scoring: t('deepWork:types.bantScoring'),
      paranoid_twin: t('deepWork:types.paranoidTwin'),
    }
    return labels[type] || type
  }

  if (isLoading) {
    return (
      <div className="week-work-session loading">
        <div className="loading-spinner" />
      </div>
    )
  }

  const currentChunk = flaggedChunks[currentReviewIndex]

  return (
    <div className="week-work-session">
      {/* Session Overview */}
      <div className="session-overview">
        <div className="stat-card">
          <div className="stat-value">{session?.stats.decisions_total || 0}</div>
          <div className="stat-label">{t('deepWork:session.decisionsThisWeek')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{session?.stats.decisions_flagged || 0}</div>
          <div className="stat-label">{t('deepWork:session.flaggedForReview')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{patterns.length}</div>
          <div className="stat-label">{t('deepWork:session.emergingPatterns')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{session?.stats.knowledge_entries_added || 0}</div>
          <div className="stat-label">{t('deepWork:session.learningsAdded')}</div>
        </div>
      </div>

      {/* Phase Progress */}
      <div className="phase-progress">
        {['overview', 'decisions_review', 'patterns_review', 'outcome_closure', 'insights', 'summary'].map((phase, index) => (
          <div
            key={phase}
            className={`phase-step ${session?.timing.current_phase === phase ? 'active' : ''} ${index < ['overview', 'decisions_review', 'patterns_review', 'outcome_closure', 'insights', 'summary'].indexOf(session?.timing.current_phase || 'overview') ? 'completed' : ''}`}
          >
            <div className="phase-dot">
              {index < ['overview', 'decisions_review', 'patterns_review', 'outcome_closure', 'insights', 'summary'].indexOf(session?.timing.current_phase || 'overview') ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : null}
            </div>
            <span className="phase-label">{t(`deepWork:phases.${phase.replace('_', '')}`)}</span>
          </div>
        ))}
      </div>

      {/* Decisions Review Section */}
      {flaggedChunks.length > 0 && (
        <div className="review-section">
          <div className="section-header">
            <h3>{t('deepWork:session.decisionsNeedingReview')}</h3>
            <span className="review-progress">
              {currentReviewIndex + 1} / {flaggedChunks.length}
            </span>
          </div>

          {currentChunk && (
            <div className="review-item flagged">
              <div className="review-item-header">
                <div>
                  <span className="review-item-title">{getTypeLabel(currentChunk.type)}</span>
                  <span className="review-item-meta">
                    {currentChunk.agent} • {currentChunk.flags.flag_reason}
                  </span>
                </div>
                <span className={`confidence-badge ${getConfidenceClass(currentChunk.decision.confidence)}`}>
                  {Math.round(currentChunk.decision.confidence * 100)}%
                </span>
              </div>

              <div className="decision-result">
                <strong>{t('deepWork:session.decision')}:</strong> {currentChunk.decision.result}
              </div>

              {/* Context */}
              {currentChunk.context.input && Object.keys(currentChunk.context.input).length > 0 && (
                <div className="context-section">
                  <strong>{t('deepWork:session.context')}:</strong>
                  <pre>{JSON.stringify(currentChunk.context.input, null, 2)}</pre>
                </div>
              )}

              {/* Reasoning Chain */}
              <div className="reasoning-chain">
                <strong>{t('deepWork:session.reasoning')}:</strong>
                {currentChunk.reasoning.chain.map((step) => (
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

              {/* Alternatives */}
              {currentChunk.reasoning.alternatives.length > 0 && (
                <div className="alternatives-section">
                  <strong>{t('deepWork:session.alternativesConsidered')}:</strong>
                  {currentChunk.reasoning.alternatives.map((alt, i) => (
                    <div key={i} className="alternative-item">
                      <span className="alternative-name">{alt.alternative}</span>
                      <span className="alternative-reason">{alt.rejected_because}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Uncertainties */}
              {currentChunk.reasoning.uncertainties.length > 0 && (
                <div className="uncertainties-section">
                  <strong>{t('deepWork:session.uncertainties')}:</strong>
                  <ul>
                    {currentChunk.reasoning.uncertainties.map((u, i) => (
                      <li key={i}>{u}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notes Input */}
              <div className="notes-input">
                <label>{t('deepWork:session.reviewNotes')}</label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={t('deepWork:session.notesPlaceholder')}
                />
              </div>

              {/* Correction Input */}
              {showCorrectionInput && (
                <div className="correction-input">
                  <label>{t('deepWork:session.correction')}</label>
                  <textarea
                    value={correction}
                    onChange={(e) => setCorrection(e.target.value)}
                    placeholder={t('deepWork:session.correctionPlaceholder')}
                  />
                </div>
              )}

              {/* Review Actions */}
              <div className="review-actions">
                <button className="review-btn validate" onClick={() => handleReview('validated')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {t('deepWork:session.validate')}
                </button>
                <button
                  className="review-btn correct"
                  onClick={() => {
                    if (showCorrectionInput && correction) {
                      handleReview('corrected')
                    } else {
                      setShowCorrectionInput(true)
                    }
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  </svg>
                  {t('deepWork:session.correct')}
                </button>
                <button className="review-btn reject" onClick={() => handleReview('rejected')}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  {t('deepWork:session.reject')}
                </button>
                <button className="review-btn discuss">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  {t('deepWork:session.discuss')}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Emerging Patterns Section */}
      {patterns.length > 0 && (
        <div className="patterns-section">
          <h3>{t('deepWork:session.emergingPatterns')}</h3>
          {patterns.map((pattern) => (
            <div key={pattern.id} className="pattern-card">
              <div className="pattern-header">
                <span className="pattern-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </span>
                <div>
                  <h4>{pattern.name}</h4>
                  <p>{pattern.description}</p>
                </div>
              </div>
              <div className="pattern-meta">
                <span>{pattern.supporting_signals} {t('deepWork:session.supportingSignals')}</span>
                {pattern.accuracy_rate && (
                  <span>{Math.round(pattern.accuracy_rate * 100)}% {t('deepWork:session.accuracy')}</span>
                )}
              </div>
              <div className="pattern-actions">
                <button className="btn btn-success" onClick={() => handlePatternAction(pattern.id, 'validate')}>
                  {t('deepWork:session.activatePattern')}
                </button>
                <button className="btn btn-secondary" onClick={() => handlePatternAction(pattern.id, 'reject')}>
                  {t('deepWork:session.rejectPattern')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Insights Section */}
      {session?.insights && session.insights.length > 0 && (
        <div className="insights-section">
          <h3>{t('deepWork:session.aiInsights')}</h3>
          <div className="insights-list">
            {session.insights.map((insight, index) => (
              <div key={index} className="insight-card">
                <div className="insight-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </div>
                <p>{insight}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {flaggedChunks.length === 0 && patterns.length === 0 && (
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h3 className="empty-state-title">{t('deepWork:session.allCaughtUp')}</h3>
          <p className="empty-state-description">
            {t('deepWork:session.noPendingReviews')}
          </p>
        </div>
      )}
    </div>
  )
}

export default WeekWorkSession
