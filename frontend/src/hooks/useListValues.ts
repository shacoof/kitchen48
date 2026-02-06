/**
 * Hook to fetch LOV (List of Values) with optional language support
 */

import { useState, useEffect } from 'react';
import { createLogger } from '../lib/logger';

const logger = createLogger('useListValues');

export interface ListValueOption {
  value: string;
  label: string;
  sortOrder: number;
  translations?: Record<string, string>;
}

interface UseListValuesOptions {
  typeName: string;
  lang?: string;
  enabled?: boolean;
}

interface UseListValuesResult {
  values: ListValueOption[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useListValues({ typeName, lang, enabled = true }: UseListValuesOptions): UseListValuesResult {
  const [values, setValues] = useState<ListValueOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchValues = async () => {
    if (!typeName || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams({ type: typeName });
      if (lang) params.append('lang', lang);

      const response = await fetch(`/api/list-values?${params}`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      const data = await response.json();

      if (data.success && data.data) {
        setValues(data.data);
      } else {
        setError(data.error || 'Failed to fetch values');
      }
    } catch (err) {
      logger.error(`Failed to fetch list values for type "${typeName}": ${err}`);
      setError('Failed to fetch values');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchValues();
  }, [typeName, lang, enabled]);

  return { values, isLoading, error, refetch: fetchValues };
}

/**
 * Get the localized label for a list value
 */
export function getLocalizedLabel(
  value: ListValueOption,
  language: string
): string {
  if (value.translations && value.translations[language]) {
    return value.translations[language];
  }
  return value.label;
}
