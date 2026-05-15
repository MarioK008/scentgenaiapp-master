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
      accords: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
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
      brands: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      collection_items: {
        Row: {
          added_at: string | null
          collection_id: string
          id: string
          notes: string | null
          perfume_id: string
        }
        Insert: {
          added_at?: string | null
          collection_id: string
          id?: string
          notes?: string | null
          perfume_id: string
        }
        Update: {
          added_at?: string | null
          collection_id?: string
          id?: string
          notes?: string | null
          perfume_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "custom_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_items_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_collections: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          sent_at: string | null
          status: string
          subject: string
          template_key: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          sent_at?: string | null
          status?: string
          subject: string
          template_key: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          sent_at?: string | null
          status?: string
          subject?: string
          template_key?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          created_at: string | null
          description: string | null
          html_content: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          template_key: string
          text_content: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          html_content: string
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          template_key: string
          text_content: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          template_key?: string
          text_content?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      import_logs: {
        Row: {
          created_at: string
          error_details: Json | null
          failed_rows: number
          filename: string
          id: string
          successful_rows: number
          table_name: string
          total_rows: number
        }
        Insert: {
          created_at?: string
          error_details?: Json | null
          failed_rows?: number
          filename: string
          id?: string
          successful_rows?: number
          table_name: string
          total_rows?: number
        }
        Update: {
          created_at?: string
          error_details?: Json | null
          failed_rows?: number
          filename?: string
          id?: string
          successful_rows?: number
          table_name?: string
          total_rows?: number
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
      notes: {
        Row: {
          created_at: string | null
          id: string
          name: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      perfume_accords: {
        Row: {
          accord_id: string
          perfume_id: string
        }
        Insert: {
          accord_id: string
          perfume_id: string
        }
        Update: {
          accord_id?: string
          perfume_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfume_accords_accord_id_fkey"
            columns: ["accord_id"]
            isOneToOne: false
            referencedRelation: "accords"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfume_accords_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
        ]
      }
      perfume_notes: {
        Row: {
          note_id: string
          perfume_id: string
        }
        Insert: {
          note_id: string
          perfume_id: string
        }
        Update: {
          note_id?: string
          perfume_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfume_notes_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfume_notes_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
        ]
      }
      perfume_seasons: {
        Row: {
          perfume_id: string
          season_id: string
        }
        Insert: {
          perfume_id: string
          season_id: string
        }
        Update: {
          perfume_id?: string
          season_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfume_seasons_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfume_seasons_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      perfume_similar: {
        Row: {
          perfume_id: string
          similar_id: string
        }
        Insert: {
          perfume_id: string
          similar_id: string
        }
        Update: {
          perfume_id?: string
          similar_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfume_similar_perfume_id_fkey"
            columns: ["perfume_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfume_similar_similar_id_fkey"
            columns: ["similar_id"]
            isOneToOne: false
            referencedRelation: "perfumes"
            referencedColumns: ["id"]
          },
        ]
      }
      perfumes: {
        Row: {
          brand_id: string | null
          concentration: string | null
          country: string | null
          created_at: string | null
          description: string | null
          fragrantica_url: string | null
          gender: string | null
          id: string
          image_url: string | null
          longevity: string | null
          main_accord_id: string | null
          name: string
          rating: number | null
          rating_count: number | null
          rating_value: number | null
          sillage: string | null
          slug: string | null
          updated_at: string | null
          votes: number | null
          year: number | null
        }
        Insert: {
          brand_id?: string | null
          concentration?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          fragrantica_url?: string | null
          gender?: string | null
          id?: string
          image_url?: string | null
          longevity?: string | null
          main_accord_id?: string | null
          name: string
          rating?: number | null
          rating_count?: number | null
          rating_value?: number | null
          sillage?: string | null
          slug?: string | null
          updated_at?: string | null
          votes?: number | null
          year?: number | null
        }
        Update: {
          brand_id?: string | null
          concentration?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          fragrantica_url?: string | null
          gender?: string | null
          id?: string
          image_url?: string | null
          longevity?: string | null
          main_accord_id?: string | null
          name?: string
          rating?: number | null
          rating_count?: number | null
          rating_value?: number | null
          sillage?: string | null
          slug?: string | null
          updated_at?: string | null
          votes?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "perfumes_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfumes_main_accord_id_fkey"
            columns: ["main_accord_id"]
            isOneToOne: false
            referencedRelation: "accords"
            referencedColumns: ["id"]
          },
        ]
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
          onboarding_completed: boolean | null
          onboarding_step: number
          preferred_families: string[] | null
          preferred_language: string | null
          preferred_occasions: string[] | null
          preferred_seasons: string[] | null
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
          onboarding_completed?: boolean | null
          onboarding_step?: number
          preferred_families?: string[] | null
          preferred_language?: string | null
          preferred_occasions?: string[] | null
          preferred_seasons?: string[] | null
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
          onboarding_completed?: boolean | null
          onboarding_step?: number
          preferred_families?: string[] | null
          preferred_language?: string | null
          preferred_occasions?: string[] | null
          preferred_seasons?: string[] | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          identifier: string
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          identifier: string
          request_count?: number
          window_start?: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      saved_trends: {
        Row: {
          citations: Json | null
          content: string
          created_at: string
          id: string
          query: string
          user_id: string
        }
        Insert: {
          citations?: Json | null
          content: string
          created_at?: string
          id?: string
          query: string
          user_id: string
        }
        Update: {
          citations?: Json | null
          content?: string
          created_at?: string
          id?: string
          query?: string
          user_id?: string
        }
        Relationships: []
      }
      seasons: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
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
        Relationships: []
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
          email_sent_at: string | null
          id: string
          metadata: Json | null
          notified: boolean | null
          welcome_email_status: string | null
        }
        Insert: {
          created_at?: string
          email: string
          email_sent_at?: string | null
          id?: string
          metadata?: Json | null
          notified?: boolean | null
          welcome_email_status?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          email_sent_at?: string | null
          id?: string
          metadata?: Json | null
          notified?: boolean | null
          welcome_email_status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: string | null
          is_private: boolean | null
          location: string | null
          preferred_families: string[] | null
          preferred_occasions: string[] | null
          preferred_seasons: string[] | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string | null
          is_private?: boolean | null
          location?: string | null
          preferred_families?: string[] | null
          preferred_occasions?: string[] | null
          preferred_seasons?: string[] | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string | null
          is_private?: boolean | null
          location?: string | null
          preferred_families?: string[] | null
          preferred_occasions?: string[] | null
          preferred_seasons?: string[] | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_and_award_badges: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      check_rate_limit: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_max_requests: number
          p_window_minutes: number
        }
        Returns: boolean
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
    },
  },
} as const
