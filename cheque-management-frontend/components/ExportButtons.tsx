'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { exportAPI } from '@/lib/api';
import { toast } from 'sonner';
import { Download } from 'lucide-react';

export function ExportButtons() {
  const [isExportingCheques, setIsExportingCheques] = useState(false);
  const [isExportingCash, setIsExportingCash] = useState(false);

  const handleExportCheques = async () => {
    setIsExportingCheques(true);
    try {
      await exportAPI.exportCheques();
      toast.success('Cheques exported successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export cheques');
    } finally {
      setIsExportingCheques(false);
    }
  };

  const handleExportCash = async () => {
    setIsExportingCash(true);
    try {
      await exportAPI.exportCash();
      toast.success('Cash records exported successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export cash records');
    } finally {
      setIsExportingCash(false);
    }
  };

  return (
    <div className="flex gap-4">
      <Button
        onClick={handleExportCheques}
        disabled={isExportingCheques}
        variant="outline"
      >
        <Download className="mr-2 h-4 w-4" />
        {isExportingCheques ? 'Exporting...' : 'Export All Cheques (CSV)'}
      </Button>
      <Button
        onClick={handleExportCash}
        disabled={isExportingCash}
        variant="outline"
      >
        <Download className="mr-2 h-4 w-4" />
        {isExportingCash ? 'Exporting...' : 'Export Cash Records (CSV)'}
      </Button>
    </div>
  );
}