/**
 * App-wide domain types. These represent our own business concepts —
 * distinct from database.types.ts (which will later be auto-generated
 * directly from the Supabase schema). Keeping them separate means our
 * UI/service code depends on stable, hand-picked shapes rather than
 * whatever the raw DB schema happens to look like.
 */

export type UserRole = "customer" | "admin";

export interface Profile {
    id: string;
    fullName: string | null;
    phone: string | null;
    role: UserRole;
    createdAt: string;
}

/** The shape of data we expect back from a sign-up/sign-in service call. */
export interface AuthResult {
    success: boolean;
    error?: string;
}