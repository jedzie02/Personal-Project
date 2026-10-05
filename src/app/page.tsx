import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CircleDotDashed } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="flex min-h-screen flex-col bg-white">
            <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 relative z-10">
                <div className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900">
                    <CircleDotDashed className="size-7 text-blue-600" />
                    Paddlix
                </div>
                <nav className="flex items-center gap-4">
                    <Link
                        href="/auth/login"
                        className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        Log in
                    </Link>
                    <Link href="/auth/signup">
                        <Button variant="secondary" className="bg-blue-600 text-white hover:bg-blue-700">
                            Sign up
                        </Button>
                    </Link>
                </nav>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-3xl mx-auto space-y-8">
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-gray-900">
                        Effortless booking for your next{" "}
                        <span className="text-blue-600">pickleball match</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-xl text-gray-600">
                        The simplest way to schedule courts, invite friends, and manage your
                        playtime. Get started today and spend more time on the court.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8">
                        <Link href="/book">
                            <Button className="w-full sm:w-auto text-xl px-12 py-7 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:scale-105 hover:shadow-xl transition-all duration-300">
                                Book A Court
                            </Button>
                        </Link>
                    </div>
                </div>
            </main>

            <footer className="py-8 border-t border-gray-200 text-center text-sm text-gray-500 bg-gray-50 relative z-10">
                <p>&copy; {new Date().getFullYear()} Paddlix. All rights reserved.</p>
            </footer>
        </div>
    );
}