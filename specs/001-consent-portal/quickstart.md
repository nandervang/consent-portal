# Quickstart Guide: Academic Consent Portal

**Date**: 2024-12-15  
**Feature**: Academic Consent Portal  
**Prerequisites**: Node.js 18+, npm/yarn, Supabase CLI

## Overview
This guide walks through setting up the Academic Consent Portal development environment, from Supabase configuration to testing the complete consent flow with Bank ID authentication.

## 1. Environment Setup

### Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Install Supabase CLI
npm install -g supabase

# Install development tools
npm install -g @vitejs/cli
```

### Environment Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Configure environment variables
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_BANKID_TEST_MODE=true
VITE_BANKID_API_URL=https://appapi2.test.bankid.com/rp/v6.0
```

## 2. Supabase Project Setup

### Initialize Supabase Project
```bash
# Login to Supabase
supabase login

# Initialize local Supabase
supabase init

# Start local development
supabase start

# Apply database migrations
supabase db push
```

### Database Schema Verification
```sql
-- Verify tables are created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Expected tables: users, studies, consent_records, pdf_documents
```

### Storage Bucket Setup
```bash
# Create storage bucket for PDFs
supabase storage create --public pdf-documents

# Set up storage policies
psql -h localhost -p 54322 -d postgres -U postgres -f supabase/storage-policies.sql
```

## 3. Bank ID Test Environment

### Test Certificate Setup
```bash
# Download Bank ID test certificates (provided by test environment)
mkdir -p certificates/
# Place test.p12 certificate in certificates/ directory
```

### Edge Function Deployment
```bash
# Deploy Bank ID authentication functions
supabase functions deploy bankid-auth
supabase functions deploy bankid-status

# Test edge functions
curl -X POST http://localhost:54321/functions/v1/bankid-auth \
  -H "Content-Type: application/json" \
  -d '{"personalNumber": "197810126789"}'
```

## 4. Frontend Application

### Development Server
```bash
# Start Vite development server
npm run dev

# Application available at: http://localhost:5173
```

### Build Verification
```bash
# Build production bundle
npm run build

# Preview production build
npm run preview
```

## 5. Sample Data Population

### Create Test Users
```sql
-- Insert test researcher
INSERT INTO users (bank_id_number, email, full_name, role, bank_id_verified)
VALUES 
  ('197801012345', 'researcher@university.se', 'Dr. Anna Andersson', 'researcher', true),
  ('198502156789', 'participant@email.com', 'Erik Svensson', 'participant', false);
```

### Create Test Study
```sql
-- Insert test study
WITH new_study AS (
  INSERT INTO studies (title, description, researcher_id, status, max_participants)
  VALUES (
    'Sleep Pattern Research Study',
    'A longitudinal study examining sleep patterns in young adults.',
    (SELECT id FROM users WHERE email = 'researcher@university.se'),
    'active',
    100
  )
  RETURNING id
)
SELECT id FROM new_study;
```

### Upload Sample PDF
```bash
# Upload sample consent PDF using API
curl -X POST http://localhost:54321/functions/v1/pdf/upload \
  -H "Authorization: Bearer your_jwt_token" \
  -F "file=@sample-consent.pdf" \
  -F "filename=sleep-study-consent.pdf"
```

## 6. Testing Scenarios

### Authentication Flow Test
1. **Navigate to Portal**: Visit http://localhost:5173
2. **Initiate Bank ID**: Click "Login with Bank ID"
3. **Enter Test Number**: Use `197810126789` (test personal number)
4. **Simulate App**: Use Bank ID test app or QR code
5. **Verify Login**: Confirm user is authenticated and redirected

### Consent Submission Test
1. **View Active Studies**: Authenticated user sees available studies
2. **Select Study**: Click on "Sleep Pattern Research Study"
3. **Review Consent**: PDF consent form displays in viewer
4. **Submit Consent**: Click "I Consent" button
5. **Verify Recording**: Check consent recorded in database

### Researcher Dashboard Test
1. **Login as Researcher**: Use researcher test account
2. **View Studies**: Access study management dashboard
3. **Check Consent Records**: View participant consent status
4. **Export Data**: Test consent record export functionality

