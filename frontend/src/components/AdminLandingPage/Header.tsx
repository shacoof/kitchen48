import { useAuth } from '../../context/AuthContext';

export type AdminPage = 'dashboard' | 'parameters';

interface HeaderProps {
  currentPage?: AdminPage;
  onNavigate?: (page: AdminPage) => void;
}

export default function Header({ currentPage = 'dashboard', onNavigate }: HeaderProps) {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();

  const navItems: { id: AdminPage; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'parameters', label: 'Parameters' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-primary border-b border-slate-700/50 shadow-xl">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
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

          {isAuthenticated && isAdmin && onNavigate && (
            <nav className="flex items-center gap-6">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`text-white/90 hover:text-white transition-colors font-medium py-2 ${
                    currentPage === item.id
                      ? 'border-b-2 border-accent-orange text-white'
                      : ''
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          )}
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
