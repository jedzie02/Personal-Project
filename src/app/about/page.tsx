import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Swords, BookOpen, Trophy, Users } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Pickleball | DinkSync",
    description: "Learn about pickleball - its origins, rules, scoring, and why it is the fastest-growing sport in the world.",
};

const SECTIONS = [
    {
        id: "origins",
        Icon: BookOpen,
        title: "Origins",
        paragraphs: [
            "Pickleball was invented in the summer of 1965 on Bainbridge Island, Washington, by Joel Pritchard, Bill Bell, and Barney McCallum. The three friends created the game using a badminton court, ping-pong paddles, and a perforated plastic ball.",
            "From a backyard pastime, pickleball grew steadily across the United States and eventually worldwide. It is now recognized as the fastest-growing sport in America, with millions of players and dedicated courts across the country.",
        ],
    },
    {
        id: "how-to-play",
        Icon: Swords,
        title: "How to Play",
        paragraphs: [
            "Pickleball is played on a badminton-sized court (20 x 44 feet) with a net set at 34 inches in the center. It can be played in singles or doubles, though doubles is by far the most popular format.",
            "Each point begins with an underhand serve hit diagonally across the court. The ball must bounce once on each side before volleys are allowed (the two-bounce rule). Players cannot volley while standing inside the 7-foot non-volley zone, affectionately called the kitchen.",
        ],
    },
    {
        id: "scoring",
        Icon: Trophy,
        title: "Rules & Scoring",
        paragraphs: [
            "Games are typically played to 11 points and must be won by 2. Points can only be scored by the serving team.",
            "In doubles, each player gets a turn to serve before a side-out occurs (except for the very first service turn of the game). The score is called as three numbers: server score, receiver score, and server number (1 or 2).",
        ],
    },
    {
        id: "why-play",
        Icon: Users,
        title: "Why People Love It",
        paragraphs: [
            "Pickleball combines the best elements of tennis, badminton, and ping-pong into an easy-to-learn, highly social game. The smaller court size means less running and more fast-paced rallies, making it accessible to players of all ages and fitness levels.",
            "The sport offers meaningful cardio, improved hand-eye coordination, and a vibrant community. Whether you are 8 or 80, a weekend warrior or a competitive athlete, pickleball has a spot for you.",
            "DinkSync is your gateway to getting on the court. Book your session, grab a paddle, and join the fastest-growing sport in the world!",
        ],
    },
] as const;

export default function AboutPage() {
    return (
        <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
            <Navbar />

            <section className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 px-6 text-center">
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-4">
                    About Pickleball
                </h1>
                <p className="max-w-2xl mx-auto text-lg text-blue-100">
                    The fastest-growing sport in America - origins, rules, scoring, and everything you need to pick up a paddle.
                </p>
            </section>

            <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-16 space-y-16" id="main-content">
                {SECTIONS.map(({ id, Icon, title, paragraphs }) => (
                    <section key={id} id={id} className="flex gap-6 items-start group">
                        <div className="flex-shrink-0 flex items-center justify-center size-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm border border-blue-100/60 dark:border-blue-900/60">
                            <Icon className="size-6" aria-hidden="true" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{title}</h2>
                            <div className="text-gray-600 dark:text-slate-300 leading-relaxed space-y-3">
                                {paragraphs.map((p, i) => (
                                    <p key={i}>{p}</p>
                                ))}
                            </div>
                        </div>
                    </section>
                ))}
            </main>

            <section className="bg-slate-50 dark:bg-slate-900/60 border-t border-slate-200 dark:border-slate-800 py-16 text-center px-6">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Ready to play?</h2>
                <p className="text-gray-600 dark:text-slate-400 mb-8 max-w-xl mx-auto">
                    Find an available court near you and get on the court today.
                </p>
                <Link href="/#book-a-court">
                    <Button className="text-lg px-10 py-6 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:scale-105 hover:shadow-xl transition-all duration-300 cursor-pointer">
                        Book a Court
                    </Button>
                </Link>
            </section>

            <footer className="py-8 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950">
                <p>&copy; {new Date().getFullYear()} DinkSync. All rights reserved.</p>
            </footer>
        </div>
    );
}
