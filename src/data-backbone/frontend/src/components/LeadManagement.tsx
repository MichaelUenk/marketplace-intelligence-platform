import { useState, useEffect, useCallback } from 'react';

interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  source: LeadSource;
  status: LeadStatus;
  createdAt: Date;
  value?: number;
  notes?: string;
}

type LeadSource = 'Google Places' | 'Hunter.io' | 'LinkedIn' | 'Referral' | 'Website' | 'Cold Outreach';
type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Negotiation' | 'Closed Won' | 'Closed Lost';

interface LeadTimer {
  leadId: string;
  remainingSeconds: number;
  isEscalated: boolean;
}

// Mock data for demonstration
const mockLeads: Lead[] = [
  {
    id: '1',
    name: 'John Smith',
    company: 'TechCorp Inc.',
    email: 'john.smith@techcorp.com',
    phone: '+1 (555) 123-4567',
    source: 'Google Places',
    status: 'New',
    createdAt: new Date(Date.now() - 3600000),
    value: 15000,
    notes: 'Interested in enterprise solution'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    company: 'Digital Solutions LLC',
    email: 'sarah.j@digitalsolutions.com',
    phone: '+1 (555) 234-5678',
    source: 'Hunter.io',
    status: 'Contacted',
    createdAt: new Date(Date.now() - 7200000),
    value: 25000,
    notes: 'Follow up scheduled for next week'
  },
  {
    id: '3',
    name: 'Michael Chen',
    company: 'Innovate Labs',
    email: 'mchen@innovatelabs.io',
    source: 'LinkedIn',
    status: 'Qualified',
    createdAt: new Date(Date.now() - 1800000),
    value: 50000,
    notes: 'Decision maker, budget approved'
  },
  {
    id: '4',
    name: 'Emily Davis',
    company: 'Growth Partners',
    email: 'emily@growthpartners.com',
    phone: '+1 (555) 345-6789',
    source: 'Referral',
    status: 'New',
    createdAt: new Date(Date.now() - 900000),
    value: 10000
  },
  {
    id: '5',
    name: 'Robert Wilson',
    company: 'Scale Ventures',
    email: 'rwilson@scaleventures.com',
    source: 'Website',
    status: 'Negotiation',
    createdAt: new Date(Date.now() - 5400000),
    value: 75000,
    notes: 'Finalizing contract terms'
  },
  {
    id: '6',
    name: 'Lisa Anderson',
    company: 'DataDriven Co',
    email: 'lisa.a@datadriven.co',
    phone: '+1 (555) 456-7890',
    source: 'Cold Outreach',
    status: 'Contacted',
    createdAt: new Date(Date.now() - 4200000),
    value: 30000
  }
];

