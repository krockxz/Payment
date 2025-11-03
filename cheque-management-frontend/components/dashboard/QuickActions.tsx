import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, DollarSign, Download } from 'lucide-react';

interface QuickActionsProps {
  onAddCheque: () => void;
  onAddCash: () => void;
  onExportCheques?: () => void;
  onExportCash?: () => void;
}

export function QuickActions({
  onAddCheque,
  onAddCash,
  onExportCheques,
  onExportCash
}: QuickActionsProps) {
  const actions = [
    {
      label: 'Add Cheque',
      icon: <FileText className="h-4 w-4" />,
      onClick: onAddCheque,
      variant: 'default' as const
    },
    {
      label: 'Add Cash Entry',
      icon: <DollarSign className="h-4 w-4" />,
      onClick: onAddCash,
      variant: 'outline' as const
    }
  ];

  const exportActions = [
    {
      label: 'Export Cheques',
      icon: <Download className="h-4 w-4" />,
      onClick: onExportCheques,
      variant: 'ghost' as const,
      disabled: !onExportCheques
    },
    {
      label: 'Export Cash Records',
      icon: <Download className="h-4 w-4" />,
      onClick: onExportCash,
      variant: 'ghost' as const,
      disabled: !onExportCash
    }
  ].filter(action => !action.disabled);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              onClick={action.onClick}
              className="h-auto p-4 flex flex-col items-center space-y-2"
            >
              {action.icon}
              <span className="text-sm">{action.label}</span>
            </Button>
          ))}
        </div>

        {exportActions.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium text-muted-foreground mb-3">Export Options</p>
            <div className="flex flex-wrap gap-2">
              {exportActions.map((action) => (
                <Button
                  key={action.label}
                  variant={action.variant}
                  size="sm"
                  onClick={action.onClick}
                  className="flex items-center space-x-2"
                >
                  {action.icon}
                  <span>{action.label}</span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}