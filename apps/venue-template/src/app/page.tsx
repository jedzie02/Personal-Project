import { venueConfig } from "../../venue.config";

export default function HomePage() {
  return (
    <div style={{ padding: "40px 24px", maxWidth: "960px", margin: "0 auto" }}>
      <section style={{ textAlign: "center", marginBottom: "48px" }}>
        <h2 style={{ fontSize: "2rem", marginBottom: "12px", color: "#0f172a" }}>Welcome to {venueConfig.venueName}</h2>
        <p style={{ color: "#475569", fontSize: "1.1rem" }}>
          Ready for your custom UI redesign. Powered by the shared <code style={{ background: "#f1f5f9", padding: "2px 6px", borderRadius: "4px" }}>@pickle/core</code> engine.
        </p>
      </section>

      <div style={{ border: "2px dashed #cbd5e1", borderRadius: "12px", padding: "48px 24px", textAlign: "center", background: "#f8fafc" }}>
        <h3 style={{ marginTop: 0, color: "#1e293b" }}>🎨 Client 2 UI Canvas Ready</h3>
        <p style={{ color: "#64748b", maxWidth: "600px", margin: "0 auto 24px auto" }}>
          This application is completely separated from Client 1 (DinkSync). You can freely build completely new customer booking screens, color palettes, and components here without touching DinkSync.
        </p>
        <div style={{ display: "inline-block", background: "#ffffff", border: "1px solid #e2e8f0", padding: "16px 24px", borderRadius: "8px", textAlign: "left", fontSize: "0.9rem" }}>
          <div><strong>Venue Name:</strong> {venueConfig.venueName}</div>
          <div><strong>Currency:</strong> {venueConfig.currencySymbol} ({venueConfig.currency})</div>
          <div><strong>Timezone:</strong> {venueConfig.timezone}</div>
          <div><strong>Contact:</strong> {venueConfig.contactPhone} | {venueConfig.contactEmail}</div>
        </div>
      </div>
    </div>
  );
}
