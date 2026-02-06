/**
 * Translations Editor Component
 *
 * Modal for managing translations of a list value.
 * Allows adding/editing/removing translations per language.
 */

import { useState, useEffect, useCallback } from 'react';
import { authApi } from '../../auth/services/auth.api';
import { useListValues } from '../../../hooks/useListValues';
import { createLogger } from '../../../lib/logger';

const logger = createLogger('TranslationsEditor');

interface Translation {
  id: string;
  language: string;
  label: string;
  description: string | null;
}

interface TranslationsEditorProps {
  listTypeId: string;
  valueId: string;
  valueName: string;
  onClose: () => void;
}

export function TranslationsEditor({ listTypeId, valueId, valueName, onClose }: TranslationsEditorProps) {
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editRows, setEditRows] = useState<Record<string, { label: string; description: string }>>({});
  const [newLang, setNewLang] = useState('');

  const { values: languages } = useListValues({ typeName: 'Languages' });

  const loadTranslations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = authApi.getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(`/api/list-types/${listTypeId}/values/${valueId}/translations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load translations');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setTranslations(data.data);
        // Initialize edit rows from loaded data
        const rows: Record<string, { label: string; description: string }> = {};
        for (const t of data.data) {
          rows[t.language] = { label: t.label, description: t.description || '' };
        }
        setEditRows(rows);
      }
    } catch (err) {
      logger.error(`Failed to load translations: ${err}`);
      setError(err instanceof Error ? err.message : 'Failed to load translations');
    } finally {
      setLoading(false);
    }
  }, [listTypeId, valueId]);

  useEffect(() => {
    loadTranslations();
  }, [loadTranslations]);

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      setError(null);

      const token = authApi.getToken();
      if (!token) throw new Error('Not authenticated');

      const translationsPayload = Object.entries(editRows)
        .filter(([, val]) => val.label.trim() !== '')
        .map(([lang, val]) => ({
          language: lang,
          label: val.label.trim(),
          description: val.description.trim() || null,
        }));

      const response = await fetch(`/api/list-types/${listTypeId}/values/${valueId}/translations`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ translations: translationsPayload }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save translations');
      }

      await loadTranslations();
    } catch (err) {
      logger.error(`Failed to save translations: ${err}`);
      setError(err instanceof Error ? err.message : 'Failed to save translations');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTranslation = async (language: string) => {
    try {
      const token = authApi.getToken();
      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `/api/list-types/${listTypeId}/values/${valueId}/translations/${language}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete translation');
      }

      // Remove from local state
      const newRows = { ...editRows };
      delete newRows[language];
      setEditRows(newRows);
      setTranslations(translations.filter((t) => t.language !== language));
    } catch (err) {
      logger.error(`Failed to delete translation: ${err}`);
      setError(err instanceof Error ? err.message : 'Failed to delete translation');
    }
  };

  const handleAddLanguage = () => {
    if (!newLang || editRows[newLang]) return;
    setEditRows({ ...editRows, [newLang]: { label: '', description: '' } });
    setNewLang('');
  };

  // Languages that don't have a translation yet
  const availableLanguages = languages.filter((lang) => !editRows[lang.value]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Translations</h3>
            <p className="text-sm text-gray-500">
              Manage translations for: <strong>{valueName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading translations...</div>
          ) : error ? (
            <div className="text-red-600 mb-4">{error}</div>
          ) : null}

          {/* Existing translations */}
          {Object.entries(editRows).length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200 mb-4">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase w-24">
                    Language
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Label
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase w-16">
                    &nbsp;
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(editRows)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([lang, val]) => {
                    const langInfo = languages.find((l) => l.value === lang);
                    return (
                      <tr key={lang}>
                        <td className="px-3 py-2">
                          <span className="text-sm font-medium text-gray-700">
                            {langInfo?.label || lang}
                          </span>
                          <span className="text-xs text-gray-400 ml-1">({lang})</span>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={val.label}
                            onChange={(e) =>
                              setEditRows({
                                ...editRows,
                                [lang]: { ...val, label: e.target.value },
                              })
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Translated label"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={val.description}
                            onChange={(e) =>
                              setEditRows({
                                ...editRows,
                                [lang]: { ...val, description: e.target.value },
                              })
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Translated description (optional)"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => handleDeleteTranslation(lang)}
                            className="text-red-500 hover:text-red-700 text-sm"
                            title="Remove translation"
                          >
                            &times;
                          </button>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          ) : (
            !loading && (
              <p className="text-gray-500 text-center py-4">No translations yet. Add one below.</p>
            )
          )}

          {/* Add new language */}
          {availableLanguages.length > 0 && (
            <div className="flex items-center gap-2 mt-4">
              <select
                value={newLang}
                onChange={(e) => setNewLang(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm"
              >
                <option value="">Select language...</option>
                {availableLanguages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label} ({lang.value})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAddLanguage}
                disabled={!newLang}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Add Language
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TranslationsEditor;
