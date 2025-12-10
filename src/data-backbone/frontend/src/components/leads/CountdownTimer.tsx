import React, { useState, useEffect } from 'react';
import { formatTimeRemaining, getTimerColor, LEADS_COLORS } from '../../constants/leads';
import type { TimerInfo } from '../../types/leads';

interface CountdownTimerProps {
  createdAt: Date;
  compact?: boolean;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ createdAt, compact = false }) => {
  const [timerInfo, setTimerInfo] = useState<TimerInfo>(() => formatTimeRemaining(createdAt));

  useEffect(() => {
    // Update timer every second
    const interval = setInterval(() => {
      setTimerInfo(formatTimeRemaining(createdAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  // Handle visibility API - pause when tab is inactive
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Recalculate immediately when tab becomes visible
        setTimerInfo(formatTimeRemaining(createdAt));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [createdAt]);

  const timerColor = getTimerColor(timerInfo.state);
  const isPulsing = timerInfo.state === 'yellow' || timerInfo.state === 'orange';
  const isFastPulsing = timerInfo.state === 'orange';

  if (compact) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.25rem 0.5rem',
          backgroundColor: `${timerColor}15`,
          borderRadius: '0.25rem',
          animation: isPulsing ? `pulse ${isFastPulsing ? '0.5s' : '1s'} ease-in-out infinite` : 'none',
        }}
      >
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: timerColor,
          }}
        />
        <span
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: timerColor,
            fontFamily: 'monospace',
          }}
        >
          {timerInfo.text}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.375rem',
      }}
    >
      {/* Timer Display */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: isPulsing ? `pulse ${isFastPulsing ? '0.5s' : '1s'} ease-in-out infinite` : 'none',
        }}
      >
        <span
          style={{
            fontSize: '1rem',
            fontWeight: 700,
            color: timerColor,
            fontFamily: 'monospace',
            letterSpacing: '-0.025em',
          }}
        >
          {timerInfo.text}
        </span>
        {timerInfo.isExpired && (
          <span style={{ fontSize: '0.875rem' }}>🔴</span>
        )}
        {!timerInfo.isExpired && timerInfo.state === 'orange' && (
          <span style={{ fontSize: '0.875rem' }}>⚠️</span>
        )}
      </div>

      {/* Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '4px',
          backgroundColor: LEADS_COLORS.border,
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${timerInfo.percentRemaining}%`,
            height: '100%',
            backgroundColor: timerColor,
            borderRadius: '2px',
            transition: 'width 0.3s ease, background-color 0.3s ease',
          }}
        />
      </div>

      {/* Add pulse animation via style tag */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
};

export default CountdownTimer;
