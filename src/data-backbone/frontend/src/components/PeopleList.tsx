import { useState, useEffect } from 'react';
import { api } from '../services/api';
import CompanyDetails from './CompanyDetails';
import { useDarkMode } from '../context/DarkModeContext';

interface Person {
  id: string;
  full_name: string;
  title?: string;
  department?: string;
}

interface PersonRecord {
  person: Person;
  companies: Array<{
    id: string;
    name: string;
    domain: string;
    industry?: string;
  }>;
  emails: string[];
}

interface DepartmentAnalyticsItem {
  department: string | null;
}

// Demo data for contacts/people
const DEMO_DEPARTMENTS = [
  'Engineering',
  'Sales',
  'Marketing',
  'Product',
  'Finance',
  'Operations',
  'Human Resources',
  'Customer Success',
];

const DEMO_PEOPLE: Record<string, PersonRecord[]> = {
  'Engineering': [
    {
      person: { id: 'p1', full_name: 'Jan de Vries', title: 'CTO', department: 'Engineering' },
      companies: [{ id: 'c1', name: 'TechFlow BV', domain: 'techflow.nl', industry: 'SaaS' }],
      emails: ['jan.devries@techflow.nl'],
    },
    {
      person: { id: 'p2', full_name: 'Sarah van den Berg', title: 'VP Engineering', department: 'Engineering' },
      companies: [{ id: 'c2', name: 'CloudNine Systems', domain: 'cloudnine.nl', industry: 'Cloud Infrastructure' }],
      emails: ['sarah.vandenberg@cloudnine.nl'],
    },
    {
      person: { id: 'p3', full_name: 'Thomas Bakker', title: 'Senior Software Engineer', department: 'Engineering' },
      companies: [{ id: 'c3', name: 'DataSphere NL', domain: 'datasphere.nl', industry: 'Data Analytics' }],
      emails: ['t.bakker@datasphere.nl'],
    },
    {
      person: { id: 'p4', full_name: 'Lisa Jansen', title: 'Engineering Manager', department: 'Engineering' },
      companies: [{ id: 'c4', name: 'InnovateTech BV', domain: 'innovatetech.nl', industry: 'Technology' }],
      emails: ['lisa.jansen@innovatetech.nl'],
    },
    {
      person: { id: 'p5', full_name: 'Mark Peters', title: 'IT Director', department: 'Engineering' },
      companies: [{ id: 'c2', name: 'CloudNine Systems', domain: 'cloudnine.nl', industry: 'Cloud Infrastructure' }],
      emails: ['mark.peters@cloudnine.nl'],
    },
  ],
  'Sales': [
    {
      person: { id: 'p6', full_name: 'Emma de Groot', title: 'VP Sales', department: 'Sales' },
      companies: [{ id: 'c1', name: 'TechFlow BV', domain: 'techflow.nl', industry: 'SaaS' }],
      emails: ['emma.degroot@techflow.nl'],
    },
    {
      person: { id: 'p7', full_name: 'Pieter van Dijk', title: 'Sales Director', department: 'Sales' },
      companies: [{ id: 'c5', name: 'ScaleUp Solutions', domain: 'scaleup.nl', industry: 'Consulting' }],
      emails: ['pieter@scaleup.nl'],
    },
    {
      person: { id: 'p8', full_name: 'Anna Visser', title: 'Enterprise Account Executive', department: 'Sales' },
      companies: [{ id: 'c3', name: 'DataSphere NL', domain: 'datasphere.nl', industry: 'Data Analytics' }],
      emails: ['anna.visser@datasphere.nl'],
    },
  ],
  'Marketing': [
    {
      person: { id: 'p9', full_name: 'Sophie Mulder', title: 'CMO', department: 'Marketing' },
      companies: [{ id: 'c4', name: 'InnovateTech BV', domain: 'innovatetech.nl', industry: 'Technology' }],
      emails: ['sophie.mulder@innovatetech.nl'],
    },
    {
      person: { id: 'p10', full_name: 'Daan Bos', title: 'Head of Digital Marketing', department: 'Marketing' },
      companies: [{ id: 'c1', name: 'TechFlow BV', domain: 'techflow.nl', industry: 'SaaS' }],
      emails: ['daan.bos@techflow.nl'],
    },
  ],
  'Product': [
    {
      person: { id: 'p11', full_name: 'Fleur Hendriks', title: 'Chief Product Officer', department: 'Product' },
      companies: [{ id: 'c3', name: 'DataSphere NL', domain: 'datasphere.nl', industry: 'Data Analytics' }],
      emails: ['fleur.hendriks@datasphere.nl'],
    },
    {
      person: { id: 'p12', full_name: 'Bas Smit', title: 'Senior Product Manager', department: 'Product' },
      companies: [{ id: 'c2', name: 'CloudNine Systems', domain: 'cloudnine.nl', industry: 'Cloud Infrastructure' }],
      emails: ['bas.smit@cloudnine.nl'],
    },
  ],
  'Finance': [
    {
      person: { id: 'p13', full_name: 'Maaike de Jong', title: 'CFO', department: 'Finance' },
      companies: [{ id: 'c1', name: 'TechFlow BV', domain: 'techflow.nl', industry: 'SaaS' }],
      emails: ['maaike.dejong@techflow.nl'],
    },
    {
      person: { id: 'p14', full_name: 'Rob Willems', title: 'Finance Director', department: 'Finance' },
      companies: [{ id: 'c4', name: 'InnovateTech BV', domain: 'innovatetech.nl', industry: 'Technology' }],
      emails: ['rob.willems@innovatetech.nl'],
    },
  ],
  'Operations': [
    {
      person: { id: 'p15', full_name: 'Karin Vos', title: 'COO', department: 'Operations' },
      companies: [{ id: 'c5', name: 'ScaleUp Solutions', domain: 'scaleup.nl', industry: 'Consulting' }],
      emails: ['karin.vos@scaleup.nl'],
    },
  ],
  'Human Resources': [
    {
      person: { id: 'p16', full_name: 'Marloes van Leeuwen', title: 'HR Director', department: 'Human Resources' },
      companies: [{ id: 'c3', name: 'DataSphere NL', domain: 'datasphere.nl', industry: 'Data Analytics' }],
      emails: ['marloes.vanleeuwen@datasphere.nl'],
    },
  ],
  'Customer Success': [
    {
      person: { id: 'p17', full_name: 'Tim Dekker', title: 'VP Customer Success', department: 'Customer Success' },
      companies: [{ id: 'c2', name: 'CloudNine Systems', domain: 'cloudnine.nl', industry: 'Cloud Infrastructure' }],
      emails: ['tim.dekker@cloudnine.nl'],
    },
    {
      person: { id: 'p18', full_name: 'Julia Vermeer', title: 'Customer Success Manager', department: 'Customer Success' },
      companies: [{ id: 'c1', name: 'TechFlow BV', domain: 'techflow.nl', industry: 'SaaS' }],
      emails: ['julia.vermeer@techflow.nl'],
    },
  ],
};

