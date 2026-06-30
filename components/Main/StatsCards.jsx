"use client";
import styles from "./styles.module.css";
import { useMemo, useState, useEffect } from "react";

export default function StatsCards({
  invoices,
  totalMasrofat,
  totalMasrofatWithReturn = totalMasrofat,
}) {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAdmin(localStorage.getItem("role") === "admin");
    }
  }, []);

  const stats = useMemo(() => {
    const totalSales = invoices.reduce((sum, i) => sum + (i.total || 0), 0);

    const finalProfit = invoices.reduce((sum, i) => {
      if (typeof i.profit === "number") return sum + i.profit;
      const calculatedProfit = (i.cart || []).reduce(
        (p, item) =>
          p +
          ((item.sellPrice || 0) - (item.buyPrice || 0)) * (item.quantity || 0),
        0
      );
      return sum + calculatedProfit;
    }, 0);

    const finallyTotal = Number(totalSales) - Number(totalMasrofatWithReturn);

    return {
      totalSales,
      finalProfit,
      finallyTotal,
      netProfit: Number(finalProfit) - Number(totalMasrofat)
    };
    }, [invoices, totalMasrofat, totalMasrofatWithReturn]);

  return (
    <div className={styles.summaryCards}>
      <div className={styles.summaryCard}>
        <span className={styles.summaryLabel}>عدد الفواتير</span>
        <span className={styles.summaryValue}>{invoices.length}</span>
      </div>

      <div className={styles.summaryCard}>
        <span className={styles.summaryLabel}>المبيعات</span>
        <span className={styles.summaryValue}>{stats.totalSales} جنيه</span>
      </div>

      <div className={styles.summaryCard}>
        <span className={styles.summaryLabel}>المصاريف</span>
        <span className={styles.summaryValue}>{totalMasrofatWithReturn} جنيه</span>
      </div>

      <div className={styles.summaryCard}>
        <span className={styles.summaryLabel}>صافي المبيع</span>
        <span className={styles.summaryValue}>{stats.finallyTotal} جنيه</span>
      </div>

      {isAdmin && (
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>الربح</span>
          <span className={styles.summaryValue}>{stats.finalProfit} جنيه</span>
        </div>
      )}

      {isAdmin && (
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>صافي الربح</span>
          <span className={styles.summaryValue}>{stats.netProfit} جنيه</span>
        </div>
      )}
    </div>
  );
}
