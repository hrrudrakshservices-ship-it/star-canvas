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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_notifications: {
        Row: {
          created_at: string | null
          id: string
          image_id: string | null
          is_read: boolean | null
          message: string
          notification_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_id?: string | null
          is_read?: boolean | null
          message: string
          notification_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_id?: string | null
          is_read?: boolean | null
          message?: string
          notification_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      images: {
        Row: {
          ai_confidence: number | null
          ai_detected: boolean | null
          ai_detection_reason: string | null
          average_rating: number | null
          caption: string | null
          created_at: string | null
          description: string | null
          flag_reason: string | null
          id: string
          image_url: string
          is_flagged: boolean | null
          title: string | null
          total_ratings: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_detected?: boolean | null
          ai_detection_reason?: string | null
          average_rating?: number | null
          caption?: string | null
          created_at?: string | null
          description?: string | null
          flag_reason?: string | null
          id?: string
          image_url: string
          is_flagged?: boolean | null
          title?: string | null
          total_ratings?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          ai_detected?: boolean | null
          ai_detection_reason?: string | null
          average_rating?: number | null
          caption?: string | null
          created_at?: string | null
          description?: string | null
          flag_reason?: string | null
          id?: string
          image_url?: string
          is_flagged?: boolean | null
          title?: string | null
          total_ratings?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          average_rating: number | null
          badge_rank: number | null
          city: string | null
          continent: string | null
          country: string | null
          country_code: string | null
          created_at: string | null
          district: string | null
          email: string
          followers_count: number | null
          following_count: number | null
          id: string
          is_public: boolean
          name: string | null
          state: string | null
          total_images: number | null
          total_ratings_received: number | null
          updated_at: string | null
          username: string
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          average_rating?: number | null
          badge_rank?: number | null
          city?: string | null
          continent?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          district?: string | null
          email: string
          followers_count?: number | null
          following_count?: number | null
          id: string
          is_public?: boolean
          name?: string | null
          state?: string | null
          total_images?: number | null
          total_ratings_received?: number | null
          updated_at?: string | null
          username: string
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          average_rating?: number | null
          badge_rank?: number | null
          city?: string | null
          continent?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          district?: string | null
          email?: string
          followers_count?: number | null
          following_count?: number | null
          id?: string
          is_public?: boolean
          name?: string | null
          state?: string | null
          total_images?: number | null
          total_ratings_received?: number | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string | null
          id: string
          image_id: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_id: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_id: string
          reason: string
          report_type: Database["public"]["Enums"]["report_type"] | null
          reported_user_id: string
          reporter_id: string
          reviewed_at: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_id: string
          reason: string
          report_type?: Database["public"]["Enums"]["report_type"] | null
          reported_user_id: string
          reporter_id: string
          reviewed_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_id?: string
          reason?: string
          report_type?: Database["public"]["Enums"]["report_type"] | null
          reported_user_id?: string
          reporter_id?: string
          reviewed_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          image_id: string
          last_in_top_at: string | null
          location_value: string
          longest_streak: number | null
          streak_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          image_id: string
          last_in_top_at?: string | null
          location_value: string
          longest_streak?: number | null
          streak_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          image_id?: string
          last_in_top_at?: string | null
          location_value?: string
          longest_streak?: number | null
          streak_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "streaks_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      report_type: "copyright" | "nudity" | "spam" | "other"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      report_type: ["copyright", "nudity", "spam", "other"],
    },
  },
} as const
