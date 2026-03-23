// SIM 2.0 Database Types
// Auto-generated style — use `type` aliases (not interface) for domain types.
// Supabase JS v2 requires Relationships: [] on every table.
// Views must be {} (empty object), NOT Record<string, never>.

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
      organizations: {
        Row: {
          id: string
          name: string
          org_type: 'district' | 'charter' | 'independent'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          org_type: 'district' | 'charter' | 'independent'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          org_type?: 'district' | 'charter' | 'independent'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: SIMRole
          organization_id: string | null
          school_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          role: SIMRole
          organization_id?: string | null
          school_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: SIMRole
          organization_id?: string | null
          school_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'profiles_id_fkey'
            columns: ['id']
            isOneToOne: true
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profiles_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'profiles_school_id_fkey'
            columns: ['school_id']
            isOneToOne: false
            referencedRelation: 'schools'
            referencedColumns: ['id']
          },
        ]
      }
      schools: {
        Row: {
          id: string
          organization_id: string
          name: string
          city: string | null
          state: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          city?: string | null
          state?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          city?: string | null
          state?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'schools_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      students: {
        Row: {
          id: string
          organization_id: string
          school_id: string | null
          first_name: string
          last_name: string
          grade: string | null
          student_ext_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          school_id?: string | null
          first_name: string
          last_name: string
          grade?: string | null
          student_ext_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          school_id?: string | null
          first_name?: string
          last_name?: string
          grade?: string | null
          student_ext_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'students_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'students_school_id_fkey'
            columns: ['school_id']
            isOneToOne: false
            referencedRelation: 'schools'
            referencedColumns: ['id']
          },
        ]
      }
      signals: {
        Row: {
          id: string
          student_id: string
          organization_id: string
          category: string
          index_type: IndexType
          base_score: number
          source_type: SourceType
          evidence_flag: boolean
          free_text: string | null
          reported_by: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          organization_id: string
          category: string
          index_type: IndexType
          base_score: number
          source_type: SourceType
          evidence_flag?: boolean
          free_text?: string | null
          reported_by?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          organization_id?: string
          category?: string
          index_type?: IndexType
          base_score?: number
          source_type?: SourceType
          evidence_flag?: boolean
          free_text?: string | null
          reported_by?: string | null
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'signals_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'signals_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'signals_reported_by_fkey'
            columns: ['reported_by']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
        ]
      }
      snapshots: {
        Row: {
          id: string
          student_id: string
          organization_id: string
          ssi_value: number
          ssi_state: SSIState
          trci_value: number
          trci_state: TRCIState
          ssi_trend: TrendDirection
          trci_trend: TrendDirection
          confidence: number
          is_current: boolean
          computed_at: string
        }
        Insert: {
          id?: string
          student_id: string
          organization_id: string
          ssi_value?: number
          ssi_state?: SSIState
          trci_value?: number
          trci_state?: TRCIState
          ssi_trend?: TrendDirection
          trci_trend?: TrendDirection
          confidence?: number
          is_current?: boolean
          computed_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          organization_id?: string
          ssi_value?: number
          ssi_state?: SSIState
          trci_value?: number
          trci_state?: TRCIState
          ssi_trend?: TrendDirection
          trci_trend?: TrendDirection
          confidence?: number
          is_current?: boolean
          computed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'snapshots_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'snapshots_organization_id_fkey'
            columns: ['organization_id']
            isOneToOne: false
            referencedRelation: 'organizations'
            referencedColumns: ['id']
          },
        ]
      }
      category_scores: {
        Row: {
          id: string
          student_id: string
          snapshot_id: string | null
          category: string
          index_type: IndexType
          score: number
          signal_count: number
          computed_at: string
        }
        Insert: {
          id?: string
          student_id: string
          snapshot_id?: string | null
          category: string
          index_type: IndexType
          score: number
          signal_count?: number
          computed_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          snapshot_id?: string | null
          category?: string
          index_type?: IndexType
          score?: number
          signal_count?: number
          computed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'category_scores_student_id_fkey'
            columns: ['student_id']
            isOneToOne: false
            referencedRelation: 'students'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'category_scores_snapshot_id_fkey'
            columns: ['snapshot_id']
            isOneToOne: false
            referencedRelation: 'snapshots'
            referencedColumns: ['id']
          },
        ]
      }
      explanations: {
        Row: {
          id: string
          snapshot_id: string
          top_drivers: Json
          threshold_events: Json
          summary_text: string
          expanded_text: string | null
          computed_at: string
        }
        Insert: {
          id?: string
          snapshot_id: string
          top_drivers?: Json
          threshold_events?: Json
          summary_text?: string
          expanded_text?: string | null
          computed_at?: string
        }
        Update: {
          id?: string
          snapshot_id?: string
          top_drivers?: Json
          threshold_events?: Json
          summary_text?: string
          expanded_text?: string | null
          computed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'explanations_snapshot_id_fkey'
            columns: ['snapshot_id']
            isOneToOne: false
            referencedRelation: 'snapshots'
            referencedColumns: ['id']
          },
        ]
      }
      audit_log: {
        Row: {
          id: string
          timestamp: string
          user_id: string | null
          user_email: string
          user_role: string
          organization_id: string | null
          entity_type: string
          entity_id: string | null
          action: string
          old_value: string | null
          new_value: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          timestamp?: string
          user_id?: string | null
          user_email: string
          user_role: string
          organization_id?: string | null
          entity_type: string
          entity_id?: string | null
          action: string
          old_value?: string | null
          new_value?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          timestamp?: string
          user_id?: string | null
          user_email?: string
          user_role?: string
          organization_id?: string | null
          entity_type?: string
          entity_id?: string | null
          action?: string
          old_value?: string | null
          new_value?: string | null
          metadata?: Json | null
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {
      current_user_org_id: {
        Args: Record<string, never>
        Returns: string
      }
      current_user_role: {
        Args: Record<string, never>
        Returns: string
      }
      is_platform_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// ============================================================
// Domain type aliases (MUST be `type`, NOT `interface`)
// ============================================================

export type Organization = Database['public']['Tables']['organizations']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type School = Database['public']['Tables']['schools']['Row']
export type Student = Database['public']['Tables']['students']['Row']
export type Signal = Database['public']['Tables']['signals']['Row']
export type Snapshot = Database['public']['Tables']['snapshots']['Row']
export type CategoryScore = Database['public']['Tables']['category_scores']['Row']
export type Explanation = Database['public']['Tables']['explanations']['Row']
export type AuditLogEntry = Database['public']['Tables']['audit_log']['Row']

// ============================================================
// Enum-like union types
// ============================================================

export type SIMRole =
  | 'platform_admin'
  | 'sim_admin'
  | 'sim_counselor'
  | 'sim_threat_team'
  | 'sim_principal'

export type IndexType = 'SSI' | 'TRCI'

export type SSIState = 'S0' | 'S1' | 'S2' | 'S3' | 'S4'
export type TRCIState = 'C0' | 'C1' | 'C2' | 'C3' | 'C4'

export type TrendDirection = 'improving' | 'stable' | 'rising' | 'rising_rapidly'

export type SourceType =
  | 'teacher'
  | 'admin'
  | 'counselor'
  | 'student'
  | 'parent'
  | 'anonymous'
  | 'system'
  | 'evidence'
  | 'law_enforcement'

// ============================================================
// JSON sub-types (for explanations JSONB columns)
// ============================================================

export type TopDriver = {
  category: string
  index_type: IndexType
  contribution_pct: number
  score: number
  label: string
}

export type ThresholdEvent = {
  index_type: IndexType
  previous_state: string
  new_state: string
  direction: 'up' | 'down'
  label: string
}
