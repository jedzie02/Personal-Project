import { notFound } from "next/navigation";
import { getCourtById } from "@/lib/services/court.service";
import { updateCourtAction } from "@/app/admin/courts/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

    // If someone navigates to /admin/courts/some-fake-id/edit, show a
    // real 404 instead of a broken form with empty fields.
    if (!court) {
        notFound();
    }

    // updateCourtAction expects (courtId, formData) — but a <form action>
    // can only pass formData. .bind() locks in courtId as the first
    // argument ahead of time, producing a function shaped the way
    // <form action> expects: (formData) => void.
    const updateThisCourt = updateCourtAction.bind(null, court.id);

    return (
        <div className="max-w-md">
            <h1 className="text-2xl font-semibold">Edit {court.name}</h1>

            {error && (
                <p className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            <form action={updateThisCourt} className="mt-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" defaultValue={court.name} required />
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="description">Description</Label>
                    <textarea
                        id="description"
                        name="description"
                        defaultValue={court.description ?? ""}
                        className="min-h-20 rounded-md border px-3 py-2 text-sm"
                    />
                </div>
                <Button type="submit" className="self-start">
                    Save changes
                </Button>
            </form>
        </div>
    );
}