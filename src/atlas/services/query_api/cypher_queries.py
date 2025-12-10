COMPANY_BY_DOMAIN = """
MATCH (c:Company {domain:$domain})
OPTIONAL MATCH (p:Person)-[:WORKS_AT]->(c)
OPTIONAL MATCH (p)-[:HAS_EMAIL]->(e:Email)
RETURN 
  {id: c.id, name: c.name, domain: c.domain, industry: c.industry, employee_count: c.employee_count, location: c.location} as company, 
  collect(DISTINCT {id: p.id, full_name: p.full_name, title: p.title, department: p.department}) as people, 
  collect(DISTINCT e.address) as emails
"""

PEOPLE_BY_NAME = """
MATCH (p:Person)
WHERE toLower(p.full_name) CONTAINS toLower($q)
OPTIONAL MATCH (p)-[:WORKS_AT]->(c:Company)
OPTIONAL MATCH (p)-[:HAS_EMAIL]->(e:Email)
RETURN 
  {id: p.id, full_name: p.full_name, title: p.title, department: p.department} as person, 
  collect(DISTINCT {id: c.id, name: c.name, domain: c.domain, industry: c.industry, location: c.location}) as companies,
  collect(DISTINCT e.address) as emails
"""

NEIGHBORS = """
MATCH (n {id:$id})
CALL apoc.path.expand(n, null, null, 1, $depth) YIELD path
RETURN nodes(path) as nodes, relationships(path) as rels LIMIT 50
"""

# New queries for enhanced B2B functionality
COMPANIES_BY_INDUSTRY = """
MATCH (c:Company)
WHERE c.industry = $industry
OPTIONAL MATCH (p:Person)-[:WORKS_AT]->(c)
RETURN 
  {id: c.id, name: c.name, domain: c.domain, industry: c.industry, employee_count: c.employee_count, location: c.location} as company,
  count(p) as people_count
ORDER BY people_count DESC
"""

COMPANIES_BY_LOCATION = """
MATCH (c:Company)
WHERE c.location = $location
OPTIONAL MATCH (p:Person)-[:WORKS_AT]->(c)
RETURN 
  {id: c.id, name: c.name, domain: c.domain, industry: c.industry, employee_count: c.employee_count, location: c.location} as company,
  count(p) as people_count
ORDER BY people_count DESC
"""

PEOPLE_BY_DEPARTMENT = """
MATCH (p:Person)
WHERE p.department = $department
OPTIONAL MATCH (p)-[:WORKS_AT]->(c:Company)
OPTIONAL MATCH (p)-[:HAS_EMAIL]->(e:Email)
RETURN 
  {id: p.id, full_name: p.full_name, title: p.title, department: p.department} as person,
  collect(DISTINCT {id: c.id, name: c.name, domain: c.domain, industry: c.industry}) as companies,
  collect(DISTINCT e.address) as emails
"""

INDUSTRY_STATS = """
MATCH (c:Company)
RETURN 
  c.industry as industry,
  count(c) as company_count,
  collect({name: c.name, domain: c.domain, location: c.location}) as companies
ORDER BY company_count DESC
"""
