import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Person {
  id: string;
  full_name: string;
  title?: string;
  department?: string;
}

interface CompanyDetails {
  company: {
    id: string;
    name: string;
    domain: string;
    industry?: string;
    location?: string;
    employee_count?: number;
  } | null;
  people: Person[];
  emails: string[];
}

interface CompanyDetailsProps {
  domain: string;
  onClose: () => void;
}

// Demo company data
const DEMO_COMPANIES: Record<string, CompanyDetails> = {
  'techflow.nl': {
    company: {
      id: 'c1',
      name: 'TechFlow BV',
      domain: 'techflow.nl',
      industry: 'SaaS / B2B Software',
      location: 'Amsterdam, Netherlands',
      employee_count: 150,
    },
    people: [
      { id: 'p1', full_name: 'Jan de Vries', title: 'CTO', department: 'Engineering' },
      { id: 'p6', full_name: 'Emma de Groot', title: 'VP Sales', department: 'Sales' },
      { id: 'p10', full_name: 'Daan Bos', title: 'Head of Digital Marketing', department: 'Marketing' },
      { id: 'p13', full_name: 'Maaike de Jong', title: 'CFO', department: 'Finance' },
      { id: 'p18', full_name: 'Julia Vermeer', title: 'Customer Success Manager', department: 'Customer Success' },
    ],
    emails: ['info@techflow.nl', 'sales@techflow.nl', 'support@techflow.nl'],
  },
  'cloudnine.nl': {
    company: {
      id: 'c2',
      name: 'CloudNine Systems',
      domain: 'cloudnine.nl',
      industry: 'Cloud Infrastructure',
      location: 'Rotterdam, Netherlands',
      employee_count: 85,
    },
    people: [
      { id: 'p2', full_name: 'Sarah van den Berg', title: 'VP Engineering', department: 'Engineering' },
      { id: 'p5', full_name: 'Mark Peters', title: 'IT Director', department: 'Engineering' },
      { id: 'p12', full_name: 'Bas Smit', title: 'Senior Product Manager', department: 'Product' },
      { id: 'p17', full_name: 'Tim Dekker', title: 'VP Customer Success', department: 'Customer Success' },
    ],
    emails: ['info@cloudnine.nl', 'contact@cloudnine.nl'],
  },
  'datasphere.nl': {
    company: {
      id: 'c3',
      name: 'DataSphere NL',
      domain: 'datasphere.nl',
      industry: 'Data Analytics',
      location: 'Utrecht, Netherlands',
      employee_count: 120,
    },
    people: [
      { id: 'p3', full_name: 'Thomas Bakker', title: 'Senior Software Engineer', department: 'Engineering' },
      { id: 'p8', full_name: 'Anna Visser', title: 'Enterprise Account Executive', department: 'Sales' },
      { id: 'p11', full_name: 'Fleur Hendriks', title: 'Chief Product Officer', department: 'Product' },
      { id: 'p16', full_name: 'Marloes van Leeuwen', title: 'HR Director', department: 'Human Resources' },
    ],
    emails: ['hello@datasphere.nl', 'sales@datasphere.nl'],
  },
  'innovatetech.nl': {
    company: {
      id: 'c4',
      name: 'InnovateTech BV',
      domain: 'innovatetech.nl',
      industry: 'Technology',
      location: 'Eindhoven, Netherlands',
      employee_count: 200,
    },
    people: [
      { id: 'p4', full_name: 'Lisa Jansen', title: 'Engineering Manager', department: 'Engineering' },
      { id: 'p9', full_name: 'Sophie Mulder', title: 'CMO', department: 'Marketing' },
      { id: 'p14', full_name: 'Rob Willems', title: 'Finance Director', department: 'Finance' },
    ],
    emails: ['info@innovatetech.nl', 'careers@innovatetech.nl'],
  },
  'scaleup.nl': {
    company: {
      id: 'c5',
      name: 'ScaleUp Solutions',
      domain: 'scaleup.nl',
      industry: 'Consulting',
      location: 'The Hague, Netherlands',
      employee_count: 45,
    },
    people: [
      { id: 'p7', full_name: 'Pieter van Dijk', title: 'Sales Director', department: 'Sales' },
      { id: 'p15', full_name: 'Karin Vos', title: 'COO', department: 'Operations' },
    ],
    emails: ['contact@scaleup.nl'],
  },
};

