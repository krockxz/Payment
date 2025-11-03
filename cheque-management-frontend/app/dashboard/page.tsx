'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChequeForm } from '@/components/ChequeForm';
import { CashForm } from '@/components/CashForm';
import ChequeCalendarView from '@/components/ChequeCalendarView';
import {
  DashboardLayout,
  MetricsGrid,
  QuickActions,
  ChequesTable
} from '@/components/dashboard';
import { dashboardAPI, chequeAPI, cashAPI, exportAPI } from '@/lib/api';
import { toast } from 'sonner';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useModalState } from '@/hooks/useModalState';
import type { ChequeFormData, CashFormData } from '@/lib/types';

export default function DashboardPage() {
  const { data, isLoading, refetch } = useDashboardData();
  const { modalState, openChequeModal, closeChequeModal, openCashModal, closeCashModal } = useModalState();

  const handleChequeSubmit = async (formData: ChequeFormData): Promise<void> => {
    try {
      await chequeAPI.createCheque(formData);
      toast.success('Cheque created successfully');
      closeChequeModal();
      await refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create cheque';
      toast.error(errorMessage);
    }
  };

  const handleCashSubmit = async (formData: CashFormData): Promise<void> => {
    try {
      await cashAPI.createCashRecord(formData);
      toast.success('Cash entry created successfully');
      closeCashModal();
      await refetch();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create cash entry';
      toast.error(errorMessage);
    }
  };

  const handleExportCheques = async (): Promise<void> => {
    try {
      await exportAPI.exportCheques();
      toast.success('Cheques exported successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export cheques';
      toast.error(errorMessage);
    }
  };

  const handleExportCash = async (): Promise<void> => {
    try {
      await exportAPI.exportCash();
      toast.success('Cash records exported successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export cash records';
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <DashboardLayout
        title="Dashboard"
        subtitle="Monitor your payment collections and track cheque status"
        loading={isLoading}
      >
        <div className="space-y-6">
          {/* Metrics Grid */}
          <MetricsGrid summary={data.summary} />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Calendar */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card rounded-lg border p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  📅 Payment Calendar
                </h2>
                <ChequeCalendarView />
              </div>
            </div>

            {/* Right Column - Quick Actions */}
            <div className="space-y-6">
              <QuickActions
                onAddCheque={openChequeModal}
                onAddCash={openCashModal}
                onExportCheques={handleExportCheques}
                onExportCash={handleExportCash}
              />
            </div>
          </div>

          {/* Tables Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChequesTable
              title="Pending Cheques"
              cheques={data.pendingCheques.slice(0, 10)}
              variant="pending"
              maxHeight="400px"
              emptyMessage="No pending cheques at the moment"
            />

            <ChequesTable
              title="Recent Bounced Cheques"
              cheques={data.bouncedCheques.slice(0, 5)}
              variant="bounced"
              columns={['chequeNumber', 'amount', 'payerName', 'date']}
              maxHeight="400px"
              emptyMessage="No bounced cheques - great job!"
            />
          </div>
        </div>
      </DashboardLayout>

      {/* Cheque Modal */}
      <Dialog open={modalState.isChequeModalOpen} onOpenChange={closeChequeModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Cheque</DialogTitle>
          </DialogHeader>
          <ChequeForm
            onSubmit={handleChequeSubmit}
            onCancel={closeChequeModal}
          />
        </DialogContent>
      </Dialog>

      {/* Cash Modal */}
      <Dialog open={modalState.isCashModalOpen} onOpenChange={closeCashModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Cash Entry</DialogTitle>
          </DialogHeader>
          <CashForm
            onSubmit={handleCashSubmit}
            onCancel={closeCashModal}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}