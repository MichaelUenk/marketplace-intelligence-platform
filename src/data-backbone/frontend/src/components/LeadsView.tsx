import { useState, useEffect } from 'react';
import { api } from '../services/api';
import CompanyDetails from './CompanyDetails';

interface Company {
  id: string;
  name: string;
  domain: string;
  industry?: string;
  location?: string;
  employee_count?: number;
}

interface Lead {
  company: Company;
  people_count: number;
  createdAt: Date;
  status: 'new' | 'contacted' | 'qualified' | 'converted';
}

interface IndustryAnalyticsItem {
  industry: string | null;
  company_count: number;
  companies?: Company[];
}

// Simulated lead creation times (in a real app, this would come from the backend)
const getLeadCreatedAt = (index: number): Date => {
  const now = new Date();
  // Spread leads across 0-5 hours ago
  const hoursAgo = (index * 0.7) % 5;
  return new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
};

const formatTimeRemaining = (createdAt: Date): { text: string; urgent: boolean; expired: boolean } => {
  const now = new Date();
  const elapsed = now.getTime() - createdAt.getTime();
  const fourHours = 4 * 60 * 60 * 1000;
  const remaining = fourHours - elapsed;

  if (remaining <= 0) {
    return { text: 'Expired', urgent: true, expired: true };
  }

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));

  if (hours === 0 && minutes < 30) {
    return { text: `${minutes}m left`, urgent: true, expired: false };
  }
  if (hours === 0) {
    return { text: `${minutes}m left`, urgent: true, expired: false };
  }
  return { text: `${hours}h ${minutes}m left`, urgent: hours < 1, expired: false };
};

const getProgressPercent = (createdAt: Date): number => {
  const now = new Date();
  const elapsed = now.getTime() - createdAt.getTime();
  const fourHours = 4 * 60 * 60 * 1000;
  const percent = Math.max(0, Math.min(100, ((fourHours - elapsed) / fourHours) * 100));
  return percent;
};

const getProgressColor = (percent: number): string => {
  if (percent > 50) return '#10B981'; // Green
  if (percent > 25) return '#F59E0B'; // Yellow/Orange
  return '#EF4444'; // Red
};

