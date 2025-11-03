import { MetricCard } from './MetricCard';
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import type { DashboardSummary } from '@/lib/types';

interface MetricsGridProps {
  summary: DashboardSummary | null;
}

export function MetricsGrid({ summary }: MetricsGridProps) {
  if (!summary) {
    return null;
  }

  const metrics = [
    {
      title: 'Pending Cheques',
      value: summary.pendingCheques.totalAmount,
      icon: <AlertTriangle className="h-4 w-4" />,
      variant: 'warning' as const,
      description: `${summary.pendingCheques.count} pending cheque${summary.pendingCheques.count !== 1 ? 's' : ''}`,
      change: undefined,
      changeType: 'neutral' as const
    },
    {
      title: 'Cleared Cheques',
      value: summary.clearedCheques.totalAmount,
      icon: <CheckCircle className="h-4 w-4" />,
      variant: 'success' as const,
      description: `${summary.clearedCheques.count} cleared cheque${summary.clearedCheques.count !== 1 ? 's' : ''}`,
      change: undefined,
      changeType: 'neutral' as const
    },
    {
      title: 'Bounced Cheques',
      value: summary.bouncedCheques.totalAmount,
      icon: <TrendingUp className="h-4 w-4" />,
      variant: 'destructive' as const,
      description: `${summary.bouncedCheques.count} bounced cheque${summary.bouncedCheques.count !== 1 ? 's' : ''}`,
      change: undefined,
      changeType: 'neutral' as const
    },
    {
      title: "Today's Cash Collection",
      value: summary.cashToday,
      icon: <DollarSign className="h-4 w-4" />,
      variant: 'default' as const,
      description: 'Cash collected today',
      change: undefined,
      changeType: 'neutral' as const
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => (
        <MetricCard
          key={metric.title}
          {...metric}
        />
      ))}
    </div>
  );
}