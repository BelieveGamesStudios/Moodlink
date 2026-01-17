# Supabase Database Setup

This directory contains the database schema and migrations for the Moodlink app.

## Quick Setup

1. **Go to your Supabase Dashboard**: [https://app.supabase.com](https://app.supabase.com)
2. **Select your project**
3. **Navigate to SQL Editor** (left sidebar)
4. **Click "New Query"**
5. **Copy and paste** the contents of `migrations/001_initial_schema.sql`
6. **Click "Run"** to execute the migration
7. **IMPORTANT**: Run `migrations/003_fix_user_profile_creation.sql` to fix RLS policy for user signup

## Database Schema

### Tables

#### 1. `users`
Stores user profiles and preferences.
- `id` (UUID, Primary Key)
- `created_at` (Timestamp)
- `username_optional` (Text, nullable)
- `preferences` (JSONB) - Store user preferences like theme, notifications, etc.
- `auth_user_id` (UUID) - Links to Supabase Auth user
- `updated_at` (Timestamp)

#### 2. `mood_checkins`
Daily mood check-ins from users.
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users)
- `mood_value` (Integer, 1-10)
- `emoji` (Text, nullable)
- `timestamp` (Timestamp)
- `is_anonymous` (Boolean)
- `notes` (Text, nullable)
- `created_at` (Timestamp)

#### 3. `mood_wall_posts`
Anonymous mood posts visible on the public mood wall.
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key → users)
- `mood_value` (Integer, 1-10)
- `message_optional` (Text, nullable)
- `timestamp` (Timestamp)
- `encouragement_count` (Integer) - Auto-updated via trigger
- `emoji` (Text, nullable)
- `created_at` (Timestamp)

#### 4. `encouragements`
Peer-to-peer encouragement messages.
- `id` (UUID, Primary Key)
- `from_user_id` (UUID, Foreign Key → users)
- `to_post_id` (UUID, Foreign Key → mood_wall_posts)
- `message` (Text, nullable)
- `timestamp` (Timestamp)
- `created_at` (Timestamp)
- **Unique constraint**: One encouragement per user per post

#### 5. `ai_responses`
Cached AI-generated supportive messages.
- `id` (UUID, Primary Key)
- `mood_category` (Text) - e.g., "happy", "sad", "anxious"
- `mood_range_start` (Integer, 1-10)
- `mood_range_end` (Integer, 1-10)
- `message` (Text)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)
- `usage_count` (Integer) - Track how often responses are used

## Features

### Automatic Updates
- **Encouragement Count**: Automatically updated when encouragements are added/removed
- **Updated At**: Automatically updated on record modifications

### Row Level Security (RLS)
All tables have RLS enabled with policies for:
- Users can manage their own data
- Public read access for mood wall posts and encouragements
- Authenticated users can create encouragements
- AI responses are publicly readable

### Indexes
Optimized indexes for:
- User lookups
- Timestamp-based queries
- Mood value filtering
- Encouragement count sorting

## Next Steps

After running the migration:

1. **Test the schema**: Create a test user and insert some sample data
2. **Customize RLS policies**: Adjust policies based on your specific security requirements
3. **Seed AI responses**: Insert some initial AI response templates
4. **Set up triggers**: The migration includes triggers, but you may want to customize them

## Troubleshooting

### Error: "extension uuid-ossp does not exist"
This is already handled in the migration with `CREATE EXTENSION IF NOT EXISTS`.

### Error: "relation already exists"
The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

### RLS blocking queries
Check your authentication status and ensure the RLS policies match your use case. You may need to adjust policies for development.

## Development Tips

1. **Disable RLS for testing**: You can temporarily disable RLS with:
   ```sql
   ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;
   ```

2. **View all tables**: 
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```

3. **Check RLS policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'your_table_name';
   ```
