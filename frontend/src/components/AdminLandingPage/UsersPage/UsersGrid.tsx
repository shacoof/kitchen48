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

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  nickname: string | null;
  profilePicture: string | null;
  emailVerified: boolean;
  userType: 'regular' | 'admin';
  createdAt: string;
  updatedAt: string;
}

interface UsersGridProps {
  onError?: (message: string) => void;
}

export default function UsersGrid({ onError }: UsersGridProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const tabulatorRef = useRef<InstanceType<typeof window.TabulatorModule> | null>(null);
  const [tabulatorLoaded, setTabulatorLoaded] = useState(false);
  const [loading, setLoading] = useState(true);

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

  // Load users from API
  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load users');
      }

      const data = await response.json();
      return data.data || [];
    } catch (err) {
      console.error('Error loading users:', err);
      onError?.(err instanceof Error ? err.message : 'Failed to load users');
      return [];
    }
  };

  // Update user via API
  const updateUser = async (user: User) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: user.firstName,
          lastName: user.lastName,
          nickname: user.nickname,
          userType: user.userType,
          emailVerified: user.emailVerified,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update user');
      }

      return true;
    } catch (err) {
      console.error('Error updating user:', err);
      onError?.(err instanceof Error ? err.message : 'Failed to update user');
      return false;
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
      });
    };

    // Format boolean for display
    const booleanFormatter = function(cell: { getValue: () => boolean }) {
      const value = cell.getValue();
      return value
        ? '<span style="color: #4CAF50;">✓ Yes</span>'
        : '<span style="color: #ef4444;">✗ No</span>';
    };

    // Format user type with color
    const userTypeFormatter = function(cell: { getValue: () => string }) {
      const value = cell.getValue();
      if (value === 'admin') {
        return '<span style="color: #FF5722; font-weight: 600;">Admin</span>';
      }
      return '<span style="color: #64748b;">Regular</span>';
    };

    const columns = [
      {
        title: 'Email',
        field: 'email',
        headerFilter: 'input',
        sorter: 'string' as const,
        width: 220,
        // Email is not editable
      },
      {
        title: 'First Name',
        field: 'firstName',
        editor: 'input',
        headerFilter: 'input',
        sorter: 'string' as const,
        width: 130,
      },
      {
        title: 'Last Name',
        field: 'lastName',
        editor: 'input',
        headerFilter: 'input',
        sorter: 'string' as const,
        width: 130,
      },
      {
        title: 'Nickname',
        field: 'nickname',
        editor: 'input',
        headerFilter: 'input',
        sorter: 'string' as const,
        width: 130,
      },
      {
        title: 'Type',
        field: 'userType',
        editor: 'list',
        editorParams: {
          values: ['regular', 'admin'],
        },
        formatter: userTypeFormatter,
        headerFilter: 'list',
        headerFilterParams: {
          values: {
            '': 'All',
            'regular': 'Regular',
            'admin': 'Admin',
          },
        },
        sorter: 'string' as const,
        width: 100,
        hozAlign: 'center',
      },
      {
        title: 'Verified',
        field: 'emailVerified',
        editor: 'tickCross',
        formatter: booleanFormatter,
        headerFilter: 'list',
        headerFilterParams: {
          values: {
            '': 'All',
            'true': 'Yes',
            'false': 'No',
          },
        },
        sorter: 'string' as const,
        width: 100,
        hozAlign: 'center',
      },
      {
        title: 'Created',
        field: 'createdAt',
        formatter: dateFormatter,
        sorter: 'string' as const,  // Changed from datetime to avoid luxon dependency
        width: 180,
        // Not editable
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: any = {
      height: '100%',
      layout: 'fitData',
      responsiveLayout: 'collapse',
      placeholder: 'No users found',
      columns: columns,
      initialSort: [
        { column: 'createdAt', dir: 'desc' },
      ],
    };
    tabulatorRef.current = new Tabulator(tableRef.current, options);

    // Attach cellEdited via on() method - this is the recommended approach
    // Note: Using on() instead of options.cellEdited for reliable event handling
    tabulatorRef.current.on('cellEdited', async function(cell: { getField: () => string; getRow: () => { getData: () => User } }) {
      const row = cell.getRow();
      const data = row.getData();

      const success = await updateUser(data);
      if (!success) {
        // Reload data to reset
        const users = await loadUsers();
        tabulatorRef.current?.setData(users);
      }
    });

    // Load initial data
    loadUsers().then((users) => {
      tabulatorRef.current?.setData(users);
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
    const users = await loadUsers();
    tabulatorRef.current?.setData(users);
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
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
            disabled={loading}
          >
            <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>refresh</span>
            Refresh
          </button>
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
