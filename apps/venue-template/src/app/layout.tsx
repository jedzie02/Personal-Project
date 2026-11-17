import type { Metadata } from "next";
import { venueConfig } from "../../venue.config";

export const metadata: Metadata = {
  title: `${venueConfig.venueName} | Court Booking`,
  description: venueConfig.tagline,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "sans-serif", margin: 0, padding: 0 }}>
        <header style={{ borderBottom: "1px solid #e2e8f0", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>{venueConfig.venueName}</h1>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>{venueConfig.tagline}</p>
          </div>
          <nav style={{ display: "flex", gap: "16px" }}>
            <a href="/" style={{ textDecoration: "none", color: "#0f172a", fontWeight: 600 }}>Book</a>
            <a href="/admin" style={{ textDecoration: "none", color: "#0f172a", fontWeight: 600 }}>Admin</a>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
