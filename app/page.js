"use client";
import Image from "next/image";
import styles from "./page.module.css";

export default function Home() { 

  const handlePrint = () => {
    window.print()
  }

  return (
    <main>
      <div className={styles.main}>
        <button onClick={handlePrint}>print</button>
      </div>
    </main>
  );
}
