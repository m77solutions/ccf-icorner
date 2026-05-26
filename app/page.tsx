import Link from 'next/link';

export default function Landing() {
  return (
    <main className="min-h-screen bg-[#FAFAF7] p-8 md:p-12">
      <header className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
          🙏 Welcome to CCF Main Welcome Center
        </h1>
        <p className="mt-3 text-lg text-slate-700">
          Discover where God is leading you in your journey
        </p>
      </header>

      <section className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900">✨ What's Next?</h2>
          <p className="text-lg text-slate-700 mt-2">
            How would you like to explore today?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/journey"
            className="block bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition border-2 border-slate-200 hover:border-blue-400"
          >
            <div className="text-4xl mb-3">🧭</div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900">
              Discipleship Journey Calendar
            </h3>
            <div className="flex flex-wrap gap-3 mb-4 text-sm text-slate-800">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-[#F5C518] inline-block"></span>
                Engage
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-[#8BC34A] inline-block"></span>
                Edify
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-[#2E9DF7] inline-block"></span>
                Equip
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-[#8B1A1A] inline-block"></span>
                Empower
              </span>
            </div>
            <p className="text-slate-600 italic mb-4">
              "Check activities in the Discipleship Journey"
            </p>
            <span className="text-blue-700 font-semibold">Explore →</span>
          </Link>

          <Link
            href="/division/ministries"
            className="block bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition border-2 border-slate-200 hover:border-blue-400"
          >
            <div className="text-4xl mb-3">🏛️</div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900">
              Division Calendars
            </h3>
            <p className="text-slate-700 mb-4">
              GLC · Ministries · Pastoral Areas
            </p>
            <p className="text-slate-600 italic mb-4">"What is [X] doing next?"</p>
            <span className="text-blue-700 font-semibold">Explore →</span>
          </Link>

          <Link
            href="/month/current"
            className="block bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition border-2 border-slate-200 hover:border-blue-400"
          >
            <div className="text-4xl mb-3">📅</div>
            <h3 className="text-2xl font-bold mb-4 text-slate-900">
              Monthly Calendars
            </h3>
            <p className="text-slate-700 mb-4">January to December</p>
            <p className="text-slate-600 italic mb-4">
              "What's happening this month?"
            </p>
            <span className="text-blue-700 font-semibold">Explore →</span>
          </Link>
        </div>

        <div className="mt-10 text-center">
          <p className="text-slate-700 mb-3">📚 Or browse the database:</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/division/glc"
              className="px-5 py-2 bg-white border-2 border-slate-300 rounded-full text-slate-800 font-medium hover:bg-slate-100 hover:border-blue-400"
            >
              GLC
            </Link>
            <Link
              href="/division/ministries"
              className="px-5 py-2 bg-white border-2 border-slate-300 rounded-full text-slate-800 font-medium hover:bg-slate-100 hover:border-blue-400"
            >
              Ministries
            </Link>
            <Link
              href="/division/pastoral-areas"
              className="px-5 py-2 bg-white border-2 border-slate-300 rounded-full text-slate-800 font-medium hover:bg-slate-100 hover:border-blue-400"
            >
              Pastoral Areas
            </Link>
          </div>
        </div>

        <p className="text-center text-slate-600 mt-10">
          💡 Not sure where to look? Ask the Welcome Center Assistant 💬
        </p>
      </section>
    </main>
  );
}
