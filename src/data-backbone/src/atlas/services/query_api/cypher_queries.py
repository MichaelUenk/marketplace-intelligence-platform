"""Cypher queries for Neo4j graph operations"""

# ============================================================================
# COMPANY QUERIES
# ============================================================================

COMPANY_BY_DOMAIN = """
MATCH (c:Company {domain: $domain})
OPTIONAL MATCH (p:Person)-[:WORKS_AT]->(c)
OPTIONAL MATCH (p)-[:HAS_EMAIL]->(e:Email)
RETURN
  {id: c.id, name: c.name, domain: c.domain, industry: c.industry,
   employee_count: c.employee_count, location: c.location,
   rating: c.rating, website: c.website,
   hq_country: c.hq_country, hq_city: c.hq_city,
   intent_score: c.intent_score, icp_tier: c.icp_tier,
   is_prospect: c.is_prospect, is_partner: c.is_partner,
   sustainability_score: c.sustainability_score,
   wellbeing_score: c.wellbeing_score,
   growth_score: c.growth_score,
   workplace_score: c.workplace_score} as company,
  collect(DISTINCT {id: p.id, full_name: p.full_name, title: p.title,
                   department: p.department, seniority: p.seniority,
                   buyer_persona_type: p.buyer_persona_type}) as people,
  collect(DISTINCT e.address) as emails
"""

COMPANY_BY_ID = """
MATCH (c:Company {id: $id})
OPTIONAL MATCH (c)-[:BELONGS_TO]->(i:Industry)
OPTIONAL MATCH (c)-[:HAS_LOCATION]->(l:Location)
OPTIONAL MATCH (p:Person)-[:WORKS_AT]->(c)
RETURN
  c as company,
  i.name as industry_name,
  collect(DISTINCT l) as locations,
  collect(DISTINCT {id: p.id, full_name: p.full_name, title: p.title,
                   department: p.department, buyer_persona_type: p.buyer_persona_type}) as people
"""

COMPANIES_BY_INDUSTRY = """
MATCH (c:Company)
WHERE c.industry = $industry
OPTIONAL MATCH (p:Person)-[:WORKS_AT]->(c)
RETURN 
  {id: c.id, name: c.name, domain: c.domain, industry: c.industry, 
   employee_count: c.employee_count, location: c.location} as company,
  count(p) as people_count
ORDER BY people_count DESC
"""

COMPANIES_BY_LOCATION = """
MATCH (c:Company)
WHERE c.location = $location
OPTIONAL MATCH (p:Person)-[:WORKS_AT]->(c)
RETURN 
  {id: c.id, name: c.name, domain: c.domain, industry: c.industry, 
   employee_count: c.employee_count, location: c.location} as company,
  count(p) as people_count
ORDER BY people_count DESC
"""

PEOPLE_BY_NAME = """
MATCH (p:Person)
WHERE toLower(p.full_name) CONTAINS toLower($q)
OPTIONAL MATCH (p)-[:WORKS_AT]->(c:Company)
RETURN 
  {id: p.id, full_name: p.full_name, title: p.title, department: p.department,
   company_id: c.id, company_domain: c.domain, company_name: c.name} as person
LIMIT 50
"""

PEOPLE_BY_DEPARTMENT = """
MATCH (p:Person)
WHERE p.department = $department
OPTIONAL MATCH (p)-[:WORKS_AT]->(c:Company)
RETURN 
  {id: p.id, full_name: p.full_name, title: p.title, department: p.department,
   company_id: c.id, company_domain: c.domain, company_name: c.name} as person
ORDER BY p.full_name
"""

NEIGHBORS = """
MATCH (start)
WHERE id(start) = $id OR start.id = $id
WITH start
MATCH path = (start)-[*1..$depth]-(connected)
RETURN 
  [n in nodes(path) | {id: n.id, labels: labels(n), properties: properties(n)}] as nodes,
  [r in relationships(path) | {type: type(r), properties: properties(r)}] as relationships
LIMIT 100
"""

