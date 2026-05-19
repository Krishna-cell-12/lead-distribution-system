import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-slate-950 text-slate-100 overflow-hidden font-sans select-none">
      
      {/* Background Decorative Ambient Gradients */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Glow at the top center */}
        <div className="absolute top-[-10%] left-[25%] right-[25%] h-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
        {/* Glow at the bottom center */}
        <div className="absolute bottom-[-10%] left-[30%] right-[30%] h-[400px] rounded-full bg-indigo-500/10 blur-[100px]" />
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] opacity-35" />
      </div>

      {/* Header/Navbar */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 font-bold text-lg text-white">
            L
          </div>
          <span className="font-semibold text-lg tracking-tight bg-gradient-to-r from-slate-100 to-slate-300 bg-clip-text text-transparent">
            LeadEngine
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Vercel Ready
          </span>
        </div>
      </header>

      {/* Main Hero & Content Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto px-6 py-12 md:py-20 text-center">
        
        {/* Animated Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 tracking-wide uppercase mb-8 hover:border-blue-500/30 transition-all cursor-default">
          <span className="text-blue-400">⚡</span> Enterprise Lead Management Protocol
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Lead Distribution System
        </h1>

        {/* Hero Subtitle */}
        <p className="max-w-3xl text-base sm:text-lg md:text-xl leading-relaxed text-slate-400 mb-10 font-normal">
          An enterprise-grade backend featuring idempotent webhook processing, row-level concurrency locking, and automated round-robin lead routing.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 w-full max-w-md sm:max-w-none">
          <Link
            href="/test-tools"
            className="flex items-center justify-center gap-2 w-full sm:w-auto h-12 px-8 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            🚀 Open Testing Panel
          </Link>
          <Link
            href="/dashboard?providerId=1"
            className="flex items-center justify-center gap-2 w-full sm:w-auto h-12 px-8 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm font-semibold text-slate-200 border border-slate-800 hover:border-slate-700 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
          >
            📊 View Provider Dashboard
          </Link>
        </div>

        {/* Core Architecture Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full">
          {/* Card 1: Concurrency Control */}
          <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-900 hover:border-slate-800 transition-all duration-300 group hover:shadow-xl hover:shadow-blue-500/5">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-semibold mb-4 border border-blue-500/20 group-hover:scale-110 transition-transform">
              🔐
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Concurrency Control</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Uses high-integrity PostgreSQL database transactions and row-level locking to guarantee atomic lead assignment without double-dispatch risks.
            </p>
          </div>

          {/* Card 2: Idempotent Webhooks */}
          <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-900 hover:border-slate-800 transition-all duration-300 group hover:shadow-xl hover:shadow-indigo-500/5">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-semibold mb-4 border border-indigo-500/20 group-hover:scale-110 transition-transform">
              🛡️
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Idempotent Webhooks</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Utilizes strict idempotency tracking models to instantly catch duplicate server payloads, maintaining reliability under complex network retries.
            </p>
          </div>

          {/* Card 3: Automated Distribution */}
          <div className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-slate-900 hover:border-slate-800 transition-all duration-300 group hover:shadow-xl hover:shadow-purple-500/5">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 font-semibold mb-4 border border-purple-500/20 group-hover:scale-110 transition-transform">
              ⚡
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">Automated Distribution</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Runs real-time round-robin algorithms that match customer leads with the most qualified providers based on monthly capacity and quotas.
            </p>
          </div>
        </div>

      </main>

      {/* Footer Stack Tags */}
      <footer className="relative z-10 w-full border-t border-slate-900 py-6 text-center text-xs text-slate-500">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mb-2">
          <span>Next.js 16 (App Router)</span>
          <span className="text-slate-700">•</span>
          <span>Prisma ORM</span>
          <span className="text-slate-700">•</span>
          <span>Neon PostgreSQL</span>
          <span className="text-slate-700">•</span>
          <span>Tailwind CSS v4</span>
        </div>
        <div>
          © {new Date().getFullYear()} Lead Distribution System. Fully optimized for production serverless builds.
        </div>
      </footer>
    </div>
  );
}
