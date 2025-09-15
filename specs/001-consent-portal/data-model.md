# Data Model: Academic Consent Portal

**Date**: 2024-12-15  
**Feature**: Academic Consent Portal  
**Database**: Supabase (PostgreSQL)

## Entity Relationship Overview

```
Users ||--o{ Studies : creates
Users ||--o{ ConsentRecords : provides
Studies ||--|| PDFDocuments : contains
Studies ||--o{ ConsentRecords : receives
```

## Core Entities

### Users Table
**Purpose**: Store user information with Bank ID verification and role-based access

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_id_number VARCHAR(12) UNIQUE NOT NULL, -- Swedish personal number
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'participant',
    bank_id_verified BOOLEAN DEFAULT FALSE,
    last_bank_id_auth TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE user_role AS ENUM ('participant', 'researcher', 'administrator');
```

**Validation Rules**:
- bank_id_number must follow Swedish personal number format (YYYYMMDD-XXXX)
- email must be valid email format
- full_name cannot be empty
- role must be valid enum value

**Relationships**:
- One user can create many studies (if role = researcher)
- One user can have many consent records (as participant)

### Studies Table
**Purpose**: Academic research studies with associated consent documents

```sql
CREATE TABLE studies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    researcher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pdf_document_id UUID REFERENCES pdf_documents(id) ON DELETE SET NULL,
    status study_status DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    max_participants INTEGER DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TYPE study_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');
```

**Validation Rules**:
- title cannot be empty
- researcher_id must reference valid user with researcher role
- end_date must be after start_date (if both provided)
- max_participants must be positive integer

**State Transitions**:
- draft → active (when published)
- active ↔ paused (can pause/resume)
- active → completed (when finished)
- Any status → cancelled (if terminated)

### ConsentRecords Table
**Purpose**: Track consent decisions with full audit information

```sql
CREATE TABLE consent_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    study_id UUID NOT NULL REFERENCES studies(id) ON DELETE CASCADE,
    consent_given BOOLEAN NOT NULL,
    bank_id_transaction_id VARCHAR(255) NOT NULL, -- BankID orderRef
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    withdrawal_reason TEXT,
    UNIQUE(user_id, study_id) -- One consent per user per study
);
```

**Validation Rules**:
- user_id must reference verified Bank ID user
- study_id must reference active study
- bank_id_transaction_id must be valid BankID transaction reference
- withdrawn_at can only be set if consent_given was initially true

**Audit Features**:
- Immutable records (no updates after creation, only withdrawal)
- Full transaction traceability through bank_id_transaction_id
- IP and user agent tracking for security

### PDFDocuments Table
**Purpose**: Store consent form PDFs with validation and metadata

```sql
CREATE TABLE pdf_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL, -- Supabase storage path
    file_size BIGINT NOT NULL,
    content_type VARCHAR(100) DEFAULT 'application/pdf',
    upload_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID NOT NULL REFERENCES users(id),
    validated BOOLEAN DEFAULT FALSE,
    validation_errors TEXT[],
    checksum VARCHAR(64) -- SHA-256 for file integrity
);
```

**Validation Rules**:
- file_size must be <= 10MB (10485760 bytes)
- content_type must be 'application/pdf'
- filename must be unique per uploader
- uploaded_by must reference user with researcher or admin role

**Security Features**:
- Checksum verification for file integrity
- Validation status tracking
- Uploaded by tracking for accountability

## Row Level Security (RLS) Policies

### Users Table Policies
```sql
-- Users can read their own data
CREATE POLICY users_read_own ON users FOR SELECT
    USING (auth.uid() = id);

-- Researchers can read basic info of participants who consented to their studies
CREATE POLICY users_read_participants ON users FOR SELECT
    USING (
        role = 'participant' AND
        EXISTS (
            SELECT 1 FROM consent_records cr
            JOIN studies s ON cr.study_id = s.id
            WHERE cr.user_id = users.id
            AND s.researcher_id = auth.uid()
            AND cr.consent_given = true
        )
    );

-- Admins can read all users
CREATE POLICY users_admin_read ON users FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'administrator'
    ));
