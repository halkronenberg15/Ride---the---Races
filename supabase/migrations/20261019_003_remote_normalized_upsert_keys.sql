alter table public.rides alter column ride_id set default gen_random_uuid();
alter table public.nutrition_entries alter column id set default gen_random_uuid();
alter table public.nutrition_templates alter column id set default gen_random_uuid();

create unique index if not exists rides_athlete_legacy_source_id_full_idx
  on public.rides(athlete_id, legacy_source_id);

create unique index if not exists nutrition_entries_athlete_local_id_full_idx
  on public.nutrition_entries(athlete_id, local_id);

create unique index if not exists nutrition_templates_athlete_local_id_full_idx
  on public.nutrition_templates(athlete_id, local_id);

create unique index if not exists training_journal_athlete_local_id_full_idx
  on public.training_journal(athlete_id, local_id);
