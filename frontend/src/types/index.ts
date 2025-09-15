// Database types generated from the data model
export type UserRole = 'participant' | 'researcher' | 'administrator';
export type StudyStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface User {
  id: string;
  bank_id_number: string;
  email: string;
  full_name: string;
  role: UserRole;
  bank_id_verified: boolean;
  last_bank_id_auth?: string;
  created_at: string;
  updated_at: string;
}

export interface Study {
  id: string;
  title: string;
  description?: string;
  researcher_id: string;
  pdf_document_id?: string;
  status: StudyStatus;
  start_date?: string;
  end_date?: string;
  max_participants: number;
  created_at: string;
  updated_at: string;
}

export interface ConsentRecord {
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
}

export interface PDFDocument {
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
}

// API request/response types
export interface BankIdInitiateRequest {
  personalNumber: string;
}

export interface BankIdInitiateResponse {
  orderRef: string;
  autoStartToken: string;
  qrStartToken: string;
  qrStartSecret: string;
}

export interface BankIdStatusResponse {
  status: 'pending' | 'failed' | 'complete';
  hintCode?: string;
  completionData?: {
    user: {
      personalNumber: string;
      name: string;
      givenName: string;
      surname: string;
    };
    device: {
      ipAddress: string;
    };
  };
}

export interface CreateStudyRequest {
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  max_participants?: number;
}

export interface ConsentSubmissionRequest {
  study_id: string;
  consent_given: boolean;
  bank_id_transaction_id: string;
}

export interface ConsentWithdrawalRequest {
  study_id: string;
  withdrawal_reason?: string;
}

// Component prop types
export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (personalNumber: string) => Promise<void>;
  logout: () => void;
  checkAuthStatus: (orderRef: string) => Promise<BankIdStatusResponse>;
}

export interface StudyWithPdf extends Study {
  pdf_document?: PDFDocument;
}

export interface StudyCardProps {
  study: StudyWithPdf;
  onSelect?: (study: StudyWithPdf) => void;
  showConsentStatus?: boolean;
}

export interface ConsentFormProps {
  study: StudyWithPdf;
  onSubmit: (consent: boolean) => Promise<void>;
  isSubmitting: boolean;
}

export interface PDFViewerProps {
  document: PDFDocument;
  onError?: (error: Error) => void;
}

// Error types
export class ConsentPortalError extends Error {
  public code: string;
  public statusCode?: number;
  
  constructor(message: string, code: string, statusCode?: number) {
    super(message);
    this.name = 'ConsentPortalError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class BankIdError extends ConsentPortalError {
  public hintCode?: string;
  
  constructor(message: string, hintCode?: string) {
    super(message, 'BANKID_ERROR');
    this.hintCode = hintCode;
  }
}

export class ValidationError extends ConsentPortalError {
  public field?: string;
  
  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.field = field;
  }
}

export class UnauthorizedError extends ConsentPortalError {
  constructor(message: string = 'Unauthorized access') {
    super(message, 'UNAUTHORIZED', 401);
  }
}