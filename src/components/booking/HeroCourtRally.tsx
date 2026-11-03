export default function HeroCourtRally({ className = "" }: { className?: string }) {
    return (
        <div
            className={`animate-hero-rise mx-auto w-full max-w-lg lg:max-w-xl rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 p-5 sm:p-6 lg:p-7 shadow-xl ring-1 ring-slate-900/5 dark:ring-white/10 ${className}`}
            style={{ animationDelay: "280ms" }}
        >
            <div className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                    <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Court Simulator</span>
                </div>
                <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 px-2.5 py-0.5 rounded-full">
                    Tournament Spec
                </span>
            </div>

            <svg
                viewBox="0 0 260 144"
                aria-hidden="true"
                className="w-full max-w-[360px] sm:max-w-[440px] lg:max-w-[490px] h-auto mx-auto rounded-2xl border-2 border-blue-500/80 bg-blue-950 shadow-md"
            >
                <rect x="14" y="14" width="232" height="116" rx="5" fill="#1d4ed8" stroke="#93c5fd" strokeWidth="2" className="animate-court-line" />
                <rect x="96" y="14" width="68" height="116" fill="#1e3a8a" stroke="#93c5fd" strokeWidth="1.5" />
                <line x1="14" y1="72" x2="96" y2="72" stroke="#93c5fd" strokeWidth="1.5" />
                <line x1="164" y1="72" x2="246" y2="72" stroke="#93c5fd" strokeWidth="1.5" />
                <line x1="130" y1="6" x2="130" y2="138" stroke="#ffffff" strokeWidth="3" strokeDasharray="4 2" />
                <circle cx="38" cy="46" r="7" fill="none" stroke="#fde047" strokeWidth="1.5" className="animate-bounce-ring" />
                <circle cx="222" cy="98" r="7" fill="none" stroke="#fde047" strokeWidth="1.5" className="animate-bounce-ring-delayed" />
                <g className="animate-pickleball-rally">
                    <circle cx="0" cy="0" r="6.5" fill="#facc15" stroke="#fef08a" strokeWidth="2" />
                    <circle cx="-2" cy="-1" r="1.1" fill="#ca8a04" />
                    <circle cx="2" cy="1" r="1.1" fill="#ca8a04" />
                </g>
            </svg>

            <div className="mt-4 flex items-center justify-center gap-2 text-center text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>4 Tournament-Spec Master Courts · Open Daily 9:00 AM – 11:00 PM</span>
            </div>
        </div>
    );
}

