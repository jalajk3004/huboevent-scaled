"use client";

import Link from "next/link";
import { Instagram, Youtube, Facebook } from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "@/app/page.module.css";


export default function Footer() {
  const router = useRouter();

  return (
    <footer className={styles.newFooter}>
      <div className={styles.footerContent}>
        <div className={styles.footerLinksRow}>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontFamily: "inherit", fontSize: "inherit", padding: 0 }}
          >
            . Home
          </button>
          <button
            onClick={() => router.push("/about")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontFamily: "inherit", fontSize: "inherit", padding: 0 }}
          >
            . About Us
          </button>
          <button
            onClick={() => router.push("/contact")}
            style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontFamily: "inherit", fontSize: "inherit", padding: 0 }}
          >
            . Contact Us
          </button>
        </div>
        <div className={styles.footerSocials}>
          <a href="https://www.instagram.com/hubo_events?igsh=MThhemVhY2w1eHkweA%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className={styles.circleSocial}><Instagram size={18} /></a>
          <a href="https://www.facebook.com/share/18cnsVgivK/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className={styles.circleSocial}><Facebook size={18} /></a>
          <a href="https://youtube.com/@huboevents?si=OksJoQndKOF80-ns" target="_blank" rel="noopener noreferrer" className={styles.circleSocial}><Youtube size={18} /></a>
        </div>
      </div>

      <div className={styles.footerDivider} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span className={styles.footerCopyright}>
            HuboEvent &copy; {new Date().getFullYear()}. All Rights Reserved.
          </span>
          <span style={{ fontFamily: "var(--font-inter)", fontSize: "0.75rem", color: "rgba(255,255,255,0.28)" }}>
            Designed & developed by{" "}
            <a
              href="https://www.instagram.com/aurex._in?igsh=OWJlaHg2NjVneHJs&utm_source=qr"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "rgba(255,255,255,0.5)", textDecoration: "none", fontWeight: 600, transition: "color 0.2s" }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = "#ff2a85")}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.5)")}
            >
              Aurex
            </a>
          </span>
        </div>
        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
          {[
            { label: "Privacy Policy", href: "/privacy" },
            { label: "Terms & Conditions", href: "/terms" },
            { label: "Refund Policy", href: "/refund" },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              style={{
                fontFamily: "var(--font-inter)",
                fontSize: "0.75rem",
                color: "rgba(255,255,255,0.3)",
                textDecoration: "none",
                letterSpacing: "0.5px",
                transition: "color 0.2s",
              }}
              onMouseEnter={e => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.65)")}
              onMouseLeave={e => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.3)")}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
