-- Seed data for testing Academic Consent Portal
-- Based on quickstart.md test scenarios

-- Insert test admin user
INSERT INTO users (bank_id_number, email, full_name, role, bank_id_verified, last_bank_id_auth)
VALUES 
  ('199001011234', 'admin@consent-portal.se', 'Admin User', 'administrator', true, NOW());

-- Insert test researcher
INSERT INTO users (bank_id_number, email, full_name, role, bank_id_verified, last_bank_id_auth)
VALUES 
  ('197801012345', 'researcher@university.se', 'Dr. Anna Andersson', 'researcher', true, NOW());

-- Insert test participant (Bank ID test number from specs)
INSERT INTO users (bank_id_number, email, full_name, role, bank_id_verified)
VALUES 
  ('197810126789', 'participant@email.com', 'Erik Svensson', 'participant', false);

-- Create test study
WITH new_study AS (
  INSERT INTO studies (title, description, researcher_id, status, max_participants, start_date, end_date)
  VALUES (
    'Sleep Pattern Research Study',
    'A longitudinal study examining sleep patterns in young adults aged 18-25. Participants will track their sleep for 30 days using a mobile app and complete weekly surveys about sleep quality and daily activities.',
    (SELECT id FROM users WHERE email = 'researcher@university.se'),
    'active',
    100,
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '90 days'
  )
  RETURNING id
)
SELECT id FROM new_study;

-- Create another test study
INSERT INTO studies (title, description, researcher_id, status, max_participants, start_date)
VALUES (
  'Digital Wellness Study',
  'Research on the impact of digital device usage on mental health and productivity among university students.',
  (SELECT id FROM users WHERE email = 'researcher@university.se'),
  'draft',
  75,
  CURRENT_DATE + INTERVAL '30 days'
);