INDUSTRY_STATS = """
MATCH (c:Company)
OPTIONAL MATCH (p:Person)-[:WORKS_AT]->(c)
WITH c.industry as industry, c, count(p) as people_count
RETURN
  industry,
  count(DISTINCT c) as company_count,
  collect(DISTINCT {id: c.id, name: c.name, domain: c.domain,
                   location: c.location, people_count: people_count,
                   intent_score: c.intent_score, icp_tier: c.icp_tier}) as companies
ORDER BY company_count DESC
"""

# ============================================================================
# DEAL QUERIES (MEDDPICC)
# ============================================================================

DEALS_LIST = """
MATCH (d:Deal)-[:FOR_COMPANY]->(c:Company)
OPTIONAL MATCH (d)-[:OWNED_BY]->(u:User)
OPTIONAL MATCH (d)-[:HAS_CHAMPION]->(champion:Person)
RETURN
  d as deal,
  {id: c.id, name: c.name, domain: c.domain, industry: c.industry} as company,
  u.name as owner_name,
  champion.full_name as champion_name
ORDER BY d.expected_close_date ASC
"""

DEAL_BY_ID = """
MATCH (d:Deal {id: $id})-[:FOR_COMPANY]->(c:Company)
OPTIONAL MATCH (d)-[:OWNED_BY]->(u:User)
OPTIONAL MATCH (d)-[:HAS_CHAMPION]->(champion:Person)
OPTIONAL MATCH (d)-[:HAS_ECONOMIC_BUYER]->(eb:Person)
OPTIONAL MATCH (d)-[contact_rel:HAS_CONTACT]->(contact:Person)
OPTIONAL MATCH (d)-[:AT_LOCATION]->(l:Location)
RETURN
  d as deal,
  c as company,
  u as owner,
  champion as champion,
  eb as economic_buyer,
  l as location,
  collect(DISTINCT {
    person: contact,
    role: contact_rel.role,
    influence_level: contact_rel.influence_level,
    sentiment: contact_rel.sentiment
  }) as contacts
"""

DEALS_BY_COMPANY = """
MATCH (d:Deal)-[:FOR_COMPANY]->(c:Company {id: $company_id})
OPTIONAL MATCH (d)-[:OWNED_BY]->(u:User)
RETURN
  d as deal,
  u.name as owner_name
ORDER BY d.created_at DESC
"""

DEALS_BY_STAGE = """
MATCH (d:Deal {stage: $stage})-[:FOR_COMPANY]->(c:Company)
OPTIONAL MATCH (d)-[:OWNED_BY]->(u:User)
RETURN
  d as deal,
  {id: c.id, name: c.name, domain: c.domain} as company,
  u.name as owner_name
ORDER BY d.expected_close_date ASC
"""

DEAL_PIPELINE_STATS = """
MATCH (d:Deal)-[:FOR_COMPANY]->(c:Company)
WHERE d.stage NOT IN ['closed_won', 'closed_lost']
WITH d.stage as stage, count(d) as deal_count, sum(d.amount) as total_value,
     sum(d.weighted_amount) as weighted_value
RETURN stage, deal_count, total_value, weighted_value
ORDER BY
  CASE stage
    WHEN 'identified' THEN 1
    WHEN 'qualified' THEN 2
    WHEN 'engaged' THEN 3
    WHEN 'pipeline' THEN 4
    WHEN 'proposal' THEN 5
    WHEN 'negotiation' THEN 6
    WHEN 'committed' THEN 7
  END
"""

# ============================================================================
# SIGNAL QUERIES
# ============================================================================

SIGNALS_BY_COMPANY = """
MATCH (s:Signal)-[:DETECTED_FOR]->(c:Company {id: $company_id})
RETURN s as signal
ORDER BY s.detected_at DESC
LIMIT $limit
"""