const sourceColors: Record<LeadSource, { bg: string; text: string; border: string }> = {
  'Google Places': { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  'Hunter.io': { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
  'LinkedIn': { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' },
  'Referral': { bg: '#d1fae5', text: '#065f46', border: '#6ee7b7' },
  'Website': { bg: '#e0e7ff', text: '#3730a3', border: '#a5b4fc' },
  'Cold Outreach': { bg: '#f3e8ff', text: '#6b21a8', border: '#c4b5fd' }
};

const statusColors: Record<LeadStatus, { bg: string; text: string }> = {
  'New': { bg: '#dbeafe', text: '#1e40af' },
  'Contacted': { bg: '#fef3c7', text: '#92400e' },
  'Qualified': { bg: '#d1fae5', text: '#065f46' },
  'Negotiation': { bg: '#fce7f3', text: '#9d174d' },
  'Closed Won': { bg: '#d1fae5', text: '#065f46' },
  'Closed Lost': { bg: '#fee2e2', text: '#991b1b' }
};

export default function LeadManagement() {
  const [leads] = useState<Lead[]>(mockLeads);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [timers, setTimers] = useState<Record<string, LeadTimer>>({});
  const [filter, setFilter] = useState<LeadStatus | 'All'>('All');

  // Initialize timers for all leads (2 hours = 7200 seconds)
  useEffect(() => {
    const initialTimers: Record<string, LeadTimer> = {};
    leads.forEach(lead => {
      const elapsed = Math.floor((Date.now() - lead.createdAt.getTime()) / 1000);
      const remaining = Math.max(0, 7200 - elapsed);
      initialTimers[lead.id] = {
        leadId: lead.id,
        remainingSeconds: remaining,
        isEscalated: false
      };
    });
    setTimers(initialTimers);
  }, [leads]);

  // Countdown timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(leadId => {
          if (updated[leadId].remainingSeconds > 0 && !updated[leadId].isEscalated) {
            updated[leadId] = {
              ...updated[leadId],
              remainingSeconds: updated[leadId].remainingSeconds - 1
            };
          }
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const getTimerColor = useCallback((seconds: number, isEscalated: boolean): string => {
    if (isEscalated) return '#9ca3af';
    if (seconds === 0) return '#dc2626';
    if (seconds < 900) return '#dc2626'; // Less than 15 min
    if (seconds < 1800) return '#f59e0b'; // Less than 30 min
    return '#10b981';
  }, []);

  const handleEscalate = useCallback((leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTimers(prev => ({
      ...prev,
      [leadId]: {
        ...prev[leadId],
        isEscalated: true
      }
    }));
  }, []);

  const selectedLead = leads.find(l => l.id === selectedLeadId);
  const filteredLeads = filter === 'All' ? leads : leads.filter(l => l.status === filter);

  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
          Lead Management
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Track and manage your leads with real-time countdown timers
        </p>
      </div>

      {/* Filter Buttons */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '1rem',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {(['All', 'New', 'Contacted', 'Qualified', 'Negotiation', 'Closed Won', 'Closed Lost'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '0.5rem 1rem',
                border: 'none',
                borderRadius: '0.375rem',
                backgroundColor: filter === status ? '#3b82f6' : '#f3f4f6',
                color: filter === status ? 'white' : '#6b7280',
                fontWeight: filter === status ? '600' : '500',
                cursor: 'pointer',
                fontSize: '0.75rem',
                transition: 'all 0.2s'
              }}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Lead List */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        {filteredLeads.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: '#6b7280', margin: 0 }}>No leads found for this filter.</p>
          </div>
        ) : (
          filteredLeads.map((lead, index) => {
            const timer = timers[lead.id];
            const isSelected = selectedLeadId === lead.id;
            const isExpired = timer && timer.remainingSeconds === 0 && !timer.isEscalated;

            return (
              <div key={lead.id}>
                {/* Lead Row - Clickable */}
                <div
                  onClick={() => setSelectedLeadId(isSelected ? null : lead.id)}
                  style={{
                    padding: '1rem 1.5rem',
                    borderBottom: index < filteredLeads.length - 1 ? '1px solid #e5e7eb' : 'none',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#f9fafb' : isExpired ? '#fef2f2' : 'white',
                    transition: 'background-color 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = isExpired ? '#fef2f2' : 'white';
                    }
                  }}
                >
                  {/* Left Section - Lead Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                      <span style={{
                        fontWeight: '600',
                        color: '#111827',
                        fontSize: '0.9375rem'
                      }}>
                        {lead.name}
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        backgroundColor: statusColors[lead.status].bg,
                        color: statusColors[lead.status].text,
                        fontWeight: '500'
                      }}>
                        {lead.status}
                      </span>
                    </div>
                    <div style={{
                      fontSize: '0.8125rem',
                      color: '#6b7280',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {lead.company} - {lead.email}
                    </div>
                  </div>

                  {/* Center Section - Timer */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    flexShrink: 0
                  }}>
                    {timer && (
                      <>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center'
                        }}>
                          <span style={{
                            fontSize: '0.625rem',
                            color: '#9ca3af',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: '0.125rem'
                          }}>
                            {timer.isEscalated ? 'Escalated' : 'Time Left'}
                          </span>
                          <span style={{
                            fontFamily: 'monospace',
                            fontSize: '1rem',
                            fontWeight: '600',
                            color: getTimerColor(timer.remainingSeconds, timer.isEscalated)
                          }}>
                            {timer.isEscalated ? '--:--:--' : formatTime(timer.remainingSeconds)}
                          </span>
                        </div>

                        {!timer.isEscalated && (
                          <button
                            onClick={(e) => handleEscalate(lead.id, e)}
                            style={{
                              padding: '0.375rem 0.75rem',
                              backgroundColor: timer.remainingSeconds < 900 ? '#dc2626' : '#f59e0b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              fontSize: '0.75rem',
                              fontWeight: '500',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              whiteSpace: 'nowrap'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.05)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            Escalate
                          </button>
                        )}
                      </>
                    )}
                  </div>

                  {/* Expand Arrow */}
                  <div style={{
                    width: '1.5rem',
                    height: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#9ca3af',
                    transition: 'transform 0.2s',
                    transform: isSelected ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                {/* Expanded Detail View */}
                {isSelected && selectedLead && (
                  <div style={{
                    backgroundColor: '#f9fafb',
                    padding: '1.5rem',
                    borderBottom: index < filteredLeads.length - 1 ? '1px solid #e5e7eb' : 'none'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '1.5rem'
                    }}>
                      {/* Contact Information */}
                      <div>
                        <h4 style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.75rem'
                        }}>
                          Contact Information
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Name:</span>
                            <span style={{ color: '#111827', fontSize: '0.875rem', fontWeight: '500' }}>{selectedLead.name}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Company:</span>
                            <span style={{ color: '#111827', fontSize: '0.875rem', fontWeight: '500' }}>{selectedLead.company}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Email:</span>
                            <a
                              href={`mailto:${selectedLead.email}`}
                              style={{ color: '#3b82f6', fontSize: '0.875rem', textDecoration: 'none' }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {selectedLead.email}
                            </a>
                          </div>
                          {selectedLead.phone && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Phone:</span>
                              <a
                                href={`tel:${selectedLead.phone}`}
                                style={{ color: '#3b82f6', fontSize: '0.875rem', textDecoration: 'none' }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {selectedLead.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Lead Source */}
                      <div>
                        <h4 style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.75rem'
                        }}>
                          Lead Source
                        </h4>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          padding: '0.5rem 0.75rem',
                          backgroundColor: sourceColors[selectedLead.source].bg,
                          border: `1px solid ${sourceColors[selectedLead.source].border}`,
                          borderRadius: '0.5rem'
                        }}>
                          <span style={{
                            width: '0.5rem',
                            height: '0.5rem',
                            borderRadius: '50%',
                            backgroundColor: sourceColors[selectedLead.source].text
                          }} />
                          <span style={{
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            color: sourceColors[selectedLead.source].text
                          }}>
                            {selectedLead.source}
                          </span>
                        </div>
                        <div style={{ marginTop: '1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Created:</span>
                            <span style={{ color: '#111827', fontSize: '0.875rem' }}>
                              {selectedLead.createdAt.toLocaleDateString()} at {selectedLead.createdAt.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Timer & Value */}
                      <div>
                        <h4 style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.75rem'
                        }}>
                          Response Timer
                        </h4>
                        {timer && (
                          <div style={{
                            backgroundColor: 'white',
                            borderRadius: '0.5rem',
                            padding: '1rem',
                            border: '1px solid #e5e7eb'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: '0.75rem'
                            }}>
                              <span style={{
                                fontFamily: 'monospace',
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                color: getTimerColor(timer.remainingSeconds, timer.isEscalated)
                              }}>
                                {timer.isEscalated ? 'ESCALATED' : formatTime(timer.remainingSeconds)}
                              </span>
                            </div>

                            {/* Progress Bar */}
                            <div style={{
                              height: '0.5rem',
                              backgroundColor: '#e5e7eb',
                              borderRadius: '9999px',
                              overflow: 'hidden',
                              marginBottom: '0.75rem'
                            }}>
                              <div style={{
                                height: '100%',
                                width: timer.isEscalated ? '0%' : `${(timer.remainingSeconds / 7200) * 100}%`,
                                backgroundColor: getTimerColor(timer.remainingSeconds, timer.isEscalated),
                                borderRadius: '9999px',
                                transition: 'width 1s linear'
                              }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#9ca3af' }}>
                              <span>0:00:00</span>
                              <span>2:00:00</span>
                            </div>
                          </div>
                        )}

                        {selectedLead.value && (
                          <div style={{ marginTop: '1rem' }}>
                            <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>Estimated Value: </span>
                            <span style={{
                              color: '#059669',
                              fontSize: '1rem',
                              fontWeight: '600'
                            }}>
                              ${selectedLead.value.toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes Section */}
                    {selectedLead.notes && (
                      <div style={{ marginTop: '1.5rem' }}>
                        <h4 style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: '#6b7280',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          marginBottom: '0.5rem'
                        }}>
                          Notes
                        </h4>
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#4b5563',
                          margin: 0,
                          padding: '0.75rem',
                          backgroundColor: 'white',
                          borderRadius: '0.375rem',
                          border: '1px solid #e5e7eb'
                        }}>
                          {selectedLead.notes}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{
                      marginTop: '1.5rem',
                      display: 'flex',
                      gap: '0.75rem',
                      flexWrap: 'wrap'
                    }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.location.href = `mailto:${selectedLead.email}`;
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path d="M2 4L8 9L14 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <rect x="1" y="3" width="14" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                        Send Email
                      </button>
                      {selectedLead.phone && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = `tel:${selectedLead.phone}`;
                          }}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M2.5 2.5C2.5 2.5 3.5 2 5 2C6.5 2 7 3 7 4C7 5 6 6 6 6L7 7L9 9L10 10C10 10 11 9 12 9C13 9 14 9.5 14 11C14 12.5 13.5 13.5 13.5 13.5C12 15 9 14 6.5 11.5C4 9 3 6 4.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Call
                        </button>
                      )}
                      {timer && !timer.isEscalated && (
                        <button
                          onClick={(e) => handleEscalate(selectedLead.id, e)}
                          style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: timer.remainingSeconds < 900 ? '#dc2626' : '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M8 2V8L11 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                          Escalate Lead
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Summary Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '1rem',
        marginTop: '1.5rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>
            {leads.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>
            Total Leads
          </div>
        </div>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
            {Object.values(timers).filter(t => t.remainingSeconds < 900 && !t.isEscalated).length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>
            Urgent
          </div>
        </div>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
            {Object.values(timers).filter(t => t.isEscalated).length}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>
            Escalated
          </div>
        </div>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          padding: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#059669' }}>
            ${leads.reduce((sum, l) => sum + (l.value || 0), 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase' }}>
            Pipeline Value
          </div>
        </div>
      </div>
    </div>
  );
}
