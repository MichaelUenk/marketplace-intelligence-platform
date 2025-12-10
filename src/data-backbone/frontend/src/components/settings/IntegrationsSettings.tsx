import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Zap,
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Key,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Settings,
  Database,
  Users,
  Search,
  FileSpreadsheet
} from 'lucide-react';

// Types for connector data
interface ConnectorConfig {
  id: string;
  name: string;
  type: string;
  auth_type: string;
  auth_fields: string[];
  base_url: string;
  rate_limit: number;
  rate_limit_window: number;
  supports_search: boolean;
  supports_enrich: boolean;
  supports_people: boolean;
  supports_webhook: boolean;
  docs_url: string;
  icon: string;
  description: string;
}

interface ConnectorCredential {
  connector_id: string;
  credentials: Record<string, string>;
  status: 'connected' | 'disconnected' | 'error';
  last_tested?: string;
  rate_limit?: {
    remaining: number;
    total: number;
    resets_at?: string;
  };
}

interface TestConnectionResult {
  status: 'success' | 'failed' | 'error';
  message: string;
  rate_limit?: {
    remaining: number;
    total: number;
  };
}

// Connector icon mapping
const ConnectorIcon: React.FC<{ type: string; className?: string }> = ({ type, className = '' }) => {
  const iconClass = `${className}`;
  switch (type) {
    case 'company':
      return <Database className={iconClass} />;
    case 'people':
      return <Users className={iconClass} />;
    case 'scraper':
      return <Search className={iconClass} />;
    case 'file':
      return <FileSpreadsheet className={iconClass} />;
    default:
      return <Zap className={iconClass} />;
  }
};

