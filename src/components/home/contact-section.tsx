"use client";

import { motion } from "framer-motion";
import { MapPin, Mail, Smartphone } from "lucide-react";
import styles from "@/app/page.module.css";

export default function ContactSection() {
  const fadeIn = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8 }
  };

  return (
    <>
      <section className={`${styles.section} ${styles.tickets}`} id="contact-section">
        <div className={styles.sectionHeader}>
          <h4 className={styles.sectionSubtitle}>Get In Touch</h4>
          <h2 className={styles.sectionTitle}>Contact HubO Events</h2>
        </div>

        <motion.div className={styles.paymentSection} {...fadeIn}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', textAlign: 'center' }}>
            <div>
              <MapPin size={32} style={{ color: 'var(--accent-pink)', marginBottom: '15px' }} />
              <h4 style={{ color: '#fff', marginBottom: '10px' }}>Our Location</h4>
              <p style={{ color: '#aaa' }}>New Delhi, India</p>
            </div>
            <div>
              <Mail size={32} style={{ color: 'var(--accent-blue)', marginBottom: '15px' }} />
              <h4 style={{ color: '#fff', marginBottom: '10px' }}>Email Us</h4>
              <p style={{ color: '#aaa' }}>hubo@gmail.com</p>
            </div>
            <div>
              <Smartphone size={32} style={{ color: '#4ade80', marginBottom: '15px' }} />
              <h4 style={{ color: '#fff', marginBottom: '10px' }}>Call Us</h4>
              <p style={{ color: '#aaa' }}>+91 88514 21341</p>
            </div>
          </div>
        </motion.div>
      </section>
    </>
  );
}
