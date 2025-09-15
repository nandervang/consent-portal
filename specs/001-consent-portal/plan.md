# Implementation Plan: Academic Consent Portal

**Branch**: `001-consent-portal` | **Date**: 2024-12-15 | **Spec**: [specs/001-consent-portal/spec.md]
**Input**: Feature specification from `/specs/001-consent-portal/spec.md`

## Summary
A web-based consent portal for academic studies allowing researchers to manage studies and collect verified participant consent through Bank ID authentication, with PDF document handling and comprehensive audit trails.

## Technical Context
**Language/Version**: TypeScript 5.x, JavaScript ES2023  
**Primary Dependencies**: React 18+, Vite, Supabase JS SDK, Bank ID integration library  
**Storage**: Supabase (PostgreSQL) database with file storage for PDFs  
**Testing**: Vitest, React Testing Library, Playwright for E2E  
**Target Platform**: Modern web browsers (Chrome 90+, Firefox 88+, Safari 14+)  
**Project Type**: web (React frontend + Supabase backend)  
**Performance Goals**: <2s page load, <500ms Bank ID response, PDF upload <30s  
**Constraints**: GDPR compliance, Swedish Bank ID integration, academic data retention  
**Scale/Scope**: 1000+ participants, 50+ concurrent studies, 10MB PDF limit

## Constitution Check

**Simplicity**:
- Projects: 2 (frontend React app, Supabase configuration)
- Using React directly with minimal wrapper components
- Single data model with Supabase tables
- No unnecessary patterns, direct Supabase client usage

**Architecture**:
- Frontend library structure: auth, studies, consent, pdf-handling
- Libraries: auth (Bank ID integration), studies (CRUD operations), consent (tracking), pdf (upload/display)
- CLI per library: Not applicable for web application
- Library docs: Component documentation and API reference

**Testing (NON-NEGOTIABLE)**:
- RED-GREEN-Refactor cycle enforced
- Test order: Integration→E2E→Unit
- Real Supabase test database
- Integration tests for: auth flow, study management, consent recording
- Tests before implementation

**Observability**:
- Structured logging with console and Supabase logging
- Error boundaries and error context
- Bank ID transaction logging

**Versioning**:
- Version: 1.0.0
- BUILD increments on features
- Breaking changes managed through migration scripts

## Project Structure

### Documentation (this feature)
```
specs/001-consent-portal/
├── plan.md              # This file
├── research.md          # Tech research and decisions
├── data-model.md        # Database schema and entities
├── quickstart.md        # Setup and testing instructions
├── contracts/           # API contracts and schemas
└── tasks.md             # Implementation tasks (created by /tasks)
```

### Source Code (repository root)
```
# Web application structure
frontend/
├── src/
│   ├── components/      # React components
│   │   ├── auth/       # Bank ID authentication
│   │   ├── studies/    # Study management
│   │   ├── consent/    # Consent forms and tracking  
│   │   ├── pdf/        # PDF handling and display
│   │   └── common/     # Shared UI components
│   ├── pages/          # Route pages
│   ├── services/       # API services and utilities
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Helper functions
├── tests/
│   ├── integration/    # Integration tests
│   ├── e2e/           # End-to-end tests
│   └── unit/          # Unit tests
├── public/            # Static assets
└── supabase/         # Supabase configuration
    ├── migrations/   # Database migrations
    ├── functions/    # Edge functions
    └── config.toml   # Supabase settings
```

**Structure Decision**: Option 2 (Web application) - React frontend with Supabase backend

## Phase 0: Outline & Research

### Research Tasks
1. **Bank ID Integration**: Research Swedish Bank ID API integration patterns and libraries for web applications
2. **Supabase PDF Storage**: Best practices for file upload, storage, and access control in Supabase
3. **GDPR Compliance**: Data retention, consent withdrawal, and audit requirements for academic research
4. **React PDF Display**: Libraries and approaches for PDF viewing in React applications
5. **Academic Consent Standards**: Legal and ethical requirements for digital consent collection

### Key Decisions Needed
- Bank ID integration approach (direct API vs third-party service)
- PDF storage strategy (Supabase Storage vs external CDN)
- State management approach (React Context vs external library)
- Authentication flow design (session management, refresh tokens)
- Audit logging implementation (database triggers vs application-level)

**Output**: research.md with technology decisions and implementation approaches

## Phase 1: Design & Contracts

### Data Model (data-model.md)
**Users Table**:
- id, bank_id_number, email, full_name, role, created_at, updated_at

**Studies Table**:  
- id, title, description, researcher_id, pdf_document_id, status, created_at, updated_at

**Consent Records Table**:
- id, user_id, study_id, consent_given, bank_id_transaction_id, timestamp, ip_address, withdrawn_at

**PDF Documents Table**:
- id, filename, file_path, file_size, upload_timestamp, validated

### API Contracts (/contracts/)
- **Authentication API**: Bank ID initiation, status check, completion
- **Studies API**: CRUD operations for study management  
- **Consent API**: Consent submission, withdrawal, status queries
- **PDF API**: Upload, retrieval, validation endpoints
- **Admin API**: User management, audit reporting

### Contract Tests
- Bank ID authentication flow validation
- Study CRUD operation schemas
- Consent recording and retrieval
- PDF upload and security checks
- Role-based access control

### Quickstart (quickstart.md)
1. Supabase project setup and configuration
2. Bank ID test environment configuration
3. Local development server startup
4. Sample data population
5. Test user authentication and consent flow

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md

## Phase 2: Task Planning Approach

**Task Generation Strategy**:
- Database setup and migration tasks
- Authentication system implementation (Bank ID integration)
- Core entity management (users, studies, consent records)
- PDF handling and storage
- Frontend components and pages
- Integration testing and E2E flows

**Ordering Strategy**:
- Database and Supabase setup first
- Authentication foundation
- Core data models and services
- UI components following data layer
- Integration and testing throughout

**Estimated Output**: 35-40 numbered, ordered tasks in tasks.md

## Complexity Tracking
*No constitutional violations requiring justification*

## Progress Tracking

**Phase Status**:
- [x] Phase 0: Research approach defined
- [ ] Phase 1: Design approach defined  
- [ ] Phase 2: Task planning approach defined
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [ ] Post-Design Constitution Check: PASS
- [ ] All research completed
- [ ] Complexity deviations documented (N/A)

---
*Based on Constitution v2.1.1*