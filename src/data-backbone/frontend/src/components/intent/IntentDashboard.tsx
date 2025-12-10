import React, { useState, useEffect } from 'react';
import {
  LinearScoreIndicator,
  BANTScorecard,
  PersonaCard,
  RiskCardCompact,
  EmptyState
} from '../ui';
import type { PersonaType, EngagementLevel, Severity } from '../ui';

// Types
interface BuyerPersona {
  id: string;
  contact_name: string;
  contact_title: string;
  persona_type: string;
  engagement_level: string;
  influence_score: number;
  can_veto: boolean;
  motivations: string[];
  concerns: string[];
}

interface BANTScore {
  total_score: number;
  budget: { score: number; max: number; evidence: string };
  authority: { score: number; max: number; evidence: string };
  need: { score: number; max: number; evidence: string };
  timeline: { score: number; max: number; evidence: string };
}

interface SPINAnalysis {
  score: number;
  situation: { content: string; confidence: number };
  problem: { content: string; confidence: number };
  implication: { content: string; confidence: number };
  need_payoff: { content: string; confidence: number };
}

interface DealRisk {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  probability: number;
  status: string;
}

interface DealIntent {
  deal_id: string;
  deal_name: string;
  deal_value: number;
  deal_stage: string;
  bant_score: number;
  spin_score: number;
  paranoid_verdict: string;
  failure_probability: number;
  commit_ready: boolean;
  blocking_items: number;
  close_date: string | null;
}

interface DealDetail {
  deal: {
    id: string;
    name: string;
    value: number;
    stage: string;
    close_date: string | null;
  };
  bant: BANTScore;
  spin: SPINAnalysis;
  personas: {
    list: BuyerPersona[];
    coverage: any;
  };
  paranoid_twin: {
    verdict: string;
    failure_probability: number;
    analysis: any;
  };
  risk_register: {
    critical_risks: DealRisk[];
    medium_risks: DealRisk[];
    risk_score: number;
  };
  commit_gate: {
    passed: boolean;
    blocking_items: string[];
    warning_items: string[];
    recommendation: string;
  };
}

