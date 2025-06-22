-- =====================================================================
-- MASTER SETUP SCRIPT
-- Run this file to set up the entire database schema
-- =====================================================================

-- Core schema (tables and types)
\i 01-core-schema.sql

-- Functions
\i 02-functions.sql

-- Triggers
\i 03-triggers.sql

-- Performance indexes
\i 04-indexes.sql

-- Row Level Security policies
\i 05-rls-policies.sql

-- Optional utilities (uncomment if needed)
-- \i 06-utilities.sql

-- Verify the setup
SELECT 'Database setup complete!' as status;
SELECT get_system_status(); 