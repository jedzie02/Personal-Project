"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  CircleDotDashed,
  LogOut,
  Calendar,
  MapPin,
  Clock,
  Phone,
  Mail,
  User,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { supabase } from "@/lib/supabase";

interface BookingReservation {
  id: string;
  court: string;
  date: string;
  time: string;
  status: "Confirmed" | "Pending";
}

interface UserProfile {
  isLoggedIn: boolean;
  userId: string | null;
  fullName: string;
  email: string;
  phoneNumber: string;
}

const INITIAL_PROFILE: UserProfile = {
  isLoggedIn: false,
  userId: null,
  fullName: "",
  email: "",
  phoneNumber: "",
};

/**
 * Formats a phone number with the Philippines country code format (+63 9XX XXX XXXX).
 */
function formatPHPhoneNumber(phone: string): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (!digits) return phone;
  if (digits.startsWith("639") && digits.length >= 12) {
    const num = digits.slice(2);
    return `+63 ${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6, 10)}`;
  }
  if (digits.startsWith("09") && digits.length >= 11) {
    const num = digits.slice(1);
    return `+63 ${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6, 10)}`;
  }
  if (digits.startsWith("9") && digits.length >= 10) {
    return `+63 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
  }
  return phone;
}

export function Navbar() {
  // Batched auth profile state eliminates multi-render waterfalls on mount
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);

  // Booking Reservations History: lazy-loaded on dropdown interaction
  const [bookings, setBookings] = useState<BookingReservation[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsLoaded, setBookingsLoaded] = useState(false);

  // Lazy fetch user reservations on demand (only when dropdown is hovered or opened)
  const fetchUserBookings = useCallback(async (userId: string) => {
    if (bookingsLoaded || loadingBookings) return;
    setLoadingBookings(true);
    try {
      const { data: userBookings } = await supabase
        .from("bookings")
        .select("id, booking_date, start_time, end_time, status, courts ( name )")
        .eq("customer_id", userId)
        .order("booking_date", { ascending: true })
        .limit(4);

      if (userBookings && userBookings.length > 0) {
        setBookings(
          (userBookings as unknown as Array<{
            id: string;
            booking_date: string;
            start_time: string;
            status: string;
            courts: { name: string } | { name: string }[] | null;
          }>).map((b) => {
            const courtObj = Array.isArray(b.courts) ? b.courts[0] : b.courts;
            return {
              id: b.id,
              court: courtObj?.name ?? "Court",
              date: b.booking_date,
              time: b.start_time,
              status: b.status === "confirmed" ? ("Confirmed" as const) : ("Pending" as const),
            };
          })
        );
      } else {
        setBookings([]);
      }
      setBookingsLoaded(true);
    } catch (bErr) {
      console.warn("Could not fetch user bookings:", bErr);
    } finally {
      setLoadingBookings(false);
    }
  }, [bookingsLoaded, loadingBookings]);

  // Check persisted authentication state on mount in a single batched pass
  useEffect(() => {
    const checkAuth = async () => {
      const storedAuth =
        localStorage.getItem("isLoggedIn") === "true" ||
        document.cookie.includes("isLoggedIn=true");

      const storedEmail = localStorage.getItem("userEmail") || "";
      const storedName = localStorage.getItem("userName") || "";
      const storedPhone = localStorage.getItem("userPhone") || "";

      if (storedAuth) {
        setProfile((prev) => ({
          ...prev,
          isLoggedIn: true,
          email: storedEmail || prev.email,
          fullName: storedName || prev.fullName,
          phoneNumber: storedPhone ? formatPHPhoneNumber(storedPhone) : prev.phoneNumber,
        }));
      }

      try {
        const { data } = await supabase.auth.getSession();
        const user = data?.session?.user;
        if (user) {
          let name = user.user_metadata?.full_name || user.user_metadata?.name || "";
          let phone = user.user_metadata?.phone || user.phone || "";

          // Fallback: If missing from user_metadata, query profiles table
          if (!name || !phone) {
            try {
              const { data: dbProfile } = await supabase
                .from("profiles")
                .select("full_name, phone")
                .eq("id", user.id)
                .maybeSingle();

              if (dbProfile?.full_name && !name) {
                name = dbProfile.full_name;
              }
              if (dbProfile?.phone && !phone) {
                phone = dbProfile.phone;
              }
            } catch (pErr) {
              console.warn("Could not fetch user profile:", pErr);
            }
          }

          setProfile({
            isLoggedIn: true,
            userId: user.id,
            email: user.email || storedEmail || "",
            fullName: name || storedName || user.email?.split("@")[0] || "Guest",
            phoneNumber: phone ? formatPHPhoneNumber(phone) : storedPhone ? formatPHPhoneNumber(storedPhone) : "",
          });
          return;
        }
      } catch {
        // Ignore session read error
      }

      if (!storedAuth) {
        setProfile(INITIAL_PROFILE);
      }
    };

    checkAuth();
    window.addEventListener("storage", checkAuth);

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user;
      if (user) {
        let name = user.user_metadata?.full_name || user.user_metadata?.name || "";
        let phone = user.user_metadata?.phone || user.phone || "";
        if (!name || !phone) {
          const { data: dbProfile } = await supabase
            .from("profiles")
            .select("full_name, phone")
            .eq("id", user.id)
            .maybeSingle();
          if (dbProfile?.full_name && !name) name = dbProfile.full_name;
          if (dbProfile?.phone && !phone) phone = dbProfile.phone;
        }
        setProfile({
          isLoggedIn: true,
          userId: user.id,
          email: user.email || "",
          fullName: name || user.email?.split("@")[0] || "Guest",
          phoneNumber: phone ? formatPHPhoneNumber(phone) : "",
        });
      } else {
        setProfile(INITIAL_PROFILE);
        setBookings([]);
        setBookingsLoaded(false);
      }
    });

    return () => {
      window.removeEventListener("storage", checkAuth);
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore sign out error
    }

    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userPhone");
    document.cookie = "isLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    setProfile(INITIAL_PROFILE);
    setBookings([]);
    setBookingsLoaded(false);
  };

  // Derive circular initials (memoized)
  const initials = useMemo(() => {
    return (
      (profile.fullName || "Guest")
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "G"
    );
  }, [profile.fullName]);

  return (
    <header className="flex items-center w-full px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Left: Brand */}
      <div className="flex-1 flex justify-start">
        <Link href="/" className="flex items-center gap-2 text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
          <CircleDotDashed className="size-6 sm:size-7 text-blue-600" />
          <span>Paddlix</span>
        </Link>
      </div>

      {/* Center: Navigation Links — hidden on mobile to prevent squeezing */}
      <nav className="hidden sm:flex justify-center gap-6" aria-label="Primary navigation">
        <Link
          href="/"
          className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors"
          aria-label="Home"
        >
          Home
        </Link>
        <Link
          href="#about"
          className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="About Pickleball"
        >
          About
        </Link>
      </nav>

      {/* Right: Profile Avatar or Sign In button */}
      <div className="flex-1 flex justify-end">
        {profile.isLoggedIn ? (
          <DropdownMenu
            onOpenChange={(open) => {
              if (open && profile.userId && !bookingsLoaded) {
                fetchUserBookings(profile.userId);
              }
            }}
          >
            <DropdownMenuTrigger
              aria-label="Open profile menu"
              onMouseEnter={() => {
                if (profile.userId && !bookingsLoaded) {
                  fetchUserBookings(profile.userId);
                }
              }}
              className="outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 rounded-full cursor-pointer transition-transform hover:scale-105"
            >
              <Avatar className="size-10 border-2 border-blue-600/20 hover:border-blue-600 transition-colors shadow-xs">
                <AvatarFallback className="bg-blue-600 text-white font-bold text-sm tracking-wide">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-80 p-0 rounded-2xl border border-gray-200/90 bg-white shadow-xl overflow-hidden divide-y divide-gray-100"
            >
              {/* 1. User Details Header */}
              <div className="p-4 bg-slate-50/70">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold text-sm shadow-2xs">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-gray-900 truncate">
                      {profile.fullName || "Guest"}
                    </p>
                    {profile.email && (
                      <p className="text-xs text-gray-500 truncate mt-0.5 flex items-center gap-1">
                        <Mail className="size-3 text-gray-400 shrink-0" />
                        <span className="truncate">{profile.email}</span>
                      </p>
                    )}
                    {profile.phoneNumber && (
                      <p className="text-xs font-semibold text-blue-600 mt-1 flex items-center gap-1">
                        <Phone className="size-3 text-blue-500 shrink-0" />
                        <span>{profile.phoneNumber}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Booking History ("My Bookings") */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Link
                    href="/bookings"
                    className="text-xs font-bold uppercase tracking-wider text-gray-700 hover:text-blue-600 flex items-center gap-1.5 transition-colors group"
                  >
                    <Calendar className="size-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                    <span>My Bookings</span>
                    <ChevronRight className="size-3 text-gray-400 group-hover:text-blue-600 transition-colors" />
                  </Link>
                  <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                    {bookings.length} upcoming
                  </span>
                </div>

                <div className="space-y-2">
                  {loadingBookings && !bookingsLoaded ? (
                    <div className="py-4 text-center rounded-xl bg-gray-50/60 border border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-500">
                      <Loader2 className="size-3.5 animate-spin text-blue-600" />
                      <span>Loading reservations...</span>
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="py-3 px-2 text-center rounded-xl bg-gray-50 border border-gray-100">
                      <p className="text-xs text-gray-500 font-medium">No active bookings yet.</p>
                      <a href="#book-a-court" className="text-xs text-blue-600 hover:underline mt-1 inline-block font-semibold">
                        Reserve a court →
                      </a>
                    </div>
                  ) : (
                    bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="p-2.5 rounded-xl border border-gray-100 bg-gray-50/80 hover:bg-gray-100/70 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-gray-900 flex items-center gap-1">
                            <MapPin className="size-3 text-blue-500" />
                            {booking.court}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <Clock className="size-3 text-gray-400" />
                            <span>{booking.date} - {booking.time}</span>
                          </p>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          {booking.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 3. Prominent Logout Action */}
              <div className="p-2.5 bg-gray-50/50">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-red-600 hover:text-white hover:bg-red-600 rounded-xl transition-all duration-200 cursor-pointer shadow-2xs group"
                >
                  <LogOut className="size-3.5 group-hover:-translate-x-0.5 transition-transform" />
                  <span>Log out</span>
                </button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-1 sm:gap-2">
            <Link href="/auth/login">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm font-medium text-gray-700 hover:text-blue-600 px-2 sm:px-3">
                Sign in
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700 rounded-full px-3 sm:px-4 text-xs font-semibold shadow-xs">
                Sign up
              </Button>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

export default Navbar;
