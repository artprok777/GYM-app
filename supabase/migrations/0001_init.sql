-- gym-tracker cloud schema
-- Single-user shortcut: RLS disabled, user_id from VITE_USER_ID env.
-- All tables mirror src/db/schema.ts plus user_id, updated_at, deleted_at.

create table programs (
  id text primary key,
  user_id text not null,
  name text not null,
  created_at bigint not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index programs_user_updated_idx on programs (user_id, updated_at);

create table workout_types (
  id text primary key,
  user_id text not null,
  program_id text not null,
  name text not null,
  "order" integer not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index workout_types_user_updated_idx on workout_types (user_id, updated_at);
create index workout_types_program_idx on workout_types (program_id);

create table schedule (
  user_id text not null,
  day_of_week smallint not null,
  workout_type_id text,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, day_of_week)
);
create index schedule_user_updated_idx on schedule (user_id, updated_at);

create table exercises (
  id text primary key,
  user_id text not null,
  workout_type_id text not null,
  name text not null,
  target_sets integer not null,
  target_reps integer,
  target_weight double precision,
  "order" integer not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index exercises_user_updated_idx on exercises (user_id, updated_at);
create index exercises_workout_type_idx on exercises (workout_type_id);

create table sessions (
  id text primary key,
  user_id text not null,
  date bigint not null,
  workout_type_id text not null,
  notes text,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index sessions_user_updated_idx on sessions (user_id, updated_at);
create index sessions_date_idx on sessions (date);

create table logged_sets (
  id text primary key,
  user_id text not null,
  session_id text not null,
  exercise_name text not null,
  weight double precision not null,
  reps integer not null,
  set_number integer not null,
  logged_at bigint not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index logged_sets_user_updated_idx on logged_sets (user_id, updated_at);
create index logged_sets_session_idx on logged_sets (session_id);
create index logged_sets_exercise_name_idx on logged_sets (exercise_name);

-- Auto-update updated_at on row mutations.
create or replace function bump_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare t text;
begin
  for t in select unnest(array['programs','workout_types','schedule','exercises','sessions','logged_sets'])
  loop
    execute format(
      'create trigger %I_bump_updated before update on %I for each row execute function bump_updated_at()',
      t, t
    );
  end loop;
end$$;

-- Enable realtime replication for all sync tables.
alter publication supabase_realtime add table programs, workout_types, schedule, exercises, sessions, logged_sets;
