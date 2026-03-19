export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          studio_name: string | null
          logo_url: string | null
          logo_url_light: string | null
          accent_color: string
          plan: string
          storage_used_bytes: number
          created_at: string
        }
        Insert: {
          id: string
          studio_name?: string | null
          logo_url?: string | null
          logo_url_light?: string | null
          accent_color?: string
          plan?: string
          storage_used_bytes?: number
          created_at?: string
        }
        Update: {
          id?: string
          studio_name?: string | null
          logo_url?: string | null
          logo_url_light?: string | null
          accent_color?: string
          plan?: string
          storage_used_bytes?: number
          created_at?: string
        }
        Relationships: []
      }
      galleries: {
        Row: {
          id: string
          photographer_id: string
          slug: string
          title: string
          client_name: string | null
          client_email: string | null
          cover_url: string | null
          layout: string
          theme: string
          pin_enabled: boolean
          pin_code: string | null
          admin_bypass: boolean
          downloads_enabled: boolean
          zip_enabled: boolean
          favorites_enabled: boolean
          download_sizes: string
          expiry_date: string | null
          expiry_reminder_days: number
          status: string
          view_count: number
          grid_cols: number
          grid_gutter: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          photographer_id: string
          slug: string
          title: string
          client_name?: string | null
          client_email?: string | null
          cover_url?: string | null
          layout?: string
          theme?: string
          pin_enabled?: boolean
          pin_code?: string | null
          admin_bypass?: boolean
          downloads_enabled?: boolean
          zip_enabled?: boolean
          favorites_enabled?: boolean
          download_sizes?: string
          expiry_date?: string | null
          expiry_reminder_days?: number
          status?: string
          view_count?: number
          grid_cols?: number
          grid_gutter?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          photographer_id?: string
          slug?: string
          title?: string
          client_name?: string | null
          client_email?: string | null
          cover_url?: string | null
          layout?: string
          theme?: string
          pin_enabled?: boolean
          pin_code?: string | null
          admin_bypass?: boolean
          downloads_enabled?: boolean
          zip_enabled?: boolean
          favorites_enabled?: boolean
          download_sizes?: string
          expiry_date?: string | null
          expiry_reminder_days?: number
          status?: string
          view_count?: number
          grid_cols?: number
          grid_gutter?: number
          updated_at?: string
        }
        Relationships: []
      }
      photos: {
        Row: {
          id: string
          gallery_id: string
          r2_key: string
          url: string
          thumb_url: string
          filename: string | null
          size_bytes: number | null
          width: number | null
          height: number | null
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          gallery_id: string
          r2_key: string
          url: string
          thumb_url: string
          filename?: string | null
          size_bytes?: number | null
          width?: number | null
          height?: number | null
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          gallery_id?: string
          r2_key?: string
          url?: string
          thumb_url?: string
          filename?: string | null
          size_bytes?: number | null
          width?: number | null
          height?: number | null
          position?: number
        }
        Relationships: []
      }
      favorites: {
        Row: {
          id: string
          gallery_id: string
          session_token: string
          photo_id: string
          created_at: string
        }
        Insert: {
          id?: string
          gallery_id: string
          session_token: string
          photo_id: string
          created_at?: string
        }
        Update: {
          id?: string
          gallery_id?: string
          session_token?: string
          photo_id?: string
        }
        Relationships: []
      }
      downloads: {
        Row: {
          id: string
          gallery_id: string
          photo_id: string | null
          session_token: string | null
          is_bulk: boolean
          created_at: string
        }
        Insert: {
          id?: string
          gallery_id: string
          photo_id?: string | null
          session_token?: string | null
          is_bulk?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          gallery_id?: string
          photo_id?: string | null
          session_token?: string | null
          is_bulk?: boolean
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Gallery = Database['public']['Tables']['galleries']['Row']
export type Photo = Database['public']['Tables']['photos']['Row']
export type Favorite = Database['public']['Tables']['favorites']['Row']
export type Download = Database['public']['Tables']['downloads']['Row']
