import { redirect } from "next/navigation";

export default async function BookPage({
    searchParams,
}: {
    searchParams?: Promise<{ date?: string; error?: string }>;
}) {
    const params = searchParams ? await searchParams : {};
    const query = new URLSearchParams();
    if (params?.date) query.set("date", params.date);
    if (params?.error) query.set("error", params.error);
    const queryString = query.toString() ? `?${query.toString()}` : "";

    redirect(`/${queryString}#book-a-court`);
}