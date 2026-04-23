import type { Metadata } from "next";
import InnerPageNav from "@/components/home/inner-page-nav";
import InnerPageFooter from "@/components/home/inner-page-footer";

export const metadata: Metadata = {
  title: "Terms & Conditions | HubO Events",
  description: "Terms and Conditions for using HUBOEVENTS — huboevents.in.",
};

const sections = [
  "HUBOEVENTS organizes and manages its own events and sells tickets online.",
  "Users must provide accurate details while booking tickets.",
  "All payments are processed securely via trusted payment gateways.",
  "Tickets are valid only for the specific event and are non-transferable.",
  "HUBOEVENTS reserves the right to modify event details such as date, time, or venue if required.",
  "We are not liable for any indirect losses related to event participation.",
  "These terms may be updated at any time without prior notice.",
];

export default function TermsPage() {
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
            color: "#0ae2ff",
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
            Terms & Conditions
          </h1>
          <div style={{ width: "48px", height: "3px", background: "#0ae2ff", borderRadius: "2px", marginBottom: "48px" }} />

          <p style={{
            fontFamily: "var(--font-inter)",
            fontSize: "1rem",
            color: "rgba(255,255,255,0.5)",
            marginBottom: "40px",
            lineHeight: 1.7,
          }}>
            Welcome to HUBOEVENTS. By using our website (huboevents.in), you agree to the following terms:
          </p>

          <ol style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "20px" }}>
            {sections.map((text, i) => (
              <li key={i} style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
                <span style={{
                  fontFamily: "var(--font-outfit)",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  color: "#0ae2ff",
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
        </div>
      </main>

      <InnerPageFooter exclude="/terms" />
    </div>
  );
}
