-- ============================================================
-- Verdex Database Schema (3NF PostgreSQL)
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. Users Table
-- ============================================================
CREATE TABLE Users (
    user_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role        VARCHAR(20) CHECK (role IN ('user', 'client', 'admin')) DEFAULT 'user',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. Sessions Table
-- ============================================================
CREATE TABLE Sessions (
    session_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    last_active TIMESTAMPTZ DEFAULT NOW(),
    is_active   BOOLEAN DEFAULT true
);

-- ============================================================
-- 3. Routes Table
-- ============================================================
CREATE TABLE Routes (
    route_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    source_coords   JSONB NOT NULL,
    dest_coords     JSONB NOT NULL,
    mode            VARCHAR(50),
    total_time_mins INTEGER,
    co2_saved_kg    DECIMAL(10, 2),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. CarbonRecords Table
-- ============================================================
CREATE TABLE CarbonRecords (
    record_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES Users(user_id) ON DELETE CASCADE,
    route_id    UUID REFERENCES Routes(route_id) ON DELETE SET NULL,
    co2_saved   DECIMAL(10, 2) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. Demo Session Limit Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION enforce_demo_limit()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM Sessions WHERE last_active < NOW() - INTERVAL '10 minutes';
    IF (SELECT COUNT(*) FROM Sessions WHERE is_active = true) >= 10 THEN
        RAISE EXCEPTION 'Demo environment capacity reached (Max 10).';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_limit_sessions
BEFORE INSERT ON Sessions
FOR EACH ROW EXECUTE FUNCTION enforce_demo_limit();

-- ============================================================
-- 6. Indexes
-- ============================================================
CREATE INDEX idx_sessions_is_active ON Sessions(is_active);
CREATE INDEX idx_routes_user_id ON Routes(user_id);
CREATE INDEX idx_carbon_records_user_id ON CarbonRecords(user_id);
