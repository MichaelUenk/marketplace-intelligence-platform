# iBood Production Deployment Plan

This document outlines the steps required to deploy iBood to a production environment.

---

## Table of Contents

1. [Infrastructure Options](#1-infrastructure-options)
2. [Pre-Production Checklist](#2-pre-production-checklist)
3. [Phase 1: Infrastructure Setup](#3-phase-1-infrastructure-setup)
4. [Phase 2: Security Hardening](#4-phase-2-security-hardening)
5. [Phase 3: CI/CD Pipeline](#5-phase-3-cicd-pipeline)
6. [Phase 4: Deployment](#6-phase-4-deployment)
7. [Phase 5: Monitoring & Observability](#7-phase-5-monitoring--observability)
8. [Phase 6: Backup & Disaster Recovery](#8-phase-6-backup--disaster-recovery)
9. [Cost Estimates](#9-cost-estimates)
10. [Timeline](#10-timeline)

---

## 1. Infrastructure Options

### Option A: Cloud Platform (Recommended for MVP)

**AWS / Google Cloud / Azure**

| Component | AWS Service | GCP Service | Azure Service |
|-----------|-------------|-------------|---------------|
| Container Orchestration | ECS/EKS | Cloud Run/GKE | ACI/AKS |
| Frontend Hosting | S3 + CloudFront | Cloud Storage + CDN | Blob + CDN |
| Database (Neo4j) | Neo4j AuraDB (managed) | Neo4j AuraDB | Neo4j AuraDB |
| Vector DB (Qdrant) | Qdrant Cloud | Qdrant Cloud | Qdrant Cloud |
| Cache (Redis) | ElastiCache | Memorystore | Azure Cache |
| Object Storage | S3 | Cloud Storage | Blob Storage |
| Secrets | Secrets Manager | Secret Manager | Key Vault |
| Load Balancer | ALB | Cloud Load Balancing | App Gateway |

**Recommended: AWS with ECS Fargate** (serverless containers, no server management)

### Option B: Kubernetes (Best for Scale)

Deploy to managed Kubernetes:
- AWS EKS
- Google GKE
- Azure AKS
- DigitalOcean Kubernetes

### Option C: Single VM (Simplest/Cheapest)

For small teams (<10 users):
- DigitalOcean Droplet ($48-96/month)
- Hetzner Cloud Server (€30-60/month)
- AWS EC2 (t3.large ~$60/month)

---

## 2. Pre-Production Checklist

### Code Quality
- [ ] All TypeScript errors resolved (`npx tsc --noEmit`)
- [ ] ESLint/Prettier configured and passing
- [ ] Unit tests written and passing
- [ ] Integration tests for critical paths
- [ ] Security audit of dependencies (`npm audit`, `pip-audit`)

### Security
- [ ] Remove all hardcoded credentials
- [ ] Implement proper authentication (OAuth2/OIDC)
- [ ] Add rate limiting to API
- [ ] Configure CORS properly
- [ ] Enable HTTPS everywhere
- [ ] Implement input validation/sanitization
- [ ] Add audit logging

### Performance
- [ ] Frontend bundle optimization (code splitting)
- [ ] API response caching strategy
- [ ] Database indexes optimized
- [ ] CDN configured for static assets
- [ ] Lazy loading for large components

### Documentation
- [ ] API documentation complete (OpenAPI/Swagger)
- [ ] Deployment runbook
- [ ] Incident response procedures
- [ ] User documentation

---

## 3. Phase 1: Infrastructure Setup

### 3.1 Domain & SSL

```bash
# Purchase domain (e.g., app.ibood.com)
# Configure DNS with your registrar

# Option 1: Let's Encrypt (free)
# Option 2: AWS ACM (free with AWS services)
# Option 3: Cloudflare (free tier available)
```

### 3.2 Create Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./src/data-backbone/frontend
      dockerfile: Dockerfile.prod
    environment:
      - VITE_API_URL=https://api.ibood.com
    restart: always

  backend:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - NEO4J_URI=${NEO4J_URI}
      - NEO4J_PASSWORD=${NEO4J_PASSWORD}
      - REDIS_URL=${REDIS_URL}
      - MINIO_ENDPOINT=${MINIO_ENDPOINT}
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/healthz"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - frontend
      - backend
    restart: always
```

### 3.3 Create Production Frontend Dockerfile

Create `src/data-backbone/frontend/Dockerfile.prod`:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.frontend.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 3.4 Nginx Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:80;
    }

    upstream backend {
        server backend:8000;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name app.ibood.com api.ibood.com;
        return 301 https://$server_name$request_uri;
    }

    # Frontend
    server {
        listen 443 ssl http2;
        server_name app.ibood.com;

        ssl_certificate /etc/nginx/certs/fullchain.pem;
        ssl_certificate_key /etc/nginx/certs/privkey.pem;

        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }

    # API
    server {
        listen 443 ssl http2;
        server_name api.ibood.com;

        ssl_certificate /etc/nginx/certs/fullchain.pem;
        ssl_certificate_key /etc/nginx/certs/privkey.pem;

        location / {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

---

## 4. Phase 2: Security Hardening

### 4.1 Authentication

Replace simple password with proper auth:

```typescript
// Option 1: Auth0 (recommended for quick setup)
// Option 2: Clerk (modern, good DX)
// Option 3: Supabase Auth (if using Supabase)
// Option 4: Custom JWT with refresh tokens

// Install Auth0 React SDK
npm install @auth0/auth0-react

// Wrap app with Auth0Provider
import { Auth0Provider } from '@auth0/auth0-react';

<Auth0Provider
  domain="your-tenant.auth0.com"
  clientId="your-client-id"
  authorizationParams={{
    redirect_uri: window.location.origin
  }}
>
  <App />
</Auth0Provider>
```

### 4.2 API Security

Add to FastAPI backend:

```python
# Rate limiting
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.get("/api/deals")
@limiter.limit("100/minute")
async def get_deals():
    ...

# CORS configuration
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://app.ibood.com"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Security headers
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware
app.add_middleware(HTTPSRedirectMiddleware)
```

### 4.3 Secrets Management

```bash
# AWS Secrets Manager
aws secretsmanager create-secret \
  --name ibood/production \
  --secret-string '{"NEO4J_PASSWORD":"xxx","OPENAI_API_KEY":"xxx"}'

# Or use environment variables with Docker secrets
docker secret create neo4j_password ./secrets/neo4j_password.txt
```

### 4.4 Database Security

```cypher
// Neo4j - Create application user with limited permissions
CREATE USER ibood_app SET PASSWORD 'secure_password' CHANGE NOT REQUIRED;
GRANT MATCH {*} ON GRAPH * TO ibood_app;
GRANT WRITE ON GRAPH * TO ibood_app;
DENY DROP ON DATABASE * TO ibood_app;
```

---

## 5. Phase 3: CI/CD Pipeline

### 5.1 GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

env:
  AWS_REGION: eu-west-1
  ECR_REPOSITORY: ibood

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: src/data-backbone/frontend/package-lock.json

      - name: Install frontend dependencies
        run: cd src/data-backbone/frontend && npm ci

      - name: Type check
        run: cd src/data-backbone/frontend && npx tsc --noEmit

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install backend dependencies
        run: pip install -r requirements.txt

      - name: Run backend tests
        run: pytest

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2

      - name: Build and push frontend
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY-frontend:$IMAGE_TAG \
            -f src/data-backbone/frontend/Dockerfile.prod \
            src/data-backbone/frontend
          docker push $ECR_REGISTRY/$ECR_REPOSITORY-frontend:$IMAGE_TAG

      - name: Build and push backend
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY-backend:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY-backend:$IMAGE_TAG

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to ECS
        run: |
          aws ecs update-service \
            --cluster ibood-prod \
            --service ibood-frontend \
            --force-new-deployment

          aws ecs update-service \
            --cluster ibood-prod \
            --service ibood-backend \
            --force-new-deployment
```

### 5.2 Branch Protection

Configure in GitHub:
- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date
- Restrict pushes to main

---

## 6. Phase 4: Deployment

### Option A: AWS ECS Deployment

#### 6.1 Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster --cluster-name ibood-prod

# Create task definition (see task-definition.json below)
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create service
aws ecs create-service \
  --cluster ibood-prod \
  --service-name ibood-backend \
  --task-definition ibood-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

#### 6.2 Use Managed Services

| Service | Recommendation |
|---------|----------------|
| Neo4j | [Neo4j AuraDB](https://neo4j.com/cloud/aura/) - Fully managed, starts at $65/month |
| Redis | AWS ElastiCache - t3.micro ~$12/month |
| Qdrant | [Qdrant Cloud](https://qdrant.tech/cloud/) - Free tier available, then $25/month |
| Storage | AWS S3 - Pay per use (~$5/month for small usage) |

### Option B: Single Server Deployment

```bash
# 1. Provision server (e.g., DigitalOcean)
doctl compute droplet create ibood-prod \
  --size s-4vcpu-8gb \
  --image docker-20-04 \
  --region ams3

# 2. SSH and setup
ssh root@your-server-ip

# 3. Clone and deploy
git clone https://github.com/your-org/ibood.git
cd ibood

# 4. Setup environment
cp .env.example .env
nano .env  # Configure production values

# 5. Install Certbot for SSL
apt install certbot python3-certbot-nginx

# 6. Get SSL certificate
certbot certonly --standalone -d app.ibood.com -d api.ibood.com

# 7. Start services
docker compose -f docker-compose.prod.yml up -d
```

---

## 7. Phase 5: Monitoring & Observability

### 7.1 Application Monitoring

**Option A: Datadog (Comprehensive)**
```bash
# Add Datadog agent to docker-compose
datadog:
  image: datadog/agent:latest
  environment:
    - DD_API_KEY=${DD_API_KEY}
    - DD_SITE=datadoghq.eu
```

**Option B: Sentry (Error Tracking)**
```bash
# Frontend
npm install @sentry/react

# Backend
pip install sentry-sdk[fastapi]
```

**Option C: Self-hosted (Grafana + Prometheus)**
```yaml
# Add to docker-compose
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml

grafana:
  image: grafana/grafana
  ports:
    - "3001:3000"
```

### 7.2 Log Aggregation

```yaml
# Add Loki for log aggregation
loki:
  image: grafana/loki:2.9.0
  ports:
    - "3100:3100"

promtail:
  image: grafana/promtail:2.9.0
  volumes:
    - /var/log:/var/log
```

### 7.3 Uptime Monitoring

- [UptimeRobot](https://uptimerobot.com/) - Free tier, 50 monitors
- [Better Uptime](https://betteruptime.com/) - Free tier
- AWS CloudWatch Synthetics

### 7.4 Alerting

Configure alerts for:
- Service downtime
- High error rates (>1%)
- High latency (p95 > 2s)
- Database connection failures
- Disk space > 80%
- Memory usage > 90%

---

## 8. Phase 6: Backup & Disaster Recovery

### 8.1 Database Backups

**Neo4j:**
```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
neo4j-admin database dump neo4j --to-path=/backups/neo4j-$DATE.dump

# Upload to S3
aws s3 cp /backups/neo4j-$DATE.dump s3://ibood-backups/neo4j/
```

**Redis:**
```bash
# Redis RDB snapshots (configure in redis.conf)
save 900 1
save 300 10
save 60 10000
```

### 8.2 Backup Schedule

| Component | Frequency | Retention |
|-----------|-----------|-----------|
| Neo4j | Daily | 30 days |
| Redis | Hourly | 7 days |
| MinIO/S3 | N/A (object storage) | Lifecycle policy |
| Application logs | Real-time | 90 days |

### 8.3 Disaster Recovery Plan

1. **RPO (Recovery Point Objective)**: 1 hour
2. **RTO (Recovery Time Objective)**: 4 hours

**Recovery Steps:**
1. Spin up new infrastructure (terraform apply)
2. Restore Neo4j from latest backup
3. Deploy latest container images
4. Update DNS to point to new infrastructure
5. Verify all services operational

---

## 9. Cost Estimates

### Minimal Production (< 10 users)

| Service | Provider | Monthly Cost |
|---------|----------|--------------|
| Server | DigitalOcean 4GB | $24 |
| Neo4j | Self-hosted | $0 |
| Domain | Cloudflare | $12/year |
| SSL | Let's Encrypt | $0 |
| Backups | DigitalOcean Spaces | $5 |
| **Total** | | **~$30/month** |

### Standard Production (10-100 users)

| Service | Provider | Monthly Cost |
|---------|----------|--------------|
| Compute | AWS ECS Fargate | $50-100 |
| Neo4j | AuraDB Professional | $65 |
| Redis | ElastiCache | $15 |
| Qdrant | Qdrant Cloud | $25 |
| S3 | AWS S3 | $5 |
| CloudFront | AWS | $10 |
| Monitoring | Datadog | $15 |
| **Total** | | **~$200-250/month** |

### Enterprise Production (100+ users)

| Service | Provider | Monthly Cost |
|---------|----------|--------------|
| Compute | AWS EKS | $150-300 |
| Neo4j | AuraDB Enterprise | $500+ |
| Redis | ElastiCache (cluster) | $100 |
| Qdrant | Qdrant Cloud | $100 |
| S3 + CloudFront | AWS | $50 |
| Monitoring | Datadog Pro | $100 |
| Support | AWS Business | $100 |
| **Total** | | **~$1,000-1,500/month** |

---

## 10. Timeline

### Week 1: Foundation
- [ ] Set up Git repository with branch protection
- [ ] Configure CI/CD pipeline (GitHub Actions)
- [ ] Create production Dockerfiles
- [ ] Set up staging environment

### Week 2: Infrastructure
- [ ] Provision cloud resources (AWS/GCP/Azure)
- [ ] Configure managed database services
- [ ] Set up SSL certificates
- [ ] Configure DNS

### Week 3: Security
- [ ] Implement authentication (Auth0/Clerk)
- [ ] Add rate limiting and CORS
- [ ] Security audit and penetration testing
- [ ] Configure secrets management

### Week 4: Deployment & Monitoring
- [ ] Deploy to production
- [ ] Configure monitoring and alerting
- [ ] Set up log aggregation
- [ ] Create backup procedures
- [ ] Write runbooks and documentation

### Week 5: Testing & Launch
- [ ] Load testing
- [ ] User acceptance testing
- [ ] Soft launch to beta users
- [ ] Monitor and fix issues
- [ ] Full production launch

---

## Quick Start Commands

```bash
# Local development
docker compose up -d

# Build for production
docker compose -f docker-compose.prod.yml build

# Deploy to production
docker compose -f docker-compose.prod.yml up -d

# View logs
docker compose logs -f

# Backup Neo4j
docker exec neo4j neo4j-admin database dump neo4j --to-path=/backups/

# Health check
curl https://api.ibood.com/healthz
```

---

## Next Steps

1. **Choose infrastructure option** (AWS ECS recommended for MVP)
2. **Set up authentication** (Auth0 for fastest implementation)
3. **Configure CI/CD** (GitHub Actions provided above)
4. **Deploy to staging** first for testing
5. **Security audit** before production launch

For questions or support, contact: devops@ibood.com
