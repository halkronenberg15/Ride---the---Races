# Supabase Backend Model

Project: **RTR Mission Platform**

The live Supabase project already contains the shared athlete identity and ride/event infrastructure created in September 2026. The 4.1 backend work extends that model instead of introducing a second rider identity or duplicate rides table.

## Existing live foundation

Already present in production Supabase:

- `athlete_profiles` keyed by `athlete_id`, linked to `auth.users` through `user_id`
- `rides` keyed by `ride_id`, linked to `athlete_profiles.athlete_id`
- `athlete_events`
- `processed_events`
- `sync_cursors`
- `legacy_profile_imports`

This remains the authoritative identity/sync foundation.

## New 4.1 extension tables

### rider_state
One current-state document per athlete for product state that is not yet normalized.

- athlete_id uuid primary key
- schema_version integer
- rider jsonb
- equipment jsonb
- season jsonb
- settings jsonb
- updated_at timestamptz

### training_plans
Versioned plans rather than overwriting history.

- id uuid primary key
- athlete_id uuid
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
- athlete_id uuid
- date date
- entry jsonb
- created_at timestamptz
- updated_at timestamptz

### nutrition_entries
One row per logged food/drink entry.

- id uuid primary key
- athlete_id uuid
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
- athlete_id uuid
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

- athlete_id uuid
- recipe_id text
- saved_at timestamptz
- times_planned integer
- times_cooked integer
- rating integer
- primary key (athlete_id, recipe_id)

### readiness_entries
Recovery/readiness evidence.

- id uuid primary key
- athlete_id uuid
- date date
- entry jsonb
- created_at timestamptz

### benchmark_blocks
Block-to-block comparison records.

- id uuid primary key
- athlete_id uuid
- block_key text
- label text
- starts_on date
- ends_on date
- metrics jsonb
- notes text
- created_at timestamptz

## Security

Every new athlete-owned table uses Row Level Security by resolving the authenticated Supabase user through `athlete_profiles`:

```sql
athlete_id in (
  select ap.athlete_id
  from public.athlete_profiles ap
  where ap.user_id = (select auth.uid())
)
```

That keeps ownership aligned with the existing shared-athlete model. No rider can read or write another rider's private rows.

## Migration strategy

1. User authenticates through Supabase Auth.
2. Resolve `athlete_id` from `athlete_profiles.user_id`.
3. Local CareerState remains authoritative for the first migration session.
4. Decompose CareerState into the existing `rides` model plus the new training/nutrition/readiness tables.
5. Compare row counts and key metrics.
6. Write a migration receipt locally.
7. Remote data becomes authoritative only after validation succeeds.
8. Local storage remains a startup/offline cache.

## Important compatibility rule

The repository must not create a parallel identity model. All future remote persistence code should use `athlete_id` as the backend ownership key and resolve it from the authenticated Supabase user.
