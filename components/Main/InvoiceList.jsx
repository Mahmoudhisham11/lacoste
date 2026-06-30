"use client";
import styles from "./styles.module.css";
import { useMemo } from "react";

export default function InvoiceList({
  invoices,
  searchTerm,
  onSelect,
  selected,
  formatDate
}) {
  const filteredInvoices = useMemo(() => {
    if (!searchTerm) return invoices;
    return invoices.filter((inv) =>
      inv.invoiceNumber?.toString().includes(searchTerm)
    );
  }, [invoices, searchTerm]);

  const sortedInvoices = useMemo(() => {
    return [...filteredInvoices].sort(
      (a, b) => Number(a.invoiceNumber || 0) - Number(b.invoiceNumber || 0)
    );
  }, [filteredInvoices]);

  return (
    <div className={styles.tableWrapper}>
      <table className={styles.invoiceTable}>
        <thead>
          <tr>
            <th>رقم الفاتورة</th>
            <th>العميل</th>
            <th>رقم الهاتف</th>
            <th>الموظف</th>
            <th>الإجمالي</th>
            <th>التاريخ</th>
          </tr>
        </thead>
        <tbody>
          {sortedInvoices.length === 0 ? (
            <tr>
              <td colSpan={6} className={styles.emptyCell}>
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📄</div>
                  <h3>لا توجد فواتير</h3>
                  <p>لم يتم إنشاء أي فواتير بعد اليوم</p>
                </div>
              </td>
            </tr>
          ) : (
            sortedInvoices.map((invoice, index) => {
              const uniqueKey = invoice.id
                ? `${invoice.id}-${invoice.invoiceNumber || index}`
                : `invoice-${invoice.invoiceNumber}-${invoice.total}-${index}`;

              return (
              <tr
                key={uniqueKey}
                onClick={() => onSelect(invoice)}
                className={`${styles.tableRow} ${
                  selected?.id === invoice.id ? styles.selectedRow : ""
                }`}
              >
                <td className={styles.invoiceCell}>{invoice.invoiceNumber || "بدون رقم"}</td>
                <td className={styles.clientCell}>{invoice.clientName || "بدون اسم"}</td>
                <td className={styles.phoneCell}>{invoice.phone || "-"}</td>
                <td className={styles.employeeCell}>{invoice.employee || "غير محدد"}</td>
                <td className={styles.totalCell}>{invoice.total} جنيه</td>
                <td className={styles.dateCell}>{formatDate(invoice.date)}</td>
              </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