// Status badge component
const StatusBadge: React.FC<{ status: ConnectorCredential['status'] }> = ({ status }) => {
  const config = {
    connected: { color: 'badge-green', icon: CheckCircle, label: 'Connected' },
    disconnected: { color: 'badge-gray', icon: XCircle, label: 'Not Connected' },
    error: { color: 'badge-red', icon: AlertCircle, label: 'Error' },
  };

  const { color, icon: Icon, label } = config[status];

  return (
    <span className={`badge ${color}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
      <Icon size={12} />
      {label}
    </span>
  );
};

// Single connector card component
interface ConnectorCardProps {
  connector: ConnectorConfig;
  credential?: ConnectorCredential;
  onConfigure: (connector: ConnectorConfig) => void;
  onTest: (connectorId: string, credentials: Record<string, string>) => Promise<TestConnectionResult>;
  onDisconnect: (connectorId: string) => void;
}

const ConnectorCard: React.FC<ConnectorCardProps> = ({
  connector,
  credential,
  onConfigure,
  onTest,
  onDisconnect,
}) => {
  const { t } = useTranslation('common');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);

  const status = credential?.status || 'disconnected';
  const isConnected = status === 'connected';

  const handleTest = async () => {
    if (!credential?.credentials) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await onTest(connector.id, credential.credentials);
      setTestResult(result);
    } catch (err) {
      setTestResult({ status: 'error', message: err instanceof Error ? err.message : 'Test failed' });
    } finally {
      setTesting(false);
    }
  };

  const capabilities = [];
  if (connector.supports_search) capabilities.push('Search');
  if (connector.supports_enrich) capabilities.push('Enrich');
  if (connector.supports_people) capabilities.push('People');
  if (connector.supports_webhook) capabilities.push('Webhooks');

  return (
    <div className="card" style={{ marginBottom: '16px' }}>
      <div className="card-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'var(--color-surface-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ConnectorIcon type={connector.type} className="w-6 h-6" />
            </div>
            <div>
              <h4 style={{ margin: 0, fontWeight: 600 }}>{connector.name}</h4>
              <p className="text-body-sm" style={{ margin: '4px 0 0 0', color: 'var(--color-text-secondary)' }}>
                {connector.description}
              </p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>

        {/* Capabilities */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {capabilities.map((cap) => (
            <span key={cap} className="badge badge-blue" style={{ fontSize: '11px' }}>
              {cap}
            </span>
          ))}
          {connector.rate_limit > 0 && (
            <span className="badge badge-gray" style={{ fontSize: '11px' }}>
              {connector.rate_limit}/{connector.rate_limit_window}s rate limit
            </span>
          )}
        </div>

        {/* Rate limit info for connected connectors */}
        {isConnected && credential?.rate_limit && (
          <div
            style={{
              padding: '12px',
              background: 'var(--color-surface-secondary)',
              borderRadius: '8px',
              marginBottom: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="text-body-sm">API Usage</span>
              <span className="text-body-sm" style={{ fontWeight: 500 }}>
                {credential.rate_limit.remaining} / {credential.rate_limit.total} remaining
              </span>
            </div>
            <div
              style={{
                height: '4px',
                background: 'var(--color-border)',
                borderRadius: '2px',
                marginTop: '8px',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${(credential.rate_limit.remaining / credential.rate_limit.total) * 100}%`,
                  background: 'var(--color-blue)',
                  borderRadius: '2px',
                  transition: 'width 0.3s'
                }}
              />
            </div>
          </div>
        )}

        {/* Test result message */}
        {testResult && (
          <div
            className={`badge ${testResult.status === 'success' ? 'badge-green' : 'badge-red'}`}
            style={{
              display: 'block',
              padding: '12px',
              marginBottom: '16px',
              textAlign: 'center'
            }}
          >
            {testResult.message}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          {connector.docs_url && (
            <a
              href={connector.docs_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <ExternalLink size={14} />
              Docs
            </a>
          )}

          {isConnected && (
            <>
              <button
                className="btn btn-secondary"
                onClick={handleTest}
                disabled={testing}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                {testing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Test
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => onDisconnect(connector.id)}
                style={{ color: 'var(--color-red)' }}
              >
                Disconnect
              </button>
            </>
          )}

          <button
            className={`btn ${isConnected ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => onConfigure(connector)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            <Settings size={14} />
            {isConnected ? 'Configure' : 'Connect'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Configuration modal component
interface ConfigureModalProps {
  connector: ConnectorConfig | null;
  credential?: ConnectorCredential;
  onClose: () => void;
  onSave: (connectorId: string, credentials: Record<string, string>) => Promise<void>;
  onTest: (connectorId: string, credentials: Record<string, string>) => Promise<TestConnectionResult>;
}

const ConfigureModal: React.FC<ConfigureModalProps> = ({
  connector,
  credential,
  onClose,
  onSave,
  onTest,
}) => {
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (connector && credential?.credentials) {
      setCredentials(credential.credentials);
    } else if (connector) {
      const initial: Record<string, string> = {};
      connector.auth_fields.forEach(field => {
        initial[field] = '';
      });
      setCredentials(initial);
    }
  }, [connector, credential]);

  if (!connector) return null;

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setError(null);
    try {
      const result = await onTest(connector.id, credentials);
      setTestResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave(connector.id, credentials);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleShowSecret = (field: string) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const getFieldLabel = (field: string) => {
    const labels: Record<string, string> = {
      api_key: 'API Key',
      api_token: 'API Token',
      apify_token: 'Apify Token',
      li_at_cookie: 'LinkedIn Cookie (li_at)',
    };
    return labels[field] || field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '20px'
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
      >
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'var(--color-surface-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ConnectorIcon type={connector.type} className="w-5 h-5" />
            </div>
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>Configure {connector.name}</h3>
              <p className="text-body-sm" style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
                {connector.auth_type === 'none' ? 'No authentication required' : 'Enter your credentials below'}
              </p>
            </div>
          </div>
        </div>

        <div className="card-content">
          {connector.auth_type === 'none' ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                background: 'var(--color-surface-secondary)',
                borderRadius: '8px'
              }}
            >
              <FileSpreadsheet size={48} style={{ color: 'var(--color-text-tertiary)', marginBottom: '12px' }} />
              <p className="text-body">This connector doesn't require any configuration.</p>
              <p className="text-body-sm" style={{ color: 'var(--color-text-secondary)' }}>
                You can use it directly to import files.
              </p>
            </div>
          ) : (
            <>
              {connector.auth_fields.map((field) => (
                <div key={field} className="input-wrapper" style={{ marginBottom: '16px' }}>
                  <label className="label">{getFieldLabel(field)}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showSecrets[field] ? 'text' : 'password'}
                      className="input"
                      value={credentials[field] || ''}
                      onChange={(e) => setCredentials(prev => ({ ...prev, [field]: e.target.value }))}
                      placeholder={`Enter your ${getFieldLabel(field).toLowerCase()}`}
                      style={{ paddingRight: '40px' }}
                    />
                    <button
                      type="button"
                      onClick={() => toggleShowSecret(field)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        color: 'var(--color-text-tertiary)'
                      }}
                    >
                      {showSecrets[field] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}

              {/* Help text */}
              {connector.docs_url && (
                <p className="text-body-sm" style={{ color: 'var(--color-text-tertiary)', marginBottom: '16px' }}>
                  Need help? Check the{' '}
                  <a href={connector.docs_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-blue)' }}>
                    API documentation
                  </a>
                </p>
              )}
            </>
          )}

          {/* Error message */}
          {error && (
            <div className="badge badge-red" style={{ display: 'block', padding: '12px', marginBottom: '16px', textAlign: 'center' }}>
              {error}
            </div>
          )}

          {/* Test result */}
          {testResult && (
            <div
              className={`badge ${testResult.status === 'success' ? 'badge-green' : 'badge-red'}`}
              style={{ display: 'block', padding: '12px', marginBottom: '16px', textAlign: 'center' }}
            >
              {testResult.message}
              {testResult.rate_limit && (
                <span style={{ display: 'block', fontSize: '11px', marginTop: '4px' }}>
                  API calls remaining: {testResult.rate_limit.remaining} / {testResult.rate_limit.total}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="card-footer" style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>

          {connector.auth_type !== 'none' && (
            <button
              className="btn btn-secondary"
              onClick={handleTest}
              disabled={testing || connector.auth_fields.some(f => !credentials[f])}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              {testing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Test Connection
            </button>
          )}

          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || (connector.auth_type !== 'none' && connector.auth_fields.some(f => !credentials[f]))}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
            {connector.auth_type === 'none' ? 'Enable' : 'Save Credentials'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Main IntegrationsSettings component
export const IntegrationsSettings: React.FC = () => {
  const { t } = useTranslation('common');
  const [connectors, setConnectors] = useState<ConnectorConfig[]>([]);
  const [credentials, setCredentials] = useState<Record<string, ConnectorCredential>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configuringConnector, setConfiguringConnector] = useState<ConnectorConfig | null>(null);

  // Load connectors from API
  useEffect(() => {
    loadConnectors();
    loadSavedCredentials();
  }, []);

  const loadConnectors = async () => {
    try {
      setLoading(true);
      // Note: Vite proxy rewrites /api/* to /* on backend, so we need /api/api/connectors
      // to end up at /api/connectors on the backend
      const response = await fetch('/api/api/connectors/registry');
      if (!response.ok) throw new Error('Failed to load connectors');
      const data = await response.json();
      setConnectors(data.connectors || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connectors');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedCredentials = () => {
    // Load from localStorage for now (in production, this would be from backend)
    const saved = localStorage.getItem('connector_credentials');
    if (saved) {
      try {
        setCredentials(JSON.parse(saved));
      } catch {
        // Ignore parse errors
      }
    }
  };

  const saveCredentials = (connectorId: string, creds: Record<string, string>) => {
    const updated = {
      ...credentials,
      [connectorId]: {
        connector_id: connectorId,
        credentials: creds,
        status: 'connected' as const,
        last_tested: new Date().toISOString(),
      }
    };
    setCredentials(updated);
    localStorage.setItem('connector_credentials', JSON.stringify(updated));
  };

  const handleTestConnection = async (connectorId: string, creds: Record<string, string>): Promise<TestConnectionResult> => {
    const response = await fetch('/api/api/connectors/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        connector_id: connectorId,
        auth_config: creds,
      }),
    });

    if (!response.ok) {
      throw new Error('Connection test failed');
    }

    return response.json();
  };

  const handleSaveCredentials = async (connectorId: string, creds: Record<string, string>) => {
    // Test connection first
    const result = await handleTestConnection(connectorId, creds);
    if (result.status !== 'success') {
      throw new Error(result.message);
    }

    // Save if successful
    saveCredentials(connectorId, creds);
  };

  const handleDisconnect = (connectorId: string) => {
    const updated = { ...credentials };
    delete updated[connectorId];
    setCredentials(updated);
    localStorage.setItem('connector_credentials', JSON.stringify(updated));
  };

  // Group connectors by type
  const groupedConnectors = connectors.reduce((acc, connector) => {
    const type = connector.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(connector);
    return acc;
  }, {} as Record<string, ConnectorConfig[]>);

  const typeLabels: Record<string, string> = {
    company: 'Company Data Sources',
    people: 'People & Email Sources',
    scraper: 'Web Scraping & LinkedIn',
    file: 'File Import',
  };

  if (loading) {
    return (
      <div className="card">
        <div className="card-content" style={{ textAlign: 'center', padding: '48px' }}>
          <Loader2 size={32} className="animate-spin" style={{ color: 'var(--color-text-tertiary)', marginBottom: '12px' }} />
          <p>Loading integrations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-content" style={{ textAlign: 'center', padding: '48px' }}>
          <AlertCircle size={32} style={{ color: 'var(--color-red)', marginBottom: '12px' }} />
          <p style={{ color: 'var(--color-red)' }}>{error}</p>
          <button className="btn btn-primary" onClick={loadConnectors} style={{ marginTop: '16px' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div className="card">
          <div className="card-content" style={{ textAlign: 'center' }}>
            <Zap size={24} style={{ color: 'var(--color-blue)', marginBottom: '8px' }} />
            <p className="text-h3" style={{ margin: '0 0 4px 0' }}>{connectors.length}</p>
            <p className="text-body-sm" style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Available</p>
          </div>
        </div>
        <div className="card">
          <div className="card-content" style={{ textAlign: 'center' }}>
            <CheckCircle size={24} style={{ color: 'var(--color-green)', marginBottom: '8px' }} />
            <p className="text-h3" style={{ margin: '0 0 4px 0' }}>
              {Object.values(credentials).filter(c => c.status === 'connected').length}
            </p>
            <p className="text-body-sm" style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Connected</p>
          </div>
        </div>
        <div className="card">
          <div className="card-content" style={{ textAlign: 'center' }}>
            <XCircle size={24} style={{ color: 'var(--color-text-tertiary)', marginBottom: '8px' }} />
            <p className="text-h3" style={{ margin: '0 0 4px 0' }}>
              {connectors.length - Object.values(credentials).filter(c => c.status === 'connected').length}
            </p>
            <p className="text-body-sm" style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Not Connected</p>
          </div>
        </div>
      </div>

      {/* Connector groups */}
      {Object.entries(groupedConnectors).map(([type, typeConnectors]) => (
        <div key={type} style={{ marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ConnectorIcon type={type} className="w-5 h-5" />
            {typeLabels[type] || type}
          </h3>
          {typeConnectors.map((connector) => (
            <ConnectorCard
              key={connector.id}
              connector={connector}
              credential={credentials[connector.id]}
              onConfigure={setConfiguringConnector}
              onTest={handleTestConnection}
              onDisconnect={handleDisconnect}
            />
          ))}
        </div>
      ))}

      {/* Configure modal */}
      {configuringConnector && (
        <ConfigureModal
          connector={configuringConnector}
          credential={credentials[configuringConnector.id]}
          onClose={() => setConfiguringConnector(null)}
          onSave={handleSaveCredentials}
          onTest={handleTestConnection}
        />
      )}
    </div>
  );
};

export default IntegrationsSettings;
