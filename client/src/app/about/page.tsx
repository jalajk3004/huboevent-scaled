import type { Metadata } from "next";
import Link from "next/link";
import InnerPageNav from "@/components/home/inner-page-nav";
import InnerPageFooter from "@/components/home/inner-page-footer";

export const metadata: Metadata = {
  title: "About Us | HubO Events",
  description: "Learn about HUBOEVENTS — an event management platform focused on organizing and delivering engaging experiences.",
};

export default function AboutPage() {
  return (
    <div style={{ background: "#000", minHeight: "100vh", color: "#fff", display: "flex", flexDirection: "column" }}>
      <InnerPageNav />

      <main style={{ flex: 1, padding: "120px 5% 80px" }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>

          <p style={{
            fontFamily: "var(--font-outfit)",
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "4px",
            textTransform: "uppercase",
            color: "#ff2a85",
            marginBottom: "16px",
          }}>
            WHO WE ARE
          </p>
          <h1 style={{
            fontFamily: "var(--font-outfit)",
            fontSize: "clamp(3rem, 8vw, 5.5rem)",
            fontWeight: 900,
            lineHeight: 1,
            textTransform: "uppercase",
            letterSpacing: "-1px",
            background: "linear-gradient(135deg, #ffffff 0%, #e0aaff 40%, #ff2a85 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            marginBottom: "0",
          }}>
            About Us
          </h1>

          <div style={{ width: "60px", height: "3px", background: "#ff2a85", borderRadius: "2px", margin: "32px 0 56px" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "36px" }}>
            <div style={{ borderLeft: "2px solid rgba(255, 42, 133, 0.3)", paddingLeft: "28px" }}>
              <p style={{ fontFamily: "var(--font-inter)", fontSize: "1.15rem", lineHeight: 1.8, color: "rgba(255,255,255,0.85)" }}>
                HUBOEVENTS is an event management platform focused on organizing
                and delivering engaging experiences.
              </p>
            </div>
            <div style={{ borderLeft: "2px solid rgba(160, 32, 240, 0.35)", paddingLeft: "28px" }}>
              <p style={{ fontFamily: "var(--font-inter)", fontSize: "1.15rem", lineHeight: 1.8, color: "rgba(255,255,255,0.85)" }}>
                We create and manage our own events and provide a simple
                and secure ticket booking experience.
              </p>
            </div>
            <div style={{ borderLeft: "2px solid rgba(10, 226, 255, 0.3)", paddingLeft: "28px" }}>
              <p style={{ fontFamily: "var(--font-inter)", fontSize: "1.15rem", lineHeight: 1.8, color: "rgba(255,255,255,0.85)" }}>
                Our goal is to bring people together through memorable events.
              </p>
            </div>
          </div>

          <div style={{ marginTop: "64px" }}>
            <Link
              href="/checkout"
              style={{
                display: "inline-block",
                background: "linear-gradient(135deg, #ff2a85, #a020f0)",
                color: "#fff",
                padding: "14px 36px",
                borderRadius: "30px",
                fontFamily: "var(--font-outfit)",
                fontWeight: 700,
                fontSize: "0.85rem",
                letterSpacing: "2px",
                textTransform: "uppercase",
                textDecoration: "none",
                boxShadow: "0 0 24px rgba(255,42,133,0.35)",
              }}
            >
              🎟 Buy Tickets
            </Link>
          </div>
        </div>
      </main>

      <InnerPageFooter exclude="/about" />
    </div>
  );
}
