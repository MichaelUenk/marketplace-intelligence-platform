import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  TrendingDown,
  Package,
  Building2,
  Globe,
  Calendar,
  Clock,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  Phone,
  Mail,
  AlertTriangle,
  XCircle,
  Eye,
  BarChart3,
  Zap,
  DollarSign,
  Factory,
  Truck,
  Users,
  Award,
  Briefcase,
  RefreshCw,
} from 'lucide-react';
import { EmptyState } from '../ui';

// iBood Signal Types based on spec
type SignalPriority = 'hot' | 'strategic' | 'market' | 'relationship';
type SignalStatus = 'new' | 'viewed' | 'actioned' | 'dismissed' | 'expired';
type CompanyStatus = 'new' | 'watching' | 'contacted' | 'active_supplier' | 'inactive';

type IBoodSignalType =
  | 'inventory_surplus'
  | 'earnings_miss'
  | 'product_discontinuation'
  | 'warehouse_clearance'
  | 'leadership_change'
  | 'debt_pressure'
  | 'european_market_entry'
  | 'new_factory'
  | 'product_launch_overrun'
  | 'seasonal_clearance'
  | 'retailer_delisting'
  | 'distribution_change'
  | 'category_oversupply'
  | 'raw_material_price_drop'
  | 'competitor_bankruptcy'
  | 'trade_policy_change'
  | 'currency_shift'
  | 'shipping_cost_drop'
  | 'trade_show_attendance'
  | 'new_product_announcement'
  | 'sustainability_initiative'
  | 'award_recognition'
  | 'new_sales_leader'
  | 'partnership_announcement';

type ProductCategory =
  | 'consumer_electronics'
  | 'home_appliances'
  | 'home_living'
  | 'garden_outdoor'
  | 'health_beauty'
  | 'sports_fitness'
  | 'fashion_accessories'
  | 'diy_tools'
  | 'household_nonfood';

interface IBoodSignal {
  id: string;
  company_id: string;
  company_name: string;
  company_country: string;
  signal_type: IBoodSignalType;
  signal_priority: SignalPriority;
  title: string;
  summary: string;
  confidence_score: number;
  deal_potential_score: number;
  source_type: string;
  detected_at: string;
  status: SignalStatus;
  categories: ProductCategory[];
  estimated_value?: number;
  likely_discount_range?: string;
  competition_level?: 'low' | 'medium' | 'high';
  timing_recommendation?: string;
  evidence?: {
    quotes: string[];
  };
}

interface IBoodCompany {
  id: string;
  name: string;
  country: string;
  revenue_eur?: number;
  categories: ProductCategory[];
  status: CompanyStatus;
  active_signals: number;
  past_gmv?: number;
  has_contact: boolean;
  latest_signal?: string;
}

const SIGNAL_CONFIG: Record<IBoodSignalType, { label: string; icon: React.ReactNode; priority: SignalPriority }> = {
  inventory_surplus: { label: 'Inventory Surplus', icon: <Package size={14} />, priority: 'hot' },
  earnings_miss: { label: 'Earnings Miss', icon: <TrendingDown size={14} />, priority: 'hot' },
  product_discontinuation: { label: 'Product Discontinuation', icon: <XCircle size={14} />, priority: 'hot' },
  warehouse_clearance: { label: 'Warehouse Clearance', icon: <Factory size={14} />, priority: 'hot' },
  leadership_change: { label: 'CFO/CEO Change', icon: <Users size={14} />, priority: 'hot' },
  debt_pressure: { label: 'Debt Pressure', icon: <AlertTriangle size={14} />, priority: 'hot' },
  european_market_entry: { label: 'EU Market Entry', icon: <Globe size={14} />, priority: 'strategic' },
  new_factory: { label: 'New Factory', icon: <Factory size={14} />, priority: 'strategic' },
  product_launch_overrun: { label: 'Launch Overrun', icon: <Package size={14} />, priority: 'strategic' },
  seasonal_clearance: { label: 'Seasonal Clearance', icon: <Calendar size={14} />, priority: 'strategic' },
  retailer_delisting: { label: 'Retailer Delisting', icon: <Building2 size={14} />, priority: 'strategic' },
  distribution_change: { label: 'Distribution Change', icon: <Truck size={14} />, priority: 'strategic' },
  category_oversupply: { label: 'Category Oversupply', icon: <BarChart3 size={14} />, priority: 'market' },
  raw_material_price_drop: { label: 'Material Price Drop', icon: <TrendingDown size={14} />, priority: 'market' },
  competitor_bankruptcy: { label: 'Competitor Bankruptcy', icon: <AlertTriangle size={14} />, priority: 'market' },
  trade_policy_change: { label: 'Trade Policy Change', icon: <Globe size={14} />, priority: 'market' },
  currency_shift: { label: 'Currency Shift', icon: <DollarSign size={14} />, priority: 'market' },
  shipping_cost_drop: { label: 'Shipping Cost Drop', icon: <Truck size={14} />, priority: 'market' },
  trade_show_attendance: { label: 'Trade Show', icon: <Calendar size={14} />, priority: 'relationship' },
  new_product_announcement: { label: 'New Product', icon: <Zap size={14} />, priority: 'relationship' },
  sustainability_initiative: { label: 'Sustainability', icon: <Award size={14} />, priority: 'relationship' },
  award_recognition: { label: 'Award', icon: <Award size={14} />, priority: 'relationship' },
  new_sales_leader: { label: 'New Sales Leader', icon: <Briefcase size={14} />, priority: 'relationship' },
  partnership_announcement: { label: 'Partnership', icon: <Users size={14} />, priority: 'relationship' },
};

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  consumer_electronics: 'Consumer Electronics',
  home_appliances: 'Home Appliances',
  home_living: 'Home & Living',
  garden_outdoor: 'Garden & Outdoor',
  health_beauty: 'Health & Beauty',
  sports_fitness: 'Sports & Fitness',
  fashion_accessories: 'Fashion & Accessories',
  diy_tools: 'DIY & Tools',
  household_nonfood: 'Household & Non-Food',
};

