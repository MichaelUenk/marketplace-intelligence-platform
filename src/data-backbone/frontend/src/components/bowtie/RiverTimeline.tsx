import React from 'react';
import { colors, layout, typography, STAGES, getStageColor } from '../../constants/bowtie';
import type { StageCode } from '../../types/bowtie';
import { formatDate } from '../../utils/bowtie';

interface StageHistoryItem {
  stage: StageCode;
  entered_at: Date;
  duration_days: number | null;
}

interface RiverTimelineProps {
  history: StageHistoryItem[];
  currentStage: StageCode;
}

const RiverTimeline: React.FC<RiverTimelineProps> = ({ history, currentStage }) => {
  const allStages = STAGES;

  // Calculate total journey time
  const totalDays = history.reduce((sum, h) => sum + (h.duration_days || 0), 0);

  // Get the current stage index
  const currentStageIndex = allStages.findIndex((s) => s.code === currentStage);

  return (
    <div style={{ padding: layout.spacing.md }}>
      <h4
        style={{
          ...typography.h4,
          color: colors.primaryText,
          marginBottom: layout.spacing.lg,
        }}
      >
        Journey Timeline
      </h4>

      {/* Timeline */}
      <div style={{ position: 'relative', paddingBottom: layout.spacing.xl }}>
        {/* Connection Line */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '20px',
            height: '4px',
            backgroundColor: colors.divider,
            borderRadius: '2px',
          }}
        />

        {/* Progress Line */}
        <div
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            width: `${(currentStageIndex / (allStages.length - 1)) * 100}%`,
            maxWidth: 'calc(100% - 40px)',
            height: '4px',
            background: `linear-gradient(90deg, ${colors.acquisition}, ${colors.activation}, ${colors.expansion})`,
            borderRadius: '2px',
          }}
        />

        {/* Stage Nodes */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          {allStages.map((stage, index) => {
            const historyItem = history.find((h) => h.stage === stage.code);
            const isCompleted = index < currentStageIndex;
            const isCurrent = stage.code === currentStage;
            const isFuture = index > currentStageIndex;
            const stageColor = getStageColor(stage.side);

            return (
              <div
                key={stage.code}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  width: '60px',
                }}
              >
                {/* Node */}
                <div
                  style={{
                    width: isCurrent ? '40px' : '32px',
                    height: isCurrent ? '40px' : '32px',
                    borderRadius: '50%',
                    backgroundColor: isFuture ? colors.background : stageColor,
                    border: isFuture ? `3px dashed ${colors.border}` : `3px solid ${stageColor}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isFuture ? colors.tertiaryText : 'white',
                    fontSize: isCurrent ? '16px' : '14px',
                    fontWeight: 600,
                    boxShadow: isCurrent ? `0 0 0 4px ${stageColor}30` : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {isCompleted ? '✓' : isCurrent ? '◉' : '○'}
                </div>

                {/* Stage Label */}
                <div
                  style={{
                    marginTop: layout.spacing.sm,
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      ...typography.stageLabel,
                      fontSize: '9px',
                      color: isFuture ? colors.tertiaryText : stageColor,
                    }}
                  >
                    {stage.label}
                  </div>
                  <div
                    style={{
                      ...typography.bodySmall,
                      fontSize: '10px',
                      color: colors.tertiaryText,
                      marginTop: '2px',
                    }}
                  >
                    {stage.code}
                  </div>
                </div>

                {/* Date & Duration (if has history) */}
                {historyItem && (
                  <div
                    style={{
                      marginTop: layout.spacing.xs,
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '10px',
                        color: colors.secondaryText,
                      }}
                    >
                      {formatDate(historyItem.entered_at)}
                    </div>
                    {historyItem.duration_days && (
                      <div
                        style={{
                          fontSize: '10px',
                          color: colors.tertiaryText,
                        }}
                      >
                        {historyItem.duration_days}d
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div
        style={{
          marginTop: layout.spacing.lg,
          padding: layout.spacing.md,
          backgroundColor: colors.background,
          borderRadius: '8px',
          display: 'flex',
          justifyContent: 'space-around',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...typography.metricSmall, color: colors.primaryText }}>
            {totalDays}
          </div>
          <div style={{ ...typography.bodySmall, color: colors.secondaryText }}>
            Total Days
          </div>
        </div>
        <div
          style={{
            width: '1px',
            backgroundColor: colors.border,
          }}
        />
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...typography.metricSmall, color: colors.primaryText }}>
            62
          </div>
          <div style={{ ...typography.bodySmall, color: colors.secondaryText }}>
            Avg for Segment
          </div>
        </div>
        <div
          style={{
            width: '1px',
            backgroundColor: colors.border,
          }}
        />
        <div style={{ textAlign: 'center' }}>
          <div style={{ ...typography.metricSmall, color: totalDays < 62 ? colors.healthy : colors.risk }}>
            {totalDays < 62 ? '✓ Faster' : '⚠ Slower'}
          </div>
          <div style={{ ...typography.bodySmall, color: colors.secondaryText }}>
            vs Average
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiverTimeline;
