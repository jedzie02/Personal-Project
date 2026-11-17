import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (error) {
        return NextResponse.redirect(
            `${origin}/auth/login?error=${encodeURIComponent(errorDescription || error)}`
        );
    }

    if (code) {
        try {
            const supabase = await createClient();
            const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) {
                console.error("Auth code exchange error:", exchangeError);
            }
        } catch (err) {
            console.error("Auth callback unexpected error:", err);
        }
    }

    return NextResponse.redirect(`${origin}/auth/login?confirmed=true`);
}

