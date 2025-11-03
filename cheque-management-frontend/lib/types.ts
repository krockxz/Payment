import type { ChequeStatus } from './enums';

// Cheque interface
export interface Cheque {
  id: number;
  cheque_number: string;
  amount: number;
  payer_name: string;
  cheque_date: string;
  expected_clear_date: string;
  actual_clear_date: string | null;
  status: ChequeStatus;
  invoice_reference: string;
  notes: string;
  created_at: string;
}

// Cash Record interface
export interface CashRecord {
  id: number;
  amount: number;
  date: string;
  reference_person: string;
  purpose: string;
  invoice_reference: string;
  notes: string;
  created_at: string;
}

// Dashboard Summary interface
export interface DashboardSummary {
  pendingCheques: {
    count: number;
    totalAmount: number;
  };
  clearedCheques: {
    count: number;
    totalAmount: number;
  };
  bouncedCheques: {
    count: number;
    totalAmount: number;
  };
  cashToday: number;
}

// Paginated Response interface
export interface PaginatedResponse<T> {
  records?: T[];
  cheques?: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API Error Response
export interface APIError {
  message: string;
  code?: string;
  path?: string;
  method?: string;
}

// Form Data interfaces
export interface ChequeFormData {
  cheque_number: string;
  amount: number;
  payer_name: string;
  cheque_date: string;
  expected_clear_date: string;
  status: ChequeStatus;
  invoice_reference: string;
  notes: string;
}

export interface CashFormData {
  amount: number;
  date: string;
  reference_person: string;
  purpose: string;
  invoice_reference: string;
  notes: string;
}