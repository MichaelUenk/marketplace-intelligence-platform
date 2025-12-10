import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import HealthStatus from './components/HealthStatus'
import CompanyList from './components/CompanyList'
import PeopleList from './components/PeopleList'
import Search from './components/Search'
import Login from './components/Login'
import DarkModeToggle from './components/DarkModeToggle'
import Dashboard from './components/Dashboard'
import { LeadsDashboard } from './components/leads'
import { BowtieDashboard } from './components/bowtie'
import { PipelineKanban } from './components/pipeline'
import { OutreachSequences } from './components/outreach'
import { SignalsDashboard } from './components/signals'
import IntentDashboard from './components/intent/IntentDashboard'
import { AppLayout } from './components/layout'
import { DealDetail } from './components/deals'
import { IntegrationsSettings } from './components/settings'
import { ThoughtLeadershipDashboard } from './components/thought-leadership'
import { DeepWorkDashboard } from './components/deep-work'
import { LanguageSelector } from './components/ui/LanguageSelector'
import { api } from './services/api'
import { useDarkMode } from './context/DarkModeContext'

type Page = 'dashboard' | 'pipeline' | 'leads' | 'deals' | 'deal-detail' | 'contacts' | 'signals' | 'intent' | 'sequences' | 'thought-leadership' | 'deep-work' | 'analytics' | 'settings' | 'help'

