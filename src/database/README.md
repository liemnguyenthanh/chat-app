# Database Schema Organization

## 📁 File Structure

```
src/database/
├── README.md                 # This file
├── setup.sql                 # Master setup script
├── 01-core-schema.sql       # Core tables and types (165 lines)
├── 02-functions.sql         # All database functions (140 lines)
├── 03-triggers.sql          # All triggers (30 lines)
├── 04-indexes.sql           # Performance indexes (40 lines)
├── 05-rls-policies.sql      # Row Level Security policies (200 lines)
├── 06-utilities.sql         # Utility functions (120 lines)
└── migrations/              # Database migrations
    ├── 001-initial-setup.sql
    └── ... (future migrations)
```

## 🚀 Quick Setup

### Option 1: Master Setup Script (Easiest)
```sql
-- Run the master setup script
\i src/database/setup.sql
```

### Option 2: Single File (Legacy)
```sql
-- Run the main schema file
\i src/database-v2.sql
```

### Option 3: Manual Step-by-Step
```sql
-- Run files in order
\i src/database/01-core-schema.sql
\i src/database/02-functions.sql
\i src/database/03-triggers.sql
\i src/database/04-indexes.sql
\i src/database/05-rls-policies.sql
```

## 📊 Current Schema Stats

- **Total Lines**: 695 (split across files vs 393 in single file)
- **Tables**: 13
- **Functions**: 9 core + 6 utilities
- **Triggers**: 6
- **Indexes**: 21
- **RLS Policies**: 24

## 🔧 Benefits of Modular Structure

### ✅ **Maintainability**
- Each file has a single responsibility
- Easy to find and modify specific components
- Clear separation of concerns

### ✅ **Team Collaboration**
- Multiple developers can work on different files
- Reduced merge conflicts
- Easier code reviews

### ✅ **Deployment Flexibility**
- Run only what you need
- Skip utilities if not required
- Easy to add new features

### ✅ **Documentation**
- Each file is well-documented
- Clear naming conventions
- Organized by functionality

## 📝 File Descriptions

### `01-core-schema.sql`
- **Purpose**: Core tables and data types
- **Contains**: All table definitions, constraints, and relationships
- **Dependencies**: None (run first)

### `02-functions.sql`
- **Purpose**: Database functions and business logic
- **Contains**: Trigger functions, utility functions, validation logic
- **Dependencies**: Core schema

### `03-triggers.sql`
- **Purpose**: Database triggers
- **Contains**: All triggers that automate database operations
- **Dependencies**: Functions

### `04-indexes.sql`
- **Purpose**: Performance optimization
- **Contains**: All indexes for query performance
- **Dependencies**: Core schema

### `05-rls-policies.sql`
- **Purpose**: Security and access control
- **Contains**: Row Level Security policies for all tables
- **Dependencies**: Functions (for helper functions)

### `06-utilities.sql` (Optional)
- **Purpose**: Additional utility functions
- **Contains**: Cleanup functions, status checks, migration helpers
- **Dependencies**: Core schema

## 🚀 Adding New Features

### 1. Adding a New Table
1. Add table definition to `01-core-schema.sql`
2. Add any functions to `02-functions.sql`
3. Add triggers to `03-triggers.sql`
4. Add indexes to `04-indexes.sql`
5. Add RLS policies to `05-rls-policies.sql`

### 2. Adding a New Feature
1. Create a new migration file in `migrations/`
2. Follow the same structure as existing files
3. Test thoroughly before applying to production

## 🧪 Testing

```sql
-- Test the setup
SELECT get_system_status();

-- Verify tables exist
SELECT count(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

## 📈 Migration Strategy

### Development → Staging → Production

1. **Development**: Test all changes thoroughly
2. **Staging**: Apply migrations and test with real data
3. **Production**: Apply during maintenance window

### Creating Migrations

```sql
-- migrations/002-add-new-feature.sql
-- =====================================================================
-- MIGRATION 002: Add New Feature
-- Created: YYYY-MM-DD
-- Description: Brief description of changes
-- =====================================================================

-- Your changes here
ALTER TABLE groups ADD COLUMN new_feature boolean default false;

-- Update indexes if needed
CREATE INDEX idx_groups_new_feature ON groups(new_feature);

-- Add RLS policies if needed
CREATE POLICY "New feature policy" ON groups FOR SELECT USING (true);
```

## 🔍 Troubleshooting

### Common Issues

1. **Functions not found**: Make sure `02-functions.sql` ran before `03-triggers.sql`
2. **RLS blocking queries**: Check policies in `05-rls-policies.sql`
3. **Performance issues**: Review indexes in `04-indexes.sql`

### Debugging Commands

```sql
-- Check function exists
SELECT proname FROM pg_proc WHERE proname = 'function_name';

-- Check trigger exists
SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_name';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'table_name';
```

## 🎯 Best Practices

1. **Always backup** before running migrations
2. **Test locally** before applying to production
3. **Document changes** in migration files
4. **Use transactions** for complex migrations
5. **Monitor performance** after applying changes

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the individual SQL files for documentation
3. Test with a fresh database to isolate issues 