import { createClient as createServerClient } from "@/lib/supabase/server"

/* Get Current Profile */
export async function getCurrentProfile() {
    const supabase = await createServerClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    // 1. Try finding profile by auth user id
    let { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

    // 2. Fallback: try finding profile by email (e.g. seeded admin)
    if (!profile && user.email) {
        const { data: profileByEmail } = await supabase
            .from("profiles")
            .select("*")
            .eq("email", user.email)
            .maybeSingle()

        if (profileByEmail) {
            profile = profileByEmail
        }
    }

    // 3. Fallback: if no profile row yet, deduce role from user metadata or admin email
    if (!profile) {
        const isAdmin =
            user.user_metadata?.role === "admin" ||
            user.email?.toLowerCase().includes("admin")

        return {
            id: user.id,
            first_name: user.user_metadata?.full_name?.split(" ")[0] || "Admin",
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "Admin User",
            email: user.email,
            phone: user.phone || user.user_metadata?.phone || null,
            role: isAdmin ? "admin" : "customer",
            created_at: user.created_at,
        }
    }

    return {
        ...profile,
        email: user.email ?? profile.email,
    }
}
