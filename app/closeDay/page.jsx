"use client";
import SideBar from "@/components/SideBar/page";
import styles from "./styles.module.css";
import { useEffect, useState, useMemo, useCallback } from "react";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/app/firebase";
import Loader from "@/components/Loader/Loader";
import { NotificationProvider, useNotification } from "@/contexts/NotificationContext";

function CloseDayContent() {
  const { error: showError } = useNotification();
  const [dateISO, setDateISO] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });
  const [sessions, setSessions] = useState([]);
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showSales, setShowSales] = useState(true);
  const [shop, setShop] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const shopValue = localStorage.getItem("shop") || "";
      setShop(shopValue);
    }
  }, []);

  const toDDMMYYYY = useCallback((isoDate) => {
    if (!isoDate) return "";
    try {
      const [y, m, d] = isoDate.split("-");
      if (!y || !m || !d) return "";
      return `${d}/${m}/${y}`;
    } catch {
      return "";
    }
  }, []);

  useEffect(() => {
    if (!shop) return;

    const ddmmyyyy = toDDMMYYYY(dateISO);
    if (!ddmmyyyy) return;

    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        const reportsQuery = query(
          collection(db, "reports"),
          where("closedAt", "==", ddmmyyyy),
          where("shop", "==", shop)
        );
        const reportsSnap = await getDocs(reportsQuery);
        const reports = reportsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const expensesQuery = query(
          collection(db, "expensesReports"),
          where("closedAt", "==", ddmmyyyy),
          where("shop", "==", shop)
        );
        const expensesSnap = await getDocs(expensesQuery);
        const expenses = expensesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

        // Group by closeSessionId
        const sessionMap = {};
        for (const report of reports) {
          const sid = report.closeSessionId || "unknown";
          if (!sessionMap[sid]) sessionMap[sid] = { id: sid, reports: [], expenses: [], closedAt: report.closedAt, closedBy: report.closedBy, closedAtTimestamp: report.closedAtTimestamp };
          sessionMap[sid].reports.push(report);
        }
        for (const expense of expenses) {
          const sid = expense.closeSessionId || "unknown";
          if (!sessionMap[sid]) sessionMap[sid] = { id: sid, reports: [], expenses: [], closedAt: expense.closedAt, closedBy: expense.closedBy, closedAtTimestamp: expense.closedAtTimestamp };
          sessionMap[sid].expenses.push(expense);
        }

        const sessionsArr = Object.values(sessionMap);
        sessionsArr.sort((a, b) => {
          const ta = a.closedAtTimestamp?.toDate ? a.closedAtTimestamp.toDate().getTime() : 0;
          const tb = b.closedAtTimestamp?.toDate ? b.closedAtTimestamp.toDate().getTime() : 0;
          return ta - tb;
        });

        setSessions(sessionsArr);
        setSelectedSessionIndex(sessionsArr.length ? 0 : -1);
      } catch (err) {
        console.error("Error fetching close data:", err);
        setError("حدث خطأ أثناء جلب البيانات");
        showError("حدث خطأ أثناء جلب بيانات التقفيلات");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateISO, shop, toDDMMYYYY, showError]);

  const selectedSession = sessions[selectedSessionIndex] || null;

  const totals = useMemo(() => {
    if (!selectedSession) return { totalSales: 0, totalExpenses: 0, net: 0 };

    const totalSales = (selectedSession.reports || []).reduce((sum, s) => {
      const v = Number(s.total ?? s.sum ?? 0);
      return sum + (isNaN(v) ? 0 : v);
    }, 0);

    const totalExpenses = (selectedSession.expenses || []).reduce((sum, m) => {
      const v = Number(m.masrof ?? m.amount ?? 0);
      return sum + (isNaN(v) ? 0 : v);
    }, 0);

    const net = totalSales - totalExpenses;
    return { totalSales, totalExpenses, net };
  }, [selectedSession]);

  const renderSalesRows = useCallback(
    (reportsArr) => {
      if (!Array.isArray(reportsArr) || reportsArr.length === 0) {
        return (
          <tr>
            <td colSpan={5} className={styles.emptyCell}>
              <div className={styles.emptyState}>
                <p>❌ لا توجد مبيعات في هذه التقفيلة</p>
              </div>
            </td>
          </tr>
        );
      }

      return reportsArr.map((sale, index) => {
        const invoice = sale.invoiceNumber ?? sale.id ?? `sale-${index}`;
        const total = sale.total ?? sale.subtotal ?? 0;
        const employee = sale.employee ?? sale.closedBy ?? "-";
        const date = sale.date?.toDate
          ? sale.date.toDate().toLocaleString("ar-EG")
          : sale.date
          ? String(sale.date)
          : "-";

        let timeStr = "-";
        if (sale.date) {
          if (sale.date.toDate) {
            timeStr = sale.date.toDate().toLocaleTimeString("ar-EG");
          } else if (sale.date.seconds) {
            timeStr = new Date(sale.date.seconds * 1000).toLocaleTimeString("ar-EG");
          } else if (typeof sale.date === "string") {
            timeStr = new Date(sale.date).toLocaleTimeString("ar-EG");
          } else if (sale.date instanceof Date) {
            timeStr = sale.date.toLocaleTimeString("ar-EG");
          } else {
            timeStr = String(sale.date);
          }
        }

        return (
          <tr
            key={sale.id || invoice}
            onClick={() => setSelectedInvoice(sale)}
            className={`${styles.tableRow} ${selectedInvoice?.id === sale.id ? styles.selectedRow : ""}`}
          >
            <td className={styles.invoiceCell}>{invoice}</td>
            <td className={styles.employeeCell}>{employee}</td>
            <td className={styles.dateCell}>{timeStr}</td>
            <td className={styles.productsCell}>
              {sale.cart ? sale.cart.map((i) => i.name).join(", ") : "-"}
            </td>
            <td className={styles.totalCell}>{total.toFixed(2)} EGP</td>
          </tr>
        );
      });
    },
    [selectedInvoice]
  );

  const renderExpenseRows = useCallback((expensesArr) => {
    if (!Array.isArray(expensesArr) || expensesArr.length === 0) {
      return (
        <tr>
          <td colSpan={4} className={styles.emptyCell}>
            <div className={styles.emptyState}>
              <p>❌ لا توجد مصاريف في هذه التقفيلة</p>
            </div>
          </td>
        </tr>
      );
    }

    return expensesArr.map((m, index) => {
      const id = m.id || `expense-${index}-${m.reason || ""}`;
      const date = m.date?.toDate ? m.date.toDate().toLocaleString("ar-EG") : m.date ?? "-";
      const amount = m.masrof ?? m.amount ?? 0;
      const reason = m.reason ?? "-";
      const shopName = m.shop ?? "-";
      return (
        <tr key={id} className={styles.tableRow}>
          <td className={styles.reasonCell}>{reason}</td>
          <td className={styles.shopCell}>{shopName}</td>
          <td className={styles.dateCell}>{date}</td>
          <td className={styles.amountCell}>{amount.toFixed(2)} EGP</td>
        </tr>
      );
    });
  }, []);

  const closeDrawer = useCallback(() => {
    setSelectedInvoice(null);
  }, []);

  if (loading && sessions.length === 0) return <Loader />;

  return (
    <div className={styles.closeDay}>
      <SideBar />
      <div className={styles.content}>
        <div className={styles.header}>
          <h2 className={styles.title}>تقرير تقفيلات اليوم</h2>
        </div>

        <div className={styles.controls}>
          <div className={styles.controlsLeft}>
            <label className={styles.dateLabel}>بحث بالتاريخ:</label>
            <input
              type="date"
              value={dateISO}
              onChange={(e) => setDateISO(e.target.value)}
              className={styles.dateInput}
            />
          </div>
          <div className={styles.loadingInfo}>
            {loading ? (
              <span className={styles.loadingText}>جارٍ التحميل...</span>
            ) : (
              <span className={styles.countText}>
                {sessions.length} {sessions.length === 1 ? "تقفيلة" : "تقفيلات"}
              </span>
            )}
          </div>
        </div>

        <div className={styles.cardsContainer}>
          {sessions.length === 0 ? (
            <div className={styles.emptyCard}>
              <p>لا توجد تقفيلات لهذا التاريخ</p>
            </div>
          ) : (
            sessions.map((s, idx) => {
              let timeLabel = "-";
              if (s.closedAtTimestamp) {
                if (s.closedAtTimestamp.toDate) {
                  timeLabel = s.closedAtTimestamp.toDate().toLocaleTimeString("ar-EG");
                } else if (typeof s.closedAtTimestamp === "string") {
                  timeLabel = new Date(s.closedAtTimestamp).toLocaleTimeString("ar-EG");
                } else if (s.closedAtTimestamp.seconds) {
                  timeLabel = new Date(s.closedAtTimestamp.seconds * 1000).toLocaleTimeString("ar-EG");
                }
              } else if (s.closedAt) {
                timeLabel = s.closedAt;
              }
              const closedBy = s.closedBy ?? "-";
              const isSelected = idx === selectedSessionIndex;
              const uniqueKey = s.id || `session-${idx}`;
              const saleCount = (s.reports || []).length;
              const expenseCount = (s.expenses || []).length;
              return (
                <div
                  key={uniqueKey}
                  onClick={() => setSelectedSessionIndex(idx)}
                  className={`${styles.card} ${isSelected ? styles.selectedCard : ""}`}
                >
                  <div className={styles.cardTime}>{timeLabel}</div>
                  <div className={styles.cardBy}>بواسطة: {closedBy}</div>
                  <div className={styles.cardBy}>{saleCount} فواتير | {expenseCount} مصروفات</div>
                </div>
              );
            })
          )}
        </div>

        {selectedSession && (
          <div className={styles.summaryCards}>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>إجمالي المبيعات</span>
              <span className={styles.summaryValue}>{totals.totalSales.toFixed(2)} EGP</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>إجمالي المصروفات</span>
              <span className={styles.summaryValue}>{totals.totalExpenses.toFixed(2)} EGP</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>صافي المبيعات</span>
              <span className={styles.summaryValue}>{totals.net.toFixed(2)} EGP</span>
            </div>
            <div className={styles.summaryCard}>
              <span className={styles.summaryLabel}>قفل بواسطة</span>
              <span className={styles.summaryValue}>{selectedSession.closedBy ?? "-"}</span>
            </div>
          </div>
        )}

        <div className={styles.toggleButtons}>
          <button
            onClick={() => setShowSales(true)}
            className={`${styles.toggleBtn} ${showSales ? styles.toggleBtnActive : ""}`}
          >
            عرض المبيعات
          </button>
          <button
            onClick={() => setShowSales(false)}
            className={`${styles.toggleBtn} ${!showSales ? styles.toggleBtnActive : ""}`}
          >
            عرض المصروفات
          </button>
          <div className={styles.toggleInfo}>
            {selectedSession
              ? `عرض ${showSales ? "المبيعات" : "المصاريف"} للتقفيلة المختارة`
              : ""}
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.closeDayTable}>
            <thead>
              {showSales ? (
                <tr>
                  <th>فاتورة / ID</th>
                  <th>الموظف</th>
                  <th>الوقت</th>
                  <th>المنتجات</th>
                  <th>الإجمالي</th>
                </tr>
              ) : (
                <tr>
                  <th>السبب</th>
                  <th>المحل</th>
                  <th>الوقت</th>
                  <th>المبلغ</th>
                </tr>
              )}
            </thead>
            <tbody>
              {!selectedSession ? (
                <tr>
                  <td colSpan={showSales ? 5 : 4} className={styles.emptyCell}>
                    <div className={styles.emptyState}>
                      <p>اختر تقفيلة لعرض البيانات</p>
                    </div>
                  </td>
                </tr>
              ) : showSales ? (
                renderSalesRows(selectedSession.reports || [])
              ) : (
                renderExpenseRows(selectedSession.expenses || [])
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedInvoice && (
        <div className={styles.invoiceSidebar}>
          <div className={styles.sidebarHeader}>
            <h3>تفاصيل الفاتورة</h3>
            <button className={styles.closeBtn} onClick={closeDrawer}>×</button>
          </div>
          <div className={styles.sidebarInfo}>
            <p><strong>اسم العميل:</strong> {selectedInvoice.clientName || "-"}</p>
            <p><strong>رقم الهاتف:</strong> {selectedInvoice.phone || "-"}</p>
            <p><strong>طريقة الدفع:</strong>{" "}
              {selectedInvoice.paymentMethod === "wallet" ? "محفظة" : "نقدي"}
            </p>
            {selectedInvoice.paymentMethod === "wallet" && selectedInvoice.walletNumber && (
              <p><strong>رقم المحفظة:</strong> {selectedInvoice.walletNumber}</p>
            )}
            <p><strong>الموظف:</strong> {selectedInvoice.employee || "-"}</p>
            <p><strong>التاريخ:</strong>{" "}
              {selectedInvoice.date?.seconds
                ? new Date(selectedInvoice.date.seconds * 1000).toLocaleString("ar-EG")
                : selectedInvoice.date
                ? String(selectedInvoice.date)
                : "-"}
            </p>
          </div>
          <div className={styles.sidebarProducts}>
            <h5>المنتجات</h5>
            <div className={styles.sidebarTableWrapper}>
              <table className={styles.sidebarTable}>
                <thead>
                  <tr>
                    <th>الكود</th>
                    <th>المنتج</th>
                    <th>السعر</th>
                    <th>الكمية</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.cart?.map((item, index) => (
                    <tr key={`${item.code || index}-${index}`}>
                      <td className={styles.codeCell}>{item.code || "-"}</td>
                      <td className={styles.nameCell}>
                        {item.name || "-"}
                        {item.color ? ` - ${item.color}` : ""}
                        {item.size ? ` - ${item.size}` : ""}
                      </td>
                      <td className={styles.priceCell}>{item.sellPrice || "-"} EGP</td>
                      <td className={styles.quantityCell}>{item.quantity || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CloseDay() {
  return (
    <NotificationProvider>
      <CloseDayContent />
    </NotificationProvider>
  );
}
