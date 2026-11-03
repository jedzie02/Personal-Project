import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "DinkSync — Real-Time Pickleball Court Booking & Venue Management",
  description: "Reserve courts in real time with live hourly rates in Philippine Pesos (₱). Check open slots and lock in your match instantly.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${poppins.variable} dark h-full antialiased scroll-smooth`}
      style={{ colorScheme: "dark" }}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{document.documentElement.classList.add('dark');localStorage.setItem('theme','dark');}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
