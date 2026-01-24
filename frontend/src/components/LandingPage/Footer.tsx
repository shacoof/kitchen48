export default function Footer() {
  return (
    <footer className="bg-primary pt-20 pb-10 border-t border-slate-700/50 mt-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <div className="flex items-center">
              <img
                alt="Kitchen48"
                className="h-10 w-auto"
                src="/kitchen48-logo.jpg"
              />
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Revolutionizing the way home cooks connect with professional culinary wisdom. Quality recipes for everyone.
            </p>
            <div className="flex gap-4">
              <a
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-accent-orange transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined text-[20px]">public</span>
              </a>
              <a
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-accent-orange transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined text-[20px]">share</span>
              </a>
              <a
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white hover:bg-accent-orange transition-colors"
                href="#"
              >
                <span className="material-symbols-outlined text-[20px]">mail</span>
              </a>
            </div>
          </div>

          <div>
            <h5 className="text-white font-bold mb-6">Platform</h5>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li><a className="hover:text-accent-orange" href="#">Browse Recipes</a></li>
              <li><a className="hover:text-accent-orange" href="#">Pro Subscriptions</a></li>
              <li><a className="hover:text-accent-orange" href="#">Cooking Classes</a></li>
              <li><a className="hover:text-accent-orange" href="#">Chef Partnerships</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-bold mb-6">Support</h5>
            <ul className="space-y-4 text-slate-400 text-sm">
              <li><a className="hover:text-accent-orange" href="#">Help Center</a></li>
              <li><a className="hover:text-accent-orange" href="#">Kitchen Gear</a></li>
              <li><a className="hover:text-accent-orange" href="#">Privacy Policy</a></li>
              <li><a className="hover:text-accent-orange" href="#">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-bold mb-6">Mobile App</h5>
            <p className="text-slate-400 text-sm mb-6">
              Get the best of Kitchen48 on the go. Available on iOS & Android.
            </p>
            <div className="space-y-3">
              <button className="w-full bg-slate-800 text-white p-3 rounded-lg flex items-center gap-3 hover:bg-slate-700 transition-all border border-slate-700">
                <span className="material-symbols-outlined">android</span>
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold leading-none">Get it on</p>
                  <p className="text-sm font-bold">Google Play</p>
                </div>
              </button>
              <button className="w-full bg-slate-800 text-white p-3 rounded-lg flex items-center gap-3 hover:bg-slate-700 transition-all border border-slate-700">
                <span className="material-symbols-outlined">phone_iphone</span>
                <div className="text-left">
                  <p className="text-[10px] uppercase font-bold leading-none">Download on the</p>
                  <p className="text-sm font-bold">App Store</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 text-center text-slate-500 text-xs">
          &copy; {new Date().getFullYear()} Kitchen48 Inc. All rights reserved. Crafted for food lovers everywhere.
        </div>
      </div>
    </footer>
  )
}