HOT_ACCOUNTS = """
MATCH (c:Company)
WHERE c.intent_score >= $min_score AND c.is_prospect = true
OPTIONAL MATCH (s:Signal)-[:DETECTED_FOR]->(c)
WHERE s.detected_at > datetime() - duration({days: 30})
WITH c, count(s) as signal_count, max(s.detected_at) as newest_signal
OPTIONAL MATCH (champion:Person)-[:WORKS_AT]->(c)
WHERE champion.buyer_persona_type = 'Champion'
RETURN
  c as company,
  signal_count,
  newest_signal,
  champion.full_name as champion_name,
  champion.title as champion_title
ORDER BY c.intent_score DESC
LIMIT $limit
"""

SIGNAL_STATS = """
MATCH (s:Signal)
WHERE s.detected_at > datetime() - duration({days: $days})
WITH s.category as category, count(s) as signal_count
RETURN category, signal_count
ORDER BY signal_count DESC
"""

# ============================================================================
# OUTREACH & SEQUENCE QUERIES
# ============================================================================

SEQUENCES_LIST = """
MATCH (seq:Sequence)
OPTIONAL MATCH (seq)-[:CREATED_BY]->(u:User)
OPTIONAL MATCH (e:Person)-[enroll:ENROLLED_IN]->(seq)
WITH seq, u, count(enroll) as enrolled_count,
     count(CASE WHEN enroll.status = 'replied' THEN 1 END) as replied_count,
     count(CASE WHEN enroll.status = 'meeting_booked' THEN 1 END) as meetings_count
RETURN
  seq as sequence,
  u.name as created_by,
  enrolled_count,
  replied_count,
  meetings_count,
  CASE WHEN enrolled_count > 0 THEN toFloat(replied_count) / enrolled_count * 100 ELSE 0 END as reply_rate
ORDER BY seq.created_at DESC
"""

SEQUENCE_BY_ID = """
MATCH (seq:Sequence {id: $id})
OPTIONAL MATCH (seq)-[:CREATED_BY]->(u:User)
OPTIONAL MATCH (seq)-[:USES_CHANNEL]->(ch:Channel)
OPTIONAL MATCH (e:Person)-[enroll:ENROLLED_IN]->(seq)
OPTIONAL MATCH (e)-[:WORKS_AT]->(c:Company)
RETURN
  seq as sequence,
  u.name as created_by,
  collect(DISTINCT ch.type) as channels,
  collect(DISTINCT {
    person: {id: e.id, full_name: e.full_name, title: e.title},
    company: {id: c.id, name: c.name},
    status: enroll.status,
    enrolled_at: enroll.enrolled_at,
    replied_at: enroll.replied_at
  }) as enrollments
"""

ENROLLMENTS_BY_SEQUENCE = """
MATCH (e:Person)-[enroll:ENROLLED_IN]->(seq:Sequence {id: $sequence_id})
MATCH (e)-[:WORKS_AT]->(c:Company)
OPTIONAL MATCH (e)-[msg:RECEIVED_MESSAGE]->(seq)
RETURN
  e as person,
  c as company,
  enroll as enrollment,
  collect(DISTINCT {
    channel: msg.channel,
    sent_at: msg.sent_at,
    opened_at: msg.opened_at,
    replied_at: msg.replied_at
  }) as messages
ORDER BY enroll.enrolled_at DESC
"""

# ============================================================================
# ATTRIBUTION QUERIES
# ============================================================================

TOUCHPOINTS_BY_DEAL = """
MATCH (t:Touchpoint)-[:ATTRIBUTED_TO]->(d:Deal {id: $deal_id})
OPTIONAL MATCH (t)-[:VIA_CHANNEL]->(ch:Channel)
OPTIONAL MATCH (t)-[:PART_OF]->(camp:Campaign)
OPTIONAL MATCH (t)-[:FROM_SEQUENCE]->(seq:Sequence)
OPTIONAL MATCH (t)-[:ENGAGED]->(e:Person)
RETURN
  t as touchpoint,
  ch.type as channel,
  camp.name as campaign,
  seq.name as sequence_name,
  e.full_name as contact_name
ORDER BY t.occurred_at ASC
"""