// Demo data
const DEMO_DEALS: DealIntent[] = [
  {
    deal_id: 'deal-philips-pc-001',
    deal_name: 'Philips Personal Care',
    deal_value: 450000,
    deal_stage: 'commit',
    bant_score: 82,
    spin_score: 88,
    paranoid_verdict: 'hold',
    failure_probability: 45,
    commit_ready: false,
    blocking_items: 2,
    close_date: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    deal_id: 'deal-sony-audio-001',
    deal_name: 'Sony Audio',
    deal_value: 380000,
    deal_stage: 'commit',
    bant_score: 91,
    spin_score: 85,
    paranoid_verdict: 'ready',
    failure_probability: 15,
    commit_ready: true,
    blocking_items: 0,
    close_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    deal_id: 'deal-tefal-cookware-001',
    deal_name: 'Tefal Cookware',
    deal_value: 220000,
    deal_stage: 'commit',
    bant_score: 75,
    spin_score: 80,
    paranoid_verdict: 'hold',
    failure_probability: 30,
    commit_ready: false,
    blocking_items: 1,
    close_date: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    deal_id: 'deal-xiaomi-smart-001',
    deal_name: 'Xiaomi Smart',
    deal_value: 150000,
    deal_stage: 'commit',
    bant_score: 45,
    spin_score: 25,
    paranoid_verdict: 'block',
    failure_probability: 70,
    commit_ready: false,
    blocking_items: 4,
    close_date: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const DEMO_PHILIPS_DETAIL: DealDetail = {
  deal: {
    id: 'deal-philips-pc-001',
    name: 'Philips Personal Care',
    value: 450000,
    stage: 'commit',
    close_date: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000).toISOString(),
  },
  bant: {
    total_score: 82,
    budget: { score: 20, max: 25, evidence: 'Budget exists, approval process clear. CFO confirmed authority.' },
    authority: { score: 18, max: 25, evidence: 'Decision-maker engaged but blocker not neutralized.' },
    need: { score: 24, max: 25, evidence: 'Critical, quantified, urgent need. €120M excess inventory.' },
    timeline: { score: 20, max: 25, evidence: 'Clear deadline Dec 31, but timeline slipped once.' },
  },
  spin: {
    score: 88,
    situation: {
      content: '€120M excess inventory in Personal Care division. 200K+ units of grooming products (OneBlade, shavers). Year-end financial close approaching (Dec 31). New product launch Q1 2025 needs warehouse space.',
      confidence: 95,
    },
    problem: {
      content: 'Q4 inventory targets at risk. Warehouse costs increasing (~€200K/month). Cash tied up in stock. Traditional retail channels saturated.',
      confidence: 90,
    },
    implication: {
      content: 'Write-down on Q4 financials (analyst pressure). Q1 launch delayed due to space constraints. Jan\'s Q4 bonus at risk. CFO under board pressure.',
      confidence: 85,
    },
    need_payoff: {
      content: 'Clear €48M+ in inventory. Free up warehouse for Q1 product launch. Avoid write-down impact on stock price. Build ongoing iBOOD channel.',
      confidence: 90,
    },
  },
  personas: {
    list: [
      {
        id: '1',
        contact_name: 'Maria van den Berg',
        contact_title: 'CFO Benelux',
        persona_type: 'economic_buyer',
        engagement_level: 'silent',
        influence_score: 90,
        can_veto: false,
        motivations: ['Improve working capital', 'Hit Q4 targets'],
        concerns: ['Brand reputation'],
      },
      {
        id: '2',
        contact_name: 'Peter de Jong',
        contact_title: 'Supply Chain Director',
        persona_type: 'technical_buyer',
        engagement_level: 'engaged',
        influence_score: 75,
        can_veto: false,
        motivations: ['Clear warehouse space'],
        concerns: ['Logistics complexity'],
      },
      {
        id: '3',
        contact_name: 'Jan de Vries',
        contact_title: 'Sales Director Benelux',
        persona_type: 'champion',
        engagement_level: 'engaged',
        influence_score: 85,
        can_veto: false,
        motivations: ['Hit Q4 target', 'Build iBOOD relationship'],
        concerns: ['Internal politics'],
      },
      {
        id: '4',
        contact_name: 'Sophie Bakker',
        contact_title: 'Brand Manager',
        persona_type: 'user_buyer',
        engagement_level: 'cautious',
        influence_score: 60,
        can_veto: false,
        motivations: ['Protect brand image'],
        concerns: ['Discount positioning'],
      },
      {
        id: '5',
        contact_name: 'Thomas Mueller',
        contact_title: 'EU Marketing Director',
        persona_type: 'blocker',
        engagement_level: 'blocking',
        influence_score: 80,
        can_veto: true,
        motivations: ['Brand consistency'],
        concerns: ['Discount channels', 'Brand dilution'],
      },
    ],
    coverage: {},
  },
  paranoid_twin: {
    verdict: 'hold',
    failure_probability: 45,
    analysis: {
      critical_risks: [
        {
          title: 'The Blocker is Still Blocking',
          description: 'Thomas (EU Marketing Director) has not been neutralized. He has veto power.',
          probability: 60,
          why_kills_deal: 'Marketing often blocks discount channels at the last minute to protect brand equity.',
        },
        {
          title: 'CFO Has Gone Silent (4 days)',
          description: 'Maria (CFO) confirmed budget authority on Dec 5. No direct engagement since.',
          probability: 35,
          why_kills_deal: 'Economic buyers who go silent often have competing priorities or have been overruled.',
        },
      ],
      significant_risks: [
        {
          title: 'Timeline Already Slipped Once',
          description: 'Original close date was Dec 15. Now Dec 20. What changed?',
          probability: 40,
        },
        {
          title: 'Competitor May Be Circling',
          description: 'Philips inventory signal was public. Veepee, Groupon likely aware.',
          probability: 25,
        },
      ],
      recommendation: 'Delay commit by 3-5 days to address: The Blocker is Still Blocking. Get direct confirmation from Thomas or written approval.',
    },
  },
  risk_register: {
    critical_risks: [
      {
        id: 'r1',
        title: 'Blocker not neutralized',
        description: 'Thomas has veto power on brand decisions',
        category: 'blocker_power',
        severity: 'critical',
        probability: 60,
        status: 'open',
      },
      {
        id: 'r2',
        title: 'CFO silent 4 days',
        description: 'Economic buyer not engaged recently',
        category: 'authority_gaps',
        severity: 'critical',
        probability: 35,
        status: 'open',
      },
    ],
    medium_risks: [
      {
        id: 'r3',
        title: 'Timeline slipped',
        description: 'From Dec 15 to Dec 20',
        category: 'timeline_slippage',
        severity: 'medium',
        probability: 40,
        status: 'open',
      },
      {
        id: 'r4',
        title: 'Competitor circling',
        description: 'Public signal, others aware',
        category: 'competitive_threat',
        severity: 'medium',
        probability: 25,
        status: 'open',
      },
    ],
    risk_score: 42,
  },
  commit_gate: {
    passed: false,
    blocking_items: ['Blockers not neutralized', 'Critical risks unaddressed'],
    warning_items: ['CFO not engaged in 4 days', 'Timeline slipped once'],
    recommendation: 'Address 2 blocking items before commit. Request direct confirmation from Maria and neutralization plan for Thomas.',
  },
};

// Helper to map API persona types to UI component types
const mapPersonaType = (type: string): PersonaType => {
  const mapping: Record<string, PersonaType> = {
    economic_buyer: 'economic-buyer',
    technical_buyer: 'technical-buyer',
    user_buyer: 'user-buyer',
    champion: 'champion',
    blocker: 'blocker',
    gatekeeper: 'gatekeeper',
  };
  return mapping[type] || 'economic-buyer';
};

const mapEngagementLevel = (level: string): EngagementLevel => {
  const mapping: Record<string, EngagementLevel> = {
    engaged: 'engaged',
    cautious: 'cautious',
    blocking: 'blocking',
    silent: 'unknown',
    unknown: 'unknown',
  };
  return mapping[level] || 'unknown';
};

const mapSeverity = (severity: string): Severity => {
  const mapping: Record<string, Severity> = {
    critical: 'critical',
    high: 'high',
    medium: 'medium',
    low: 'low',
    mitigated: 'mitigated',
  };
  return mapping[severity] || 'medium';
};

const VerdictBadge = ({ verdict }: { verdict: string }) => {
  const config: Record<string, { bg: string; icon: string; label: string }> = {
    ready: { bg: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: '✅', label: 'Ready' },
    hold: { bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: '⚠️', label: 'Hold' },
    block: { bg: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: '🔴', label: 'Block' },
  };
  const c = config[verdict] || config.hold;
  return (
    <span className={`px-2 py-1 text-xs rounded-full font-medium ${c.bg}`}>
      {c.icon} {c.label}
    </span>
  );
};


// Main Dashboard Component
export default function IntentDashboard() {
  const [deals, setDeals] = useState<DealIntent[]>(DEMO_DEALS);
  const [selectedDeal, setSelectedDeal] = useState<DealDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'personas' | 'spin' | 'bant' | 'paranoid' | 'risks'>('overview');
  const [loading, setLoading] = useState(false);

  const loadDealDetail = (dealId: string) => {
    setLoading(true);
    // In production, fetch from API
    setTimeout(() => {
      if (dealId === 'deal-philips-pc-001') {
        setSelectedDeal(DEMO_PHILIPS_DETAIL);
      }
      setLoading(false);
    }, 300);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' });
  };

  // Summary stats
  const commitDeals = deals.filter(d => d.deal_stage === 'commit');
  const totalValue = commitDeals.reduce((sum, d) => sum + d.deal_value, 0);
  const readyCount = commitDeals.filter(d => d.commit_ready).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Intent Analysis</h1>
        <p className="text-gray-600 dark:text-gray-400">Deal Qualification, Buyer Intent & Risk Assessment</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Commit Stage Deals</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{commitDeals.length}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Total Pipeline</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(totalValue)}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Ready to Close</div>
          <div className="text-2xl font-bold text-green-600">{readyCount}</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">Needs Attention</div>
          <div className="text-2xl font-bold text-amber-600">{commitDeals.length - readyCount}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deal List */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-semibold text-gray-900 dark:text-white">Commit Stage Deals</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {commitDeals.map((deal) => (
                <div
                  key={deal.deal_id}
                  className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition ${
                    selectedDeal?.deal.id === deal.deal_id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => loadDealDetail(deal.deal_id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{deal.deal_name}</div>
                      <div className="text-sm text-gray-500">{formatCurrency(deal.deal_value)}</div>
                    </div>
                    <VerdictBadge verdict={deal.paranoid_verdict} />
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      BANT: <span className="font-medium">{deal.bant_score}</span>
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      SPIN: <span className="font-medium">{deal.spin_score}</span>
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Close: {formatDate(deal.close_date)}
                    </span>
                  </div>
                  {deal.blocking_items > 0 && (
                    <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                      {deal.blocking_items} blocking item{deal.blocking_items > 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Deal Detail */}
        <div className="lg:col-span-2">
          {selectedDeal ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              {/* Deal Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedDeal.deal.name}</h2>
                    <div className="text-gray-600 dark:text-gray-400">
                      {formatCurrency(selectedDeal.deal.value)} • {selectedDeal.deal.stage} • Close: {formatDate(selectedDeal.deal.close_date)}
                    </div>
                  </div>
                  <div className="text-right">
                    <VerdictBadge verdict={selectedDeal.paranoid_twin.verdict} />
                    <div className="text-sm text-gray-500 mt-1">
                      Failure risk: {selectedDeal.paranoid_twin.failure_probability}%
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex -mb-px">
                  {(['overview', 'personas', 'bant', 'spin', 'paranoid', 'risks'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                      }`}
                    >
                      {tab.charAt(0).toUpperCase() + tab.slice(1).replace('_', ' ')}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-4">
                {activeTab === 'overview' && (
                  <div className="space-y-4">
                    {/* Commit Gate Status */}
                    <div className={`p-4 rounded-lg ${selectedDeal.commit_gate.passed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{selectedDeal.commit_gate.passed ? '✅' : '🔴'}</span>
                        <span className="font-semibold">
                          {selectedDeal.commit_gate.passed ? 'COMMIT GATE PASSED' : 'NOT READY FOR COMMIT'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{selectedDeal.commit_gate.recommendation}</p>
                      {selectedDeal.commit_gate.blocking_items.length > 0 && (
                        <div className="mt-2">
                          <div className="text-sm font-medium text-red-700 dark:text-red-400">Blocking:</div>
                          <ul className="text-sm text-red-600 dark:text-red-400 list-disc list-inside">
                            {selectedDeal.commit_gate.blocking_items.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Quick Scores */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">BANT Score</div>
                        <div className="text-3xl font-bold">{selectedDeal.bant.total_score}/100</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedDeal.bant.total_score >= 70 ? '✅ Threshold met' : '⚠️ Below threshold'}
                        </div>
                      </div>
                      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">SPIN Score</div>
                        <div className="text-3xl font-bold">{selectedDeal.spin.score}/100</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedDeal.spin.score >= 70 ? '✅ Strong qualification' : '⚠️ Needs work'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'personas' && (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Buyer personas identified and their engagement status
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedDeal.personas.list.map((persona) => (
                        <PersonaCard
                          key={persona.id}
                          name={persona.contact_name}
                          title={persona.contact_title}
                          personaType={mapPersonaType(persona.persona_type)}
                          engagement={mapEngagementLevel(persona.engagement_level)}
                          influence={persona.influence_score}
                          canVeto={persona.can_veto}
                          motivations={persona.motivations}
                          concerns={persona.concerns}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'bant' && (
                  <div className="space-y-6">
                    <BANTScorecard
                      budget={selectedDeal.bant.budget.score}
                      authority={selectedDeal.bant.authority.score}
                      need={selectedDeal.bant.need.score}
                      timeline={selectedDeal.bant.timeline.score}
                      maxPerCategory={25}
                    />

                    <div className="space-y-4">
                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <LinearScoreIndicator
                          items={[{
                            label: 'Budget',
                            value: selectedDeal.bant.budget.score,
                            max: 25
                          }]}
                        />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{selectedDeal.bant.budget.evidence}</p>
                      </div>
                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <LinearScoreIndicator
                          items={[{
                            label: 'Authority',
                            value: selectedDeal.bant.authority.score,
                            max: 25
                          }]}
                        />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{selectedDeal.bant.authority.evidence}</p>
                      </div>
                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <LinearScoreIndicator
                          items={[{
                            label: 'Need',
                            value: selectedDeal.bant.need.score,
                            max: 25
                          }]}
                        />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{selectedDeal.bant.need.evidence}</p>
                      </div>
                      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                        <LinearScoreIndicator
                          items={[{
                            label: 'Timeline',
                            value: selectedDeal.bant.timeline.score,
                            max: 25
                          }]}
                        />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{selectedDeal.bant.timeline.evidence}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'spin' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">S — Situation</h3>
                        <span className="text-sm text-gray-500">{selectedDeal.spin.situation.confidence}% confidence</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{selectedDeal.spin.situation.content}</p>
                    </div>
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">P — Problem</h3>
                        <span className="text-sm text-gray-500">{selectedDeal.spin.problem.confidence}% confidence</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{selectedDeal.spin.problem.content}</p>
                    </div>
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">I — Implication</h3>
                        <span className="text-sm text-gray-500">{selectedDeal.spin.implication.confidence}% confidence</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{selectedDeal.spin.implication.content}</p>
                    </div>
                    <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white">N — Need-Payoff</h3>
                        <span className="text-sm text-gray-500">{selectedDeal.spin.need_payoff.confidence}% confidence</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{selectedDeal.spin.need_payoff.content}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'paranoid' && (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg ${
                      selectedDeal.paranoid_twin.verdict === 'ready' ? 'bg-green-50 dark:bg-green-900/20' :
                      selectedDeal.paranoid_twin.verdict === 'hold' ? 'bg-yellow-50 dark:bg-yellow-900/20' :
                      'bg-red-50 dark:bg-red-900/20'
                    }`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🔴</span>
                        <span className="font-bold text-lg">PARANOID TWIN ANALYSIS</span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Combined probability of deal failure: <strong>{selectedDeal.paranoid_twin.failure_probability}%</strong>
                      </p>
                    </div>

                    {selectedDeal.paranoid_twin.analysis.critical_risks?.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">🚨 Critical Risks (Deal Killers)</h3>
                        {selectedDeal.paranoid_twin.analysis.critical_risks.map((risk: any, i: number) => (
                          <div key={i} className="p-4 border border-red-200 dark:border-red-800 rounded-lg mb-2 bg-red-50/50 dark:bg-red-900/10">
                            <div className="font-medium text-gray-900 dark:text-white">{risk.title}</div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{risk.description}</p>
                            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                              <strong>Why this kills the deal:</strong> {risk.why_kills_deal}
                            </p>
                            <p className="text-sm mt-1">
                              Probability of deal failure if unaddressed: <strong>{risk.probability}%</strong>
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedDeal.paranoid_twin.analysis.significant_risks?.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-2">⚠️ Significant Risks (Deal Delayers)</h3>
                        {selectedDeal.paranoid_twin.analysis.significant_risks.map((risk: any, i: number) => (
                          <div key={i} className="p-3 border border-yellow-200 dark:border-yellow-800 rounded-lg mb-2 bg-yellow-50/50 dark:bg-yellow-900/10">
                            <div className="font-medium text-gray-900 dark:text-white">{risk.title}</div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{risk.description}</p>
                            <p className="text-sm mt-1">Probability: <strong>{risk.probability}%</strong></p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <h3 className="font-semibold mb-2">Recommendation</h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {selectedDeal.paranoid_twin.analysis.recommendation}
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'risks' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">Risk Score: </span>
                        <span className={`font-bold ${
                          selectedDeal.risk_register.risk_score <= 30 ? 'text-green-600' :
                          selectedDeal.risk_register.risk_score <= 50 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {selectedDeal.risk_register.risk_score}/100
                        </span>
                        <span className="text-sm text-gray-500 ml-2">(threshold: 30)</span>
                      </div>
                    </div>

                    {selectedDeal.risk_register.critical_risks.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">Critical Risks</h3>
                        <div className="space-y-2">
                          {selectedDeal.risk_register.critical_risks.map((risk) => (
                            <RiskCardCompact
                              key={risk.id}
                              title={risk.title}
                              severity={mapSeverity(risk.severity)}
                              probability={risk.probability}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedDeal.risk_register.medium_risks.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-yellow-700 dark:text-yellow-400 mb-2">Medium Risks</h3>
                        <div className="space-y-2">
                          {selectedDeal.risk_register.medium_risks.map((risk) => (
                            <RiskCardCompact
                              key={risk.id}
                              title={risk.title}
                              severity={mapSeverity(risk.severity)}
                              probability={risk.probability}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedDeal.risk_register.critical_risks.length === 0 &&
                     selectedDeal.risk_register.medium_risks.length === 0 && (
                      <EmptyState type="risks" />
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <EmptyState
                type="deals"
                title="Select a Deal"
                description="Click on a deal from the list to view its intent analysis, BANT score, SPIN analysis, and Paranoid Twin assessment."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
