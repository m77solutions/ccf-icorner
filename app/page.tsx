import Link from 'next/link';

export default function Landing() {
  return (
    <main className="min-h-screen bg-[#FAFAF7] p-8 md:p-12">
      <header className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800">
          🙏 Welcome to CCF Main Welcome Center
        </h1>
        <p className="mt-3 text-lg text-slate-600">
          Discover where God is leading you in your journey
        </p>
      </header>

      <section className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800">✨ What's Next?</h2>
          <p className="text-lg text-slate-600 mt-2">
            How would you like to explore today?
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/journey" className="block bg-white rounded-2xl p-8 shadow hover:shadow-lg transition border-2 border-transparent hover:border-blue-300">
            <div className="text-4xl mb-3">🧭</div>
            <h3 className="text-2xl font-bold mb-3">Discipleship Journey Calendar</h3>
            <div className="flex gap-2 mb-3 text-sm">
              <span className="w-4 h-4 rounded-full bg-[#F5C518]"></span> Engage
              <span className="w-4 h-4 rounded-full bg-[#8BC34A]"></span> Edify
            </div>
            <div className="flex gap-2 mb-4 text-sm">
              <span className="w-4 h-4 rounded-full bg-[#2E9DF7]"></span> Equip
              <span className="w-4 h-4 rounded-full bg-[#8B1A1A]"></span> Empower
            </div>
            <p className="text-slate-500 italic mb-4">
              "Check activities in the Discipleship Journey"
            </p>
            <span className="text-blue-600 font-semibold">Explore →</span>
          </Link>

          <Link href="/division/ministries" className="block bg-white rounded-2xl p-8 shadow hover:shadow-lg transition border-2 border-transparent hover:border-blue-300">
            <div className="text-4xl mb-3">🏛️</div>
            <h3 className="text-2xl font-bold mb-3">Division Calendars</h3>
            <p className="text-slate-600 mb-4">
              GLC · Ministries · Pastoral Areas
            </p>
            <p className="text-slate-500 italic mb-4">
              "What is [X] doing next?"
            </p>
            <span className="text-blue-600 font-semibold">Explore →</span>
          </Link>

          <Link href="/month/current" className="block bg-white rounded-2xl p-8 shadow hover:shadow-lg transition border-2 border-transparent hover:border-blue-300">
            <div className="text-4xl mb-3">📅</div>
            <h3 className="text-2xl font-bold mb-3">Monthly Calendars</h3>
            <p className="text-slate-600 mb-4">January to December</p>
            <p className="text-slate-500 italic mb-4">
              "What's happening this month?"
            </p>
            <span className="text-blue-600 font-semibold">Explore →</span>
          </Link>
        </div>

        <div className="mt-10 text-center">
          <p className="text-slate-600 mb-3">📚 Or browse the database:</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/division/glc" className="px-5 py-2 bg-white border rounded-full hover:bg-slate-50">GLC</Link>
            <Link href="/division/ministries" className="px-5 py-2 bg-white border rounded-full hover:bg-slate-50">Ministries</Link>
            <Link href="/division/pastoral-areas" className="px-5 py-2 bg-white border rounded-full hover:bg-slate-50">Pastoral Areas</Link>
          </div>
        </div>

        <p className="text-center text-slate-500 mt-10">
          💡 Not sure where to look? Ask the Welcome Center Assistant 💬
        </p>
      </section>
    </main>
  );
}
