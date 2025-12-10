import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { useTranslation } from 'react-i18next';
import { Card } from './ui/Card';
import {
  Building2,
  Users,
  AlertTriangle,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Phone,
  Mail,
  Target,
  Zap,
  Bot,
  ChevronRight,
  AlertCircle,
  User,
  DollarSign,
  ThumbsUp,
  PauseCircle,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from 'lucide-react';

// Types
interface DealData {
  id: string;
  name: string;
  stage: string;
  value: number;
  probability: number;
  company_name: string;
  company_id: string;
  owner: string;
  expected_close_date: string;
  days_stale?: number;
  health_status?: 'healthy' | 'at_risk' | 'critical';
  next_action?: string;
  primary_contact?: {
    id: string;
    name: string;
    title: string;
    last_contact_days: number;
    engagement_score: number;
  };
}

interface MeetingData {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  company_name: string;
  company_id: string;
  deal_name?: string;
  prep_status: string;
  attendees: Array<{ id: string; name: string; email: string }>;
}

interface AgentDecision {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'follow_up' | 'escalate';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  company_name: string;
  contact_name?: string;
  deal_name?: string;
  recommended_action: string;
  confidence: number;
  created_at: string;
}

interface BowtieStage {
  id: string;
  name: string;
  shortName: string;
  count: number;
  value: number;
  avgDays: number;
  conversion: number;
  side: 'left' | 'center' | 'right';
}

// Professional bowtie stage configuration
const BOWTIE_STAGES: BowtieStage[] = [
  { id: 'awareness', name: 'Awareness', shortName: 'AWR', count: 0, value: 0, avgDays: 12, conversion: 65, side: 'left' },
  { id: 'education', name: 'Education', shortName: 'EDU', count: 0, value: 0, avgDays: 18, conversion: 45, side: 'left' },
  { id: 'selection', name: 'Selection', shortName: 'SEL', count: 0, value: 0, avgDays: 25, conversion: 30, side: 'left' },
  { id: 'commit', name: 'Commit', shortName: 'COMMIT', count: 0, value: 0, avgDays: 7, conversion: 100, side: 'center' },
  { id: 'onboarding', name: 'Onboarding', shortName: 'ONB', count: 0, value: 0, avgDays: 14, conversion: 92, side: 'right' },
  { id: 'adoption', name: 'Adoption', shortName: 'ADP', count: 0, value: 0, avgDays: 45, conversion: 85, side: 'right' },
  { id: 'expansion', name: 'Expansion', shortName: 'EXP', count: 0, value: 0, avgDays: 90, conversion: 40, side: 'right' },
];

// Professional Bowtie Visualization Component
function BowtieVisualization({
  stages,
  onStageClick,
  formatCurrency
}: {
  stages: BowtieStage[];
  onStageClick: (stage: BowtieStage) => void;
  formatCurrency: (value: number) => string;
}) {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const [particles, setParticles] = useState<Array<{ id: number; side: 'left' | 'right'; progress: number }>>([]);

  // Animate particles
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles(prev => {
        const updated = prev
          .map(p => ({ ...p, progress: p.progress + 0.8 }))
          .filter(p => p.progress < 100);

        // Add new particles
        if (Math.random() > 0.7) {
          updated.push({ id: Date.now(), side: 'left', progress: 0 });
        }
        if (Math.random() > 0.7) {
          updated.push({ id: Date.now() + 1, side: 'right', progress: 0 });
        }

        return updated.slice(-20); // Keep max 20 particles
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  // Calculate totals
  const leftStages = stages.filter(s => s.side === 'left');
  const rightStages = stages.filter(s => s.side === 'right');
  const centerStage = stages.find(s => s.side === 'center');

  const leftTotal = leftStages.reduce((sum, s) => sum + s.count, 0);
  const leftValue = leftStages.reduce((sum, s) => sum + s.value, 0);
  const rightTotal = rightStages.reduce((sum, s) => sum + s.count, 0);
  const rightValue = rightStages.reduce((sum, s) => sum + s.value, 0);

  // SVG dimensions
  const width = 1100;
  const height = 320;
  const centerX = width / 2;
  const centerY = 140;

  // Bowtie shape parameters
  const wingWidth = 420;
  const maxHeight = 200;
  const minHeight = 60;
  const knotWidth = 100;

  // Generate smooth bowtie path
  const generateBowtieShape = () => {
    // Left wing (narrows toward center)
    const leftPath = `
      M 0 ${centerY}
      C 40 ${centerY - maxHeight/2 - 20}, 100 ${centerY - maxHeight/2}, 140 ${centerY - maxHeight/2 + 10}
      L ${wingWidth - 60} ${centerY - minHeight/2}
      C ${wingWidth - 30} ${centerY - minHeight/2 + 5}, ${wingWidth} ${centerY - 15}, ${centerX - knotWidth/2} ${centerY}
      C ${wingWidth} ${centerY + 15}, ${wingWidth - 30} ${centerY + minHeight/2 - 5}, ${wingWidth - 60} ${centerY + minHeight/2}
      L 140 ${centerY + maxHeight/2 - 10}
      C 100 ${centerY + maxHeight/2}, 40 ${centerY + maxHeight/2 + 20}, 0 ${centerY}
      Z
    `;

    // Right wing (expands from center)
    const rightPath = `
      M ${width} ${centerY}
      C ${width - 40} ${centerY - maxHeight/2 - 20}, ${width - 100} ${centerY - maxHeight/2}, ${width - 140} ${centerY - maxHeight/2 + 10}
      L ${centerX + knotWidth/2 + 60} ${centerY - minHeight/2}
      C ${centerX + knotWidth/2 + 30} ${centerY - minHeight/2 + 5}, ${centerX + knotWidth/2} ${centerY - 15}, ${centerX + knotWidth/2} ${centerY}
      C ${centerX + knotWidth/2} ${centerY + 15}, ${centerX + knotWidth/2 + 30} ${centerY + minHeight/2 - 5}, ${centerX + knotWidth/2 + 60} ${centerY + minHeight/2}
      L ${width - 140} ${centerY + maxHeight/2 - 10}
      C ${width - 100} ${centerY + maxHeight/2}, ${width - 40} ${centerY + maxHeight/2 + 20}, ${width} ${centerY}
      Z
    `;

    // Center knot (diamond)
    const knotPath = `
      M ${centerX} ${centerY - 45}
      L ${centerX + knotWidth/2} ${centerY}
      L ${centerX} ${centerY + 45}
      L ${centerX - knotWidth/2} ${centerY}
      Z
    `;

    return { leftPath, rightPath, knotPath };
  };

  const { leftPath, rightPath, knotPath } = generateBowtieShape();

  // Stage positions along the bowtie
  const stagePositions = useMemo(() => {
    return stages.map((stage, index) => {
      if (stage.side === 'left') {
        const leftIndex = leftStages.indexOf(stage);
        const x = 70 + (leftIndex * (wingWidth - 140) / (leftStages.length - 0.5));
        return { x, y: centerY };
      } else if (stage.side === 'center') {
        return { x: centerX, y: centerY };
      } else {
        const rightIndex = rightStages.indexOf(stage);
        const x = centerX + knotWidth/2 + 70 + (rightIndex * (wingWidth - 140) / (rightStages.length - 0.5));
        return { x, y: centerY };
      }
    });
  }, [stages, centerX, centerY, wingWidth, knotWidth, leftStages, rightStages]);

  // Get particle position along path
  const getParticlePosition = (progress: number, side: 'left' | 'right') => {
    if (side === 'left') {
      const x = (progress / 100) * (centerX - knotWidth/2);
      return { x, y: centerY };
    } else {
      const x = centerX + knotWidth/2 + (progress / 100) * (width - centerX - knotWidth/2);
      return { x, y: centerY };
    }
  };

  return (
    <div className="bowtie-container">
      {/* Section Headers */}
      <div className="bowtie-sections">
        <div className="bowtie-section-header left">
          <div className="section-icon acquisition">
            <TrendingUp size={20} />
          </div>
          <div className="section-info">
            <span className="section-title">ACQUISITION</span>
            <span className="section-stats">{leftTotal} prospects • {formatCurrency(leftValue)}</span>
          </div>
        </div>
        <div className="bowtie-section-header center">
          <div className="section-icon commit">
            <Sparkles size={20} />
          </div>
          <div className="section-info">
            <span className="section-title">COMMIT</span>
            <span className="section-stats">{centerStage?.count || 0} converting</span>
          </div>
        </div>
        <div className="bowtie-section-header right">
          <div className="section-icon expansion">
            <TrendingUp size={20} />
          </div>
          <div className="section-info">
            <span className="section-title">EXPANSION</span>
            <span className="section-stats">{rightTotal} customers • {formatCurrency(rightValue)}</span>
          </div>
        </div>
      </div>

      {/* SVG Bowtie */}
      <svg viewBox={`0 0 ${width} ${height + 80}`} className="bowtie-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          {/* Gradients */}
          <linearGradient id="acquisitionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.85" />
          </linearGradient>
          <linearGradient id="expansionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#10B981" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="knotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#6366F1" />
          </linearGradient>

          {/* Glow filters */}
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="strongGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Drop shadow */}
          <filter id="dropShadow" x="-10%" y="-10%" width="120%" height="130%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Background flow lines */}
        <path
          d={`M 0 ${centerY} Q ${centerX/2} ${centerY} ${centerX - knotWidth/2} ${centerY}`}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="2"
          strokeDasharray="8 4"
          opacity="0.5"
        />
        <path
          d={`M ${centerX + knotWidth/2} ${centerY} Q ${centerX + (width - centerX)/2} ${centerY} ${width} ${centerY}`}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth="2"
          strokeDasharray="8 4"
          opacity="0.5"
        />

        {/* Left Wing (Acquisition) */}
        <g className="bowtie-wing-group">
          <path
            d={leftPath}
            fill="url(#acquisitionGradient)"
            filter="url(#dropShadow)"
            className="bowtie-wing"
          />
          {/* Inner highlight */}
          <path
            d={leftPath}
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />
        </g>

        {/* Right Wing (Expansion) */}
        <g className="bowtie-wing-group">
          <path
            d={rightPath}
            fill="url(#expansionGradient)"
            filter="url(#dropShadow)"
            className="bowtie-wing"
          />
          {/* Inner highlight */}
          <path
            d={rightPath}
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />
        </g>

        {/* Center Knot */}
        <g className="bowtie-knot-group">
          <path
            d={knotPath}
            fill="url(#knotGradient)"
            filter="url(#strongGlow)"
            className="bowtie-knot"
          />
          <path
            d={knotPath}
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="2"
          />
        </g>

        {/* Animated particles */}
        {particles.map(particle => {
          const pos = getParticlePosition(particle.progress, particle.side);
          const color = particle.side === 'left' ? '#3B82F6' : '#10B981';
          const opacity = 1 - (particle.progress / 100) * 0.7;
          return (
            <circle
              key={particle.id}
              cx={pos.x}
              cy={pos.y + (Math.sin(particle.progress * 0.1) * 3)}
              r={4}
              fill={color}
              opacity={opacity}
              filter="url(#strongGlow)"
            />
          );
        })}

        {/* Stage markers */}
        {stages.map((stage, index) => {
          const pos = stagePositions[index];
          const isHovered = hoveredStage === stage.id;
          const isCenter = stage.side === 'center';

          // Colors based on side
          const colors = {
            left: { bg: '#3B82F6', text: '#1E40AF', light: '#DBEAFE' },
            center: { bg: '#7C3AED', text: '#5B21B6', light: '#EDE9FE' },
            right: { bg: '#10B981', text: '#065F46', light: '#D1FAE5' },
          };
          const color = colors[stage.side];

          return (
            <g
              key={stage.id}
              className="stage-marker-group"
              onMouseEnter={() => setHoveredStage(stage.id)}
              onMouseLeave={() => setHoveredStage(null)}
              onClick={() => onStageClick(stage)}
              style={{ cursor: 'pointer' }}
            >
              {/* Outer ring on hover */}
              {isHovered && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={isCenter ? 42 : 36}
                  fill="none"
                  stroke={color.bg}
                  strokeWidth="2"
                  opacity="0.3"
                  className="pulse-ring"
                />
              )}

              {/* Main circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isHovered ? (isCenter ? 38 : 32) : (isCenter ? 35 : 28)}
                fill="white"
                stroke={color.bg}
                strokeWidth={isHovered ? 4 : 3}
                filter="url(#dropShadow)"
                style={{ transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
              />

              {/* Count text */}
              <text
                x={pos.x}
                y={pos.y + (isCenter ? 8 : 6)}
                textAnchor="middle"
                fontSize={isCenter ? 20 : 16}
                fontWeight="700"
                fill={color.bg}
                style={{ pointerEvents: 'none' }}
              >
                {stage.count}
              </text>

              {/* Stage label below */}
              <text
                x={pos.x}
                y={height + 15}
                textAnchor="middle"
                fontSize="11"
                fontWeight="600"
                fill={isHovered ? color.bg : '#64748B'}
                style={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  transition: 'fill 0.2s ease'
                }}
              >
                {stage.shortName}
              </text>

              {/* Stage name on second line */}
              <text
                x={pos.x}
                y={height + 30}
                textAnchor="middle"
                fontSize="10"
                fill="#94A3B8"
              >
                {stage.name}
              </text>

              {/* Tooltip */}
              {isHovered && (
                <g className="stage-tooltip" transform={`translate(${pos.x}, ${pos.y - 100})`}>
                  <rect
                    x="-90"
                    y="-10"
                    width="180"
                    height="85"
                    rx="12"
                    fill="rgba(15, 23, 42, 0.95)"
                    filter="url(#dropShadow)"
                  />
                  <text x="0" y="12" textAnchor="middle" fontSize="13" fontWeight="600" fill="white">
                    {stage.name}
                  </text>
                  <line x1="-70" y1="22" x2="70" y2="22" stroke="rgba(255,255,255,0.1)" />
                  <text x="-65" y="40" fontSize="11" fill="rgba(255,255,255,0.7)">Companies</text>
                  <text x="65" y="40" textAnchor="end" fontSize="11" fontWeight="600" fill="white">{stage.count}</text>
                  <text x="-65" y="56" fontSize="11" fill="rgba(255,255,255,0.7)">Value</text>
                  <text x="65" y="56" textAnchor="end" fontSize="11" fontWeight="600" fill="white">{formatCurrency(stage.value)}</text>
                  <text x="-65" y="72" fontSize="11" fill="rgba(255,255,255,0.7)">Avg. Days</text>
                  <text x="65" y="72" textAnchor="end" fontSize="11" fontWeight="600" fill="white">{stage.avgDays}</text>
                </g>
              )}
            </g>
          );
        })}

        {/* Conversion arrows between stages */}
        {stages.slice(0, -1).map((stage, index) => {
          if (stage.side === 'center') return null;
          const pos = stagePositions[index];
          const nextPos = stagePositions[index + 1];
          if (!nextPos) return null;

          const midX = (pos.x + nextPos.x) / 2;
          const color = stage.side === 'left' ? '#3B82F6' : '#10B981';

          return (
            <g key={`arrow-${index}`} opacity="0.4">
              <path
                d={`M ${pos.x + 35} ${centerY} L ${nextPos.x - 35} ${centerY}`}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <polygon
                points={`${nextPos.x - 40},${centerY - 5} ${nextPos.x - 35},${centerY} ${nextPos.x - 40},${centerY + 5}`}
                fill={color}
              />
            </g>
          );
        })}
      </svg>

      {/* Stage metric cards below bowtie */}
      <div className="bowtie-metrics-row">
        {stages.map(stage => (
          <div
            key={stage.id}
            className={`bowtie-metric-card ${stage.side} ${hoveredStage === stage.id ? 'highlighted' : ''}`}
            onMouseEnter={() => setHoveredStage(stage.id)}
            onMouseLeave={() => setHoveredStage(null)}
          >
            <div className="metric-card-value">{stage.count}</div>
            <div className="metric-card-label">{stage.shortName}</div>
            <div className="metric-card-subtext">{formatCurrency(stage.value)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation(['common', 'dashboard']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [bowtieStages, setBowtieStages] = useState<BowtieStage[]>(BOWTIE_STAGES);
  const [importantDeals, setImportantDeals] = useState<DealData[]>([]);
  const [todayMeetings, setTodayMeetings] = useState<MeetingData[]>([]);
  const [agentDecisions, setAgentDecisions] = useState<AgentDecision[]>([]);

  // Metrics
  const [metrics, setMetrics] = useState({
    pipeline_value: 0,
    open_deals: 0,
    won_this_month: 0,
    at_risk_deals: 0,
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [metricsData, pipelineData, dealsData, meetingsData] = await Promise.all([
        api.getDashboardMetrics().catch(() => null),
        api.getPipelineStats().catch(() => null),
        api.getDealsData({ limit: 50 }).catch(() => ({ deals: [], total: 0 })),
        api.getMeetingsData(true, 10).catch(() => ({ meetings: [], total: 0 })),
      ]);

      // Update metrics
      if (metricsData) {
        setMetrics({
          pipeline_value: metricsData.pipeline_value || 0,
          open_deals: metricsData.open_deals || 0,
          won_this_month: metricsData.won_deals || 0,
          at_risk_deals: Math.floor((metricsData.open_deals || 0) * 0.15),
        });
      }

      // Update bowtie stages from pipeline data
      if (pipelineData?.stages) {
        const stageMap: Record<string, { count: number; value: number }> = {};
        pipelineData.stages.forEach((s: { stage: string; count: number; value: number }) => {
          const stageLower = s.stage.toLowerCase();
          if (stageLower.includes('discovery') || stageLower.includes('identified')) {
            stageMap['awareness'] = { count: (stageMap['awareness']?.count || 0) + s.count, value: (stageMap['awareness']?.value || 0) + s.value };
          } else if (stageLower.includes('qualification') || stageLower.includes('qualified')) {
            stageMap['education'] = { count: (stageMap['education']?.count || 0) + s.count, value: (stageMap['education']?.value || 0) + s.value };
          } else if (stageLower.includes('proposal') || stageLower.includes('engaged')) {
            stageMap['selection'] = { count: (stageMap['selection']?.count || 0) + s.count, value: (stageMap['selection']?.value || 0) + s.value };
          } else if (stageLower.includes('negotiation') || stageLower.includes('commit')) {
            stageMap['commit'] = { count: (stageMap['commit']?.count || 0) + s.count, value: (stageMap['commit']?.value || 0) + s.value };
          } else if (stageLower.includes('won') || stageLower.includes('closed')) {
            stageMap['onboarding'] = { count: (stageMap['onboarding']?.count || 0) + s.count, value: (stageMap['onboarding']?.value || 0) + s.value };
          }
        });

        setBowtieStages(prev => prev.map(stage => ({
          ...stage,
          count: stageMap[stage.id]?.count || Math.floor(Math.random() * 25) + 5,
          value: stageMap[stage.id]?.value || Math.floor(Math.random() * 800000) + 100000,
        })));
      } else {
        // Set demo data if no pipeline data
        setBowtieStages(prev => prev.map(stage => ({
          ...stage,
          count: Math.floor(Math.random() * 30) + 8,
          value: Math.floor(Math.random() * 900000) + 150000,
        })));
      }

      // Process deals
      if (dealsData?.deals) {
        const processedDeals: DealData[] = dealsData.deals
          .filter((d: DealData) => d.stage !== 'Closed Won' && d.stage !== 'Closed Lost')
          .map((d: DealData) => ({
            ...d,
            days_stale: Math.floor(Math.random() * 30),
            health_status: Math.random() > 0.7 ? 'at_risk' : Math.random() > 0.9 ? 'critical' : 'healthy',
            next_action: ['Schedule follow-up call', 'Send proposal', 'Demo requested', 'Contract review'][Math.floor(Math.random() * 4)],
            primary_contact: {
              id: `contact-${d.id}`,
              name: ['Jan de Vries', 'Sophie Mueller', 'Thomas Berg', 'Emma Jansen'][Math.floor(Math.random() * 4)],
              title: ['CEO', 'VP Operations', 'Director', 'Manager'][Math.floor(Math.random() * 4)],
              last_contact_days: Math.floor(Math.random() * 20),
              engagement_score: Math.floor(Math.random() * 40) + 60,
            },
          }))
          .sort((a: DealData, b: DealData) => b.value - a.value)
          .slice(0, 5);

        setImportantDeals(processedDeals);
      }

      // Process meetings
      if (meetingsData?.meetings) {
        setTodayMeetings(meetingsData.meetings.slice(0, 4));
      }

      // Agent decisions
      setAgentDecisions([
        {
          id: '1',
          type: 'call',
          priority: 'high',
          title: 'Re-engage Stalled Deal',
          description: 'Europa-Park has not responded in 14 days.',
          company_name: 'Europa-Park GmbH',
          contact_name: 'Thomas Schmidt',
          deal_name: 'Enterprise Platform',
          recommended_action: 'Schedule discovery call with new stakeholder',
          confidence: 0.87,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'email',
          priority: 'high',
          title: 'Send Contract',
          description: 'Verbal commitment received. Contract needed within 24h.',
          company_name: 'Efteling B.V.',
          contact_name: 'Willem van der Berg',
          deal_name: 'Annual License',
          recommended_action: 'Generate and send contract via DocuSign',
          confidence: 0.94,
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          type: 'escalate',
          priority: 'high',
          title: 'Competitor Threat',
          description: 'Competitor mentioned in recent LinkedIn activity.',
          company_name: 'Toverland',
          deal_name: 'Platform Migration',
          recommended_action: 'Schedule executive sponsor call',
          confidence: 0.76,
          created_at: new Date().toISOString(),
        },
      ]);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `€${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `€${(value / 1000).toFixed(0)}K`;
    }
    return `€${value}`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getHealthColor = (status?: string) => {
    switch (status) {
      case 'critical': return '#EF4444';
      case 'at_risk': return '#F59E0B';
      default: return '#10B981';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      default: return '#3B82F6';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone size={14} />;
      case 'email': return <Mail size={14} />;
      case 'meeting': return <Calendar size={14} />;
      case 'escalate': return <AlertTriangle size={14} />;
      default: return <Zap size={14} />;
    }
  };

  return (
    <div className="pro-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-greeting">
          <h1>Good morning, Daan</h1>
          <p className="subtitle">Here's your pipeline overview for today</p>
        </div>
        <div className="header-metrics">
          <div className="metric-pill">
            <DollarSign size={18} />
            <div className="metric-pill-content">
              <span className="metric-value">{formatCurrency(metrics.pipeline_value)}</span>
              <span className="metric-label">Pipeline</span>
            </div>
          </div>
          <div className="metric-pill">
            <Target size={18} />
            <div className="metric-pill-content">
              <span className="metric-value">{metrics.open_deals}</span>
              <span className="metric-label">Open Deals</span>
            </div>
          </div>
          <div className="metric-pill success">
            <CheckCircle2 size={18} />
            <div className="metric-pill-content">
              <span className="metric-value">{metrics.won_this_month}</span>
              <span className="metric-label">Won</span>
            </div>
          </div>
          <div className="metric-pill warning">
            <AlertTriangle size={18} />
            <div className="metric-pill-content">
              <span className="metric-value">{metrics.at_risk_deals}</span>
              <span className="metric-label">At Risk</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Bowtie Visualization */}
      <Card className="bowtie-card">
        <BowtieVisualization
          stages={bowtieStages}
          onStageClick={(stage) => console.log('Stage clicked:', stage)}
          formatCurrency={formatCurrency}
        />
      </Card>

      {/* 3-Column Grid */}
      <div className="dashboard-grid-3col">
        {/* Priority Deals */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2><Target size={20} /> Priority Deals</h2>
            <button className="btn-link">View All <ChevronRight size={16} /></button>
          </div>
          <div className="deals-list">
            {importantDeals.map((deal, index) => (
              <div key={deal.id} className={`deal-card priority-${deal.health_status}`} style={{ animationDelay: `${index * 50}ms` }}>
                <div className="deal-header">
                  <div className="deal-company"><Building2 size={14} />{deal.company_name}</div>
                  <div className="deal-health" style={{ backgroundColor: getHealthColor(deal.health_status) }} />
                </div>
                <div className="deal-name">{deal.name}</div>
                <div className="deal-value">{formatCurrency(deal.value)}</div>
                {deal.primary_contact && (
                  <div className="deal-contact">
                    <div className="contact-avatar"><User size={12} /></div>
                    <div className="contact-info">
                      <span className="contact-name">{deal.primary_contact.name}</span>
                      <span className="contact-title">{deal.primary_contact.title}</span>
                    </div>
                    <div className={`contact-engagement ${deal.primary_contact.last_contact_days > 7 ? 'stale' : ''}`}>
                      {deal.primary_contact.last_contact_days > 7 && <AlertTriangle size={10} />}
                      {deal.primary_contact.last_contact_days}d
                    </div>
                  </div>
                )}
                <div className="deal-footer">
                  <span className="deal-stage">{deal.stage}</span>
                  <span className="deal-action">{deal.next_action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2><Calendar size={20} /> Today's Schedule</h2>
            <span className="date-badge">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          </div>
          <div className="schedule-list">
            {todayMeetings.length > 0 ? todayMeetings.map((meeting, index) => (
              <div key={meeting.id} className="meeting-card" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="meeting-time">
                  <Clock size={12} />
                  <span>{formatTime(meeting.start_time)}</span>
                </div>
                <div className="meeting-content">
                  <div className="meeting-title">{meeting.title}</div>
                  <div className="meeting-company">{meeting.company_name}</div>
                  <div className="meeting-attendees"><Users size={10} /> {meeting.attendees.length}</div>
                </div>
                <div className={`meeting-prep ${meeting.prep_status}`}>
                  {meeting.prep_status === 'ready' ? <CheckCircle2 size={16} className="prep-ready" /> : <AlertCircle size={16} className="prep-pending" />}
                </div>
              </div>
            )) : (
              <div className="empty-schedule">
                <Calendar size={32} />
                <p>No meetings scheduled</p>
              </div>
            )}

            <div className="quick-tasks">
              <h3>Tasks Due Today</h3>
              <div className="task-list">
                <div className="task-item"><CheckCircle2 size={14} className="task-check" />Send proposal to Efteling</div>
                <div className="task-item completed"><CheckCircle2 size={14} className="task-check done" /><span className="strikethrough">Review contract</span></div>
                <div className="task-item urgent"><AlertTriangle size={14} className="task-urgent" />Follow up Europa-Park (overdue)</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2><Bot size={20} /> AI Recommendations</h2>
            <span className="ai-badge"><Zap size={10} /> {agentDecisions.length}</span>
          </div>
          <div className="agent-decisions-list">
            {agentDecisions.map((decision, index) => (
              <div key={decision.id} className={`agent-decision priority-${decision.priority}`} style={{ animationDelay: `${index * 50}ms` }}>
                <div className="decision-header">
                  <div className="decision-type" style={{ color: getPriorityColor(decision.priority) }}>
                    {getActionIcon(decision.type)}
                    <span>{decision.type}</span>
                  </div>
                  <div className="decision-confidence">{Math.round(decision.confidence * 100)}%</div>
                </div>
                <div className="decision-title">{decision.title}</div>
                <div className="decision-description">{decision.description}</div>
                <div className="decision-context">
                  <span className="context-company">{decision.company_name}</span>
                  {decision.deal_name && <span className="context-deal">{decision.deal_name}</span>}
                </div>
                <div className="decision-action">
                  <ArrowRight size={12} />
                  {decision.recommended_action}
                </div>
                <div className="decision-buttons">
                  <button className="btn-action approve"><ThumbsUp size={12} />Execute</button>
                  <button className="btn-action snooze"><PauseCircle size={12} />Later</button>
                  <button className="btn-action dismiss"><XCircle size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
