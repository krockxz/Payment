'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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

// Define the form schema with Zod validation
const chequeFormSchema = z.object({
  cheque_number: z.string().min(1, 'Cheque number is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  payer_name: z.string().min(1, 'Payer name is required'),
  cheque_date: z.string().min(1, 'Cheque date is required'),
  expected_clear_date: z.string().min(1, 'Expected clear date is required'),
  status: z.nativeEnum(ChequeStatus),
  invoice_reference: z.string(),
  notes: z.string(),
});

type ChequeFormDataSchema = z.infer<typeof chequeFormSchema>;

export function ChequeForm({ initialData, onSubmit, onCancel }: ChequeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ChequeFormDataSchema>({
    resolver: zodResolver(chequeFormSchema),
    defaultValues: {
      cheque_number: initialData?.cheque_number || '',
      amount: initialData?.amount || 0,
      payer_name: initialData?.payer_name || '',
      cheque_date: initialData?.cheque_date || new Date().toISOString().split('T')[0],
      expected_clear_date: initialData?.expected_clear_date || new Date().toISOString().split('T')[0],
      status: initialData?.status || ChequeStatus.PENDING,
      invoice_reference: initialData?.invoice_reference || '',
      notes: initialData?.notes || '',
    },
  });

  const handleSubmit = async (data: ChequeFormDataSchema) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cheque_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cheque Number</FormLabel>
                <FormControl>
                  <Input placeholder="Enter cheque number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Enter amount"
                    {...field}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="payer_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Payer Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter payer name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cheque_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cheque Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(new Date(field.value), 'PPP') : 'Pick a date'}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => date && field.onChange(format(date, 'yyyy-MM-dd'))}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="expected_clear_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Expected Clear Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value ? format(new Date(field.value), 'PPP') : 'Pick a date'}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={field.value ? new Date(field.value) : undefined}
                      onSelect={(date) => date && field.onChange(format(date, 'yyyy-MM-dd'))}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={ChequeStatus.PENDING}>Pending</SelectItem>
                  <SelectItem value={ChequeStatus.DEPOSITED}>Deposited</SelectItem>
                  <SelectItem value={ChequeStatus.CLEARED}>Cleared</SelectItem>
                  <SelectItem value={ChequeStatus.BOUNCED}>Bounced</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="invoice_reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Invoice Reference</FormLabel>
              <FormControl>
                <Input placeholder="Enter invoice reference (optional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter notes (optional)"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </Button>
        </div>
      </form>
    </Form>
  );
}