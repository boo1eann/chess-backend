CREATE TABLE IF NOT EXISTS users (
	id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
	email CITEXT UNIQUE NOT NULL,
	username VARCHAR(30) UNIQUE NOT NULL,
	password_hash VARCHAR(255),

	-- Profile
	avatar_url VARCHAR(500),

	-- Auth status
	is_email_verified BOOLEAN NOT NULL DEFAULT FALSE,
	is_active BOOLEAN NOT NULL DEFAULT TRUE,
	is_banned BOOLEAN NOT NULL DEFAULT FALSE,
	ban_reason TEXT,

	-- OAuth
	google_id VARCHAR(255) UNIQUE,

	-- Security
	failed_login_attemps INT NOT NULL DEFAULT 0,
	locked_until TIMESTAMPTZ,
	password_changed_at TIMESTAMPTZ,

	-- Metadata
	last_login_at TIMESTAMPTZ,
	last_login_ip INET,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();