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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          requirement_type: string
          requirement_value: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          requirement_type?: string
          requirement_value?: number
        }
        Relationships: []
      }
      knowledge_chunks: {
        Row: {
          chunk_index: number | null
          content: string
          created_at: string | null
          document_id: string | null
          embedding: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          chunk_index?: number | null
          content: string
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          chunk_index?: number | null
          content?: string
          created_at?: string | null
          document_id?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_documents: {
        Row: {
          chunk_count: number | null
          file_path: string
          file_size: number | null
          id: string
          metadata: Json | null
          processed: boolean | null
          processing_status: Json | null
          title: string
          uploaded_at: string | null
          user_id: string | null
        }
        Insert: {
          chunk_count?: number | null
          file_path: string
          file_size?: number | null
          id?: string
          metadata?: Json | null
          processed?: boolean | null
          processing_status?: Json | null
          title: string
          uploaded_at?: string | null
          user_id?: string | null
        }
        Update: {
          chunk_count?: number | null
          file_path?: string
          file_size?: number | null
          id?: string
          metadata?: Json | null
          processed?: boolean | null
          processing_status?: Json | null
          title?: string
          uploaded_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      perfumes: {
        Row: {
          base_notes: string[] | null
          brand: string
          created_at: string | null
          description: string | null
          heart_notes: string[] | null
          id: string
          image_url: string | null
          longevity: number | null
          name: string
          season: Database["public"]["Enums"]["perfume_season"] | null
          sillage: number | null
          top_notes: string[] | null
          updated_at: string | null
        }
        Insert: {
          base_notes?: string[] | null
          brand: string
          created_at?: string | null
          description?: string | null
          heart_notes?: string[] | null
          id?: string
          image_url?: string | null
          longevity?: number | null
          name: string
          season?: Database["public"]["Enums"]["perfume_season"] | null
          sillage?: number | null
          top_notes?: string[] | null
          updated_at?: string | null
        }
        Update: {
          base_notes?: string[] | null
          brand?: string
          created_at?: string | null
          description?: string | null
          heart_notes?: string[] | null
          id?: string
          image_url?: string | null
          longevity?: number | null
          name?: string
          season?: Database["public"]["Enums"]["perfume_season"] | null
          sillage?: number | null
          top_notes?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          dark_mode_enabled: boolean | null
          email: string
          id: string
          is_private: boolean | null
          location: string | null
          notification_settings: Json | null
          preferred_language: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          dark_mode_enabled?: boolean | null
          email: string
          id: string
          is_private?: boolean | null
          location?: string | null
          notification_settings?: Json | null
          preferred_language?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          dark_mode_enabled?: boolean | null
          email?: string
          id?: string
          is_private?: boolean | null
          location?: string | null
          notification_settings?: Json | null
          preferred_language?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_collections: {
        Row: {
          added_at: string | null
          id: string
          perfume_id: string
          personal_notes: string | null
          rating: number | null
          status: Database["public"]["Enums"]["collection_status"]
          user_id: string
        }
        Insert: {
          added_at?: string | null
          id?: string
          perfume_id: string
          personal_notes?: string | null
          rating?: number | null
          status: Database["public"]["Enums"]["collection_status"]
          user_id: string
        }
        Update: {
          added_at?: string | null
          id?: string
          perfume_id?: string
          personal_notes?: string | null
          rating?: number | null
          status?: Database["public"]["Enums"]["collection_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_collections_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string
          followed_id: string
          follower_id: string
          id: string
          status: Database["public"]["Enums"]["follow_status"]
        }
        Insert: {
          created_at?: string
          followed_id: string
          follower_id: string
          id?: string
          status?: Database["public"]["Enums"]["follow_status"]
        }
        Update: {
          created_at?: string
          followed_id?: string
          follower_id?: string
          id?: string
          status?: Database["public"]["Enums"]["follow_status"]
        }
        Relationships: []
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
      voice_conversations: {
        Row: {
          conversation_type: string
          created_at: string
          id: string
          messages: Json
          metadata: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_type: string
          created_at?: string
          id?: string
          messages?: Json
          metadata?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_type?: string
          created_at?: string
          id?: string
          messages?: Json
          metadata?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          notified: boolean | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          notified?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          notified?: boolean | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_award_badges: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_knowledge_chunks: {
        Args: {
          filter_user_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          document_id: string
          document_title: string
          id: string
          similarity: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      collection_status: "owned" | "wishlist"
      follow_status: "pending" | "approved" | "rejected"
      perfume_season: "spring" | "summer" | "fall" | "winter" | "all_season"
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
      app_role: ["admin", "user"],
      collection_status: ["owned", "wishlist"],
      follow_status: ["pending", "approved", "rejected"],
      perfume_season: ["spring", "summer", "fall", "winter", "all_season"],
    },
  },
} as const
