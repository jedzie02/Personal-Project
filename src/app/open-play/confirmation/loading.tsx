export default function OpenPlayConfirmationLoading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
            <div className="max-w-lg w-full rounded-2xl border border-slate-800 bg-slate-900 p-8 space-y-4 animate-pulse">
                <div className="mx-auto size-12 rounded-full bg-slate-800" />
                <div className="mx-auto h-6 w-48 rounded bg-slate-800" />
                <div className="h-32 w-full rounded-xl bg-slate-800/60" />
            </div>
        </div>
    );
}

