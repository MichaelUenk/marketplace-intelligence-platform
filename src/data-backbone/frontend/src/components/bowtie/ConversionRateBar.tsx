import React from 'react';
import { layout, typography, CONVERSION_LABELS, lightColors, darkColors } from '../../constants/bowtie';
import { useIsDarkMode } from '../../hooks/useThemeColors';
import type { ConversionMetrics } from '../../types/bowtie';
import { formatPercentage } from '../../utils/bowtie';

interface ConversionRateBarProps {
  conversions: ConversionMetrics;
}

const ConversionRateBar: React.FC<ConversionRateBarProps> = ({ conversions }) => {
  const isDarkMode = useIsDarkMode();
  const colors = isDarkMode ? darkColors : lightColors;
  const conversionEntries = [
    { key: 'cr1', value: conversions.cr1, side: 'left' as const },
    { key: 'cr2', value: conversions.cr2, side: 'left' as const },
    { key: 'cr3', value: conversions.cr3, side: 'left' as const },
    { key: 'cr4', value: conversions.cr4, side: 'left' as const },
    { key: 'cr5', value: conversions.cr5, side: 'center' as const },
    { key: 'cr6', value: conversions.cr6, side: 'right' as const },
    { key: 'cr7', value: conversions.cr7, side: 'right' as const },
  ];

  const getBarColor = (side: 'left' | 'center' | 'right') => {
    switch (side) {
      case 'left':
        return colors.acquisition;
      case 'center':
        return colors.activation;
      case 'right':
        return colors.expansion;
    }
  };

  const getConversionQuality = (value: number): { color: string; label: string } => {
    if (value >= 75) return { color: colors.healthy, label: 'Excellent' };
    if (value >= 50) return { color: '#3B82F6', label: 'Good' };
    if (value >= 25) return { color: colors.risk, label: 'Needs Attention' };
    return { color: colors.stalled, label: 'Critical' };
  };

  return (
    <div
      style={{
        backgroundColor: colors.cardBg,
        borderRadius: layout.cardBorderRadius,
        boxShadow: layout.cardShadow,
        padding: layout.spacing.lg,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: layout.spacing.md,
        }}
      >
        <h3
          style={{
            ...typography.h4,
            color: colors.primaryText,
            margin: 0,
          }}
        >
          Conversion Rates
        </h3>
        <div
          style={{
            ...typography.bodySmall,
            color: colors.secondaryText,
          }}
        >
          Stage-to-stage progression rates
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: layout.spacing.xs,
        }}
      >
        {conversionEntries.map((entry, index) => {
          const label = CONVERSION_LABELS[entry.key];
          const quality = getConversionQuality(entry.value);
          const barColor = getBarColor(entry.side);

          return (
            <React.Fragment key={entry.key}>
              <ConversionItem
                label={label}
                value={entry.value}
                barColor={barColor}
                quality={quality}
                colors={colors}
              />
              {index < conversionEntries.length - 1 && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: colors.tertiaryText,
                    fontSize: '16px',
                  }}
                >
                  →
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

interface ConversionItemProps {
  label: { from: string; to: string; description: string };
  value: number;
  barColor: string;
  quality: { color: string; label: string };
  colors: typeof lightColors;
}

const ConversionItem: React.FC<ConversionItemProps> = ({
  label,
  value,
  barColor,
  quality,
  colors,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: layout.spacing.sm,
        borderRadius: '8px',
        backgroundColor: isHovered ? colors.cardBgHover : 'transparent',
        transition: 'background-color 0.2s ease',
        cursor: 'pointer',
        position: 'relative',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* From-To Labels */}
      <div
        style={{
          ...typography.bodySmall,
          color: colors.secondaryText,
          marginBottom: layout.spacing.xs,
          textAlign: 'center',
        }}
      >
        {label.from} → {label.to}
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: colors.divider,
          borderRadius: '4px',
          overflow: 'hidden',
          marginBottom: layout.spacing.xs,
        }}
      >
        <div
          style={{
            width: `${Math.min(value, 100)}%`,
            height: '100%',
            backgroundColor: barColor,
            borderRadius: '4px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Percentage Value */}
      <div
        style={{
          ...typography.metricSmall,
          color: colors.primaryText,
        }}
      >
        {formatPercentage(value, 1)}
      </div>

      {/* Quality Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          marginTop: '4px',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: quality.color,
          }}
        />
        <span
          style={{
            fontSize: '10px',
            color: quality.color,
            fontWeight: 500,
          }}
        >
          {quality.label}
        </span>
      </div>

      {/* Tooltip on hover */}
      {isHovered && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            backgroundColor: colors.primaryText,
            color: colors.cardBg,
            padding: layout.spacing.sm,
            borderRadius: '8px',
            ...typography.bodySmall,
            whiteSpace: 'nowrap',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>
            {label.from} → {label.to}
          </div>
          <div>{label.description}</div>
        </div>
      )}
    </div>
  );
};

export default ConversionRateBar;
