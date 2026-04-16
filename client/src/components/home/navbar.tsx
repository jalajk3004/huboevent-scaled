"use client";

import Image from "next/image";
import { useRouter } from 'next/navigation';
import styles from "@/app/page.module.css";

export default function Navbar() {
  const router = useRouter();

  return (
    <nav className={styles.navbar} style={{ justifyContent: "space-between" }}>
      {/* Logo */}
      <div className={styles.logo} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Image
          src="/hubologo.png"
          alt="Hubo Events Logo"
          width={220}
          height={80}
          style={{ objectFit: "contain", height: "60px", width: "auto" }}
          priority
        />
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
          <span style={{ fontFamily: "var(--font-outfit)", fontWeight: 900, fontSize: "1.1rem", letterSpacing: "3px", textTransform: "uppercase", color: "#ffffff" }}>
            HUBO EVENTS
          </span>
          <span style={{ fontFamily: "var(--font-outfit)", fontWeight: 500, fontSize: "0.6rem", letterSpacing: "2px", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginTop: "3px" }}>
            NIGHTLIFE / ENTERTAINMENT
          </span>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={() => router.push("/checkout")}
        style={{
          background: "linear-gradient(135deg, var(--accent-pink), #a020f0)",
          color: "#fff",
          border: "none",
          padding: "10px 28px",
          borderRadius: "30px",
          fontSize: "0.85rem",
          fontWeight: 700,
          cursor: "pointer",
          textTransform: "uppercase",
          letterSpacing: "2px",
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
    </nav>
  );
}
