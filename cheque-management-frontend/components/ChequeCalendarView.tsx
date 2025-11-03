'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { CalendarIcon, RefreshCwIcon, CheckCircle, Clock, AlertTriangle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface Cheque {
  id: number;
  cheque_number: string;
  amount: number;
  payer_name: string;
  expected_clear_date: string;
  status: 'pending' | 'deposited' | 'cleared' | 'bounced';
  daysUntilDue: number;
  invoice_reference?: string;
  notes?: string;
}

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: Cheque;
}

interface CalendarData {
  [date: string]: Cheque[];
}

const ChequeCalendarView: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Convert API data to calendar events
  const transformToEvents = useCallback((calendarData: CalendarData): CalendarEvent[] => {
    const events: CalendarEvent[] = [];

    Object.entries(calendarData).forEach(([date, cheques]) => {
      cheques.forEach(cheque => {
        const eventDate = new Date(date);
        events.push({
          id: cheque.id,
          title: `${cheque.cheque_number} - ₹${cheque.amount.toLocaleString('en-IN')}`,
          start: eventDate,
          end: eventDate,
          resource: cheque,
        });
      });
    });

    return events;
  }, []);

  // Fetch calendar data
  const fetchCalendarData = useCallback(async (date: Date) => {
    try {
      setLoading(true);
      setError(null);

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const monthString = `${year}-${month}`;

      const response = await fetch(`/api/cheques/calendar?month=${monthString}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      const transformedEvents = transformToEvents(data.data);
      setEvents(transformedEvents);

    } catch (err) {
      console.error('Error fetching calendar data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar data');
      toast.error('Failed to load calendar data');
    } finally {
      setLoading(false);
    }
  }, [transformToEvents]);

  // Initial data fetch
  useEffect(() => {
    fetchCalendarData(currentDate);
  }, [currentDate, fetchCalendarData]);

  // Handle event click
  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowModal(true);
  }, []);

  // Handle navigation
  const handleNavigate = useCallback((newDate: Date) => {
    setCurrentDate(newDate);
  }, []);

  // Handle view change
  const handleViewChange = useCallback((newView: View) => {
    setCurrentView(newView);
  }, []);

  // Get event style based on status
  const eventStyleGetter = useCallback((event: CalendarEvent) => {
    const status = event.resource.status;
    let backgroundColor = '#3B82F6'; // default blue
    let borderRadius = '6px';
    let opacity = 0.8;
    let color = 'white';
    let border = '0px';
    let display = 'block';

    switch (status) {
      case 'pending':
        backgroundColor = '#F59E0B'; // amber-500
        break;
      case 'deposited':
        backgroundColor = '#8B5CF6'; // violet-500
        break;
      case 'cleared':
        backgroundColor = '#10B981'; // emerald-500
        break;
      case 'bounced':
        backgroundColor = '#EF4444'; // red-500
        opacity = 1;
        break;
    }

    return {
      style: {
        backgroundColor,
        borderRadius,
        opacity,
        color,
        border,
        display,
        padding: '2px 6px',
        fontSize: '12px',
        fontWeight: '500'
      }
    };
  }, []);

  // Update cheque status
  const updateChequeStatus = async (chequeId: number, newStatus: string) => {
    try {
      const response = await fetch(`/api/cheques/${chequeId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update cheque status');
      }

      toast.success('Cheque status updated successfully');
      await fetchCalendarData(currentDate);
      setShowModal(false);
      setSelectedEvent(null);

    } catch (error) {
      console.error('Error updating cheque status:', error);
      toast.error('Failed to update cheque status');
    }
  };

  // Get status badge variant and icon
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { variant: 'secondary' as const, icon: <Clock className="h-3 w-3" />, color: 'text-amber-600' };
      case 'deposited':
        return { variant: 'outline' as const, icon: <CalendarIcon className="h-3 w-3" />, color: 'text-violet-600' };
      case 'cleared':
        return { variant: 'default' as const, icon: <CheckCircle className="h-3 w-3" />, color: 'text-emerald-600' };
      case 'bounced':
        return { variant: 'destructive' as const, icon: <XCircle className="h-3 w-3" />, color: 'text-red-600' };
      default:
        return { variant: 'secondary' as const, icon: <Clock className="h-3 w-3" />, color: 'text-gray-600' };
    }
  };

  // Get days until due styling
  const getDaysUntilStyle = (days: number) => {
    if (days < 0) return { text: `${Math.abs(days)} days overdue`, className: 'text-red-600 font-semibold' };
    if (days <= 3) return { text: `${days} days`, className: 'text-amber-600 font-semibold' };
    return { text: `${days} days`, className: 'text-green-600' };
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="flex items-center gap-2 text-xl">
            <CalendarIcon className="h-5 w-5" />
            Payment Calendar
          </CardTitle>

          <div className="flex items-center gap-2">
            <Button
              variant={currentView === Views.MONTH ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView(Views.MONTH)}
            >
              Month
            </Button>
            <Button
              variant={currentView === Views.WEEK ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView(Views.WEEK)}
            >
              Week
            </Button>
            <Button
              variant={currentView === Views.DAY ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCurrentView(Views.DAY)}
            >
              Day
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 pt-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span className="text-sm text-muted-foreground">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-violet-500 rounded-full"></div>
            <span className="text-sm text-muted-foreground">Deposited</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
            <span className="text-sm text-muted-foreground">Cleared</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-muted-foreground">Bounced</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Calendar */}
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <RefreshCwIcon className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-96 p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => fetchCalendarData(currentDate)} variant="outline">
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        ) : (
          <div className="h-96 p-4">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={currentView}
              onView={handleViewChange}
              date={currentDate}
              onNavigate={handleNavigate}
              onSelectEvent={handleEventClick}
              eventPropGetter={eventStyleGetter}
              style={{ height: '100%' }}
              popup
            />
          </div>
        )}
      </CardContent>

      {/* Event Details Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        {selectedEvent && (
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Cheque Details
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Cheque Number</p>
                  <p className="font-mono font-medium">{selectedEvent.resource.cheque_number}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-semibold text-lg">₹{selectedEvent.resource.amount.toLocaleString('en-IN')}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground">Payer</p>
                <p className="font-medium">{selectedEvent.resource.payer_name}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="font-medium">
                    {new Date(selectedEvent.resource.expected_clear_date).toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Days Until Due</p>
                  <p className={getDaysUntilStyle(selectedEvent.resource.daysUntilDue).className}>
                    {getDaysUntilStyle(selectedEvent.resource.daysUntilDue).text}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                <Badge variant={getStatusInfo(selectedEvent.resource.status).variant} className="flex items-center gap-2 w-fit">
                  {getStatusInfo(selectedEvent.resource.status).icon}
                  {selectedEvent.resource.status.charAt(0).toUpperCase() + selectedEvent.resource.status.slice(1)}
                </Badge>
              </div>

              {selectedEvent.resource.invoice_reference && (
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Reference</p>
                  <p className="font-medium">{selectedEvent.resource.invoice_reference}</p>
                </div>
              )}

              {selectedEvent.resource.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm">{selectedEvent.resource.notes}</p>
                </div>
              )}

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-2">Update Status</p>
                <Select
                  defaultValue={selectedEvent.resource.status}
                  onValueChange={(value) => updateChequeStatus(selectedEvent.resource.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="deposited">Deposited</SelectItem>
                    <SelectItem value="cleared">Cleared</SelectItem>
                    <SelectItem value="bounced">Bounced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </Card>
  );
};

export default ChequeCalendarView;