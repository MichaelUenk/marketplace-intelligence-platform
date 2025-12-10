// ============================================================================
// NEO4J INITIALIZATION SCRIPT
// Data Backbone - Knowledge Graph Schema
// ============================================================================

// ============================================================================
// CONSTRAINTS - Ensure Data Integrity
// ============================================================================

// Core Entity Constraints
CREATE CONSTRAINT company_id IF NOT EXISTS FOR (c:Company) REQUIRE c.id IS UNIQUE;
CREATE CONSTRAINT person_id IF NOT EXISTS FOR (p:Person) REQUIRE p.id IS UNIQUE;
CREATE CONSTRAINT email_addr IF NOT EXISTS FOR (e:Email) REQUIRE e.address IS UNIQUE;
CREATE CONSTRAINT location_id IF NOT EXISTS FOR (l:Location) REQUIRE l.id IS UNIQUE;
CREATE CONSTRAINT deal_id IF NOT EXISTS FOR (d:Deal) REQUIRE d.id IS UNIQUE;
CREATE CONSTRAINT user_id IF NOT EXISTS FOR (u:User) REQUIRE u.id IS UNIQUE;

// Reference Data Constraints
CREATE CONSTRAINT industry_name IF NOT EXISTS FOR (i:Industry) REQUIRE i.name IS UNIQUE;
CREATE CONSTRAINT persona_type IF NOT EXISTS FOR (p:Persona) REQUIRE p.type IS UNIQUE;
CREATE CONSTRAINT channel_type IF NOT EXISTS FOR (ch:Channel) REQUIRE ch.type IS UNIQUE;

// Outreach & Sequences
CREATE CONSTRAINT sequence_id IF NOT EXISTS FOR (seq:Sequence) REQUIRE seq.id IS UNIQUE;
CREATE CONSTRAINT campaign_id IF NOT EXISTS FOR (camp:Campaign) REQUIRE camp.id IS UNIQUE;

// Signals & Attribution
CREATE CONSTRAINT signal_id IF NOT EXISTS FOR (s:Signal) REQUIRE s.id IS UNIQUE;
CREATE CONSTRAINT touchpoint_id IF NOT EXISTS FOR (t:Touchpoint) REQUIRE t.id IS UNIQUE;

// ============================================================================
// INDEXES - Optimize Query Performance
// ============================================================================

// Company Indexes
CREATE INDEX company_domain IF NOT EXISTS FOR (c:Company) ON (c.domain);
CREATE INDEX company_industry IF NOT EXISTS FOR (c:Company) ON (c.industry);
CREATE INDEX company_location IF NOT EXISTS FOR (c:Company) ON (c.location);
CREATE INDEX company_intent_score IF NOT EXISTS FOR (c:Company) ON (c.intent_score);
CREATE INDEX company_icp_tier IF NOT EXISTS FOR (c:Company) ON (c.icp_tier);
CREATE INDEX company_is_prospect IF NOT EXISTS FOR (c:Company) ON (c.is_prospect);

// Person Indexes
CREATE INDEX person_full_name IF NOT EXISTS FOR (p:Person) ON (p.full_name);
CREATE INDEX person_department IF NOT EXISTS FOR (p:Person) ON (p.department);
CREATE INDEX person_buyer_persona IF NOT EXISTS FOR (p:Person) ON (p.buyer_persona_type);
CREATE INDEX person_seniority IF NOT EXISTS FOR (p:Person) ON (p.seniority);

// Deal Indexes
CREATE INDEX deal_stage IF NOT EXISTS FOR (d:Deal) ON (d.stage);
CREATE INDEX deal_expected_close IF NOT EXISTS FOR (d:Deal) ON (d.expected_close_date);
CREATE INDEX deal_amount IF NOT EXISTS FOR (d:Deal) ON (d.amount);

// Signal Indexes
CREATE INDEX signal_detected_at IF NOT EXISTS FOR (s:Signal) ON (s.detected_at);
CREATE INDEX signal_category IF NOT EXISTS FOR (s:Signal) ON (s.category);
CREATE INDEX signal_status IF NOT EXISTS FOR (s:Signal) ON (s.status);

// Sequence Indexes
CREATE INDEX sequence_status IF NOT EXISTS FOR (seq:Sequence) ON (seq.status);
CREATE INDEX sequence_created_at IF NOT EXISTS FOR (seq:Sequence) ON (seq.created_at);

// Touchpoint Indexes
CREATE INDEX touchpoint_occurred_at IF NOT EXISTS FOR (t:Touchpoint) ON (t.occurred_at);
CREATE INDEX touchpoint_type IF NOT EXISTS FOR (t:Touchpoint) ON (t.type);

