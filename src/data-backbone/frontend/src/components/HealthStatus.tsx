import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useDarkMode } from '../context/DarkModeContext';

export default function HealthStatus() {
  const { isDarkMode } = useDarkMode();
  const [status, setStatus] = useState<'checking' | 'healthy' | 'unhealthy'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        setStatus('checking');
        setError(null);
        const result = await api.healthCheck();
        if (result.ok) {
          setStatus('healthy');
        } else {
          setStatus('unhealthy');
        }
      } catch (err) {
        setStatus('unhealthy');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const statusColor = status === 'healthy' 
    ? '#10b981' 
    : status === 'unhealthy' 
    ? '#ef4444' 
    : '#eab308';

  return (
    <div style={{
      backgroundColor: isDarkMode ? '#1f2937' : 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      padding: '1.5rem',
      transition: 'background-color 0.3s'
    }}>
      <h2 style={{
        fontSize: '1.125rem',
        fontWeight: '600',
        color: isDarkMode ? '#f9fafb' : '#111827',
        marginBottom: '1rem'
      }}>
        API Status
      </h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: statusColor,
            animation: status === 'checking' ? 'pulse 2s infinite' : 'none'
          }}
        ></div>
        <div>
          <p style={{
            fontSize: '0.875rem',
            fontWeight: '500',
            color: isDarkMode ? '#f9fafb' : '#111827',
            margin: 0
          }}>
            {status === 'healthy'
              ? 'Healthy'
              : status === 'unhealthy'
              ? 'Unhealthy'
              : 'Checking...'}
          </p>
          {error && (
            <p style={{
              fontSize: '0.75rem',
              color: '#dc2626',
              marginTop: '0.25rem',
              margin: 0
            }}>
              {error}
            </p>
          )}
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

