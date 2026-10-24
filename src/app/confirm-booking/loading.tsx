import { Navbar } from "@/components/Navbar";
import ConfirmBookingSkeleton from "./ConfirmBookingSkeleton";

export default function ConfirmBookingLoading() {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Navbar />
            <main className="flex-1 flex items-center justify-center px-4 py-12 bg-slate-50/50">
                <ConfirmBookingSkeleton />
            </main>
        </div>
    );
}