export default function PeopleList() {
  const { isDarkMode } = useDarkMode();
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedCompanyDomain, setSelectedCompanyDomain] = useState<string | null>(null);
  const [departments, setDepartments] = useState<string[]>([]);
  const [people, setPeople] = useState<PersonRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const data = await api.getDepartmentAnalytics() as DepartmentAnalyticsItem[];
        const deptList = data.map((item: DepartmentAnalyticsItem) => item.department).filter((d: string | null): d is string => d !== null && d !== undefined);
        if (deptList.length > 0) {
          setDepartments(deptList);
        } else {
          // Use demo data if no departments returned
          setDepartments(DEMO_DEPARTMENTS);
        }
      } catch (err) {
        // Use demo data on error
        console.error('Failed to load departments, using demo data:', err);
        setDepartments(DEMO_DEPARTMENTS);
      }
    };
    loadDepartments();
  }, []);

  useEffect(() => {
    if (!selectedDepartment) {
      setPeople([]);
      return;
    }

    const loadPeople = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getPeopleByDepartment(selectedDepartment);
        if (data && data.length > 0) {
          setPeople(data);
        } else {
          // Use demo data if no people returned
          setPeople(DEMO_PEOPLE[selectedDepartment] || []);
        }
      } catch (err) {
        // Use demo data on error
        console.error('Failed to load people, using demo data:', err);
        setPeople(DEMO_PEOPLE[selectedDepartment] || []);
      } finally {
        setLoading(false);
      }
    };

    loadPeople();

    const handleDataUpdate = () => {
      if (selectedDepartment) {
        loadPeople();
      }
    };
    window.addEventListener('dataUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdate);
    };
  }, [selectedDepartment]);

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
        <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: isDarkMode ? '#f9fafb' : '#111827', marginBottom: '0.5rem' }}>
          People
        </h2>
        <p style={{ color: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: '0.875rem' }}>
          Browse people by department
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
        <h3 style={{
          fontSize: '1.125rem',
          fontWeight: '600',
          color: isDarkMode ? '#f9fafb' : '#111827',
          marginBottom: '1rem'
        }}>
          Filter by Department
        </h3>
        
        {departments.length === 0 ? (
          <p style={{ color: isDarkMode ? '#9ca3af' : '#6b7280', margin: 0 }}>Loading departments...</p>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '0.75rem'
          }}>
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDepartment(
                  selectedDepartment === dept ? '' : dept
                )}
                style={{
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: selectedDepartment === dept
                    ? '2px solid #3b82f6'
                    : isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                  backgroundColor: selectedDepartment === dept
                    ? isDarkMode ? '#1e3a5f' : '#eff6ff'
                    : isDarkMode ? '#374151' : 'white',
                  color: selectedDepartment === dept
                    ? isDarkMode ? '#60a5fa' : '#1e40af'
                    : isDarkMode ? '#f9fafb' : '#111827',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontWeight: selectedDepartment === dept ? '600' : '500'
                }}
              >
                <div style={{ fontSize: '0.875rem', fontWeight: 'inherit' }}>
                  {dept}
                </div>
              </button>
            ))}
          </div>
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

      {selectedDepartment && (
        <div>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: isDarkMode ? '#f9fafb' : '#111827',
            marginBottom: '1rem'
          }}>
            People in {selectedDepartment}
          </h3>

          {loading ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} style={{
                  backgroundColor: isDarkMode ? '#1f2937' : 'white',
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  padding: '1.5rem'
                }}>
                  <div style={{ height: '1.25rem', backgroundColor: isDarkMode ? '#374151' : '#e5e7eb', borderRadius: '0.25rem', marginBottom: '0.75rem' }}></div>
                  <div style={{ height: '1rem', backgroundColor: isDarkMode ? '#374151' : '#e5e7eb', borderRadius: '0.25rem', width: '60%', marginBottom: '0.5rem' }}></div>
                  <div style={{ height: '0.875rem', backgroundColor: isDarkMode ? '#374151' : '#e5e7eb', borderRadius: '0.25rem', width: '40%' }}></div>
                </div>
              ))}
            </div>
          ) : people.length > 0 ? (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1.5rem'
            }}>
              {people.map((record, index) => {
                const person = record.person;
                return (
                  <div
                    key={person.id || index}
                    style={{
                      backgroundColor: isDarkMode ? '#1f2937' : 'white',
                      borderRadius: '0.5rem',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                      padding: '1.5rem',
                      transition: 'all 0.2s'
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
                      color: isDarkMode ? '#f9fafb' : '#111827',
                      margin: '0 0 0.5rem 0'
                    }}>
                      {person.full_name}
                    </h4>

                    {person.title && (
                      <p style={{
                        fontSize: '0.875rem',
                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                        margin: '0 0 0.75rem 0',
                        fontWeight: '500'
                      }}>
                        💼 {person.title}
                      </p>
                    )}

                    {person.department && (
                      <p style={{
                        fontSize: '0.875rem',
                        color: isDarkMode ? '#9ca3af' : '#4b5563',
                        margin: '0 0 0.75rem 0'
                      }}>
                        🏢 {person.department}
                      </p>
                    )}

                    {record.companies && record.companies.length > 0 && (
                      <div style={{ marginBottom: '0.75rem' }}>
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          margin: '0 0 0.5rem 0',
                          fontWeight: '500'
                        }}>
                          Companies:
                        </p>
                        {record.companies.map((company, idx) => (
                          <div
                            key={company.id || idx}
                            onClick={() => company.domain && setSelectedCompanyDomain(company.domain)}
                            style={{
                              padding: '0.5rem',
                              backgroundColor: '#f9fafb',
                              borderRadius: '0.375rem',
                              marginBottom: '0.5rem',
                              cursor: company.domain ? 'pointer' : 'default',
                              border: '1px solid #e5e7eb',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => {
                              if (company.domain) {
                                e.currentTarget.style.backgroundColor = '#f3f4f6';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (company.domain) {
                                e.currentTarget.style.backgroundColor = '#f9fafb';
                              }
                            }}
                          >
                            <p style={{
                              fontSize: '0.875rem',
                              color: '#111827',
                              margin: '0 0 0.25rem 0',
                              fontWeight: '500'
                            }}>
                              🏛️ {company.name}
                            </p>
                            {company.domain && (
                              <p style={{
                                fontSize: '0.75rem',
                                color: '#6b7280',
                                margin: 0
                              }}>
                                {company.domain}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {record.emails && record.emails.length > 0 && (
                      <div>
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#6b7280',
                          margin: '0 0 0.5rem 0',
                          fontWeight: '500'
                        }}>
                          Email:
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {record.emails.map((email, idx) => (
                            <a
                              key={idx}
                              href={`mailto:${email}`}
                              style={{
                                padding: '0.25rem 0.5rem',
                                backgroundColor: '#eff6ff',
                                color: '#1e40af',
                                borderRadius: '0.25rem',
                                textDecoration: 'none',
                                fontSize: '0.75rem',
                                border: '1px solid #bfdbfe'
                              }}
                            >
                              ✉️ {email}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{
              backgroundColor: isDarkMode ? '#1f2937' : 'white',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              padding: '3rem',
              textAlign: 'center'
            }}>
              <p style={{ color: isDarkMode ? '#9ca3af' : '#6b7280', margin: 0 }}>
                No people found in this department.
              </p>
            </div>
          )}
        </div>
      )}

      {!selectedDepartment && (
        <div style={{
          backgroundColor: isDarkMode ? '#1f2937' : 'white',
          borderRadius: '0.5rem',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          padding: '3rem',
          textAlign: 'center'
        }}>
          <p style={{ color: isDarkMode ? '#9ca3af' : '#6b7280', margin: 0 }}>
            Select a department to view people.
          </p>
        </div>
      )}
    </div>
  );
}

