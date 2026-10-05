import { getAllCourts } from "@/lib/services/court.service";
import { createCourtAction } from "@/app/admin/courts/actions";
import { CourtsTable } from "@/components/ui/admin/courtstable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function AdminCourtsPage({
    searchParams,
}: {
    searchParams: Promise<{ error?: string; warnCourtId?: string; warnCount?: string }>;
}) {
    const params = await searchParams;

    // Server Components can just `await` a service function directly —
    // no useEffect, no loading state needed, because this whole
    // component renders on the server before anything is sent to the
    // browser. The data is already there by the time the HTML exists.
    const courts = await getAllCourts();

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-2xl font-semibold">Courts</h1>
                <p className="text-muted-foreground">
                    Add and manage the venue&apos;s courts.
                </p>
            </div>

            {params.error && (
                <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                    {params.error}
                </p>
            )}

            {params.warnCourtId && (
                <p className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
                    This court has {params.warnCount} upcoming booking
                    {params.warnCount === "1" ? "" : "s"}. Deactivating it will NOT
                    cancel those bookings — they&apos;ll still show up as scheduled.
                    Find it below and click &quot;Confirm deactivate anyway&quot; if
                    you&apos;re sure.
                </p>
            )}

            <form
                action={createCourtAction}
                className="flex max-w-md flex-col gap-4 rounded-lg border p-4"
            >
                <h2 className="font-medium">Add a court</h2>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" placeholder="Court 1" required />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                        id="description"
                        name="description"
                        placeholder="Indoor, near the entrance"
                        className="min-h-20 rounded-md border px-3 py-2 text-sm"
                    />
                </div>
                <Button type="submit" className="self-start">
                    Add court
                </Button>
            </form>

            <CourtsTable courts={courts} warnCourtId={params.warnCourtId} />
        </div>
    );
}