import { useState } from 'react';
import { api } from '../services/api';
import CompanyDetails from './CompanyDetails';

interface NeighborNode {
  id: string;
  labels: string[];
  properties: Record<string, unknown>;
}

interface NeighborRel {
  id: string;
  type: string;
  startNodeId: string;
  endNodeId: string;
  properties: Record<string, unknown>;
}

interface HybridSearchResult {
  score: number;
  type: 'company' | 'person';
  payload: {
    company?: {
      id: string;
      name: string;
      domain: string;
      industry?: string;
      location?: string;
      employee_count?: number;
    };
    neighbors?: Array<{
      nodes: NeighborNode[];
      rels: NeighborRel[];
    }>;
    person?: {
      id: string;
      full_name: string;
      title?: string;
      department?: string;
      company_id?: string;
      company_domain?: string;
    };
  };
}

interface ErrorResponse {
  error?: string;
  message?: string;
}

export default function HybridSearch() {
  const [query, setQuery] = useState('');
  const [depth, setDepth] = useState(1);
  const [limit, setLimit] = useState(5);
  const [results, setResults] = useState<HybridSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompanyDomain, setSelectedCompanyDomain] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await api.hybridSearch(query.trim(), limit, depth);
      
      if (data && typeof data === 'object' && 'error' in data && !Array.isArray(data)) {
        const errorData = data as ErrorResponse;
        setError(errorData.message || errorData.error || 'Search index is empty');
        setResults([]);
      } else if (Array.isArray(data)) {
        setResults(data);
      } else {
        setError('Unexpected response format');
        setResults([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to perform hybrid search');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const formatScore = (score: number) => {
    return (score * 100).toFixed(1);
  };

  if (selectedCompanyDomain) {
    return (
      <div>
        <CompanyDetails 
          domain={selectedCompanyDomain} 
          onClose={() => setSelectedCompanyDomain(null)}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
          Hybrid Search
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Vector search + graph context expansion for deeper insights
        </p>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <form onSubmit={handleSearch}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., 'CTO healthcare Boston' or 'software companies'"
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3b82f6';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#d1d5db';
                }}
              />
              <button
                type="submit"
                disabled={loading || !query.trim()}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: loading || !query.trim() ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: loading || !query.trim() ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  transition: 'background-color 0.2s'
                }}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
                  Results:
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value) || 5)}
                  style={{
                    width: '60px',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    textAlign: 'center'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.875rem', color: '#6b7280', fontWeight: '500' }}>
                  Graph Depth:
                </label>
                <select
                  value={depth}
                  onChange={(e) => setDepth(parseInt(e.target.value))}
                  style={{
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    backgroundColor: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value={0}>0 (No expansion)</option>
                  <option value={1}>1 (Direct connections)</option>
                  <option value={2}>2 (2 levels)</option>
                  <option value={3}>3 (3 levels)</option>
                </select>
              </div>
            </div>
          </div>
        </form>
      </div>

      {error && (
        <div style={{
          backgroundColor: error.includes('empty') || error.includes('not found') 
            ? '#fef3c7' 
            : '#fef2f2',
          border: error.includes('empty') || error.includes('not found')
            ? '1px solid #fde68a'
            : '1px solid #fecaca',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem' }}>
            <div style={{ fontSize: '1.5rem' }}>
              {error.includes('empty') || error.includes('not found') ? '⚠️' : '❌'}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ 
                color: error.includes('empty') || error.includes('not found')
                  ? '#92400e'
                  : '#dc2626', 
                margin: '0 0 0.5rem 0', 
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                {error.includes('empty') || error.includes('not found')
                  ? 'Search Index Not Available'
                  : 'Search Error'}
              </p>
              <p style={{ 
                color: error.includes('empty') || error.includes('not found')
                  ? '#78350f'
                  : '#991b1b', 
                margin: 0, 
                fontSize: '0.875rem',
                lineHeight: '1.5'
              }}>
                {error.includes('empty') || error.includes('not found')
                  ? 'The search functionality requires data to be imported into the system first. Please load data into Qdrant vector database to enable hybrid search.'
                  : error}
              </p>
            </div>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '1rem'
          }}>
            Results ({results.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {results.map((result, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  padding: '1.5rem',
                  transition: 'box-shadow 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: result.type === 'company' ? '#dbeafe' : '#fef3c7',
                        color: result.type === 'company' ? '#1e40af' : '#92400e',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {result.type}
                      </span>
                      <h4 style={{
                        fontSize: '1.125rem',
                        fontWeight: '600',
                        color: '#111827',
                        margin: 0
                      }}>
                        {result.type === 'company' 
                          ? result.payload.company?.name 
                          : result.payload.person?.full_name}
                      </h4>
                    </div>

                    {result.type === 'company' && result.payload.company && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {result.payload.company.domain && (
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            margin: 0
                          }}>
                            🌐 {result.payload.company.domain}
                          </p>
                        )}
                        {result.payload.company.industry && (
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            margin: 0
                          }}>
                            🏭 {result.payload.company.industry}
                          </p>
                        )}
                        {result.payload.company.location && (
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            margin: 0
                          }}>
                            📍 {result.payload.company.location}
                          </p>
                        )}
                        {result.payload.neighbors && result.payload.neighbors.length > 0 && (
                          <div style={{
                            marginTop: '0.75rem',
                            padding: '0.75rem',
                            backgroundColor: '#f9fafb',
                            borderRadius: '0.375rem',
                            border: '1px solid #e5e7eb'
                          }}>
                            <p style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              margin: '0 0 0.5rem 0',
                              fontWeight: '500'
                            }}>
                              🔗 Graph Connections (depth {depth}):
                            </p>
                            <p style={{
                              fontSize: '0.875rem',
                              color: '#4b5563',
                              margin: 0
                            }}>
                              {result.payload.neighbors.length} connection{result.payload.neighbors.length !== 1 ? 's' : ''} found
                            </p>
                          </div>
                        )}
                        {result.payload.company.domain && (
                          <button
                            onClick={() => setSelectedCompanyDomain(result.payload.company!.domain)}
                            style={{
                              marginTop: '0.75rem',
                              padding: '0.5rem 1rem',
                              backgroundColor: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              fontWeight: '500'
                            }}
                          >
                            View Details
                          </button>
                        )}
                      </div>
                    )}

                    {result.type === 'person' && result.payload.person && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {result.payload.person.title && (
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            margin: 0
                          }}>
                            💼 {result.payload.person.title}
                          </p>
                        )}
                        {result.payload.person.department && (
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            margin: 0
                          }}>
                            🏢 {result.payload.person.department}
                          </p>
                        )}
                        {result.payload.person.company_domain && (
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            margin: 0
                          }}>
                            🏛️ Company: {result.payload.person.company_domain}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{
                    padding: '0.5rem 0.75rem',
                    backgroundColor: '#f3f4f6',
                    borderRadius: '0.375rem',
                    textAlign: 'center',
                    minWidth: '60px'
                  }}>
                    <p style={{
                      fontSize: '0.75rem',
                      color: '#6b7280',
                      margin: '0 0 0.25rem 0',
                      fontWeight: '500'
                    }}>
                      Score
                    </p>
                    <p style={{
                      fontSize: '1rem',
                      color: '#111827',
                      margin: 0,
                      fontWeight: '600'
                    }}>
                      {formatScore(result.score)}%
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && results.length === 0 && query && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <p style={{ color: '#6b7280', margin: 0 }}>
            No results found. Try a different search query.
          </p>
        </div>
      )}

      {!loading && results.length === 0 && !query && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <p style={{ color: '#6b7280', margin: 0 }}>
            Enter a search query to find companies and people with graph context.
          </p>
        </div>
      )}
    </div>
  );
}

