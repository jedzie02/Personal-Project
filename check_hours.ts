import { createAdminClient } from "./src/lib/supabase/admin";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("operating_hours").select("*");
    console.log(data);
}
main();
