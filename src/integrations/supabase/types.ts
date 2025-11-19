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
      chat_messages: {
        Row: {
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          message: string
          parent_id: string | null
          pinned: boolean | null
          pinned_at: string | null
          pinned_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          message: string
          parent_id?: string | null
          pinned?: boolean | null
          pinned_at?: string | null
          pinned_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          message?: string
          parent_id?: string | null
          pinned?: boolean | null
          pinned_at?: string | null
          pinned_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      complaint_feedback: {
        Row: {
          comment: string | null
          complaint_id: string
          created_at: string
          id: string
          is_anonymous: boolean | null
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          complaint_id: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          complaint_id?: string
          created_at?: string
          id?: string
          is_anonymous?: boolean | null
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_feedback_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_files: {
        Row: {
          complaint_id: string
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          uploaded_by: string
        }
        Insert: {
          complaint_id: string
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          uploaded_by: string
        }
        Update: {
          complaint_id?: string
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_files_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaint_priorities: {
        Row: {
          color: string | null
          created_at: string
          id: string
          level: number
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          level: number
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          level?: number
          name?: string
        }
        Relationships: []
      }
      complaint_responses: {
        Row: {
          complaint_id: string
          created_at: string
          id: string
          is_internal_note: boolean | null
          message: string
          responder_id: string
        }
        Insert: {
          complaint_id: string
          created_at?: string
          id?: string
          is_internal_note?: boolean | null
          message: string
          responder_id: string
        }
        Update: {
          complaint_id?: string
          created_at?: string
          id?: string
          is_internal_note?: boolean | null
          message?: string
          responder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaint_responses_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          assigned_to: string | null
          category_id: string
          channel: Database["public"]["Enums"]["complaint_channel"]
          created_at: string
          description: string
          id: string
          priority_id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["complaint_status"]
          subject: string
          tracking_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category_id: string
          channel: Database["public"]["Enums"]["complaint_channel"]
          created_at?: string
          description: string
          id?: string
          priority_id: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          subject: string
          tracking_id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category_id?: string
          channel?: Database["public"]["Enums"]["complaint_channel"]
          created_at?: string
          description?: string
          id?: string
          priority_id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          subject?: string
          tracking_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "complaints_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "complaint_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complaints_priority_id_fkey"
            columns: ["priority_id"]
            isOneToOne: false
            referencedRelation: "complaint_priorities"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          id: string
          message_id: string
          reaction: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          reaction: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          reaction?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_approved: boolean | null
          avatar_url: string | null
          created_at: string
          email_verified: boolean | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          admin_approved?: boolean | null
          avatar_url?: string | null
          created_at?: string
          email_verified?: boolean | null
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          admin_approved?: boolean | null
          avatar_url?: string | null
          created_at?: string
          email_verified?: boolean | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      generate_tracking_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "admin" | "super_admin"
      complaint_channel: "chat" | "call" | "email" | "ticket"
      complaint_status: "submitted" | "in_review" | "processing" | "resolved"
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
      app_role: ["student", "admin", "super_admin"],
      complaint_channel: ["chat", "call", "email", "ticket"],
      complaint_status: ["submitted", "in_review", "processing", "resolved"],
    },
  },
} as const
