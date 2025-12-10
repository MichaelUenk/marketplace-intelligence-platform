import { useState, useEffect } from 'react';
import { api } from '../services/api';
import CompanyDetails from './CompanyDetails';
import { useDarkMode } from '../context/DarkModeContext';

interface Company {
  id: string;
  name: string;
  domain: string;
  industry?: string;
  location?: string;
  employee_count?: number;
}

interface CompanyRecord {
  company: Company;
  people_count: number;
}

interface IndustryAnalyticsItem {
  industry: string | null;
  company_count: number;
  companies?: Company[];
}

type FilterType = 'industry' | 'location';

export default function CompanyList() {
  const { isDarkMode } = useDarkMode();
  const [filterType, setFilterType] = useState<FilterType>('industry');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [selectedCompanyDomain, setSelectedCompanyDomain] = useState<string | null>(null);
  const [industries, setIndustries] = useState<Array<{industry: string; company_count: number}>>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [companies, setCompanies] = useState<CompanyRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadIndustries = async () => {
      try {
        const data = await api.getIndustryAnalytics() as IndustryAnalyticsItem[];
        const industriesWithData = data
          .filter((item: IndustryAnalyticsItem) => item.industry !== null && item.industry !== undefined)
          .map((item: IndustryAnalyticsItem) => ({
            industry: item.industry as string,
            company_count: item.company_count
          }));
        
        const unclassifiedCount = data
          .filter((item: IndustryAnalyticsItem) => item.industry === null || item.industry === undefined)
          .reduce((sum: number, item: IndustryAnalyticsItem) => sum + item.company_count, 0);
        
        if (unclassifiedCount > 0) {
          industriesWithData.push({
            industry: 'Unclassified',
            company_count: unclassifiedCount
          });
        }
        
        setIndustries(industriesWithData);
        
        const uniqueLocations = new Set<string>();
        data.forEach((item: IndustryAnalyticsItem) => {
          if (item.companies && Array.isArray(item.companies)) {
            item.companies.forEach((company: Company) => {
              if (company.location) {
                uniqueLocations.add(company.location);
              }
            });
          }
        });
        setLocations(Array.from(uniqueLocations).sort());
        
        if (uniqueLocations.size === 0) {
          setLocations([
            'San Francisco',
            'New York',
            'London',
            'Moscow',
            'Berlin',
            'Paris',
            'Tokyo',
            'Austin',
            'Boston',
            'Seattle'
          ]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load industries');
        setLocations([
          'San Francisco',
          'New York',
          'London',
          'Moscow',
          'Berlin',
          'Paris',
          'Tokyo',
          'Austin',
          'Boston',
          'Seattle'
        ]);
      }
    };
    loadIndustries();
    
    const handleDataUpdate = () => {
      loadIndustries();
    };
    window.addEventListener('dataUpdated', handleDataUpdate);
    
    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdate);
    };
  }, []);

  useEffect(() => {
    if (filterType === 'industry' && !selectedIndustry) {
      setCompanies([]);
      return;
    }
    if (filterType === 'location' && !selectedLocation) {
      setCompanies([]);
      return;
    }

    const loadCompanies = async () => {
      try {
        setLoading(true);
        setError(null);
        let data;
        if (filterType === 'industry') {
          if (selectedIndustry === 'Unclassified') {
            data = await api.getCompaniesByIndustry('__NULL__');
          } else {
            data = await api.getCompaniesByIndustry(selectedIndustry);
          }
        } else {
          data = await api.getCompaniesByLocation(selectedLocation);
        }
        setCompanies(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load companies');
        setCompanies([]);
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
    
    const handleDataUpdate = () => {
      loadCompanies();
    };
    window.addEventListener('dataUpdated', handleDataUpdate);
    
    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdate);
    };
  }, [filterType, selectedIndustry, selectedLocation]);

  return (
    <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: isDarkMode ? '#f9fafb' : '#111827', marginBottom: '0.5rem' }}>
          Companies
        </h2>
        <p style={{ color: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: '0.875rem' }}>
          Browse companies by industry or location
        </p>
      </div>

      <div style={{
        backgroundColor: isDarkMode ? '#1f2937' : 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        transition: 'background-color 0.3s'
      }}>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
          <button
            onClick={() => {
              setFilterType('industry');
              setSelectedIndustry('');
              setSelectedLocation('');
            }}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '0.375rem',
              backgroundColor: filterType === 'industry' ? '#3b82f6' : isDarkMode ? '#374151' : '#f3f4f6',
              color: filterType === 'industry' ? 'white' : isDarkMode ? '#d1d5db' : '#6b7280',
              fontWeight: filterType === 'industry' ? '600' : '500',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.2s'
            }}
          >
            By Industry
          </button>
          <button
            onClick={() => {
              setFilterType('location');
              setSelectedIndustry('');
              setSelectedLocation('');
            }}
            style={{
              padding: '0.5rem 1rem',
              border: 'none',
              borderRadius: '0.375rem',
              backgroundColor: filterType === 'location' ? '#3b82f6' : isDarkMode ? '#374151' : '#f3f4f6',
              color: filterType === 'location' ? 'white' : isDarkMode ? '#d1d5db' : '#6b7280',
              fontWeight: filterType === 'location' ? '600' : '500',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.2s'
            }}
          >
            By Location
          </button>
        </div>

        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: isDarkMode ? '#f9fafb' : '#111827',
          marginBottom: '1rem'
        }}>
          {filterType === 'industry' ? 'Filter by Industry' : 'Filter by Location'}
        </h3>
        
        {filterType === 'industry' ? (
          industries.length === 0 ? (
            <p style={{ color: '#6b7280', margin: 0 }}>Loading industries...</p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '0.75rem'
            }}>
              {industries.map((ind) => (
                <button
                  key={ind.industry}
                  onClick={() => setSelectedIndustry(
                    selectedIndustry === ind.industry ? '' : ind.industry
                  )}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: selectedIndustry === ind.industry 
                      ? '2px solid #3b82f6' 
                      : '1px solid #e5e7eb',
                    backgroundColor: selectedIndustry === ind.industry 
                      ? '#eff6ff' 
                      : 'white',
                    color: selectedIndustry === ind.industry 
                      ? '#1e40af' 
                      : '#111827',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontWeight: selectedIndustry === ind.industry ? '600' : '500'
                  }}
                >
                  <div style={{ fontSize: '0.875rem', fontWeight: 'inherit' }}>
                    {ind.industry}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    {ind.company_count} {ind.company_count === 1 ? 'company' : 'companies'}
                  </div>
                </button>
              ))}
            </div>
          )
        ) : (
          locations.length === 0 ? (
            <p style={{ color: '#6b7280', margin: 0 }}>Loading locations...</p>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: '0.75rem'
            }}>
              {locations.map((loc) => (
                <button
                  key={loc}
                  onClick={() => setSelectedLocation(
                    selectedLocation === loc ? '' : loc
                  )}
                  style={{
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: selectedLocation === loc 
                      ? '2px solid #3b82f6' 
                      : '1px solid #e5e7eb',
                    backgroundColor: selectedLocation === loc 
                      ? '#eff6ff' 
                      : 'white',
                    color: selectedLocation === loc 
                      ? '#1e40af' 
                      : '#111827',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontWeight: selectedLocation === loc ? '600' : '500'
                  }}
                >
                  <div style={{ fontSize: '0.875rem', fontWeight: 'inherit' }}>
                    📍 {loc}
                  </div>
                </button>
              ))}
            </div>
          )
        )}
      </div>

      {error && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <p style={{ color: '#dc2626', margin: 0, fontSize: '0.875rem' }}>
            Error: {error}
          </p>
        </div>
      )}

      {selectedCompanyDomain && (
        <div>
          <CompanyDetails 
            domain={selectedCompanyDomain} 
            onClose={() => setSelectedCompanyDomain(null)}
          />
        </div>
      )}

      {!selectedCompanyDomain && ((filterType === 'industry' && selectedIndustry) || (filterType === 'location' && selectedLocation)) && (
        <div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#111827',
            marginBottom: '1rem'
          }}>
            Companies {filterType === 'industry' ? `in ${selectedIndustry}` : `in ${selectedLocation}`}
          </h3>

          {loading ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} style={{
                  backgroundColor: 'white',
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  padding: '1.5rem'
                }}>
                  <div style={{ height: '1.25rem', backgroundColor: '#e5e7eb', borderRadius: '0.25rem', marginBottom: '0.75rem' }}></div>
                  <div style={{ height: '1rem', backgroundColor: '#e5e7eb', borderRadius: '0.25rem', width: '60%', marginBottom: '0.5rem' }}></div>
                  <div style={{ height: '0.875rem', backgroundColor: '#e5e7eb', borderRadius: '0.25rem', width: '40%' }}></div>
                </div>
              ))}
            </div>
          ) : companies.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {companies.map((record, index) => {
                const company = record.company;
                return (
                  <div
                    key={company.id || index}
                    onClick={() => setSelectedCompanyDomain(company.domain)}
                    style={{
                      backgroundColor: 'white',
                      borderRadius: '0.5rem',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                      padding: '1.5rem',
                      transition: 'box-shadow 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                    }}
                  >
                    <h4 style={{
                      fontSize: '1.125rem',
                      fontWeight: '600',
                      color: '#111827',
                      margin: '0 0 0.5rem 0'
                    }}>
                      {company.name}
                    </h4>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#6b7280',
                      margin: '0 0 0.75rem 0'
                    }}>
                      {company.domain}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {company.location && (
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#4b5563',
                          margin: 0,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem'
                        }}>
                          <span>📍</span>
                          {company.location}
                        </p>
                      )}
                      {company.employee_count !== undefined && (
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#4b5563',
                          margin: 0
                        }}>
                          👥 {company.employee_count} employees
                        </p>
                      )}
                      {record.people_count > 0 && (
                        <p style={{
                          fontSize: '0.875rem',
                          color: '#4b5563',
                          margin: 0
                        }}>
                          👤 {record.people_count} {record.people_count === 1 ? 'person' : 'people'} in database
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              padding: '3rem',
              textAlign: 'center'
            }}>
              <p style={{ color: '#6b7280', margin: 0 }}>
                No companies found in this industry.
              </p>
            </div>
          )}
        </div>
      )}

      {!selectedCompanyDomain && !((filterType === 'industry' && selectedIndustry) || (filterType === 'location' && selectedLocation)) && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <p style={{ color: '#6b7280', margin: 0 }}>
            {filterType === 'industry' 
              ? 'Select an industry to view companies.'
              : 'Select a location to view companies.'}
          </p>
        </div>
      )}
    </div>
  );
}
