import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { UserAvatar } from '../common/UserAvatar'

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth()
  const { t } = useTranslation('landing')
  const { t: tc } = useTranslation('common')
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

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

  const displayName = user?.firstName || user?.email?.split('@')[0] || 'User'

  return (
    <header className="sticky top-0 z-50 bg-primary border-b border-slate-700/50 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
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
          <img
            alt="Kitchen48 Logo"
            className="h-full w-auto object-contain"
            src="/kitchen48-logo-tight.jpg"
          />
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a className="text-white/90 hover:text-white transition-colors font-medium" href="#">
            {tc('navigation.explore')}
          </a>
          <Link to={isAuthenticated ? '/recipes' : '#'} className="text-white/90 hover:text-white transition-colors font-medium">
            {tc('navigation.recipes')}
          </Link>
          <a className="text-white/90 hover:text-white transition-colors font-medium" href="#">
            {tc('navigation.chefs')}
          </a>
          <a className="text-white/90 hover:text-white transition-colors font-medium" href="#">
            {tc('navigation.community')}
          </a>
        </nav>

        <div className="flex items-center gap-6">
          <div className="relative group hidden lg:block">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </span>
            <input
              className="bg-primary/50 border border-slate-500/50 rounded-full py-2 pl-10 pr-4 w-64 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-orange transition-all placeholder:text-slate-400"
              placeholder={t('header.search_placeholder')}
              type="text"
            />
          </div>
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
                <span>{displayName}</span>
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
          <a
            href="#"
            onClick={() => setMobileNavOpen(false)}
            className="block px-3 py-3 text-white/90 hover:bg-slate-700/50 rounded-lg transition-colors font-medium flex items-center gap-3"
          >
            <span className="material-symbols-outlined text-[20px] text-white/60">explore</span>
            {tc('navigation.explore')}
          </a>
          <Link
            to={isAuthenticated ? '/recipes' : '#'}
            onClick={() => setMobileNavOpen(false)}
            className="block px-3 py-3 text-white/90 hover:bg-slate-700/50 rounded-lg transition-colors font-medium flex items-center gap-3"
          >
            <span className="material-symbols-outlined text-[20px] text-white/60">menu_book</span>
            {tc('navigation.recipes')}
          </Link>
          <a
            href="#"
            onClick={() => setMobileNavOpen(false)}
            className="block px-3 py-3 text-white/90 hover:bg-slate-700/50 rounded-lg transition-colors font-medium flex items-center gap-3"
          >
            <span className="material-symbols-outlined text-[20px] text-white/60">person</span>
            {tc('navigation.chefs')}
          </a>
          <a
            href="#"
            onClick={() => setMobileNavOpen(false)}
            className="block px-3 py-3 text-white/90 hover:bg-slate-700/50 rounded-lg transition-colors font-medium flex items-center gap-3"
          >
            <span className="material-symbols-outlined text-[20px] text-white/60">groups</span>
            {tc('navigation.community')}
          </a>
        </nav>
      )}
    </header>
  )
}
