"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import styles from "@/app/page.module.css";

const NAV_LINKS = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
];

export default function Navbar() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const buyTickets = () => {
    setMenuOpen(false);
    router.push("/checkout");
  };

  return (
    <>
      <nav
        className={styles.navbar}
        style={{ justifyContent: "space-between", flexDirection: "row", flexWrap: "nowrap", alignItems: "center" }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", flexShrink: 0 }}>
          <Image
            src="/hubologo.png"
            alt="Hubo Events Logo"
            width={220}
            height={80}
            style={{ objectFit: "contain", height: "54px", width: "auto" }}
            priority
          />
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{ fontFamily: "var(--font-outfit)", fontWeight: 900, fontSize: "1.05rem", letterSpacing: "3px", textTransform: "uppercase", color: "#fff" }}>
              HUBO EVENTS
            </span>
            <span style={{ fontFamily: "var(--font-outfit)", fontWeight: 500, fontSize: "0.55rem", letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginTop: "3px" }}>
              NIGHTLIFE / ENTERTAINMENT
            </span>
          </div>
        </Link>

        {/* Desktop: nav links + CTA */}
        <div className={styles.navLinksDesktop}>
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className={styles.navLink}
              style={{ fontSize: "0.82rem", letterSpacing: "2px" }}
            >
              {label}
            </Link>
          ))}
          <button
            onClick={buyTickets}
            style={{
              background: "linear-gradient(135deg, var(--accent-pink), #a020f0)",
              color: "#fff",
              border: "none",
              padding: "10px 26px",
              borderRadius: "30px",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "2px",
              fontFamily: "var(--font-outfit)",
              boxShadow: "0 0 20px rgba(255,42,133,0.4)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.05)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 30px rgba(255,42,133,0.6)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
              (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(255,42,133,0.4)";
            }}
          >
            🎟 Buy Tickets
          </button>
        </div>

        {/* Mobile: hamburger only */}
        <button
          className={styles.hamburgerBtn}
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={26} />
        </button>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setMenuOpen(false)}
          aria-modal="true"
          role="dialog"
        >
          <div
            className={styles.mobileDrawer}
            onClick={e => e.stopPropagation()}
          >
            {/* Close button row */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                className={styles.drawerCloseBtn}
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>

            {/* Drawer logo */}
            <Link href="/" className={styles.drawerLogo} onClick={() => setMenuOpen(false)}>
              <Image
                src="/hubologo.png"
                alt="Hubo Events"
                width={140}
                height={52}
                style={{ objectFit: "contain", height: "42px", width: "auto" }}
              />
            </Link>

            {/* Nav links */}
            {NAV_LINKS.map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className={styles.mobileNavLink}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}

            {/* CTA */}
            <button className={styles.mobileBuyBtn} onClick={buyTickets} style={{ marginTop: "auto" }}>
              🎟 Buy Tickets
            </button>
          </div>
        </div>
      )}
    </>
  );
}
