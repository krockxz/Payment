'use client';

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface TrendsData {
  months: string[];
  clearedAmount: number[];
  bouncedCount: number[];
  totalCheques: number[];
}

interface StatusBreakdown {
  [status: string]: {
    count: number;
    amount: number;
  };
}

interface TopPayer {
  payer_name: string;
  total_amount: number;
  cheque_count: number;
}

interface KeyMetrics {
  totalCollected: number;
  totalExpected: number;
  collectionRate: number;
  averageClearanceDays: number;
  bouncedCount: number;
  pendingCount: number;
  pendingAmount: number;
  bouncedAmount: number;
}

const AnalyticsPage = () => {
  const [trendsData, setTrendsData] = useState<TrendsData | null>(null);
  const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown | null>(null);
  const [topPayers, setTopPayers] = useState<TopPayer[]>([]);
  const [keyMetrics, setKeyMetrics] = useState<KeyMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format month for display
  const formatMonth = (monthStr: string) => {
    const date = new Date(monthStr + '-01');
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Fetch all analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [trendsResponse, statusResponse, payersResponse, metricsResponse] = await Promise.all([
        fetch('/api/dashboard/trends?months=6'),
        fetch('/api/dashboard/status-breakdown'),
        fetch('/api/dashboard/top-payers?limit=5'),
        fetch('/api/dashboard/key-metrics')
      ]);

      // Check for errors
      const responses = [trendsResponse, statusResponse, payersResponse, metricsResponse];
      for (const response of responses) {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }

      // Parse data
      const [trendsData, statusData, payersData, metricsData] = await Promise.all([
        trendsResponse.json(),
        statusResponse.json(),
        payersResponse.json(),
        metricsResponse.json()
      ]);

      // Handle potential errors in responses
      if (trendsData.error) throw new Error(trendsData.error.message);
      if (statusData.error) throw new Error(statusData.error.message);
      if (payersData.error) throw new Error(payersData.error.message);
      if (metricsData.error) throw new Error(metricsData.error.message);

      setTrendsData(trendsData.data);
      setStatusBreakdown(statusData.data);
      setTopPayers(payersData.data);
      setKeyMetrics(metricsData.data);

    } catch (err) {
      console.error('Error fetching analytics data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch analytics data';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Prepare line chart data
  const lineChartData = trendsData?.months.map((month, index) => ({
    month: formatMonth(month),
    clearedAmount: trendsData.clearedAmount[index] || 0,
    totalCheques: trendsData.totalCheques[index] || 0,
    bouncedCount: trendsData.bouncedCount[index] || 0,
  })) || [];

  // Prepare pie chart data
  const pieChartData = statusBreakdown ? Object.entries(statusBreakdown).map(([status, data]) => ({
    name: status.charAt(0).toUpperCase() + status.slice(1),
    value: data.amount,
    count: data.count,
  })) : [];

  // Colors for pie chart
  const COLORS = {
    pending: '#F59E0B',
    cleared: '#10B981',
    bounced: '#EF4444',
    deposited: '#8B5CF6'
  };

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Key Metrics Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Analytics</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">📊 Analytics Dashboard</h1>
        <button
          onClick={fetchAnalyticsData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Key Metrics Cards */}
      {keyMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Collection Rate */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Collection Rate</p>
                <p className="text-3xl font-bold text-green-900 mt-2">
                  {keyMetrics.collectionRate.toFixed(1)}%
                </p>
              </div>
              <div className="bg-green-200 rounded-full p-3">
                <svg className="w-6 h-6 text-green-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Average Clearance Days */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Avg Clearance Days</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">
                  {keyMetrics.averageClearanceDays}
                </p>
              </div>
              <div className="bg-blue-200 rounded-full p-3">
                <svg className="w-6 h-6 text-blue-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Total Collected */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Total Collected</p>
                <p className="text-2xl font-bold text-purple-900 mt-2">
                  {formatCurrency(keyMetrics.totalCollected)}
                </p>
              </div>
              <div className="bg-purple-200 rounded-full p-3">
                <svg className="w-6 h-6 text-purple-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Pending Amount */}
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-6 border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-600 text-sm font-medium">Pending Amount</p>
                <p className="text-2xl font-bold text-amber-900 mt-2">
                  {formatCurrency(keyMetrics.pendingAmount)}
                </p>
              </div>
              <div className="bg-amber-200 rounded-full p-3">
                <svg className="w-6 h-6 text-amber-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Collection Trends - Line Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Collection Trends (6 Months)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                tick={{ fill: '#666' }}
                tickLine={{ stroke: '#666' }}
              />
              <YAxis
                tick={{ fill: '#666' }}
                tickLine={{ stroke: '#666' }}
                tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'clearedAmount' ? formatCurrency(value) : value,
                  name === 'clearedAmount' ? 'Cleared Amount' :
                  name === 'totalCheques' ? 'Total Cheques' : 'Bounced Count'
                ]}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="clearedAmount"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', r: 4 }}
                name="Cleared Amount"
              />
              <Line
                type="monotone"
                dataKey="totalCheques"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ fill: '#8B5CF6', r: 3 }}
                name="Total Cheques"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Status Distribution - Pie Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Status Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS] || '#6B7280'}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Amount']}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Payers - Bar Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Top Payers by Amount</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={topPayers}
              layout="horizontal"
              margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                type="number"
                tick={{ fill: '#666' }}
                tickLine={{ stroke: '#666' }}
                tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
              />
              <YAxis
                type="category"
                dataKey="payer_name"
                tick={{ fill: '#666' }}
                tickLine={{ stroke: '#666' }}
                width={80}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  name === 'total_amount' ? formatCurrency(value) : value,
                  name === 'total_amount' ? 'Total Amount' : 'Cheque Count'
                ]}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
              />
              <Bar
                dataKey="total_amount"
                fill="#3B82F6"
                radius={[0, 8, 8, 0]}
                name="Total Amount"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsPage;