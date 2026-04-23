"use client";

import Image from "next/image";
import Link from "next/link";

export default function InnerPageNav() {
  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        padding: "14px 5%",
        background: "rgba(5, 2, 10, 0.92)",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Link href="/" style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none" }}>
        <Image
          src="/hubologo.png"
          alt="Hubo Events"
          width={180}
          height={64}
          style={{ objectFit: "contain", height: "48px", width: "auto" }}
          priority
        />
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span style={{ fontFamily: "var(--font-outfit)", fontWeight: 900, fontSize: "0.95rem", letterSpacing: "3px", textTransform: "uppercase", color: "#fff" }}>
            HUBO EVENTS
          </span>
          <span style={{ fontFamily: "var(--font-outfit)", fontWeight: 500, fontSize: "0.52rem", letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginTop: "3px" }}>
            NIGHTLIFE / ENTERTAINMENT
          </span>
        </div>
      </Link>
      <Link
        href="/"
        style={{
          color: "rgba(255,255,255,0.55)",
          fontSize: "0.75rem",
          letterSpacing: "1.5px",
          fontFamily: "var(--font-outfit)",
          fontWeight: 600,
          textTransform: "uppercase",
          textDecoration: "none",
          transition: "color 0.2s",
        }}
        onMouseEnter={e => ((e.target as HTMLElement).style.color = "#ff2a85")}
        onMouseLeave={e => ((e.target as HTMLElement).style.color = "rgba(255,255,255,0.55)")}
      >
        ← Home
      </Link>
    </nav>
  );
}
