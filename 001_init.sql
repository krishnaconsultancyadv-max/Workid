CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  profile JSONB,
  work_id VARCHAR(50) UNIQUE,
  qr_nonce VARCHAR(20),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name VARCHAR(255) NOT NULL,
  domain VARCHAR(100) UNIQUE NOT NULL,
  gst_cin VARCHAR(50),
  address TEXT,
  verification_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE hr_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE employment_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES users(id),
  company_id UUID REFERENCES companies(id),
  job_title VARCHAR(100),
  start_date DATE,
  end_date DATE,
  hr_contact JSONB,
  documents TEXT[],
  status VARCHAR(20) DEFAULT 'pending',
  verification_id UUID,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE hr_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employment_claim_id UUID REFERENCES employment_claims(id),
  hr_account_id UUID REFERENCES hr_accounts(id),
  ratings JSONB,
  feedback TEXT,
  decision VARCHAR(20),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE consent_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES users(id),
  requester_type VARCHAR(20),
  scope TEXT[],
  status VARCHAR(20),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester UUID REFERENCES hr_accounts(id),
  target UUID REFERENCES users(id),
  reason TEXT,
  requested_scope TEXT[],
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_role VARCHAR(20),
  action VARCHAR(50),
  entity_type VARCHAR(50),
  entity_id UUID,
  diff JSONB,
  hash_chain_prev TEXT,
  hash_chain_curr TEXT,
  created_at TIMESTAMP DEFAULT now(),
  ip VARCHAR(50)
);

CREATE TABLE fraud_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50),
  entity_id UUID,
  type VARCHAR(50),
  severity VARCHAR(20),
  details TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  plan VARCHAR(50),
  status VARCHAR(20),
  renew_at TIMESTAMP,
  limits JSONB,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  channel VARCHAR(20),
  type VARCHAR(50),
  payload JSONB,
  sent_at TIMESTAMP,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT now()
);

-- NEW: Jobs posted by HR
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  title VARCHAR(150) NOT NULL,
  location VARCHAR(150),
  skills TEXT,
  salary_range VARCHAR(100),
  wid_status_req VARCHAR(50),
  min_rating INT,
  deadline DATE,
  created_at TIMESTAMP DEFAULT now()
);

-- NEW: Applications by candidates
CREATE TABLE job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES jobs(id),
  candidate_id UUID REFERENCES users(id),
  status VARCHAR(30) DEFAULT 'new',
  applied_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_claim_status ON employment_claims(status);
CREATE INDEX idx_verif_decision ON hr_verifications(decision);
CREATE INDEX idx_access_status ON access_requests(status);