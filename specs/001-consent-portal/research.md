# Research: Academic Consent Portal

**Date**: 2024-12-15  
**Feature**: Academic Consent Portal  
**Purpose**: Resolve technical unknowns and establish implementation approach

## Bank ID Integration Research

### Decision: Supabase Edge Functions + BankID API
**Rationale**: 
- Direct integration with Swedish BankID API provides full control
- Supabase Edge Functions handle server-side authentication securely
- Keeps sensitive operations away from client-side code
- Cost-effective compared to third-party services

**Implementation Approach**:
- Edge function initiates BankID auth with `orderRef`
- Client polls status endpoint for completion
- Store verified identity in Supabase Auth with custom claims
- Session management through Supabase Auth

**Alternatives Considered**:
- Third-party services (higher cost, less control)
- Client-side integration (security concerns)

## PDF Storage and Display

### Decision: Supabase Storage + react-pdf
**Rationale**:
- Supabase Storage provides secure file hosting with RLS
- Built-in access control and signed URLs
- react-pdf library handles PDF display reliably
- Direct integration with existing Supabase setup

**Implementation Details**:
- PDF files stored in organized bucket structure
- Row Level Security (RLS) for access control
- Signed URLs for temporary access
- File validation on upload (size, type, content)

**Alternatives Considered**:
- External CDN (additional complexity, cost)
- Base64 embedding (performance issues)

## State Management

### Decision: React Context + useReducer
**Rationale**:
- Native React solution, no additional dependencies
- Suitable for application scale (moderate complexity)
- Good TypeScript support
- Easy testing and debugging

**Architecture**:
- AuthContext for user state and Bank ID flows
- StudiesContext for study management
- ConsentContext for consent tracking
- Separate contexts prevent unnecessary re-renders

**Alternatives Considered**:
- Redux Toolkit (overkill for this scale)
- Zustand (additional dependency)

## GDPR Compliance Implementation

### Decision: Built-in Audit System + Data Retention Policies
**Rationale**:
- Academic research requires comprehensive audit trails
- GDPR right-to-be-forgotten needs systematic implementation
- Data minimization through automatic cleanup policies

**Key Features**:
- Automatic audit logging for all consent actions
- Consent withdrawal with data anonymization option
- Configurable data retention periods
- Export functionality for data portability

**Legal Requirements Addressed**:
- Informed consent recording
- Audit trail maintenance
- Right to withdraw consent
- Data portability and deletion

## Authentication Flow Design

### Decision: Bank ID + Supabase Auth Hybrid
**Rationale**:
- Bank ID provides strong identity verification
- Supabase Auth handles session management
- Custom claims store Bank ID verification status
- Seamless integration with RLS policies

**Flow Architecture**:
1. User initiates Bank ID auth
2. Edge function handles BankID API calls
3. Successful auth creates/updates Supabase user
4. Custom claims added for verification status
5. RLS policies enforce access based on verification

## Development and Testing Strategy

### Decision: Vitest + Testing Library + Playwright
**Rationale**:
- Vitest provides fast unit testing with TypeScript support
- Testing Library promotes good testing practices
- Playwright handles E2E testing including Bank ID simulation
- All tools integrate well with Vite build system

**Testing Approach**:
- Mock Bank ID for unit/integration tests
- Real Supabase test database for integration tests
- E2E tests use Bank ID test environment
- Separate test users and data isolation

## Security Architecture

### Decision: Multi-layer Security Approach
**Components**:
- RLS policies for data access control
- Edge function authentication for Bank ID
- HTTPS enforcement and secure headers
- Content Security Policy implementation
- Regular security audit logging

**Key Security Measures**:
- Bank ID transaction verification
- Session timeout and refresh token handling
- PDF access control through signed URLs
- Audit trail for all sensitive operations

## Performance Optimization

### Decision: Strategic Caching + Lazy Loading
**Approach**:
- React.lazy for code splitting
- Supabase query caching for frequently accessed data
- PDF lazy loading and progressive display
- Image optimization for UI assets

**Performance Targets Met**:
- <2s initial page load (code splitting)
- <500ms Bank ID response (edge function optimization)
- <30s PDF upload (chunked upload implementation)

## Deployment Strategy

### Decision: Vercel + Supabase Cloud
**Rationale**:
- Seamless integration between platforms
- Automatic deployments from Git
- Global CDN for optimal performance
- Built-in preview deployments for testing

**Production Configuration**:
- Environment-specific Supabase projects
- Secure environment variable management
- Database backup and recovery procedures
- Performance monitoring and alerting

---

## Implementation Dependencies

**Required for Phase 1**:
- Supabase project setup with authentication
- Bank ID test environment access
- PDF storage bucket configuration
- RLS policy definitions

**Required for Phase 2**:
- React application scaffolding
- TypeScript configuration
- Testing framework setup
- CI/CD pipeline configuration

---

## Validation Checklist

- [x] All NEEDS CLARIFICATION items resolved
- [x] Technology stack decisions documented
- [x] Security considerations addressed
- [x] Performance targets defined
- [x] Compliance requirements covered
- [x] Implementation dependencies identified