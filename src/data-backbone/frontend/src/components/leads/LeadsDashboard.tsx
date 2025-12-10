import React, { useState, useMemo, useEffect } from 'react';
import type { Lead, LeadFilters, LeadStats } from '../../types/leads';
import {
  LEADS_COLORS,
  LEADS_TYPOGRAPHY,
  createDemoLeads,
  calculateLeadStats,
  TIMER_THRESHOLDS,
} from '../../constants/leads';
import LeadCard from './LeadCard';
import LeadsFilters from './LeadsFilters';
import { api } from '../../services/api';

const LeadsDashboard: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>(createDemoLeads);
  const [filters, setFilters] = useState<LeadFilters>({
    sortBy: 'createdAt',
    sortOrder: 'asc',
  });
  const [loading, setLoading] = useState(true);

  // Fetch real leads from API
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        setLoading(true);
        const apiLeads = await api.getLeads(50);

        if (apiLeads && Array.isArray(apiLeads) && apiLeads.length > 0) {
          // Transform API leads to local type
          const transformedLeads: Lead[] = apiLeads.map((item: {
            company: {
              id: string;
              name: string;
              domain: string;
              industry?: string;
              location?: string;
              intent_score?: number;
              created_at?: string;
            };
            contact?: {
              id: string;
              full_name: string;
              title?: string;
              email?: string;
              buyer_persona_type?: string;
            };
          }) => ({
            id: item.company.id,
            name: item.contact?.full_name || item.company.name,
            email: item.contact?.email || `contact@${item.company.domain}`,
            status: 'New' as const,
            source: 'Website' as const,
            createdAt: item.company.created_at ? new Date(item.company.created_at) : new Date(),
            background: {
              company: item.company.name,
              role: item.contact?.title || 'Contact',
              industry: item.company.industry || 'Unknown',
              location: item.company.location || '',
              companySize: '',
              linkedInHeadline: '',
              recentActivity: `Intent score: ${item.company.intent_score || 0}`,
            },
            assignedTo: undefined,
            notes: [],
            tags: item.contact?.buyer_persona_type ? [item.contact.buyer_persona_type] : [],
          }));

          setLeads(transformedLeads);
        }
      } catch (err) {
        console.error('Failed to fetch leads:', err);
        // Keep using demo data on error
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  // Calculate stats
  const stats: LeadStats = useMemo(() => calculateLeadStats(leads), [leads]);

  // Filter and sort leads
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Filter by status
    if (filters.status) {
      result = result.filter((lead) => lead.status === filters.status);
    }

    // Filter by source
    if (filters.source) {
      result = result.filter((lead) => lead.source === filters.source);
    }

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (lead) =>
          lead.name.toLowerCase().includes(query) ||
          lead.email.toLowerCase().includes(query) ||
          lead.background.company.toLowerCase().includes(query) ||
          lead.background.role.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;

      switch (filters.sortBy) {
        case 'createdAt':
          // For urgency sorting (asc), we want most urgent (least time remaining) first
          const remainingA = TIMER_THRESHOLDS.totalTime - (Date.now() - a.createdAt.getTime());
          const remainingB = TIMER_THRESHOLDS.totalTime - (Date.now() - b.createdAt.getTime());
          comparison = remainingA - remainingB;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'status':
          const statusOrder = { New: 0, Contacted: 1, Qualified: 2, Converted: 3, Lost: 4 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [leads, filters]);

  const handleAction = (
    leadId: string,
    action: 'contact' | 'followUp' | 'convert' | 'archive' | 'assign' | 'addNote'
  ) => {
    console.log(`Action: ${action} for lead: ${leadId}`);

    // Update lead status based on action
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === leadId) {
          switch (action) {
            case 'contact':
              return { ...lead, status: 'Contacted' };
            case 'followUp':
              // In real app, would open scheduler
              return lead;
            case 'convert':
              return { ...lead, status: 'Converted' };
            case 'archive':
              return { ...lead, status: 'Lost' };
            default:
              return lead;
          }
        }
        return lead;
      })
    );
  };

  const handleSelectLead = (lead: Lead) => {
    console.log('Selected lead:', lead);
    // In real app, would open lead detail modal
  };

  return (
    <div style={{ padding: '0' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h2
            style={{
              ...LEADS_TYPOGRAPHY.h2,
              color: LEADS_COLORS.primaryText,
              margin: 0,
            }}
          >
            Lead Management
          </h2>
          <p
            style={{
              ...LEADS_TYPOGRAPHY.body,
              color: LEADS_COLORS.secondaryText,
              margin: '0.25rem 0 0 0',
            }}
          >
            Respond to leads within 4 hours for optimal conversion
          </p>
        </div>

        {/* Stats Summary */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: LEADS_COLORS.cardBg,
              borderRadius: '0.5rem',
              border: `1px solid ${LEADS_COLORS.border}`,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                ...LEADS_TYPOGRAPHY.h3,
                color: LEADS_COLORS.primaryText,
                margin: 0,
              }}
            >
              {stats.total}
            </div>
            <div
              style={{
                ...LEADS_TYPOGRAPHY.bodySmall,
                color: LEADS_COLORS.tertiaryText,
              }}
            >
              Total Leads
            </div>
          </div>

          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: LEADS_COLORS.cardBg,
              borderRadius: '0.5rem',
              border: `1px solid ${LEADS_COLORS.border}`,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                ...LEADS_TYPOGRAPHY.h3,
                color: LEADS_COLORS.statusNew,
                margin: 0,
              }}
            >
              {stats.new}
            </div>
            <div
              style={{
                ...LEADS_TYPOGRAPHY.bodySmall,
                color: LEADS_COLORS.tertiaryText,
              }}
            >
              Awaiting Contact
            </div>
          </div>

          {stats.overdue > 0 && (
            <div
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: `${LEADS_COLORS.timerRed}10`,
                borderRadius: '0.5rem',
                border: `1px solid ${LEADS_COLORS.timerRed}30`,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  ...LEADS_TYPOGRAPHY.h3,
                  color: LEADS_COLORS.timerRed,
                  margin: 0,
                }}
              >
                {stats.overdue}
              </div>
              <div
                style={{
                  ...LEADS_TYPOGRAPHY.bodySmall,
                  color: LEADS_COLORS.timerRed,
                }}
              >
                Overdue
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <LeadsFilters
        filters={filters}
        stats={stats}
        onFiltersChange={setFilters}
      />

      {/* Lead Cards Grid */}
      {filteredLeads.length === 0 ? (
        <div
          style={{
            padding: '3rem',
            textAlign: 'center',
            backgroundColor: LEADS_COLORS.cardBg,
            borderRadius: '0.5rem',
            border: `1px solid ${LEADS_COLORS.border}`,
          }}
        >
          <p style={{ ...LEADS_TYPOGRAPHY.body, color: LEADS_COLORS.secondaryText, margin: 0 }}>
            No leads match your current filters.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
            gap: '1rem',
          }}
        >
          {filteredLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onAction={handleAction}
              onSelect={handleSelectLead}
            />
          ))}
        </div>
      )}

      {/* Timer Legend */}
      <div
        style={{
          marginTop: '2rem',
          padding: '1rem 1.25rem',
          backgroundColor: LEADS_COLORS.cardBg,
          borderRadius: '0.5rem',
          border: `1px solid ${LEADS_COLORS.border}`,
        }}
      >
        <div style={{ ...LEADS_TYPOGRAPHY.bodySmall, color: LEADS_COLORS.secondaryText, marginBottom: '0.75rem' }}>
          Response Time Urgency
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: LEADS_COLORS.timerGreen }} />
            <span style={{ ...LEADS_TYPOGRAPHY.bodySmall, color: LEADS_COLORS.primaryText }}>4h – 2h remaining</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: LEADS_COLORS.timerYellow }} />
            <span style={{ ...LEADS_TYPOGRAPHY.bodySmall, color: LEADS_COLORS.primaryText }}>2h – 1h remaining</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: LEADS_COLORS.timerOrange }} />
            <span style={{ ...LEADS_TYPOGRAPHY.bodySmall, color: LEADS_COLORS.primaryText }}>Under 1h remaining</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: LEADS_COLORS.timerRed }} />
            <span style={{ ...LEADS_TYPOGRAPHY.bodySmall, color: LEADS_COLORS.primaryText }}>Overdue</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeadsDashboard;
