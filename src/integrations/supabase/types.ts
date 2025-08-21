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
      employees: {
        Row: {
          arrival_time: string | null
          collaboration_score: number | null
          created_at: string | null
          department: string
          departure_time: string | null
          email: string | null
          employee_id: string
          flexibility_score: number | null
          focus_preference: string | null
          full_name: string
          hire_date: string | null
          id: string
          is_active: boolean | null
          manager_id: string | null
          needs_accessible: boolean | null
          onsite_ratio: number | null
          prefer_window: boolean | null
          preferred_days: string[] | null
          preferred_work_mode: string | null
          preferred_zone: string | null
          project_count: number | null
          role: string | null
          team: string
          updated_at: string | null
        }
        Insert: {
          arrival_time?: string | null
          collaboration_score?: number | null
          created_at?: string | null
          department: string
          departure_time?: string | null
          email?: string | null
          employee_id: string
          flexibility_score?: number | null
          focus_preference?: string | null
          full_name: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          needs_accessible?: boolean | null
          onsite_ratio?: number | null
          prefer_window?: boolean | null
          preferred_days?: string[] | null
          preferred_work_mode?: string | null
          preferred_zone?: string | null
          project_count?: number | null
          role?: string | null
          team: string
          updated_at?: string | null
        }
        Update: {
          arrival_time?: string | null
          collaboration_score?: number | null
          created_at?: string | null
          department?: string
          departure_time?: string | null
          email?: string | null
          employee_id?: string
          flexibility_score?: number | null
          focus_preference?: string | null
          full_name?: string
          hire_date?: string | null
          id?: string
          is_active?: boolean | null
          manager_id?: string | null
          needs_accessible?: boolean | null
          onsite_ratio?: number | null
          prefer_window?: boolean | null
          preferred_days?: string[] | null
          preferred_work_mode?: string | null
          preferred_zone?: string | null
          project_count?: number | null
          role?: string | null
          team?: string
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
          seat_id: string
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
          seat_id: string
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
          seat_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedule_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["employee_id"]
          },
          {
            foreignKeyName: "schedule_assignments_seat_id_fkey"
            columns: ["seat_id"]
            isOneToOne: false
            referencedRelation: "seats"
            referencedColumns: ["seat_id"]
          },
        ]
      }
      seats: {
        Row: {
          created_at: string | null
          desk_type: string | null
          floor: number
          has_monitor: boolean | null
          id: string
          is_accessible: boolean | null
          is_available: boolean | null
          is_corner: boolean | null
          is_window: boolean | null
          maintenance_status: string | null
          monitor_count: number | null
          natural_light_level: string | null
          noise_level: string | null
          proximity_to_facilities: number | null
          seat_id: string
          updated_at: string | null
          x_coordinate: number
          y_coordinate: number
          zone: string
        }
        Insert: {
          created_at?: string | null
          desk_type?: string | null
          floor: number
          has_monitor?: boolean | null
          id?: string
          is_accessible?: boolean | null
          is_available?: boolean | null
          is_corner?: boolean | null
          is_window?: boolean | null
          maintenance_status?: string | null
          monitor_count?: number | null
          natural_light_level?: string | null
          noise_level?: string | null
          proximity_to_facilities?: number | null
          seat_id: string
          updated_at?: string | null
          x_coordinate: number
          y_coordinate: number
          zone: string
        }
        Update: {
          created_at?: string | null
          desk_type?: string | null
          floor?: number
          has_monitor?: boolean | null
          id?: string
          is_accessible?: boolean | null
          is_available?: boolean | null
          is_corner?: boolean | null
          is_window?: boolean | null
          maintenance_status?: string | null
          monitor_count?: number | null
          natural_light_level?: string | null
          noise_level?: string | null
          proximity_to_facilities?: number | null
          seat_id?: string
          updated_at?: string | null
          x_coordinate?: number
          y_coordinate?: number
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
