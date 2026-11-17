import { createClient } from "@/lib/supabase/client";

// Lazily instantiate the browser client so importing `supabase` during
// Next.js static prerendering / build-time module evaluation does not crash.
let clientInstance: ReturnType<typeof createClient> | null = null;

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
    get(_target, prop) {
        if (!clientInstance) {
            clientInstance = createClient();
        }
        const val = Reflect.get(clientInstance, prop);
        return typeof val === "function" ? val.bind(clientInstance) : val;
    },
});