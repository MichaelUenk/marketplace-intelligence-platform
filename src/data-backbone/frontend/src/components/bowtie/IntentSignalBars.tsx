import React from 'react';
import { colors, layout, typography } from '../../constants/bowtie';

interface IntentSignalBarsProps {
  signals: {
    sustainability: number;
    workplace_experience: number;
    employee_wellbeing: number;
    growth_expansion: number;
  };
}

const IntentSignalBars: React.FC<IntentSignalBarsProps> = ({ signals }) => {
  const signalConfig = [
    { key: 'sustainability', label: 'Sustainability', icon: '🌱' },
    { key: 'workplace_experience', label: 'Workplace Experience', icon: '🏢' },
    { key: 'employee_wellbeing', label: 'Employee Wellbeing', icon: '❤️' },
    { key: 'growth_expansion', label: 'Growth/Expansion', icon: '📈' },
  ];

  const getBarColor = (value: number): string => {
    if (value >= 4) return colors.healthy;
    if (value >= 3) return '#3B82F6';
    if (value >= 2) return colors.risk;
    return colors.stalled;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: layout.spacing.sm }}>
      {signalConfig.map(({ key, label, icon }) => {
        const value = signals[key as keyof typeof signals];
        const barColor = getBarColor(value);

        return (
          <div key={key}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '4px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: layout.spacing.xs }}>
                <span style={{ fontSize: '14px' }}>{icon}</span>
                <span style={{ ...typography.bodySmall, color: colors.secondaryText }}>
                  {label}
                </span>
              </div>
              <span style={{ ...typography.bodySmall, color: colors.primaryText, fontWeight: 600 }}>
                {value}/5
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                gap: '4px',
              }}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: i <= value ? barColor : colors.divider,
                    transition: 'background-color 0.2s ease',
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default IntentSignalBars;
