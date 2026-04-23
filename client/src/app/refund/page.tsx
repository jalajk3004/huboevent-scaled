import type { Metadata } from "next";
import InnerPageNav from "@/components/home/inner-page-nav";
import InnerPageFooter from "@/components/home/inner-page-footer";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy | HubO Events",
  description: "Refund and cancellation policy for HUBOEVENTS ticket bookings.",
};

const sections = [
  "Tickets are non-cancellable and non-refundable.",
  "In case of event cancellation or unforeseen circumstances (such as government restrictions or technical issues), the event may be rescheduled or a refund may be provided.",
  "Refunds, if applicable, will be processed within 7–10 business days.",
  "Refund decisions are subject to HUBOEVENTS policies.",
];

export default function RefundPage() {
  return (
    <div style={{ background: "#000", minHeight: "100vh", color: "#fff", display: "flex", flexDirection: "column" }}>
      <InnerPageNav />

      <main style={{ flex: 1, padding: "120px 5% 80px" }}>
        <div style={{ maxWidth: "720px", margin: "0 auto" }}>

          <p style={{
            fontFamily: "var(--font-outfit)",
            fontSize: "0.7rem",
            fontWeight: 700,
            letterSpacing: "4px",
            textTransform: "uppercase",
            color: "#ff2a85",
            marginBottom: "14px",
          }}>
            Legal
          </p>
          <h1 style={{
            fontFamily: "var(--font-outfit)",
            fontSize: "clamp(2.2rem, 6vw, 4rem)",
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "-0.5px",
            color: "#fff",
            marginBottom: "12px",
          }}>
            Refund & Cancellation
          </h1>
          <div style={{ width: "48px", height: "3px", background: "#ff2a85", borderRadius: "2px", marginBottom: "48px" }} />

          <p style={{
            fontFamily: "var(--font-inter)",
            fontSize: "1rem",
            color: "rgba(255,255,255,0.5)",
            marginBottom: "40px",
            lineHeight: 1.7,
          }}>
            All bookings made on HUBOEVENTS are final.
          </p>

          <ol style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "20px" }}>
            {sections.map((text, i) => (
              <li key={i} style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
                <span style={{
                  fontFamily: "var(--font-outfit)",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  color: "#ff2a85",
                  minWidth: "28px",
                  paddingTop: "3px",
                  letterSpacing: "1px",
                }}>
                  0{i + 1}
                </span>
                <p style={{
                  fontFamily: "var(--font-inter)",
                  fontSize: "0.98rem",
                  lineHeight: 1.8,
                  color: "rgba(255,255,255,0.75)",
                }}>
                  {text}
                </p>
              </li>
            ))}
          </ol>

          <div style={{
            marginTop: "52px",
            padding: "22px 26px",
            background: "rgba(255,42,133,0.05)",
            border: "1px solid rgba(255,42,133,0.15)",
            borderRadius: "14px",
          }}>
            <p style={{
              fontFamily: "var(--font-inter)",
              fontSize: "0.9rem",
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.65,
            }}>
              For support, reach us at{" "}
              <a href="mailto:huboevents@gmail.com" style={{ color: "#ff2a85", textDecoration: "none", fontWeight: 600 }}>
                huboevents@gmail.com
              </a>
            </p>
          </div>
        </div>
      </main>

      <InnerPageFooter exclude="/refund" />
    </div>
  );
}
