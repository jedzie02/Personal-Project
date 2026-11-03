export default function HeroCourtRally() {
    return (
        <div
            className="animate-hero-rise mx-auto w-full max-w-md rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 p-3.5 sm:p-4 shadow-xs"
            style={{ animationDelay: "280ms" }}
        >
            <svg
                viewBox="0 0 260 104"
                aria-hidden="true"
                className="w-full max-w-[280px] sm:max-w-[320px] h-auto mx-auto rounded-xl border-2 border-blue-600/80 dark:border-blue-500/80 bg-blue-950 shadow-sm"
            >
                <rect x="14" y="12" width="232" height="80" rx="3" fill="#1d4ed8" stroke="#93c5fd" strokeWidth="2" className="animate-court-line" />
                <rect x="96" y="12" width="68" height="80" fill="#1e3a8a" stroke="#93c5fd" strokeWidth="1.5" />
                <line x1="14" y1="52" x2="96" y2="52" stroke="#93c5fd" strokeWidth="1.5" />
                <line x1="164" y1="52" x2="246" y2="52" stroke="#93c5fd" strokeWidth="1.5" />
                <line x1="130" y1="6" x2="130" y2="98" stroke="#ffffff" strokeWidth="3" strokeDasharray="4 2" />
                <circle cx="35" cy="38" r="6" fill="none" stroke="#fde047" strokeWidth="1.5" className="animate-bounce-ring" />
                <circle cx="225" cy="64" r="6" fill="none" stroke="#fde047" strokeWidth="1.5" className="animate-bounce-ring-delayed" />
                <g className="animate-pickleball-rally">
                    <circle cx="0" cy="0" r="6" fill="#facc15" stroke="#fef08a" strokeWidth="2" />
                    <circle cx="-2" cy="-1" r="1" fill="#ca8a04" />
                    <circle cx="2" cy="1" r="1" fill="#ca8a04" />
                </g>
            </svg>
            <p className="mt-3 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                4 Tournament-Spec Master Courts · Open Daily 9:00 AM – 11:00 PM
            </p>
        </div>
    );
}

