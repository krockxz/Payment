import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Calendar, AlertTriangle } from 'lucide-react';
import { formatCurrency, formatDate, calculateDaysUntilClear } from '@/lib/formatters';
import type { Cheque } from '@/lib/types';

interface ChequesTableProps {
  title: string;
  cheques: Cheque[];
  columns?: ('chequeNumber' | 'amount' | 'payerName' | 'date' | 'daysUntil' | 'status')[];
  maxHeight?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
  emptyMessage?: string;
  variant?: 'pending' | 'bounced' | 'all';
}

const defaultColumns: Array<'chequeNumber' | 'amount' | 'payerName' | 'date' | 'daysUntil'> = ['chequeNumber', 'amount', 'payerName', 'date', 'daysUntil'];

export function ChequesTable({
  title,
  cheques,
  columns = defaultColumns,
  maxHeight = '400px',
  showViewAll = false,
  onViewAll,
  emptyMessage = `No ${title.toLowerCase()}`,
  variant = 'all'
}: ChequesTableProps) {
  const getDaysBadgeVariant = (days: number): "default" | "secondary" | "destructive" | "outline" => {
    if (days < 0) return 'destructive';
    if (days <= 3) return 'secondary';
    if (days <= 7) return 'outline';
    return 'default';
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'cleared': return 'default';
      case 'bounced': return 'destructive';
      case 'deposited': return 'outline';
      default: return 'secondary';
    }
  };

  const renderCell = (cheque: Cheque, column: typeof columns[number]) => {
    switch (column) {
      case 'chequeNumber':
        return (
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm font-medium">{cheque.cheque_number}</span>
            {variant === 'bounced' && <AlertTriangle className="h-4 w-4 text-red-500" />}
          </div>
        );

      case 'amount':
        return <span className="font-semibold">{formatCurrency(cheque.amount)}</span>;

      case 'payerName':
        return <span className="text-sm">{cheque.payer_name}</span>;

      case 'date':
        const date = variant === 'bounced' ? cheque.cheque_date : cheque.expected_clear_date;
        return (
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">{formatDate(date)}</span>
          </div>
        );

      case 'daysUntil':
        if (variant === 'bounced') return null;
        const days = calculateDaysUntilClear(cheque.expected_clear_date);
        return (
          <Badge variant={getDaysBadgeVariant(days)}>
            {days} days
          </Badge>
        );

      case 'status':
        return (
          <Badge variant={getStatusBadgeVariant(cheque.status)}>
            {cheque.status}
          </Badge>
        );

      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">{title}</CardTitle>
        {showViewAll && (
          <Button variant="outline" size="sm" onClick={onViewAll}>
            View All
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {cheques.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="text-muted-foreground mb-2">
              {variant === 'bounced' ? (
                <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
              ) : (
                <Eye className="h-12 w-12 mx-auto mb-2" />
              )}
            </div>
            <p className="text-sm font-medium">{emptyMessage}</p>
          </div>
        ) : (
          <ScrollArea className={maxHeight ? `max-h-[${maxHeight}]` : ''}>
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column} className="whitespace-nowrap">
                      {column === 'chequeNumber' && 'Cheque #'}
                      {column === 'amount' && 'Amount'}
                      {column === 'payerName' && 'Payer'}
                      {column === 'date' && (variant === 'bounced' ? 'Bounce Date' : 'Expected Clear')}
                      {column === 'daysUntil' && 'Days Until'}
                      {column === 'status' && 'Status'}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {cheques.map((cheque) => (
                  <TableRow key={cheque.id} className="hover:bg-muted/50">
                    {columns.map((column) => (
                      <TableCell key={column}>
                        {renderCell(cheque, column)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}