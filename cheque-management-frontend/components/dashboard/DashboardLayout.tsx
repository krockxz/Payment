import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  loading?: boolean;
}

export function DashboardLayout({
  children,
  title,
  subtitle,
  loading = false
}: DashboardLayoutProps) {
  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-8 w-48" />
          {subtitle && <Skeleton className="h-4 w-64" />}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-80" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {(title || subtitle) && (
        <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-6 py-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                {title && (
                  <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                )}
                {subtitle && (
                  <p className="text-muted-foreground">{subtitle}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-6 py-6">
        <div className="space-y-6">
          {children}
        </div>
      </main>
    </div>
  );
}