const PRIORITY_CONFIG = {
  hot: { label: 'Hot', icon: '🔥', color: 'var(--color-signal-hot)', bg: 'var(--color-signal-hot-bg)' },
  strategic: { label: 'Strategic', icon: '⭐', color: 'var(--color-signal-strategic)', bg: 'var(--color-signal-strategic-bg)' },
  market: { label: 'Market Intel', icon: '📊', color: 'var(--color-signal-market)', bg: 'var(--color-signal-market-bg)' },
  relationship: { label: 'Nurture', icon: '🤝', color: 'var(--color-signal-relationship)', bg: 'var(--color-signal-relationship-bg)' },
};

// Demo data
const createDemoSignals = (): IBoodSignal[] => [
  {
    id: 's1',
    company_id: 'c1',
    company_name: 'Philips Consumer Electronics',
    company_country: 'Netherlands',
    signal_type: 'inventory_surplus',
    signal_priority: 'hot',
    title: 'Q3 Inventory Surplus Alert',
    summary: 'Q3 report shows €120M excess inventory in Personal Health segment. CEO mentioned exploring promotional partnerships on earnings call.',
    confidence_score: 92,
    deal_potential_score: 88,
    source_type: 'Earnings Call',
    detected_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    status: 'new',
    categories: ['consumer_electronics', 'health_beauty'],
    estimated_value: 120000000,
    likely_discount_range: '40-60%',
    competition_level: 'high',
    timing_recommendation: 'Act within 2 weeks',
    evidence: { quotes: ['"We continue to work through elevated inventory levels..."'] },
  },
  {
    id: 's2',
    company_id: 'c2',
    company_name: 'Xiaomi',
    company_country: 'China',
    signal_type: 'european_market_entry',
    signal_priority: 'strategic',
    title: 'EU Expansion to 12 Countries',
    summary: 'Xiaomi announced direct retail expansion to Netherlands, Belgium, Austria and 9 more EU countries by Q2 2025.',
    confidence_score: 88,
    deal_potential_score: 85,
    source_type: 'Press Release',
    detected_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    status: 'new',
    categories: ['consumer_electronics', 'home_appliances'],
    likely_discount_range: 'Launch pricing negotiable',
    competition_level: 'medium',
    timing_recommendation: 'Contact within 4 weeks',
  },
  {
    id: 's3',
    company_id: 'c3',
    company_name: 'Tefal / Groupe SEB',
    company_country: 'France',
    signal_type: 'product_discontinuation',
    signal_priority: 'hot',
    title: 'Cookware Line Phase-Out',
    summary: 'Phasing out 3 cookware product lines with estimated 50,000 units to clear before Q1 2025.',
    confidence_score: 95,
    deal_potential_score: 90,
    source_type: 'Industry Source',
    detected_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    status: 'viewed',
    categories: ['home_appliances'],
    estimated_value: 2500000,
    likely_discount_range: '50-70%',
    competition_level: 'medium',
    timing_recommendation: 'Urgent - deadline Q1 2025',
  },
  {
    id: 's4',
    company_id: 'c4',
    company_name: 'Dyson',
    company_country: 'United Kingdom',
    signal_type: 'new_factory',
    signal_priority: 'strategic',
    title: 'Malaysia Factory Expansion',
    summary: 'New manufacturing facility expected to increase capacity by 40%. Ramp-up phase Q2 2025 may lead to initial oversupply.',
    confidence_score: 78,
    deal_potential_score: 72,
    source_type: 'News',
    detected_at: new Date(Date.now() - 48 * 3600000).toISOString(),
    status: 'new',
    categories: ['home_appliances'],
    timing_recommendation: 'Set reminder for Q2 2025',
  },
  {
    id: 's5',
    company_id: 'c5',
    company_name: 'Sony',
    company_country: 'Japan',
    signal_type: 'earnings_miss',
    signal_priority: 'hot',
    title: 'Consumer Electronics Division -12%',
    summary: 'Q3 results show consumer electronics division down 12% YoY. Restructuring expected with potential inventory liquidation.',
    confidence_score: 85,
    deal_potential_score: 75,
    source_type: 'Earnings Report',
    detected_at: new Date(Date.now() - 72 * 3600000).toISOString(),
    status: 'new',
    categories: ['consumer_electronics'],
    competition_level: 'high',
    timing_recommendation: 'Monitor for liquidation announcements',
  },
  {
    id: 's6',
    company_id: 'c6',
    company_name: 'Bosch Home',
    company_country: 'Germany',
    signal_type: 'trade_show_attendance',
    signal_priority: 'relationship',
    title: 'IFA Berlin 2025 Exhibitor',
    summary: 'Confirmed exhibitor at IFA Berlin 2025. New product launches expected. Good opportunity for face-to-face meeting.',
    confidence_score: 100,
    deal_potential_score: 60,
    source_type: 'Trade Show Calendar',
    detected_at: new Date(Date.now() - 1 * 3600000).toISOString(),
    status: 'new',
    categories: ['home_appliances'],
    timing_recommendation: 'Schedule meeting at IFA',
  },
  {
    id: 's7',
    company_id: 'c7',
    company_name: 'Garmin',
    company_country: 'United States',
    signal_type: 'category_oversupply',
    signal_priority: 'market',
    title: 'Fitness Tracker Market Oversupply',
    summary: 'Industry analysts report 15% oversupply in fitness wearables category. Multiple brands likely to offer discounts.',
    confidence_score: 72,
    deal_potential_score: 68,
    source_type: 'Market Research',
    detected_at: new Date(Date.now() - 96 * 3600000).toISOString(),
    status: 'new',
    categories: ['consumer_electronics', 'sports_fitness'],
    timing_recommendation: 'Reach out to category leaders',
  },
];

