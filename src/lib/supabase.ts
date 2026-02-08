import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      workflows: {
        Row: {
          id: string
          name: string
          description: string
          category: string
          tags: string[]
          complexity: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          nodes_count: number
          file_path: string
          file_size: number
          price: number
          download_count: number
          rating: number
          created_at: string
          updated_at: string
          embedding?: number[]
        }
        Insert: {
          id?: string
          name: string
          description: string
          category: string
          tags?: string[]
          complexity?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          nodes_count?: number
          file_path: string
          file_size: number
          price?: number
          download_count?: number
          rating?: number
          created_at?: string
          updated_at?: string
          embedding?: number[]
        }
        Update: {
          id?: string
          name?: string
          description?: string
          category?: string
          tags?: string[]
          complexity?: 'beginner' | 'intermediate' | 'advanced' | 'expert'
          nodes_count?: number
          file_path?: string
          file_size?: number
          price?: number
          download_count?: number
          rating?: number
          created_at?: string
          updated_at?: string
          embedding?: number[]
        }
      }
      users: {
        Row: {
          id: string
          email: string
          subscription_tier: 'free' | 'basic' | 'pro' | 'enterprise'
          downloads_this_month: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          subscription_tier?: 'free' | 'basic' | 'pro' | 'enterprise'
          downloads_this_month?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          subscription_tier?: 'free' | 'basic' | 'pro' | 'enterprise'
          downloads_this_month?: number
          created_at?: string
          updated_at?: string
        }
      }
      downloads: {
        Row: {
          id: string
          user_id: string
          workflow_id: string
          downloaded_at: string
          price_paid: number
        }
        Insert: {
          id?: string
          user_id: string
          workflow_id: string
          downloaded_at?: string
          price_paid?: number
        }
        Update: {
          id?: string
          user_id?: string
          workflow_id?: string
          downloaded_at?: string
          price_paid?: number
        }
      }
    }
  }
}
