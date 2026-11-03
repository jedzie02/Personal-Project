"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CircleDashedIcon, CircleDotDashed, Crosshair, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { supabase } from "@/lib/supabase"
import { ThemeToggle } from "@/components/ThemeToggle"
import { DinkSyncLogoMark, DinkSyncWordmark } from "@/components/DinkSyncLogo"

function LoginContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const justRegistered = searchParams.get("registered") === "true"
    const justConfirmed = searchParams.get("confirmed") === "true"
    const queryError = searchParams.get("error")

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault()
        setError(null)
        setLoading(true)

        try {
            // 1. Authenticate with Supabase Auth
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            // 2. Strict Error Handling: block incorrect passwords and halt execution immediately
            if (authError || !data.user) {
                console.error("Supabase Auth Error:", authError);
                setError(authError?.message || "Invalid email or password. Please verify your credentials and try again.")
                setLoading(false)
                return
            }

            // 3. Success State: only update login state and redirect when data.user is present
            localStorage.setItem("isLoggedIn", "true")
            if (data.user.email) {
                localStorage.setItem("userEmail", data.user.email)
            }
            const fullName =
                data.user.user_metadata?.full_name ||
                data.user.user_metadata?.name
            if (fullName) {
                localStorage.setItem("userName", fullName)
            }
            const phone =
                data.user.user_metadata?.phone ||
                data.user.phone
            if (phone) {
                localStorage.setItem("userPhone", phone)
            }
            document.cookie = "isLoggedIn=true; path=/"

            // Role-based routing: fetch role from profiles table in Supabase
            let userRole = data.user.user_metadata?.role

            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", data.user.id)
                .maybeSingle()

            if (profile?.role) {
                userRole = profile.role
            } else if (data.user.email) {
                const { data: profileByEmail } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("email", data.user.email)
                    .maybeSingle()
                if (profileByEmail?.role) {
                    userRole = profileByEmail.role
                }
            }

            // Fallback for admin email if role not explicitly in profiles row
            if (!userRole && data.user.email?.toLowerCase().includes("admin")) {
                userRole = "admin"
            }

            // Ensure profile exists in Supabase for all users (customers and admins)
            try {
                const { data: existing } = await supabase
                    .from("profiles")
                    .select("id")
                    .eq("id", data.user.id)
                    .maybeSingle();

                if (!existing) {
                    await supabase.from("profiles").insert({
                        id: data.user.id,
                        email: data.user.email,
                        full_name: fullName || data.user.email?.split("@")[0] || (userRole === "admin" ? "Admin" : "Customer"),
                        phone: phone || null,
                        role: userRole || "customer",
                    });
                }
            } catch {
                // Ignore client RLS permission limitations
            }

            if (userRole === "admin") {
                window.location.href = "/admin/dashboard"
            } else {
                window.location.href = "/"
            }
        } catch (err: unknown) {
            const message =
                err instanceof Error
                    ? err.message
                    : "An unexpected error occurred during login. Please try again."
            setError(message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center px-4 bg-background">
            {/* Home link & Theme Toggle */}
            <Link
                href="/"
                className="absolute top-5 left-6 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                aria-label="Back to Home"
            >
                ← Home
            </Link>
            <div className="absolute top-5 right-6">
                <ThemeToggle />
            </div>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 mb-8 group" aria-label="DinkSync Home">
                <DinkSyncLogoMark className="size-10 rounded-xl group-hover:scale-105 transition-transform" svgClassName="size-6" />
                <DinkSyncWordmark className="font-extrabold text-xl tracking-tight text-foreground" />
            </Link>
            <Card className="w-full max-w-sm shadow-lg border">
                <CardHeader className="text-center pb-4">
                    <CardTitle className="text-2xl font-bold tracking-tight">Welcome Back</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Sign in to your account to reserve courts and manage bookings
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoComplete="email"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    autoComplete="current-password"
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    tabIndex={-1}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                        </div>
                        {justConfirmed && (
                            <p className="text-sm font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 rounded-lg px-3.5 py-2.5">
                                ✓ Email confirmed successfully! Please sign in with your credentials.
                            </p>
                        )}
                        {justRegistered && !justConfirmed && (
                            <p className="text-sm text-emerald-400 bg-emerald-950/60 border border-emerald-800/80 rounded-lg px-3.5 py-2.5">
                                Account created! Please check your email to confirm, then sign in.
                            </p>
                        )}
                        {(error || queryError) && (
                            <p className="text-sm text-rose-400 bg-rose-950/60 border border-rose-800/80 rounded-lg px-3.5 py-2.5">
                                {error || queryError}
                            </p>
                        )}
                        <Button type="submit" className="w-full mt-1" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="size-4 animate-spin" />
                                    Signing In...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                        <p className="text-center text-sm text-muted-foreground">
                            Don&apos;t have an account?{" "}
                            <Link href="/auth/signup" className="font-medium text-primary hover:underline underline-offset-4">
                                Sign up
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
            <p className="mt-6 text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} DinkSync
            </p>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    )
}
