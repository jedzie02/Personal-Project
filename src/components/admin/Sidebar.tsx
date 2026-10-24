"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  LayoutGrid,
  Ticket,
  Users,
  CreditCard,
  CircleDotDashed,
  LogOut,
} from "lucide-react";
import { cn } from "cn";
import { logout } from "@/lib/services/auth.service";
import { supabase } from "@/lib/supabase";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: "MAIN",
    items: [
      {
        title: "Dashboard",
        url: "/admin",
        icon: LayoutDashboard,
      },
      {
        title: "Schedule",
        url: "/admin/schedule",
        icon: Calendar,
      },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      {
        title: "Courts",
        url: "/admin/courts",
        icon: LayoutGrid,
      },
      {
        title: "Bookings",
        url: "/admin/bookings",
        icon: Ticket,
      },
      {
        title: "Customers",
        url: "/admin/customers",
        icon: Users,
      },
    ],
  },
  {
    title: "FINANCE",
    items: [
      {
        title: "Payments",
        url: "/admin/payments",
        icon: CreditCard,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore Supabase sign out error
    }

    try {
      await logout();
    } catch (err) {
      console.warn("Logout error:", err);
    }

    // Clear authentication states
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userPhone");
    document.cookie = "isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

    router.push("/login");
    router.refresh();
  };

  return (
    <aside className="h-screen w-64 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sticky top-0 shrink-0 select-none">
      {/* 1. Header & Logo */}
      <div className="flex h-16 items-center px-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="flex aspect-square size-9 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm">
            <CircleDotDashed className="size-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Pickle Admin
          </span>
        </Link>
      </div>

      {/* 2 & 3. Navigation Groups and Active States */}
      <nav className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-xs font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  item.url === "/admin"
                    ? pathname === "/admin" || pathname.startsWith("/admin/dashboard")
                    : pathname === item.url || pathname.startsWith(`${item.url}/`);

                return (
                  <Link
                    key={item.url}
                    href={item.url}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 font-semibold"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "size-5 shrink-0 transition-colors",
                        isActive
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200"
                      )}
                    />
                    <span>{item.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 4. Log out Button pushed to the absolute bottom */}
      <div className="mt-auto p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <button
          type="button"
          onClick={handleLogout}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300 transition-colors cursor-pointer"
        >
          <LogOut className="size-5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
          <span>Log out</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
