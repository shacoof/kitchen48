import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { UserAvatar } from '../common/UserAvatar'

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const { t } = useTranslation('landing')
  const { t: tc } = useTranslation('common')
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const location = useLocation()

  // Close menus when clicking outside
  useEffect(() => {
    if (!menuOpen && !mobileNavOpen) return
    const handleClickOutside = () => {
      setMenuOpen(false)
      setMobileNavOpen(false)
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [menuOpen, mobileNavOpen])

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  const displayName = user?.firstName || user?.email?.split('@')[0] || 'User'

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="sticky top-0 z-50 bg-primary border-b border-slate-700/50 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
        {/* LEFT: Logo + Mobile hamburger */}
        <div className="flex items-center gap-2 h-full py-1">
          {/* Hamburger menu button (mobile only) */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMobileNavOpen(!mobileNavOpen)
            }}
            className="md:hidden p-2 -ml-2 text-white/80 hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">
              {mobileNavOpen ? 'close' : 'menu'}
            </span>
          </button>
          <Link to="/" className="h-full flex items-center">
            <img
              alt="Kitchen48 Logo"
              className="h-10 md:h-12 w-auto object-contain"
              src="/kitchen48-logo-tight.jpg"
            />
          </Link>
        </div>

        {/* CENTER: Icon navigation (desktop) */}
        <nav className="hidden md:flex items-center gap-2">
          {/* Explore - always visible */}
          <Link
            to="/explore"
            className={`group relative flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
              isActive('/explore')
                ? 'bg-accent-orange text-white'
                : 'text-white/80 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-[24px]">search</span>
            <span className="absolute top-full mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              {tc('navigation.explore')}
            </span>
          </Link>

          {/* Favorites - auth only */}
          {isAuthenticated && (
            <Link
              to="/favorites"
              className={`group relative flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                isActive('/favorites')
                  ? 'bg-accent-orange text-white'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span
                className="material-symbols-outlined text-[24px]"
                style={isActive('/favorites') ? { fontVariationSettings: "'FILL' 1" } : undefined}
              >
                favorite
              </span>
              <span className="absolute top-full mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {tc('navigation.favorites')}
              </span>
            </Link>
          )}

          {/* Create - auth only */}
          {isAuthenticated && (
            <Link
              to="/recipes/new"
              className={`group relative flex items-center justify-center w-12 h-12 rounded-full transition-colors ${
                isActive('/recipes/new')
                  ? 'bg-accent-orange text-white'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <span className="material-symbols-outlined text-[24px]">add</span>
              <span className="absolute top-full mt-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {tc('navigation.create')}
              </span>
            </Link>
          )}
        </nav>

        {/* RIGHT: Auth */}
        <div className="flex items-center">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setMenuOpen(!menuOpen)
                }}
                className="flex items-center gap-2 bg-accent-orange hover:bg-[#E64A19] text-white px-4 py-1.5 rounded-full font-semibold transition-all shadow-lg active:scale-95"
              >
                <UserAvatar
                  profilePicture={user?.profilePicture}
                  name={displayName}
                  size="sm"
                />
                <span className="hidden sm:inline">{displayName}</span>
                <span className="material-symbols-outlined text-[18px]">
                  {menuOpen ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-primary border border-slate-600 rounded-lg shadow-xl z-50">
                  <div className="px-4 py-3 border-b border-slate-600">
                    <p className="text-white text-sm font-medium">{user?.firstName} {user?.lastName}</p>
                    <p className="text-slate-400 text-xs truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/recipes"
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-left px-4 py-3 text-white hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">menu_book</span>
                    {tc('navigation.recipes')}
                  </Link>
                  <Link
                    to="/profile/edit"
                    onClick={() => setMenuOpen(false)}
                    className="w-full text-left px-4 py-3 text-white hover:bg-slate-700 transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">person</span>
                    {tc('navigation.my_profile')}
                  </Link>
                  <button
                    onClick={() => {
                      logout()
                      setMenuOpen(false)
                    }}
                    className="w-full text-left px-4 py-3 text-white hover:bg-slate-700 transition-colors flex items-center gap-2 border-t border-slate-600"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    {tc('buttons.signOut')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="bg-accent-orange hover:bg-[#E64A19] text-white px-6 py-2.5 rounded-full font-semibold transition-all shadow-lg active:scale-95"
            >
              {t('header.sign_in')}
            </Link>
          )}
        </div>
      </div>

      {/* Mobile navigation dropdown */}
      {mobileNavOpen && (
        <nav className="md:hidden bg-primary border-t border-slate-700/50 px-4 py-3 space-y-1">
          <Link
            to="/explore"
            onClick={() => setMobileNavOpen(false)}
            className={`block px-3 py-3 rounded-lg transition-colors font-medium flex items-center gap-3 ${
              isActive('/explore') ? 'bg-accent-orange text-white' : 'text-white/90 hover:bg-slate-700/50'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
            {tc('navigation.explore')}
          </Link>
          {isAuthenticated && (
            <>
              <Link
                to="/favorites"
                onClick={() => setMobileNavOpen(false)}
                className={`block px-3 py-3 rounded-lg transition-colors font-medium flex items-center gap-3 ${
                  isActive('/favorites') ? 'bg-accent-orange text-white' : 'text-white/90 hover:bg-slate-700/50'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">favorite</span>
                {tc('navigation.favorites')}
              </Link>
              <Link
                to="/recipes/new"
                onClick={() => setMobileNavOpen(false)}
                className={`block px-3 py-3 rounded-lg transition-colors font-medium flex items-center gap-3 ${
                  isActive('/recipes/new') ? 'bg-accent-orange text-white' : 'text-white/90 hover:bg-slate-700/50'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                {tc('navigation.create')}
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  )
}
