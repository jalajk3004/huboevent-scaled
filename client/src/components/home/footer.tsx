"use client";

import { Instagram, Twitter, Facebook } from "lucide-react";
import styles from "@/app/page.module.css";

function scrollTo(id: string) {
  if (id === "top") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const el = document.getElementById(id);
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top, behavior: "smooth" });
  }
}

const FOOTER_LINKS = [
  { label: ". Home",           sectionId: "top"              },
  { label: ". Upcoming Shows", sectionId: "upcoming-shows"   },
  { label: ". Past Events",    sectionId: "gallery-section"  },
  { label: ". About Us",       sectionId: "about-section"    },
  { label: ". Contact Us",     sectionId: "contact-section"  },
];

export default function Footer() {
  return (
    <footer className={styles.newFooter}>
      <div className={styles.footerContent}>
        <div className={styles.footerLinksRow}>
          {FOOTER_LINKS.map(({ label, sectionId }) => (
            <button
              key={sectionId}
              onClick={() => scrollTo(sectionId)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontFamily: "inherit", fontSize: "inherit", padding: 0 }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className={styles.footerSocials}>
          <a href="#" className={styles.circleSocial}><Instagram size={18} /></a>
          <a href="#" className={styles.circleSocial}><Twitter size={18} /></a>
          <a href="#" className={styles.circleSocial}><Facebook size={18} /></a>
        </div>
      </div>
      <div className={styles.footerDivider} />
      <div className={styles.footerCopyright}>
        HuboEvent &copy; {new Date().getFullYear()}. All Rights Reserved.
      </div>
    </footer>
  );
}
