import { useAuth } from '../../context/AuthContext';

export default function AccessDenied() {
  const { logout } = useAuth();

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-6 py-12">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-red-400 text-4xl">block</span>
        </div>
        <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
        <p className="text-slate-400 mb-8">
          Your account does not have administrator privileges. Please contact an administrator if you believe this is an error.
        </p>
        <button
          onClick={logout}
          className="bg-slate-600 hover:bg-slate-500 text-white px-6 py-3 rounded-lg font-medium transition-all"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
