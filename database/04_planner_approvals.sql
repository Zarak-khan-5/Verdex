-- ============================================================
-- 04_planner_approvals.sql
-- DDL for tracking pending City Planner (client) registrations
-- ============================================================

CREATE TABLE IF NOT EXISTS PendingPlanners (
    request_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ DEFAULT NOW()
);