const createDemoCompanies = (): IBoodCompany[] => [
  {
    id: 'c1',
    name: 'Philips Consumer Lifestyle',
    country: 'Netherlands',
    revenue_eur: 6800000000,
    categories: ['consumer_electronics', 'health_beauty', 'home_appliances'],
    status: 'active_supplier',
    active_signals: 3,
    past_gmv: 2400000,
    has_contact: true,
    latest_signal: 'Inventory Surplus (Q3 2024)',
  },
  {
    id: 'c2',
    name: 'Xiaomi',
    country: 'China',
    revenue_eur: 32000000000,
    categories: ['consumer_electronics', 'home_appliances'],
    status: 'new',
    active_signals: 1,
    has_contact: false,
    latest_signal: 'European Market Entry',
  },
  {
    id: 'c3',
    name: 'Groupe SEB (Tefal, Krups, Rowenta)',
    country: 'France',
    revenue_eur: 8100000000,
    categories: ['home_appliances'],
    status: 'contacted',
    active_signals: 2,
    past_gmv: 850000,
    has_contact: true,
    latest_signal: 'Product Discontinuation',
  },
  {
    id: 'c4',
    name: 'Dyson',
    country: 'United Kingdom',
    revenue_eur: 7200000000,
    categories: ['home_appliances'],
    status: 'watching',
    active_signals: 1,
    has_contact: false,
    latest_signal: 'New Factory Opening',
  },
];

const formatCurrency = (value: number): string => {
  if (value >= 1000000000) return `€${(value / 1000000000).toFixed(1)}B`;
  if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
  return `€${value}`;
};

