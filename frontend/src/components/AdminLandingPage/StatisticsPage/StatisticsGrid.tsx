import { useEffect, useRef, useState } from 'react';
import '../ParametersPage/tabulator-theme.css';

// Import Tabulator CSS
import 'tabulator-tables/dist/css/tabulator.min.css';

// TypeScript declarations
declare global {
  interface Window {
    TabulatorModule: typeof import('tabulator-tables').TabulatorFull;
  }
}

interface StatEvent {
  id: string;
  eventType: string;
  userId: string | null;
  sessionId: string | null;
  entityType: string | null;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  session?: {
    deviceType: string;
    userAgent: string | null;
  } | null;
}

interface StatisticsGridProps {
  onError?: (message: string) => void;
}

export default function StatisticsGrid({ onError }: StatisticsGridProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const tabulatorRef = useRef<InstanceType<typeof window.TabulatorModule> | null>(null);
  const [tabulatorLoaded, setTabulatorLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Load Tabulator dynamically
  useEffect(() => {
    import('tabulator-tables')
      .then((module) => {
        window.TabulatorModule = module.TabulatorFull;
        setTabulatorLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load Tabulator:', err);
        onError?.('Failed to load data grid');
      });
  }, [onError]);

  // Load statistics from API
  const loadStatistics = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/statistics?limit=500', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load statistics');
      }

      const data = await response.json();
      setTotal(data.total || 0);
      return data.data || [];
    } catch (err) {
      console.error('Error loading statistics:', err);
      onError?.(err instanceof Error ? err.message : 'Failed to load statistics');
      return [];
    }
  };

  // Initialize Tabulator
  useEffect(() => {
    if (!tabulatorLoaded || !tableRef.current || tabulatorRef.current) return;

    const Tabulator = window.TabulatorModule;

    // Format date for display
    const dateFormatter = function(cell: { getValue: () => string }) {
      const value = cell.getValue();
      if (!value) return '';
      const date = new Date(value);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    };

    // Format event type with color coding
    const eventTypeFormatter = function(cell: { getValue: () => string }) {
      const value = cell.getValue();
      if (!value) return '';

      let color = '#64748b'; // default slate
      if (value.startsWith('user.login')) {
        color = '#4CAF50'; // green
      } else if (value.startsWith('user.register')) {
        color = '#2196F3'; // blue
      } else if (value.startsWith('user.logout')) {
        color = '#FF9800'; // orange
      } else if (value.startsWith('recipe.')) {
        color = '#9C27B0'; // purple
      } else if (value.startsWith('video.')) {
        color = '#E91E63'; // pink
      }

      return `<span style="color: ${color}; font-weight: 500;">${value}</span>`;
    };

    // Format user info
    const userFormatter = function(cell: { getRow: () => { getData: () => StatEvent } }) {
      const data = cell.getRow().getData();
      if (!data.user) return '<span style="color: #64748b;">-</span>';

      const name = [data.user.firstName, data.user.lastName].filter(Boolean).join(' ');
      return name || data.user.email;
    };

    // Format device type with icon
    const deviceFormatter = function(cell: { getRow: () => { getData: () => StatEvent } }) {
      const data = cell.getRow().getData();
      const deviceType = data.session?.deviceType || (data.metadata as Record<string, unknown>)?.deviceType;

      if (!deviceType) return '<span style="color: #64748b;">-</span>';

      const icons: Record<string, string> = {
        browser: '💻',
        mobile_app: '📱',
        tablet: '📱',
      };

      const icon = icons[deviceType as string] || '💻';
      return `${icon} ${deviceType}`;
    };

    // Format metadata as compact JSON
    const metadataFormatter = function(cell: { getValue: () => unknown }) {
      const value = cell.getValue();
      if (!value) return '';

      try {
        const str = JSON.stringify(value);
        if (str.length > 50) {
          return `<span title="${str.replace(/"/g, '&quot;')}">${str.substring(0, 50)}...</span>`;
        }
        return str;
      } catch {
        return '';
      }
    };

    const columns = [
      {
        title: 'Event Type',
        field: 'eventType',
        formatter: eventTypeFormatter,
        headerFilter: 'input',
        sorter: 'string' as const,
        width: 150,
      },
      {
        title: 'User',
        field: 'user',
        formatter: userFormatter,
        headerFilter: 'input',
        headerFilterFunc: function(
          headerValue: string,
          _rowValue: unknown,
          rowData: StatEvent
        ) {
          if (!headerValue) return true;
          const searchLower = headerValue.toLowerCase();
          if (!rowData.user) return false;
          const name = [rowData.user.firstName, rowData.user.lastName].filter(Boolean).join(' ').toLowerCase();
          const email = rowData.user.email.toLowerCase();
          return name.includes(searchLower) || email.includes(searchLower);
        },
        sorter: 'string' as const,
        width: 180,
      },
      {
        title: 'Device',
        field: 'session.deviceType',
        formatter: deviceFormatter,
        headerFilter: 'list',
        headerFilterParams: {
          values: {
            '': 'All',
            'browser': 'Browser',
            'mobile_app': 'Mobile App',
            'tablet': 'Tablet',
          },
        },
        headerFilterFunc: function(
          headerValue: string,
          _rowValue: unknown,
          rowData: StatEvent
        ) {
          if (!headerValue) return true;
          const deviceType = rowData.session?.deviceType || (rowData.metadata as Record<string, unknown>)?.deviceType;
          return deviceType === headerValue;
        },
        sorter: 'string' as const,
        width: 120,
        hozAlign: 'center',
      },
      {
        title: 'Entity',
        field: 'entityType',
        headerFilter: 'input',
        sorter: 'string' as const,
        width: 100,
      },
      {
        title: 'Entity ID',
        field: 'entityId',
        headerFilter: 'input',
        sorter: 'string' as const,
        width: 120,
      },
      {
        title: 'Metadata',
        field: 'metadata',
        formatter: metadataFormatter,
        headerFilter: 'input',
        headerFilterFunc: function(
          headerValue: string,
          _rowValue: unknown,
          rowData: StatEvent
        ) {
          if (!headerValue) return true;
          if (!rowData.metadata) return false;
          const str = JSON.stringify(rowData.metadata).toLowerCase();
          return str.includes(headerValue.toLowerCase());
        },
        sorter: 'string' as const,
        width: 200,
      },
      {
        title: 'Timestamp',
        field: 'createdAt',
        formatter: dateFormatter,
        sorter: 'string' as const,
        width: 200,
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: any = {
      height: '100%',
      layout: 'fitData',
      responsiveLayout: 'collapse',
      placeholder: 'No statistics found',
      columns: columns,
      initialSort: [
        { column: 'createdAt', dir: 'desc' },
      ],
      // Read-only: no editor on any column
    };
    tabulatorRef.current = new Tabulator(tableRef.current, options);

    // Load initial data
    loadStatistics().then((events) => {
      tabulatorRef.current?.setData(events);
      setLoading(false);
    });

    // Cleanup
    return () => {
      tabulatorRef.current?.destroy();
      tabulatorRef.current = null;
    };
  }, [tabulatorLoaded]);

  // Refresh data
  const handleRefresh = async () => {
    setLoading(true);
    const events = await loadStatistics();
    tabulatorRef.current?.setData(events);
    setLoading(false);
  };

  if (!tabulatorLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-400">Loading grid...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleRefresh}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
            disabled={loading}
          >
            <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>refresh</span>
            Refresh
          </button>
          <span className="text-slate-400 text-sm">
            Total: {total.toLocaleString()} events
          </span>
        </div>
        {loading && (
          <span className="text-slate-400 text-sm">Loading...</span>
        )}
      </div>

      {/* Grid Container */}
      <div
        style={{
          height: 'calc(100vh - 280px)',
          minHeight: '400px',
          minWidth: 0,
          overflow: 'hidden',
        }}
      >
        <div ref={tableRef} style={{ height: '100%', width: '100%' }}></div>
      </div>
    </div>
  );
}
