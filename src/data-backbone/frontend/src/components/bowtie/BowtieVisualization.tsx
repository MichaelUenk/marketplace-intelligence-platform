import React, { useState } from 'react';
import { layout, typography, stageColors, lightColors, darkColors } from '../../constants/bowtie';
import { useIsDarkMode } from '../../hooks/useThemeColors';
import type { BowtieStageData, StageCode } from '../../types/bowtie';
import { formatCurrency } from '../../utils/bowtie';

interface BowtieVisualizationProps {
  stages: BowtieStageData[];
  onStageClick: (stage: StageCode) => void;
  selectedStage: StageCode | null;
}

const BowtieVisualization: React.FC<BowtieVisualizationProps> = ({
  stages,
  onStageClick,
  selectedStage,
}) => {
  const isDarkMode = useIsDarkMode();
  const colors = isDarkMode ? darkColors : lightColors;
  const [hoveredStage, setHoveredStage] = useState<StageCode | null>(null);

  // Group stages by side
  const leftStages = stages.filter((s) => s.side === 'left');
  const centerStage = stages.find((s) => s.side === 'center');
  const rightStages = stages.filter((s) => s.side === 'right');

  // SVG dimensions
  const width = 1200;
  const height = 300;
  const centerX = width / 2;
  const centerY = height / 2;

  // Bowtie dimensions
  const wingWidth = 480;
  const maxWingHeight = 240;
  const knotSize = 80;

  // Calculate section widths
  const leftSectionWidth = wingWidth / leftStages.length;
  const rightSectionWidth = wingWidth / rightStages.length;

  // Generate path points for left wing (acquisition - blue)
  const getLeftWingPath = (index: number): string => {
    const startX = index * leftSectionWidth;
    const endX = (index + 1) * leftSectionWidth;

    // Gradually narrow toward center
    const startHeightRatio = 1 - (index / leftStages.length) * 0.7;
    const endHeightRatio = 1 - ((index + 1) / leftStages.length) * 0.7;

    const startHeight = maxWingHeight * startHeightRatio;
    const endHeight = maxWingHeight * endHeightRatio;

    const startTop = centerY - startHeight / 2;
    const startBottom = centerY + startHeight / 2;
    const endTop = centerY - endHeight / 2;
    const endBottom = centerY + endHeight / 2;

    // Create curved path
    const cpOffset = leftSectionWidth * 0.3;

    return `
      M ${startX} ${startTop}
      C ${startX + cpOffset} ${startTop}, ${endX - cpOffset} ${endTop}, ${endX} ${endTop}
      L ${endX} ${endBottom}
      C ${endX - cpOffset} ${endBottom}, ${startX + cpOffset} ${startBottom}, ${startX} ${startBottom}
      Z
    `;
  };

  // Generate path points for right wing (expansion - green)
  const getRightWingPath = (index: number): string => {
    const baseX = centerX + knotSize / 2;
    const startX = baseX + index * rightSectionWidth;
    const endX = baseX + (index + 1) * rightSectionWidth;

    // Gradually widen from center
    const startHeightRatio = 0.3 + (index / rightStages.length) * 0.7;
    const endHeightRatio = 0.3 + ((index + 1) / rightStages.length) * 0.7;

    const startHeight = maxWingHeight * startHeightRatio;
    const endHeight = maxWingHeight * endHeightRatio;

    const startTop = centerY - startHeight / 2;
    const startBottom = centerY + startHeight / 2;
    const endTop = centerY - endHeight / 2;
    const endBottom = centerY + endHeight / 2;

    const cpOffset = rightSectionWidth * 0.3;

    return `
      M ${startX} ${startTop}
      C ${startX + cpOffset} ${startTop}, ${endX - cpOffset} ${endTop}, ${endX} ${endTop}
      L ${endX} ${endBottom}
      C ${endX - cpOffset} ${endBottom}, ${startX + cpOffset} ${startBottom}, ${startX} ${startBottom}
      Z
    `;
  };

  // Center knot path (diamond/bowtie knot)
  const getKnotPath = (): string => {
    const knotLeft = centerX - knotSize / 2;
    const knotRight = centerX + knotSize / 2;
    const knotTop = centerY - knotSize / 2;
    const knotBottom = centerY + knotSize / 2;

    return `
      M ${centerX} ${knotTop}
      L ${knotRight} ${centerY}
      L ${centerX} ${knotBottom}
      L ${knotLeft} ${centerY}
      Z
    `;
  };

  // Get label position for left stages
  const getLeftLabelPosition = (index: number) => {
    const x = (index + 0.5) * leftSectionWidth;
    return { x, y: centerY };
  };

  // Get label position for right stages
  const getRightLabelPosition = (index: number) => {
    const baseX = centerX + knotSize / 2;
    const x = baseX + (index + 0.5) * rightSectionWidth;
    return { x, y: centerY };
  };

  const getStageColor = (stage: BowtieStageData, isHovered: boolean, isSelected: boolean) => {
    const baseColors = {
      left: { normal: colors.acquisition, hover: colors.acquisitionLight, light: isDarkMode ? '#1e3a5f' : '#DBEAFE' },
      center: { normal: colors.activation, hover: colors.activationLight, light: isDarkMode ? '#134e4a' : '#CCFBF1' },
      right: { normal: colors.expansion, hover: colors.expansionLight, light: isDarkMode ? '#14532d' : '#D1FAE5' },
    };

    const colorSet = baseColors[stage.side];
    if (isSelected) return colorSet.hover;
    if (isHovered) return colorSet.hover;
    return colorSet.normal;
  };

  const renderTooltip = (stage: BowtieStageData, x: number, y: number) => {
    if (hoveredStage !== stage.stage) return null;

    return (
      <foreignObject x={x - 100} y={y - 120} width={200} height={100}>
        <div
          style={{
            backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(17, 24, 39, 0.95)',
            color: '#F9FAFB',
            padding: '12px 16px',
            borderRadius: '12px',
            fontSize: '13px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(8px)',
            border: isDarkMode ? '1px solid rgba(75, 85, 99, 0.5)' : 'none',
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: '6px', fontSize: '14px' }}>
            {stage.stage_name}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ opacity: 0.8 }}>Companies:</span>
            <span style={{ fontWeight: 600 }}>{stage.company_count}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ opacity: 0.8 }}>Value:</span>
            <span style={{ fontWeight: 600 }}>{formatCurrency(stage.total_value)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ opacity: 0.8 }}>Avg Days:</span>
            <span style={{ fontWeight: 600 }}>{stage.avg_days_in_stage}</span>
          </div>
        </div>
      </foreignObject>
    );
  };

  return (
    <div style={{ position: 'relative' }}>
      {/* Section Headers */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: layout.spacing.md,
          padding: '0 60px',
        }}
      >
        <div style={{ textAlign: 'center', flex: 1 }}>
          <span
            style={{
              ...typography.stageLabel,
              color: colors.acquisition,
              fontSize: '14px',
              letterSpacing: '2px',
            }}
          >
            ACQUISITION
          </span>
        </div>
        <div style={{ textAlign: 'center', width: '120px' }}>
          <span
            style={{
              ...typography.stageLabel,
              color: colors.activation,
              fontSize: '14px',
              letterSpacing: '2px',
            }}
          >
            COMMIT
          </span>
        </div>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <span
            style={{
              ...typography.stageLabel,
              color: colors.expansion,
              fontSize: '14px',
              letterSpacing: '2px',
            }}
          >
            EXPANSION
          </span>
        </div>
      </div>

      <svg
        width="100%"
        height={height + 80}
        viewBox={`0 0 ${width} ${height + 80}`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Gradients for each wing */}
          <linearGradient id="leftWingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.acquisition} stopOpacity="0.9" />
            <stop offset="100%" stopColor={colors.acquisitionLight} stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="rightWingGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.expansionLight} stopOpacity="0.95" />
            <stop offset="100%" stopColor={colors.expansion} stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="knotGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.activationLight} />
            <stop offset="100%" stopColor={colors.activation} />
          </linearGradient>

          {/* Drop shadows */}
          <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.15" />
          </filter>
          <filter id="hoverShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="8" stdDeviation="16" floodOpacity="0.25" />
          </filter>

          {/* Glow effect for hover */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background connection line */}
        <line
          x1="0"
          y1={centerY}
          x2={width}
          y2={centerY}
          stroke={colors.border}
          strokeWidth="2"
          strokeDasharray="8,4"
        />

        {/* Left Wing Sections */}
        {leftStages.map((stage, index) => {
          const isHovered = hoveredStage === stage.stage;
          const isSelected = selectedStage === stage.stage;
          const pos = getLeftLabelPosition(index);

          return (
            <g key={stage.stage}>
              <path
                d={getLeftWingPath(index)}
                fill={getStageColor(stage, isHovered, isSelected)}
                filter={isHovered ? 'url(#hoverShadow)' : 'url(#dropShadow)'}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                  transformOrigin: `${pos.x}px ${pos.y}px`,
                }}
                onMouseEnter={() => setHoveredStage(stage.stage)}
                onMouseLeave={() => setHoveredStage(null)}
                onClick={() => onStageClick(stage.stage)}
              />

              {/* Stage count circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isHovered ? 28 : 24}
                fill={colors.cardBg}
                filter="url(#dropShadow)"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={() => setHoveredStage(stage.stage)}
                onMouseLeave={() => setHoveredStage(null)}
                onClick={() => onStageClick(stage.stage)}
              />
              <text
                x={pos.x}
                y={pos.y + 5}
                textAnchor="middle"
                style={{
                  fontSize: isHovered ? '16px' : '14px',
                  fontWeight: 700,
                  fill: colors.acquisition,
                  pointerEvents: 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                {stage.company_count}
              </text>

              {/* Stage label below */}
              <text
                x={pos.x}
                y={height + 20}
                textAnchor="middle"
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  fill: isHovered || isSelected ? colors.acquisition : colors.secondaryText,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  transition: 'all 0.3s ease',
                }}
              >
                {stage.stage_label}
              </text>
              <text
                x={pos.x}
                y={height + 38}
                textAnchor="middle"
                style={{
                  fontSize: '11px',
                  fill: colors.tertiaryText,
                }}
              >
                {formatCurrency(stage.total_value)}
              </text>

              {renderTooltip(stage, pos.x, pos.y)}
            </g>
          );
        })}

        {/* Center Knot */}
        {centerStage && (
          <g>
            <path
              d={getKnotPath()}
              fill="url(#knotGradient)"
              filter={hoveredStage === centerStage.stage ? 'url(#hoverShadow)' : 'url(#dropShadow)'}
              style={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: hoveredStage === centerStage.stage ? 'scale(1.1)' : 'scale(1)',
                transformOrigin: `${centerX}px ${centerY}px`,
              }}
              onMouseEnter={() => setHoveredStage(centerStage.stage)}
              onMouseLeave={() => setHoveredStage(null)}
              onClick={() => onStageClick(centerStage.stage)}
            />

            {/* Center count */}
            <text
              x={centerX}
              y={centerY + 6}
              textAnchor="middle"
              style={{
                fontSize: '18px',
                fontWeight: 700,
                fill: 'white',
                pointerEvents: 'none',
              }}
            >
              {centerStage.company_count}
            </text>

            {/* Center label below */}
            <text
              x={centerX}
              y={height + 20}
              textAnchor="middle"
              style={{
                fontSize: '12px',
                fontWeight: 600,
                fill: hoveredStage === centerStage.stage ? colors.activation : colors.secondaryText,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                transition: 'all 0.3s ease',
              }}
            >
              {centerStage.stage_label}
            </text>
            <text
              x={centerX}
              y={height + 38}
              textAnchor="middle"
              style={{
                fontSize: '11px',
                fill: colors.tertiaryText,
              }}
            >
              {formatCurrency(centerStage.total_value)}
            </text>

            {renderTooltip(centerStage, centerX, centerY)}
          </g>
        )}

        {/* Right Wing Sections */}
        {rightStages.map((stage, index) => {
          const isHovered = hoveredStage === stage.stage;
          const isSelected = selectedStage === stage.stage;
          const pos = getRightLabelPosition(index);

          return (
            <g key={stage.stage}>
              <path
                d={getRightWingPath(index)}
                fill={getStageColor(stage, isHovered, isSelected)}
                filter={isHovered ? 'url(#hoverShadow)' : 'url(#dropShadow)'}
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                  transformOrigin: `${pos.x}px ${pos.y}px`,
                }}
                onMouseEnter={() => setHoveredStage(stage.stage)}
                onMouseLeave={() => setHoveredStage(null)}
                onClick={() => onStageClick(stage.stage)}
              />

              {/* Stage count circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={isHovered ? 28 : 24}
                fill={colors.cardBg}
                filter="url(#dropShadow)"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={() => setHoveredStage(stage.stage)}
                onMouseLeave={() => setHoveredStage(null)}
                onClick={() => onStageClick(stage.stage)}
              />
              <text
                x={pos.x}
                y={pos.y + 5}
                textAnchor="middle"
                style={{
                  fontSize: isHovered ? '16px' : '14px',
                  fontWeight: 700,
                  fill: colors.expansion,
                  pointerEvents: 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                {stage.company_count}
              </text>

              {/* Stage label below */}
              <text
                x={pos.x}
                y={height + 20}
                textAnchor="middle"
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  fill: isHovered || isSelected ? colors.expansion : colors.secondaryText,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  transition: 'all 0.3s ease',
                }}
              >
                {stage.stage_label}
              </text>
              <text
                x={pos.x}
                y={height + 38}
                textAnchor="middle"
                style={{
                  fontSize: '11px',
                  fill: colors.tertiaryText,
                }}
              >
                {formatCurrency(stage.total_value)}
              </text>

              {renderTooltip(stage, pos.x, pos.y)}
            </g>
          );
        })}

        {/* Flow arrows */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill={colors.border} />
          </marker>
        </defs>

        {/* Animated flow indicators */}
        {[...Array(3)].map((_, i) => (
          <circle
            key={`flow-left-${i}`}
            r="4"
            fill={colors.acquisition}
            opacity="0.6"
          >
            <animateMotion
              dur={`${3 + i * 0.5}s`}
              repeatCount="indefinite"
              path={`M 0 ${centerY} L ${centerX - knotSize / 2} ${centerY}`}
            />
          </circle>
        ))}
        {[...Array(3)].map((_, i) => (
          <circle
            key={`flow-right-${i}`}
            r="4"
            fill={colors.expansion}
            opacity="0.6"
          >
            <animateMotion
              dur={`${3 + i * 0.5}s`}
              repeatCount="indefinite"
              path={`M ${centerX + knotSize / 2} ${centerY} L ${width} ${centerY}`}
            />
          </circle>
        ))}
      </svg>

      {/* Interactive hint */}
      <div
        style={{
          textAlign: 'center',
          marginTop: layout.spacing.md,
          ...typography.bodySmall,
          color: isDarkMode ? darkColors.tertiaryText : lightColors.tertiaryText,
        }}
      >
        Click any stage to view details
      </div>
    </div>
  );
};

export default BowtieVisualization;
