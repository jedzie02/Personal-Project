import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function NewBookingLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-4 w-32 rounded-md bg-slate-200 dark:bg-slate-800 mb-2" />
          <Skeleton className="h-8 w-64 rounded-lg bg-slate-200 dark:bg-slate-800" />
          <Skeleton className="h-4 w-80 max-w-full mt-1.5 rounded-md bg-slate-100 dark:bg-slate-900" />
        </div>
        <Skeleton className="h-8 w-28 rounded-full bg-slate-100 dark:bg-slate-900" />
      </div>

      {/* 2-column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Form Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Court & Schedule */}
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <Skeleton className="h-5 w-44 bg-slate-200 dark:bg-slate-800" />
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 bg-slate-200 dark:bg-slate-800" />
                <Skeleton className="h-10 w-full rounded-xl bg-slate-100 dark:bg-slate-800" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-slate-800" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800" />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <Skeleton className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
                <Skeleton className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Player Details */}
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <Skeleton className="h-5 w-36 bg-slate-200 dark:bg-slate-800" />
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <Skeleton className="h-10 w-60 rounded-xl bg-slate-100 dark:bg-slate-800" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Skeleton className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
                <Skeleton className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Payment Settlement */}
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
              <Skeleton className="h-5 w-48 bg-slate-200 dark:bg-slate-800" />
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Summary Skeleton */}
        <div className="space-y-4">
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md">
            <div className="p-4 bg-emerald-600 rounded-t-2xl">
              <Skeleton className="h-5 w-36 bg-emerald-500" />
            </div>
            <CardContent className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                  <Skeleton className="h-4 w-16 bg-slate-100 dark:bg-slate-800" />
                  <Skeleton className="h-4 w-28 bg-slate-200 dark:bg-slate-700" />
                </div>
              ))}
              <div className="pt-2 flex justify-between">
                <Skeleton className="h-6 w-20 bg-slate-200 dark:bg-slate-700" />
                <Skeleton className="h-7 w-24 bg-slate-300 dark:bg-slate-600" />
              </div>
              <Skeleton className="h-11 w-full rounded-xl bg-emerald-600/40 mt-3" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
