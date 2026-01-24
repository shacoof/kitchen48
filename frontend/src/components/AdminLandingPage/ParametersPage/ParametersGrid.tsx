import { useEffect, useRef, useState } from 'react';
import './tabulator-theme.css';

// Import Tabulator CSS
import 'tabulator-tables/dist/css/tabulator.min.css';

// TypeScript declarations
declare global {
  interface Window {
    TabulatorModule: typeof import('tabulator-tables').TabulatorFull;
  }
}

interface Parameter {
  id: string;
  key: string;
  value: string | null;
  dataType: string;
  ownerType: string;
  ownerId: string | null;
  category: string | null;
  description: string | null;
  isEncrypted: boolean;
  defaultValue: string | null;
  validationRules: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ParametersGridProps {
  onError?: (message: string) => void;
}

export default function ParametersGrid({ onError }: ParametersGridProps) {
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

  // Load parameters from API
  const loadParameters = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/parameters', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load parameters');
      }

      const data = await response.json();
      return data.parameters || [];
    } catch (err) {
      console.error('Error loading parameters:', err);
      onError?.(err instanceof Error ? err.message : 'Failed to load parameters');
      return [];
    }
  };

  // Update parameter via API
  const updateParameter = async (parameter: Parameter) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/parameters/${parameter.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: parameter.key,
          value: parameter.value,
          dataType: parameter.dataType,
          ownerType: parameter.ownerType,
          ownerId: parameter.ownerId,
          category: parameter.category,
          description: parameter.description,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update parameter');
      }

      return true;
    } catch (err) {
      console.error('Error updating parameter:', err);
      onError?.(err instanceof Error ? err.message : 'Failed to update parameter');
      return false;
    }
  };

  // Delete parameter via API
  const deleteParameter = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/parameters/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok && response.status !== 204) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete parameter');
      }

      return true;
    } catch (err) {
      console.error('Error deleting parameter:', err);
      onError?.(err instanceof Error ? err.message : 'Failed to delete parameter');
      return false;
    }
  };

  // Initialize Tabulator
  useEffect(() => {
    if (!tabulatorLoaded || !tableRef.current || tabulatorRef.current) return;

    const Tabulator = window.TabulatorModule;

    // Custom value editor with type-specific validation
    const valueEditor = function(
      cell: { getValue: () => string; getData: () => Parameter },
      onRendered: (fn: () => void) => void,
      success: (value: string) => void,
      cancel: () => void
    ) {
      const data = cell.getData();
      const currentValue = cell.getValue() || '';

      if (data.dataType === 'COLOR') {
        // Color picker editor
        const container = document.createElement('div');
        container.className = 'color-editor-container';

        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = currentValue.startsWith('#') ? currentValue : '#000000';

        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.value = currentValue;

        // Sync color picker to text
        colorInput.addEventListener('change', () => {
          textInput.value = colorInput.value;
        });

        // Sync text to color picker
        textInput.addEventListener('input', () => {
          if (/^#[0-9A-Fa-f]{6}$/.test(textInput.value)) {
            colorInput.value = textInput.value;
          }
        });

        // Save on blur
        const saveValue = () => {
          success(textInput.value);
        };

        textInput.addEventListener('blur', saveValue);
        textInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') saveValue();
          if (e.key === 'Escape') cancel();
        });

        onRendered(() => textInput.focus());

        container.appendChild(colorInput);
        container.appendChild(textInput);
        return container;
      }

      // Default text editor
      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentValue;
      input.style.width = '100%';

      input.addEventListener('blur', () => success(input.value));
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') success(input.value);
        if (e.key === 'Escape') cancel();
      });

      onRendered(() => input.focus());

      return input;
    };

    // Color formatter
    const colorFormatter = function(cell: { getValue: () => string }) {
      const value = cell.getValue();
      if (!value) return '';

      if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
        return `<span class="color-swatch"><span class="color-box" style="background-color: ${value}"></span>${value}</span>`;
      }
      return value;
    };

    // Value formatter (type-aware)
    const valueFormatter = function(cell: { getValue: () => string; getData: () => Parameter }) {
      const value = cell.getValue();
      const data = cell.getData();

      if (!value) return '<span style="color: #64748b; font-style: italic;">null</span>';

      if (data.dataType === 'COLOR' && /^#[0-9A-Fa-f]{6}$/.test(value)) {
        return colorFormatter(cell);
      }

      if (data.dataType === 'BOOLEAN') {
        return value === 'true'
          ? '<span style="color: #4CAF50;">true</span>'
          : '<span style="color: #ef4444;">false</span>';
      }

      return value;
    };

    const columns = [
      {
        title: 'Key',
        field: 'key',
        editor: 'input',
        validator: ['required', 'minLength:1'],
        headerFilter: 'input',
        sorter: 'string',
        width: 180,
      },
      {
        title: 'Value',
        field: 'value',
        editor: valueEditor,
        formatter: valueFormatter,
        headerFilter: 'input',
        width: 200,
      },
      {
        title: 'Data Type',
        field: 'dataType',
        editor: 'list',
        editorParams: {
          values: ['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'DATE', 'COLOR', 'ARRAY'],
        },
        headerFilter: 'list',
        headerFilterParams: {
          values: {
            '': 'All',
            'STRING': 'String',
            'NUMBER': 'Number',
            'BOOLEAN': 'Boolean',
            'JSON': 'JSON',
            'DATE': 'Date',
            'COLOR': 'Color',
            'ARRAY': 'Array',
          },
        },
        sorter: 'string',
        width: 120,
      },
      {
        title: 'Owner Type',
        field: 'ownerType',
        editor: 'list',
        editorParams: {
          values: ['SYSTEM', 'ORGANIZATION', 'USER'],
        },
        headerFilter: 'list',
        headerFilterParams: {
          values: {
            '': 'All',
            'SYSTEM': 'System',
            'ORGANIZATION': 'Organization',
            'USER': 'User',
          },
        },
        sorter: 'string',
        width: 130,
      },
      {
        title: 'Category',
        field: 'category',
        editor: 'input',
        headerFilter: 'input',
        sorter: 'string',
        width: 130,
      },
      {
        title: 'Description',
        field: 'description',
        editor: 'input',
        headerFilter: 'input',
        width: 200,
      },
      {
        title: '',
        field: 'actions',
        formatter: function() {
          return '<button class="delete-btn" title="Delete">&#10005;</button>';
        },
        width: 50,
        hozAlign: 'center',
        headerSort: false,
        cellClick: async function(_e: Event, cell: { getRow: () => { getData: () => Parameter; delete: () => void } }) {
          const row = cell.getRow();
          const data = row.getData();

          if (confirm(`Delete parameter "${data.key}"?`)) {
            const success = await deleteParameter(data.id);
            if (success) {
              row.delete();
            }
          }
        },
      },
    ];

    tabulatorRef.current = new Tabulator(tableRef.current, {
      height: '100%',
      layout: 'fitData',
      responsiveLayout: 'collapse',
      placeholder: 'No parameters found',
      columns: columns,
      cellEdited: async function(cell: { getField: () => string; getRow: () => { getData: () => Parameter } }) {
        // Skip actions column
        if (cell.getField() === 'actions') return;

        const row = cell.getRow();
        const data = row.getData();

        const success = await updateParameter(data);
        if (!success) {
          // Reload data to reset
          const parameters = await loadParameters();
          tabulatorRef.current?.setData(parameters);
        }
      },
    });

    // Load initial data
    loadParameters().then((parameters) => {
      tabulatorRef.current?.setData(parameters);
      setLoading(false);
    });

    // Cleanup
    return () => {
      tabulatorRef.current?.destroy();
      tabulatorRef.current = null;
    };
  }, [tabulatorLoaded]);

  // Create new parameter
  const handleCreateParameter = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/parameters', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: `new_parameter_${Date.now()}`,
          value: '',
          dataType: 'STRING',
          ownerType: 'SYSTEM',
          category: null,
          description: null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create parameter');
      }

      // Reload data
      const parameters = await loadParameters();
      tabulatorRef.current?.setData(parameters);
    } catch (err) {
      console.error('Error creating parameter:', err);
      onError?.(err instanceof Error ? err.message : 'Failed to create parameter');
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setLoading(true);
    const parameters = await loadParameters();
    tabulatorRef.current?.setData(parameters);
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
            onClick={handleCreateParameter}
            className="bg-accent-orange hover:bg-accent-orange/90 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add Parameter
          </button>
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
