/**
 * Admin Users Page
 * User management with Tabulator grid
 */

import { useState } from 'react';
import UsersGrid from './UsersGrid';

export default function UsersPage() {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="p-6 h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Users</h1>
        <p className="text-slate-400">
          Manage user accounts. Click on a cell to edit. Changes are saved automatically.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      )}

      <UsersGrid onError={setError} />
    </div>
  );
}