### Consent Withdrawal Test
1. **Access User Profile**: Participant views their consents
2. **Withdraw Consent**: Click "Withdraw Consent" for a study
3. **Verify Withdrawal**: Confirm consent status updated
4. **Audit Trail**: Check withdrawal recorded with timestamp

## 7. Automated Testing

### Unit Tests
```bash
# Run unit tests
npm run test:unit

# Run with coverage
npm run test:unit -- --coverage
```

### Integration Tests
```bash
# Run integration tests with test database
npm run test:integration

# Test specific API endpoints
npm run test:api
```

### End-to-End Tests
```bash
# Run E2E tests with Playwright
npm run test:e2e

# Run in headed mode for debugging
npm run test:e2e -- --headed
```

## 8. Production Deployment

### Environment Configuration
```bash
# Production environment variables
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_anon_key
VITE_BANKID_TEST_MODE=false
VITE_BANKID_API_URL=https://appapi2.bankid.com/rp/v6.0
```

### Deploy to Vercel
```bash
# Build and deploy
npm run build
vercel --prod

# Configure environment variables in Vercel dashboard
```

### Database Migration
```bash
# Apply migrations to production
supabase db push --db-url your_production_db_url

# Verify production database
supabase db diff --db-url your_production_db_url
```

## 9. Monitoring and Logging

### Application Monitoring
```bash
# View Supabase logs
supabase logs

# Monitor edge function performance
supabase functions logs bankid-auth
```

### Error Tracking
- Configure error boundary components
- Set up Sentry or similar error tracking
- Monitor Bank ID authentication success rates

## 10. Troubleshooting

### Common Issues

**Bank ID Authentication Fails**
```bash
# Check edge function logs
supabase functions logs bankid-auth

# Verify test certificate is valid
openssl pkcs12 -info -in certificates/test.p12
```

**PDF Upload Issues**
```bash
# Check storage bucket permissions
supabase storage list --bucket pdf-documents

# Verify file size and type restrictions
# Maximum: 10MB, Type: application/pdf only
```

**Database Connection Errors**
```bash
# Verify local Supabase is running
supabase status

# Check database migrations
supabase migration list
```

**Build Failures**
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check TypeScript compilation
npm run type-check
```

## 11. Performance Validation

### Load Testing
```bash
# Test concurrent users (using k6)
k6 run performance-tests/load-test.js

# Target: Handle 100 concurrent users
# Response time: <2s for page loads, <500ms for API calls
```

### Database Performance
```sql
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM consent_records 
WHERE user_id = 'user-uuid' AND study_id = 'study-uuid';

-- Verify indexes are being used
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes;
```

## 12. Security Verification

### Authentication Security
- [ ] Bank ID certificates properly configured
- [ ] JWT tokens have appropriate expiration
- [ ] Session management follows security best practices

### Data Security
- [ ] RLS policies prevent unauthorized access
- [ ] Personal data is encrypted at rest
- [ ] HTTPS enforced in production

### GDPR Compliance
- [ ] Consent withdrawal functionality works
- [ ] Data export capability available
- [ ] Audit trails maintained for all actions

---

## Success Criteria Checklist

**Setup Complete**:
- [ ] Supabase project configured and running
- [ ] Database schema applied successfully
- [ ] Bank ID test environment functional
- [ ] Frontend application builds and runs

**Core Functionality**:
- [ ] Bank ID authentication working
- [ ] PDF upload and display functional
- [ ] Consent submission and tracking operational
- [ ] User role-based access control enforced

**Quality Assurance**:
- [ ] All automated tests passing
- [ ] Performance targets met
- [ ] Security measures verified
- [ ] GDPR compliance validated

**Production Ready**:
- [ ] Production deployment successful
- [ ] Monitoring and logging configured
- [ ] Backup and recovery procedures tested
- [ ] Documentation complete and accessible

---

*Estimated setup time: 2-3 hours for complete environment*  
*Prerequisites must be installed and configured before starting*