# Database Schema Overview

## Entity Relationship Diagram

```
┌─────────────┐
│    users    │
│─────────────│
│ id (PK)     │
│ created_at  │
│ username    │
│ preferences │
│ auth_user_id│
└──────┬──────┘
       │
       │ 1:N
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌──────────────┐  ┌─────────────────┐
│mood_checkins │  │ mood_wall_posts │
│──────────────│  │─────────────────│
│ id (PK)      │  │ id (PK)         │
│ user_id (FK) │  │ user_id (FK)    │
│ mood_value   │  │ mood_value      │
│ emoji        │  │ message         │
│ timestamp    │  │ timestamp       │
│ is_anonymous │  │ encouragement_  │
│              │  │   count         │
└──────────────┘  └────────┬────────┘
                            │
                            │ 1:N
                            │
                            ▼
                   ┌─────────────────┐
                   │ encouragements   │
                   │─────────────────│
                   │ id (PK)         │
                   │ from_user_id(FK)│
                   │ to_post_id (FK) │
                   │ message         │
                   │ timestamp       │
                   └─────────────────┘

┌─────────────────┐
│  ai_responses   │
│─────────────────│
│ id (PK)         │
│ mood_category   │
│ mood_range_*    │
│ message         │
│ usage_count     │
└─────────────────┘
(Standalone - cached responses)
```

## Table Details

### users
**Purpose**: User profiles and authentication

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique user identifier |
| created_at | TIMESTAMP | DEFAULT NOW() | Account creation time |
| username_optional | TEXT | NULLABLE | Optional display name |
| preferences | JSONB | DEFAULT '{}' | User settings (theme, notifications, etc.) |
| auth_user_id | UUID | FK → auth.users | Links to Supabase Auth |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update time |

**Indexes**: `auth_user_id`, `username_optional`

---

### mood_checkins
**Purpose**: Daily mood tracking entries

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique check-in ID |
| user_id | UUID | FK → users, NOT NULL | Owner of check-in |
| mood_value | INTEGER | CHECK (1-10) | Mood rating (1=low, 10=high) |
| emoji | TEXT | NULLABLE | Associated emoji |
| timestamp | TIMESTAMP | DEFAULT NOW() | When mood was recorded |
| is_anonymous | BOOLEAN | DEFAULT false | Privacy setting |
| notes | TEXT | NULLABLE | Optional notes |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation |

**Indexes**: `user_id`, `timestamp`, `(user_id, timestamp)`, `mood_value`

---

### mood_wall_posts
**Purpose**: Public anonymous mood posts

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique post ID |
| user_id | UUID | FK → users, NOT NULL | Post author |
| mood_value | INTEGER | CHECK (1-10) | Mood rating |
| message_optional | TEXT | NULLABLE | Optional message |
| timestamp | TIMESTAMP | DEFAULT NOW() | Post time |
| encouragement_count | INTEGER | DEFAULT 0 | Auto-updated count |
| emoji | TEXT | NULLABLE | Associated emoji |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation |

**Indexes**: `user_id`, `timestamp`, `mood_value`, `encouragement_count`

**Triggers**: Auto-updates `encouragement_count` when encouragements change

---

### encouragements
**Purpose**: Peer-to-peer support messages

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique encouragement ID |
| from_user_id | UUID | FK → users, NOT NULL | Sender |
| to_post_id | UUID | FK → mood_wall_posts, NOT NULL | Target post |
| message | TEXT | NULLABLE | Encouragement message |
| timestamp | TIMESTAMP | DEFAULT NOW() | When sent |
| created_at | TIMESTAMP | DEFAULT NOW() | Record creation |

**Constraints**: UNIQUE(`from_user_id`, `to_post_id`) - One per user per post

**Indexes**: `from_user_id`, `to_post_id`, `timestamp`

**Triggers**: Updates `mood_wall_posts.encouragement_count`

---

### ai_responses
**Purpose**: Cached AI-generated supportive messages

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique response ID |
| mood_category | TEXT | NOT NULL | Category name |
| mood_range_start | INTEGER | CHECK (1-10) | Start of mood range |
| mood_range_end | INTEGER | CHECK (1-10) | End of mood range |
| message | TEXT | NOT NULL | Supportive message |
| created_at | TIMESTAMP | DEFAULT NOW() | Creation time |
| updated_at | TIMESTAMP | DEFAULT NOW() | Last update |
| usage_count | INTEGER | DEFAULT 0 | Usage tracking |

**Indexes**: `mood_category`, `(mood_range_start, mood_range_end)`

**Helper Function**: `get_ai_response_by_mood(mood_val INTEGER)` - Returns random response for mood value

---

## Relationships

1. **users → mood_checkins**: One-to-Many
   - A user can have many mood check-ins
   - Check-ins are deleted when user is deleted (CASCADE)

2. **users → mood_wall_posts**: One-to-Many
   - A user can create many wall posts
   - Posts are deleted when user is deleted (CASCADE)

3. **users → encouragements**: One-to-Many (as sender)
   - A user can send many encouragements
   - Encouragements are deleted when sender is deleted (CASCADE)

4. **mood_wall_posts → encouragements**: One-to-Many
   - A post can receive many encouragements
   - Encouragements are deleted when post is deleted (CASCADE)

5. **ai_responses**: Standalone
   - No foreign key relationships
   - Cached data for performance

## Row Level Security (RLS)

All tables have RLS enabled with the following policies:

- **users**: Users can only view/update their own profile
- **mood_checkins**: Users can only manage their own check-ins
- **mood_wall_posts**: Public read, users can only create/update their own
- **encouragements**: Public read, authenticated users can create, users can delete their own
- **ai_responses**: Public read (cached data)

## Performance Optimizations

1. **Indexes** on frequently queried columns:
   - User lookups
   - Timestamp-based sorting
   - Mood value filtering
   - Encouragement count sorting

2. **Triggers** for automatic updates:
   - Encouragement count maintenance
   - Updated_at timestamps

3. **Caching** via `ai_responses` table:
   - Reduces API calls
   - Faster response times
   - Usage tracking for optimization

## Common Queries

### Get user's recent check-ins
```sql
SELECT * FROM mood_checkins 
WHERE user_id = 'user-uuid' 
ORDER BY timestamp DESC 
LIMIT 10;
```

### Get mood wall posts (recent)
```sql
SELECT * FROM mood_wall_posts 
ORDER BY timestamp DESC 
LIMIT 20;
```

### Get encouragements for a post
```sql
SELECT e.*, u.username_optional 
FROM encouragements e
JOIN users u ON e.from_user_id = u.id
WHERE e.to_post_id = 'post-uuid'
ORDER BY e.timestamp DESC;
```

### Get AI response for mood
```sql
SELECT * FROM get_ai_response_by_mood(7);
```
