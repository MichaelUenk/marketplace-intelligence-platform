import { useState } from 'react';
import { api } from '../services/api';
import CompanyDetails from './CompanyDetails';

interface SearchResult {
  score: number;
  id: string;
  type: 'company' | 'person';
  name?: string;
  full_name?: string;
  domain?: string;
  title?: string;
  department?: string;
  company_domain?: string;
  company_id?: string;
  ext_id?: string;
}

interface ErrorResponse {
  error?: string;
  message?: string;
}

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
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
      const data = await api.semanticSearch(query.trim(), 'company,person', 20);
      
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
      setError(err instanceof Error ? err.message : 'Failed to perform search');
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
          Semantic Search
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          Search for companies and people using natural language
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
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., 'CTO healthcare Boston' or 'software companies in San Francisco'"
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
              onClick={(e) => {
                if (!query.trim()) {
                  e.preventDefault();
                  return;
                }
              }}
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
                  ? 'The search functionality requires data to be imported into the system first. Please load data into Qdrant vector database to enable semantic search.'
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {results.map((result, index) => (
              <div
                key={result.id || index}
                style={{
                  backgroundColor: 'white',
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  padding: '1.5rem',
                  transition: 'box-shadow 0.2s',
                  cursor: result.type === 'company' && result.domain ? 'pointer' : 'default'
                }}
                onClick={() => {
                  if (result.type === 'company' && result.domain) {
                    setSelectedCompanyDomain(result.domain);
                  }
                }}
                onMouseEnter={(e) => {
                  if (result.type === 'company' && result.domain) {
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (result.type === 'company' && result.domain) {
                    e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
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
                        {result.type === 'company' ? result.name : result.full_name}
                      </h4>
                    </div>

                    {result.type === 'company' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {result.domain && (
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            margin: 0
                          }}>
                            🌐 {result.domain}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {result.title && (
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            margin: 0
                          }}>
                            💼 {result.title}
                          </p>
                        )}
                        {result.department && (
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            margin: 0
                          }}>
                            🏢 Department: {result.department}
                          </p>
                        )}
                        {result.company_domain && (
                          <p style={{
                            fontSize: '0.875rem',
                            color: '#6b7280',
                            margin: 0
                          }}>
                            🏛️ Company: {result.company_domain}
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
            Enter a search query to find companies and people.
          </p>
        </div>
      )}
    </div>
  );
}

