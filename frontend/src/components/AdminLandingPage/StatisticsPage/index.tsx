/**
 * Admin Statistics Page
 * Read-only statistics viewer with Tabulator grid
 */

import { useState } from 'react';
import StatisticsGrid from './StatisticsGrid';

export default function StatisticsPage() {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="p-6 h-full">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Statistics</h1>
        <p className="text-slate-400">
          View application statistics and user activity. Use column filters to search and sort data.
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

      <StatisticsGrid onError={setError} />
    </div>
  );
}
