import { useAuth } from '../../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-80px)] px-6 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome, {user?.firstName || 'Admin'}
          </h1>
          <p className="text-slate-400">Kitchen48 Admin Dashboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stats Cards */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent-green/20 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-accent-green">restaurant</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Recipes</p>
                <p className="text-2xl font-bold text-white">--</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-accent-orange/20 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-accent-orange">group</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Users</p>
                <p className="text-2xl font-bold text-white">--</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-blue-400">chef_hat</span>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Active Chefs</p>
                <p className="text-2xl font-bold text-white">--</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl p-4 text-left transition-all group">
              <span className="material-symbols-outlined text-accent-orange group-hover:scale-110 transition-transform inline-block mb-2">add_circle</span>
              <p className="text-white font-medium">Add Recipe</p>
              <p className="text-slate-400 text-sm">Create a new recipe</p>
            </button>

            <button className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl p-4 text-left transition-all group">
              <span className="material-symbols-outlined text-accent-green group-hover:scale-110 transition-transform inline-block mb-2">manage_accounts</span>
              <p className="text-white font-medium">Manage Users</p>
              <p className="text-slate-400 text-sm">View and edit users</p>
            </button>

            <button className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl p-4 text-left transition-all group">
              <span className="material-symbols-outlined text-blue-400 group-hover:scale-110 transition-transform inline-block mb-2">analytics</span>
              <p className="text-white font-medium">Analytics</p>
              <p className="text-slate-400 text-sm">View site statistics</p>
            </button>

            <button className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl p-4 text-left transition-all group">
              <span className="material-symbols-outlined text-purple-400 group-hover:scale-110 transition-transform inline-block mb-2">settings</span>
              <p className="text-white font-medium">Settings</p>
              <p className="text-slate-400 text-sm">Configure site settings</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
