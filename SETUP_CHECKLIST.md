# 🚀 Supabase Chat Database Setup Checklist

## Fresh Database Setup Guide

### Step 1: Create New Supabase Project
- [ ] Create new project at [supabase.com](https://supabase.com)
- [ ] Note your Project URL and API keys
- [ ] Wait for project to be fully initialized

### Step 2: Run Database Schema
- [ ] Go to SQL Editor in Supabase dashboard
- [ ] Copy and paste the entire `src/database-v2.sql` file
- [ ] Click "Run" to execute the schema
- [ ] Verify no errors in execution

### Step 3: Verify Installation
Run this query in SQL Editor:
```sql
SELECT get_system_status();
```

✅ **Expected Results:**
- `database_status`: "healthy"
- `tables_created`: 5+
- `rls_enabled`: true
- `realtime_tables`: 5+

### Step 4: Configure Authentication
In Supabase Dashboard → Authentication:
- [ ] Enable Email provider
- [ ] Set up email templates (optional)
- [ ] Configure password requirements
- [ ] Enable any social providers you need

### Step 5: Set Up Storage (for file uploads)
In Supabase Dashboard → Storage:
- [ ] Create bucket named `chat-attachments`
- [ ] Set upload policies
- [ ] Configure max file size (suggested: 10MB)

### Step 6: Test Core Features

#### 6a. Sign Up First User
- Use your app or Supabase Auth UI
- Profile will be auto-created

#### 6b. Verify Features Work
Run this query after user signup:
```sql
SELECT verify_chat_features();
```

✅ **Expected Result:** 
```json
{
  "status": "success",
  "message": "All chat features verified successfully"
}
```

### Step 7: Optional Demo Data
To create sample rooms and messages:
```sql
SELECT setup_demo_data();
```

## 🔧 Client Integration

### Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### Basic Setup
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_PROJECT_URL'
const supabaseKey = 'YOUR_ANON_KEY'

const supabase = createClient(supabaseUrl, supabaseKey)
```

### Test Authentication
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123'
})
```

### Test Room Creation
```typescript
const { data: room, error } = await supabase
  .from('groups')
  .insert({
    name: 'My First Room',
    description: 'Testing the chat app',
    is_private: false
  })
  .select()
```

### Test Messaging
```typescript
const { data: message, error } = await supabase
  .from('messages')
  .insert({
    group_id: room.id,
    content: 'Hello world! 👋',
    message_type: 'text'
  })
```

### Test Real-time
```typescript
supabase
  .channel('messages')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'messages' },
    (payload) => console.log('New message:', payload.new)
  )
  .subscribe()
```

## 🧪 Testing Checklist

- [ ] User can sign up/sign in
- [ ] Profile is auto-created
- [ ] User can create rooms
- [ ] User can send messages
- [ ] Real-time updates work
- [ ] Typing indicators work
- [ ] Reactions work
- [ ] Invitations work
- [ ] File uploads work (if implemented)

## 🎯 Performance Monitoring

### Daily Maintenance
```sql
SELECT cleanup_expired_data();
```

### Weekly Health Check
```sql
SELECT get_system_status();
SELECT analyze_chat_tables();
```

### Monitor Slow Queries
```sql
SELECT * FROM get_slow_queries();
```

## 🚨 Troubleshooting

### Common Issues:

**1. RLS Policy Errors**
- Make sure user is authenticated
- Check if user has proper permissions

**2. Real-time Not Working**
- Verify realtime is enabled in project settings
- Check if tables are in publication

**3. Profile Not Created**
- Check if trigger fired after user signup
- Manually run: `SELECT handle_new_user()`

**4. Performance Issues**
- Run: `SELECT analyze_chat_tables()`
- Check slow queries
- Consider partitioning for high volume

### Get Help:
- Check Supabase docs
- Review error logs in dashboard
- Use verification functions provided

## ✅ Success Criteria

Your chat app is ready when:
- [ ] All verification functions pass
- [ ] Users can authenticate
- [ ] Rooms can be created
- [ ] Messages send in real-time
- [ ] All core features work smoothly

🎉 **Congratulations! Your chat database is production-ready!** 