// ============================================================================
// REFERENCE DATA - Buyer Personas
// ============================================================================

MERGE (p:Persona {type: 'Champion'})
SET p.description = 'Internal advocate who actively sells on your behalf',
    p.influence_weight = 10;

MERGE (p:Persona {type: 'Economic Buyer'})
SET p.description = 'Has final budget authority and signs contracts',
    p.influence_weight = 10;

MERGE (p:Persona {type: 'Technical Evaluator'})
SET p.description = 'Evaluates technical fit and implementation requirements',
    p.influence_weight = 7;

MERGE (p:Persona {type: 'User Buyer'})
SET p.description = 'End user who will use the product daily',
    p.influence_weight = 5;

MERGE (p:Persona {type: 'Blocker'})
SET p.description = 'Has concerns or objections that could stall the deal',
    p.influence_weight = 8;

MERGE (p:Persona {type: 'Influencer'})
SET p.description = 'Has influence over decision makers but no direct authority',
    p.influence_weight = 6;

MERGE (p:Persona {type: 'Coach'})
SET p.description = 'Provides inside information and guidance on navigating the org',
    p.influence_weight = 7;

MERGE (p:Persona {type: 'Legal'})
SET p.description = 'Reviews contracts and compliance requirements',
    p.influence_weight = 6;

MERGE (p:Persona {type: 'Procurement'})
SET p.description = 'Handles vendor management and contract negotiation',
    p.influence_weight = 6;

MERGE (p:Persona {type: 'Executive Sponsor'})
SET p.description = 'C-level champion who provides strategic alignment',
    p.influence_weight = 9;

// ============================================================================
// REFERENCE DATA - Outreach Channels
// ============================================================================

MERGE (ch:Channel {type: 'email'})
SET ch.name = 'Email',
    ch.category = 'direct',
    ch.automation_level = 'full',
    ch.daily_limit = 200;

MERGE (ch:Channel {type: 'li_invite'})
SET ch.name = 'LinkedIn Connection Request',
    ch.category = 'social',
    ch.automation_level = 'semi',
    ch.daily_limit = 100;

MERGE (ch:Channel {type: 'li_chat'})
SET ch.name = 'LinkedIn Chat',
    ch.category = 'social',
    ch.automation_level = 'semi',
    ch.daily_limit = 150;

MERGE (ch:Channel {type: 'li_inmail'})
SET ch.name = 'LinkedIn InMail',
    ch.category = 'social',
    ch.automation_level = 'semi',
    ch.daily_limit = 50;

MERGE (ch:Channel {type: 'whatsapp'})
SET ch.name = 'WhatsApp',
    ch.category = 'direct',
    ch.automation_level = 'semi',
    ch.daily_limit = 100;

MERGE (ch:Channel {type: 'phone_task'})
SET ch.name = 'Phone Call (Manual)',
    ch.category = 'voice',
    ch.automation_level = 'manual',
    ch.daily_limit = NULL;

MERGE (ch:Channel {type: 'phone_auto'})
SET ch.name = 'Phone Call (Auto-dialer)',
    ch.category = 'voice',
    ch.automation_level = 'full',
    ch.daily_limit = 200;

MERGE (ch:Channel {type: 'sms'})
SET ch.name = 'SMS',
    ch.category = 'direct',
    ch.automation_level = 'full',
    ch.daily_limit = 200;

MERGE (ch:Channel {type: 'instagram_dm'})
SET ch.name = 'Instagram DM',
    ch.category = 'social',
    ch.automation_level = 'manual',
    ch.daily_limit = 50;

MERGE (ch:Channel {type: 'fb_messenger'})
SET ch.name = 'Facebook Messenger',
    ch.category = 'social',
    ch.automation_level = 'semi',
    ch.daily_limit = 50;

MERGE (ch:Channel {type: 'google_ads'})
SET ch.name = 'Google Ads',
    ch.category = 'advertising',
    ch.automation_level = 'full',
    ch.daily_limit = NULL;

MERGE (ch:Channel {type: 'fb_ads'})
SET ch.name = 'Facebook/Meta Ads',
    ch.category = 'advertising',
    ch.automation_level = 'full',
    ch.daily_limit = NULL;

MERGE (ch:Channel {type: 'li_ads'})
SET ch.name = 'LinkedIn Ads',
    ch.category = 'advertising',
    ch.automation_level = 'full',
    ch.daily_limit = NULL;

// ============================================================================
// REFERENCE DATA - Industries
// ============================================================================