CAMPAIGN_ATTRIBUTION = """
MATCH (camp:Campaign)<-[:PART_OF]-(t:Touchpoint)
OPTIONAL MATCH (t)-[:ATTRIBUTED_TO]->(d:Deal)
WITH camp, count(DISTINCT t) as touchpoint_count,
     count(DISTINCT d) as deals_influenced,
     sum(t.attributed_value) as attributed_revenue
RETURN
  camp.name as campaign,
  camp.source as source,
  camp.medium as medium,
  touchpoint_count,
  deals_influenced,
  attributed_revenue
ORDER BY attributed_revenue DESC
"""

ATTRIBUTION_JOURNEY = """
MATCH (c:Company {id: $company_id})<-[:AT_COMPANY]-(t:Touchpoint)
OPTIONAL MATCH (t)-[:ATTRIBUTED_TO]->(d:Deal)
OPTIONAL MATCH (t)-[:VIA_CHANNEL]->(ch:Channel)
OPTIONAL MATCH (t)-[:PART_OF]->(camp:Campaign)
RETURN
  t.type as touchpoint_type,
  t.occurred_at as occurred_at,
  ch.type as channel,
  camp.name as campaign,
  d.name as deal_name,
  t.attribution_weight as weight
ORDER BY t.occurred_at ASC
"""

# ============================================================================
# LEAD QUERIES
# ============================================================================

LEADS_WITH_URGENCY = """
MATCH (c:Company)
WHERE c.is_prospect = true
OPTIONAL MATCH (p:Person)-[:WORKS_AT]->(c)
WHERE p.buyer_persona_type IS NOT NULL
WITH c, collect(DISTINCT p)[0] as primary_contact
RETURN
  {
    id: c.id,
    name: c.name,
    domain: c.domain,
    industry: c.industry,
    location: c.location,
    intent_score: c.intent_score,
    created_at: c.created_at
  } as company,
  {
    id: primary_contact.id,
    full_name: primary_contact.full_name,
    title: primary_contact.title,
    email: primary_contact.email,
    buyer_persona_type: primary_contact.buyer_persona_type
  } as contact
ORDER BY c.created_at DESC
LIMIT $limit
"""

# ============================================================================
# GRAPH TRAVERSAL QUERIES
# ============================================================================

COMPANY_RELATIONSHIPS = """
MATCH (c:Company {id: $company_id})
OPTIONAL MATCH (c)-[:COMPETES_WITH]->(competitor:Company)
OPTIONAL MATCH (c)-[:PARTNERS_WITH]->(partner:Company)
OPTIONAL MATCH (c)-[:BELONGS_TO]->(i:Industry)<-[:BELONGS_TO]-(similar:Company)
WHERE similar <> c AND similar.is_prospect = true
RETURN
  collect(DISTINCT {id: competitor.id, name: competitor.name, domain: competitor.domain}) as competitors,
  collect(DISTINCT {id: partner.id, name: partner.name, domain: partner.domain}) as partners,
  collect(DISTINCT {id: similar.id, name: similar.name, domain: similar.domain, intent_score: similar.intent_score})[0..10] as similar_companies
"""

CONTACT_NETWORK = """
MATCH (e:Person {id: $person_id})
OPTIONAL MATCH (e)-[:KNOWS]->(connection:Person)-[:WORKS_AT]->(c:Company)
WHERE c.is_prospect = true
RETURN
  e as person,
  collect(DISTINCT {
    connection: {id: connection.id, full_name: connection.full_name, title: connection.title},
    company: {id: c.id, name: c.name, intent_score: c.intent_score}
  }) as network
"""

CHAMPION_CONNECTIONS = """
MATCH (e:Person)-[:HAS_PERSONA]->(p:Persona {type: 'Champion'})
MATCH (e)-[:KNOWS]->(e2:Person)-[:WORKS_AT]->(c2:Company)
WHERE c2.is_prospect = true
RETURN
  e.full_name as champion_name,
  e2.full_name as connection_name,
  c2.name as prospect_company,
  c2.intent_score as intent_score
ORDER BY c2.intent_score DESC
LIMIT 50
"""