const formatTimeAgo = (dateString: string): string => {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

// Styles
const styles = {
  container: { padding: 0 },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1rem',
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    backgroundColor: 'var(--surface-secondary)',
    borderRadius: '0.75rem',
    border: '1px solid var(--border-primary)',
  } as React.CSSProperties,
  statIcon: { fontSize: '1.5rem' },
  statValue: {
    fontSize: '1.125rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  } as React.CSSProperties,
  statLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-tertiary)',
  } as React.CSSProperties,
  tabs: {
    display: 'flex',
    gap: '0.25rem',
    padding: '0.25rem',
    backgroundColor: 'var(--surface-secondary)',
    borderRadius: '0.75rem',
    marginBottom: '1rem',
  } as React.CSSProperties,
  tab: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.5rem 1rem',
    border: 'none',
    background: 'transparent',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  tabActive: {
    backgroundColor: 'var(--surface-primary)',
    color: 'var(--color-brand-blue)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  filters: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  } as React.CSSProperties,
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
    maxWidth: '350px',
    padding: '0.5rem 0.75rem',
    backgroundColor: 'var(--surface-secondary)',
    border: '1px solid var(--border-primary)',
    borderRadius: '0.5rem',
  } as React.CSSProperties,
  searchInput: {
    flex: 1,
    border: 'none',
    background: 'transparent',
    fontSize: '0.875rem',
    color: 'var(--text-primary)',
    outline: 'none',
  } as React.CSSProperties,
  select: {
    padding: '0.5rem 0.75rem',
    border: '1px solid var(--border-primary)',
    borderRadius: '0.5rem',
    backgroundColor: 'var(--surface-secondary)',
    fontSize: '0.875rem',
    color: 'var(--text-primary)',
    cursor: 'pointer',
  } as React.CSSProperties,
  section: { marginBottom: '2rem' },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.25rem',
  } as React.CSSProperties,
  sectionTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: 0,
  } as React.CSSProperties,
  sectionCount: {
    fontSize: '0.75rem',
    padding: '0.125rem 0.5rem',
    backgroundColor: 'var(--surface-tertiary)',
    borderRadius: '999px',
    color: 'var(--text-secondary)',
  } as React.CSSProperties,
  sectionSubtitle: {
    fontSize: '0.8125rem',
    color: 'var(--text-tertiary)',
    margin: '0 0 1rem 0',
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
    gap: '1rem',
  } as React.CSSProperties,
  card: {
    backgroundColor: 'var(--surface-secondary)',
    border: '1px solid var(--border-primary)',
    borderRadius: '0.75rem',
    padding: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  } as React.CSSProperties,
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.75rem',
  } as React.CSSProperties,
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.375rem',
    fontSize: '0.6875rem',
    fontWeight: 600,
  } as React.CSSProperties,
  meta: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    gap: '2px',
  },
  confidence: {
    fontSize: '0.6875rem',
    fontWeight: 500,
    color: 'var(--color-success-600)',
  } as React.CSSProperties,
  time: {
    fontSize: '0.6875rem',
    color: 'var(--text-tertiary)',
  } as React.CSSProperties,
  company: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
  } as React.CSSProperties,
  companyName: {
    fontWeight: 500,
    color: 'var(--text-primary)',
  } as React.CSSProperties,
  cardTitle: {
    fontSize: '0.9375rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    margin: '0 0 0.5rem 0',
  } as React.CSSProperties,
  cardSummary: {
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
    margin: '0 0 0.75rem 0',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.25rem',
    marginBottom: '0.75rem',
  },
  tag: {
    fontSize: '0.625rem',
    padding: '0.125rem 0.375rem',
    backgroundColor: 'var(--surface-tertiary)',
    color: 'var(--text-secondary)',
    borderRadius: '0.25rem',
  } as React.CSSProperties,
  dealInfo: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.75rem',
    padding: '0.75rem',
    backgroundColor: 'var(--surface-primary)',
    borderRadius: '0.5rem',
    marginBottom: '0.75rem',
  },
  dealItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    fontSize: '0.6875rem',
    color: 'var(--text-secondary)',
  } as React.CSSProperties,
  actions: {
    display: 'flex',
    gap: '0.5rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid var(--border-primary)',
  } as React.CSSProperties,
  btn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    padding: '0.375rem 0.625rem',
    border: '1px solid var(--border-primary)',
    borderRadius: '0.375rem',
    background: 'transparent',
    fontSize: '0.6875rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  } as React.CSSProperties,
  btnPrimary: {
    backgroundColor: 'var(--color-brand-blue)',
    borderColor: 'var(--color-brand-blue)',
    color: 'white',
  } as React.CSSProperties,
  empty: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    padding: '3rem',
    color: 'var(--text-tertiary)',
    textAlign: 'center' as const,
  },
  // Modal styles
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modal: {
    backgroundColor: 'var(--surface-secondary)',
    borderRadius: '1rem',
    maxWidth: '560px',
    width: '100%',
    maxHeight: '85vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
  } as React.CSSProperties,
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem',
    borderBottom: '1px solid var(--border-primary)',
  } as React.CSSProperties,
  modalContent: { padding: '1.25rem' },
  modalTitle: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    margin: '0 0 0.75rem 0',
  } as React.CSSProperties,
  scoreRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.75rem',
  } as React.CSSProperties,
  scoreLabel: {
    width: '90px',
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
  } as React.CSSProperties,
  scoreBar: {
    flex: 1,
    height: '6px',
    backgroundColor: 'var(--surface-tertiary)',
    borderRadius: '999px',
    overflow: 'hidden',
  } as React.CSSProperties,
  scoreFill: {
    height: '100%',
    borderRadius: '999px',
    transition: 'width 0.3s ease',
  } as React.CSSProperties,
  scoreValue: {
    width: '36px',
    textAlign: 'right' as const,
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  evidence: {
    margin: '1rem 0',
    padding: '0.75rem',
    backgroundColor: 'var(--surface-primary)',
    borderLeft: '3px solid var(--color-brand-blue)',
    borderRadius: '0.375rem',
    fontStyle: 'italic',
    fontSize: '0.8125rem',
    color: 'var(--text-secondary)',
  } as React.CSSProperties,
  assessmentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.75rem',
    marginBottom: '1rem',
  } as React.CSSProperties,
  assessmentItem: {
    padding: '0.75rem',
    backgroundColor: 'var(--surface-primary)',
    borderRadius: '0.5rem',
  } as React.CSSProperties,
  assessmentLabel: {
    fontSize: '0.6875rem',
    color: 'var(--text-tertiary)',
    marginBottom: '0.25rem',
  } as React.CSSProperties,
  assessmentValue: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
  } as React.CSSProperties,
  modalActions: {
    display: 'flex',
    gap: '0.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid var(--border-primary)',
  } as React.CSSProperties,
  modalBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.625rem 1rem',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
  } as React.CSSProperties,
};

