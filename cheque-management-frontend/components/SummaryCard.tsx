import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/formatters';

interface SummaryCardProps {
  title: string;
  count?: number;
  amount: number;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

export function SummaryCard({ title, count, amount, variant = 'default' }: SummaryCardProps) {
  const variantStyles = {
    default: 'border-border',
    success: 'border-green-500 bg-green-50 dark:bg-green-950',
    warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950',
    destructive: 'border-red-500 bg-red-50 dark:bg-red-950',
  };

  return (
    <Card className={variantStyles[variant]}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatCurrency(amount)}</div>
        {count !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">{count} {count === 1 ? 'cheque' : 'cheques'}</p>
        )}
      </CardContent>
    </Card>
  );
}