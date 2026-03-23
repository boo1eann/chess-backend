CREATE TABLE IF NOT EXISTS auth_audit_log (
	id BIGSERIAL PRIMARY KEY,
	user_id UUID REFERENCES users(id) ON DELETE SET NULL,
	event_type VARCHAR(50) NOT NULL,
	ip_address INET,
	user_agent TEXT,
	metadata JSONB,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON auth_audit_log(user_id);
CREATE INDEX idx_audit_log_event_type ON auth_audit_log(event_type);
CREATE INDEX idx_audit_log_created_at ON auth_audit_log(created_at);
CREATE INDEX idx_audit_log_ip_address ON auth_audit_log(ip_address);