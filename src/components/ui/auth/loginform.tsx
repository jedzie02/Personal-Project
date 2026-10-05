"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, type AuthActionState } from "@/lib/auth.actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

/**
 * useFormStatus reports whether the <form> THIS COMPONENT is
 * rendered inside is currently submitting. It only works when placed
 * inside a <form>, which is why this is its own small component
 * rather than just a plain <Button> in LoginForm below — the button
 * needs to be a descendant of the form to read its pending state.
 */
function LoginSubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Logging in..." : "Log in"}
        </Button>
    );
}

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
    const [state, formAction] = useActionState<AuthActionState | undefined, FormData>(
        loginAction,
        undefined
    );

    return (
        <Card className="mx-auto max-w-sm w-full">
            <CardHeader>
                <CardTitle className="text-2xl">Login</CardTitle>
                <CardDescription>
                    Enter your email below to login to your account.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="flex flex-col gap-4">
                    {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}

                    {state?.error && (
                        <p className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{state.error}</p>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" required />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" name="password" type="password" required />
                    </div>

                    <LoginSubmitButton />
                </form>
            </CardContent>
        </Card>
    );
}