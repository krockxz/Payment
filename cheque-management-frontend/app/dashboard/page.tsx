'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { SummaryCard } from '@/components/SummaryCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChequeForm } from '@/components/ChequeForm';
import { CashForm } from '@/components/CashForm';
import { Skeleton } from '@/components/ui/skeleton';
import ChequeCalendarView from '@/components/ChequeCalendarView';
import { dashboardAPI, chequeAPI, cashAPI } from '@/lib/api';
import { formatCurrency, formatDate, calculateDaysUntilClear } from '@/lib/formatters';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import type { DashboardSummary, Cheque, ChequeFormData, CashFormData } from '@/lib/types';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [pendingCheques, setPendingCheques] = useState<Cheque[]>([]);
  const [bouncedCheques, setBouncedCheques] = useState<Cheque[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isChequeModalOpen, setIsChequeModalOpen] = useState(false);
  const [isCashModalOpen, setIsCashModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [summaryData, pendingData, bouncedData] = await Promise.all([
        dashboardAPI.getDashboardSummary(),
        dashboardAPI.getPendingCheques(),
        dashboardAPI.getBouncedCheques(),
      ]);

      // Handle null/undefined responses with fallback values
      setSummary(summaryData || {
        pendingCheques: { count: 0, totalAmount: 0 },
        clearedCheques: { count: 0, totalAmount: 0 },
        bouncedCheques: { count: 0, totalAmount: 0 },
        cashToday: 0,
      });
      setPendingCheques(Array.isArray(pendingData) ? pendingData : []);
      setBouncedCheques(Array.isArray(bouncedData) ? bouncedData : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load dashboard data');

      // Set empty state on error
      setSummary({
        pendingCheques: { count: 0, totalAmount: 0 },
        clearedCheques: { count: 0, totalAmount: 0 },
        bouncedCheques: { count: 0, totalAmount: 0 },
        cashToday: 0,
      });
      setPendingCheques([]);
      setBouncedCheques([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleChequeSubmit = async (data: ChequeFormData) => {
    try {
      await chequeAPI.createCheque(data);
      toast.success('Cheque created successfully');
      setIsChequeModalOpen(false);
      fetchDashboardData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create cheque');
    }
  };

  const handleCashSubmit = async (data: CashFormData) => {
    try {
      await cashAPI.createCashRecord(data);
      toast.success('Cash entry created successfully');
      setIsCashModalOpen(false);
      fetchDashboardData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create cash entry');
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={() => setIsChequeModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Cheque
          </Button>
          <Button onClick={() => setIsCashModalOpen(true)} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Cash Entry
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Pending Cheques"
          count={summary?.pendingCheques?.count || 0}
          amount={summary?.pendingCheques?.totalAmount || 0}
          variant="warning"
        />
        <SummaryCard
          title="Cleared Cheques"
          count={summary?.clearedCheques?.count || 0}
          amount={summary?.clearedCheques?.totalAmount || 0}
          variant="success"
        />
        <SummaryCard
          title="Bounced Cheques"
          count={summary?.bouncedCheques?.count || 0}
          amount={summary?.bouncedCheques?.totalAmount || 0}
          variant="destructive"
        />
        <SummaryCard
          title="Cash Collected Today"
          amount={summary?.cashToday || 0}
        />
      </div>

      {/* Calendar View */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">📅 Payment Calendar</h2>
        <ChequeCalendarView />
      </div>

      {/* Pending Cheques Table */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Pending Cheques</h2>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cheque Number</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payer Name</TableHead>
                <TableHead>Expected Clear Date</TableHead>
                <TableHead>Days Until Clear</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingCheques.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No pending cheques
                  </TableCell>
                </TableRow>
              ) : (
                pendingCheques.slice(0, 10).map((cheque) => (
                  <TableRow key={cheque.id}>
                    <TableCell className="font-medium">{cheque.cheque_number}</TableCell>
                    <TableCell>{formatCurrency(cheque.amount)}</TableCell>
                    <TableCell>{cheque.payer_name}</TableCell>
                    <TableCell>{formatDate(cheque.expected_clear_date)}</TableCell>
                    <TableCell>
                      {calculateDaysUntilClear(cheque.expected_clear_date)} days
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Recent Bounced Cheques Table */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Recent Bounced Cheques</h2>
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cheque Number</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payer Name</TableHead>
                <TableHead>Bounce Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bouncedCheques.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No bounced cheques
                  </TableCell>
                </TableRow>
              ) : (
                bouncedCheques.slice(0, 5).map((cheque) => (
                  <TableRow key={cheque.id}>
                    <TableCell className="font-medium">{cheque.cheque_number}</TableCell>
                    <TableCell>{formatCurrency(cheque.amount)}</TableCell>
                    <TableCell>{cheque.payer_name}</TableCell>
                    <TableCell>{formatDate(cheque.cheque_date)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Cheque Modal */}
      <Dialog open={isChequeModalOpen} onOpenChange={setIsChequeModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Cheque</DialogTitle>
          </DialogHeader>
          <ChequeForm
            onSubmit={handleChequeSubmit}
            onCancel={() => setIsChequeModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Cash Modal */}
      <Dialog open={isCashModalOpen} onOpenChange={setIsCashModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Cash Entry</DialogTitle>
          </DialogHeader>
          <CashForm
            onSubmit={handleCashSubmit}
            onCancel={() => setIsCashModalOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}