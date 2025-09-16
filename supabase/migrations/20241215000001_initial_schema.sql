-- Initial schema for Academic Consent Portal
-- Based on data-model.md specifications

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('participant', 'researcher', 'administrator');
CREATE TYPE study_status AS ENUM ('draft', 'active', 'paused', 'completed', 'cancelled');

-- Users table with Bank ID authentication
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

-- PDF Documents table
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

-- Studies table
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

-- Consent Records table
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

-- Create indexes for performance
CREATE INDEX idx_consent_user_study ON consent_records(user_id, study_id);
CREATE INDEX idx_studies_researcher ON studies(researcher_id);
CREATE INDEX idx_studies_status ON studies(status) WHERE status = 'active';
CREATE INDEX idx_users_bank_id ON users(bank_id_number);
CREATE INDEX idx_consent_timestamp ON consent_records(timestamp);

-- Add constraints
ALTER TABLE studies ADD CONSTRAINT check_study_dates
    CHECK (end_date IS NULL OR start_date IS NULL OR end_date > start_date);

ALTER TABLE studies ADD CONSTRAINT check_max_participants
    CHECK (max_participants > 0);

ALTER TABLE pdf_documents ADD CONSTRAINT check_file_size
    CHECK (file_size > 0 AND file_size <= 10485760); -- 10MB

-- Create update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_studies_updated_at 
    BEFORE UPDATE ON studies  
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdf_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY users_read_own ON users FOR SELECT
    USING (auth.uid() = id);

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

CREATE POLICY users_admin_read ON users FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'administrator'
    ));

-- RLS Policies for studies table
CREATE POLICY studies_read_active ON studies FOR SELECT
    USING (status = 'active');

CREATE POLICY studies_manage_own ON studies
    USING (researcher_id = auth.uid());

-- RLS Policies for consent_records table
CREATE POLICY consent_read_own ON consent_records FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY consent_read_researcher ON consent_records FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM studies WHERE id = consent_records.study_id
        AND researcher_id = auth.uid()
    ));

CREATE POLICY consent_insert ON consent_records FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- RLS Policies for pdf_documents table
CREATE POLICY pdf_read_own ON pdf_documents FOR SELECT
    USING (uploaded_by = auth.uid());

CREATE POLICY pdf_read_study_access ON pdf_documents FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM studies WHERE pdf_document_id = pdf_documents.id
        AND (status = 'active' OR researcher_id = auth.uid())
    ));

CREATE POLICY pdf_insert ON pdf_documents FOR INSERT
    WITH CHECK (uploaded_by = auth.uid());