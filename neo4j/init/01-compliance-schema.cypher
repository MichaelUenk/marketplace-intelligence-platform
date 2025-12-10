// ============================================================
// Marketplace Intelligence Platform - Neo4j Schema
// Compliance Agent Database Structure
// ============================================================

// ============================================================
// 1. CONSTRAINTS - Ensure data integrity
// ============================================================

// Product constraints
CREATE CONSTRAINT product_asin IF NOT EXISTS FOR (p:Product) REQUIRE p.asin IS UNIQUE;
CREATE CONSTRAINT product_url IF NOT EXISTS FOR (p:Product) REQUIRE p.url IS UNIQUE;

// Seller constraints
CREATE CONSTRAINT seller_id IF NOT EXISTS FOR (s:Seller) REQUIRE s.sellerId IS UNIQUE;

// Compliance check constraints
CREATE CONSTRAINT compliance_check_id IF NOT EXISTS FOR (c:ComplianceCheck) REQUIRE c.checkId IS UNIQUE;

// Violation constraints
CREATE CONSTRAINT violation_id IF NOT EXISTS FOR (v:Violation) REQUIRE v.violationId IS UNIQUE;

// Marketplace constraints
CREATE CONSTRAINT marketplace_code IF NOT EXISTS FOR (m:Marketplace) REQUIRE m.code IS UNIQUE;

// Search keyword constraints
CREATE CONSTRAINT keyword_id IF NOT EXISTS FOR (k:Keyword) REQUIRE k.keywordId IS UNIQUE;

// Complaint pack constraints
CREATE CONSTRAINT complaint_id IF NOT EXISTS FOR (cp:ComplaintPack) REQUIRE cp.complaintId IS UNIQUE;

// Learning constraints
CREATE CONSTRAINT learning_id IF NOT EXISTS FOR (l:Learning) REQUIRE l.learningId IS UNIQUE;

// ============================================================
// 2. INDEXES - Optimize query performance
// ============================================================

// Product indexes
CREATE INDEX product_title IF NOT EXISTS FOR (p:Product) ON (p.title);
CREATE INDEX product_created IF NOT EXISTS FOR (p:Product) ON (p.createdAt);
CREATE INDEX product_risk IF NOT EXISTS FOR (p:Product) ON (p.currentRiskScore);

// Seller indexes
CREATE INDEX seller_name IF NOT EXISTS FOR (s:Seller) ON (s.name);
CREATE INDEX seller_website IF NOT EXISTS FOR (s:Seller) ON (s.website);

// Compliance check indexes
CREATE INDEX check_date IF NOT EXISTS FOR (c:ComplianceCheck) ON (c.checkedAt);
CREATE INDEX check_score IF NOT EXISTS FOR (c:ComplianceCheck) ON (c.violationScore);
CREATE INDEX check_action IF NOT EXISTS FOR (c:ComplianceCheck) ON (c.recommendedAction);

// Violation indexes
CREATE INDEX violation_type IF NOT EXISTS FOR (v:Violation) ON (v.type);
CREATE INDEX violation_severity IF NOT EXISTS FOR (v:Violation) ON (v.severity);

// Keyword indexes
CREATE INDEX keyword_text IF NOT EXISTS FOR (k:Keyword) ON (k.text);

// ============================================================
// 3. INITIAL MARKETPLACE DATA
// ============================================================

// Create marketplace nodes
MERGE (de:Marketplace {code: 'de'})
SET de.name = 'Amazon.de', de.country = 'Germany', de.currency = 'EUR', de.amazonDomain = 'amazon.de';

MERGE (nl:Marketplace {code: 'nl'})
SET nl.name = 'Amazon.nl', nl.country = 'Netherlands', nl.currency = 'EUR', nl.amazonDomain = 'amazon.nl';

MERGE (fr:Marketplace {code: 'fr'})
SET fr.name = 'Amazon.fr', fr.country = 'France', fr.currency = 'EUR', fr.amazonDomain = 'amazon.fr';

MERGE (it:Marketplace {code: 'it'})
SET it.name = 'Amazon.it', it.country = 'Italy', it.currency = 'EUR', it.amazonDomain = 'amazon.it';

MERGE (es:Marketplace {code: 'es'})
SET es.name = 'Amazon.es', es.country = 'Spain', es.currency = 'EUR', es.amazonDomain = 'amazon.es';

MERGE (uk:Marketplace {code: 'uk'})
SET uk.name = 'Amazon.co.uk', uk.country = 'United Kingdom', uk.currency = 'GBP', uk.amazonDomain = 'amazon.co.uk';

// ============================================================
// 4. VIOLATION TYPE REFERENCE DATA
// ============================================================

MERGE (vt1:ViolationType {code: 'age_claim_without_ce'})
SET vt1.name = 'Age Claim Without CE',
    vt1.description = 'Product marketed for children without visible CE certification',
    vt1.baseSeverity = 'CRITICAL',
    vt1.baseScore = 35;

MERGE (vt2:ViolationType {code: 'undocumented_certification'})
SET vt2.name = 'Undocumented Certification',
    vt2.description = 'Claims of certification without supporting documentation',
    vt2.baseSeverity = 'HIGH',
    vt2.baseScore = 20;

MERGE (vt3:ViolationType {code: 'misleading_safety'})
SET vt3.name = 'Misleading Safety Claims',
    vt3.description = 'Unsubstantiated or exaggerated safety claims',
    vt3.baseSeverity = 'CRITICAL',
    vt3.baseScore = 35;

MERGE (vt4:ViolationType {code: 'other'})
SET vt4.name = 'Other Violation',
    vt4.description = 'Other compliance violations',
    vt4.baseSeverity = 'MEDIUM',
    vt4.baseScore = 10;

// ============================================================
// 5. ACTION THRESHOLD REFERENCE DATA
// ============================================================

MERGE (a1:ActionThreshold {action: 'CLEAR'})
SET a1.minScore = 0, a1.maxScore = 0, a1.description = 'No violations detected';

MERGE (a2:ActionThreshold {action: 'MONITOR'})
SET a2.minScore = 1, a2.maxScore = 30, a2.description = 'Minor violations requiring monitoring';

MERGE (a3:ActionThreshold {action: 'REVIEW'})
SET a3.minScore = 31, a3.maxScore = 60, a3.description = 'Moderate violations requiring review';

MERGE (a4:ActionThreshold {action: 'COMPLAINT_PACK'})
SET a4.minScore = 61, a4.maxScore = 85, a4.description = 'Serious violations requiring complaint pack';

MERGE (a5:ActionThreshold {action: 'URGENT_REPORT'})
SET a5.minScore = 86, a5.maxScore = 100, a5.description = 'Critical safety concern requiring urgent report';

// ============================================================
// 6. SAMPLE DATA FOR TESTING (Optional - remove in production)
// ============================================================

// Sample keyword
MERGE (k1:Keyword {keywordId: 'kw-baby-ear-muffs-de'})
SET k1.text = 'baby ear muffs',
    k1.marketplace = 'de',
    k1.createdAt = datetime(),
    k1.lastSearched = datetime(),
    k1.searchCount = 1;

// Link keyword to marketplace
MATCH (k:Keyword {keywordId: 'kw-baby-ear-muffs-de'})
MATCH (m:Marketplace {code: 'de'})
MERGE (k)-[:SEARCHED_IN]->(m);
