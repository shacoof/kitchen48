import { useState } from 'react';
import IngredientsGrid from './IngredientsGrid';

export default function IngredientsPage() {
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="min-h-[calc(100vh-160px)] px-6 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Ingredients</h1>
          <p className="text-slate-400">
            Manage the master ingredients catalog for recipes.
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-4 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-red-200 hover:text-white"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        )}

        {/* Ingredients Grid */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <IngredientsGrid onError={setError} />
        </div>
      </div>
    </div>
  );
}
