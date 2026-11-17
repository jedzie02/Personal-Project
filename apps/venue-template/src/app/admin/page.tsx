import { venueConfig } from "../../../venue.config";

export default function AdminPage() {
  return (
    <div style={{ padding: "40px 24px", maxWidth: "960px", margin: "0 auto" }}>
      <header style={{ marginBottom: "32px", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px" }}>
        <h2 style={{ fontSize: "1.75rem", margin: "0 0 8px 0" }}>{venueConfig.venueName} Manager Console</h2>
        <p style={{ margin: 0, color: "#64748b" }}>Dedicated Client 2 Admin Portal</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
        <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "20px", background: "#ffffff" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "#64748b", fontSize: "0.85rem", textTransform: "uppercase" }}>Bookings</h4>
          <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>Custom UI</p>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#94a3b8" }}>Connects to @pickle/core</p>
        </div>

        <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "20px", background: "#ffffff" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "#64748b", fontSize: "0.85rem", textTransform: "uppercase" }}>Courts & Rates</h4>
          <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>Isolated DB</p>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#94a3b8" }}>Client 2 Supabase instance</p>
        </div>

        <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "20px", background: "#ffffff" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "#64748b", fontSize: "0.85rem", textTransform: "uppercase" }}>Payments</h4>
          <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700 }}>Stripe & GCash</p>
          <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#94a3b8" }}>Direct client payouts</p>
        </div>
      </div>
    </div>
  );
}
