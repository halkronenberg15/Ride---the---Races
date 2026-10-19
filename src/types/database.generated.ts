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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      athlete_events: {
        Row: {
          athlete_id: string
          created_at: string
          event_id: string
          event_type: string
          occurred_at: string
          payload: Json
          producer: string
          schema_version: number
        }
        Insert: {
          athlete_id: string
          created_at?: string
          event_id: string
          event_type: string
          occurred_at: string
          payload: Json
          producer: string
          schema_version: number
        }
        Update: {
          athlete_id?: string
          created_at?: string
          event_id?: string
          event_type?: string
          occurred_at?: string
          payload?: Json
          producer?: string
          schema_version?: number
        }
        Relationships: [
          {
            foreignKeyName: "athlete_events_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["athlete_id"]
          },
        ]
      }
      athlete_profiles: {
        Row: {
          archetype: string | null
          athlete_id: string
          display_name: string
          ftp_watts: number | null
          height_cm: number | null
          preferred_units: string
          profile_version: number
          rider_number: number | null
          season_goal: string | null
          updated_at: string
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          archetype?: string | null
          athlete_id?: string
          display_name?: string
          ftp_watts?: number | null
          height_cm?: number | null
          preferred_units?: string
          profile_version?: number
          rider_number?: number | null
          season_goal?: string | null
          updated_at?: string
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          archetype?: string | null
          athlete_id?: string
          display_name?: string
          ftp_watts?: number | null
          height_cm?: number | null
          preferred_units?: string
          profile_version?: number
          rider_number?: number | null
          season_goal?: string | null
          updated_at?: string
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: []
      }
      benchmark_blocks: {
        Row: {
          athlete_id: string
          block_key: string
          created_at: string
          ends_on: string | null
          id: string
          label: string
          metrics: Json
          notes: string | null
          starts_on: string | null
        }
        Insert: {
          athlete_id: string
          block_key: string
          created_at?: string
          ends_on?: string | null
          id?: string
          label: string
          metrics?: Json
          notes?: string | null
          starts_on?: string | null
        }
        Update: {
          athlete_id?: string
          block_key?: string
          created_at?: string
          ends_on?: string | null
          id?: string
          label?: string
          metrics?: Json
          notes?: string | null
          starts_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "benchmark_blocks_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["athlete_id"]
          },
        ]
      }
      legacy_profile_imports: {
        Row: {
          athlete_id: string
          import_id: string
          imported_at: string
          raw_profile: Json
          ride_count: number
          source_app_version: string | null
          source_schema_version: number | null
          training_count: number
        }
        Insert: {
          athlete_id: string
          import_id?: string
          imported_at?: string
          raw_profile: Json
          ride_count?: number
          source_app_version?: string | null
          source_schema_version?: number | null
          training_count?: number
        }
        Update: {
          athlete_id?: string
          import_id?: string
          imported_at?: string
          raw_profile?: Json
          ride_count?: number
          source_app_version?: string | null
          source_schema_version?: number | null
          training_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "legacy_profile_imports_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["athlete_id"]
          },
        ]
      }
      nutrition_entries: {
        Row: {
          athlete_id: string
          calories: number | null
          carbs_g: number | null
          date: string
          fluid_oz: number | null
          id: string
          local_id: string | null
          logged_at: string
          meal_type: string
          metadata: Json
          name: string
          protein_g: number | null
        }
        Insert: {
          athlete_id: string
          calories?: number | null
          carbs_g?: number | null
          date: string
          fluid_oz?: number | null
          id: string
          local_id?: string | null
          logged_at: string
          meal_type: string
          metadata?: Json
          name: string
          protein_g?: number | null
        }
        Update: {
          athlete_id?: string
          calories?: number | null
          carbs_g?: number | null
          date?: string
          fluid_oz?: number | null
          id?: string
          local_id?: string | null
          logged_at?: string
          meal_type?: string
          metadata?: Json
          name?: string
          protein_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_entries_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["athlete_id"]
          },
        ]
      }
      nutrition_templates: {
        Row: {
          aliases: string[]
          athlete_id: string
          calories: number | null
          carbs_g: number | null
          fluid_oz: number | null
          id: string
          last_used_at: string | null
          local_id: string | null
          meal_type: string
          name: string
          protein_g: number | null
          times_used: number
        }
        Insert: {
          aliases?: string[]
          athlete_id: string
          calories?: number | null
          carbs_g?: number | null
          fluid_oz?: number | null
          id: string
          last_used_at?: string | null
          local_id?: string | null
          meal_type: string
          name: string
          protein_g?: number | null
          times_used?: number
        }
        Update: {
          aliases?: string[]
          athlete_id?: string
          calories?: number | null
          carbs_g?: number | null
          fluid_oz?: number | null
          id?: string
          last_used_at?: string | null
          local_id?: string | null
          meal_type?: string
          name?: string
          protein_g?: number | null
          times_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "nutrition_templates_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["athlete_id"]
          },
        ]
      }
      processed_events: {
        Row: {
          athlete_id: string
          consumer: string
          event_id: string
          processed_at: string
        }
        Insert: {
          athlete_id: string
          consumer: string
          event_id: string
          processed_at?: string
        }
        Update: {
          athlete_id?: string
          consumer?: string
          event_id?: string
          processed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "processed_events_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["athlete_id"]
          },
          {
            foreignKeyName: "processed_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "athlete_events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      readiness_entries: {
        Row: {
          athlete_id: string
          created_at: string
          date: string
          entry: Json
          id: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          date: string
          entry: Json
          id?: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          date?: string
          entry?: Json
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "readiness_entries_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["athlete_id"]
          },
        ]
      }
      recipe_preferences: {
        Row: {
          athlete_id: string
          rating: number | null
          recipe_id: string
          saved_at: string | null
          times_cooked: number
          times_planned: number
        }
        Insert: {
          athlete_id: string
          rating?: number | null
          recipe_id: string
          saved_at?: string | null
          times_cooked?: number
          times_planned?: number
        }
        Update: {
          athlete_id?: string
          rating?: number | null
          recipe_id?: string
          saved_at?: string | null
          times_cooked?: number
          times_planned?: number
        }
        Relationships: [
          {
            foreignKeyName: "recipe_preferences_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["athlete_id"]
          },
        ]
      }
      rider_state: {
        Row: {
          athlete_id: string
          career_snapshot: Json
          equipment: Json
          rider: Json
          schema_version: number
          season: Json
          settings: Json
          updated_at: string
        }
        Insert: {
          athlete_id: string
          career_snapshot?: Json
          equipment?: Json
          rider?: Json
          schema_version?: number
          season?: Json
          settings?: Json
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          career_snapshot?: Json
          equipment?: Json
          rider?: Json
          schema_version?: number
          season?: Json
          settings?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rider_state_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "athlete_profiles"
            referencedColumns: ["athlete_id"]
          },
        ]
      }
      rides: {
        Row: {
          assignment_id: string | null
          athlete_id: string
          average_cadence_rpm: number | null
          average_heart_rate_bpm: number | null
          average_power_watts: number | null
          calories: number | null
          completed_at: string
          distance_meters: number | null
          duration_seconds: number
          elevation_meters: number | null
          energy_kj: number | null
          ftp_watts: number | null
          legacy_source_id: string | null
          legacy_source_payload: Json | null
          normalized_power_watts: number | null
          notes: string | null
          race_id: string | null
          record_version: number
          ride_id: string
          source: string
          stage_number: number | null
          started_at: string
          updated_at: string
          workout_id: string | null
        }
        Insert: {
          assignment_id?: string | null
          athlete_id: string
          average_cadence_rpm?: number | null
          average_heart_rate_bpm?: number | null
          average_power_watts?: number | null
          calories?: number | null
          completed_at: string
          distance_meters?: number | null
          duration_seconds: number
          elevation_meters?: number | null
          energy_kj?: number | null
          ftp_watts?: number | null
          legacy_source_id?: string | null
          legacy_source_payload?: Json | null
          normalized_power_watts?: number | null
          notes?: string | null
          race_id?: string | null
          record_version?: number
          ride_id: string
          source: string
          stage_number?: number | null
          started_at: string
          updated_at?: string
          workout_id?: string | null
        }
        Update: {
          assignment_id?: string | null
          athlete_id?: string
          average_cadence_rpm?: number | null
          average_heart_rate_bpm?: number | null
          average_power_watts?: number | null
          calories?: number | null
          completed_at?: string
          distance_meters?: number | null
          duration_seconds?: number
          elevation_meters?: number | null
          energy_kj?: number | null
          ftp_watts?: number | null
          legacy_source_id?: string | null
          legacy_source_payload?: Json | null
          normalized_power_watts?: number | null
          notes?: string | null
          race_id?: string | null
          record_version?: number
          ride_id?: string
          source?: string
          stage_number?: number | null
          started_at?: string
          updated_at?: string
          workout_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rides_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["athlete_id"]
          },
        ]
      }
      sync_cursors: {
        Row: {
          athlete_id: string
          consumer: string
          cursor: string | null
          device_id: string
          updated_at: string
        }
        Insert: {
          athlete_id: string
          consumer: string
          cursor?: string | null
          device_id: string
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          consumer?: string
          cursor?: string | null
          device_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sync_cursors_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["athlete_id"]
          },
        ]
      }
      training_journal: {
        Row: {
          athlete_id: string
          created_at: string
          date: string
          entry: Json
          id: string
          local_id: string | null
          updated_at: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          date: string
          entry: Json
          id?: string
          local_id?: string | null
          updated_at?: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          date?: string
          entry?: Json
          id?: string
          local_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_journal_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["athlete_id"]
          },
        ]
      }
      training_plans: {
        Row: {
          athlete_id: string
          created_at: string
          end_date: string | null
          id: string
          is_active: boolean
          phase: string | null
          plan: Json
          start_date: string | null
          updated_at: string
          version: number
        }
        Insert: {
          athlete_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          phase?: string | null
          plan: Json
          start_date?: string | null
          updated_at?: string
          version?: number
        }
        Update: {
          athlete_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          is_active?: boolean
          phase?: string | null
          plan?: Json
          start_date?: string | null
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "training_plans_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athlete_profiles"
            referencedColumns: ["athlete_id"]
          },
        ]
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
