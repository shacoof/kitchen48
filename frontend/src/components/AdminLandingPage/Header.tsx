import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-primary border-b border-slate-700/50 shadow-xl">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img
            alt="Kitchen48 Logo"
            className="h-12 w-auto object-contain"
            src="/kitchen48-logo.jpg"
          />
          <span className="text-white/80 text-sm font-medium bg-accent-orange/20 px-3 py-1 rounded-full border border-accent-orange/30">
            Admin Portal
          </span>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && user && (
            <>
              <span className="text-white/80 text-sm">
                {user.firstName} {user.lastName}
              </span>
              <button
                onClick={logout}
                className="bg-slate-600 hover:bg-slate-500 text-white px-4 py-2 rounded-full font-medium transition-all text-sm"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
