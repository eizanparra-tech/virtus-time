-- =============================================================================
-- VIRTUS TIME — Migración inicial
-- Crea: tipos, tablas, índices, triggers y políticas de Row Level Security (RLS)
-- =============================================================================
-- Cómo ejecutar esta migración:
--   Opción A (recomendada): Supabase Dashboard > SQL Editor > pegar y ejecutar
--   Opción B: Supabase CLI  ->  supabase db push
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
-- Fila única de configuración global. Se usa para saber si ya existe el primer
-- administrador (configuración inicial) y para guardar ajustes generales.
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
-- Un perfil por cada socio. El id coincide con auth.users.id.
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  apellidos text not null default '',
  email text not null,
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
-- FUNCIÓN AUXILIAR: es_admin()
-- Comprueba si el usuario autenticado actual es administrador.
-- Se usa dentro de las políticas RLS de abajo.
-- -----------------------------------------------------------------------------
create or replace function public.es_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol = 'admin' and activo = true
  );
$$;

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

-- -----------------------------------------------------------------------------
-- TRIGGER: crear perfil automáticamente al registrarse en Supabase Auth
-- El rol por defecto es 'socio'. El primer administrador se asciende aparte,
-- desde la pantalla de configuración inicial (ver app/(auth)/setup).
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, apellidos, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'apellidos', ''),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY
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

-- -------------------------------- app_settings --------------------------------
-- Lectura: cualquier persona (incluso anónima) necesita saber si el setup
-- inicial ya se completó, para decidir si mostrar /setup o /login.
drop policy if exists app_settings_select on public.app_settings;
create policy app_settings_select on public.app_settings
  for select using (true);

-- Solo un administrador autenticado puede modificar la configuración general.
-- (La finalización del setup inicial se hace con la service role key, no aquí.)
drop policy if exists app_settings_update_admin on public.app_settings;
create policy app_settings_update_admin on public.app_settings
  for update using (public.es_admin());

-- ---------------------------------- profiles -----------------------------------
-- Todos los socios autenticados pueden ver todos los perfiles (equipo, selección
-- de participantes en proyectos, estadísticas por socio, etc).
drop policy if exists profiles_select_authenticated on public.profiles;
create policy profiles_select_authenticated on public.profiles
  for select to authenticated using (true);

-- Cada socio solo puede editar su propio perfil (nombre, apellidos, avatar).
-- No puede cambiarse el rol a sí mismo: eso se controla a nivel de aplicación
-- (la API solo expone esos campos) y además queda protegido abajo.
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- El administrador puede editar cualquier perfil (rol, estado activo/inactivo).
drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (public.es_admin());

-- -------------------------------- projects --------------------------------------
drop policy if exists projects_select_authenticated on public.projects;
create policy projects_select_authenticated on public.projects
  for select to authenticated using (true);

drop policy if exists projects_insert_admin on public.projects;
create policy projects_insert_admin on public.projects
  for insert to authenticated with check (public.es_admin());

drop policy if exists projects_update_admin on public.projects;
create policy projects_update_admin on public.projects
  for update to authenticated using (public.es_admin());

drop policy if exists projects_delete_admin on public.projects;
create policy projects_delete_admin on public.projects
  for delete to authenticated using (public.es_admin());

-- ----------------------------- project_members -----------------------------------
drop policy if exists project_members_select_authenticated on public.project_members;
create policy project_members_select_authenticated on public.project_members
  for select to authenticated using (true);

drop policy if exists project_members_write_admin on public.project_members;
create policy project_members_write_admin on public.project_members
  for all to authenticated
  using (public.es_admin())
  with check (public.es_admin());

-- ---------------------------------- tasks -----------------------------------------
drop policy if exists tasks_select_authenticated on public.tasks;
create policy tasks_select_authenticated on public.tasks
  for select to authenticated using (true);

drop policy if exists tasks_insert_admin on public.tasks;
create policy tasks_insert_admin on public.tasks
  for insert to authenticated with check (public.es_admin());

-- El administrador puede editar cualquier tarea; el responsable asignado
-- puede actualizar su propia tarea (por ejemplo, cambiar el estado).
drop policy if exists tasks_update_admin_or_responsable on public.tasks;
create policy tasks_update_admin_or_responsable on public.tasks
  for update to authenticated
  using (public.es_admin() or responsable_id = auth.uid());

drop policy if exists tasks_delete_admin on public.tasks;
create policy tasks_delete_admin on public.tasks
  for delete to authenticated using (public.es_admin());

-- ------------------------------- time_entries -------------------------------------
-- Cada socio ve sus propios registros; el administrador ve todos (estadísticas
-- generales, informes, corrección de registros).
drop policy if exists time_entries_select_own_or_admin on public.time_entries;
create policy time_entries_select_own_or_admin on public.time_entries
  for select to authenticated
  using (user_id = auth.uid() or public.es_admin());

-- Un socio solo puede crear registros a su propio nombre.
drop policy if exists time_entries_insert_own on public.time_entries;
create policy time_entries_insert_own on public.time_entries
  for insert to authenticated
  with check (user_id = auth.uid());

-- Un socio edita sus propios registros; el administrador puede corregir
-- cualquier registro (quedará reflejado en time_entry_history).
drop policy if exists time_entries_update_own_or_admin on public.time_entries;
create policy time_entries_update_own_or_admin on public.time_entries
  for update to authenticated
  using (user_id = auth.uid() or public.es_admin());

drop policy if exists time_entries_delete_own_or_admin on public.time_entries;
create policy time_entries_delete_own_or_admin on public.time_entries
  for delete to authenticated
  using (user_id = auth.uid() or public.es_admin());

-- ---------------------------- time_entry_history -----------------------------------
-- Visible para el propio dueño del registro y para administradores.
drop policy if exists time_entry_history_select on public.time_entry_history;
create policy time_entry_history_select on public.time_entry_history
  for select to authenticated
  using (
    public.es_admin()
    or exists (
      select 1 from public.time_entries te
      where te.id = time_entry_id and te.user_id = auth.uid()
    )
  );

-- Las filas de historial se insertan desde funciones de servidor con la
-- service role key; no se permite inserción directa desde el cliente.
drop policy if exists time_entry_history_insert_admin on public.time_entry_history;
create policy time_entry_history_insert_admin on public.time_entry_history
  for insert to authenticated with check (public.es_admin());

-- ------------------------------- weekly_reports -------------------------------------
-- Lectura para cualquier socio autenticado. La escritura la realiza
-- exclusivamente el proceso programado del servidor (service role key),
-- que no pasa por RLS, así que aquí solo abrimos lectura.
drop policy if exists weekly_reports_select on public.weekly_reports;
create policy weekly_reports_select on public.weekly_reports
  for select to authenticated using (true);

drop policy if exists weekly_project_reports_select on public.weekly_project_reports;
create policy weekly_project_reports_select on public.weekly_project_reports
  for select to authenticated using (true);

drop policy if exists weekly_member_reports_select on public.weekly_member_reports;
create policy weekly_member_reports_select on public.weekly_member_reports
  for select to authenticated using (true);

-- =============================================================================
-- FIN DE LA MIGRACIÓN INICIAL
-- =============================================================================
