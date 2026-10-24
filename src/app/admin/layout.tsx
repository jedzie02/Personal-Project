import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/services/auth.server";
import { Sidebar } from "@/components/admin/Sidebar";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const profile = await getCurrentProfile();

    if (!profile) {
        redirect("/auth/login?redirectTo=/admin");
    }

    if (profile.role !== "admin") {
        redirect("/");
    }

    return (
        <div className="flex min-h-screen w-full bg-slate-50/50 dark:bg-slate-950">
            <Sidebar />
            <div className="flex min-h-screen flex-1 flex-col min-w-0">
                <main className="flex-1 p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}