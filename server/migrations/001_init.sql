-- Users table: supports both email/password and Google OAuth
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),                              -- nullable: Google OAuth users don't have one
  google_id VARCHAR(255) UNIQUE,                           -- Google's unique user ID (null for local users)
  auth_provider VARCHAR(20) NOT NULL DEFAULT 'local',      -- 'local' or 'google'
  display_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Per-problem progress: one row per (user, problem) pair
CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  problem_id INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'not_started',
  solved_independently BOOLEAN DEFAULT false,
  solved_in_20_min BOOLEAN DEFAULT false,
  confidence INTEGER DEFAULT 0,
  attempt_count INTEGER DEFAULT 0,
  last_attempted TIMESTAMP,
  time_complexity VARCHAR(20),
  space_complexity VARCHAR(20),
  notes TEXT,
  saved_code_js TEXT,
  saved_code_python TEXT,
  UNIQUE(user_id, problem_id)
);

-- Refresh tokens: hashed for security, supports reuse detection
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash VARCHAR(64) NOT NULL UNIQUE,                  -- SHA-256 hash of the actual token
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT false,                              -- flipped to true after one use (reuse detection)
  created_at TIMESTAMP DEFAULT NOW()
);
