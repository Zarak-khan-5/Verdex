-- ============================================================
-- Verdex Row-Level Security (RLS) Policies
-- ============================================================

-- ============================================================
-- 1. Enable RLS on all tables
-- ============================================================
ALTER TABLE Users ENABLE ROW LEVEL SECURITY;
ALTER TABLE Sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE Routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE CarbonRecords ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. Users Policies
-- ============================================================

-- Users can read their own row
CREATE POLICY users_read_own ON Users
    FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can read all users
CREATE POLICY users_admin_read_all ON Users
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM Users u
            WHERE u.user_id = auth.uid()
              AND u.role = 'admin'
        )
    );

-- ============================================================
-- 3. Sessions Policies
-- ============================================================

-- Users can manage (SELECT, INSERT, UPDATE, DELETE) their own sessions
CREATE POLICY sessions_user_manage_own ON Sessions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Admins can read all sessions
CREATE POLICY sessions_admin_read_all ON Sessions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM Users u
            WHERE u.user_id = auth.uid()
              AND u.role = 'admin'
        )
    );

-- ============================================================
-- 4. Routes Policies
-- ============================================================

-- Users can CRUD their own routes
CREATE POLICY routes_user_crud_own ON Routes
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Clients can read all routes for analytics
CREATE POLICY routes_client_read_all ON Routes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM Users u
            WHERE u.user_id = auth.uid()
              AND u.role = 'client'
        )
    );

-- ============================================================
-- 5. CarbonRecords Policies
-- ============================================================

-- Users can read their own carbon records
CREATE POLICY carbon_records_user_read_own ON CarbonRecords
    FOR SELECT
    USING (auth.uid() = user_id);

-- Clients can read all carbon records
CREATE POLICY carbon_records_client_read_all ON CarbonRecords
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM Users u
            WHERE u.user_id = auth.uid()
              AND u.role = 'client'
        )
    );
