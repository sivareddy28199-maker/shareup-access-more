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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          icon: string
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          icon?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          icon?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      demo_payments: {
        Row: {
          amount: number
          created_at: string
          deposit_amount: number
          id: string
          is_demo: boolean
          method: string
          payer_id: string
          reference: string
          rent_amount: number
          rental_id: string | null
          request_id: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          deposit_amount?: number
          id?: string
          is_demo?: boolean
          method?: string
          payer_id: string
          reference?: string
          rent_amount?: number
          rental_id?: string | null
          request_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          deposit_amount?: number
          id?: string
          is_demo?: boolean
          method?: string
          payer_id?: string
          reference?: string
          rent_amount?: number
          rental_id?: string | null
          request_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "demo_payments_rental_id_fkey"
            columns: ["rental_id"]
            isOneToOne: false
            referencedRelation: "rentals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_payments_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "rental_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_images: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          sort_order: number
          storage_path: string | null
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          sort_order?: number
          storage_path?: string | null
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          sort_order?: number
          storage_path?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_images_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          category_id: string
          college: string
          created_at: string
          deposit: number
          description: string
          id: string
          is_available: boolean
          is_demo: boolean
          item_condition: string
          location: string
          max_days: number
          min_days: number
          owner_id: string
          price_per_day: number
          title: string
          updated_at: string
        }
        Insert: {
          category_id: string
          college?: string
          created_at?: string
          deposit?: number
          description?: string
          id?: string
          is_available?: boolean
          is_demo?: boolean
          item_condition?: string
          location?: string
          max_days?: number
          min_days?: number
          owner_id: string
          price_per_day: number
          title: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          college?: string
          created_at?: string
          deposit?: number
          description?: string
          id?: string
          is_available?: boolean
          is_demo?: boolean
          item_condition?: string
          location?: string
          max_days?: number
          min_days?: number
          owner_id?: string
          price_per_day?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listings_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          college: string
          created_at: string
          department: string | null
          full_name: string
          id: string
          is_demo: boolean
          phone: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          year: number | null
        }
        Insert: {
          avatar_url?: string | null
          college?: string
          created_at?: string
          department?: string | null
          full_name?: string
          id: string
          is_demo?: boolean
          phone?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          year?: number | null
        }
        Update: {
          avatar_url?: string | null
          college?: string
          created_at?: string
          department?: string | null
          full_name?: string
          id?: string
          is_demo?: boolean
          phone?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          year?: number | null
        }
        Relationships: []
      }
      rental_requests: {
        Row: {
          created_at: string
          days: number
          deposit: number
          end_date: string
          id: string
          listing_id: string
          message: string | null
          owner_id: string
          price_per_day: number
          renter_id: string
          responded_at: string | null
          start_date: string
          status: Database["public"]["Enums"]["request_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          days: number
          deposit?: number
          end_date: string
          id?: string
          listing_id: string
          message?: string | null
          owner_id: string
          price_per_day: number
          renter_id: string
          responded_at?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["request_status"]
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          days?: number
          deposit?: number
          end_date?: string
          id?: string
          listing_id?: string
          message?: string | null
          owner_id?: string
          price_per_day?: number
          renter_id?: string
          responded_at?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["request_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      rentals: {
        Row: {
          cancelled_at: string | null
          collected_at: string | null
          completed_at: string | null
          created_at: string
          deposit: number
          end_date: string
          id: string
          listing_id: string
          owner_id: string
          paid_at: string | null
          rent_amount: number
          renter_id: string
          request_id: string
          returned_at: string | null
          start_date: string
          status: Database["public"]["Enums"]["rental_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          collected_at?: string | null
          completed_at?: string | null
          created_at?: string
          deposit?: number
          end_date: string
          id?: string
          listing_id: string
          owner_id: string
          paid_at?: string | null
          rent_amount?: number
          renter_id: string
          request_id: string
          returned_at?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["rental_status"]
          total_amount?: number
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          collected_at?: string | null
          completed_at?: string | null
          created_at?: string
          deposit?: number
          end_date?: string
          id?: string
          listing_id?: string
          owner_id?: string
          paid_at?: string | null
          rent_amount?: number
          renter_id?: string
          request_id?: string
          returned_at?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["rental_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rentals_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rentals_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "rental_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          listing_id: string
          rating: number
          rental_id: string
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id: string
          rating: number
          rental_id: string
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          listing_id?: string
          rating?: number
          rental_id?: string
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_rental_id_fkey"
            columns: ["rental_id"]
            isOneToOne: false
            referencedRelation: "rentals"
            referencedColumns: ["id"]
          },
        ]
      }
      student_verifications: {
        Row: {
          id: string
          id_card_path: string
          reviewed_at: string | null
          reviewed_by: string | null
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["verification_status"]
          student_id_number: string | null
          submitted_at: string
          user_id: string
        }
        Insert: {
          id?: string
          id_card_path: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          student_id_number?: string | null
          submitted_at?: string
          user_id: string
        }
        Update: {
          id?: string
          id_card_path?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          student_id_number?: string | null
          submitted_at?: string
          user_id?: string
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
      get_my_profile: {
        Args: never
        Returns: {
          avatar_url: string
          college: string
          created_at: string
          department: string
          full_name: string
          id: string
          phone: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          year: number
        }[]
      }
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
      rental_status:
        | "paid"
        | "active"
        | "overdue"
        | "returned"
        | "completed"
        | "cancelled"
      request_status:
        | "requested"
        | "approved"
        | "rejected"
        | "cancelled"
        | "paid"
      verification_status: "unverified" | "pending" | "verified" | "rejected"
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
      rental_status: [
        "paid",
        "active",
        "overdue",
        "returned",
        "completed",
        "cancelled",
      ],
      request_status: [
        "requested",
        "approved",
        "rejected",
        "cancelled",
        "paid",
      ],
      verification_status: ["unverified", "pending", "verified", "rejected"],
    },
  },
} as const
