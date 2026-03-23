CREATE TABLE IF NOT EXISTS refresh_tokens (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	token_hash VARCHAR(255) NOT NULL UNIQUE,
	family_id UUID NOT NULL,

	-- Device info
	device_name VARCHAR(255),
	device_type VARCHAR(50),
	ip_address INET,
	user_agent TEXT,

	-- Lifecycle
	expires_at TIMESTAMPTZ NOT NULL,
	is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
	revoked_at TIMESTAMPTZ,
	revoke_reason VARCHAR(100),

	-- Rotation tracking (detect token reuse attack)
	replaced_by_id UUID REFERENCES refresh_tokens(id),

	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_family_id ON refresh_tokens(family_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at) WHERE is_revoked = FALSE;