-- =====================================================================
-- MIGRATION 001: Initial Setup
-- Created: 2025-01-22
-- Description: Initial database schema setup
-- =====================================================================

-- Run all schema files in order
\i ../01-core-schema.sql
\i ../02-functions.sql
\i ../03-triggers.sql
\i ../04-indexes.sql
\i ../05-rls-policies.sql

-- Optional: Run utilities (comment out if not needed)
-- \i ../06-utilities.sql

-- Verify setup
SELECT get_system_status(); 