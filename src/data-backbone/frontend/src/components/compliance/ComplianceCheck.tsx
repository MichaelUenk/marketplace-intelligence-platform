import React, { useState, useEffect } from 'react';
import {
  Search,
  Link,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  ExternalLink,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import { api } from '../../services/api';
import type { ComplianceResult as APIComplianceResult } from '../../services/api';

// Types
interface ComplianceResult {
  asin: string;
  title: string;
  seller: string;
  marketplace: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  ceMarkVisible: boolean;
  fulfilledBy: string;
  issues: string[];
  recommendation: string;
  url?: string;
  checkId?: string;
}

interface Learning {
  text: string;
  date: string;
}

// Demo data for testing
const demoResults: ComplianceResult[] = [
  {
    asin: 'B08XYZ1234',
    title: 'Premium Baby Ear Muffs - Hearing Protection for Infants',
    seller: 'BabySafe Products',
    marketplace: 'DE',
    riskScore: 85,
    riskLevel: 'high',
    ceMarkVisible: false,
    fulfilledBy: 'Amazon',
    issues: [
      'CE marking not visible in product images',
      'Incomplete safety information in product description',
      'No declaration of conformity available',
    ],
    recommendation: 'Contact seller for verification of CE certification and listing adjustment within 7 days.',
  },
  {
    asin: 'B09ABC5678',
    title: 'Kids Noise Cancelling Headphones - Concert & Event Protection',
    seller: 'AudioGuard EU',
    marketplace: 'DE',
    riskScore: 45,
    riskLevel: 'medium',
    ceMarkVisible: true,
    fulfilledBy: 'Amazon',
    issues: [
      'CE marking small and partially obscured',
      'Safety documentation not linked in listing',
    ],
    recommendation: 'Request seller to improve CE marking visibility and add documentation links.',
  },
  {
    asin: 'B07DEF9012',
    title: 'Professional Ear Protection - Industrial Grade Hearing Safety',
    seller: 'SafeSound GmbH',
    marketplace: 'DE',
    riskScore: 15,
    riskLevel: 'low',
    ceMarkVisible: true,
    fulfilledBy: 'Amazon',
    issues: [],
    recommendation: 'No action required. Product appears compliant.',
  },
];

const marketplaces = [
  { code: 'de', name: 'Amazon.de', country: 'Germany' },
  { code: 'nl', name: 'Amazon.nl', country: 'Netherlands' },
  { code: 'fr', name: 'Amazon.fr', country: 'France' },
  { code: 'it', name: 'Amazon.it', country: 'Italy' },
  { code: 'es', name: 'Amazon.es', country: 'Spain' },
  { code: 'uk', name: 'Amazon.co.uk', country: 'United Kingdom' },
];

const LEARNINGS_KEY = 'complianceLearnings';

export const ComplianceCheck: React.FC = () => {
  const [mode, setMode] = useState<'keyword' | 'url'>('keyword');
  const [keyword, setKeyword] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [marketplace, setMarketplace] = useState('de');
  const [maxPages, setMaxPages] = useState('3');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ComplianceResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [learnings, setLearnings] = useState<Learning[]>([]);

  // Load learnings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LEARNINGS_KEY);
    if (saved) {
      setLearnings(JSON.parse(saved));
    }
  }, []);

  // Auto-detect marketplace from URL
  useEffect(() => {
    if (mode === 'url' && productUrl) {
      const urlLower = productUrl.toLowerCase();
      if (urlLower.includes('amazon.de')) setMarketplace('de');
      else if (urlLower.includes('amazon.nl')) setMarketplace('nl');
      else if (urlLower.includes('amazon.fr')) setMarketplace('fr');
      else if (urlLower.includes('amazon.it')) setMarketplace('it');
      else if (urlLower.includes('amazon.es')) setMarketplace('es');
      else if (urlLower.includes('amazon.co.uk')) setMarketplace('uk');
    }
  }, [productUrl, mode]);

  // Helper to transform API results to local format
  const transformApiResults = (apiResults: APIComplianceResult[]): ComplianceResult[] => {
    return apiResults.map(r => ({
      asin: r.asin,
      title: r.title,
      seller: r.seller_information?.seller_name || 'Unknown',
      marketplace: r.marketplace.toUpperCase(),
      riskScore: r.violation_score,
      riskLevel: r.risk_level,
      ceMarkVisible: r.ce_mark_visible,
      fulfilledBy: r.fulfilled_by || 'Unknown',
      issues: r.violation_details?.map(v => v.explanation) || [],
      recommendation: r.summary || 'No specific recommendation',
      url: r.url,
      checkId: r.check_id,
    }));
  };

  const handleSearch = async () => {
    if (mode === 'keyword' && !keyword.trim()) return;
    if (mode === 'url' && !productUrl.trim()) return;

    setIsLoading(true);
    setHasSearched(true);
    setSearchTerm(mode === 'keyword' ? keyword : productUrl);

    try {
      // First, initiate the compliance check via n8n webhook
      await api.initiateComplianceCheck({
        mode,
        keyword: mode === 'keyword' ? keyword : undefined,
        url: mode === 'url' ? productUrl : undefined,
        marketplace,
        max_pages: parseInt(maxPages),
      });

      // Then fetch the results from the API
      // For now, we get the demo results from the API
      const apiResults = await api.getComplianceResults({ marketplace, limit: 50 });
      const transformedResults = transformApiResults(apiResults);
      setResults(transformedResults);
    } catch (error) {
      console.error('Error fetching compliance results:', error);
      // Fall back to demo results if API fails
      setResults(demoResults);
    } finally {
      setIsLoading(false);
      // Auto-scroll to results
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const addLearning = () => {
    const text = prompt('Enter a new learning or insight:');
    if (text && text.trim()) {
      const newLearning: Learning = {
        text: text.trim(),
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
      };
      const updated = [newLearning, ...learnings];
      setLearnings(updated);
      localStorage.setItem(LEARNINGS_KEY, JSON.stringify(updated));
    }
  };

  const deleteLearning = (index: number) => {
    if (confirm('Are you sure you want to delete this learning?')) {
      const updated = learnings.filter((_, i) => i !== index);
      setLearnings(updated);
      localStorage.setItem(LEARNINGS_KEY, JSON.stringify(updated));
    }
  };

  const getRiskBadgeClass = (level: string) => {
    switch (level) {
      case 'high': return 'risk-high';
      case 'medium': return 'risk-medium';
      case 'low': return 'risk-low';
      default: return '';
    }
  };

  return (
    <div className="alpine-compliance">
      {/* Hero Section */}
      <section className="hero">
        <h1>Marketplace Claims Compliance Agent</h1>
        <p>Automatically check Amazon product listings for compliance issues and CE marking verification</p>
      </section>

      {/* Input Section */}
      <section className="input-section">
        <h2 className="section-label">Check Mode</h2>

        {/* Mode Toggle */}
        <div className="input-mode-toggle">
          <button
            className={`toggle-option ${mode === 'keyword' ? 'active' : ''}`}
            onClick={() => setMode('keyword')}
          >
            <Search size={18} />
            Search by Keyword
          </button>
          <button
            className={`toggle-option ${mode === 'url' ? 'active' : ''}`}
            onClick={() => setMode('url')}
          >
            <Link size={18} />
            Check Specific URL
          </button>
        </div>

        {/* Keyword Mode Form */}
        {mode === 'keyword' && (
          <div className="form-content">
            <div className="form-group">
              <label htmlFor="keyword">Search Keyword</label>
              <input
                type="text"
                id="keyword"
                placeholder="e.g., baby ear muffs, hearing protection"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="marketplace">Marketplace</label>
                <select
                  id="marketplace"
                  value={marketplace}
                  onChange={(e) => setMarketplace(e.target.value)}
                >
                  {marketplaces.map((mp) => (
                    <option key={mp.code} value={mp.code}>
                      {mp.name} ({mp.country})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="pages">Pages to Scan</label>
                <select
                  id="pages"
                  value={maxPages}
                  onChange={(e) => setMaxPages(e.target.value)}
                >
                  <option value="1">1 page</option>
                  <option value="2">2 pages</option>
                  <option value="3">3 pages</option>
                  <option value="5">5 pages</option>
                  <option value="10">10 pages</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* URL Mode Form */}
        {mode === 'url' && (
          <div className="form-content">
            <div className="form-group">
              <label htmlFor="productUrl">Product URL</label>
              <input
                type="url"
                id="productUrl"
                placeholder="https://www.amazon.de/dp/B08XYZ1234"
                value={productUrl}
                onChange={(e) => setProductUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="form-group">
              <label htmlFor="urlMarketplace">Marketplace (auto-detected)</label>
              <select
                id="urlMarketplace"
                value={marketplace}
                onChange={(e) => setMarketplace(e.target.value)}
              >
                {marketplaces.map((mp) => (
                  <option key={mp.code} value={mp.code}>
                    {mp.name} ({mp.country})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          className={`btn ${isLoading ? 'loading' : ''}`}
          onClick={handleSearch}
          disabled={isLoading || (mode === 'keyword' ? !keyword.trim() : !productUrl.trim())}
        >
          {isLoading ? (
            <span className="spinner"></span>
          ) : (
            <span className="btn-text">Start Compliance Check</span>
          )}
        </button>
      </section>

      {/* Results Section */}
      {hasSearched && (
        <section id="results-section" className="results-section">
          <h2>Results for "{searchTerm}"</h2>

          {isLoading ? (
            <div className="loading-state">
              <Loader2 size={48} className="spinner-large" />
              <p>Analyzing products...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="empty-state">
              <Shield size={64} />
              <h3>No products found</h3>
              <p>Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="results-list">
              {results.map((result) => (
                <div key={result.asin} className="result-card">
                  {/* Risk indicator bar */}
                  <div className={`risk-bar ${getRiskBadgeClass(result.riskLevel)}`}></div>

                  <div className="result-content">
                    {/* Header */}
                    <div className="result-header">
                      <div className="result-title-group">
                        <h3>{result.title}</h3>
                        <span className="asin">ASIN: {result.asin}</span>
                      </div>
                      <div className={`risk-badge ${getRiskBadgeClass(result.riskLevel)}`}>
                        <span className="risk-score">Risk: {result.riskScore}</span>
                        <span className="risk-level">{result.riskLevel.toUpperCase()}</span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="result-details">
                      <div className="detail-row">
                        <span className="detail-label">Seller</span>
                        <span className="detail-value">{result.seller}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Marketplace</span>
                        <span className="detail-value">Amazon.{result.marketplace}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Fulfilled by</span>
                        <span className="detail-value">{result.fulfilledBy}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">CE Marking</span>
                        <span className={`detail-value ce-status ${result.ceMarkVisible ? 'visible' : 'not-visible'}`}>
                          {result.ceMarkVisible ? (
                            <><CheckCircle size={16} /> Visible</>
                          ) : (
                            <><XCircle size={16} /> Not visible</>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Issues */}
                    {result.issues.length > 0 && (
                      <div className="issues-section">
                        <h4>Identified Issues:</h4>
                        <ul>
                          {result.issues.map((issue, idx) => (
                            <li key={idx}>
                              <AlertTriangle size={14} />
                              {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommendation */}
                    <div className="recommendation-box">
                      <div className="recommendation-indicator"></div>
                      <div className="recommendation-content">
                        <h4>Recommended Action</h4>
                        <p>{result.recommendation}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="result-actions">
                      <a
                        href={`https://www.amazon.${result.marketplace.toLowerCase()}/dp/${result.asin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary"
                      >
                        <ExternalLink size={16} />
                        View on Amazon
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Learnings Section */}
      <section className="learnings-section">
        <div className="learnings-header">
          <h2>Learnings & Insights</h2>
          <button className="btn-add-learning" onClick={addLearning}>
            <Plus size={18} />
            Add Learning
          </button>
        </div>

        {learnings.length === 0 ? (
          <div className="empty-state">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <p>No learnings yet. Start capturing insights from your compliance checks!</p>
          </div>
        ) : (
          <div className="learnings-list">
            {learnings.map((learning, index) => (
              <div key={index} className="learning-item">
                <div className="learning-content">
                  <span className="learning-date">{learning.date}</span>
                  <p>{learning.text}</p>
                </div>
                <button
                  className="btn-delete"
                  onClick={() => deleteLearning(index)}
                  aria-label="Delete learning"
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <style>{`
        /* Alpine Brand Design System */
        .alpine-compliance {
          --alpine-red: #EF3340;
          --alpine-red-hover: #D62D38;
          --alpine-red-light: rgba(239, 51, 64, 0.1);
          --alpine-dark: #1A1A1A;
          --alpine-gray: #4A4A4A;
          --alpine-light-gray: #F5F5F5;
          --alpine-white: #FFFFFF;
          --alpine-border: rgba(0, 0, 0, 0.08);
          --alpine-accent: #FF6B6B;
          --alpine-warning: #FFA500;
          --alpine-success: #00C851;
          --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.04);
          --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.06);
          --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.10);
          --shadow-red: 0 8px 24px rgba(239, 51, 64, 0.3);

          font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
          color: var(--alpine-dark);
        }

        /* Hero Section */
        .hero {
          text-align: center;
          padding: 3rem 0;
          animation: fadeIn 0.6s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .hero h1 {
          font-size: 2.5rem;
          font-weight: 700;
          color: var(--alpine-dark);
          margin: 0 0 1rem 0;
          line-height: 1.25;
        }

        .hero p {
          font-size: 1.125rem;
          color: var(--alpine-gray);
          margin: 0;
          line-height: 1.6;
        }

        /* Input Section */
        .input-section {
          background: var(--alpine-light-gray);
          border-radius: 20px;
          padding: 2.5rem;
          margin-bottom: 2rem;
        }

        .section-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--alpine-gray);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 1rem 0;
        }

        /* Mode Toggle */
        .input-mode-toggle {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .toggle-option {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 1rem;
          border: 2px solid transparent;
          border-radius: 12px;
          background: var(--alpine-white);
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          color: var(--alpine-gray);
          transition: all 0.3s ease;
        }

        .toggle-option:hover {
          border-color: var(--alpine-border);
        }

        .toggle-option.active {
          border-color: var(--alpine-red);
          background: rgba(239, 51, 64, 0.05);
          color: var(--alpine-red);
        }

        /* Form Controls */
        .form-content {
          margin-bottom: 1.5rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--alpine-gray);
          margin-bottom: 0.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        input[type="text"],
        input[type="url"],
        select {
          width: 100%;
          padding: 1rem 1.25rem;
          border: 2px solid transparent;
          border-radius: 12px;
          font-size: 1rem;
          font-family: inherit;
          background: var(--alpine-white);
          color: var(--alpine-dark);
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        input:focus,
        select:focus {
          outline: none;
          border-color: var(--alpine-red);
          box-shadow: 0 0 0 4px rgba(239, 51, 64, 0.1);
        }

        input::placeholder {
          color: #999;
        }

        /* Primary Button */
        .btn {
          width: 100%;
          background: var(--alpine-red);
          color: var(--alpine-white);
          border: none;
          padding: 1.25rem 3rem;
          font-size: 1.125rem;
          font-weight: 600;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60px;
        }

        .btn:hover:not(:disabled) {
          background: var(--alpine-red-hover);
          transform: translateY(-2px);
          box-shadow: var(--shadow-red);
        }

        .btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn.loading .btn-text {
          display: none;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: var(--alpine-white);
          animation: spin 0.8s linear infinite;
        }

        .spinner-large {
          animation: spin 1s linear infinite;
          color: var(--alpine-red);
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Results Section */
        .results-section {
          margin-bottom: 2rem;
        }

        .results-section h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--alpine-dark);
          margin: 0 0 1.5rem 0;
        }

        .loading-state,
        .empty-state {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--alpine-gray);
        }

        .empty-state svg {
          opacity: 0.3;
          margin-bottom: 1rem;
        }

        .empty-state h3 {
          margin: 0 0 0.5rem 0;
          color: var(--alpine-dark);
        }

        .empty-state p {
          margin: 0;
        }

        /* Result Card */
        .result-card {
          background: var(--alpine-white);
          border-radius: 20px;
          margin-bottom: 2rem;
          box-shadow: var(--shadow-md);
          overflow: hidden;
          transition: all 0.3s ease;
          display: flex;
        }

        .result-card:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-2px);
        }

        .risk-bar {
          width: 5px;
          flex-shrink: 0;
        }

        .risk-bar.risk-high { background: var(--alpine-accent); }
        .risk-bar.risk-medium { background: var(--alpine-warning); }
        .risk-bar.risk-low { background: var(--alpine-success); }

        .result-content {
          flex: 1;
          padding: 2rem;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .result-title-group h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--alpine-dark);
          margin: 0 0 0.25rem 0;
        }

        .asin {
          font-size: 0.875rem;
          color: var(--alpine-gray);
        }

        .risk-badge {
          padding: 0.75rem 1.25rem;
          border-radius: 12px;
          text-align: center;
          min-width: 100px;
        }

        .risk-badge.risk-high {
          background: rgba(255, 107, 107, 0.15);
          color: var(--alpine-accent);
        }

        .risk-badge.risk-medium {
          background: rgba(255, 165, 0, 0.15);
          color: var(--alpine-warning);
        }

        .risk-badge.risk-low {
          background: rgba(0, 200, 81, 0.15);
          color: var(--alpine-success);
        }

        .risk-score {
          display: block;
          font-size: 1rem;
          font-weight: 700;
        }

        .risk-level {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Details */
        .result-details {
          border-top: 1px solid var(--alpine-border);
          border-bottom: 1px solid var(--alpine-border);
          padding: 1rem 0;
          margin-bottom: 1.5rem;
        }

        .detail-row {
          display: flex;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--alpine-border);
        }

        .detail-row:last-child {
          border-bottom: none;
        }

        .detail-label {
          min-width: 120px;
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--alpine-gray);
        }

        .detail-value {
          font-size: 0.875rem;
          color: var(--alpine-dark);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .ce-status.visible {
          color: var(--alpine-success);
        }

        .ce-status.not-visible {
          color: var(--alpine-accent);
        }

        /* Issues */
        .issues-section {
          margin-bottom: 1.5rem;
        }

        .issues-section h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--alpine-gray);
          margin: 0 0 0.75rem 0;
        }

        .issues-section ul {
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .issues-section li {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: var(--alpine-dark);
          margin-bottom: 0.5rem;
        }

        .issues-section li svg {
          flex-shrink: 0;
          color: var(--alpine-warning);
          margin-top: 2px;
        }

        /* Recommendation */
        .recommendation-box {
          display: flex;
          background: var(--alpine-light-gray);
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 1.5rem;
        }

        .recommendation-indicator {
          width: 4px;
          background: var(--alpine-red);
        }

        .recommendation-content {
          padding: 1.25rem;
        }

        .recommendation-content h4 {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--alpine-gray);
          margin: 0 0 0.5rem 0;
        }

        .recommendation-content p {
          font-size: 0.9375rem;
          color: var(--alpine-dark);
          margin: 0;
          line-height: 1.6;
        }

        /* Result Actions */
        .result-actions {
          display: flex;
          gap: 1rem;
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: var(--alpine-white);
          border: 2px solid var(--alpine-border);
          border-radius: 8px;
          color: var(--alpine-dark);
          font-size: 0.875rem;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          border-color: var(--alpine-red);
          color: var(--alpine-red);
        }

        /* Learnings Section */
        .learnings-section {
          background: var(--alpine-light-gray);
          border-radius: 20px;
          padding: 2.5rem;
        }

        .learnings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .learnings-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--alpine-dark);
          margin: 0;
        }

        .btn-add-learning {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: var(--alpine-red);
          border: none;
          border-radius: 8px;
          color: var(--alpine-white);
          font-size: 0.875rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-add-learning:hover {
          background: var(--alpine-red-hover);
        }

        .learnings-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .learning-item {
          background: var(--alpine-white);
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
        }

        .learning-item:hover {
          box-shadow: var(--shadow-sm);
        }

        .learning-content {
          flex: 1;
        }

        .learning-date {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--alpine-gray);
          margin-bottom: 0.5rem;
        }

        .learning-content p {
          font-size: 0.9375rem;
          color: var(--alpine-dark);
          margin: 0;
          line-height: 1.6;
        }

        .btn-delete {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: transparent;
          color: var(--alpine-accent);
          border: 2px solid var(--alpine-accent);
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
          margin-left: 1rem;
        }

        .btn-delete:hover {
          background: var(--alpine-accent);
          color: var(--alpine-white);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          .alpine-compliance {
            padding: 1rem;
          }

          .hero h1 {
            font-size: 2rem;
          }

          .hero p {
            font-size: 1rem;
          }

          .input-section,
          .learnings-section {
            padding: 1.5rem;
          }

          .input-mode-toggle {
            flex-direction: column;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .result-card {
            flex-direction: column;
          }

          .risk-bar {
            width: 100%;
            height: 5px;
          }

          .result-header {
            flex-direction: column;
            gap: 1rem;
          }

          .risk-badge {
            align-self: flex-start;
          }

          .detail-row {
            flex-direction: column;
          }

          .detail-label {
            min-width: auto;
            margin-bottom: 0.25rem;
          }

          .learning-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }

          .btn-delete {
            margin-left: 0;
          }

          .learnings-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ComplianceCheck;
