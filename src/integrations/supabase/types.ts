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
      physician_certifications: {
        Row: {
          board_name: string
          certification_date: string | null
          created_at: string
          expiration_date: string | null
          id: string
          physician_id: string
          specialty: string
          subspecialty: string | null
          updated_at: string
        }
        Insert: {
          board_name: string
          certification_date?: string | null
          created_at?: string
          expiration_date?: string | null
          id?: string
          physician_id: string
          specialty: string
          subspecialty?: string | null
          updated_at?: string
        }
        Update: {
          board_name?: string
          certification_date?: string | null
          created_at?: string
          expiration_date?: string | null
          id?: string
          physician_id?: string
          specialty?: string
          subspecialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "physician_certifications_physician_id_fkey"
            columns: ["physician_id"]
            isOneToOne: false
            referencedRelation: "physicians"
            referencedColumns: ["id"]
          },
        ]
      }
      physician_compliance: {
        Row: {
          created_at: string
          id: string
          license_revocations: boolean | null
          license_revocations_explanation: string | null
          malpractice_claims: boolean | null
          malpractice_claims_explanation: string | null
          medicare_sanctions: boolean | null
          medicare_sanctions_explanation: string | null
          pending_investigations: boolean | null
          pending_investigations_explanation: string | null
          physician_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          license_revocations?: boolean | null
          license_revocations_explanation?: string | null
          malpractice_claims?: boolean | null
          malpractice_claims_explanation?: string | null
          medicare_sanctions?: boolean | null
          medicare_sanctions_explanation?: string | null
          pending_investigations?: boolean | null
          pending_investigations_explanation?: string | null
          physician_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          license_revocations?: boolean | null
          license_revocations_explanation?: string | null
          malpractice_claims?: boolean | null
          malpractice_claims_explanation?: string | null
          medicare_sanctions?: boolean | null
          medicare_sanctions_explanation?: string | null
          pending_investigations?: boolean | null
          pending_investigations_explanation?: string | null
          physician_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "physician_compliance_physician_id_fkey"
            columns: ["physician_id"]
            isOneToOne: false
            referencedRelation: "physicians"
            referencedColumns: ["id"]
          },
        ]
      }
      physician_documents: {
        Row: {
          created_at: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_sensitive: boolean | null
          mime_type: string | null
          physician_id: string
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_sensitive?: boolean | null
          mime_type?: string | null
          physician_id: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_sensitive?: boolean | null
          mime_type?: string | null
          physician_id?: string
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "physician_documents_physician_id_fkey"
            columns: ["physician_id"]
            isOneToOne: false
            referencedRelation: "physicians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physician_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      physician_education: {
        Row: {
          completion_date: string | null
          created_at: string
          education_type: string
          graduation_year: number | null
          id: string
          institution_name: string
          location: string | null
          physician_id: string
          specialty: string | null
          start_date: string | null
          updated_at: string
        }
        Insert: {
          completion_date?: string | null
          created_at?: string
          education_type: string
          graduation_year?: number | null
          id?: string
          institution_name: string
          location?: string | null
          physician_id: string
          specialty?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          completion_date?: string | null
          created_at?: string
          education_type?: string
          graduation_year?: number | null
          id?: string
          institution_name?: string
          location?: string | null
          physician_id?: string
          specialty?: string | null
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "physician_education_physician_id_fkey"
            columns: ["physician_id"]
            isOneToOne: false
            referencedRelation: "physicians"
            referencedColumns: ["id"]
          },
        ]
      }
      physician_hospital_affiliations: {
        Row: {
          created_at: string
          end_date: string | null
          hospital_name: string
          id: string
          physician_id: string
          privileges: string[] | null
          start_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          hospital_name: string
          id?: string
          physician_id: string
          privileges?: string[] | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          hospital_name?: string
          id?: string
          physician_id?: string
          privileges?: string[] | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "physician_hospital_affiliations_physician_id_fkey"
            columns: ["physician_id"]
            isOneToOne: false
            referencedRelation: "physicians"
            referencedColumns: ["id"]
          },
        ]
      }
      physician_licenses: {
        Row: {
          created_at: string
          expiration_date: string
          id: string
          license_number: string
          license_type: string | null
          physician_id: string
          state: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expiration_date: string
          id?: string
          license_number: string
          license_type?: string | null
          physician_id: string
          state: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expiration_date?: string
          id?: string
          license_number?: string
          license_type?: string | null
          physician_id?: string
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "physician_licenses_physician_id_fkey"
            columns: ["physician_id"]
            isOneToOne: false
            referencedRelation: "physicians"
            referencedColumns: ["id"]
          },
        ]
      }
      physician_work_history: {
        Row: {
          address: string | null
          created_at: string
          employer_name: string
          end_date: string | null
          id: string
          physician_id: string
          position: string | null
          reason_for_leaving: string | null
          start_date: string
          supervisor_name: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          employer_name: string
          end_date?: string | null
          id?: string
          physician_id: string
          position?: string | null
          reason_for_leaving?: string | null
          start_date: string
          supervisor_name?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          employer_name?: string
          end_date?: string | null
          id?: string
          physician_id?: string
          position?: string | null
          reason_for_leaving?: string | null
          start_date?: string
          supervisor_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "physician_work_history_physician_id_fkey"
            columns: ["physician_id"]
            isOneToOne: false
            referencedRelation: "physicians"
            referencedColumns: ["id"]
          },
        ]
      }
      physicians: {
        Row: {
          caqh_id: string | null
          coverage_limits: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          dea_number: string | null
          email_address: string | null
          emergency_contact: Json | null
          full_legal_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          group_npi: string | null
          group_tax_id: string | null
          home_address: string | null
          id: string
          mailing_address: string | null
          malpractice_carrier: string | null
          malpractice_expiration_date: string | null
          malpractice_policy_number: string | null
          npi: string | null
          office_contact_person: string | null
          office_fax: string | null
          office_phone: string | null
          phone_numbers: string[] | null
          practice_name: string | null
          primary_practice_address: string | null
          secondary_practice_addresses: string[] | null
          ssn: string | null
          status: string | null
          tin: string | null
          updated_at: string
        }
        Insert: {
          caqh_id?: string | null
          coverage_limits?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          dea_number?: string | null
          email_address?: string | null
          emergency_contact?: Json | null
          full_legal_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          group_npi?: string | null
          group_tax_id?: string | null
          home_address?: string | null
          id?: string
          mailing_address?: string | null
          malpractice_carrier?: string | null
          malpractice_expiration_date?: string | null
          malpractice_policy_number?: string | null
          npi?: string | null
          office_contact_person?: string | null
          office_fax?: string | null
          office_phone?: string | null
          phone_numbers?: string[] | null
          practice_name?: string | null
          primary_practice_address?: string | null
          secondary_practice_addresses?: string[] | null
          ssn?: string | null
          status?: string | null
          tin?: string | null
          updated_at?: string
        }
        Update: {
          caqh_id?: string | null
          coverage_limits?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          dea_number?: string | null
          email_address?: string | null
          emergency_contact?: Json | null
          full_legal_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          group_npi?: string | null
          group_tax_id?: string | null
          home_address?: string | null
          id?: string
          mailing_address?: string | null
          malpractice_carrier?: string | null
          malpractice_expiration_date?: string | null
          malpractice_policy_number?: string | null
          npi?: string | null
          office_contact_person?: string | null
          office_fax?: string | null
          office_phone?: string | null
          phone_numbers?: string[] | null
          practice_name?: string | null
          primary_practice_address?: string | null
          secondary_practice_addresses?: string[] | null
          ssn?: string | null
          status?: string | null
          tin?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "physicians_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_sensitive_data: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      document_type:
        | "drivers_license"
        | "social_security_card"
        | "dea_certificate"
        | "npi_confirmation"
        | "w9_form"
        | "liability_insurance"
        | "medical_license"
        | "board_certification"
        | "controlled_substance_registration"
        | "medical_diploma"
        | "residency_certificate"
        | "fellowship_certificate"
        | "hospital_privilege_letter"
        | "employment_verification"
        | "malpractice_insurance"
        | "npdb_report"
        | "cv"
        | "immunization_records"
        | "citizenship_proof"
      gender_type: "male" | "female" | "other" | "prefer_not_to_say"
      user_role: "admin" | "staff" | "viewer"
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
      document_type: [
        "drivers_license",
        "social_security_card",
        "dea_certificate",
        "npi_confirmation",
        "w9_form",
        "liability_insurance",
        "medical_license",
        "board_certification",
        "controlled_substance_registration",
        "medical_diploma",
        "residency_certificate",
        "fellowship_certificate",
        "hospital_privilege_letter",
        "employment_verification",
        "malpractice_insurance",
        "npdb_report",
        "cv",
        "immunization_records",
        "citizenship_proof",
      ],
      gender_type: ["male", "female", "other", "prefer_not_to_say"],
      user_role: ["admin", "staff", "viewer"],
    },
  },
} as const
