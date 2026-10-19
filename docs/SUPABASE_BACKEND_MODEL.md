# Supabase Backend Model

Project: **RTR Mission Platform**

This model is designed around account-backed rider data while preserving the current CareerState migration path.

## Core tables

### profiles
One row per authenticated rider.

- id uuid primary key, references auth.users(id)
- display_name text
- role text
- created_at timestamptz
- updated_at timestamptz

### rider_state
Small current-state document for values that are genuinely profile-level.

- user_id uuid primary key
- schema_version integer
- rider jsonb
- equipment jsonb
- season jsonb
- settings jsonb
- updated_at timestamptz

### training_plans
Versioned plans rather than overwriting history.

- id uuid primary key
- user_id uuid
- start_date date
- end_date date
- phase text
- version integer
- is_active boolean
- plan jsonb
- created_at timestamptz
- updated_at timestamptz

### training_journal
Structured journal snapshots/evidence.

- id uuid primary key
- user_id uuid
- date date
- entry jsonb
- created_at timestamptz
- updated_at timestamptz

### rides
One row per ride activity.

- id uuid primary key
- user_id uuid
- ridden_at timestamptz
- activity_type text
- source text
- duration_minutes integer
- distance_km numeric
- metrics jsonb
- notes text
- created_at timestamptz
- updated_at timestamptz

### nutrition_entries
One row per logged food/drink entry.

- id uuid primary key
- user_id uuid
- logged_at timestamptz
- date date
- meal_type text
- name text
- calories numeric
- protein_g numeric
- carbs_g numeric
- fluid_oz numeric
- metadata jsonb

### nutrition_templates
Remembered meals and aliases.

- id uuid primary key
- user_id uuid
- name text
- meal_type text
- calories numeric
- protein_g numeric
- carbs_g numeric
- fluid_oz numeric
- aliases text[]
- times_used integer
- last_used_at timestamptz

### recipe_preferences
Saved/cooked/rated recipe state.

- user_id uuid
- recipe_id text
- saved_at timestamptz
- times_planned integer
- times_cooked integer
- rating integer
- primary key (user_id, recipe_id)

### readiness_entries
Recovery/readiness evidence.

- id uuid primary key
- user_id uuid
- date date
- entry jsonb
- created_at timestamptz

### benchmark_blocks
Block-to-block comparison records.

- id uuid primary key
- user_id uuid
- block_key text
- label text
- starts_on date
- ends_on date
- metrics jsonb
- notes text
- created_at timestamptz

## Security

Every rider-owned table uses Row Level Security with:
```
auth.uid() = user_id
```

Profiles use:
```
auth.uid() = id
```

No rider can read or write another rider's private data.

## Migration strategy

1. User signs into Supabase Auth.
2. Local CareerState remains authoritative for the first migration session.
3. Data is decomposed into normalized backend rows.
4. A migration receipt is stored locally.
5. Remote data becomes authoritative after row counts and key metrics are verified.
6. Local storage remains an offline startup cache.