```

### Studies Table Policies
```sql
-- Anyone can read active studies
CREATE POLICY studies_read_active ON studies FOR SELECT
    USING (status = 'active');

-- Researchers can manage their own studies
CREATE POLICY studies_manage_own ON studies
    USING (researcher_id = auth.uid());
```

### ConsentRecords Table Policies
```sql
-- Users can read their own consent records
CREATE POLICY consent_read_own ON consent_records FOR SELECT
    USING (user_id = auth.uid());

-- Researchers can read consent records for their studies
CREATE POLICY consent_read_researcher ON consent_records FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM studies WHERE id = consent_records.study_id
        AND researcher_id = auth.uid()
    ));

-- Only authenticated users can insert consent (via app logic)
CREATE POLICY consent_insert ON consent_records FOR INSERT
    WITH CHECK (user_id = auth.uid());
```

## Database Indexes

### Performance Indexes
```sql
-- Consent lookup by user and study
CREATE INDEX idx_consent_user_study ON consent_records(user_id, study_id);

-- Study lookup by researcher
CREATE INDEX idx_studies_researcher ON studies(researcher_id);

-- Active studies lookup
CREATE INDEX idx_studies_status ON studies(status) WHERE status = 'active';

-- Bank ID lookup
CREATE INDEX idx_users_bank_id ON users(bank_id_number);

-- Consent timestamp for reporting
CREATE INDEX idx_consent_timestamp ON consent_records(timestamp);
```

### Unique Constraints
```sql
-- Ensure unique Bank ID numbers
ALTER TABLE users ADD CONSTRAINT unique_bank_id_verified 
    UNIQUE (bank_id_number);

-- Ensure unique consent per user per study
ALTER TABLE consent_records ADD CONSTRAINT unique_user_study_consent
    UNIQUE (user_id, study_id);
```

## Data Integrity Rules

### Triggers
```sql
-- Update timestamp trigger for users and studies
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_studies_updated_at 
    BEFORE UPDATE ON studies  
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Check Constraints
```sql
-- Ensure valid date ranges for studies
ALTER TABLE studies ADD CONSTRAINT check_study_dates
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date > start_date);

-- Ensure positive participant limits
ALTER TABLE studies ADD CONSTRAINT check_max_participants
    CHECK (max_participants > 0);

-- Ensure file size limits
ALTER TABLE pdf_documents ADD CONSTRAINT check_file_size
    CHECK (file_size > 0 AND file_size <= 10485760); -- 10MB
```

## Migration Strategy

### Initial Migration (001_initial_schema.sql)
1. Create custom types (user_role, study_status)
2. Create tables in dependency order
3. Add foreign key constraints
4. Create indexes
5. Set up RLS policies
6. Create triggers and functions

### Seed Data (002_seed_data.sql)
1. Create admin user
2. Create sample test studies
3. Create test participants (for development)

---

## TypeScript Type Definitions

```typescript
// Generated types for application use
export type UserRole = 'participant' | 'researcher' | 'administrator';
export type StudyStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface User {
  id: string;
  bank_id_number: string;
  email: string;
  full_name: string;
  role: UserRole;
  bank_id_verified: boolean;
  last_bank_id_auth?: string;
  created_at: string;
  updated_at: string;
}

export interface Study {
  id: string;
  title: string;
  description?: string;
  researcher_id: string;
  pdf_document_id?: string;
  status: StudyStatus;
  start_date?: string;
  end_date?: string;
  max_participants: number;
  created_at: string;
  updated_at: string;
}

export interface ConsentRecord {
  id: string;
  user_id: string;
  study_id: string;
  consent_given: boolean;
  bank_id_transaction_id: string;
  timestamp: string;
  ip_address?: string;
  user_agent?: string;
  withdrawn_at?: string;
  withdrawal_reason?: string;
}

export interface PDFDocument {
  id: string;
  filename: string;
  original_filename: string;
  file_path: string;
  file_size: number;
  content_type: string;
  upload_timestamp: string;
  uploaded_by: string;
  validated: boolean;
  validation_errors?: string[];
  checksum: string;
}
```