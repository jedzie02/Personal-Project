"use server";

import { redirect } from "next/navigation";
import { login, logout, signUp } from "@/lib/services/auth.service";

/**
 * "use server" at the top of the file marks EVERY exported function
 * here as a Server Action. When the login form calls loginAction(),
 * the browser doesn't run this code — it sends a request to the
 * server, which runs it and sends back the result. This is what lets
 * a <form action={loginAction}> work without you writing an API route.
 *
 * We use FormData (the native browser form payload) rather than a
 * hand-typed object, since that's what Server Actions receive
 * automatically when wired to a <form>.
 */

export type AuthActionState = {
    error?: string;
    success?: boolean;
};

export async function loginAction(state: AuthActionState | undefined, formData: FormData): Promise<AuthActionState | undefined> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const redirectTo = formData.get("redirectTo") as string;

    const result = await login(email, password);

    if (!result.success) {
        return { error: result.error ?? "Login failed" };
    }

    if (redirectTo) {
        redirect(redirectTo);
    }

    redirect("/admin");
}

export async function signUpAction(state: AuthActionState | undefined, formData: FormData): Promise<AuthActionState | undefined> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const fullName = formData.get("fullName") as string;

    const result = await signUp(email, password, fullName);

    if (!result.success) {
        return { error: result.error ?? "Sign up failed" };
    }

    // Supabase sends a confirmation email by default; adjust this
    // redirect target once we decide (per the SRS open questions)
    // whether email confirmation is required for MVP.
    redirect("/auth/login?message=Check your email to confirm your account");
}

export async function logoutAction() {
    await logout();
    redirect("/auth/login");
}