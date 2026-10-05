/**
 * loading.tsx is a Next.js file convention, not something we import
 * anywhere — placing this file in the same folder as book/page.tsx
 * automatically wraps that page in a React Suspense boundary. While
 * BookPage is still awaiting data on the server, Next.js streams
 * THIS component to the browser immediately. Once the real data is
 * ready, this gets swapped out for the actual page content.
 */
export default function BookLoading() {
    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <div className="max-w-6xl mx-auto px-4 pt-6 pb-4">
                {/* Title skeleton */}
                <div className="flex items-center justify-between mb-6">
                    <div className="h-7 w-40 animate-pulse rounded bg-white/10" />
                    <div className="h-5 w-28 animate-pulse rounded bg-white/5" />
                </div>

                {/* Date selector skeleton */}
                <div className="flex items-center gap-1.5 pb-2">
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                        <div
                            key={i}
                            className="min-w-[72px] h-[68px] animate-pulse rounded-xl bg-white/5"
                        />
                    ))}
                </div>
            </div>

            {/* Grid skeleton */}
            <div className="max-w-6xl mx-auto px-4 pb-10">
                <div className="rounded-xl border border-white/10 bg-gray-950/60 p-4">
                    {/* Header row */}
                    <div className="flex gap-2 mb-4">
                        <div className="w-[72px]" />
                        <div className="flex-1 h-8 animate-pulse rounded bg-white/5" />
                        <div className="flex-1 h-8 animate-pulse rounded bg-white/5" />
                        <div className="flex-1 h-8 animate-pulse rounded bg-white/5" />
                    </div>
                    {/* Row skeletons */}
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="flex gap-2 mb-2">
                            <div className="w-[72px] h-12 animate-pulse rounded bg-white/5" />
                            <div className="flex-1 h-12 animate-pulse rounded bg-white/[0.03]" />
                            <div className="flex-1 h-12 animate-pulse rounded bg-white/[0.03]" />
                            <div className="flex-1 h-12 animate-pulse rounded bg-white/[0.03]" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}