MERGE (i:Industry {name: 'Technology'})
SET i.sub_industries = ['Software', 'Hardware', 'Cloud Services', 'AI/ML', 'Cybersecurity'];

MERGE (i:Industry {name: 'Healthcare'})
SET i.sub_industries = ['Hospitals', 'Pharmaceuticals', 'Medical Devices', 'Biotech', 'Health Insurance'];

MERGE (i:Industry {name: 'Financial Services'})
SET i.sub_industries = ['Banking', 'Insurance', 'Investment', 'Fintech', 'Asset Management'];

MERGE (i:Industry {name: 'Manufacturing'})
SET i.sub_industries = ['Automotive', 'Aerospace', 'Electronics', 'Consumer Goods', 'Industrial Equipment'];

MERGE (i:Industry {name: 'Retail'})
SET i.sub_industries = ['E-commerce', 'Grocery', 'Fashion', 'Consumer Electronics', 'Home Improvement'];

MERGE (i:Industry {name: 'Real Estate'})
SET i.sub_industries = ['Commercial', 'Residential', 'Property Management', 'Construction', 'REITs'];

MERGE (i:Industry {name: 'Consulting'})
SET i.sub_industries = ['Management Consulting', 'IT Consulting', 'Strategy', 'HR Consulting', 'Legal Services'];

MERGE (i:Industry {name: 'Hospitality'})
SET i.sub_industries = ['Hotels', 'Restaurants', 'Travel', 'Entertainment', 'Events'];

MERGE (i:Industry {name: 'Education'})
SET i.sub_industries = ['Higher Education', 'K-12', 'EdTech', 'Corporate Training', 'Online Learning'];

MERGE (i:Industry {name: 'Energy'})
SET i.sub_industries = ['Oil & Gas', 'Renewable Energy', 'Utilities', 'Mining', 'Clean Tech'];

// ============================================================================
// REFERENCE DATA - Deal Stages
// ============================================================================

// Create stage reference nodes for pipeline analytics
MERGE (s:Stage {code: 'identified'})
SET s.name = 'Identified', s.order = 1, s.side = 'left';

MERGE (s:Stage {code: 'qualified'})
SET s.name = 'Qualified', s.order = 2, s.side = 'left';

MERGE (s:Stage {code: 'engaged'})
SET s.name = 'Engaged', s.order = 3, s.side = 'left';

MERGE (s:Stage {code: 'pipeline'})
SET s.name = 'Pipeline', s.order = 4, s.side = 'left';

MERGE (s:Stage {code: 'proposal'})
SET s.name = 'Proposal', s.order = 5, s.side = 'left';

MERGE (s:Stage {code: 'negotiation'})
SET s.name = 'Negotiation', s.order = 6, s.side = 'left';

MERGE (s:Stage {code: 'committed'})
SET s.name = 'Committed', s.order = 7, s.side = 'center';

MERGE (s:Stage {code: 'closed_won'})
SET s.name = 'Closed Won', s.order = 8, s.side = 'right';

MERGE (s:Stage {code: 'closed_lost'})
SET s.name = 'Closed Lost', s.order = 9, s.side = 'none';

MERGE (s:Stage {code: 'on_hold'})
SET s.name = 'On Hold', s.order = 10, s.side = 'none';

// ============================================================================
// REFERENCE DATA - Signal Categories
// ============================================================================

MERGE (sc:SignalCategory {name: 'sustainability'})
SET sc.display_name = 'Sustainability',
    sc.icon = 'leaf',
    sc.color = '#10B981';

MERGE (sc:SignalCategory {name: 'workplace_experience'})
SET sc.display_name = 'Workplace Experience',
    sc.icon = 'building',
    sc.color = '#6366F1';

MERGE (sc:SignalCategory {name: 'employee_wellbeing'})
SET sc.display_name = 'Employee Wellbeing',
    sc.icon = 'heart',
    sc.color = '#EC4899';

MERGE (sc:SignalCategory {name: 'growth_expansion'})
SET sc.display_name = 'Growth & Expansion',
    sc.icon = 'trending-up',
    sc.color = '#F59E0B';

MERGE (sc:SignalCategory {name: 'direct_engagement'})
SET sc.display_name = 'Direct Engagement',
    sc.icon = 'target',
    sc.color = '#3B82F6';

// ============================================================================
// SAMPLE DATA - Demo User
// ============================================================================

MERGE (u:User {id: 'demo-user-1'})
SET u.email = 'demo@databackbone.io',
    u.name = 'Demo User',
    u.role = 'admin';
