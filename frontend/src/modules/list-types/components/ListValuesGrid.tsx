/**
 * List Values Grid Component
 *
 * Displays and manages list values for a selected list type.
 * Admin-only component for managing dropdown options.
 */

import { useState, useEffect, useCallback } from 'react';
import { authApi } from '../../auth/services/auth.api';

interface ListValue {
  id: string;
  listTypeId: string;
  value: string;
  label: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ListValuesGridProps {
  listTypeId: string | null;
}

export function ListValuesGrid({ listTypeId }: ListValuesGridProps) {
  const [listValues, setListValues] = useState<ListValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ListValue>>({});

  const loadValues = useCallback(async () => {
    if (!listTypeId) {
      setListValues([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const token = authApi.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/list-types/${listTypeId}/values`, {
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
        setListValues(data.data);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load list values';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [listTypeId]);

  useEffect(() => {
    loadValues();
  }, [loadValues]);

  const handleAdd = async () => {
    if (!listTypeId) return;

    try {
      const token = authApi.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const newValue = {
        value: `NEW_VALUE_${Date.now()}`,
        label: 'New Value',
        description: '',
        sortOrder: listValues.length,
        isActive: true,
      };

      const response = await fetch(`/api/list-types/${listTypeId}/values`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newValue),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create');
      }

      loadValues();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create list value';
      alert(message);
    }
  };

  const handleEdit = (value: ListValue) => {
    setEditingId(value.id);
    setEditForm({
      value: value.value,
      label: value.label,
      description: value.description || '',
      sortOrder: value.sortOrder,
      isActive: value.isActive,
    });
  };

  const handleSave = async () => {
    if (!editingId || !listTypeId) return;

    try {
      const token = authApi.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/list-types/${listTypeId}/values/${editingId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update');
      }

      setEditingId(null);
      setEditForm({});
      loadValues();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update list value';
      alert(message);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleDelete = async (valueId: string) => {
    if (!listTypeId) return;
    if (!confirm('Are you sure you want to delete this list value?')) {
      return;
    }

    try {
      const token = authApi.getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/list-types/${listTypeId}/values/${valueId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete');
      }

      loadValues();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete list value';
      alert(message);
    }
  };

  if (!listTypeId) {
    return (
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6 text-center">
        <p className="text-gray-500">Select a list type above to view its values.</p>
      </div>
    );
  }

  if (loading && listValues.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">Loading list values...</div>
      </div>
    );
  }

  if (error && listValues.length === 0) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-6">
        <p className="text-red-600">{error}</p>
        <button
          onClick={loadValues}
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
        <h2 className="text-lg font-semibold text-gray-900">List Values</h2>
        <div className="flex gap-2">
          <button
            onClick={loadValues}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50"
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Add Value
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto" style={{ maxHeight: '400px', overflowY: 'auto' }}>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value (Code)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Label
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Order
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                Active
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {listValues.map((value) => (
              <tr key={value.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {editingId === value.id ? (
                    <input
                      type="text"
                      value={editForm.value || ''}
                      onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                    />
                  ) : (
                    <span className="text-sm font-mono text-gray-900">{value.value}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === value.id ? (
                    <input
                      type="text"
                      value={editForm.label || ''}
                      onChange={(e) => setEditForm({ ...editForm, label: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <span className="text-sm text-gray-900">{value.label}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === value.id ? (
                    <input
                      type="text"
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  ) : (
                    <span className="text-sm text-gray-600">{value.description || '-'}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {editingId === value.id ? (
                    <input
                      type="number"
                      value={editForm.sortOrder || 0}
                      onChange={(e) => setEditForm({ ...editForm, sortOrder: parseInt(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                    />
                  ) : (
                    <span className="text-sm text-gray-600">{value.sortOrder}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {editingId === value.id ? (
                    <input
                      type="checkbox"
                      checked={editForm.isActive || false}
                      onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                      className="h-4 w-4 text-blue-600"
                    />
                  ) : (
                    <span className={value.isActive ? 'text-green-600' : 'text-red-600'}>
                      {value.isActive ? '✓' : '✗'}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  {editingId === value.id ? (
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={handleSave}
                        className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => handleEdit(value)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50"
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(value.id)}
                        className="px-2 py-1 text-xs border border-red-300 text-red-600 rounded hover:bg-red-50"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {listValues.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No values found. Click "Add Value" to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ListValuesGrid;
