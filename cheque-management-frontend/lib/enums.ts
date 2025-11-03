// Cheque status enum
export enum ChequeStatus {
  PENDING = 'pending',
  DEPOSITED = 'deposited',
  CLEARED = 'cleared',
  BOUNCED = 'bounced'
}

// Export format enum
export enum ExportFormat {
  CSV = 'csv'
}

// Page routes enum
export enum AppRoutes {
  DASHBOARD = '/dashboard',
  CHEQUES = '/cheques',
  CHEQUES_CREATE = '/cheques/create',
  CASH = '/cash',
  CASH_CREATE = '/cash/create',
  SETTINGS = '/settings'
}