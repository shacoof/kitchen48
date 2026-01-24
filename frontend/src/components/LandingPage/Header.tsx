export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-primary border-b border-slate-700/50 shadow-xl">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center">
          <img
            alt="Kitchen48 Logo"
            className="h-14 w-auto object-contain"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDXiM2QyC5ObRArrU5R7U5VDH7jePP6Vqai-nuTmOHkz94bt85F47ch6V5LFHrReqcNhIfs9iOxKYulyNgrbzP0i5H22QsbMSxSNOcUy8QXolDFq3JY6YGnN7pDyTPfSNlyU19h0U8iIDJbpjwtunK3fgPkwa9abjCxhsDV7s8mV7OsKi2y9UmyiZ374hSGNRLsbDg_fKwaEgmBcXyNCS_pSP8hWddORd_aYpKsFSbGED2SZvopl4OqEFSeVY1hCcGo-DvE5Z1eEfI"
          />
        </div>

        <nav className="hidden md:flex items-center gap-8">
          <a className="text-white/90 hover:text-white transition-colors font-medium" href="#">
            Explore
          </a>
          <a className="text-white/90 hover:text-white transition-colors font-medium" href="#">
            Recipes
          </a>
          <a className="text-white/90 hover:text-white transition-colors font-medium" href="#">
            Chefs
          </a>
          <a className="text-white/90 hover:text-white transition-colors font-medium" href="#">
            Community
          </a>
        </nav>

        <div className="flex items-center gap-6">
          <div className="relative group hidden lg:block">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </span>
            <input
              className="bg-primary/50 border border-slate-500/50 rounded-full py-2 pl-10 pr-4 w-64 text-sm text-white focus:outline-none focus:ring-2 focus:ring-accent-orange transition-all placeholder:text-slate-400"
              placeholder="Search recipes..."
              type="text"
            />
          </div>
          <button className="bg-accent-orange hover:bg-[#E64A19] text-white px-6 py-2.5 rounded-full font-semibold transition-all shadow-lg active:scale-95">
            Sign In
          </button>
        </div>
      </div>
    </header>
  )
}
