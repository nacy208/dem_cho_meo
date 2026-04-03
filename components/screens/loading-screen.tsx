"use client";

import styles from "../game.module.css";

interface LoadingScreenProps {
  loadingText: string;
}

export function LoadingScreen({ loadingText }: LoadingScreenProps) {
  return (
    <section className={styles.screen} role="region" aria-label="Đang tải">
      <div className={styles.loadingBox} aria-busy="true">
        <div className={styles.spinner} role="status" aria-label="Đang xử lý" />
        <p className={styles.loadingText} aria-live="polite">{loadingText}</p>
        <p className={styles.loadingSub}>AI đang phân tích...</p>
      </div>
    </section>
  );
}
