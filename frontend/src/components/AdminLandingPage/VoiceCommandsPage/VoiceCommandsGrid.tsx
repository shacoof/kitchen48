import { useEffect, useRef, useState } from 'react';
import '../ParametersPage/tabulator-theme.css';
import 'tabulator-tables/dist/css/tabulator.min.css';

declare global {
  interface Window {
    TabulatorModule: typeof import('tabulator-tables').TabulatorFull;
  }
}

interface VoiceCommandTranslation {
  id: string;
  language: string;
  displayKeyword: string;
  description: string;
}

interface VoiceCommand {
  id: string;
  command: string;
  keywords: string[];
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  translations: VoiceCommandTranslation[];
}

interface VoiceCommandsGridProps {
  onError?: (message: string) => void;
}

export default function VoiceCommandsGrid({ onError }: VoiceCommandsGridProps) {
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

  const getToken = () => localStorage.getItem('auth_token');

  // Load voice commands from admin API
  const loadCommands = async (): Promise<VoiceCommand[]> => {
    try {
      const response = await fetch('/api/voice-commands/admin', {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to load voice commands');
      }

      const data = await response.json();
      return data.data || [];
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to load voice commands');
      return [];
    }
  };

  // Flatten commands for Tabulator (extract translation fields into columns)
  const flattenCommands = (commands: VoiceCommand[]) => {
    return commands.map((cmd) => {
      const enTrans = cmd.translations.find((t) => t.language === 'en');
      const heTrans = cmd.translations.find((t) => t.language === 'he');
      return {
        id: cmd.id,
        command: cmd.command,
        keywords: cmd.keywords.join(', '),
        icon: cmd.icon,
        sortOrder: cmd.sortOrder,
        isActive: cmd.isActive,
        enDisplayKeyword: enTrans?.displayKeyword || '',
        enDescription: enTrans?.description || '',
        heDisplayKeyword: heTrans?.displayKeyword || '',
        heDescription: heTrans?.description || '',
      };
    });
  };

  // Update voice command via API
  const updateCommand = async (id: string, data: Record<string, unknown>) => {
    try {
      const response = await fetch(`/api/voice-commands/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update');
      }
      return true;
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to update voice command');
      return false;
    }
  };

  // Upsert translation via API
  const upsertTranslation = async (id: string, language: string, displayKeyword: string, description: string) => {
    try {
      const response = await fetch(`/api/voice-commands/${id}/translations`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ language, displayKeyword, description }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update translation');
      }
      return true;
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to update translation');
      return false;
    }
  };

  // Delete voice command via API
  const deleteCommand = async (id: string) => {
    try {
      const response = await fetch(`/api/voice-commands/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      if (!response.ok && response.status !== 204) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete');
      }
      return true;
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to delete voice command');
      return false;
    }
  };

  // Initialize Tabulator
  useEffect(() => {
    if (!tabulatorLoaded || !tableRef.current || tabulatorRef.current) return;

    const Tabulator = window.TabulatorModule;

    const booleanFormatter = function(cell: { getValue: () => boolean }) {
      const value = cell.getValue();
      return value
        ? '<span style="color: #4CAF50;">Active</span>'
        : '<span style="color: #ef4444;">Inactive</span>';
    };

    const iconFormatter = function(cell: { getValue: () => string | null }) {
      const value = cell.getValue();
      if (!value) return '';
      return `<span class="material-symbols-outlined" style="font-size: 20px;">${value}</span> ${value}`;
    };

    const columns = [
      {
        title: 'Order',
        field: 'sortOrder',
        editor: 'number',
        sorter: 'number' as const,
        width: 70,
        hozAlign: 'center',
      },
      {
        title: 'Command',
        field: 'command',
        editor: 'input',
        headerFilter: 'input',
        sorter: 'string' as const,
        width: 120,
      },
      {
        title: 'Keywords (comma-separated)',
        field: 'keywords',
        editor: 'input',
        headerFilter: 'input',
        sorter: 'string' as const,
        width: 280,
      },
      {
        title: 'Icon',
        field: 'icon',
        editor: 'input',
        formatter: iconFormatter,
        sorter: 'string' as const,
        width: 150,
      },
      {
        title: 'EN Keyword',
        field: 'enDisplayKeyword',
        editor: 'input',
        sorter: 'string' as const,
        width: 150,
      },
      {
        title: 'EN Description',
        field: 'enDescription',
        editor: 'input',
        sorter: 'string' as const,
        width: 220,
      },
      {
        title: 'HE Keyword',
        field: 'heDisplayKeyword',
        editor: 'input',
        sorter: 'string' as const,
        width: 150,
      },
      {
        title: 'HE Description',
        field: 'heDescription',
        editor: 'input',
        sorter: 'string' as const,
        width: 220,
      },
      {
        title: 'Status',
        field: 'isActive',
        editor: 'tickCross',
        formatter: booleanFormatter,
        sorter: 'string' as const,
        width: 80,
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
        cellClick: async function(_e: Event, cell: { getRow: () => { getData: () => { id: string; command: string }; delete: () => void } }) {
          const row = cell.getRow();
          const data = row.getData();
          if (confirm(`Delete voice command "${data.command}"?`)) {
            const success = await deleteCommand(data.id);
            if (success) row.delete();
          }
        },
      },
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: any = {
      height: '100%',
      layout: 'fitData',
      responsiveLayout: 'collapse',
      placeholder: 'No voice commands found',
      columns: columns,
      initialSort: [{ column: 'sortOrder', dir: 'asc' }],
    };

    tabulatorRef.current = new Tabulator(tableRef.current, options);

    // Handle cell edits
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tabulatorRef.current.on('cellEdited', async function(cell: any) {
      const field = cell.getField();
      if (field === 'actions') return;

      const row = cell.getRow();
      const rowData = row.getData();
      let success = false;

      // Translation fields → upsert translation
      if (field === 'enDisplayKeyword' || field === 'enDescription') {
        success = await upsertTranslation(
          rowData.id,
          'en',
          rowData.enDisplayKeyword,
          rowData.enDescription
        );
      } else if (field === 'heDisplayKeyword' || field === 'heDescription') {
        success = await upsertTranslation(
          rowData.id,
          'he',
          rowData.heDisplayKeyword,
          rowData.heDescription
        );
      } else {
        // Core fields → update command
        const updateData: Record<string, unknown> = {};

        if (field === 'keywords') {
          // Convert comma-separated back to array
          updateData.keywords = rowData.keywords
            .split(',')
            .map((k: string) => k.trim())
            .filter((k: string) => k.length > 0);
        } else if (field === 'sortOrder') {
          updateData.sortOrder = Number(rowData.sortOrder);
        } else if (field === 'isActive') {
          updateData.isActive = rowData.isActive;
        } else {
          updateData[field] = rowData[field];
        }

        success = await updateCommand(rowData.id, updateData);
      }

      if (!success) {
        // Reload on error
        const commands = await loadCommands();
        tabulatorRef.current?.setData(flattenCommands(commands));
      }
    });

    // Load initial data
    loadCommands().then((commands) => {
      tabulatorRef.current?.setData(flattenCommands(commands));
      setLoading(false);
    });

    return () => {
      tabulatorRef.current?.destroy();
      tabulatorRef.current = null;
    };
  }, [tabulatorLoaded]);

  // Create new voice command
  const handleCreate = async () => {
    try {
      const response = await fetch('/api/voice-commands', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          command: `new_command_${Date.now()}`,
          keywords: ['keyword'],
          icon: 'mic',
          sortOrder: 99,
          isActive: true,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create voice command');
      }

      const commands = await loadCommands();
      tabulatorRef.current?.setData(flattenCommands(commands));
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to create voice command');
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    const commands = await loadCommands();
    tabulatorRef.current?.setData(flattenCommands(commands));
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
            onClick={handleCreate}
            className="bg-accent-orange hover:bg-accent-orange/90 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add Command
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
