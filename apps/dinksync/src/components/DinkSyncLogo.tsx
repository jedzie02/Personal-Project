import React from "react";

export function DinkSyncLogoMark({
    className = "size-9 rounded-xl",
    svgClassName = "size-5",
}: {
    className?: string;
    svgClassName?: string;
}) {
    return (
        <div
            className={`flex shrink-0 items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-xs ${className}`}
            aria-hidden="true"
        >
            <svg
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className={svgClassName}
            >
                {/* Angled pickleball paddle head */}
                <rect
                    x="8"
                    y="8"
                    width="16"
                    height="19"
                    rx="7"
                    transform="rotate(-18 8 8)"
                    fill="white"
                    fillOpacity="0.96"
                />
                {/* Paddle grip handle */}
                <rect
                    x="16.5"
                    y="25.5"
                    width="4.2"
                    height="8.5"
                    rx="2"
                    transform="rotate(-18 16.5 25.5)"
                    fill="#93c5fd"
                />
                {/* Dink sync trajectory arc */}
                <path
                    d="M14 18C19 10 27 10 31 16"
                    stroke="#34d399"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                />
                {/* Perforated pickleball */}
                <circle cx="30" cy="21" r="6.5" fill="#fbbf24" />
                <circle cx="28.3" cy="19.5" r="1.1" fill="#0f172a" />
                <circle cx="31.8" cy="19.5" r="1.1" fill="#0f172a" />
                <circle cx="30" cy="22.7" r="1.1" fill="#0f172a" />
            </svg>
        </div>
    );
}

export function DinkSyncWordmark({
    suffix,
    className = "font-extrabold tracking-tight text-slate-900 dark:text-white",
}: {
    suffix?: string;
    className?: string;
}) {
    return (
        <span className={className}>
            Dink<span className="text-blue-600 dark:text-blue-400">Sync</span>
            {suffix ? <span className="font-bold"> {suffix}</span> : null}
        </span>
    );
}

