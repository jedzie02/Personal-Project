import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/services/auth.server";
import { AppSidebar } from "@/components/ui/admin/app-sidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

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
        <SidebarProvider>
            <AppSidebar />
            <div className="flex min-h-screen w-full flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6 lg:h-[60px]">
                    <SidebarTrigger />
                    <div className="w-full flex-1">
                        {/* Empty space for search or breadcrumbs later */}
                    </div>
                </header>
                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </SidebarProvider>
    );
}