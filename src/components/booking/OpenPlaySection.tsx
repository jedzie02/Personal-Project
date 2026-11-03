import { Users, Calendar, Clock } from "lucide-react";
import type { OpenPlaySessionView } from "@/lib/services/open-play.service";
import { formatTime } from "@/lib/utils/date";
import JoinOpenPlayButton from "./JoinOpenPlayButton";

export default function OpenPlaySection({
    sessions,
}: {
    sessions: OpenPlaySessionView[];
}) {
    const hasSessions = sessions && sessions.length > 0;

    return (
        <section
            id="open-play"
            className="py-16 px-4 sm:px-6 lg:px-8 border-t border-slate-200/70 dark:border-slate-800/80 bg-white dark:bg-slate-950"
            aria-labelledby="open-play-heading"
        >
            <div className="mx-auto max-w-5xl">
                <div className="text-center mb-10 space-y-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/70 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                        <Users className="size-3.5" />
                        Open Play Sessions
                    </span>
                    <h2
                        id="open-play-heading"
                        className="text-2xl font-extrabold tracking-tight sm:text-3xl text-slate-900 dark:text-white"
                    >
                        Playing solo or in a pair? Join Open Play
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
                        Reserve your individual spot online by card and rotate games with fellow players. Paying online locks your spot immediately.
                    </p>
                </div>

                {!hasSessions ? (
                    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/50 p-8 text-center shadow-2xs">
                        <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
                            <Users className="size-5" />
                        </div>
                        <p className="text-base font-bold text-slate-900 dark:text-white">
                            No Open Play sessions scheduled yet
                        </p>
                        <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                            Check back soon for upcoming community Open Play blocks, or book a private court below.
                        </p>
                    </div>
                ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sessions.map((session) => {
                        const isFull = session.spotsLeft <= 0;
                        const isLowSpots = session.spotsLeft > 0 && session.spotsLeft <= 2;

                        const badgeClasses = isFull
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                            : isLowSpots
                            ? "bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                            : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";

                        return (
                            <div
                                key={session.id}
                                className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/70 p-5 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                                            {session.courtName}
                                        </span>
                                        <span
                                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums ${badgeClasses}`}
                                        >
                                            {isFull
                                                ? "Full"
                                                : `${session.spotsLeft} of ${session.playerCap} spots left`}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                                        <div className="flex items-center gap-2 tabular-nums">
                                            <Calendar className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                            <span className="font-semibold">{session.date}</span>
                                        </div>
                                        <div className="flex items-center gap-2 tabular-nums">
                                            <Clock className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                            <span>
                                                {formatTime(session.startTime)} – {formatTime(session.endTime)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
                                    <div className="flex items-baseline justify-between">
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                            Entry Fee
                                        </span>
                                        <span className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
                                            ₱{session.pricePerPlayer}
                                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                /player
                                            </span>
                                        </span>
                                    </div>

                                    <JoinOpenPlayButton
                                        sessionId={session.id}
                                        spotsLeft={session.spotsLeft}
                                        pricePerPlayer={session.pricePerPlayer}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
                )}
            </div>
        </section>
    );
}

