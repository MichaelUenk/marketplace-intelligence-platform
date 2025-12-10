/**
 * Deep Work Dashboard
 *
 * Main dashboard for Intelligence & Deep Work module.
 * Provides collaborative environment for Week Work Wednesday sessions
 * with AI chat, reasoning review, and knowledge base management.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChatInterface } from './ChatInterface'
import { KnowledgeBaseView } from './KnowledgeBaseView'
import { ReasoningLogView } from './ReasoningLogView'
import { PerformanceDashboard } from './PerformanceDashboard'
import { WeekWorkSession } from './WeekWorkSession'
import './DeepWorkDashboard.css'

type Tab = 'session' | 'knowledge' | 'reasoning' | 'performance'

interface SessionStats {
  id: string
  decisions_total: number
  decisions_flagged: number
  decisions_reviewed: number
  validations: number
  corrections: number
  patterns_reviewed: number
  outcomes_closed: number
  current_phase: string
}

export function DeepWorkDashboard() {
  const { t } = useTranslation(['deepWork', 'common'])
  const [activeTab, setActiveTab] = useState<Tab>('session')
  const [session, setSession] = useState<SessionStats | null>(null)
  const [chatSessionId, setChatSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCurrentSession()
  }, [])

  // Demo data for demonstration purposes
  const DEMO_SESSION: SessionStats = {
    id: 'demo-session-001',
    decisions_total: 147,
    decisions_flagged: 23,
    decisions_reviewed: 18,
    validations: 14,
    corrections: 4,
    patterns_reviewed: 6,
    outcomes_closed: 8,
    current_phase: 'decisions_review',
  }

  const loadCurrentSession = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/deep-work/week-work/current')
      if (response.ok) {
        const data = await response.json()
        setSession(data)

        // Create chat session for week work
        const chatResponse = await fetch('/api/deep-work/chat/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_type: 'week_work',
            week_work_session_id: data.id,
          }),
        })
        if (chatResponse.ok) {
          const chatData = await chatResponse.json()
          setChatSessionId(chatData.id)
        }
      } else {
        // Use demo data when API is not available
        setSession(DEMO_SESSION)
        setChatSessionId('demo-chat-001')
      }
    } catch (error) {
      console.error('Failed to load session:', error)
      // Use demo data when API fails
      setSession(DEMO_SESSION)
      setChatSessionId('demo-chat-001')
    } finally {
      setIsLoading(false)
    }
  }

  const getPhaseLabel = (phase: string) => {
    const phases: Record<string, string> = {
      overview: t('deepWork:phases.overview'),
      decisions_review: t('deepWork:phases.decisionsReview'),
      patterns_review: t('deepWork:phases.patternsReview'),
      outcome_closure: t('deepWork:phases.outcomeClosure'),
      insights: t('deepWork:phases.insights'),
      summary: t('deepWork:phases.summary'),
    }
    return phases[phase] || phase
  }

  if (isLoading) {
    return (
      <div className="deep-work-dashboard loading">
        <div className="loading-spinner" />
        <p>{t('common:status.loading')}</p>
      </div>
    )
  }

  return (
    <div className="deep-work-dashboard">
      {/* Header */}
      <div className="deep-work-header">
        <div className="header-info">
          <h1>{t('deepWork:title')}</h1>
          <p className="subtitle">{t('deepWork:subtitle')}</p>
        </div>

        {session && (
          <div className="session-status">
            <span className="status-badge active">
              {getPhaseLabel(session.current_phase)}
            </span>
            <div className="session-stats-mini">
              <span>{session.decisions_reviewed}/{session.decisions_flagged} {t('deepWork:reviewed')}</span>
              <span className="divider">|</span>
              <span>{session.validations} {t('deepWork:validated')}</span>
              <span className="divider">|</span>
              <span>{session.corrections} {t('deepWork:corrected')}</span>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="deep-work-tabs">
        <button
          className={`tab ${activeTab === 'session' ? 'active' : ''}`}
          onClick={() => setActiveTab('session')}
        >
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
          {t('deepWork:tabs.session')}
        </button>
        <button
          className={`tab ${activeTab === 'knowledge' ? 'active' : ''}`}
          onClick={() => setActiveTab('knowledge')}
        >
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          {t('deepWork:tabs.knowledgeBase')}
        </button>
        <button
          className={`tab ${activeTab === 'reasoning' ? 'active' : ''}`}
          onClick={() => setActiveTab('reasoning')}
        >
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          {t('deepWork:tabs.reasoningLog')}
        </button>
        <button
          className={`tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          <svg className="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          {t('deepWork:tabs.performance')}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="deep-work-content">
        {/* Left Panel - Tab Content */}
        <div className="content-panel main-panel">
          {activeTab === 'session' && session && (
            <WeekWorkSession
              sessionId={session.id}
              onUpdate={loadCurrentSession}
            />
          )}
          {activeTab === 'knowledge' && <KnowledgeBaseView />}
          {activeTab === 'reasoning' && <ReasoningLogView />}
          {activeTab === 'performance' && <PerformanceDashboard />}
        </div>

        {/* Right Panel - AI Chat */}
        <div className="content-panel chat-panel">
          <ChatInterface
            sessionId={chatSessionId}
            onNewSession={(id) => setChatSessionId(id)}
          />
        </div>
      </div>
    </div>
  )
}

export default DeepWorkDashboard
