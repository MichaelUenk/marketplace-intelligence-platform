import { useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

type StageCode = 'VM1' | 'VM2' | 'VM3' | 'VM4' | 'VM5' | 'VM6' | 'VM7' | 'VM8';
type TabType = 'bowtie' | 'dashboard' | 'companies' | 'people' | 'search' | 'hybrid' | 'leads';

interface BowtieProps {
  onNavigate?: (tab: TabType) => void;
}

interface StageInfo {
  code: StageCode;
  name: string;
  label: string;
  description: string;
  count: number;
  value: number;
  navigateTo: TabType;
  color: string;
  lightColor: string;
  glowColor: string;
}

// ============================================================================
// STAGE CONFIGURATION
// ============================================================================

const stages: StageInfo[] = [
  { code: 'VM1', name: 'IDENTIFIED', label: 'LEADS', description: 'New prospects identified', count: 245, value: 1200000, navigateTo: 'leads', color: '#1E3A5F', lightColor: '#2E5A8F', glowColor: 'rgba(30, 58, 95, 0.4)' },
  { code: 'VM2', name: 'INTERESTED', label: 'MQL', description: 'Marketing qualified', count: 142, value: 890000, navigateTo: 'companies', color: '#1E4A6F', lightColor: '#3E6A9F', glowColor: 'rgba(30, 74, 111, 0.4)' },
  { code: 'VM3', name: 'ENGAGED', label: 'SQL', description: 'Sales qualified', count: 89, value: 650000, navigateTo: 'companies', color: '#1E5A7F', lightColor: '#4E7AAF', glowColor: 'rgba(30, 90, 127, 0.4)' },
  { code: 'VM4', name: 'PIPELINE', label: 'SAL', description: 'Active opportunities', count: 47, value: 420000, navigateTo: 'companies', color: '#1E6A8F', lightColor: '#5E8ABF', glowColor: 'rgba(30, 106, 143, 0.4)' },
  { code: 'VM5', name: 'COMMITTED', label: 'COMMIT', description: 'Deals closed', count: 28, value: 380000, navigateTo: 'dashboard', color: '#00B4B4', lightColor: '#00D4D4', glowColor: 'rgba(0, 180, 180, 0.5)' },
  { code: 'VM6', name: 'ACTIVATED', label: 'ACTIVE', description: 'Solution deployed', count: 156, value: 890000, navigateTo: 'people', color: '#28A745', lightColor: '#38C755', glowColor: 'rgba(40, 167, 69, 0.4)' },
  { code: 'VM7', name: 'RECURRING', label: 'RECUR', description: 'Renewed customers', count: 234, value: 1450000, navigateTo: 'people', color: '#20923C', lightColor: '#30B24C', glowColor: 'rgba(32, 146, 60, 0.4)' },
  { code: 'VM8', name: 'MAX IMPACT', label: 'MAX', description: 'Fully expanded', count: 89, value: 780000, navigateTo: 'search', color: '#188033', lightColor: '#28A043', glowColor: 'rgba(24, 128, 51, 0.4)' },
];

// ============================================================================
// ANIMATED BOWTIE COMPONENT
// ============================================================================

export default function BowtieDashboard({ onNavigate }: BowtieProps) {
  const [hoveredStage, setHoveredStage] = useState<StageCode | null>(null);
  const [selectedStage, setSelectedStage] = useState<StageCode | null>(null);

  const leftStages = stages.filter(s => ['VM1', 'VM2', 'VM3', 'VM4'].includes(s.code));
  const centerStage = stages.find(s => s.code === 'VM5');
  const rightStages = stages.filter(s => ['VM6', 'VM7', 'VM8'].includes(s.code));

  const handleStageClick = (stage: StageInfo) => {
    setSelectedStage(stage.code);
    if (onNavigate) {
      setTimeout(() => {
        onNavigate(stage.navigateTo);
      }, 300);
    }
  };

  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value}`;
  };

  // SVG Bowtie Shape
  const renderBowtie = () => {
    const width = 900;
    const height = 320;
    const centerX = width / 2;
    const centerY = height / 2;

    // Knot dimensions
    const knotWidth = 80;
    const knotHeight = 200;

    // Wing dimensions
    const wingSpread = 340;
    const wingTip = 140;

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', maxHeight: '400px' }}
      >
        <defs>
          {/* Gradients for each section */}
          <linearGradient id="leftWingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0D1F3C" />
            <stop offset="50%" stopColor="#1E3A5F" />
            <stop offset="100%" stopColor="#2E5A8F" />
          </linearGradient>

          <linearGradient id="centerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#00D4D4" />
            <stop offset="50%" stopColor="#00B4B4" />
            <stop offset="100%" stopColor="#009494" />
          </linearGradient>

          <linearGradient id="rightWingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2E8B45" />
            <stop offset="50%" stopColor="#28A745" />
            <stop offset="100%" stopColor="#1E7535" />
          </linearGradient>

          {/* Glow filters */}
          <filter id="glowLeft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="glowCenter" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="glowRight" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Drop shadow */}
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.25" />
          </filter>
        </defs>

        {/* Left Wing */}
        <g
          onClick={() => handleStageClick(stages[0])}
          onMouseEnter={() => setHoveredStage('VM1')}
          onMouseLeave={() => setHoveredStage(null)}
          style={{ cursor: 'pointer' }}
        >
          <path
            d={`
              M ${centerX - knotWidth/2} ${centerY - knotHeight/2}
              L ${centerX - wingSpread} ${centerY - wingTip}
              Q ${centerX - wingSpread - 30} ${centerY} ${centerX - wingSpread} ${centerY + wingTip}
              L ${centerX - knotWidth/2} ${centerY + knotHeight/2}
              Z
            `}
            fill="url(#leftWingGradient)"
            filter={hoveredStage === 'VM1' ? 'url(#glowLeft)' : 'url(#shadow)'}
            style={{
              transition: 'all 0.3s ease',
              transform: hoveredStage === 'VM1' ? 'scale(1.02)' : 'scale(1)',
              transformOrigin: 'center'
            }}
          />
          {/* Left wing label */}
          <text
            x={centerX - wingSpread/2 - 40}
            y={centerY - 20}
            fill="white"
            fontSize="14"
            fontWeight="600"
            textAnchor="middle"
            style={{ pointerEvents: 'none' }}
          >
            ACQUISITION
          </text>
          <text
            x={centerX - wingSpread/2 - 40}
            y={centerY + 5}
            fill="rgba(255,255,255,0.9)"
            fontSize="24"
            fontWeight="700"
            textAnchor="middle"
            style={{ pointerEvents: 'none' }}
          >
            {leftStages.reduce((sum, s) => sum + s.count, 0)}
          </text>
          <text
            x={centerX - wingSpread/2 - 40}
            y={centerY + 28}
            fill="rgba(255,255,255,0.7)"
            fontSize="12"
            textAnchor="middle"
            style={{ pointerEvents: 'none' }}
          >
            {formatValue(leftStages.reduce((sum, s) => sum + s.value, 0))} pipeline
          </text>
        </g>

        {/* Center Knot */}
        <g
          onClick={() => centerStage && handleStageClick(centerStage)}
          onMouseEnter={() => setHoveredStage('VM5')}
          onMouseLeave={() => setHoveredStage(null)}
          style={{ cursor: 'pointer' }}
        >
          <ellipse
            cx={centerX}
            cy={centerY}
            rx={knotWidth/2 + 10}
            ry={knotHeight/2}
            fill="url(#centerGradient)"
            filter={hoveredStage === 'VM5' ? 'url(#glowCenter)' : 'url(#shadow)'}
            style={{
              transition: 'all 0.3s ease',
              transform: hoveredStage === 'VM5' ? 'scale(1.05)' : 'scale(1)',
              transformOrigin: 'center'
            }}
          />
          {/* Center label */}
          <text
            x={centerX}
            y={centerY - 25}
            fill="white"
            fontSize="11"
            fontWeight="600"
            textAnchor="middle"
            style={{ pointerEvents: 'none', letterSpacing: '0.1em' }}
          >
            ACTIVATION
          </text>
          <text
            x={centerX}
            y={centerY + 8}
            fill="white"
            fontSize="32"
            fontWeight="700"
            textAnchor="middle"
            style={{ pointerEvents: 'none' }}
          >
            {centerStage?.count || 0}
          </text>
          <text
            x={centerX}
            y={centerY + 32}
            fill="rgba(255,255,255,0.8)"
            fontSize="11"
            textAnchor="middle"
            style={{ pointerEvents: 'none' }}
          >
            {formatValue(centerStage?.value || 0)}
          </text>
        </g>

        {/* Right Wing */}
        <g
          onClick={() => handleStageClick(stages[5])}
          onMouseEnter={() => setHoveredStage('VM6')}
          onMouseLeave={() => setHoveredStage(null)}
          style={{ cursor: 'pointer' }}
        >
          <path
            d={`
              M ${centerX + knotWidth/2} ${centerY - knotHeight/2}
              L ${centerX + wingSpread} ${centerY - wingTip}
              Q ${centerX + wingSpread + 30} ${centerY} ${centerX + wingSpread} ${centerY + wingTip}
              L ${centerX + knotWidth/2} ${centerY + knotHeight/2}
              Z
            `}
            fill="url(#rightWingGradient)"
            filter={hoveredStage === 'VM6' ? 'url(#glowRight)' : 'url(#shadow)'}
            style={{
              transition: 'all 0.3s ease',
              transform: hoveredStage === 'VM6' ? 'scale(1.02)' : 'scale(1)',
              transformOrigin: 'center'
            }}
          />
          {/* Right wing label */}
          <text
            x={centerX + wingSpread/2 + 40}
            y={centerY - 20}
            fill="white"
            fontSize="14"
            fontWeight="600"
            textAnchor="middle"
            style={{ pointerEvents: 'none' }}
          >
            EXPANSION
          </text>
          <text
            x={centerX + wingSpread/2 + 40}
            y={centerY + 5}
            fill="rgba(255,255,255,0.9)"
            fontSize="24"
            fontWeight="700"
            textAnchor="middle"
            style={{ pointerEvents: 'none' }}
          >
            {rightStages.reduce((sum, s) => sum + s.count, 0)}
          </text>
          <text
            x={centerX + wingSpread/2 + 40}
            y={centerY + 28}
            fill="rgba(255,255,255,0.7)"
            fontSize="12"
            textAnchor="middle"
            style={{ pointerEvents: 'none' }}
          >
            {formatValue(rightStages.reduce((sum, s) => sum + s.value, 0))} NRR
          </text>
        </g>

        {/* Animated pulse rings on hover */}
        {hoveredStage === 'VM5' && (
          <>
            <ellipse
              cx={centerX}
              cy={centerY}
              rx={knotWidth/2 + 25}
              ry={knotHeight/2 + 15}
              fill="none"
              stroke="rgba(0, 180, 180, 0.3)"
              strokeWidth="2"
              style={{
                animation: 'pulse 1.5s ease-out infinite'
              }}
            />
          </>
        )}
      </svg>
    );
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Add keyframes for animations */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.2); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 700,
          color: '#1a1a2e',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #1E3A5F 0%, #00B4B4 50%, #28A745 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          Revenue Intelligence
        </h1>
        <p style={{ fontSize: '16px', color: '#6b7280' }}>
          Click any section to explore your pipeline
        </p>
      </div>

      {/* Main Bowtie Visualization */}
      <div style={{
        background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)',
        borderRadius: '24px',
        padding: '40px 24px',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decorative elements */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(30, 58, 95, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(40, 167, 69, 0.03) 0%, transparent 50%)',
          pointerEvents: 'none'
        }} />

        {renderBowtie()}

        {/* Hover tooltip */}
        {hoveredStage && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'white',
            padding: '12px 24px',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            animation: 'float 2s ease-in-out infinite'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: stages.find(s => s.code === hoveredStage)?.color || '#000'
            }} />
            <div>
              <div style={{ fontWeight: 600, color: '#1a1a2e' }}>
                {stages.find(s => s.code === hoveredStage)?.name}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                {stages.find(s => s.code === hoveredStage)?.description} - Click to view details
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stage Cards - Interactive Pipeline Stages */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1fr)',
        gap: '8px',
        marginBottom: '32px'
      }}>
        {stages.map((stage, index) => {
          const isHovered = hoveredStage === stage.code;
          const isCenter = stage.code === 'VM5';

          return (
            <div
              key={stage.code}
              onClick={() => handleStageClick(stage)}
              onMouseEnter={() => setHoveredStage(stage.code)}
              onMouseLeave={() => setHoveredStage(null)}
              style={{
                backgroundColor: isHovered ? stage.lightColor : stage.color,
                borderRadius: '12px',
                padding: '16px 8px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: isHovered ? 'translateY(-4px) scale(1.02)' : 'translateY(0)',
                boxShadow: isHovered
                  ? `0 12px 24px ${stage.glowColor}`
                  : '0 2px 8px rgba(0, 0, 0, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Shimmer effect on hover */}
              {isHovered && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  backgroundSize: '200% 100%',
                  animation: 'shimmer 1.5s infinite'
                }} />
              )}

              <div style={{
                fontSize: '10px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.8)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '4px'
              }}>
                {stage.label}
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: 700,
                color: 'white',
                marginBottom: '2px'
              }}>
                {stage.count}
              </div>
              <div style={{
                fontSize: '10px',
                color: 'rgba(255,255,255,0.7)'
              }}>
                {formatValue(stage.value)}
              </div>

              {/* Arrow indicator */}
              {index < stages.length - 1 && !isCenter && index !== 3 && (
                <div style={{
                  position: 'absolute',
                  right: '-12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '16px',
                  zIndex: 10
                }}>
                  →
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Conversion Rates */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
        marginBottom: '24px'
      }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#6b7280',
          marginBottom: '16px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Conversion Rates
        </h3>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {[
            { from: 'Lead', to: 'MQL', rate: 58 },
            { from: 'MQL', to: 'SQL', rate: 63 },
            { from: 'SQL', to: 'SAL', rate: 53 },
            { from: 'SAL', to: 'Commit', rate: 60 },
            { from: 'Commit', to: 'Active', rate: 89 },
            { from: 'Active', to: 'Recur', rate: 91 },
            { from: 'Recur', to: 'Max', rate: 38 },
          ].map((cr, index, arr) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '2px' }}>
                  {cr.from} → {cr.to}
                </div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: cr.rate >= 70 ? '#10B981' : cr.rate >= 50 ? '#F59E0B' : '#EF4444'
                }}>
                  {cr.rate}%
                </div>
              </div>
              {index < arr.length - 1 && (
                <div style={{ color: '#e5e7eb', fontSize: '20px', margin: '0 4px' }}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px'
      }}>
        {[
          { label: 'Total Pipeline', value: '$6.66M', color: '#1E3A5F' },
          { label: 'Active Accounts', value: '1,030', color: '#00B4B4' },
          { label: 'At Risk', value: '132', color: '#F59E0B' },
          { label: 'Avg. Velocity', value: '42 days', color: '#28A745' }
        ].map((stat, index) => (
          <div
            key={index}
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
              borderLeft: `4px solid ${stat.color}`,
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(0, 0, 0, 0.06)';
            }}
          >
            <div style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#1a1a2e', marginTop: '8px' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