const SignalsDashboard: React.FC = () => {
  const [signals, setSignals] = useState<IBoodSignal[]>([]);
  const [companies, setCompanies] = useState<IBoodCompany[]>([]);
  const [savedSignals, setSavedSignals] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'signals' | 'companies' | 'categories' | 'watchlist'>('signals');
  const [filterPriority, setFilterPriority] = useState<SignalPriority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSignal, setSelectedSignal] = useState<IBoodSignal | null>(null);
  const [loading, setLoading] = useState(true);
  const [vectorStats, setVectorStats] = useState<{ signals_indexed: number; outcomes_recorded: number } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch signals from API
        const signalsRes = await fetch('/api/signals-intelligence/list?limit=50');
        if (signalsRes.ok) {
          const signalsData = await signalsRes.json();
          // Map API response to frontend interface
          const mappedSignals = signalsData.map((s: Record<string, unknown>) => ({
            ...s,
            signal_type: s.signal_type as IBoodSignalType,
            signal_priority: s.signal_priority as SignalPriority,
            status: (s.status || 'new') as SignalStatus,
            categories: (s.categories || []) as ProductCategory[],
          }));
          setSignals(mappedSignals);
        } else {
          // Fallback to demo data
          setSignals(createDemoSignals());
        }

        // Fetch companies from API
        const companiesRes = await fetch('/api/signals-intelligence/companies?limit=20');
        if (companiesRes.ok) {
          const companiesData = await companiesRes.json();
          setCompanies(companiesData);
        } else {
          setCompanies(createDemoCompanies());
        }

        // Fetch dashboard stats for vector index info
        const dashRes = await fetch('/api/signals-intelligence/');
        if (dashRes.ok) {
          const dashData = await dashRes.json();
          setVectorStats(dashData.vector_index);
        }
      } catch (error) {
        console.error('Error fetching signals data:', error);
        // Fallback to demo data on error
        setSignals(createDemoSignals());
        setCompanies(createDemoCompanies());
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredSignals = signals.filter((signal) => {
    if (filterPriority !== 'all' && signal.signal_priority !== filterPriority) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return signal.company_name.toLowerCase().includes(q) || signal.title.toLowerCase().includes(q);
    }
    return true;
  });

  const hotSignals = filteredSignals.filter((s) => s.signal_priority === 'hot');
  const strategicSignals = filteredSignals.filter((s) => s.signal_priority === 'strategic');
  const marketSignals = filteredSignals.filter((s) => s.signal_priority === 'market');
  const relationshipSignals = filteredSignals.filter((s) => s.signal_priority === 'relationship');

  const stats = {
    total: signals.length,
    hot: signals.filter((s) => s.signal_priority === 'hot').length,
    new: signals.filter((s) => s.status === 'new').length,
    saved: savedSignals.size,
  };

  const handleSave = (signal: IBoodSignal, e: React.MouseEvent) => {
    e.stopPropagation();
    setSavedSignals((prev) => {
      const next = new Set(prev);
      next.has(signal.id) ? next.delete(signal.id) : next.add(signal.id);
      return next;
    });
  };

  const renderSignalCard = (signal: IBoodSignal) => {
    const config = SIGNAL_CONFIG[signal.signal_type];
    const priority = PRIORITY_CONFIG[signal.signal_priority];
    const isSaved = savedSignals.has(signal.id);

    return (
      <div key={signal.id} style={styles.card} onClick={() => setSelectedSignal(signal)}>
        <div style={styles.cardHeader}>
          <span style={{ ...styles.badge, backgroundColor: priority.bg, color: priority.color }}>
            {priority.icon} {config.label}
          </span>
          <div style={styles.meta}>
            <span style={styles.confidence}>{signal.confidence_score}% confidence</span>
            <span style={styles.time}>{formatTimeAgo(signal.detected_at)}</span>
          </div>
        </div>
        <div style={styles.company}>
          <Building2 size={14} />
          <span style={styles.companyName}>{signal.company_name}</span>
          <span>{signal.company_country}</span>
        </div>
        <h4 style={styles.cardTitle}>{signal.title}</h4>
        <p style={styles.cardSummary}>{signal.summary}</p>
        <div style={styles.tags}>
          {signal.categories.slice(0, 2).map((cat) => (
            <span key={cat} style={styles.tag}>{CATEGORY_LABELS[cat]}</span>
          ))}
        </div>
        {(signal.estimated_value || signal.likely_discount_range) && (
          <div style={styles.dealInfo}>
            {signal.estimated_value && (
              <div style={styles.dealItem}>
                <DollarSign size={12} /> Est: {formatCurrency(signal.estimated_value)}
              </div>
            )}
            {signal.likely_discount_range && (
              <div style={styles.dealItem}>
                <TrendingDown size={12} /> Discount: {signal.likely_discount_range}
              </div>
            )}
            {signal.competition_level && (
              <div style={{ ...styles.dealItem, color: signal.competition_level === 'high' ? '#EF4444' : signal.competition_level === 'medium' ? '#F59E0B' : '#10B981' }}>
                <Users size={12} /> {signal.competition_level} competition
              </div>
            )}
          </div>
        )}
        <div style={styles.actions}>
          <button style={{ ...styles.btn, ...styles.btnPrimary }}><Eye size={12} /> View</button>
          <button style={styles.btn}><Mail size={12} /> Contact</button>
          <button style={{ ...styles.btn, color: isSaved ? 'var(--color-brand-blue)' : undefined }} onClick={(e) => handleSave(signal, e)}>
            {isSaved ? <BookmarkCheck size={12} /> : <Bookmark size={12} />}
          </button>
        </div>
      </div>
    );
  };

  const renderCompanyCard = (company: IBoodCompany) => (
    <div key={company.id} style={styles.card}>
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{ width: 40, height: 40, backgroundColor: 'var(--surface-tertiary)', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          <Building2 size={20} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.125rem' }}>{company.name}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            {company.country} {company.revenue_eur && `• ${formatCurrency(company.revenue_eur)}`}
          </div>
        </div>
      </div>
      <div style={styles.tags}>
        {company.categories.map((cat) => <span key={cat} style={styles.tag}>{CATEGORY_LABELS[cat]}</span>)}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', backgroundColor: 'var(--surface-primary)', borderRadius: '0.5rem', marginBottom: '0.75rem', fontSize: '0.75rem' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{company.active_signals}</div>
          <div style={{ color: 'var(--text-tertiary)' }}>Signals</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{company.status.replace('_', ' ')}</div>
          <div style={{ color: 'var(--text-tertiary)' }}>Status</div>
        </div>
        {company.past_gmv && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(company.past_gmv)}</div>
            <div style={{ color: 'var(--text-tertiary)' }}>Past GMV</div>
          </div>
        )}
      </div>
      {company.latest_signal && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          <Zap size={12} /> Latest: {company.latest_signal}
        </div>
      )}
      <button style={{ ...styles.btn, width: '100%', justifyContent: 'center' }}>
        View Details <ChevronRight size={14} />
      </button>
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Stats Row */}
      <div style={styles.statsRow}>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #EF4444' }}>
          <span style={styles.statIcon}>🔥</span>
          <div>
            <div style={styles.statValue}>{stats.hot} hot signals</div>
            <div style={styles.statLabel}>in your categories</div>
          </div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #3B82F6' }}>
          <span style={styles.statIcon}>📊</span>
          <div>
            <div style={styles.statValue}>{stats.total} total</div>
            <div style={styles.statLabel}>active signals</div>
          </div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #10B981' }}>
          <span style={styles.statIcon}>✨</span>
          <div>
            <div style={styles.statValue}>{stats.new} new</div>
            <div style={styles.statLabel}>since last visit</div>
          </div>
        </div>
        <div style={{ ...styles.statCard, borderLeft: '4px solid #8B5CF6' }}>
          <span style={styles.statIcon}>⭐</span>
          <div>
            <div style={styles.statValue}>{stats.saved} saved</div>
            <div style={styles.statLabel}>in watchlist</div>
          </div>
        </div>
      </div>

      {/* Learning Loop Stats */}
      {vectorStats && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: 'var(--surface-secondary)', borderRadius: '0.75rem', border: '1px solid var(--border-primary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1rem' }}>🧠</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Learning Loop Active</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-brand-blue)' }}>{vectorStats.signals_indexed}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>signals indexed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#10B981' }}>{vectorStats.outcomes_recorded}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>outcomes recorded</span>
          </div>
          <div style={{ marginLeft: 'auto', fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
            Top 8 similar signals used for AI analysis
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        {(['signals', 'companies', 'categories', 'watchlist'] as const).map((tab) => (
          <button
            key={tab}
            style={{ ...styles.tab, ...(activeTab === tab ? styles.tabActive : {}) }}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'signals' && <Zap size={14} />}
            {tab === 'companies' && <Building2 size={14} />}
            {tab === 'categories' && <BarChart3 size={14} />}
            {tab === 'watchlist' && <Bookmark size={14} />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'watchlist' && savedSignals.size > 0 && (
              <span style={{ backgroundColor: 'var(--color-brand-blue)', color: 'white', padding: '0 0.375rem', borderRadius: '999px', fontSize: '0.625rem' }}>
                {savedSignals.size}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div style={styles.filters}>
        <div style={styles.searchBox}>
          <Search size={14} style={{ color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            placeholder="Search signals, companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <Filter size={14} style={{ color: 'var(--text-tertiary)' }} />
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as SignalPriority | 'all')} style={styles.select}>
          <option value="all">All Priorities</option>
          <option value="hot">🔥 Hot</option>
          <option value="strategic">⭐ Strategic</option>
          <option value="market">📊 Market Intel</option>
          <option value="relationship">🤝 Relationship</option>
        </select>
        <button style={styles.btn}><RefreshCw size={12} /> Refresh</button>
      </div>

      {/* Content */}
      {activeTab === 'signals' && (
        <div>
          {hotSignals.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <span style={{ fontSize: '1.125rem' }}>🔥</span>
                <h3 style={styles.sectionTitle}>Hot Opportunities</h3>
                <span style={styles.sectionCount}>{hotSignals.length}</span>
              </div>
              <p style={styles.sectionSubtitle}>Immediate action required - motivated sellers</p>
              <div style={styles.grid}>{hotSignals.map(renderSignalCard)}</div>
            </div>
          )}
          {strategicSignals.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <span style={{ fontSize: '1.125rem' }}>⭐</span>
                <h3 style={styles.sectionTitle}>Strategic Opportunities</h3>
                <span style={styles.sectionCount}>{strategicSignals.length}</span>
              </div>
              <p style={styles.sectionSubtitle}>Worth monitoring for upcoming deals</p>
              <div style={styles.grid}>{strategicSignals.map(renderSignalCard)}</div>
            </div>
          )}
          {marketSignals.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <span style={{ fontSize: '1.125rem' }}>📊</span>
                <h3 style={styles.sectionTitle}>Market Intelligence</h3>
                <span style={styles.sectionCount}>{marketSignals.length}</span>
              </div>
              <p style={styles.sectionSubtitle}>Broader market trends and opportunities</p>
              <div style={styles.grid}>{marketSignals.map(renderSignalCard)}</div>
            </div>
          )}
          {relationshipSignals.length > 0 && (
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <span style={{ fontSize: '1.125rem' }}>🤝</span>
                <h3 style={styles.sectionTitle}>Relationship Building</h3>
                <span style={styles.sectionCount}>{relationshipSignals.length}</span>
              </div>
              <p style={styles.sectionSubtitle}>Long-term partnership opportunities</p>
              <div style={styles.grid}>{relationshipSignals.map(renderSignalCard)}</div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'companies' && (
        <div style={styles.grid}>{companies.map(renderCompanyCard)}</div>
      )}

      {activeTab === 'categories' && (
        <div style={styles.grid}>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const catSignals = signals.filter((s) => s.categories.includes(key as ProductCategory));
            const hotCount = catSignals.filter((s) => s.signal_priority === 'hot').length;
            return (
              <div key={key} style={styles.card}>
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 0.75rem 0' }}>{label}</h4>
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.75rem' }}>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{catSignals.length}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Total Signals</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#EF4444' }}>{hotCount}</div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Hot</div>
                  </div>
                </div>
                <button style={{ ...styles.btn, width: '100%', justifyContent: 'center' }}>
                  View Signals <ChevronRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'watchlist' && (
        savedSignals.size === 0 ? (
          <EmptyState type="watchlist" />
        ) : (
          <div style={styles.grid}>
            {signals.filter((s) => savedSignals.has(s.id)).map(renderSignalCard)}
          </div>
        )
      )}

      {/* Modal */}
      {selectedSignal && (
        <div style={styles.modalOverlay} onClick={() => setSelectedSignal(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={{ ...styles.badge, backgroundColor: PRIORITY_CONFIG[selectedSignal.signal_priority].bg, color: PRIORITY_CONFIG[selectedSignal.signal_priority].color, padding: '0.5rem 0.75rem', fontSize: '0.8125rem' }}>
                {PRIORITY_CONFIG[selectedSignal.signal_priority].icon} {SIGNAL_CONFIG[selectedSignal.signal_type].label}
              </span>
              <button onClick={() => setSelectedSignal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '0.5rem' }}>
                <XCircle size={20} />
              </button>
            </div>
            <div style={styles.modalContent}>
              <div style={styles.company}>
                <Building2 size={16} />
                <span style={styles.companyName}>{selectedSignal.company_name}</span>
                <span>{selectedSignal.company_country}</span>
              </div>
              <h2 style={styles.modalTitle}>{selectedSignal.title}</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 1rem 0' }}>{selectedSignal.summary}</p>

              <div style={{ marginBottom: '1rem' }}>
                <div style={styles.scoreRow}>
                  <span style={styles.scoreLabel}>Confidence</span>
                  <div style={styles.scoreBar}>
                    <div style={{ ...styles.scoreFill, width: `${selectedSignal.confidence_score}%`, backgroundColor: 'var(--color-success-500)' }} />
                  </div>
                  <span style={styles.scoreValue}>{selectedSignal.confidence_score}%</span>
                </div>
                <div style={styles.scoreRow}>
                  <span style={styles.scoreLabel}>Deal Potential</span>
                  <div style={styles.scoreBar}>
                    <div style={{ ...styles.scoreFill, width: `${selectedSignal.deal_potential_score}%`, backgroundColor: 'var(--color-brand-blue)' }} />
                  </div>
                  <span style={styles.scoreValue}>{selectedSignal.deal_potential_score}%</span>
                </div>
              </div>

              {selectedSignal.evidence?.quotes?.[0] && (
                <div style={styles.evidence}>{selectedSignal.evidence.quotes[0]}</div>
              )}

              <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: '1rem 0 0.75rem 0' }}>Deal Assessment</h4>
              <div style={styles.assessmentGrid}>
                {selectedSignal.estimated_value && (
                  <div style={styles.assessmentItem}>
                    <div style={styles.assessmentLabel}>Estimated Value</div>
                    <div style={styles.assessmentValue}>{formatCurrency(selectedSignal.estimated_value)}</div>
                  </div>
                )}
                {selectedSignal.likely_discount_range && (
                  <div style={styles.assessmentItem}>
                    <div style={styles.assessmentLabel}>Likely Discount</div>
                    <div style={styles.assessmentValue}>{selectedSignal.likely_discount_range}</div>
                  </div>
                )}
                {selectedSignal.competition_level && (
                  <div style={styles.assessmentItem}>
                    <div style={styles.assessmentLabel}>Competition</div>
                    <div style={{ ...styles.assessmentValue, color: selectedSignal.competition_level === 'high' ? '#EF4444' : selectedSignal.competition_level === 'medium' ? '#F59E0B' : '#10B981' }}>
                      {selectedSignal.competition_level.charAt(0).toUpperCase() + selectedSignal.competition_level.slice(1)}
                    </div>
                  </div>
                )}
                {selectedSignal.timing_recommendation && (
                  <div style={{ ...styles.assessmentItem, gridColumn: '1 / -1' }}>
                    <div style={styles.assessmentLabel}>Timing Recommendation</div>
                    <div style={styles.assessmentValue}>{selectedSignal.timing_recommendation}</div>
                  </div>
                )}
              </div>

              <div style={styles.modalActions}>
                <button style={{ ...styles.modalBtn, backgroundColor: 'var(--color-brand-blue)', border: 'none', color: 'white' }}>
                  <Mail size={14} /> Contact Supplier
                </button>
                <button style={{ ...styles.modalBtn, backgroundColor: 'transparent', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>
                  <Phone size={14} /> Schedule Call
                </button>
                <button
                  onClick={() => handleSave(selectedSignal, { stopPropagation: () => {} } as React.MouseEvent)}
                  style={{ ...styles.modalBtn, backgroundColor: 'transparent', border: '1px solid var(--border-primary)', color: savedSignals.has(selectedSignal.id) ? 'var(--color-brand-blue)' : 'var(--text-secondary)' }}
                >
                  {savedSignals.has(selectedSignal.id) ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                  {savedSignals.has(selectedSignal.id) ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignalsDashboard;
