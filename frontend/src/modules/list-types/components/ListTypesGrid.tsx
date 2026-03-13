/**
 * List Types Grid Component
 *
 * Displays and manages list types in a table format.
 * Admin-only component for managing dropdown categories.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { authApi } from '../../auth/services/auth.api';
import { createLogger } from '../../../lib/logger';

const logger = createLogger('ListTypesGrid');

interface ListType {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    values: number;
  };
}

interface ListTypesGridProps {
  onListTypeSelect: (listTypeId: string | null) => void;
}

export function ListTypesGrid({ onListTypeSelect }: ListTypesGridProps) {
  const [listTypes, setListTypes] = useState<ListType[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ListType>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadListTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = authApi.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/list-types', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to load (${response.status})`);
      }

      const data = await response.json();

      if (data.success && data.data) {
        setListTypes(data.data);

        // Auto-select first item if none selected
        if (!selectedId && data.data.length > 0) {
          const firstId = data.data[0].id;
          setSelectedId(firstId);
          onListTypeSelect(firstId);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load list types';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [selectedId, onListTypeSelect]);

  useEffect(() => {
    loadListTypes();
  }, [loadListTypes]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    onListTypeSelect(id);
  };

  const handleAdd = async () => {
    try {
      const token = authApi.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/list-types', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `New List Type ${Date.now()}`,
          description: '',
          isActive: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create');
      }

      loadListTypes();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create list type';
      alert(message);
    }
  };

  const handleEdit = (listType: ListType) => {
    setEditingId(listType.id);
    setEditForm({
      name: listType.name,
      description: listType.description || '',
      isActive: listType.isActive,
    });
  };

  const doSave = useCallback(async (idToSave: string, formData: Partial<ListType>) => {
    setSaveStatus('saving');
    try {
      const token = authApi.getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/list-types/${idToSave}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update');
      }

      setSaveStatus('saved');
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
      statusTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
      loadListTypes();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update list type';
      logger.error(message);
      setSaveStatus('error');
    }
  }, [loadListTypes]);

  const scheduleAutoSave = useCallback((formData: Partial<ListType>) => {
    if (!editingId) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    const idToSave = editingId;
    saveTimerRef.current = setTimeout(() => {
      doSave(idToSave, formData);
    }, 800);
  }, [editingId, doSave]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this list type? All associated values will also be deleted.')) {
      return;
    }

    try {
      const token = authApi.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/list-types/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete');
      }

      if (selectedId === id) {
        setSelectedId(null);
        onListTypeSelect(null);
      }

      loadListTypes();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete list type';
      alert(message);
    }
  };

  if (loading && listTypes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">Loading list types...</div>
      </div>
    );
  }

  if (error && listTypes.length === 0) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-6">
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadListTypes}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">List Types</h2>
        <div className="flex gap-2">
          <button
            onClick={loadListTypes}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add List Type
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto" style={{ maxHeight: '250px', overflowY: 'auto' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                Select
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Active
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Values
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {listTypes.map((listType) => (
              <tr
                key={listType.id}
                className={`hover:bg-gray-50 ${selectedId === listType.id ? 'bg-blue-50' : ''}`}
              >
                <td className="px-4 py-3">
                  <input
                    type="radio"
                    name="listtype-select"
                    checked={selectedId === listType.id}
                    onChange={() => handleSelect(listType.id)}
                    className="h-4 w-4 text-blue-600 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3">
                  {editingId === listType.id ? (
                    <input
                      type="text"
                      value={editForm.name || ''}
                      onChange={(e) => {
                        const updated = { ...editForm, name: e.target.value };
                        setEditForm(updated);
                        scheduleAutoSave(updated);
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-900">{listType.name}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === listType.id ? (
                    <input
                      type="text"
                      value={editForm.description || ''}
                      onChange={(e) => {
                        const updated = { ...editForm, description: e.target.value };
                        setEditForm(updated);
                        scheduleAutoSave(updated);
                      }}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <span className="text-sm text-gray-600">{listType.description || '-'}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {editingId === listType.id ? (
                    <input
                      type="checkbox"
                      checked={editForm.isActive || false}
                      onChange={(e) => {
                        const updated = { ...editForm, isActive: e.target.checked };
                        setEditForm(updated);
                        scheduleAutoSave(updated);
                      }}
                      className="h-4 w-4 text-blue-600"
                    />
                  ) : (
                    <span className={listType.isActive ? 'text-green-600' : 'text-red-600'}>
                      {listType.isActive ? '✓' : '✗'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span className="text-sm text-gray-600">{listType._count.values}</span>
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex justify-center items-center gap-1">
                    {editingId === listType.id && saveStatus === 'saving' && (
                      <span className="text-xs text-gray-400">Saving...</span>
                    )}
                    {editingId === listType.id && saveStatus === 'saved' && (
                      <span className="text-xs text-green-500">Saved</span>
                    )}
                    {editingId === listType.id && saveStatus === 'error' && (
                      <span className="text-xs text-red-500">Error</span>
                    )}
                    {editingId !== listType.id && (
                      <>
                        <button
                          onClick={() => handleEdit(listType)}
                          className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(listType.id)}
                          className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                    {editingId === listType.id && (
                      <button
                        onClick={() => { setEditingId(null); setEditForm({}); setSaveStatus('idle'); }}
                        className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                        title="Done editing"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {listTypes.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No list types found. Click "Add List Type" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ListTypesGrid;
