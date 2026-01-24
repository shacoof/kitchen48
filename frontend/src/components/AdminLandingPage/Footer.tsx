export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary border-t border-slate-700/50 py-6">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-400 text-sm">
            &copy; {currentYear} Kitchen48. All rights reserved.
          </p>
          <p className="text-slate-500 text-sm">
            Admin Portal v1.0
          </p>
        </div>
      </div>
    </footer>
  );
}
