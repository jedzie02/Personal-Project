import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CircleDotDashed, Swords, BookOpen, Trophy, Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Pickleball | Paddlix",
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
            "Pickleball is played on a 20 x 44 ft court with a 36-inch net at the sidelines and a 34-inch net at the center. Games can be played as singles or doubles.",
            "The Kitchen: A 7-foot non-volley zone on each side of the net. Players may not hit the ball out of the air while standing inside the kitchen, promoting longer rallies and strategy over raw power.",
            "The Two-Bounce Rule: After the serve, the receiving team must let the ball bounce once, and the serving team must also let the return bounce once before either team may volley.",
            "Serving: Serves are made underhand, diagonally cross-court, and must clear the kitchen. Only the serving team can score points. A fault by the serving team results in a side-out.",
        ],
    },
    {
        id: "scoring",
        Icon: Trophy,
        title: "Scoring",
        paragraphs: [
            "Pickleball uses rally-style or traditional scoring depending on the format.",
            "Traditional scoring: Points are only earned by the serving side. Games are typically played to 11, 15, or 21 points and must be won by at least 2.",
            "Rally scoring: A point is awarded on every rally regardless of which side served. Increasingly popular in tournaments for faster, predictable match lengths.",
            "In doubles, the score is called as three numbers: serving score - receiving score - server number. Example: 4-2-1 means the serving team leads 4 to 2, with the first server serving.",
        ],
    },
    {
        id: "why-pickleball",
        Icon: Users,
        title: "Why Pickleball?",
        paragraphs: [
            "Pickleball appeals to a wide demographic because of its low barrier to entry, short learning curve, and social nature. Courts are smaller than tennis courts, and the underhand serve removes overhead serving complexity.",
            "The sport offers meaningful cardio, improved hand-eye coordination, and a vibrant community. Whether you are 8 or 80, a weekend warrior or a competitive athlete, pickleball has a spot for you.",
            "Paddlix is your gateway to getting on the court. Book your session, grab a paddle, and join the fastest-growing sport in the world!",
        ],
    },
] as const;

export default function AboutPage() {
    return (
        <div className="flex min-h-screen flex-col bg-white">
            {/* Header: 3-column grid — logo | center nav | auth actions */}
            <header className="grid grid-cols-3 items-center px-6 py-4 bg-white border-b border-gray-200 relative z-10">
                {/* Left: Logo */}
                <Link href="/" className="flex items-center gap-2 text-2xl font-bold tracking-tight text-gray-900 group" aria-label="Paddlix Home">
                    <CircleDotDashed className="size-7 text-blue-600 group-hover:rotate-45 transition-transform duration-300" />
                    Paddlix
                </Link>
                {/* Center: Home + About */}
                <nav className="flex items-center justify-center gap-6" aria-label="Primary navigation">
                    <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors" aria-label="Home">
                        Home
                    </Link>
                    <Link href="/about" className="text-sm font-medium text-blue-600" aria-current="page" aria-label="About Pickleball">
                        About
                    </Link>
                </nav>
                {/* Right: Log in + Book a Court */}
                <div className="flex items-center justify-end gap-4">
                    <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                        Log in
                    </Link>
                    <Link href="/book">
                        <Button className="rounded-full bg-blue-600 text-white shadow hover:bg-blue-700 hover:scale-105 hover:shadow-md transition-all duration-300">
                            Book a Court
                        </Button>
                    </Link>
                </div>
            </header>

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
                        <div className="flex-shrink-0 flex items-center justify-center size-12 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-sm">
                            <Icon className="size-6" aria-hidden="true" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
                            <div className="text-gray-600 leading-relaxed space-y-3">
                                {paragraphs.map((p, i) => (
                                    <p key={i}>{p}</p>
                                ))}
                            </div>
                        </div>
                    </section>
                ))}
            </main>

            <section className="bg-gray-50 border-t border-gray-200 py-16 text-center px-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-3">Ready to play?</h2>
                <p className="text-gray-600 mb-8 max-w-xl mx-auto">
                    Find an available court near you and get on the court today.
                </p>
                <Link href="/book">
                    <Button className="text-lg px-10 py-6 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 hover:scale-105 hover:shadow-xl transition-all duration-300">
                        Book a Court
                    </Button>
                </Link>
            </section>

            <footer className="py-8 border-t border-gray-200 text-center text-sm text-gray-500 bg-gray-50">
                <p>&copy; {new Date().getFullYear()} Paddlix. All rights reserved.</p>
            </footer>
        </div>
    );
}
