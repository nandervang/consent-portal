// Simple database type definitions for Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          bank_id_number: string;
          email: string;
          full_name: string;
          role: 'participant' | 'researcher' | 'administrator';
          bank_id_verified: boolean;
          last_bank_id_auth?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      studies: {
        Row: {
          id: string;
          title: string;
          description?: string;
          researcher_id: string;
          pdf_document_id?: string;
          status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
          start_date?: string;
          end_date?: string;
          max_participants: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['studies']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['studies']['Insert']>;
      };
      consent_records: {
        Row: {
          id: string;
          user_id: string;
          study_id: string;
          consent_given: boolean;
          bank_id_transaction_id: string;
          timestamp: string;
          ip_address?: string;
          user_agent?: string;
          withdrawn_at?: string;
          withdrawal_reason?: string;
        };
        Insert: Omit<Database['public']['Tables']['consent_records']['Row'], 'id' | 'timestamp'>;
        Update: Partial<Database['public']['Tables']['consent_records']['Insert']>;
      };
      pdf_documents: {
        Row: {
          id: string;
          filename: string;
          original_filename: string;
          file_path: string;
          file_size: number;
          content_type: string;
          upload_timestamp: string;
          uploaded_by: string;
          validated: boolean;
          validation_errors?: string[];
          checksum: string;
        };
        Insert: Omit<Database['public']['Tables']['pdf_documents']['Row'], 'id' | 'upload_timestamp'>;
        Update: Partial<Database['public']['Tables']['pdf_documents']['Insert']>;
      };
    };
  };
}