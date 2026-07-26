// ============================================================================
// FILE: /types/database.types.ts - UPDATED
// ============================================================================
// Auto-generated Supabase database types (UPDATED)
// ============================================================================

import type { VerificationStatus, VerifiedBadgeType } from './profile'

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
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string | null
          name: string | null
          username: string | null
          email: string | null
          role: string | null
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
          verified_badge_type: VerifiedBadgeType | null
          verified_at: string | null
          verification_status: VerificationStatus
          badge_count: number
          default_stream_title: string | null
          stream_quality: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name?: string | null
          name?: string | null
          username?: string | null
          email?: string | null
          role?: string | null
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
          verified_badge_type?: VerifiedBadgeType | null
          verified_at?: string | null
          verification_status?: VerificationStatus
          badge_count?: number
          default_stream_title?: string | null
          stream_quality?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string | null
          name?: string | null
          username?: string | null
          email?: string | null
          role?: string | null
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
          verified_badge_type?: VerifiedBadgeType | null
          verified_at?: string | null
          verification_status?: VerificationStatus
          badge_count?: number
          default_stream_title?: string | null
          stream_quality?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
      // Only the tables above have been transcribed from the live schema. Until
      // `supabase gen types typescript` replaces this file, every other table
      // resolves through this fallback instead of `never`.
      [table: string]: {
        Row: Record<string, any>
        Insert: Record<string, any>
        Update: Record<string, any>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [fn: string]: {
        Args: Record<string, any>
        Returns: any
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
