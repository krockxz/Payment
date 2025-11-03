import { useEffect, useState } from 'react';
import { dashboardAPI } from '@/lib/api';
import { toast } from 'sonner';
import type { DashboardSummary, Cheque } from '@/lib/types';

interface DashboardData {
  summary: DashboardSummary | null;
  pendingCheques: Cheque[];
  bouncedCheques: Cheque[];
}

const createEmptySummary = (): DashboardSummary => ({
  pendingCheques: { count: 0, totalAmount: 0 },
  clearedCheques: { count: 0, totalAmount: 0 },
  bouncedCheques: { count: 0, totalAmount: 0 },
  cashToday: 0,
});

const createEmptyDashboardData = (): DashboardData => ({
  summary: createEmptySummary(),
  pendingCheques: [],
  bouncedCheques: [],
});

export function useDashboardData(refreshTrigger?: number) {
  const [data, setData] = useState<DashboardData>(createEmptyDashboardData());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const [summaryData, pendingData, bouncedData] = await Promise.all([
        dashboardAPI.getDashboardSummary(),
        dashboardAPI.getPendingCheques(),
        dashboardAPI.getBouncedCheques(),
      ]);

      setData({
        summary: summaryData || createEmptySummary(),
        pendingCheques: Array.isArray(pendingData) ? pendingData : [],
        bouncedCheques: Array.isArray(bouncedData) ? bouncedData : [],
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
      setError(errorMessage);
      toast.error(errorMessage);
      setData(createEmptyDashboardData());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [refreshTrigger]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
}