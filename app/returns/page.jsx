"use client";
import SideBar from "@/components/SideBar/page";
import styles from "./styles.module.css";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  getDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/app/firebase";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader/Loader";
import {
  NotificationProvider,
  useNotification,
} from "@/contexts/NotificationContext";
import { FaRegTrashAlt } from "react-icons/fa";
import ConfirmModal from "@/components/Main/Modals/ConfirmModal";

function ReturnsContent() {
  const router = useRouter();
  const { success, error: showError, warning } = useNotification();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [returnsList, setReturnsList] = useState([]);
  const [auth, setAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedReturnIds, setSelectedReturnIds] = useState(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAdmin(localStorage.getItem("role") === "admin");
    }
  }, []);

  // Search state
  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const processingReturnsRef = useRef({});
  const debounceRef = useRef(null);

  const shop =
    typeof window !== "undefined" ? localStorage.getItem("shop") : "";

  const toMillis = useCallback((dateField) => {
    if (!dateField) return null;
    if (typeof dateField === "object" && dateField.seconds) {
      return dateField.seconds * 1000;
    }
    if (typeof dateField === "string") {
      try {
        const normalized = dateField.replace(/[٠-٩]/g, (d) =>
          "٠١٢٣٤٥٦٧٨٩".indexOf(d)
        );
        const parts = normalized.split("/").map((p) => p.replace(/[^\d]/g, ""));
        if (parts.length === 3) {
          const [day, month, year] = parts.map(Number);
          const d = new Date(year, month - 1, day);
          if (!isNaN(d.getTime())) return d.getTime();
        }
      } catch {
        return null;
      }
    }
    const d = new Date(dateField);
    return isNaN(d.getTime()) ? null : d.getTime();
  }, []);

  // Auth check
  useEffect(() => {
    const checkLock = async () => {
      if (typeof window === "undefined") return;
      const userName = localStorage.getItem("userName");
      if (!userName) {
        router.push("/");
        return;
      }
      setAuth(true);
      setLoading(false);
    };
    checkLock();
  }, [router, showError]);

  // Fetch returns
  useEffect(() => {
    if (!shop) return;
    const q = query(collection(db, "returns"), where("shop", "==", shop));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const all = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setReturnsList(all);
      },
      (err) => {
        console.error("Error fetching returns:", err);
        showError("حدث خطأ أثناء جلب المرتجعات");
      }
    );
    return () => unsubscribe();
  }, [shop, showError]);

  // Filter returns by date range
  const displayedReturns = useMemo(() => {
    if (!fromDate && !toDate) return returnsList;
    return returnsList.filter((ret) => {
      const retMs = toMillis(ret.returnDate);
      if (!retMs) return false;
      if (fromDate) {
        const from = new Date(fromDate);
        from.setHours(0, 0, 0, 0);
        if (retMs < from.getTime()) return false;
      }
      if (toDate) {
        const to = new Date(toDate);
        to.setHours(23, 59, 59, 999);
        if (retMs > to.getTime()) return false;
      }
      return true;
    });
  }, [returnsList, fromDate, toDate, toMillis]);

  // Live search — debounced
  const performSearch = useCallback(async () => {
    const invoiceNum = searchInvoiceNumber.trim();
    const phone = searchPhone.trim();

    if (!invoiceNum && !phone) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      let results = [];

      if (invoiceNum) {
        const q = query(
          collection(db, "reports"),
          where("shop", "==", shop),
          where("invoiceNumber", "==", Number(invoiceNum))
        );
        const snap = await getDocs(q);
        results = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } else if (phone) {
        const q = query(
          collection(db, "reports"),
          where("shop", "==", shop)
        );
        const snap = await getDocs(q);
        results = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((r) => r.phone?.toString().includes(phone));
      }

      setSearchResults(results);

      if (results.length === 0) {
        warning("⚠️ لم يتم العثور على نتائج");
      }
    } catch (err) {
      console.error("Search error:", err);
      showError("حدث خطأ أثناء البحث");
    } finally {
      setIsSearching(false);
    }
  }, [shop, searchInvoiceNumber, searchPhone, showError, warning]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      performSearch();
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchInvoiceNumber, searchPhone, performSearch]);

  const isSearchActive = searchInvoiceNumber.trim() || searchPhone.trim();

  // Open/close drawer
  const openDrawer = useCallback((report) => {
    setSelectedReport(report);
    setIsDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setSelectedReport(null);
    setIsDrawerOpen(false);
  }, []);

  // Handle return product
  const handleReturnProduct = useCallback(
    async (item, invoiceId) => {
      const itemKey = `${item.code}_${item.color || ""}_${item.size || ""}`;

      if (processingReturnsRef.current[itemKey]) return;
      processingReturnsRef.current[itemKey] = true;
      setIsReturning(true);

      try {
        const today = new Date();
        const formattedDate = `${String(today.getDate()).padStart(2, "0")}/${String(today.getMonth() + 1).padStart(2, "0")}/${today.getFullYear()}`;

        // Restore stock
        const prodQuerySnap = await getDocs(
          query(
            collection(db, "lacosteProducts"),
            where("code", "==", item.code),
            where("shop", "==", item.shop || shop)
          )
        );

        if (!prodQuerySnap.empty) {
          const prodRef = prodQuerySnap.docs[0].ref;
          const prodData = prodQuerySnap.docs[0].data();

          if (item.color && Array.isArray(prodData.colors)) {
            prodData.colors = prodData.colors.map((c) => {
              if (c.color === item.color) {
                if (item.size && Array.isArray(c.sizes)) {
                  c.sizes = c.sizes.map((s) =>
                    s.size === item.size
                      ? { ...s, qty: (s.qty || 0) + Number(item.quantity) }
                      : s
                  );
                } else {
                  c.quantity = (c.quantity || 0) + Number(item.quantity);
                }
              }
              return c;
            });
            await updateDoc(prodRef, { colors: prodData.colors });
          } else if (item.size && Array.isArray(prodData.sizes)) {
            prodData.sizes = prodData.sizes.map((s) =>
              s.size === item.size
                ? { ...s, qty: (s.qty || 0) + Number(item.quantity) }
                : s
            );
            await updateDoc(prodRef, { sizes: prodData.sizes });
          } else if (!item.color && !item.size) {
            await updateDoc(prodRef, {
              quantity: (prodData.quantity || 0) + Number(item.quantity),
            });
          }
        }

        // Look up invoice from reports
        const invoiceRef = doc(db, "reports", invoiceId);
        const invoiceSnap = await getDoc(invoiceRef);

        if (!invoiceSnap.exists()) {
          showError("⚠️ لم يتم العثور على الفاتورة!");
          return;
        }

        const invoiceData = invoiceSnap.data();
        const invoiceDate = invoiceData.date;

        const foundItem = (invoiceData.cart || []).find(
          (p) =>
            p.code === item.code &&
            (p.color || "") === (item.color || "") &&
            (p.size || "") === (item.size || "")
        );

        if (!foundItem) {
          showError("⚠️ لم يتم العثور على المنتج في الفاتورة!");
          return;
        }

        if (item.quantity > foundItem.quantity) {
          showError(
            `⚠️ الكمية المطلوبة (${item.quantity}) أكبر من الكمية في الفاتورة (${foundItem.quantity})`
          );
          return;
        }

        // Reduce quantity or remove from invoice
        const updatedCart = invoiceData.cart
          .map((p) => {
            if (
              p.code === item.code &&
              (p.color || "") === (item.color || "") &&
              (p.size || "") === (item.size || "")
            ) {
              const remaining = p.quantity - item.quantity;
              if (remaining > 0) return { ...p, quantity: remaining };
              return null;
            }
            return p;
          })
          .filter(Boolean);

        if (updatedCart.length > 0) {
          const newTotal = updatedCart.reduce(
            (sum, p) => sum + (p.sellPrice * p.quantity || 0),
            0
          );
          const newProfit = updatedCart.reduce(
            (sum, p) =>
              sum + (p.sellPrice - (p.buyPrice || 0)) * (p.quantity || 1),
            0
          );

          await updateDoc(invoiceRef, {
            cart: updatedCart,
            total: newTotal,
            profit: newProfit,
          });

          setSelectedReport((prev) =>
            prev ? { ...prev, cart: updatedCart, total: newTotal, profit: newProfit } : prev
          );
        } else {
          await deleteDoc(invoiceRef);
          setSelectedReport(null);
          setIsDrawerOpen(false);
        }

        const itemTotalPrice =
          Number(item.sellPrice || 0) * Number(item.quantity || 0);
        const itemProfit =
          (Number(item.sellPrice || 0) - Number(item.buyPrice || 0)) *
          Number(item.quantity || 0);

        // Record in today's expenses
        await addDoc(collection(db, "masrofat"), {
          name: item.name,
          masrof: itemTotalPrice,
          profit: itemProfit,
          reason: "فاتورة مرتجع",
          date: formattedDate,
          shop: item.shop || shop,
        });

        // Record in returns history
        await addDoc(collection(db, "returns"), {
          originalInvoiceId: invoiceId,
          originalDate: invoiceDate || formattedDate,
          returnDate: formattedDate,
          item: item,
          shop: item.shop || shop,
        });

        success(`✅ تم إرجاع ${item.name} بنجاح!`);
      } catch (error) {
        console.error("خطأ أثناء الإرجاع:", error);
        showError("❌ حدث خطأ أثناء إرجاع المنتج");
      } finally {
        delete processingReturnsRef.current[itemKey];
        setIsReturning(false);
      }
    },
    [shop, success, showError]
  );

  // Select / delete returns
  const handleSelectAllReturns = useCallback(
    (checked) => {
      if (checked) {
        setSelectedReturnIds(new Set(displayedReturns.map((ret) => ret.id)));
      } else {
        setSelectedReturnIds(new Set());
      }
    },
    [displayedReturns]
  );

  const handleSelectReturnItem = useCallback(
    (id, checked) => {
      const newSelected = new Set(selectedReturnIds);
      if (checked) newSelected.add(id);
      else newSelected.delete(id);
      setSelectedReturnIds(newSelected);
    },
    [selectedReturnIds]
  );

  const handleDeleteSelectedReturns = useCallback(async () => {
    setIsDeleting(true);
    try {
      const batchInstance = writeBatch(db);
      selectedReturnIds.forEach((id) => {
        const docRef = doc(db, "returns", id);
        batchInstance.delete(docRef);
      });
      await batchInstance.commit();
      success(`تم حذف ${selectedReturnIds.size} مرتجع بنجاح`);
      setSelectedReturnIds(new Set());
    } catch (err) {
      console.error("Error deleting returns:", err);
      showError("حدث خطأ أثناء حذف المرتجعات");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  }, [selectedReturnIds, success, showError]);

  const isAllReturnsSelected =
    displayedReturns.length > 0 &&
    selectedReturnIds.size === displayedReturns.length;
  const isIndeterminateReturns =
    selectedReturnIds.size > 0 &&
    selectedReturnIds.size < displayedReturns.length;

  if (loading) return <Loader />;
  if (!auth) return null;

  return (
    <div className={styles.reports}>
      <SideBar />

      <div className={styles.content}>
        <div className={styles.header}>
          <h2 className={styles.title}>المرتجعات</h2>
        </div>

        {/* Search + Date Filters */}
        <div className={styles.searchBox}>
          <div className={styles.inputContainer}>
            <label className={styles.searchLabel}>رقم الفاتورة:</label>
            <input
              type="text"
              placeholder="ابحث برقم الفاتورة"
              value={searchInvoiceNumber}
              onChange={(e) => setSearchInvoiceNumber(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.inputContainer}>
            <label className={styles.searchLabel}>رقم العميل:</label>
            <input
              type="text"
              placeholder="ابحث برقم الهاتف"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          {!isSearchActive && (
            <>
              <div className={styles.inputContainer}>
                <label className={styles.dateLabel}>من تاريخ:</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className={styles.dateInput}
                />
              </div>
              <div className={styles.inputContainer}>
                <label className={styles.dateLabel}>إلى تاريخ:</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className={styles.dateInput}
                />
              </div>
            </>
          )}
          <div className={styles.headerActions}>
            {isAdmin && !isSearchActive && selectedReturnIds.size > 0 && (
              <button
                className={styles.deleteSelectedBtn}
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
              >
                <FaRegTrashAlt />
                حذف المحدد ({selectedReturnIds.size})
              </button>
            )}
          </div>
        </div>

        {/* Single Table */}
        <div className={styles.tableWrapper}>
          {isSearchActive ? (
            /* Search Results */
            <table className={styles.reportsTable}>
              <thead>
                <tr>
                  <th>رقم الفاتورة</th>
                  <th>اسم العميل</th>
                  <th>رقم الهاتف</th>
                  <th>الإجمالي</th>
                  <th>التاريخ</th>
                  <th>عرض التفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={styles.emptyCell}>
                      <div className={styles.emptyState}>
                        <p>{isSearching ? "جاري البحث..." : "❌ لا توجد نتائج"}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  searchResults.map((report, idx) => {
                    const total = Number(report.total ?? 0);
                    const dateMs = report.date?.seconds
                      ? report.date.seconds * 1000
                      : Date.now();
                    return (
                      <tr key={`search-${report.id || idx}`}>
                        <td>{report.invoiceNumber || "-"}</td>
                        <td>{report.clientName || "-"}</td>
                        <td>{report.phone || "-"}</td>
                        <td>{total.toFixed(2)} EGP</td>
                        <td>{new Date(dateMs).toLocaleDateString("ar-EG")}</td>
                        <td>
                          <button
                            className={styles.detailsBtn}
                            onClick={() => openDrawer(report)}
                          >
                            عرض التفاصيل
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          ) : (
            /* Returns History */
            <table className={styles.reportsTable}>
              <thead>
                <tr>
                  <th className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={isAllReturnsSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isIndeterminateReturns;
                      }}
                      onChange={(e) => handleSelectAllReturns(e.target.checked)}
                      className={styles.checkbox}
                    />
                  </th>
                  <th>الكود</th>
                  <th>المنتج</th>
                  <th>الكمية</th>
                  <th>سعر البيع</th>
                  <th>تاريخ الفاتورة الأصلية</th>
                  <th>تاريخ المرتجع</th>
                </tr>
              </thead>
              <tbody>
                {displayedReturns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={styles.emptyCell}>
                      <div className={styles.emptyState}>
                        <p>❌ لا توجد مرتجعات في الفترة المحددة</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  displayedReturns.map((ret, index) => {
                    const origMs = toMillis(ret.originalDate);
                    const origDateStr = origMs
                      ? new Date(origMs).toLocaleDateString("ar-EG")
                      : ret.originalDate || "-";
                    const retMs = toMillis(ret.returnDate);
                    const retDateStr = retMs
                      ? new Date(retMs).toLocaleDateString("ar-EG")
                      : ret.returnDate || "-";

                    return (
                      <tr
                        key={`return-${ret.id || `index-${index}`}`}
                        className={
                          selectedReturnIds.has(ret.id)
                            ? styles.selectedRow
                            : ""
                        }
                      >
                        <td className={styles.checkboxCell}>
                          <input
                            type="checkbox"
                            checked={selectedReturnIds.has(ret.id)}
                            onChange={(e) =>
                              handleSelectReturnItem(ret.id, e.target.checked)
                            }
                            className={styles.checkbox}
                          />
                        </td>
                        <td className={styles.codeCell}>{ret.item?.code || "-"}</td>
                        <td className={styles.nameCell}>{ret.item?.name || "-"}</td>
                        <td className={styles.quantityCell}>{ret.item?.quantity || "-"}</td>
                        <td className={styles.priceCell}>{ret.item?.sellPrice || "-"} EGP</td>
                        <td className={styles.dateCell}>{origDateStr}</td>
                        <td className={styles.dateCell}>{retDateStr}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Invoice Drawer */}
      {isDrawerOpen && selectedReport && (
        <div className={styles.invoiceSidebar}>
          <div className={styles.sidebarHeader}>
            <h3>تفاصيل الفاتورة</h3>
            <button className={styles.closeBtn} onClick={closeDrawer}>×</button>
          </div>
          <div className={styles.sidebarInfo}>
            <p><strong>رقم الفاتورة:</strong> {selectedReport.invoiceNumber || "-"}</p>
            <p><strong>اسم العميل:</strong> {selectedReport.clientName || "-"}</p>
            <p><strong>رقم الهاتف:</strong> {selectedReport.phone || "-"}</p>
            <p><strong>طريقة الدفع:</strong>{" "}
              {selectedReport.paymentMethod === "wallet" ? "محفظة" : "نقدي"}
            </p>
            {selectedReport.paymentMethod === "wallet" && selectedReport.walletNumber && (
              <p><strong>رقم المحفظة:</strong> {selectedReport.walletNumber}</p>
            )}
            <p><strong>الموظف:</strong> {selectedReport.employee || "-"}</p>
            <p><strong>التاريخ:</strong>{" "}
              {selectedReport.date
                ? new Date(selectedReport.date.seconds * 1000).toLocaleString("ar-EG")
                : "-"}
            </p>
            {isAdmin && <p><strong>الربح:</strong> {selectedReport.profit ?? "-"} EGP</p>}
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
                    <th>إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReport.cart?.map((item, index) => (
                    <tr key={index}>
                      <td className={styles.codeCell}>{item.code || "-"}</td>
                      <td className={styles.nameCell}>
                        {item.name || "-"}
                        {item.color ? ` - ${item.color}` : ""}
                        {item.size ? ` - ${item.size}` : ""}
                      </td>
                      <td className={styles.priceCell}>{item.sellPrice || "-"} EGP</td>
                      <td className={styles.quantityCell}>{item.quantity || "-"}</td>
                      <td className={styles.actionsCell}>
                        <button
                          className={styles.returnBtn}
                          onClick={() => handleReturnProduct(item, selectedReport.id)}
                          disabled={isReturning}
                        >
                          {isReturning ? "جاري الإرجاع..." : "مرتجع"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="تأكيد الحذف"
        message={`هل أنت متأكد أنك تريد حذف ${selectedReturnIds.size} مرتجع؟`}
        onConfirm={handleDeleteSelectedReturns}
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
      />
    </div>
  );
}

export default function Returns() {
  return (
    <NotificationProvider>
      <ReturnsContent />
    </NotificationProvider>
  );
}
