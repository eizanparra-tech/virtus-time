// =============================================================================
// Tipos de la base de datos de VIRTUS TIME.
//
// Este archivo se ha escrito a mano a partir de supabase/migrations/0001_init.sql
// para poder desarrollar con seguridad de tipos desde el primer día.
//
// Cuando el proyecto de Supabase ya exista, se puede regenerar automáticamente
// con la CLI de Supabase y sustituir este archivo:
//   npx supabase gen types typescript --project-id TU_PROYECTO > src/types/database.types.ts
// =============================================================================

export type UserRole = "admin" | "socio";
export type ProjectStatus = "activo" | "pausado" | "finalizado" | "archivado";
export type TaskStatus = "pendiente" | "en_proceso" | "completada";
export type ActivityStatus = "en_proceso" | "finalizada";
export type ReportStatus = "generando" | "completado" | "error";

type NoRelationships = { Relationships: [] };

export interface Database {
  public: {
    Tables: {
      app_settings: {
        Row: {
          id: boolean;
          setup_completed: boolean;
          company_name: string;
          week_start_day: string;
          timezone: string;
          coste_hora_eur: number;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["app_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["app_settings"]["Row"]>;
      } & NoRelationships;
      profiles: {
        Row: {
          id: string;
          nombre: string;
          apellidos: string;
          email: string | null;
          avatar_url: string | null;
          rol: UserRole;
          activo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          nombre: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      } & NoRelationships;
      projects: {
        Row: {
          id: string;
          nombre: string;
          descripcion: string | null;
          color: string;
          estado: ProjectStatus;
          facturable: boolean;
          fecha_inicio: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["projects"]["Row"]> & {
          nombre: string;
        };
        Update: Partial<Database["public"]["Tables"]["projects"]["Row"]>;
      } & NoRelationships;
      project_members: {
        Row: {
          project_id: string;
          user_id: string;
          added_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["project_members"]["Row"]> & {
          project_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["project_members"]["Row"]>;
      } & NoRelationships;
      tasks: {
        Row: {
          id: string;
          project_id: string;
          titulo: string;
          descripcion: string | null;
          responsable_id: string | null;
          estado: TaskStatus;
          fecha_limite: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["tasks"]["Row"]> & {
          project_id: string;
          titulo: string;
        };
        Update: Partial<Database["public"]["Tables"]["tasks"]["Row"]>;
      } & NoRelationships;
      time_entries: {
        Row: {
          id: string;
          user_id: string;
          project_id: string;
          task_id: string | null;
          descripcion: string;
          estado: ActivityStatus;
          fecha: string;
          hora_inicio: string;
          hora_fin: string | null;
          duracion_segundos: number;
          running_since: string | null;
          paused_at: string | null;
          es_manual: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["time_entries"]["Row"]> & {
          user_id: string;
          project_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["time_entries"]["Row"]>;
      } & NoRelationships;
      time_entry_history: {
        Row: {
          id: string;
          time_entry_id: string;
          changed_by: string | null;
          campo: string;
          valor_anterior: string | null;
          valor_nuevo: string | null;
          changed_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["time_entry_history"]["Row"]> & {
          time_entry_id: string;
          campo: string;
        };
        Update: Partial<Database["public"]["Tables"]["time_entry_history"]["Row"]>;
      } & NoRelationships;
      weekly_reports: {
        Row: {
          id: string;
          semana_inicio: string;
          semana_fin: string;
          status: ReportStatus;
          resumen_general: Record<string, unknown>;
          conclusiones: Record<string, unknown>;
          generated_at: string | null;
          regenerated_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["weekly_reports"]["Row"]> & {
          semana_inicio: string;
          semana_fin: string;
        };
        Update: Partial<Database["public"]["Tables"]["weekly_reports"]["Row"]>;
      } & NoRelationships;
      weekly_project_reports: {
        Row: {
          id: string;
          report_id: string;
          project_id: string;
          horas_totales: number;
          datos: Record<string, unknown>;
          resumen_texto: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["weekly_project_reports"]["Row"]> & {
          report_id: string;
          project_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["weekly_project_reports"]["Row"]>;
      } & NoRelationships;
      key_dates: {
        Row: {
          id: string;
          titulo: string;
          descripcion: string | null;
          fecha: string;
          project_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["key_dates"]["Row"]> & {
          titulo: string;
          fecha: string;
        };
        Update: Partial<Database["public"]["Tables"]["key_dates"]["Row"]>;
      } & NoRelationships;
      weekly_member_reports: {
        Row: {
          id: string;
          report_id: string;
          user_id: string;
          horas_totales: number;
          dias_con_actividad: number;
          datos: Record<string, unknown>;
          resumen_texto: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["weekly_member_reports"]["Row"]> & {
          report_id: string;
          user_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["weekly_member_reports"]["Row"]>;
      } & NoRelationships;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectMember = Database["public"]["Tables"]["project_members"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TimeEntry = Database["public"]["Tables"]["time_entries"]["Row"];
export type TimeEntryHistory = Database["public"]["Tables"]["time_entry_history"]["Row"];
export type WeeklyReport = Database["public"]["Tables"]["weekly_reports"]["Row"];
export type WeeklyProjectReport = Database["public"]["Tables"]["weekly_project_reports"]["Row"];
export type WeeklyMemberReport = Database["public"]["Tables"]["weekly_member_reports"]["Row"];
export type KeyDate = Database["public"]["Tables"]["key_dates"]["Row"];
export type AppSettings = Database["public"]["Tables"]["app_settings"]["Row"];
