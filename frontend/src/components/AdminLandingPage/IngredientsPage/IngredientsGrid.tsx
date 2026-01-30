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

interface Ingredient {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface IngredientsGridProps {
  onError?: (message: string) => void;
}

export default function IngredientsGrid({ onError }: IngredientsGridProps) {
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

  // Load ingredients from API
  const loadIngredients = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/ingredients', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load ingredients');
      }

      const data = await response.json();
      return data.ingredients || [];
    } catch (err) {
      console.error('Error loading ingredients:', err);
      onError?.(err instanceof Error ? err.message : 'Failed to load ingredients');
      return [];
    }
  };

  // Update ingredient via API
  const updateIngredient = async (ingredient: Ingredient) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/ingredients/${ingredient.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: ingredient.name,
          category: ingredient.category,
          description: ingredient.description,
          isActive: ingredient.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update ingredient');
      }

      return true;
    } catch (err) {
      console.error('Error updating ingredient:', err);
      onError?.(err instanceof Error ? err.message : 'Failed to update ingredient');
      return false;
    }
  };

  // Delete ingredient via API
  const deleteIngredient = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/ingredients/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok && response.status !== 204) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete ingredient');
      }

      return true;
    } catch (err) {
      console.error('Error deleting ingredient:', err);
      onError?.(err instanceof Error ? err.message : 'Failed to delete ingredient');
      return false;
    }
  };

  // Initialize Tabulator
  useEffect(() => {
    if (!tabulatorLoaded || !tableRef.current || tabulatorRef.current) return;

    const Tabulator = window.TabulatorModule;

    // Format boolean for display
    const booleanFormatter = function(cell: { getValue: () => boolean }) {
      const value = cell.getValue();
      return value
        ? '<span style="color: #4CAF50;">Active</span>'
        : '<span style="color: #ef4444;">Inactive</span>';
    };

    const columns = [
      {
        title: 'Name',
        field: 'name',
        editor: 'input',
        validator: ['required', 'minLength:1'],
        headerFilter: 'input',
        sorter: 'string' as const,
        width: 200,
      },
      {
        title: 'Category',
        field: 'category',
        editor: 'input',
        headerFilter: 'input',
        sorter: 'string' as const,
        width: 150,
      },
      {
        title: 'Description',
        field: 'description',
        editor: 'input',
        headerFilter: 'input',
        width: 300,
      },
      {
        title: 'Status',
        field: 'isActive',
        editor: 'tickCross',
        formatter: booleanFormatter,
        headerFilter: 'list',
        headerFilterParams: {
          values: {
            '': 'All',
            'true': 'Active',
            'false': 'Inactive',
          },
        },
        sorter: 'string' as const,
        width: 100,
        hozAlign: 'center',
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
        cellClick: async function(_e: Event, cell: { getRow: () => { getData: () => Ingredient; delete: () => void } }) {
          const row = cell.getRow();
          const data = row.getData();

          if (confirm(`Delete ingredient "${data.name}"?`)) {
            const success = await deleteIngredient(data.id);
            if (success) {
              row.delete();
            }
          }
        },
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: any = {
      height: '100%',
      layout: 'fitData',
      responsiveLayout: 'collapse',
      placeholder: 'No ingredients found',
      columns: columns,
      initialSort: [
        { column: 'name', dir: 'asc' },
      ],
    };
    tabulatorRef.current = new Tabulator(tableRef.current, options);

    // Attach cellEdited via on() method - this is the recommended approach
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tabulatorRef.current.on('cellEdited', async function(cell: any) {
      // Skip actions column
      if (cell.getField() === 'actions') return;

      const row = cell.getRow();
      const data = row.getData();

      const success = await updateIngredient(data);
      if (!success) {
        // Reload data to reset
        const ingredients = await loadIngredients();
        tabulatorRef.current?.setData(ingredients);
      }
    });

    // Load initial data
    loadIngredients().then((ingredients) => {
      tabulatorRef.current?.setData(ingredients);
      setLoading(false);
    });

    // Cleanup
    return () => {
      tabulatorRef.current?.destroy();
      tabulatorRef.current = null;
    };
  }, [tabulatorLoaded]);

  // Create new ingredient
  const handleCreateIngredient = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/ingredients', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `new_ingredient_${Date.now()}`,
          category: null,
          description: null,
          isActive: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create ingredient');
      }

      // Reload data
      const ingredients = await loadIngredients();
      tabulatorRef.current?.setData(ingredients);
    } catch (err) {
      console.error('Error creating ingredient:', err);
      onError?.(err instanceof Error ? err.message : 'Failed to create ingredient');
    }
  };

  // Refresh data
  const handleRefresh = async () => {
    setLoading(true);
    const ingredients = await loadIngredients();
    tabulatorRef.current?.setData(ingredients);
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
            onClick={handleCreateIngredient}
            className="bg-accent-orange hover:bg-accent-orange/90 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add Ingredient
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
