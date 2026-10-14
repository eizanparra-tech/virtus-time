-- =============================================================================
-- VIRTUS TIME — Migración inicial
-- Crea: tipos, tablas, índices y triggers.
-- =============================================================================
-- Cómo ejecutar esta migración:
--   Opción A (recomendada): Supabase Dashboard > SQL Editor > pegar y ejecutar
--   Opción B: Supabase CLI  ->  supabase db push
-- =============================================================================
--
-- MODELO DE ACCESO (léelo antes de tocar nada):
-- VIRTUS TIME usa "perfiles" en vez de cuentas con contraseña: cada socio
-- aparece en una lista y entra tocando su nombre. No hay contraseñas que
-- comprobar en la base de datos.
--
-- Por eso, TODO el acceso a estas tablas se hace desde el servidor de
-- Next.js con la clave "service_role" (ver src/lib/supabase/db.ts), que
-- se salta la seguridad por fila (RLS). El servidor es quien decide qué
-- puede hacer cada persona, mirando la sesión guardada en una cookie
-- firmada (ver src/lib/session.ts).
--
-- Dejamos RLS activado en todas las tablas pero SIN políticas: así, si
-- alguna vez el navegador intentara hablar directamente con Supabase (con
-- la clave pública), no conseguiría leer ni escribir nada. Es una red de
-- seguridad adicional, no la protección principal.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- EXTENSIONES
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- -----------------------------------------------------------------------------
-- TIPOS (ENUMS)
-- -----------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('admin', 'socio');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.project_status as enum ('activo', 'pausado', 'finalizado', 'archivado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.task_status as enum ('pendiente', 'en_proceso', 'completada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.activity_status as enum ('en_proceso', 'finalizada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.report_status as enum ('generando', 'completado', 'error');
exception when duplicate_object then null; end $$;

-- -----------------------------------------------------------------------------
-- TABLA: app_settings
-- Fila única de configuración global. Se usa para saber si ya existe el
-- primer perfil (configuración inicial) y para guardar ajustes generales.
-- -----------------------------------------------------------------------------
create table if not exists public.app_settings (
  id boolean primary key default true,
  setup_completed boolean not null default false,
  company_name text not null default 'VIRTUS COMPANY',
  week_start_day text not null default 'monday',
  timezone text not null default 'Europe/Madrid',
  updated_at timestamptz not null default now(),
  constraint app_settings_singleton check (id)
);

insert into public.app_settings (id, setup_completed)
values (true, false)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- TABLA: profiles
-- Un perfil por cada socio. NO está ligada a ningún sistema de login: es
-- simplemente la lista de personas que aparece en la pantalla de entrada.
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apellidos text not null default '',
  email text,
  avatar_url text,
  rol public.user_role not null default 'socio',
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_rol on public.profiles (rol);
create index if not exists idx_profiles_activo on public.profiles (activo);

-- -----------------------------------------------------------------------------
-- TABLA: projects
-- -----------------------------------------------------------------------------
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  color text not null default '#1e3a8a',
  estado public.project_status not null default 'activo',
  fecha_inicio date not null default current_date,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_projects_estado on public.projects (estado);

-- -----------------------------------------------------------------------------
-- TABLA: project_members
-- Relación muchos a muchos entre socios y proyectos.
-- -----------------------------------------------------------------------------
create table if not exists public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create index if not exists idx_project_members_user on public.project_members (user_id);

-- -----------------------------------------------------------------------------
-- TABLA: tasks
-- Tareas organizadas dentro de un proyecto (opcionales, no obligatorias).
-- -----------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  titulo text not null,
  descripcion text,
  responsable_id uuid references public.profiles (id) on delete set null,
  estado public.task_status not null default 'pendiente',
  fecha_limite date,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_project on public.tasks (project_id);
create index if not exists idx_tasks_estado on public.tasks (estado);

-- -----------------------------------------------------------------------------
-- TABLA: time_entries
-- El corazón de la aplicación: cada registro de tiempo (cronómetro o manual).
-- Mientras hora_fin es NULL, el cronómetro está activo (en marcha o en pausa).
-- -----------------------------------------------------------------------------
create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete restrict,
  task_id uuid references public.tasks (id) on delete set null,
  descripcion text not null default '',
  estado public.activity_status not null default 'en_proceso',
  fecha date not null default current_date,
  hora_inicio timestamptz not null default now(),
  hora_fin timestamptz,
  -- Segundos acumulados de trabajo efectivo (descontando pausas).
  duracion_segundos integer not null default 0,
  -- Marca de tiempo del último "reanudar" mientras el cronómetro está corriendo.
  -- NULL cuando el cronómetro está en pausa o finalizado.
  running_since timestamptz,
  es_manual boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint time_entries_duracion_valida check (duracion_segundos >= 0),
  constraint time_entries_fin_posterior check (hora_fin is null or hora_fin >= hora_inicio)
);

create index if not exists idx_time_entries_user on public.time_entries (user_id);
create index if not exists idx_time_entries_project on public.time_entries (project_id);
create index if not exists idx_time_entries_fecha on public.time_entries (fecha);
create index if not exists idx_time_entries_user_fecha on public.time_entries (user_id, fecha);

-- Un socio no puede tener dos cronómetros activos (hora_fin IS NULL) a la vez.
create unique index if not exists uq_time_entries_un_cronometro_activo
  on public.time_entries (user_id)
  where (hora_fin is null);

-- -----------------------------------------------------------------------------
-- TABLA: time_entry_history
-- Historial de cambios sobre registros de tiempo (para que el administrador
-- pueda corregir registros manteniendo trazabilidad).
-- -----------------------------------------------------------------------------
create table if not exists public.time_entry_history (
  id uuid primary key default gen_random_uuid(),
  time_entry_id uuid not null references public.time_entries (id) on delete cascade,
  changed_by uuid references public.profiles (id) on delete set null,
  campo text not null,
  valor_anterior text,
  valor_nuevo text,
  changed_at timestamptz not null default now()
);

create index if not exists idx_time_entry_history_entry on public.time_entry_history (time_entry_id);

-- -----------------------------------------------------------------------------
-- TABLA: weekly_reports
-- Un informe general por semana (lunes-domingo, Europe/Madrid).
-- -----------------------------------------------------------------------------
create table if not exists public.weekly_reports (
  id uuid primary key default gen_random_uuid(),
  semana_inicio date not null,
  semana_fin date not null,
  status public.report_status not null default 'generando',
  resumen_general jsonb not null default '{}'::jsonb,
  conclusiones jsonb not null default '{}'::jsonb,
  generated_at timestamptz,
  regenerated_at timestamptz,
  created_at timestamptz not null default now(),

  constraint weekly_reports_semana_valida check (semana_fin = semana_inicio + 6),
  constraint uq_weekly_reports_semana unique (semana_inicio)
);

-- -----------------------------------------------------------------------------
-- TABLA: weekly_project_reports
-- Desglose por proyecto dentro de un informe semanal.
-- -----------------------------------------------------------------------------
create table if not exists public.weekly_project_reports (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.weekly_reports (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  horas_totales numeric(10, 2) not null default 0,
  datos jsonb not null default '{}'::jsonb,
  resumen_texto text,
  created_at timestamptz not null default now(),

  constraint uq_weekly_project_reports unique (report_id, project_id)
);

create index if not exists idx_weekly_project_reports_report on public.weekly_project_reports (report_id);

-- -----------------------------------------------------------------------------
-- TABLA: weekly_member_reports
-- Desglose por socio dentro de un informe semanal.
-- -----------------------------------------------------------------------------
create table if not exists public.weekly_member_reports (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.weekly_reports (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  horas_totales numeric(10, 2) not null default 0,
  dias_con_actividad integer not null default 0,
  datos jsonb not null default '{}'::jsonb,
  resumen_texto text,
  created_at timestamptz not null default now(),

  constraint uq_weekly_member_reports unique (report_id, user_id)
);

create index if not exists idx_weekly_member_reports_report on public.weekly_member_reports (report_id);

-- -----------------------------------------------------------------------------
-- FUNCIÓN AUXILIAR: updated_at automático
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

drop trigger if exists trg_tasks_updated_at on public.tasks;
create trigger trg_tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

drop trigger if exists trg_time_entries_updated_at on public.time_entries;
create trigger trg_time_entries_updated_at before update on public.time_entries
  for each row execute function public.set_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY — activada, sin políticas (ver nota al principio del
-- archivo). El servidor de Next.js accede con la clave service_role, que
-- no pasa por RLS, así que estas tablas quedan cerradas a cualquier otro
-- acceso.
-- =============================================================================

alter table public.app_settings enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
alter table public.time_entries enable row level security;
alter table public.time_entry_history enable row level security;
alter table public.weekly_reports enable row level security;
alter table public.weekly_project_reports enable row level security;
alter table public.weekly_member_reports enable row level security;

-- =============================================================================
-- FIN DE LA MIGRACIÓN INICIAL
-- =============================================================================
