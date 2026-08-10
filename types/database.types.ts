export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ad_interactions: {
        Row: {
          campaign_id: string
          cost_incurred: number
          created_at: string
          id: string
          interaction_type: string
          ip_address: string | null
          user_agent: string | null
          viewer_id: string | null
        }
        Insert: {
          campaign_id: string
          cost_incurred?: number
          created_at?: string
          id?: string
          interaction_type: string
          ip_address?: string | null
          user_agent?: string | null
          viewer_id?: string | null
        }
        Update: {
          campaign_id?: string
          cost_incurred?: number
          created_at?: string
          id?: string
          interaction_type?: string
          ip_address?: string | null
          user_agent?: string | null
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_interactions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ads_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ads_campaigns: {
        Row: {
          ad_creative_url: string
          advertiser_id: string
          bid_per_unit: number
          billing_model: Database["public"]["Enums"]["ad_billing_type_mode"]
          created_at: string
          ends_at: string
          id: string
          remaining_budget: number
          starts_at: string
          status: Database["public"]["Enums"]["ad_campaign_lifecycle_status"]
          target_destination_url: string
          targeting_demographics: Json
          title: string
          total_budget: number
          updated_at: string
        }
        Insert: {
          ad_creative_url: string
          advertiser_id: string
          bid_per_unit: number
          billing_model?: Database["public"]["Enums"]["ad_billing_type_mode"]
          created_at?: string
          ends_at: string
          id?: string
          remaining_budget: number
          starts_at: string
          status?: Database["public"]["Enums"]["ad_campaign_lifecycle_status"]
          target_destination_url: string
          targeting_demographics?: Json
          title: string
          total_budget: number
          updated_at?: string
        }
        Update: {
          ad_creative_url?: string
          advertiser_id?: string
          bid_per_unit?: number
          billing_model?: Database["public"]["Enums"]["ad_billing_type_mode"]
          created_at?: string
          ends_at?: string
          id?: string
          remaining_budget?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["ad_campaign_lifecycle_status"]
          target_destination_url?: string
          targeting_demographics?: Json
          title?: string
          total_budget?: number
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          id: number
          ip_address: string
          timestamp: string
          user_agent: string
          user_id: string
        }
        Insert: {
          action: string
          id?: number
          ip_address: string
          timestamp: string
          user_agent: string
          user_id: string
        }
        Update: {
          action?: string
          id?: number
          ip_address?: string
          timestamp?: string
          user_agent?: string
          user_id?: string
        }
        Relationships: []
      }
      call_sessions: {
        Row: {
          call_mode: Database["public"]["Enums"]["call_type_mode"]
          created_at: string
          ended_at: string | null
          host_id: string
          id: string
          recipient_id: string
          room_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["call_lifecycle_status"]
          updated_at: string
        }
        Insert: {
          call_mode?: Database["public"]["Enums"]["call_type_mode"]
          created_at?: string
          ended_at?: string | null
          host_id: string
          id?: string
          recipient_id: string
          room_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["call_lifecycle_status"]
          updated_at?: string
        }
        Update: {
          call_mode?: Database["public"]["Enums"]["call_type_mode"]
          created_at?: string
          ended_at?: string | null
          host_id?: string
          id?: string
          recipient_id?: string
          room_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["call_lifecycle_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_sessions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      call_signaling_payloads: {
        Row: {
          call_id: string
          created_at: string
          id: string
          payload_type: string
          sdp_or_candidate_data: Json
          sender_id: string
        }
        Insert: {
          call_id: string
          created_at?: string
          id?: string
          payload_type: string
          sdp_or_candidate_data: Json
          sender_id: string
        }
        Update: {
          call_id?: string
          created_at?: string
          id?: string
          payload_type?: string
          sdp_or_candidate_data?: Json
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "call_signaling_payloads_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "call_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_message_reactions: {
        Row: {
          created_at: string
          emoji_code: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji_code: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji_code?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          attachment_urls: string[]
          created_at: string
          id: string
          message_text: string | null
          metadata: Json
          room_id: string
          sender_id: string
        }
        Insert: {
          attachment_urls?: string[]
          created_at?: string
          id?: string
          message_text?: string | null
          metadata?: Json
          room_id: string
          sender_id: string
        }
        Update: {
          attachment_urls?: string[]
          created_at?: string
          id?: string
          message_text?: string | null
          metadata?: Json
          room_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_read_receipts: {
        Row: {
          id: string
          last_read_message_id: string
          read_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          last_read_message_id: string
          read_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          last_read_message_id?: string
          read_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_read_receipts_last_read_message_id_fkey"
            columns: ["last_read_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_read_receipts_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_room_members: {
        Row: {
          id: string
          joined_at: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_group_chat: boolean
          room_avatar: string | null
          room_name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_group_chat?: boolean
          room_avatar?: string | null
          room_name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_group_chat?: boolean
          room_avatar?: string | null
          room_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      chat_typing_status: {
        Row: {
          is_typing: boolean
          room_id: string
          started_typing_at: string
          user_id: string
        }
        Insert: {
          is_typing?: boolean
          room_id: string
          started_typing_at?: string
          user_id: string
        }
        Update: {
          is_typing?: boolean
          room_id?: string
          started_typing_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_typing_status_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      country_tiers: {
        Row: {
          country_code: string
          tier: number
          updated_at: string
        }
        Insert: {
          country_code: string
          tier: number
          updated_at?: string
        }
        Update: {
          country_code?: string
          tier?: number
          updated_at?: string
        }
        Relationships: []
      }
      deposits: {
        Row: {
          created_at: string
          credited_pewgift: number
          external_ref: string | null
          fee_pewgift: number
          gross_pewgift: number
          id: string
          idempotency_key: string
          metadata: Json
          platform_rate_pct: number
          provider_code: string | null
          rate_used: number
          route: Database["public"]["Enums"]["deposit_route"]
          settled_at: string | null
          source_amount: number
          source_currency: string
          status: Database["public"]["Enums"]["deposit_state"]
          user_id: string
        }
        Insert: {
          created_at?: string
          credited_pewgift?: number
          external_ref?: string | null
          fee_pewgift?: number
          gross_pewgift?: number
          id?: string
          idempotency_key: string
          metadata?: Json
          platform_rate_pct?: number
          provider_code?: string | null
          rate_used: number
          route: Database["public"]["Enums"]["deposit_route"]
          settled_at?: string | null
          source_amount: number
          source_currency: string
          status?: Database["public"]["Enums"]["deposit_state"]
          user_id: string
        }
        Update: {
          created_at?: string
          credited_pewgift?: number
          external_ref?: string | null
          fee_pewgift?: number
          gross_pewgift?: number
          id?: string
          idempotency_key?: string
          metadata?: Json
          platform_rate_pct?: number
          provider_code?: string | null
          rate_used?: number
          route?: Database["public"]["Enums"]["deposit_route"]
          settled_at?: string | null
          source_amount?: number
          source_currency?: string
          status?: Database["public"]["Enums"]["deposit_state"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposits_provider_code_fkey"
            columns: ["provider_code"]
            isOneToOne: false
            referencedRelation: "payment_providers"
            referencedColumns: ["code"]
          },
        ]
      }
      escrow_agreements: {
        Row: {
          arbitrator_id: string | null
          client_id: string
          created_at: string
          description: string | null
          id: string
          provider_id: string
          status: Database["public"]["Enums"]["escrow_contract_state"]
          title: string
          total_contract_value: number
          updated_at: string
        }
        Insert: {
          arbitrator_id?: string | null
          client_id: string
          created_at?: string
          description?: string | null
          id?: string
          provider_id: string
          status?: Database["public"]["Enums"]["escrow_contract_state"]
          title: string
          total_contract_value: number
          updated_at?: string
        }
        Update: {
          arbitrator_id?: string | null
          client_id?: string
          created_at?: string
          description?: string | null
          id?: string
          provider_id?: string
          status?: Database["public"]["Enums"]["escrow_contract_state"]
          title?: string
          total_contract_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      escrow_disputes: {
        Row: {
          admin_action: Database["public"]["Enums"]["escrow_status"] | null
          admin_notes: string | null
          created_at: string | null
          evidence_urls: string[] | null
          id: string
          initiated_by: string | null
          reason: string
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          transaction_id: string | null
        }
        Insert: {
          admin_action?: Database["public"]["Enums"]["escrow_status"] | null
          admin_notes?: string | null
          created_at?: string | null
          evidence_urls?: string[] | null
          id?: string
          initiated_by?: string | null
          reason: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          transaction_id?: string | null
        }
        Update: {
          admin_action?: Database["public"]["Enums"]["escrow_status"] | null
          admin_notes?: string | null
          created_at?: string | null
          evidence_urls?: string[] | null
          id?: string
          initiated_by?: string | null
          reason?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escrow_disputes_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "escrow_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_milestones: {
        Row: {
          created_at: string
          escrow_id: string
          id: string
          milestone_title: string
          milestone_value: number
          status: Database["public"]["Enums"]["escrow_milestone_state"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          escrow_id: string
          id?: string
          milestone_title: string
          milestone_value: number
          status?: Database["public"]["Enums"]["escrow_milestone_state"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          escrow_id?: string
          id?: string
          milestone_title?: string
          milestone_value?: number
          status?: Database["public"]["Enums"]["escrow_milestone_state"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_milestones_escrow_id_fkey"
            columns: ["escrow_id"]
            isOneToOne: false
            referencedRelation: "escrow_agreements"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_transactions: {
        Row: {
          amount: number
          buyer_id: string
          created_at: string | null
          id: string
          seller_id: string
          status: Database["public"]["Enums"]["escrow_status"] | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          buyer_id: string
          created_at?: string | null
          id?: string
          seller_id: string
          status?: Database["public"]["Enums"]["escrow_status"] | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          buyer_id?: string
          created_at?: string | null
          id?: string
          seller_id?: string
          status?: Database["public"]["Enums"]["escrow_status"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fee_settings: {
        Row: {
          country_code: string | null
          flat_fee: number
          id: string
          is_active: boolean
          max_amount: number | null
          min_amount: number
          percent_rate: number
          route: Database["public"]["Enums"]["deposit_route"] | null
          scope: string
          updated_at: string
        }
        Insert: {
          country_code?: string | null
          flat_fee?: number
          id?: string
          is_active?: boolean
          max_amount?: number | null
          min_amount?: number
          percent_rate?: number
          route?: Database["public"]["Enums"]["deposit_route"] | null
          scope: string
          updated_at?: string
        }
        Update: {
          country_code?: string | null
          flat_fee?: number
          id?: string
          is_active?: boolean
          max_amount?: number | null
          min_amount?: number
          percent_rate?: number
          route?: Database["public"]["Enums"]["deposit_route"] | null
          scope?: string
          updated_at?: string
        }
        Relationships: []
      }
      feed_generation_logs: {
        Row: {
          action_performed: string
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action_performed: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action_performed?: string
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: []
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
      gamification_activity_log: {
        Row: {
          action_type: string
          created_at: string
          id: string
          metadata: Json
          user_id: string
          xp_awarded: number
        }
        Insert: {
          action_type: string
          created_at?: string
          id?: string
          metadata?: Json
          user_id: string
          xp_awarded: number
        }
        Update: {
          action_type?: string
          created_at?: string
          id?: string
          metadata?: Json
          user_id?: string
          xp_awarded?: number
        }
        Relationships: []
      }
      gift_catalog: {
        Row: {
          cost_credits: number
          created_at: string
          icon_url: string | null
          id: string
          is_active: boolean
          name: string
          tier: Database["public"]["Enums"]["gift_tier_level"]
        }
        Insert: {
          cost_credits: number
          created_at?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          tier?: Database["public"]["Enums"]["gift_tier_level"]
        }
        Update: {
          cost_credits?: number
          created_at?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          tier?: Database["public"]["Enums"]["gift_tier_level"]
        }
        Relationships: []
      }
      gift_limits: {
        Row: {
          daily_limit: number | null
          daily_sent: number | null
          monthly_limit: number | null
          monthly_sent: number | null
          per_gift_limit: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          daily_limit?: number | null
          daily_sent?: number | null
          monthly_limit?: number | null
          monthly_sent?: number | null
          per_gift_limit?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          daily_limit?: number | null
          daily_sent?: number | null
          monthly_limit?: number | null
          monthly_sent?: number | null
          per_gift_limit?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      gift_transactions: {
        Row: {
          created_at: string
          credit_value: number
          gift_id: string
          id: string
          recipient_id: string
          sender_id: string
          stream_id: string | null
        }
        Insert: {
          created_at?: string
          credit_value: number
          gift_id: string
          id?: string
          recipient_id: string
          sender_id: string
          stream_id?: string | null
        }
        Update: {
          created_at?: string
          credit_value?: number
          gift_id?: string
          id?: string
          recipient_id?: string
          sender_id?: string
          stream_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gift_transactions_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gift_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_transactions_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
        ]
      }
      idempotency_keys: {
        Row: {
          created_at: string
          key: string
          response: Json | null
          scope: string
        }
        Insert: {
          created_at?: string
          key: string
          response?: Json | null
          scope: string
        }
        Update: {
          created_at?: string
          key?: string
          response?: Json | null
          scope?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["notification_event_type"]
          id: string
          is_read: boolean
          message_text: string
          notifier_id: string | null
          recipient_id: string
          source_id: string
        }
        Insert: {
          created_at?: string
          event_type: Database["public"]["Enums"]["notification_event_type"]
          id?: string
          is_read?: boolean
          message_text: string
          notifier_id?: string | null
          recipient_id: string
          source_id: string
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["notification_event_type"]
          id?: string
          is_read?: boolean
          message_text?: string
          notifier_id?: string | null
          recipient_id?: string
          source_id?: string
        }
        Relationships: []
      }
      p2p_listings: {
        Row: {
          alt_payment_method_id: string | null
          asset_code: string
          available_pewgift: number
          created_at: string
          id: string
          is_active: boolean
          margin_pct: number
          max_amount: number
          min_amount: number
          payment_method_id: string | null
          seller_id: string
          terms: string | null
          updated_at: string
        }
        Insert: {
          alt_payment_method_id?: string | null
          asset_code: string
          available_pewgift?: number
          created_at?: string
          id?: string
          is_active?: boolean
          margin_pct?: number
          max_amount: number
          min_amount?: number
          payment_method_id?: string | null
          seller_id: string
          terms?: string | null
          updated_at?: string
        }
        Update: {
          alt_payment_method_id?: string | null
          asset_code?: string
          available_pewgift?: number
          created_at?: string
          id?: string
          is_active?: boolean
          margin_pct?: number
          max_amount?: number
          min_amount?: number
          payment_method_id?: string | null
          seller_id?: string
          terms?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "p2p_listings_alt_payment_method_id_fkey"
            columns: ["alt_payment_method_id"]
            isOneToOne: false
            referencedRelation: "seller_payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "p2p_listings_asset_code_fkey"
            columns: ["asset_code"]
            isOneToOne: false
            referencedRelation: "supported_assets"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "p2p_listings_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "seller_payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "p2p_listings_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      p2p_trades: {
        Row: {
          amount: number
          asset_code: string | null
          buyer_id: string
          chat_room_id: string | null
          created_at: string
          dispute_reason: string | null
          expires_at: string | null
          fee_pewgift: number
          id: string
          listing_id: string | null
          margin_pct: number
          paid_declared_at: string | null
          payment_method_id: string | null
          rate_used: number | null
          released_at: string | null
          seller_id: string
          source_amount: number | null
          status: Database["public"]["Enums"]["p2p_trade_status"]
          updated_at: string
        }
        Insert: {
          amount: number
          asset_code?: string | null
          buyer_id: string
          chat_room_id?: string | null
          created_at?: string
          dispute_reason?: string | null
          expires_at?: string | null
          fee_pewgift?: number
          id?: string
          listing_id?: string | null
          margin_pct?: number
          paid_declared_at?: string | null
          payment_method_id?: string | null
          rate_used?: number | null
          released_at?: string | null
          seller_id: string
          source_amount?: number | null
          status?: Database["public"]["Enums"]["p2p_trade_status"]
          updated_at?: string
        }
        Update: {
          amount?: number
          asset_code?: string | null
          buyer_id?: string
          chat_room_id?: string | null
          created_at?: string
          dispute_reason?: string | null
          expires_at?: string | null
          fee_pewgift?: number
          id?: string
          listing_id?: string | null
          margin_pct?: number
          paid_declared_at?: string | null
          payment_method_id?: string | null
          rate_used?: number | null
          released_at?: string | null
          seller_id?: string
          source_amount?: number | null
          status?: Database["public"]["Enums"]["p2p_trade_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "p2p_trades_asset_code_fkey"
            columns: ["asset_code"]
            isOneToOne: false
            referencedRelation: "supported_assets"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "p2p_trades_chat_room_id_fkey"
            columns: ["chat_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "p2p_trades_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "p2p_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "p2p_trades_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "seller_payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          label: string | null
          last4: string | null
          metadata: Json
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          last4?: string | null
          metadata?: Json
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string | null
          last4?: string | null
          metadata?: Json
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_providers: {
        Row: {
          code: string
          config: Json
          created_at: string
          display_name: string
          id: string
          is_enabled: boolean
          route: Database["public"]["Enums"]["deposit_route"]
          supported_currencies: string[]
          updated_at: string
        }
        Insert: {
          code: string
          config?: Json
          created_at?: string
          display_name: string
          id?: string
          is_enabled?: boolean
          route: Database["public"]["Enums"]["deposit_route"]
          supported_currencies?: string[]
          updated_at?: string
        }
        Update: {
          code?: string
          config?: Json
          created_at?: string
          display_name?: string
          id?: string
          is_enabled?: boolean
          route?: Database["public"]["Enums"]["deposit_route"]
          supported_currencies?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      platform_configurations: {
        Row: {
          config_key: string
          config_values: Json
          created_at: string
          id: number
          updated_at: string
        }
        Insert: {
          config_key: string
          config_values?: Json
          created_at?: string
          id?: number
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_values?: Json
          created_at?: string
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          comment_text: string
          created_at: string
          id: string
          parent_id: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          comment_text: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          comment_text?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_gifts: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          post_id: string | null
          receiver_id: string | null
          sender_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          post_id?: string | null
          receiver_id?: string | null
          sender_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          post_id?: string | null
          receiver_id?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_gifts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_tags: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          tag_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          tag_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_tags_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number
          content: string
          created_at: string
          hashtags: string[]
          id: string
          likes_count: number
          media_urls: string[]
          shares_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number
          content: string
          created_at?: string
          hashtags?: string[]
          id?: string
          likes_count?: number
          media_urls?: string[]
          shares_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number
          content?: string
          created_at?: string
          hashtags?: string[]
          id?: string
          likes_count?: number
          media_urls?: string[]
          shares_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          referral_code: string
          referral_earnings: number
          referred_by: string | null
          total_referrals: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          referral_code: string
          referral_earnings?: number
          referred_by?: string | null
          total_referrals?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          referral_code?: string
          referral_earnings?: number
          referred_by?: string | null
          total_referrals?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          comment_id: string | null
          created_at: string | null
          description: string | null
          id: string
          post_id: string | null
          reason: string
          reported_user_id: string | null
          reporter_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          post_id?: string | null
          reason: string
          reported_user_id?: string | null
          reporter_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          post_id?: string | null
          reason?: string
          reported_user_id?: string | null
          reporter_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alerts: {
        Row: {
          actor_id: string | null
          created_at: string
          detail: Json
          id: string
          kind: string
          severity: string
          subject_id: string | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          detail?: Json
          id?: string
          kind: string
          severity?: string
          subject_id?: string | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          detail?: Json
          id?: string
          kind?: string
          severity?: string
          subject_id?: string | null
        }
        Relationships: []
      }
      seller_payment_methods: {
        Row: {
          account_name: string | null
          account_ref: string | null
          asset_code: string | null
          bank_name: string | null
          created_at: string
          id: string
          instructions: string | null
          kind: Database["public"]["Enums"]["seller_method_kind"]
          network: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          seller_id: string
          status: Database["public"]["Enums"]["seller_method_state"]
          updated_at: string
        }
        Insert: {
          account_name?: string | null
          account_ref?: string | null
          asset_code?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          instructions?: string | null
          kind: Database["public"]["Enums"]["seller_method_kind"]
          network?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_id: string
          status?: Database["public"]["Enums"]["seller_method_state"]
          updated_at?: string
        }
        Update: {
          account_name?: string | null
          account_ref?: string | null
          asset_code?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          instructions?: string | null
          kind?: Database["public"]["Enums"]["seller_method_kind"]
          network?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          seller_id?: string
          status?: Database["public"]["Enums"]["seller_method_state"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_payment_methods_asset_code_fkey"
            columns: ["asset_code"]
            isOneToOne: false
            referencedRelation: "supported_assets"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "seller_payment_methods_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "seller_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      seller_profiles: {
        Row: {
          granted_at: string
          granted_by: string
          is_active: boolean
          max_margin_pct: number
          notes: string | null
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by: string
          is_active?: boolean
          max_margin_pct?: number
          notes?: string | null
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string
          is_active?: boolean
          max_margin_pct?: number
          notes?: string | null
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      status_views: {
        Row: {
          id: string
          status_id: string
          viewed_at: string
          viewer_id: string
        }
        Insert: {
          id?: string
          status_id: string
          viewed_at?: string
          viewer_id: string
        }
        Update: {
          id?: string
          status_id?: string
          viewed_at?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "status_views_status_id_fkey"
            columns: ["status_id"]
            isOneToOne: false
            referencedRelation: "user_statuses"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_chats: {
        Row: {
          created_at: string
          id: string
          is_pinned: boolean
          message_text: string
          stream_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_pinned?: boolean
          message_text: string
          stream_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_pinned?: boolean
          message_text?: string
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_chats_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_match_events: {
        Row: {
          actor_id: string
          created_at: string
          gift_id: string | null
          id: string
          kind: Database["public"]["Enums"]["stream_match_event_kind"]
          match_id: string
          points: number
          side: number
        }
        Insert: {
          actor_id: string
          created_at?: string
          gift_id?: string | null
          id?: string
          kind: Database["public"]["Enums"]["stream_match_event_kind"]
          match_id: string
          points: number
          side: number
        }
        Update: {
          actor_id?: string
          created_at?: string
          gift_id?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["stream_match_event_kind"]
          match_id?: string
          points?: number
          side?: number
        }
        Relationships: [
          {
            foreignKeyName: "stream_match_events_gift_id_fkey"
            columns: ["gift_id"]
            isOneToOne: false
            referencedRelation: "gift_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "stream_matches"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_match_participants: {
        Row: {
          id: string
          joined_at: string
          match_id: string
          score: number
          side: number
          stream_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          match_id: string
          score?: number
          side: number
          stream_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          match_id?: string
          score?: number
          side?: number
          stream_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_match_participants_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "stream_matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stream_match_participants_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
        ]
      }
      stream_matches: {
        Row: {
          created_at: string
          created_by: string
          duration_seconds: number
          ends_at: string | null
          id: string
          mode: Database["public"]["Enums"]["stream_match_mode"]
          started_at: string | null
          status: Database["public"]["Enums"]["stream_match_state"]
          updated_at: string
          winning_side: number | null
        }
        Insert: {
          created_at?: string
          created_by: string
          duration_seconds?: number
          ends_at?: string | null
          id?: string
          mode?: Database["public"]["Enums"]["stream_match_mode"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["stream_match_state"]
          updated_at?: string
          winning_side?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string
          duration_seconds?: number
          ends_at?: string | null
          id?: string
          mode?: Database["public"]["Enums"]["stream_match_mode"]
          started_at?: string | null
          status?: Database["public"]["Enums"]["stream_match_state"]
          updated_at?: string
          winning_side?: number | null
        }
        Relationships: []
      }
      stream_settings: {
        Row: {
          created_at: string
          settings: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          settings?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          settings?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stream_viewers: {
        Row: {
          id: string
          is_active: boolean
          joined_at: string
          left_at: string | null
          stream_id: string
          viewer_id: string
        }
        Insert: {
          id?: string
          is_active?: boolean
          joined_at?: string
          left_at?: string | null
          stream_id: string
          viewer_id: string
        }
        Update: {
          id?: string
          is_active?: boolean
          joined_at?: string
          left_at?: string | null
          stream_id?: string
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stream_viewers_stream_id_fkey"
            columns: ["stream_id"]
            isOneToOne: false
            referencedRelation: "streams"
            referencedColumns: ["id"]
          },
        ]
      }
      streams: {
        Row: {
          broadcast_status: Database["public"]["Enums"]["stream_broadcast_state"]
          created_at: string
          creator_id: string
          current_viewer_count: number
          description: string | null
          ended_at: string | null
          id: string
          peak_viewer_count: number
          started_at: string | null
          stream_key: string
          title: string
          updated_at: string
        }
        Insert: {
          broadcast_status?: Database["public"]["Enums"]["stream_broadcast_state"]
          created_at?: string
          creator_id: string
          current_viewer_count?: number
          description?: string | null
          ended_at?: string | null
          id?: string
          peak_viewer_count?: number
          started_at?: string | null
          stream_key: string
          title: string
          updated_at?: string
        }
        Update: {
          broadcast_status?: Database["public"]["Enums"]["stream_broadcast_state"]
          created_at?: string
          creator_id?: string
          current_viewer_count?: number
          description?: string | null
          ended_at?: string | null
          id?: string
          peak_viewer_count?: number
          started_at?: string | null
          stream_key?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_contacts: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      supported_assets: {
        Row: {
          code: string
          decimals: number
          display_name: string
          is_enabled: boolean
          kind: Database["public"]["Enums"]["p2p_asset_kind"]
          max_deposit: number | null
          min_deposit: number
          network: string | null
          rate_updated_at: string
          reference_rate: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          decimals?: number
          display_name: string
          is_enabled?: boolean
          kind: Database["public"]["Enums"]["p2p_asset_kind"]
          max_deposit?: number | null
          min_deposit?: number
          network?: string | null
          rate_updated_at?: string
          reference_rate?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          decimals?: number
          display_name?: string
          is_enabled?: boolean
          kind?: Database["public"]["Enums"]["p2p_asset_kind"]
          max_deposit?: number | null
          min_deposit?: number
          network?: string | null
          rate_updated_at?: string
          reference_rate?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string
          icon: string | null
          id: string
          metadata: Json | null
          type: Database["public"]["Enums"]["transaction_category"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          icon?: string | null
          id?: string
          metadata?: Json | null
          type: Database["public"]["Enums"]["transaction_category"]
          user_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          metadata?: Json | null
          type?: Database["public"]["Enums"]["transaction_category"]
          user_id?: string
        }
        Relationships: []
      }
      trending_hashtags: {
        Row: {
          count: number | null
          hashtag: string
          id: string
          last_updated: string | null
        }
        Insert: {
          count?: number | null
          hashtag: string
          id?: string
          last_updated?: string | null
        }
        Update: {
          count?: number | null
          hashtag?: string
          id?: string
          last_updated?: string | null
        }
        Relationships: []
      }
      user: {
        Row: {
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          bio: string | null
          birth_date: string | null
          can_toggle_rank: boolean
          cover_url: string | null
          created_at: string | null
          default_stream_title: string | null
          display_name: string | null
          email: string | null
          followers_count: number
          following_count: number
          full_name: string | null
          gender: string | null
          hide_rank: boolean
          interest_tags: string[] | null
          is_banned: boolean
          is_private: boolean
          is_verified: boolean | null
          last_seen: string | null
          location: string | null
          phone: string | null
          phone_hash: string | null
          posts_count: number
          profile_completed: boolean
          push_token: string | null
          rank: string | null
          rank_level: number
          rank_points: number
          rank_toggle_expires: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          stream_quality: string | null
          updated_at: string | null
          user_id: string
          username: string
          verified_at: string | null
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          bio?: string | null
          birth_date?: string | null
          can_toggle_rank?: boolean
          cover_url?: string | null
          created_at?: string | null
          default_stream_title?: string | null
          display_name?: string | null
          email?: string | null
          followers_count?: number
          following_count?: number
          full_name?: string | null
          gender?: string | null
          hide_rank?: boolean
          interest_tags?: string[] | null
          is_banned?: boolean
          is_private?: boolean
          is_verified?: boolean | null
          last_seen?: string | null
          location?: string | null
          phone?: string | null
          phone_hash?: string | null
          posts_count?: number
          profile_completed?: boolean
          push_token?: string | null
          rank?: string | null
          rank_level?: number
          rank_points?: number
          rank_toggle_expires?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          stream_quality?: string | null
          updated_at?: string | null
          user_id: string
          username: string
          verified_at?: string | null
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          bio?: string | null
          birth_date?: string | null
          can_toggle_rank?: boolean
          cover_url?: string | null
          created_at?: string | null
          default_stream_title?: string | null
          display_name?: string | null
          email?: string | null
          followers_count?: number
          following_count?: number
          full_name?: string | null
          gender?: string | null
          hide_rank?: boolean
          interest_tags?: string[] | null
          is_banned?: boolean
          is_private?: boolean
          is_verified?: boolean | null
          last_seen?: string | null
          location?: string | null
          phone?: string | null
          phone_hash?: string | null
          posts_count?: number
          profile_completed?: boolean
          push_token?: string | null
          rank?: string | null
          rank_level?: number
          rank_points?: number
          rank_toggle_expires?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          stream_quality?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string
          verified_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      user_blocks: {
        Row: {
          blocked_id: string | null
          blocker_id: string | null
          created_at: string | null
          id: string
        }
        Insert: {
          blocked_id?: string | null
          blocker_id?: string | null
          created_at?: string | null
          id?: string
        }
        Update: {
          blocked_id?: string | null
          blocker_id?: string | null
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_gamification_profiles: {
        Row: {
          current_level: number
          current_xp: number
          daily_streak_count: number
          last_active_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          current_level?: number
          current_xp?: number
          daily_streak_count?: number
          last_active_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          current_level?: number
          current_xp?: number
          daily_streak_count?: number
          last_active_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_statuses: {
        Row: {
          caption: string | null
          created_at: string
          duration_seconds: number
          expires_at: string
          id: string
          media_url: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          duration_seconds?: number
          expires_at?: string
          id?: string
          media_url: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          duration_seconds?: number
          expires_at?: string
          id?: string
          media_url?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_ledger: {
        Row: {
          amount: number
          counterpart_id: string | null
          created_at: string
          id: string
          metadata: Json
          reference_id: string | null
          transaction_type: Database["public"]["Enums"]["wallet_transaction_ledger_type"]
          wallet_id: string
        }
        Insert: {
          amount: number
          counterpart_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          reference_id?: string | null
          transaction_type: Database["public"]["Enums"]["wallet_transaction_ledger_type"]
          wallet_id: string
        }
        Update: {
          amount?: number
          counterpart_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json
          reference_id?: string | null
          transaction_type?: Database["public"]["Enums"]["wallet_transaction_ledger_type"]
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_ledger_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["user_id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number
          currency: string
          is_locked: boolean
          locked_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          currency?: string
          is_locked?: boolean
          locked_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          currency?: string
          is_locked?: boolean
          locked_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string
          currency: string
          destination: string | null
          id: string
          payment_method_id: string | null
          processed_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          destination?: string | null
          id?: string
          payment_method_id?: string | null
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          destination?: string | null
          id?: string
          payment_method_id?: string | null
          processed_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          interest_tags: string[] | null
          is_verified: boolean | null
          location: string | null
          phone_hash: string | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          interest_tags?: string[] | null
          is_verified?: boolean | null
          location?: string | null
          phone_hash?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          interest_tags?: string[] | null
          is_verified?: boolean | null
          location?: string | null
          phone_hash?: string | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      atomic_transfer: {
        Args: {
          p_amount: number
          p_receiver_id: string
          p_sender_id: string
          p_type: string
        }
        Returns: boolean
      }
      calculate_author_reputation: {
        Args: { p_user_id: string }
        Returns: {
          reputation_score: number
        }[]
      }
      cancel_p2p_trade: {
        Args: { p_actor_id: string; p_reason?: string; p_trade_id: string }
        Returns: number
      }
      check_email_available: {
        Args: { p_email: string }
        Returns: {
          available: boolean
        }[]
      }
      check_gift_limits: {
        Args: { gift_amount: number; recipient_id: string; sender_id: string }
        Returns: Json
      }
      check_username_available:
        | {
            Args: { p_username: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.check_username_available(p_username => text), public.check_username_available(p_username => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"[]
          }
        | {
            Args: { p_username: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.check_username_available(p_username => text), public.check_username_available(p_username => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"[]
          }
      cleanup_old_data: { Args: never; Returns: undefined }
      declare_p2p_paid: {
        Args: { p_actor_id: string; p_trade_id: string }
        Returns: string
      }
      dispute_p2p_trade: {
        Args: { p_actor_id: string; p_reason: string; p_trade_id: string }
        Returns: undefined
      }
      ensure_wallet: {
        Args: { p_currency?: string; p_user_id: string }
        Returns: undefined
      }
      finalize_stream_match: { Args: { p_match_id: string }; Returns: number }
      get_suggested_friends: {
        Args: { p_user_id: string }
        Returns: {
          match_score: number
          target_user_id: string
        }[]
      }
      is_chat_room_member: { Args: { p_room_id: string }; Returns: boolean }
      match_p2p_sellers: {
        Args: { p_amount: number; p_asset_code: string; p_limit?: number }
        Returns: {
          available_pewgift: number
          effective_rate: number
          has_alt_method: boolean
          is_verified: boolean
          listing_id: string
          margin_pct: number
          price_per_pewgift: number
          quote_amount: number
          reference_rate: number
          role: Database["public"]["Enums"]["user_role"]
          seller_id: string
          username: string
        }[]
      }
      open_p2p_trade: {
        Args: { p_amount: number; p_buyer_id: string; p_listing_id: string }
        Returns: string
      }
      process_live_pewgift: {
        Args: { gift_amount: number; target_streamer_id: string }
        Returns: boolean
      }
      process_pewgift:
        | {
            Args: {
              p_amount: number
              p_post_id: string
              p_receiver_id: string
              p_sender_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_amount: number
              p_post_id: string
              p_receiver_id: string
              p_sender_id: string
            }
            Returns: undefined
          }
      record_match_event: {
        Args: {
          p_actor_id: string
          p_gift_id?: string
          p_kind: Database["public"]["Enums"]["stream_match_event_kind"]
          p_match_id: string
          p_points: number
          p_side: number
        }
        Returns: number
      }
      release_p2p_trade: {
        Args: { p_actor_id: string; p_trade_id: string }
        Returns: number
      }
      seller_is_frozen: {
        Args: { p_seller_id: string; p_window?: string }
        Returns: boolean
      }
      send_pewgift: {
        Args: {
          p_context?: Json
          p_gift_id: string
          p_quantity?: number
          p_recipient_id: string
          p_sender_id: string
          p_stream_id?: string
        }
        Returns: Json
      }
      settle_deposit: { Args: { p_deposit_id: string }; Returns: number }
      sync_stream_viewer_counts: {
        Args: { p_stream_id: string }
        Returns: number
      }
      transfer_pewgift: {
        Args: {
          p_amount: number
          p_credit_type: Database["public"]["Enums"]["wallet_transaction_ledger_type"]
          p_debit_type: Database["public"]["Enums"]["wallet_transaction_ledger_type"]
          p_metadata?: Json
          p_recipient_id: string
          p_reference_id?: string
          p_sender_id: string
        }
        Returns: number
      }
    }
    Enums: {
      ad_action_type: "IMPRESSION" | "CLICK"
      ad_billing_type_mode: "CPC" | "CPM"
      ad_campaign_lifecycle_status:
        | "PENDING_REVIEW"
        | "ACTIVE"
        | "PAUSED"
        | "COMPLETED"
        | "BUDGET_EXHAUSTED"
      ad_campaign_status:
        | "DRAFT"
        | "PENDING_REVIEW"
        | "ACTIVE"
        | "PAUSED"
        | "COMPLETED"
      call_lifecycle_status:
        | "RINGING"
        | "CONNECTED"
        | "MISSED"
        | "REJECTED"
        | "DISCONNECTED"
      call_type_mode: "AUDIO" | "VIDEO"
      deposit_route:
        | "CARD"
        | "PSP"
        | "BANK_TRANSFER"
        | "CRYPTO"
        | "P2P"
        | "SUPPORT_AGENT"
      deposit_state:
        | "PENDING"
        | "AWAITING_PAYMENT"
        | "SETTLED"
        | "FAILED"
        | "REFUNDED"
      escrow_contract_state:
        | "PROPOSED"
        | "FUNDED"
        | "DISPUTED"
        | "COMPLETED"
        | "REFUNDED"
      escrow_lifecycle_status:
        | "HELD"
        | "MILESTONE_MET"
        | "RELEASED"
        | "DISPUTED"
        | "REFUNDED"
      escrow_milestone_state: "PENDING" | "RELEASE_REQUESTED" | "RELEASED"
      escrow_status:
        | "created"
        | "funded"
        | "confirmed_delivery"
        | "released"
        | "disputed"
        | "cancelled"
        | "refunded"
      gift_tier_level: "BRONZE" | "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND"
      notification_event_type:
        | "FOLLOW_RECEIVED"
        | "POST_LIKE"
        | "COMMENT_ADDED"
        | "COMMENT_REPLY"
        | "GIFT_RECEIVED"
        | "ESCROW_UPDATE"
        | "STREAM_LIVE"
        | "SYSTEM_ALERT"
      p2p_asset_kind: "FIAT" | "CRYPTO"
      p2p_trade_status:
        | "created"
        | "funded"
        | "disputed"
        | "released"
        | "cancelled"
      seller_method_kind: "BANK" | "CRYPTO" | "CUSTOM"
      seller_method_state: "PENDING" | "APPROVED" | "REJECTED"
      stream_broadcast_state: "PREPARING" | "LIVE" | "ENDED"
      stream_match_event_kind: "GIFT" | "TAP"
      stream_match_mode: "SOLO" | "TEAM"
      stream_match_state: "PENDING" | "LIVE" | "FINISHED" | "CANCELLED"
      transaction_category: "credit" | "debit"
      user_role: "user" | "moderator" | "admin" | "manager"
      wallet_transaction_ledger_type:
        | "DEPOSIT"
        | "WITHDRAWAL"
        | "P2P_TIPPING_SENT"
        | "P2P_TIPPING_RECEIVED"
        | "GIFT_PURCHASE"
        | "GIFT_RECOVERY_REDEEM"
        | "ESCROW_COLLATERAL_LOCK"
        | "ESCROW_MILESTONE_RELEASE"
        | "ESCROW_DISPUTE_REFUND"
        | "AD_ENGAGEMENT_REVENUE"
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
      ad_action_type: ["IMPRESSION", "CLICK"],
      ad_billing_type_mode: ["CPC", "CPM"],
      ad_campaign_lifecycle_status: [
        "PENDING_REVIEW",
        "ACTIVE",
        "PAUSED",
        "COMPLETED",
        "BUDGET_EXHAUSTED",
      ],
      ad_campaign_status: [
        "DRAFT",
        "PENDING_REVIEW",
        "ACTIVE",
        "PAUSED",
        "COMPLETED",
      ],
      call_lifecycle_status: [
        "RINGING",
        "CONNECTED",
        "MISSED",
        "REJECTED",
        "DISCONNECTED",
      ],
      call_type_mode: ["AUDIO", "VIDEO"],
      deposit_route: [
        "CARD",
        "PSP",
        "BANK_TRANSFER",
        "CRYPTO",
        "P2P",
        "SUPPORT_AGENT",
      ],
      deposit_state: [
        "PENDING",
        "AWAITING_PAYMENT",
        "SETTLED",
        "FAILED",
        "REFUNDED",
      ],
      escrow_contract_state: [
        "PROPOSED",
        "FUNDED",
        "DISPUTED",
        "COMPLETED",
        "REFUNDED",
      ],
      escrow_lifecycle_status: [
        "HELD",
        "MILESTONE_MET",
        "RELEASED",
        "DISPUTED",
        "REFUNDED",
      ],
      escrow_milestone_state: ["PENDING", "RELEASE_REQUESTED", "RELEASED"],
      escrow_status: [
        "created",
        "funded",
        "confirmed_delivery",
        "released",
        "disputed",
        "cancelled",
        "refunded",
      ],
      gift_tier_level: ["BRONZE", "SILVER", "GOLD", "PLATINUM", "DIAMOND"],
      notification_event_type: [
        "FOLLOW_RECEIVED",
        "POST_LIKE",
        "COMMENT_ADDED",
        "COMMENT_REPLY",
        "GIFT_RECEIVED",
        "ESCROW_UPDATE",
        "STREAM_LIVE",
        "SYSTEM_ALERT",
      ],
      p2p_asset_kind: ["FIAT", "CRYPTO"],
      p2p_trade_status: [
        "created",
        "funded",
        "disputed",
        "released",
        "cancelled",
      ],
      seller_method_kind: ["BANK", "CRYPTO", "CUSTOM"],
      seller_method_state: ["PENDING", "APPROVED", "REJECTED"],
      stream_broadcast_state: ["PREPARING", "LIVE", "ENDED"],
      stream_match_event_kind: ["GIFT", "TAP"],
      stream_match_mode: ["SOLO", "TEAM"],
      stream_match_state: ["PENDING", "LIVE", "FINISHED", "CANCELLED"],
      transaction_category: ["credit", "debit"],
      user_role: ["user", "moderator", "admin", "manager"],
      wallet_transaction_ledger_type: [
        "DEPOSIT",
        "WITHDRAWAL",
        "P2P_TIPPING_SENT",
        "P2P_TIPPING_RECEIVED",
        "GIFT_PURCHASE",
        "GIFT_RECOVERY_REDEEM",
        "ESCROW_COLLATERAL_LOCK",
        "ESCROW_MILESTONE_RELEASE",
        "ESCROW_DISPUTE_REFUND",
        "AD_ENGAGEMENT_REVENUE",
      ],
    },
  },
} as const

