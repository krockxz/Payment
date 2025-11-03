'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CashForm } from '@/components/CashForm';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ExportButtons } from '@/components/ExportButtons';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { cashAPI } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { toast } from 'sonner';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { CashRecord, CashFormData } from '@/lib/types';

export default function CashPage() {
  const [cashRecords, setCashRecords] = useState<CashRecord[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [dateFilter, setDateFilter] = useState({ startDate: '', endDate: '' });
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CashRecord | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; recordId: number | null }>({
    isOpen: false,
    recordId: null,
  });

  const fetchCashRecords = async () => {
    setIsLoading(true);
    try {
      const response = await cashAPI.getCashRecords(
        pagination.page,
        pagination.limit,
        dateFilter.startDate || null,
        dateFilter.endDate || null
      );
      setCashRecords(response.records || []);
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
      });

      // Calculate total
      const total = (response.records || []).reduce((sum, record) => sum + record.amount, 0);
      setTotalAmount(total);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load cash records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCashRecords();
  }, [pagination.page, dateFilter.startDate, dateFilter.endDate]);

  const handleSubmit = async (data: CashFormData) => {
    try {
      if (editingRecord) {
        await cashAPI.updateCashRecord(editingRecord.id, data);
        toast.success('Cash record updated successfully');
      } else {
        await cashAPI.createCashRecord(data);
        toast.success('Cash record created successfully');
      }
      setIsModalOpen(false);
      setEditingRecord(null);
      fetchCashRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save cash record');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.recordId) return;

    try {
      await cashAPI.deleteCashRecord(deleteConfirm.recordId);
      toast.success('Cash record deleted successfully');
      setDeleteConfirm({ isOpen: false, recordId: null });
      fetchCashRecords();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete cash record');
    }
  };

  const handleFilterChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateFilter({ ...dateFilter, [field]: value });
    setPagination({ ...pagination, page: 1 });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Cash Records</h1>
        <Button onClick={() => { setEditingRecord(null); setIsModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Cash Entry
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="space-y-1">
            <Label htmlFor="startDate" className="text-sm">From Date</Label>
            <Input
              id="startDate"
              type="date"
              value={dateFilter.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-[180px]"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="endDate" className="text-sm">To Date</Label>
            <Input
              id="endDate"
              type="date"
              value={dateFilter.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-[180px]"
            />
          </div>
          {(dateFilter.startDate || dateFilter.endDate) && (
            <Button
              variant="ghost"
              onClick={() => {
                setDateFilter({ startDate: '', endDate: '' });
                setPagination({ ...pagination, page: 1 });
              }}
              className="mt-6"
            >
              Clear
            </Button>
          )}
        </div>
        <ExportButtons />
      </div>

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reference Person</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Invoice Reference</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cashRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No cash records found
                    </TableCell>
                  </TableRow>
                ) : (
                  cashRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>{formatDate(record.date)}</TableCell>
                      <TableCell className="font-medium">{formatCurrency(record.amount)}</TableCell>
                      <TableCell>{record.reference_person}</TableCell>
                      <TableCell>{record.purpose}</TableCell>
                      <TableCell>{record.invoice_reference || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setEditingRecord(record); setIsModalOpen(true); }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteConfirm({ isOpen: true, recordId: record.id })}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {cashRecords.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-bold">Total</TableCell>
                    <TableCell className="font-bold">{formatCurrency(totalAmount)}</TableCell>
                    <TableCell colSpan={4}></TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>

          {pagination.totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => pagination.page > 1 && setPagination({ ...pagination, page: pagination.page - 1 })}
                    className={pagination.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => setPagination({ ...pagination, page })}
                      isActive={page === pagination.page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => pagination.page < pagination.totalPages && setPagination({ ...pagination, page: pagination.page + 1 })}
                    className={pagination.page === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRecord ? 'Edit Cash Entry' : 'Add New Cash Entry'}</DialogTitle>
          </DialogHeader>
          <CashForm
            initialData={editingRecord}
            onSubmit={handleSubmit}
            onCancel={() => { setIsModalOpen(false); setEditingRecord(null); }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, recordId: null })}
        onConfirm={handleDelete}
        title="Delete Cash Record"
        message="Are you sure you want to delete this cash record? This action cannot be undone."
      />
    </div>
  );
}