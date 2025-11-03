'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CashRecord, CashFormData } from '@/lib/types';

interface CashFormProps {
  initialData?: CashRecord | null;
  onSubmit: (data: CashFormData) => Promise<void>;
  onCancel: () => void;
}

export function CashForm({ initialData, onSubmit, onCancel }: CashFormProps) {
  const [formData, setFormData] = useState<CashFormData>({
    amount: initialData?.amount || 0,
    date: initialData?.date || new Date().toISOString().split('T')[0],
    reference_person: initialData?.reference_person || '',
    purpose: initialData?.purpose || '',
    invoice_reference: initialData?.invoice_reference || '',
    notes: initialData?.notes || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CashFormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CashFormData, string>> = {};

    if (!formData.amount || formData.amount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    }
    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (!formData.reference_person.trim()) {
      newErrors.reference_person = 'Reference person is required';
    }
    if (!formData.purpose.trim()) {
      newErrors.purpose = 'Purpose is required';
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

        <div className="space-y-2">
          <Label>Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !formData.date && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.date ? format(new Date(formData.date), 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.date ? new Date(formData.date) : undefined}
                onSelect={(date) => date && setFormData({ ...formData, date: format(date, 'yyyy-MM-dd') })}
              />
            </PopoverContent>
          </Popover>
          {errors.date && <p className="text-sm text-destructive">{errors.date}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reference_person">Reference Person *</Label>
        <Input
          id="reference_person"
          value={formData.reference_person}
          onChange={(e) => setFormData({ ...formData, reference_person: e.target.value })}
          placeholder="Enter reference person name"
        />
        {errors.reference_person && <p className="text-sm text-destructive">{errors.reference_person}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="purpose">Purpose *</Label>
        <Input
          id="purpose"
          value={formData.purpose}
          onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
          placeholder="Enter purpose"
        />
        {errors.purpose && <p className="text-sm text-destructive">{errors.purpose}</p>}
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