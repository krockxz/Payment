import axios from 'axios';
import type { Cheque, CashRecord, DashboardSummary, PaginatedResponse, ChequeFormData, CashFormData } from './types';
import { ChequeStatus } from './enums';

// Use relative URLs to work with Next.js API proxy
const API_URL = '/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Error handler
const handleError = (error: any): never => {
  if (error.response) {
    throw new Error(error.response.data?.error?.message || error.response.data?.message || 'An error occurred');
  } else if (error.request) {
    throw new Error('No response from server. Please check your connection.');
  } else {
    throw new Error(error.message || 'An unexpected error occurred');
  }
};

// Cheque API functions
export const chequeAPI = {
  getCheques: async (page = 1, limit = 10, status: ChequeStatus | null = null): Promise<PaginatedResponse<Cheque>> => {
    try {
      const params: any = { page, limit };
      if (status) params.status = status;
      const response = await apiClient.get('/cheques', { params });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getCheque: async (id: number): Promise<Cheque> => {
    try {
      const response = await apiClient.get(`/cheques/${id}`);
      // Unwrap response if it's in { data: ..., error: null } format
      return response.data?.data || response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  createCheque: async (data: ChequeFormData): Promise<{ id: number }> => {
    try {
      const response = await apiClient.post('/cheques', data);
      // Unwrap response and extract id
      const result = response.data?.data || response.data;
      return { id: result.id };
    } catch (error) {
      return handleError(error);
    }
  },

  updateCheque: async (id: number, data: ChequeFormData): Promise<{ changes: number }> => {
    try {
      const response = await apiClient.put(`/cheques/${id}`, data);
      // Unwrap response if needed
      const result = response.data?.data || response.data;
      return { changes: result.changes || 1 };
    } catch (error) {
      return handleError(error);
    }
  },

  deleteCheque: async (id: number): Promise<{ changes: number }> => {
    try {
      const response = await apiClient.delete(`/cheques/${id}`);
      // Unwrap response if needed
      const result = response.data?.data || response.data;
      return { changes: result.changes || 1 };
    } catch (error) {
      return handleError(error);
    }
  },
};

// Cash API functions
export const cashAPI = {
  getCashRecords: async (page = 1, limit = 10, startDate: string | null = null, endDate: string | null = null): Promise<PaginatedResponse<CashRecord>> => {
    try {
      const params: any = { page, limit };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const response = await apiClient.get('/cash', { params });
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  createCashRecord: async (data: CashFormData): Promise<{ id: number }> => {
    try {
      const response = await apiClient.post('/cash', data);
      // Unwrap response and extract id
      const result = response.data?.data || response.data;
      return { id: result.id };
    } catch (error) {
      return handleError(error);
    }
  },

  updateCashRecord: async (id: number, data: CashFormData): Promise<{ changes: number }> => {
    try {
      const response = await apiClient.put(`/cash/${id}`, data);
      // Unwrap response if needed
      const result = response.data?.data || response.data;
      return { changes: result.changes || 1 };
    } catch (error) {
      return handleError(error);
    }
  },

  deleteCashRecord: async (id: number): Promise<{ changes: number }> => {
    try {
      const response = await apiClient.delete(`/cash/${id}`);
      // Unwrap response if needed
      const result = response.data?.data || response.data;
      return { changes: result.changes || 1 };
    } catch (error) {
      return handleError(error);
    }
  },

  getCashTotal: async (startDate: string | null = null, endDate: string | null = null): Promise<{ total: number }> => {
    try {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const response = await apiClient.get('/cash/total', { params });
      // Unwrap response and extract total
      const result = response.data?.data || response.data;
      return { total: result.total || 0 };
    } catch (error) {
      return handleError(error);
    }
  },
};

// Dashboard API functions
export const dashboardAPI = {
  getDashboardSummary: async (): Promise<DashboardSummary> => {
    try {
      const response = await apiClient.get('/dashboard/summary');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getPendingCheques: async (): Promise<Cheque[]> => {
    try {
      const response = await apiClient.get('/dashboard/pending-cheques');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getBouncedCheques: async (): Promise<Cheque[]> => {
    try {
      const response = await apiClient.get('/dashboard/bounced-cheques');
      return response.data;
    } catch (error) {
      return handleError(error);
    }
  },

  getCashToday: async (): Promise<{ total: number }> => {
    try {
      const response = await apiClient.get('/dashboard/cash-today');
      // Unwrap response and extract total from nested structure
      const result = response.data?.data || response.data;
      return { total: result?.total_cash_collected || result?.total || 0 };
    } catch (error) {
      return handleError(error);
    }
  },

  getPaymentStatus: async (invoiceId: string): Promise<any> => {
    try {
      const response = await apiClient.get('/dashboard/payment-status', {
        params: { invoice_id: invoiceId }
      });
      // Unwrap response if it's in { data: ..., error: null } format
      return response.data?.data || response.data;
    } catch (error) {
      return handleError(error);
    }
  },
};

// Export API functions
export const exportAPI = {
  exportCheques: async (): Promise<void> => {
    try {
      const response = await apiClient.get('/export/all-cheques', {
        params: { format: 'csv' },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cheques_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      return handleError(error);
    }
  },

  exportCash: async (): Promise<void> => {
    try {
      const response = await apiClient.get('/export/cash-records', {
        params: { format: 'csv' },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cash_records_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      return handleError(error);
    }
  },
};