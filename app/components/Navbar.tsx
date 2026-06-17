import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="font-serif text-[17px] font-semibold text-slate-900 tracking-tight">
          CCF <span className="text-blue-600">iCorner</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-1">
          <Link
            href="/"
            className="text-[13px] font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition"
          >
            Home
          </Link>
          <Link
            href="/journey"
            className="text-[13px] font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition"
          >
            Journey
          </Link>
          <Link
            href="/division/ministries"
            className="text-[13px] font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition"
          >
            Divisions
          </Link>
          <Link
            href="/month/current"
            className="text-[13px] font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition"
          >
            Monthly
          </Link>
        </nav>

        {/* CTA */}
        <Link
          href="#"
          className="text-[13px] font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-full transition"
        >
          Ask Assistant ✦
        </Link>

      </div>
    </header>
  );
}
