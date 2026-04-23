"use client";

import Link from "next/link";

type FooterLink = { label: string; href: string };

const defaultLinks: FooterLink[] = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms & Conditions", href: "/terms" },
  { label: "Refund Policy", href: "/refund" },
  { label: "Contact", href: "/contact" },
  { label: "About", href: "/about" },
];

export default function InnerPageFooter({ exclude }: { exclude?: string }) {
  const links = defaultLinks.filter(l => l.href !== exclude);

  return (
    <footer style={{
      borderTop: "1px solid rgba(255,255,255,0.08)",
      padding: "24px 5%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: "12px",
      background: "#000",
    }}>
      <span style={{ fontFamily: "var(--font-inter)", fontSize: "0.78rem", color: "rgba(255,255,255,0.3)" }}>
        HuboEvent &copy; {new Date().getFullYear()}. All Rights Reserved.
      </span>
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {links.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            style={{
              fontFamily: "var(--font-inter)",
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.32)",
              textDecoration: "none",
              letterSpacing: "0.5px",
            }}
            className="inner-footer-link"
          >
            {label}
          </Link>
        ))}
      </div>
    </footer>
  );
}
