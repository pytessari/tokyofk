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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cards: {
        Row: {
          card_number: string
          character_key: string
          character_name: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          rarity: string
          season: string | null
          updated_at: string
        }
        Insert: {
          card_number: string
          character_key: string
          character_name: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          rarity?: string
          season?: string | null
          updated_at?: string
        }
        Update: {
          card_number?: string
          character_key?: string
          character_name?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          rarity?: string
          season?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      communities: {
        Row: {
          banner_url: string | null
          category: string | null
          created_at: string
          description: string | null
          icon_url: string | null
          id: string
          is_public: boolean
          members_count: number
          name: string
          owner_id: string
          rules: string | null
          slug: string
          tagline: string | null
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_public?: boolean
          members_count?: number
          name: string
          owner_id: string
          rules?: string | null
          slug: string
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          icon_url?: string | null
          id?: string
          is_public?: boolean
          members_count?: number
          name?: string
          owner_id?: string
          rules?: string | null
          slug?: string
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      community_members: {
        Row: {
          community_id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          community_id: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          community_id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          author_id: string
          community_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          community_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          community_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
        ]
      }
      discord_links: {
        Row: {
          created_at: string
          discord_id: string | null
          expires_at: string | null
          id: string
          updated_at: string
          user_id: string
          verified_at: string | null
          verify_code: string | null
        }
        Insert: {
          created_at?: string
          discord_id?: string | null
          expires_at?: string | null
          id?: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verify_code?: string | null
        }
        Update: {
          created_at?: string
          discord_id?: string | null
          expires_at?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verify_code?: string | null
        }
        Relationships: []
      }
      family_links: {
        Row: {
          created_at: string
          id: string
          kind: string
          name: string
          owner_id: string
          slug: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          name: string
          owner_id: string
          slug?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          name?: string
          owner_id?: string
          slug?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "family_links_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: []
      }
      guestbook: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          profile_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          profile_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guestbook_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      magazine_pages: {
        Row: {
          body: string | null
          created_at: string
          id: string
          image_url: string | null
          magazine_id: string
          page_number: number
          title: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          magazine_id: string
          page_number: number
          title?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          magazine_id?: string
          page_number?: number
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "magazine_pages_magazine_id_fkey"
            columns: ["magazine_id"]
            isOneToOne: false
            referencedRelation: "magazines"
            referencedColumns: ["id"]
          },
        ]
      }
      magazines: {
        Row: {
          cover_url: string | null
          created_at: string
          id: string
          issue_number: number | null
          published: boolean
          published_at: string | null
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          id?: string
          issue_number?: number | null
          published?: boolean
          published_at?: string | null
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          id?: string
          issue_number?: number | null
          published?: boolean
          published_at?: string | null
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          kind: string
          payload: Json
          read_at: string | null
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          read_at?: string | null
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          read_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: []
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: []
      }
      posts: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          bio_html: string | null
          character_key: string | null
          created_at: string
          discord_id: string | null
          display_name: string
          id: string
          partner_name: string | null
          partner_slug: string | null
          relationship_status: string | null
          role: string | null
          sign: string | null
          slug: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          bio_html?: string | null
          character_key?: string | null
          created_at?: string
          discord_id?: string | null
          display_name: string
          id: string
          partner_name?: string | null
          partner_slug?: string | null
          relationship_status?: string | null
          role?: string | null
          sign?: string | null
          slug?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          bio_html?: string | null
          character_key?: string | null
          created_at?: string
          discord_id?: string | null
          display_name?: string
          id?: string
          partner_name?: string | null
          partner_slug?: string | null
          relationship_status?: string | null
          role?: string | null
          sign?: string | null
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_cards: {
        Row: {
          acquired_at: string
          card_id: string
          id: string
          quantity: number
          user_id: string
        }
        Insert: {
          acquired_at?: string
          card_id: string
          id?: string
          quantity?: number
          user_id: string
        }
        Update: {
          acquired_at?: string
          card_id?: string
          id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_cards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "cards"
            referencedColumns: ["id"]
          },
        ]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_community_member: {
        Args: { _community: string; _user: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "member"
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
      app_role: ["admin", "member"],
    },
  },
} as const
