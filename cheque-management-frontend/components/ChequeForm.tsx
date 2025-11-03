'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Cheque, ChequeFormData } from '@/lib/types';
import { ChequeStatus } from '@/lib/enums';

interface ChequeFormProps {
  initialData?: Cheque | null;
  onSubmit: (data: ChequeFormData) => Promise<void>;
  onCancel: () => void;
}

export function ChequeForm({ initialData, onSubmit, onCancel }: ChequeFormProps) {
  const [formData, setFormData] = useState<ChequeFormData>({
    cheque_number: initialData?.cheque_number || '',
    amount: initialData?.amount || 0,
    payer_name: initialData?.payer_name || '',
    cheque_date: initialData?.cheque_date || new Date().toISOString().split('T')[0],
    expected_clear_date: initialData?.expected_clear_date || new Date().toISOString().split('T')[0],
    status: initialData?.status || ChequeStatus.PENDING,
    invoice_reference: initialData?.invoice_reference || '',
    notes: initialData?.notes || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ChequeFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof ChequeFormData, string>> = {};

    if (!formData.cheque_number.trim()) {
      newErrors.cheque_number = 'Cheque number is required';
    }
    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.payer_name.trim()) {
      newErrors.payer_name = 'Payer name is required';
    }
    if (!formData.cheque_date) {
      newErrors.cheque_date = 'Cheque date is required';
    }
    if (!formData.expected_clear_date) {
      newErrors.expected_clear_date = 'Expected clear date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="cheque_number">Cheque Number *</Label>
          <Input
            id="cheque_number"
            value={formData.cheque_number}
            onChange={(e) => setFormData({ ...formData, cheque_number: e.target.value })}
            placeholder="Enter cheque number"
          />
          {errors.cheque_number && <p className="text-sm text-destructive">{errors.cheque_number}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount || ''}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            placeholder="Enter amount"
          />
          {errors.amount && <p className="text-sm text-destructive">{errors.amount}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="payer_name">Payer Name *</Label>
        <Input
          id="payer_name"
          value={formData.payer_name}
          onChange={(e) => setFormData({ ...formData, payer_name: e.target.value })}
          placeholder="Enter payer name"
        />
        {errors.payer_name && <p className="text-sm text-destructive">{errors.payer_name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cheque Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !formData.cheque_date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.cheque_date ? format(new Date(formData.cheque_date), 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.cheque_date ? new Date(formData.cheque_date) : undefined}
                onSelect={(date) => date && setFormData({ ...formData, cheque_date: format(date, 'yyyy-MM-dd') })}
              />
            </PopoverContent>
          </Popover>
          {errors.cheque_date && <p className="text-sm text-destructive">{errors.cheque_date}</p>}
        </div>

        <div className="space-y-2">
          <Label>Expected Clear Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !formData.expected_clear_date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.expected_clear_date ? format(new Date(formData.expected_clear_date), 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.expected_clear_date ? new Date(formData.expected_clear_date) : undefined}
                onSelect={(date) => date && setFormData({ ...formData, expected_clear_date: format(date, 'yyyy-MM-dd') })}
              />
            </PopoverContent>
          </Popover>
          {errors.expected_clear_date && <p className="text-sm text-destructive">{errors.expected_clear_date}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as ChequeStatus })}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ChequeStatus.PENDING}>Pending</SelectItem>
            <SelectItem value={ChequeStatus.DEPOSITED}>Deposited</SelectItem>
            <SelectItem value={ChequeStatus.CLEARED}>Cleared</SelectItem>
            <SelectItem value={ChequeStatus.BOUNCED}>Bounced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="invoice_reference">Invoice Reference</Label>
        <Input
          id="invoice_reference"
          value={formData.invoice_reference}
          onChange={(e) => setFormData({ ...formData, invoice_reference: e.target.value })}
          placeholder="Enter invoice reference (optional)"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Enter notes (optional)"
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </form>
  );
}