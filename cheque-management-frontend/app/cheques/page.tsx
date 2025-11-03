'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChequeForm } from '@/components/ChequeForm';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { ExportButtons } from '@/components/ExportButtons';
import { Skeleton } from '@/components/ui/skeleton';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { chequeAPI } from '@/lib/api';
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from '@/lib/formatters';
import { ChequeStatus } from '@/lib/enums';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import type { Cheque, ChequeFormData, PaginatedResponse } from '@/lib/types';

export default function ChequesPage() {
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [statusFilter, setStatusFilter] = useState<ChequeStatus | 'all'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCheque, setEditingCheque] = useState<Cheque | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; chequeId: number | null }>({
    isOpen: false,
    chequeId: null,
  });

  const fetchCheques = async () => {
    setIsLoading(true);
    try {
      const response = await chequeAPI.getCheques(
        pagination.page,
        pagination.limit,
        statusFilter === 'all' ? null : statusFilter
      );
      setCheques(response.cheques || []);
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
        totalPages: response.totalPages,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load cheques');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCheques();
  }, [pagination.page, statusFilter]);

  const handleSubmit = async (data: ChequeFormData) => {
    try {
      if (editingCheque) {
        await chequeAPI.updateCheque(editingCheque.id, data);
        toast.success('Cheque updated successfully');
      } else {
        await chequeAPI.createCheque(data);
        toast.success('Cheque created successfully');
      }
      setIsModalOpen(false);
      setEditingCheque(null);
      fetchCheques();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save cheque');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.chequeId) return;

    try {
      await chequeAPI.deleteCheque(deleteConfirm.chequeId);
      toast.success('Cheque deleted successfully');
      setDeleteConfirm({ isOpen: false, chequeId: null });
      fetchCheques();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete cheque');
    }
  };

  const getStatusBadgeVariant = (status: ChequeStatus) => {
    const color = getStatusColor(status);
    if (color === 'green') return 'default';
    if (color === 'red') return 'destructive';
    if (color === 'yellow') return 'secondary';
    return 'outline';
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">All Cheques</h1>
        <Button onClick={() => { setEditingCheque(null); setIsModalOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add New Cheque
        </Button>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Filter by status:</label>
          <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value as ChequeStatus | 'all'); setPagination({ ...pagination, page: 1 }); }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value={ChequeStatus.PENDING}>Pending</SelectItem>
              <SelectItem value={ChequeStatus.DEPOSITED}>Deposited</SelectItem>
              <SelectItem value={ChequeStatus.CLEARED}>Cleared</SelectItem>
              <SelectItem value={ChequeStatus.BOUNCED}>Bounced</SelectItem>
            </SelectContent>
          </Select>
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
                  <TableHead>Cheque Number</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payer</TableHead>
                  <TableHead>Cheque Date</TableHead>
                  <TableHead>Expected Clear Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cheques.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No cheques found
                    </TableCell>
                  </TableRow>
                ) : (
                  cheques.map((cheque) => (
                    <TableRow key={cheque.id}>
                      <TableCell className="font-medium">{cheque.cheque_number}</TableCell>
                      <TableCell>{formatCurrency(cheque.amount)}</TableCell>
                      <TableCell>{cheque.payer_name}</TableCell>
                      <TableCell>{formatDate(cheque.cheque_date)}</TableCell>
                      <TableCell>{formatDate(cheque.expected_clear_date)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(cheque.status)}>
                          {getStatusLabel(cheque.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => { setEditingCheque(cheque); setIsModalOpen(true); }}
                              className="cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => setDeleteConfirm({ isOpen: true, chequeId: cheque.id })}
                              className="cursor-pointer text-destructive focus:text-destructive"
                              variant="destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
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
            <DialogTitle>{editingCheque ? 'Edit Cheque' : 'Add New Cheque'}</DialogTitle>
          </DialogHeader>
          <ChequeForm
            initialData={editingCheque}
            onSubmit={handleSubmit}
            onCancel={() => { setIsModalOpen(false); setEditingCheque(null); }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, chequeId: null })}
        onConfirm={handleDelete}
        title="Delete Cheque"
        message="Are you sure you want to delete this cheque? This action cannot be undone."
      />
    </div>
  );
}