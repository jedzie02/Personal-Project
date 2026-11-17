import { Navbar } from "@/components/Navbar";

export default function OpenPlayPaymentLoading() {
    return (
        <div className="min-h-screen flex flex-col bg-slate-50/50 dark:bg-slate-950">
            <Navbar />
            <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
                <div className="w-full max-w-md space-y-4">
                    <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
                    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-6">
                        <div className="flex flex-col items-center space-y-3">
                            <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
                            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-md animate-pulse" />
                            <div className="h-4 w-64 bg-slate-100 dark:bg-slate-800 rounded-md animate-pulse" />
                        </div>
                        <div className="flex flex-col items-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-4">
                            <div className="size-52 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                            <div className="h-8 w-32 bg-slate-200 dark:bg-slate-700 rounded-md animate-pulse" />
                            <div className="h-10 w-full bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
                        </div>
                        <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
                    </div>
                </div>
            </main>
        </div>
    );
}