export default function CompanyDetails({ domain, onClose }: CompanyDetailsProps) {
  const [details, setDetails] = useState<CompanyDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getCompanyByDomain(domain);
        // Use API data if available, otherwise fall back to demo data
        if (data && data.company) {
          setDetails(data);
        } else {
          const demoData = DEMO_COMPANIES[domain];
          if (demoData) {
            setDetails(demoData);
          } else {
            setDetails(null);
          }
        }
      } catch (err) {
        // Fall back to demo data on error
        const demoData = DEMO_COMPANIES[domain];
        if (demoData) {
          setDetails(demoData);
          setError(null);
        } else {
          setError(err instanceof Error ? err.message : 'Failed to load company details');
        }
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [domain]);

  if (loading) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '2rem'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ height: '1.5rem', backgroundColor: '#e5e7eb', borderRadius: '0.25rem', width: '60%' }}></div>
          <div style={{ height: '1rem', backgroundColor: '#e5e7eb', borderRadius: '0.25rem', width: '40%' }}></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '0.5rem',
        padding: '1.5rem',
        marginBottom: '1.5rem'
      }}>
        <p style={{ color: '#dc2626', margin: '0 0 1rem 0' }}>Error: {error}</p>
        <button
          onClick={onClose}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!details || !details.company) {
    return (
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <p style={{ color: '#6b7280', margin: '0 0 1rem 0' }}>Company not found</p>
        <button
          onClick={onClose}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem'
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  const company = details.company;

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
      padding: '2rem'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 0.5rem 0'
          }}>
            {company.name}
          </h3>
          <p style={{
            fontSize: '0.875rem',
            color: '#6b7280',
            margin: 0
          }}>
            {company.domain}
          </p>
        </div>
        <button
          onClick={onClose}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#f3f4f6',
            color: '#374151',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          ← Back
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '1px solid #e5e7eb'
      }}>
        {company.industry && (
          <div>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Industry</p>
            <p style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500', margin: 0 }}>
              {company.industry}
            </p>
          </div>
        )}
        {company.location && (
          <div>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Location</p>
            <p style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500', margin: 0 }}>
              📍 {company.location}
            </p>
          </div>
        )}
        {company.employee_count !== undefined && (
          <div>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0 0 0.25rem 0' }}>Employees</p>
            <p style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500', margin: 0 }}>
              👥 {company.employee_count}
            </p>
          </div>
        )}
      </div>

      {details.people && details.people.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 1rem 0'
          }}>
            People ({details.people.length})
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            {details.people.map((person, index) => (
              <div
                key={person.id || index}
                style={{
                  padding: '1rem',
                  backgroundColor: '#f9fafb',
                  borderRadius: '0.375rem',
                  border: '1px solid #e5e7eb'
                }}
              >
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#111827',
                  margin: '0 0 0.5rem 0'
                }}>
                  {person.full_name}
                </p>
                {person.title && (
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    margin: '0 0 0.25rem 0'
                  }}>
                    {person.title}
                  </p>
                )}
                {person.department && (
                  <p style={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    margin: 0
                  }}>
                    Department: {person.department}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {details.emails && details.emails.length > 0 && (
        <div>
          <h4 style={{
            fontSize: '1.125rem',
            fontWeight: '600',
            color: '#111827',
            margin: '0 0 1rem 0'
          }}>
            Email Addresses ({details.emails.length})
          </h4>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            {details.emails.map((email, index) => (
              <a
                key={index}
                href={`mailto:${email}`}
                style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#eff6ff',
                  color: '#1e40af',
                  borderRadius: '0.375rem',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  border: '1px solid #bfdbfe',
                  display: 'inline-block'
                }}
              >
                ✉️ {email}
              </a>
            ))}
          </div>
        </div>
      )}

      {(!details.people || details.people.length === 0) && (!details.emails || details.emails.length === 0) && (
        <p style={{ color: '#6b7280', margin: 0, fontStyle: 'italic' }}>
          No additional information available
        </p>
      )}
    </div>
  );
}

