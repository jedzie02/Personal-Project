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

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

    if (!profile) {
        return null
    }

    return {
        ...profile,
        email: user.email,
    }
}
