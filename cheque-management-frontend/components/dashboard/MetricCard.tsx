import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  description?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  variant = 'default',
  description
}: MetricCardProps) {
  const variantStyles = {
    default: 'border-border',
    success: 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20',
    warning: 'border-yellow-200 bg-yellow-50/50 dark:border-yellow-800 dark:bg-yellow-950/20',
    destructive: 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20',
  };

  const getTrendingIcon = () => {
    if (changeType === 'increase') return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (changeType === 'decrease') return <TrendingDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  return (
    <Card className={cn('relative overflow-hidden transition-all duration-200 hover:shadow-md', variantStyles[variant])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          <div className="text-2xl font-bold">
            {typeof value === 'number' ? formatCurrency(value) : value}
          </div>
          {change !== undefined && (
            <div className="flex items-center space-x-1">
              {getTrendingIcon()}
              <span className={cn(
                'text-xs font-medium',
                changeType === 'increase' ? 'text-green-600' :
                changeType === 'decrease' ? 'text-red-600' : 'text-muted-foreground'
              )}>
                {Math.abs(change)}%
              </span>
            </div>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}