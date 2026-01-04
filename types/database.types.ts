// ============================================================================
// FILE: /types/database.types.ts - UPDATED
// ============================================================================
// Auto-generated Supabase database types (UPDATED)
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user: {
        Row: {
          id: string
          email: string
          username: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          user_id: string
          full_name: string | null
          bio: string | null
          avatar_url: string | null
          location: string | null
          website: string | null
          interests: Json
          colors: Json
          items: string[] | null
          profile_completed: boolean
          rank: string
          rank_points: number
          rank_level: number
          is_verified: boolean
          verified_badge_type: string | null
          verified_at: string | null
          verification_status: string
          badge_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          full_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          location?: string | null
          website?: string | null
          interests?: Json
          colors?: Json
          items?: string[] | null
          profile_completed?: boolean
          rank?: string
          rank_points?: number
          rank_level?: number
          is_verified?: boolean
          verified_badge_type?: string | null
          verified_at?: string | null
          verification_status?: string
          badge_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          full_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          location?: string | null
          website?: string | null
          interests?: Json
          colors?: Json
          items?: string[] | null
          profile_completed?: boolean
          rank?: string
          rank_points?: number
          rank_level?: number
          is_verified?: boolean
          verified_badge_type?: string | null
          verified_at?: string | null
          verification_status?: string
          badge_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      interests: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string | null
          icon_url: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category?: string | null
          icon_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string | null
          icon_url?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      user_interests: {
        Row: {
          id: string
          user_id: string
          interest_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          interest_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          interest_id?: string
          created_at?: string
        }
      }
      badge_requests: {
        Row: {
          id: string
          user_id: string
          name: string
          social_link: string | null
          doc_url: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          social_link?: string | null
          doc_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          social_link?: string | null
          doc_url?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      verified_badges: {
        Row: {
          id: string
          user_id: string
          badge_type: string
          is_active: boolean
          reason: string | null
          awarded_at: string
          expires_at: string | null
          awarded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_type: string
          is_active?: boolean
          reason?: string | null
          awarded_at?: string
          expires_at?: string | null
          awarded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_type?: string
          is_active?: boolean
          reason?: string | null
          awarded_at?: string
          expires_at?: string | null
          awarded_by?: string | null
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          content: string
          author: string | null
          user_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          content: string
          author?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          content?: string
          author?: string | null
          user_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          sender_id: string | null
          receiver_id: string | null
          content: string
          created_at: string
          read_at: string | null
        }
        Insert: {
          id?: string
          sender_id?: string | null
          receiver_id?: string | null
          content: string
          created_at?: string
          read_at?: string | null
        }
        Update: {
          id?: string
          sender_id?: string | null
          receiver_id?: string | null
          content?: string
          created_at?: string
          read_at?: string | null
        }
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
