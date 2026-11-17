"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signUpAction, type AuthActionState } from "@/lib/auth.actions";
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

function SignUpSubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Creating account..." : "Sign up"}
        </Button>
    );
}

export function SignUpForm() {
    const [state, formAction] = useActionState<AuthActionState | undefined, FormData>(
        signUpAction,
        undefined
    );

    return (
        <Card className="mx-auto max-w-sm w-full">
            <CardHeader>
                <CardTitle className="text-2xl">Create an account</CardTitle>
                <CardDescription>
                    Enter your information to create an account.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={formAction} className="flex flex-col gap-4">
                    {state?.error && (
                        <p className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{state.error}</p>
                    )}

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="fullName">Full name</Label>
                        <Input id="fullName" name="fullName" type="text" required />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" required />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="password">Password</Label>
                        <Input id="password" name="password" type="password" required minLength={6} />
                    </div>

                    <SignUpSubmitButton />
                </form>
            </CardContent>
        </Card>
    );
}