export default function LeadsView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [useGoogle, setUseGoogle] = useState(true);
  const [useHunter, setUseHunter] = useState(false);
  const [limit, setLimit] = useState(10);
  const [ingesting, setIngesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCompanyDomain, setSelectedCompanyDomain] = useState<string | null>(null);
  const [, setTick] = useState(0); // For forcing re-render every minute

  // Force re-render every minute to update timers
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load all leads from all industries
  useEffect(() => {
    const loadLeads = async () => {
      try {
        setLoading(true);
        const data = await api.getIndustryAnalytics() as IndustryAnalyticsItem[];

        const allLeads: Lead[] = [];
        let index = 0;

        data.forEach((item: IndustryAnalyticsItem) => {
          if (item.companies && Array.isArray(item.companies)) {
            item.companies.forEach((company: Company) => {
              allLeads.push({
                company: {
                  ...company,
                  industry: item.industry || 'Unclassified'
                },
                people_count: 0,
                createdAt: getLeadCreatedAt(index),
                status: index % 4 === 0 ? 'contacted' : 'new'
              });
              index++;
            });
          }
        });

        // Sort by time remaining (most urgent first)
        allLeads.sort((a, b) => {
          const remainingA = 4 * 60 * 60 * 1000 - (new Date().getTime() - a.createdAt.getTime());
          const remainingB = 4 * 60 * 60 * 1000 - (new Date().getTime() - b.createdAt.getTime());
          return remainingA - remainingB;
        });

        setLeads(allLeads);
      } catch (err) {
        console.error('Failed to load leads:', err);
      } finally {
        setLoading(false);
      }
    };

    loadLeads();

    const handleDataUpdate = () => {
      loadLeads();
    };
    window.addEventListener('dataUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdate);
    };
  }, []);

  const handleIngest = async () => {
    if (!searchQuery.trim()) {
      setIngestStatus('Please enter a search query');
      return;
    }

    try {
      setIngesting(true);
      setIngestStatus('Loading data...');

      const result = await api.ingestCompanies(
        searchQuery.trim(),
        limit,
        useGoogle,
        useHunter,
        true,
        true
      );

      if (result.error || !result.success) {
        setIngestStatus(`Error: ${result.error || 'Unknown error'}`);
      } else {
        setIngestStatus(`Loaded! Batch: ${result.batch_id || 'N/A'}`);
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('dataUpdated'));
          setIngestStatus(null);
        }, 2000);
      }
    } catch (err) {
      setIngestStatus(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIngesting(false);
    }
  };

  const handleAction = (lead: Lead, action: 'contact' | 'qualify' | 'dismiss') => {
    console.log(`Action: ${action} for lead:`, lead.company.name);
    // In a real app, this would update the backend
    setLeads(prev => prev.map(l => {
      if (l.company.id === lead.company.id) {
        if (action === 'contact') return { ...l, status: 'contacted' as const };
        if (action === 'qualify') return { ...l, status: 'qualified' as const };
        if (action === 'dismiss') return { ...l, status: 'converted' as const };
      }
      return l;
    }));
  };

  if (selectedCompanyDomain) {
    return (
      <CompanyDetails
        domain={selectedCompanyDomain}
        onClose={() => setSelectedCompanyDomain(null)}
      />
    );
  }

  return (
    <div>
      {/* Search & Import Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: '#111827',
          marginBottom: '1rem'
        }}>
          Import New Leads
        </h3>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
            Search Companies
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="e.g., 'HR companies in Austin' or 'tech companies in San Francisco'"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              outline: 'none',
              boxSizing: 'border-box'
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !ingesting) {
                handleIngest();
              }
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="useGoogle"
              checked={useGoogle}
              onChange={(e) => setUseGoogle(e.target.checked)}
              disabled={ingesting}
              style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
            />
            <label htmlFor="useGoogle" style={{ fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
              Google Places
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="useHunter"
              checked={useHunter}
              onChange={(e) => setUseHunter(e.target.checked)}
              disabled={ingesting || !useGoogle}
              style={{ width: '1rem', height: '1rem', cursor: 'pointer' }}
            />
            <label htmlFor="useHunter" style={{ fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
              Hunter.io (enrich with people)
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.875rem', color: '#374151' }}>
              Limit:
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
              disabled={ingesting}
              style={{
                width: '4rem',
                padding: '0.375rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <button
          onClick={handleIngest}
          disabled={ingesting || !searchQuery.trim() || !useGoogle}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: ingesting || !searchQuery.trim() || !useGoogle ? '#9ca3af' : '#10B981',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            cursor: ingesting || !searchQuery.trim() || !useGoogle ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          {ingesting ? 'Loading...' : 'Import Leads'}
        </button>

        {ingestStatus && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            borderRadius: '0.375rem',
            backgroundColor: ingestStatus.includes('Loaded') ? '#d1fae5' : ingestStatus.includes('Error') ? '#fee2e2' : '#fef3c7',
            color: ingestStatus.includes('Loaded') ? '#065f46' : ingestStatus.includes('Error') ? '#991b1b' : '#92400e',
            fontSize: '0.875rem'
          }}>
            {ingestStatus.includes('Loaded') && '✅ '}
            {ingestStatus.includes('Error') && '❌ '}
            {ingestStatus.includes('Loading') && '⏳ '}
            {ingestStatus}
          </div>
        )}
      </div>

      {/* Leads List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#111827',
            margin: 0
          }}>
            Active Leads
          </h3>
          <span style={{
            fontSize: '0.875rem',
            color: '#6b7280'
          }}>
            {leads.length} leads
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', margin: 0 }}>Loading leads...</p>
          </div>
        ) : leads.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', margin: 0 }}>
              No leads yet. Import some companies to get started.
            </p>
          </div>
        ) : (
          <div>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 140px 120px',
              gap: '1rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f9fafb',
              borderBottom: '1px solid #e5e7eb',
              fontSize: '0.75rem',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              <div>Company</div>
              <div>Industry</div>
              <div>Location</div>
              <div>Time Remaining</div>
              <div>Action</div>
            </div>

            {/* Table Rows */}
            {leads.map((lead, index) => {
              const timeInfo = formatTimeRemaining(lead.createdAt);
              const progressPercent = getProgressPercent(lead.createdAt);
              const progressColor = getProgressColor(progressPercent);

              return (
                <div
                  key={lead.company.id || index}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 140px 120px',
                    gap: '1rem',
                    padding: '1rem 1.5rem',
                    borderBottom: '1px solid #e5e7eb',
                    alignItems: 'center',
                    backgroundColor: timeInfo.expired ? '#fef2f2' : lead.status === 'contacted' ? '#f0fdf4' : 'white',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {/* Company */}
                  <div>
                    <div
                      onClick={() => setSelectedCompanyDomain(lead.company.domain)}
                      style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#111827',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#3b82f6';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#111827';
                      }}
                    >
                      {lead.company.name}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      marginTop: '0.25rem'
                    }}>
                      {lead.company.domain}
                    </div>
                  </div>

                  {/* Industry */}
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#4b5563'
                  }}>
                    {lead.company.industry || 'N/A'}
                  </div>

                  {/* Location */}
                  <div style={{
                    fontSize: '0.875rem',
                    color: '#4b5563'
                  }}>
                    {lead.company.location || 'N/A'}
                  </div>

                  {/* Timer */}
                  <div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.25rem'
                    }}>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: timeInfo.urgent ? '#EF4444' : '#111827'
                      }}>
                        {timeInfo.text}
                      </span>
                      {timeInfo.urgent && !timeInfo.expired && (
                        <span style={{ fontSize: '0.875rem' }}>⚠️</span>
                      )}
                      {timeInfo.expired && (
                        <span style={{ fontSize: '0.875rem' }}>🔴</span>
                      )}
                    </div>
                    {/* Progress Bar */}
                    <div style={{
                      width: '100%',
                      height: '4px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${progressPercent}%`,
                        height: '100%',
                        backgroundColor: progressColor,
                        borderRadius: '2px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>

                  {/* Action Button */}
                  <div>
                    {lead.status === 'new' ? (
                      <button
                        onClick={() => handleAction(lead, 'contact')}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        Contact
                      </button>
                    ) : lead.status === 'contacted' ? (
                      <button
                        onClick={() => handleAction(lead, 'qualify')}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#10B981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          width: '100%'
                        }}
                      >
                        Qualify
                      </button>
                    ) : (
                      <span style={{
                        fontSize: '0.75rem',
                        color: '#10B981',
                        fontWeight: '500'
                      }}>
                        ✓ {lead.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
