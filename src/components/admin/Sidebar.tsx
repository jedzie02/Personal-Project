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
  Settings,
  CircleDotDashed,
  LogOut,
  Menu,
  X,
  Plus,
  ExternalLink,
} from "lucide-react";
import { cn } from "cn";
import { logout } from "@/lib/services/auth.service";
import { supabase } from "@/lib/supabase";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

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
      {
        title: "Settings",
        url: "/admin/settings",
        icon: Settings,
      },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Lock body scroll and listen for Escape key when mobile drawer is open
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleLogout = async () => {
    const confirmed = window.confirm("Are you sure you want to log out of Paddlix Admin?");
    if (!confirmed) return;

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

    router.push("/auth/login");
    router.refresh();
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex aspect-square size-7 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs">
              <CircleDotDashed className="size-4" />
            </div>
            <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">Paddlix Admin</span>
          </Link>
        </div>
        <ThemeToggle />
      </div>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        role={open ? "dialog" : undefined}
        aria-modal={open ? "true" : undefined}
        aria-label="Admin Navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-50 h-screen w-64 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 select-none transition-transform duration-200",
          "md:sticky md:top-0 md:translate-x-0 md:shrink-0",
          open ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* 1. Header & Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <Link href="/admin" className="flex items-center gap-3" onClick={() => setOpen(false)}>
            <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <CircleDotDashed className="size-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Paddlix Admin
            </span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Quick Action: New Walk-in Booking */}
        <div className="p-3 pb-1 shrink-0">
          <Link
            href="/admin/bookings/new"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs tracking-wide shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <Plus className="size-4" />
            <span>+ Walk-in Booking</span>
          </Link>
        </div>

        {/* 2 & 3. Navigation Groups and Active States */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5" aria-label="Admin Sections">
          {navSections.map((section) => (
            <div key={section.title}>
              <p className="px-3 mb-1.5 text-xs font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
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
                      onClick={() => setOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all select-none min-h-[44px]",
                        isActive
                          ? "bg-emerald-50 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300 font-semibold shadow-2xs"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-slate-100 font-medium"
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

        {/* Bottom Section: Player Grid Link, Theme Toggle & Confirmed Logout */}
        <div className="mt-auto p-3 border-t border-slate-200 dark:border-slate-800 shrink-0 space-y-2">
          <Link
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <span>View Player Grid</span>
            <ExternalLink className="size-3.5 text-slate-400" />
          </Link>

          <div className="flex items-center justify-between px-3 py-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Appearance</span>
            <ThemeToggle />
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/40 dark:hover:text-red-300 transition-colors cursor-pointer"
          >
            <LogOut className="size-5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
            <span>Log out</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
