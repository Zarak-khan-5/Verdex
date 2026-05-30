-- ============================================================
-- 03_hazard_events.sql
-- DDL for tracking Safety Wizard peak-hour severe hazard scans
-- ============================================================

CREATE TABLE IF NOT EXISTS HazardEvents (
    event_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id    UUID,
    route_type  VARCHAR(20) CHECK (route_type IN ('eco', 'alternative')),
    city        VARCHAR(50),
    severity    VARCHAR(20) CHECK (severity IN ('low', 'moderate', 'severe')),
    day_of_week VARCHAR(15),
    hour_of_day INTEGER CHECK (hour_of_day BETWEEN 0 AND 23),
    corridor    VARCHAR(255),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Index to optimize analytics aggregations
CREATE INDEX IF NOT EXISTS idx_hazard_events_city_created ON HazardEvents(city, created_at);
CREATE INDEX IF NOT EXISTS idx_hazard_events_route_type_severity ON HazardEvents(route_type, severity);
