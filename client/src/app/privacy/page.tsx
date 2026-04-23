import type { Metadata } from "next";
import InnerPageNav from "@/components/home/inner-page-nav";
import InnerPageFooter from "@/components/home/inner-page-footer";

export const metadata: Metadata = {
  title: "Privacy Policy | HubO Events",
  description: "Privacy Policy for HUBOEVENTS — how we collect, use, and protect your data.",
};

const sections = [
  "We collect user information such as name, email, phone number, and payment details.",
  "This data is used to process bookings and improve our services.",
  "We do not sell or share your personal data with third parties except for payment processing.",
  "We use security measures to protect your information.",
  "By using our website, you agree to this privacy policy.",
];

export default function PrivacyPage() {
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
            color: "#b535f6",
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
            Privacy Policy
          </h1>
          <div style={{ width: "48px", height: "3px", background: "#b535f6", borderRadius: "2px", marginBottom: "48px" }} />

          <p style={{
            fontFamily: "var(--font-inter)",
            fontSize: "1rem",
            color: "rgba(255,255,255,0.5)",
            marginBottom: "40px",
            lineHeight: 1.7,
          }}>
            HUBOEVENTS respects your privacy.
          </p>

          <ol style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "20px" }}>
            {sections.map((text, i) => (
              <li key={i} style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
                <span style={{
                  fontFamily: "var(--font-outfit)",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  color: "#b535f6",
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

      <InnerPageFooter exclude="/privacy" />
    </div>
  );
}
