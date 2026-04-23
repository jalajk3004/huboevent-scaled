import type { Metadata } from "next";
import { Mail, Phone, MapPin } from "lucide-react";
import InnerPageNav from "@/components/home/inner-page-nav";
import InnerPageFooter from "@/components/home/inner-page-footer";

export const metadata: Metadata = {
  title: "Contact Us | HubO Events",
  description: "Get in touch with HUBOEVENTS for booking queries, support, or any questions.",
};

export default function ContactPage() {
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
            color: "#0ae2ff",
            marginBottom: "16px",
          }}>
            GET IN TOUCH
          </p>
          <h1 style={{
            fontFamily: "var(--font-outfit)",
            fontSize: "clamp(3rem, 8vw, 5.5rem)",
            fontWeight: 900,
            lineHeight: 1,
            textTransform: "uppercase",
            letterSpacing: "-1px",
            background: "linear-gradient(135deg, #ffffff 0%, #0ae2ff 50%, #b535f6 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}>
            Contact Us
          </h1>

          <div style={{ width: "60px", height: "3px", background: "#0ae2ff", borderRadius: "2px", margin: "32px 0 56px" }} />

          <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "48px" }}>

            {/* Email */}
            <a
              href="mailto:huboevents@gmail.com"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                padding: "24px 28px",
                textDecoration: "none",
                color: "inherit",
              }}
              className="contact-card contact-card--cyan"
            >
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "rgba(10,226,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <Mail size={20} color="#0ae2ff" />
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-outfit)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>
                  Email
                </p>
                <p style={{ fontFamily: "var(--font-inter)", fontSize: "1.05rem", color: "#fff", fontWeight: 500 }}>
                  huboevents@gmail.com
                </p>
              </div>
            </a>

            {/* Phone */}
            <a
              href="tel:8743007638"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "20px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                padding: "24px 28px",
                textDecoration: "none",
                color: "inherit",
              }}
              className="contact-card contact-card--purple"
            >
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "rgba(181,53,246,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}>
                <Phone size={20} color="#b535f6" />
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-outfit)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>
                  Phone
                </p>
                <p style={{ fontFamily: "var(--font-inter)", fontSize: "1.05rem", color: "#fff", fontWeight: 500 }}>
                  8743007638
                </p>
              </div>
            </a>

            {/* Address */}
            <div style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "20px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              padding: "24px 28px",
            }}>
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "12px",
                background: "rgba(255,42,133,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: "2px",
              }}>
                <MapPin size={20} color="#ff2a85" />
              </div>
              <div>
                <p style={{ fontFamily: "var(--font-outfit)", fontSize: "0.65rem", fontWeight: 700, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: "4px" }}>
                  Address
                </p>
                <p style={{ fontFamily: "var(--font-inter)", fontSize: "1.05rem", color: "#fff", fontWeight: 500, lineHeight: 1.65 }}>
                  H-0902, Amrapali Sapphire, Sector 45,<br />
                  Noida, Gautam Buddha Nagar – 201303,<br />
                  Uttar Pradesh, India
                </p>
              </div>
            </div>
          </div>

          <p style={{
            fontFamily: "var(--font-inter)",
            fontSize: "0.95rem",
            color: "rgba(255,255,255,0.4)",
            lineHeight: 1.6,
            borderTop: "1px solid rgba(255,255,255,0.07)",
            paddingTop: "32px",
          }}>
            For any queries related to bookings or support, feel free to contact us.
          </p>
        </div>
      </main>

      <InnerPageFooter exclude="/contact" />
    </div>
  );
}
