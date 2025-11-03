'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, View, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

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

interface ChequeCalendarViewProps {
  defaultMonth?: Date;
}

const ChequeCalendarView: React.FC<ChequeCalendarViewProps> = ({ defaultMonth = new Date() }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<View>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState<Date>(defaultMonth);
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

      // Refresh calendar data
      await fetchCalendarData(currentDate);
      setShowModal(false);
      setSelectedEvent(null);

    } catch (error) {
      console.error('Error updating cheque status:', error);
      alert('Failed to update cheque status. Please try again.');
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'deposited':
        return 'bg-violet-100 text-violet-800';
      case 'cleared':
        return 'bg-emerald-100 text-emerald-800';
      case 'bounced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📅 Payment Calendar</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentView(Views.MONTH)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentView === Views.MONTH
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setCurrentView(Views.WEEK)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentView === Views.WEEK
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Week
          </button>
          <button
            onClick={() => setCurrentView(Views.DAY)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              currentView === Views.DAY
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Day
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-amber-500 rounded"></div>
          <span className="text-sm text-gray-600">Pending</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-violet-500 rounded"></div>
          <span className="text-sm text-gray-600">Deposited</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-500 rounded"></div>
          <span className="text-sm text-gray-600">Cleared</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-sm text-gray-600">Bounced</span>
        </div>
      </div>

      {/* Calendar */}
      {loading ? (
        <div className="flex justify-center items-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <button
            onClick={() => fetchCalendarData(currentDate)}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="h-96">
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

      {/* Event Details Modal */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                Cheque Details
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Cheque Number:</span>
                <span className="font-medium">{selectedEvent.resource.cheque_number}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium text-lg">₹{selectedEvent.resource.amount.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Payer:</span>
                <span className="font-medium">{selectedEvent.resource.payer_name}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Due Date:</span>
                <span className="font-medium">
                  {new Date(selectedEvent.resource.expected_clear_date).toLocaleDateString('en-IN')}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedEvent.resource.status)}`}>
                  {selectedEvent.resource.status.charAt(0).toUpperCase() + selectedEvent.resource.status.slice(1)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Days Until Due:</span>
                <span className={`font-medium ${
                  selectedEvent.resource.daysUntilDue < 0
                    ? 'text-red-600'
                    : selectedEvent.resource.daysUntilDue <= 3
                    ? 'text-amber-600'
                    : 'text-green-600'
                }`}>
                  {selectedEvent.resource.daysUntilDue < 0
                    ? `${Math.abs(selectedEvent.resource.daysUntilDue)} days overdue`
                    : `${selectedEvent.resource.daysUntilDue} days`
                  }
                </span>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <select
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                defaultValue={selectedEvent.resource.status}
                onChange={(e) => updateChequeStatus(selectedEvent.resource.id, e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="deposited">Deposited</option>
                <option value="cleared">Cleared</option>
                <option value="bounced">Bounced</option>
              </select>

              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChequeCalendarView;