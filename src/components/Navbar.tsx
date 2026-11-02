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
  XCircle,
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
import { ThemeToggle } from "@/components/ThemeToggle";

import { supabase } from "@/lib/supabase";
import { cancelOwnBookingClientAction } from "@/app/bookings/actions";

interface BookingReservation {
  id: string;
  court: string;
  date: string;
  time: string;
  status: "Confirmed" | "Pending" | "Cancelled";
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

  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);

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
              status: b.status === "confirmed" ? ("Confirmed" as const) : b.status === "cancelled" ? ("Cancelled" as const) : ("Pending" as const),
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

  const handleCancelBooking = async (bookingId: string) => {
    const confirmed = window.confirm("Are you sure you want to cancel this booking? If you change your mind, you can re-book any open court.");
    if (!confirmed) return;

    setCancellingBookingId(bookingId);
    try {
      const res = await cancelOwnBookingClientAction(bookingId, "Customer changed mind");
      if (res.success) {
        setBookings((prev) =>
          prev.map((b) => (b.id === bookingId ? { ...b, status: "Cancelled" as const } : b))
        );
      } else {
        alert(res.error || "Unable to cancel reservation");
      }
    } catch (err: any) {
      alert(err?.message || "Failed to cancel reservation");
    } finally {
      setCancellingBookingId(null);
    }
  };

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
    <header className="flex items-center w-full px-4 sm:px-6 py-3 bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-50 transition-colors">
      {/* Left: Brand */}
      <div className="flex-1 flex justify-start">
        <Link href="/" className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-foreground group">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-2xs group-hover:scale-105 transition-transform relative">
            <CircleDotDashed className="size-5" />
            <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-accent-court ring-2 ring-background" />
          </div>
          <span className="font-extrabold tracking-tight">Paddlix</span>
        </Link>
      </div>

      {/* Center: Navigation Links */}
      <nav className="hidden sm:flex items-center gap-1 bg-muted p-1 rounded-full border border-border" aria-label="Primary navigation">
        <Link
          href="/"
          className="text-xs font-semibold px-4 py-1.5 rounded-full text-foreground bg-card shadow-2xs transition-all"
          aria-label="Home"
        >
          Home
        </Link>
        <Link
          href="#book-a-court"
          className="text-xs font-medium px-4 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-card/60 transition-all"
          aria-label="Book a Court"
        >
          Book Court
        </Link>
        <Link
          href="#about"
          className="text-xs font-medium px-4 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-card/60 transition-all"
          aria-label="About Pickleball"
        >
          About
        </Link>
      </nav>

      {/* Right: Theme Toggle + Profile Avatar or Sign In button */}
      <div className="flex-1 flex items-center justify-end gap-2 sm:gap-2.5">
        <ThemeToggle />

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
              className="outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-full cursor-pointer transition-transform hover:scale-105"
            >
              <Avatar className="size-10 border border-border hover:border-foreground transition-colors shadow-xs">
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-sm tracking-wide">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-80 p-0 rounded-2xl border border-border bg-card shadow-xl overflow-hidden divide-y divide-border"
            >
              {/* 1. User Details Header */}
              <div className="p-4 bg-muted/40">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-2xs">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-foreground truncate">
                      {profile.fullName || "Guest"}
                    </p>
                    {profile.email && (
                      <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                        <Mail className="size-3 text-muted-foreground shrink-0" />
                        <span className="truncate">{profile.email}</span>
                      </p>
                    )}
                    {profile.phoneNumber && (
                      <p className="text-xs font-semibold text-foreground mt-1 flex items-center gap-1">
                        <Phone className="size-3 text-muted-foreground shrink-0" />
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
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground flex items-center gap-1.5 transition-colors group"
                  >
                    <Calendar className="size-3.5 text-foreground group-hover:scale-110 transition-transform" />
                    <span>My Bookings</span>
                    <ChevronRight className="size-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </Link>
                  <span className="text-xs font-semibold bg-muted text-foreground px-2 py-0.5 rounded-full border border-border">
                    {bookings.length} upcoming
                  </span>
                </div>

                <div className="space-y-2">
                  {loadingBookings && !bookingsLoaded ? (
                    <div className="py-4 text-center rounded-xl bg-muted/30 border border-border flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="size-3.5 animate-spin text-foreground" />
                      <span>Loading reservations...</span>
                    </div>
                  ) : bookings.length === 0 ? (
                    <div className="py-3 px-2 text-center rounded-xl bg-muted/30 border border-border">
                      <p className="text-xs text-muted-foreground font-medium">No active bookings yet.</p>
                      <a href="#book-a-court" className="text-xs text-foreground hover:underline mt-1 inline-block font-semibold">
                        Reserve a court →
                      </a>
                    </div>
                  ) : (
                    bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="p-2.5 rounded-xl border border-border bg-muted/20 hover:bg-muted/40 transition-colors flex flex-col gap-2"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-foreground flex items-center gap-1">
                              <MapPin className="size-3 text-muted-foreground" />
                              {booking.court}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              <Clock className="size-3 text-muted-foreground" />
                              <span>{booking.date} · {booking.time}</span>
                            </p>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                              booking.status === "Confirmed"
                                ? "bg-accent-court/10 text-foreground border-accent-court/30 font-semibold"
                                : booking.status === "Cancelled"
                                ? "bg-destructive/10 text-destructive border-destructive/20"
                                : "bg-warning/10 text-warning border-warning/20"
                            }`}
                          >
                            {booking.status}
                          </span>
                        </div>

                        {booking.status !== "Cancelled" && (
                          <div className="flex items-center justify-between pt-1.5 border-t border-border text-[11px]">
                            <span className="text-muted-foreground">Changed your mind?</span>
                            <button
                              type="button"
                              disabled={cancellingBookingId === booking.id}
                              onClick={() => handleCancelBooking(booking.id)}
                              className="text-destructive hover:underline font-semibold cursor-pointer flex items-center gap-1 disabled:opacity-50"
                            >
                              {cancellingBookingId === booking.id ? (
                                <>
                                  <Loader2 className="size-3 animate-spin" /> Cancelling…
                                </>
                              ) : (
                                <>
                                  <XCircle className="size-3" /> Cancel
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 3. Prominent Logout Action */}
              <div className="p-2.5 bg-muted/20">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-semibold text-destructive hover:text-white hover:bg-destructive rounded-xl transition-all duration-200 cursor-pointer shadow-2xs group"
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
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground px-3 rounded-full">
                Sign in
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer">
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