function App() {
  const { t } = useTranslation(['common', 'dashboard', 'leads', 'deals', 'signals', 'outreach', 'deepWork'])
  const { isDarkMode } = useDarkMode()
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('isAuthenticated') === 'true'
  })
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [searchQuery, setSearchQuery] = useState('')
  const [useGoogle, setUseGoogle] = useState(true)
  const [useHunter, setUseHunter] = useState(false)
  const [limit, setLimit] = useState(10)
  const [ingesting, setIngesting] = useState(false)
  const [ingestStatus, setIngestStatus] = useState<string | null>(null)
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null)

  const handleViewDeal = (dealId: string) => {
    setSelectedDealId(dealId)
    setCurrentPage('deal-detail')
  }

  const handleBackFromDeal = () => {
    setSelectedDealId(null)
    setCurrentPage('deals')
  }

  const handleIngest = async () => {
    if (!searchQuery.trim()) {
      setIngestStatus('Please enter a search query')
      return
    }

    try {
      setIngesting(true)
      setIngestStatus(t('common:status.loading'))

      const result = await api.ingestCompanies(
        searchQuery.trim(),
        limit,
        useGoogle,
        useHunter,
        true,
        true
      )

      if (result.error || !result.success) {
        setIngestStatus(`${t('common:status.error')}: ${result.error || 'Unknown error'}`)
      } else {
        setIngestStatus(`${t('common:status.success')}! Batch: ${result.batch_id || 'N/A'}`)
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (err) {
      setIngestStatus(`${t('common:status.error')}: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIngesting(false)
    }
  }

  const handleLogin = () => {
    setIsAuthenticated(true)
    sessionStorage.setItem('isAuthenticated', 'true')
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  // Render page content based on current page
  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />

      case 'pipeline':
        return <PipelineKanban />

      case 'leads':
        return (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">{t('leads:title')}</h1>
                <p className="page-subtitle">{t('leads:subtitle', { count: 12 })}</p>
              </div>
              <div className="page-actions">
                <button className="btn btn-primary">{t('leads:addLead')}</button>
                <DarkModeToggle />
              </div>
            </div>
            <LeadsDashboard />
          </div>
        )

      case 'deals':
        return (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">{t('deals:title')}</h1>
                <p className="page-subtitle">{t('deals:subtitle', { count: 47 })}</p>
              </div>
              <div className="page-actions">
                <button className="btn btn-primary">{t('deals:addDeal')}</button>
                <button className="btn btn-secondary" onClick={() => handleViewDeal('demo')}>
                  {t('deals:viewDemoDeal')}
                </button>
                <DarkModeToggle />
              </div>
            </div>
            <CompanyList />
          </div>
        )

      case 'deal-detail':
        return <DealDetail onBack={handleBackFromDeal} />

      case 'contacts':
        return (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">{t('common:navigation.contacts')}</h1>
                <p className="page-subtitle">{t('deals:buyingCommittee.title')}</p>
              </div>
              <div className="page-actions">
                <button className="btn btn-primary">{t('common:actions.add')}</button>
                <DarkModeToggle />
              </div>
            </div>
            <PeopleList />
          </div>
        )

      case 'signals':
        return (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">{t('signals:title')}</h1>
                <p className="page-subtitle">{t('signals:subtitle')}</p>
              </div>
              <div className="page-actions">
                <DarkModeToggle />
              </div>
            </div>
            <SignalsDashboard />
          </div>
        )

      case 'intent':
        return <IntentDashboard />

      case 'sequences':
        return (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">{t('outreach:title')}</h1>
                <p className="page-subtitle">{t('outreach:subtitle')}</p>
              </div>
              <div className="page-actions">
                <button className="btn btn-primary">{t('outreach:createSequence')}</button>
                <DarkModeToggle />
              </div>
            </div>
            <OutreachSequences />
          </div>
        )

      case 'thought-leadership':
        return (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">{t('common:navigation.thoughtLeadership')}</h1>
                <p className="page-subtitle">{t('dashboard:thoughtLeadership.subtitle')}</p>
              </div>
              <div className="page-actions">
                <DarkModeToggle />
              </div>
            </div>
            <ThoughtLeadershipDashboard />
          </div>
        )

      case 'deep-work':
        return <DeepWorkDashboard />

      case 'analytics':
        return (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">{t('dashboard:analytics.title')}</h1>
                <p className="page-subtitle">{t('dashboard:analytics.subtitle')}</p>
              </div>
              <div className="page-actions">
                <DarkModeToggle />
              </div>
            </div>
            <LeadsDashboard />
          </div>
        )

      case 'settings':
        return (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">{t('dashboard:settings.title')}</h1>
                <p className="page-subtitle">{t('dashboard:settings.subtitle')}</p>
              </div>
              <div className="page-actions">
                <DarkModeToggle />
              </div>
            </div>

            {/* Integrations Section */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">{t('dashboard:settings.integrations')}</h3>
              </div>
              <div className="card-content">
                <p className="text-body-sm" style={{ marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
                  {t('dashboard:settings.integrationsDescription')}
                </p>
                <IntegrationsSettings />
              </div>
            </div>

            {/* Language Section */}
            <div className="card" style={{ marginTop: '24px' }}>
              <div className="card-header">
                <h3 className="card-title">{t('common:language.title')}</h3>
              </div>
              <div className="card-content">
                <LanguageSelector variant="expanded" />
              </div>
            </div>

            {/* API Status Section */}
            <div className="card" style={{ marginTop: '24px' }}>
              <div className="card-header">
                <h3 className="card-title">{t('dashboard:settings.apiStatus')}</h3>
              </div>
              <div className="card-content">
                <HealthStatus />
              </div>
            </div>

            {/* Search Section */}
            <div className="card" style={{ marginTop: '24px' }}>
              <div className="card-header">
                <h3 className="card-title">{t('common:actions.search')}</h3>
              </div>
              <div className="card-content">
                <Search />
              </div>
            </div>
          </div>
        )

      case 'help':
        return (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">{t('dashboard:help.title')}</h1>
                <p className="page-subtitle">{t('dashboard:help.subtitle')}</p>
              </div>
              <div className="page-actions">
                <DarkModeToggle />
              </div>
            </div>
            <div className="card">
              <div className="card-content">
                <h3 style={{ marginBottom: '16px' }}>{t('dashboard:help.documentation')}</h3>
                <p>{t('dashboard:help.contactSupport')}: support@ibood.com</p>
              </div>
            </div>
          </div>
        )

      default:
        return <BowtieDashboard />
    }
  }

  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page)
  }

  return (
    <div data-theme={isDarkMode ? 'dark' : 'light'}>
      <AppLayout currentPage={currentPage} onNavigate={handleNavigate}>
        {renderPageContent()}
      </AppLayout>
    </div>
  )
}

export default App
