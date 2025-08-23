export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ai_training_data: {
        Row: {
          assignment_success: boolean | null
          constraint_violations: number | null
          context_features: Json
          created_at: string | null
          data_source: string
          employee_features: Json
          id: string
          model_version: string | null
          satisfaction_score: number | null
          seat_features: Json
          target_assignment: Json
          training_batch: string | null
        }
        Insert: {
          assignment_success?: boolean | null
          constraint_violations?: number | null
          context_features: Json
          created_at?: string | null
          data_source: string
          employee_features: Json
          id?: string
          model_version?: string | null
          satisfaction_score?: number | null
          seat_features: Json
          target_assignment: Json
          training_batch?: string | null
        }
        Update: {
          assignment_success?: boolean | null
          constraint_violations?: number | null
          context_features?: Json
          created_at?: string | null
          data_source?: string
          employee_features?: Json
          id?: string
          model_version?: string | null
          satisfaction_score?: number | null
          seat_features?: Json
          target_assignment?: Json
          training_batch?: string | null
        }
        Relationships: []
      }
      assignment_changes: {
        Row: {
          change_reason: string | null
          change_type: string
          changed_by: string | null
          created_at: string | null
          day_name: string
          employee_id: string
          id: string
          new_seat_id: string | null
          old_seat_id: string | null
          schedule_id: string
        }
        Insert: {
          change_reason?: string | null
          change_type: string
          changed_by?: string | null
          created_at?: string | null
          day_name: string
          employee_id: string
          id?: string
          new_seat_id?: string | null
          old_seat_id?: string | null
          schedule_id: string
        }
        Update: {
          change_reason?: string | null
          change_type?: string
          changed_by?: string | null
          created_at?: string | null
          day_name?: string
          employee_id?: string
          id?: string
          new_seat_id?: string | null
          old_seat_id?: string | null
          schedule_id?: string
        }
        Relationships: []
      }
      assignments: {
        Row: {
          created_at: string | null
          employee_id: string | null
          id: string
          reasons: Json | null
          schedule_day_id: string | null
          score: number | null
          seat_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          reasons?: Json | null
          schedule_day_id?: string | null
          score?: number | null
          seat_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string | null
          id?: string
          reasons?: Json | null
          schedule_day_id?: string | null
          score?: number | null
          seat_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_schedule_day_id_fkey"
            columns: ["schedule_day_id"]
            isOneToOne: false
            referencedRelation: "schedule_days"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["id"]
          },
        ]
      }
      constraints: {
        Row: {
          created_at: string | null
          dept_day_cap_pct: number
          id: string
          solver: string
          team_together_mode: string
          together_teams: string[] | null
          updated_at: string | null
          weights: Json | null
        }
        Insert: {
          created_at?: string | null
          dept_day_cap_pct?: number
          id?: string
          solver?: string
          team_together_mode?: string
          together_teams?: string[] | null
          updated_at?: string | null
          weights?: Json | null
        }
        Update: {
          created_at?: string | null
          dept_day_cap_pct?: number
          id?: string
          solver?: string
          team_together_mode?: string
          together_teams?: string[] | null
          updated_at?: string | null
          weights?: Json | null
        }
        Relationships: []
      }
      employee_attendance: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          created_at: string | null
          date: string
          employee_id: string
          id: string
          location: string
          seat_id: string | null
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          date: string
          employee_id: string
          id?: string
          location: string
          seat_id?: string | null
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string | null
          date?: string
          employee_id?: string
          id?: string
          location?: string
          seat_id?: string | null
        }
        Relationships: []
      }
      employee_constraints: {
        Row: {
          avoid_days: string[] | null
          created_at: string | null
          employee_id: string
          id: string
          max_weekly_office_days: number | null
          needs_accessible_seat: boolean | null
          preferred_days: string[] | null
          preferred_floor: number | null
          preferred_zone: string | null
          updated_at: string | null
        }
        Insert: {
          avoid_days?: string[] | null
          created_at?: string | null
          employee_id: string
          id?: string
          max_weekly_office_days?: number | null
          needs_accessible_seat?: boolean | null
          preferred_days?: string[] | null
          preferred_floor?: number | null
          preferred_zone?: string | null
          updated_at?: string | null
        }
        Update: {
          avoid_days?: string[] | null
          created_at?: string | null
          employee_id?: string
          id?: string
          max_weekly_office_days?: number | null
          needs_accessible_seat?: boolean | null
          preferred_days?: string[] | null
          preferred_floor?: number | null
          preferred_zone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          availability_ratio: number | null
          client_site_ratio: number | null
          commute_minutes: number | null
          created_at: string | null
          department: string | null
          extra: Json | null
          full_name: string | null
          id: string
          needs_accessible: boolean | null
          onsite_ratio: number | null
          prefer_window: boolean | null
          preferred_days: string[] | null
          preferred_work_mode: string | null
          preferred_zone: string | null
          priority_level: number | null
          project_count: number | null
          team: string | null
          updated_at: string | null
        }
        Insert: {
          availability_ratio?: number | null
          client_site_ratio?: number | null
          commute_minutes?: number | null
          created_at?: string | null
          department?: string | null
          extra?: Json | null
          full_name?: string | null
          id: string
          needs_accessible?: boolean | null
          onsite_ratio?: number | null
          prefer_window?: boolean | null
          preferred_days?: string[] | null
          preferred_work_mode?: string | null
          preferred_zone?: string | null
          priority_level?: number | null
          project_count?: number | null
          team?: string | null
          updated_at?: string | null
        }
        Update: {
          availability_ratio?: number | null
          client_site_ratio?: number | null
          commute_minutes?: number | null
          created_at?: string | null
          department?: string | null
          extra?: Json | null
          full_name?: string | null
          id?: string
          needs_accessible?: boolean | null
          onsite_ratio?: number | null
          prefer_window?: boolean | null
          preferred_days?: string[] | null
          preferred_work_mode?: string | null
          preferred_zone?: string | null
          priority_level?: number | null
          project_count?: number | null
          team?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      global_constraints: {
        Row: {
          allow_team_splitting: boolean
          created_at: string | null
          floor_1_capacity: number
          floor_2_capacity: number
          id: string
          max_client_site_ratio: number
          max_consecutive_office_days: number
          min_client_site_ratio: number
          updated_at: string | null
        }
        Insert: {
          allow_team_splitting?: boolean
          created_at?: string | null
          floor_1_capacity?: number
          floor_2_capacity?: number
          id?: string
          max_client_site_ratio?: number
          max_consecutive_office_days?: number
          min_client_site_ratio?: number
          updated_at?: string | null
        }
        Update: {
          allow_team_splitting?: boolean
          created_at?: string | null
          floor_1_capacity?: number
          floor_2_capacity?: number
          id?: string
          max_client_site_ratio?: number
          max_consecutive_office_days?: number
          min_client_site_ratio?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      model_performance: {
        Row: {
          assignment_date: string
          avg_constraint_adherence: number | null
          avg_satisfaction: number | null
          created_at: string | null
          id: string
          metrics: Json | null
          model_type: string
          model_version: string
          processing_time_ms: number | null
          successful_assignments: number | null
          total_assignments: number
        }
        Insert: {
          assignment_date: string
          avg_constraint_adherence?: number | null
          avg_satisfaction?: number | null
          created_at?: string | null
          id?: string
          metrics?: Json | null
          model_type: string
          model_version: string
          processing_time_ms?: number | null
          successful_assignments?: number | null
          total_assignments: number
        }
        Update: {
          assignment_date?: string
          avg_constraint_adherence?: number | null
          avg_satisfaction?: number | null
          created_at?: string | null
          id?: string
          metrics?: Json | null
          model_type?: string
          model_version?: string
          processing_time_ms?: number | null
          successful_assignments?: number | null
          total_assignments?: number
        }
        Relationships: []
      }
      optimization_rules: {
        Row: {
          avg_satisfaction_impact: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          rule_config: Json | null
          rule_name: string
          rule_type: string
          success_rate: number | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          avg_satisfaction_impact?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          rule_config?: Json | null
          rule_name: string
          rule_type: string
          success_rate?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          avg_satisfaction_impact?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          rule_config?: Json | null
          rule_name?: string
          rule_type?: string
          success_rate?: number | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string | null
          id: string
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      schedule_assignments: {
        Row: {
          assignment_date: string
          assignment_type: string
          collaboration_events: number | null
          confidence_score: number | null
          constraints_met: Json | null
          created_at: string | null
          day_of_week: string
          employee_id: string
          id: string
          model_version: string | null
          productivity_score: number | null
          rules_applied: string[] | null
          satisfaction_score: number | null
          seat_id: string | null
          updated_at: string | null
        }
        Insert: {
          assignment_date: string
          assignment_type: string
          collaboration_events?: number | null
          confidence_score?: number | null
          constraints_met?: Json | null
          created_at?: string | null
          day_of_week: string
          employee_id: string
          id?: string
          model_version?: string | null
          productivity_score?: number | null
          rules_applied?: string[] | null
          satisfaction_score?: number | null
          seat_id?: string | null
          updated_at?: string | null
        }
        Update: {
          assignment_date?: string
          assignment_type?: string
          collaboration_events?: number | null
          confidence_score?: number | null
          constraints_met?: Json | null
          created_at?: string | null
          day_of_week?: string
          employee_id?: string
          id?: string
          model_version?: string | null
          productivity_score?: number | null
          rules_applied?: string[] | null
          satisfaction_score?: number | null
          seat_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      schedule_days: {
        Row: {
          capacity: number
          created_at: string | null
          day_name: string
          id: string
          schedule_id: string | null
          updated_at: string | null
          violations: string[]
        }
        Insert: {
          capacity: number
          created_at?: string | null
          day_name: string
          id?: string
          schedule_id?: string | null
          updated_at?: string | null
          violations?: string[]
        }
        Update: {
          capacity?: number
          created_at?: string | null
          day_name?: string
          id?: string
          schedule_id?: string | null
          updated_at?: string | null
          violations?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "schedule_days_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_days_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "v_floor_occupancy"
            referencedColumns: ["schedule_id"]
          },
          {
            foreignKeyName: "schedule_days_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "v_zone_stats"
            referencedColumns: ["schedule_id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string | null
          id: string
          meta: Json | null
          published_at: string | null
          published_by: string | null
          status: string
          updated_at: string | null
          week_start: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          meta?: Json | null
          published_at?: string | null
          published_by?: string | null
          status?: string
          updated_at?: string | null
          week_start: string
        }
        Update: {
          created_at?: string | null
          id?: string
          meta?: Json | null
          published_at?: string | null
          published_by?: string | null
          status?: string
          updated_at?: string | null
          week_start?: string
        }
        Relationships: []
      }
      seat_locks: {
        Row: {
          created_at: string | null
          employee_id: string
          end_date: string | null
          id: string
          lock_type: string
          reason: string | null
          seat_id: string
          start_date: string | null
        }
        Insert: {
          created_at?: string | null
          employee_id: string
          end_date?: string | null
          id?: string
          lock_type: string
          reason?: string | null
          seat_id: string
          start_date?: string | null
        }
        Update: {
          created_at?: string | null
          employee_id?: string
          end_date?: string | null
          id?: string
          lock_type?: string
          reason?: string | null
          seat_id?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seat_locks_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["id"]
          },
        ]
      }
      seats: {
        Row: {
          created_at: string | null
          floor: number
          id: string
          is_accessible: boolean | null
          is_window: boolean | null
          updated_at: string | null
          x: number
          y: number
          zone: string
        }
        Insert: {
          created_at?: string | null
          floor: number
          id: string
          is_accessible?: boolean | null
          is_window?: boolean | null
          updated_at?: string | null
          x: number
          y: number
          zone: string
        }
        Update: {
          created_at?: string | null
          floor?: number
          id?: string
          is_accessible?: boolean | null
          is_window?: boolean | null
          updated_at?: string | null
          x?: number
          y?: number
          zone?: string
        }
        Relationships: []
      }
      team_collaborations: {
        Row: {
          avg_proximity: number | null
          collaboration_score: number | null
          created_at: string | null
          date: string
          id: string
          members_present: number
          seating_arrangement: Json
          team_name: string
        }
        Insert: {
          avg_proximity?: number | null
          collaboration_score?: number | null
          created_at?: string | null
          date: string
          id?: string
          members_present: number
          seating_arrangement: Json
          team_name: string
        }
        Update: {
          avg_proximity?: number | null
          collaboration_score?: number | null
          created_at?: string | null
          date?: string
          id?: string
          members_present?: number
          seating_arrangement?: Json
          team_name?: string
        }
        Relationships: []
      }
      team_constraints: {
        Row: {
          created_at: string | null
          id: string
          max_members_per_day: number | null
          min_copresence_ratio: number | null
          prefer_adjacent_seats: boolean
          prefer_same_floor: boolean
          preferred_days: string[] | null
          team_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_members_per_day?: number | null
          min_copresence_ratio?: number | null
          prefer_adjacent_seats?: boolean
          prefer_same_floor?: boolean
          preferred_days?: string[] | null
          team_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          max_members_per_day?: number | null
          min_copresence_ratio?: number | null
          prefer_adjacent_seats?: boolean
          prefer_same_floor?: boolean
          preferred_days?: string[] | null
          team_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      v_floor_occupancy: {
        Row: {
          day_name: string | null
          floor: number | null
          occupied: number | null
          schedule_id: string | null
          total: number | null
        }
        Relationships: []
      }
      v_zone_stats: {
        Row: {
          accessible_count: number | null
          available: number | null
          day_name: string | null
          occupied: number | null
          schedule_id: string | null
          total_seats: number | null
          window_count: number | null
          zone: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      floor_occupancy: {
        Args: { p_day_name: string; p_schedule_id: string }
        Returns: {
          floor: number
          occupied: number
          total: number
        }[]
      }
      get_user_role: {
        Args: Record<PropertyKey, never> | { user_id?: string }
        Returns: string
      }
      week_schedule: {
        Args: { week_start: string }
        Returns: {
          day_name: string
          employee_id: string
          floor: number
          reasons: Json
          score: number
          seat_id: string
          zone: string
        }[]
      }
      zone_summary: {
        Args: { p_day_name: string; p_schedule_id: string }
        Returns: {
          accessible_count: number
          available: number
          occupied: number
          total_seats: number
          window_count: number
          zone: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
