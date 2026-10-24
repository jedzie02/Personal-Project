import Link from "next/link";
import { notFound } from "next/navigation";
import { getCourtById } from "@/lib/services/court.service";
import { updateCourtAction } from "@/app/admin/courts/actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default async function EditCourtPage({
    params,
    searchParams,
}: {
    params: Promise<{ id: string }>;
    searchParams: Promise<{ error?: string }>;
}) {
    const { id } = await params;
    const { error } = await searchParams;

    const court = await getCourtById(id);

    // If someone navigates to an invalid court id, show a 404
    if (!court) {
        notFound();
    }

    const updateThisCourt = updateCourtAction.bind(null, court.id);

    return (
        <div className="max-w-xl space-y-6">
            <div>
                <Link
                    href="/admin/courts"
                    className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-2"
                >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    Back to courts
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">Edit court details</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Update display name and location notes for {court.name}.
                </p>
            </div>

            {error && (
                <div className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-medium">Unable to update court</p>
                        <p className="text-xs text-red-700 mt-0.5">{error}</p>
                    </div>
                </div>
            )}

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">Court information</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={updateThisCourt} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="court-name">Court name</Label>
                            <Input
                                id="court-name"
                                name="name"
                                defaultValue={court.name}
                                placeholder="e.g., Court 3"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="court-description">Location / notes (optional)</Label>
                            <textarea
                                id="court-description"
                                name="description"
                                defaultValue={court.description ?? ""}
                                placeholder="e.g., Near entrance, tournament lighting"
                                rows={3}
                                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            />
                            <p className="text-xs text-muted-foreground">
                                Optional notes visible to players when selecting courts during reservation.
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                            <Link
                                href="/admin/courts"
                                className={buttonVariants({ variant: "outline" })}
                            >
                                Cancel
                            </Link>
                            <Button type="submit">
                                Save changes
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}