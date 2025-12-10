// Lead Types and Interfaces

// Lead source types
export type LeadSource = 'Website' | 'Referral' | 'LinkedIn' | 'Event' | 'Cold Outreach' | 'Partner';

// Lead status types
export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Converted' | 'Lost';

// Timer state for visual display
export type TimerState = 'green' | 'yellow' | 'orange' | 'red';

// Lead background information
export interface LeadBackground {
  company: string;
  role: string;
  industry: string;
  linkedInUrl?: string;
  notes?: string;
}

// Main Lead interface
export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  source: LeadSource;
  campaign?: string;
  background: LeadBackground;
  createdAt: Date;
  status: LeadStatus;
}

// Lead source configuration
export interface LeadSourceConfig {
  source: LeadSource;
  icon: string;
  color: string;
  priorityWeight: number;
}

// Timer info for display
export interface TimerInfo {
  text: string;
  state: TimerState;
  isExpired: boolean;
  overdueMinutes?: number;
  percentRemaining: number;
}

// Lead filter options
export interface LeadFilters {
  status?: LeadStatus;
  source?: LeadSource;
  searchQuery?: string;
  sortBy: 'createdAt' | 'name' | 'status';
  sortOrder: 'asc' | 'desc';
}

// Lead statistics
export interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  converted: number;
  overdue: number;
  urgentCount: number; // Less than 1 hour remaining
}
