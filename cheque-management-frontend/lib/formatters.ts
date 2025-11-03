import { ChequeStatus } from './enums';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const calculateDaysUntilClear = (expectedClearDate: string): number => {
  const today = new Date();
  const clearDate = new Date(expectedClearDate);
  const diffTime = clearDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getStatusColor = (status: ChequeStatus): string => {
  switch (status) {
    case ChequeStatus.PENDING:
      return 'yellow';
    case ChequeStatus.DEPOSITED:
      return 'blue';
    case ChequeStatus.CLEARED:
      return 'green';
    case ChequeStatus.BOUNCED:
      return 'red';
    default:
      return 'gray';
  }
};

export const getStatusLabel = (status: ChequeStatus): string => {
  return status.charAt(0).toUpperCase() + status.slice(1);
};