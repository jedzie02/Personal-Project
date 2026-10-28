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

        const profileData = {
            id: user.id,
            first_name: user.user_metadata?.full_name?.split(" ")[0] || (isAdmin ? "Admin" : "Customer"),
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || (isAdmin ? "Admin User" : "Customer User"),
            email: user.email,
            phone: user.phone || user.user_metadata?.phone || null,
            role: (isAdmin ? "admin" : "customer") as "admin" | "customer",
            created_at: user.created_at,
        }

        // Persist profile into public.profiles for live querying
        try {
            await supabase.from("profiles").upsert(profileData, { onConflict: "id" })
        } catch {
            // Ignore write errors if session lacks permission
        }

        return profileData
    }

    const derivedFullName = user.user_metadata?.full_name || user.email?.split("@")[0] || null;
    const isGeneric = !profile.full_name || profile.full_name === "Customer" || profile.full_name === "Customer User";
    const resolvedFullName = isGeneric && derivedFullName ? derivedFullName : (profile.full_name || derivedFullName);

    if (isGeneric && derivedFullName) {
        try {
            await supabase
                .from("profiles")
                .update({ full_name: resolvedFullName, email: user.email ?? profile.email })
                .eq("id", profile.id);
        } catch {
            // ignore
        }
    }

    return {
        ...profile,
        full_name: resolvedFullName,
        email: user.email ?? profile.email,
    }
}
