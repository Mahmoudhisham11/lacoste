"use client";
import SideBar from "@/components/SideBar/page";
import styles from "./styles.module.css";
import { useEffect, useState, useMemo, useCallback } from "react";
import { FaRegTrashAlt } from "react-icons/fa";
import { MdOutlineEdit } from "react-icons/md";
import { FaPlus, FaMinus } from "react-icons/fa6";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  where,
  writeBatch,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/app/firebase";
import dataLayer from "@/lib/DataLayer";

import { GiReceiveMoney } from "react-icons/gi";
import { FaQuestion } from "react-icons/fa";
import { CiSearch } from "react-icons/ci";
import { useRouter } from "next/navigation";
import Loader from "@/components/Loader/Loader";
import { NotificationProvider, useNotification } from "@/contexts/NotificationContext";
import ConfirmModal from "@/components/Main/Modals/ConfirmModal";


function MasrofatContent() {
  const router = useRouter();
  const { success, error: showError, warning } = useNotification();
  const [editingMasrof, setEditingMasrof] = useState(null);
  const [auth, setAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState(false);
  const [isReturnExpense, setIsReturnExpense] = useState(false);
  const [masrof, setMasrof] = useState("");
  const [reason, setReason] = useState("");
  const [shop, setShop] = useState("");
  const [masrofatList, setMasrofatList] = useState([]);
  const [dailySales, setDailySales] = useState(0);
  const [searchReason, setSearchReason] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editMode, setEditMode] = useState("add"); // "add" or "subtract"
  const [showEditModal, setShowEditModal] = useState(false);
  const [editAmount, setEditAmount] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAdmin(localStorage.getItem("role") === "admin");
    }
  }, []);
  // التحقق من تسجيل الدخول
  useEffect(() => {
    const checkAuth = async () => {
      const userName = localStorage.getItem("userName");
      if (!userName) {
        router.push("/");
        return;
      }
      setAuth(true);
      setLoading(false);
    };
    checkAuth();
  }, [router]);


  // ✅ قراءة الـ shop من localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storageShop = localStorage.getItem("shop");
      setShop(storageShop);
    }
  }, []);

  // ✅ جلب المصروفات من Firestore
  useEffect(() => {
    if (!shop) return;

    const q = query(collection(db, "masrofat"), where("shop", "==", shop));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      docs.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });

      setMasrofatList(docs);
      setLoading(false);
    }, (err) => {
      console.error("Error loading masrofat:", err);
      setMasrofatList([]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [shop]);

  // ✅ جلب المبيعات اليومية من Firestore
  useEffect(() => {
    if (!shop) return;

    const q = query(
      collection(db, "dailySales"),
      where("shop", "==", shop)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      snapshot.docs.forEach((doc) => {
        total += Number(doc.data().total || 0);
      });
      setDailySales(total);
    }, (err) => {
      console.error("خطأ أثناء جلب المبيعات اليومية:", err);
      setDailySales(0);
    });

    return () => unsubscribe();
  }, [shop]);

  // Filter by reason
  const filteredMasrofat = useMemo(() => {
    if (!searchReason.trim()) return masrofatList;
    return masrofatList.filter(item =>
      item.reason?.toLowerCase().includes(searchReason.toLowerCase())
    );
  }, [masrofatList, searchReason]);

  useEffect(() => {
    // Reset selection when filtered products change
    setSelectedIds(new Set());
  }, [filteredMasrofat]);

  // إضافة مصروف جديد
  const handleAddMasrof = async () => {
    // في حالة المرتجع، السبب تلقائي
    const finalReason = isReturnExpense ? "فاتورة مرتجع" : reason;
    
    if (!masrof || (!isReturnExpense && !reason)) {
      showError("يرجى ملء كل الحقول");
      return;
    }

    if (!shop) {
      showError("يرجى التأكد من اختيار المتجر");
      return;
    }

    const masrofValue = Number(masrof);
    if (masrofValue <= 0) {
      showError("المبلغ يجب أن يكون أكبر من صفر");
      return;
    }

    const now = new Date();
    const formattedDate = `${now.getDate().toString().padStart(2, "0")}/${(
      now.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${now.getFullYear()}`;

    // التحقق من الرصيد المتاح
    const totalMasrofToday = masrofatList.reduce(
      (acc, item) => acc + Number(item.masrof || 0),
      0
    );
    const availableAmount = dailySales - totalMasrofToday;
    if (masrofValue > availableAmount) {
      showError(
        `❌ الرصيد الحالي غير كافٍ لإضافة هذا المصروف.\nالرصيد المتاح: ${availableAmount.toFixed(2)}\nالمبلغ المطلوب: ${masrofValue.toFixed(2)}`
      );
      return;
    }

    try {
      await dataLayer.add("masrofat", {
        masrof: masrofValue,
        reason: finalReason,
        date: formattedDate,
        shop,
      });
      success("تم إضافة المصروف بنجاح");

      setMasrof("");
      setReason("");
      setActive(false);
      setIsReturnExpense(false);
    } catch (error) {
      console.error("خطأ أثناء الإضافة:", error);
      showError("حدث خطأ أثناء إضافة المصروف");
    }
  };

  // فتح modal التعديل
  const handleOpenEdit = (item) => {
    setEditingMasrof(item);
    setEditAmount("");
    setEditMode("add");
    setShowEditModal(true);
  };

  // تأكيد التعديل
  const handleConfirmEdit = async () => {
    if (!editAmount || Number(editAmount) <= 0) {
      showError("يرجى إدخال مبلغ صحيح");
      return;
    }

    const editValue = Number(editAmount);
    const currentMasrof = Number(editingMasrof.masrof || 0);
    let newMasrof;

    if (editMode === "add") {
      newMasrof = currentMasrof + editValue;
    } else {
      newMasrof = Math.max(0, currentMasrof - editValue);
    }

    // التحقق من الرصيد المتاح
    const totalMasrofToday = masrofatList.reduce(
      (acc, item) => {
        if (item.id === editingMasrof.id) return acc;
        return acc + Number(item.masrof || 0);
      },
      0
    );
    const availableAmount = dailySales - totalMasrofToday;

    if (newMasrof > availableAmount) {
      showError(
        `❌ الرصيد الحالي غير كافٍ.\nالرصيد المتاح: ${availableAmount.toFixed(2)}\nالمبلغ المطلوب بعد التعديل: ${newMasrof.toFixed(2)}`
      );
      return;
    }

    try {
      await dataLayer.update("masrofat", editingMasrof.id, {
        masrof: newMasrof,
      });

      success(
        `تم ${editMode === "add" ? "زيادة" : "خصم"} المصروف بنجاح. المبلغ الجديد: ${newMasrof}`
      );

      setShowEditModal(false);
      setEditingMasrof(null);
      setEditAmount("");
    } catch (error) {
      console.error("خطأ أثناء التعديل:", error);
      showError("حدث خطأ أثناء تعديل المصروف");
    }
  };

  // حذف مصروف واحد
  const handleDeleteSingle = (id) => {
    setSelectedIds(new Set([id]));
    setShowDeleteConfirm(true);
  };

  // حذف متعدد
  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) {
      showError("يرجى تحديد مصروف واحد على الأقل للحذف");
      return;
    }
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (selectedIds.size === 1) {
        const id = Array.from(selectedIds)[0];
        await dataLayer.delete("masrofat", id);
        success("تم حذف المصروف بنجاح");
      } else {
        const deletePromises = Array.from(selectedIds).map(id => dataLayer.delete("masrofat", id));
        await Promise.all(deletePromises);
        success(`تم حذف ${selectedIds.size} مصروف بنجاح`);
      }
      setSelectedIds(new Set());
    } catch (error) {
      console.error("خطأ أثناء الحذف:", error);
      showError("حدث خطأ أثناء حذف المصروفات");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(filteredMasrofat.map(item => item.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectItem = (id, checked) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const isAllSelected = filteredMasrofat.length > 0 && selectedIds.size === filteredMasrofat.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filteredMasrofat.length;

  // حساب إجمالي المصروفات
  const totalMasrof = masrofatList.reduce(
    (acc, item) => acc + Number(item.masrof || 0),
    0
  );

  if (loading) return <Loader />;
  if (!auth) return null;

  return (
    <div className={styles.masrofat}>
      <SideBar />
      <div className={styles.content}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>المصاريف</h2>
          <div className={styles.headerActions}>
            {isAdmin && selectedIds.size > 0 && (
              <button
                onClick={handleDeleteSelected}
                className={styles.deleteSelectedBtn}
                disabled={isDeleting}
              >
                <FaRegTrashAlt />
                حذف المحدد ({selectedIds.size})
              </button>
            )}
            <button
              onClick={() => {
                setActive(!active);
                setIsReturnExpense(false);
                setEditingMasrof(null);
                setMasrof("");
                setReason("");

              }}
              className={styles.addBtn}
            >
              {active ? "إلغاء" : "+ إضافة مصروف"}
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className={styles.summaryCards}>
          <div className={styles.summaryCard}>
            <span className={styles.summaryLabel}>إجمالي المصروفات</span>
            <span className={styles.summaryValue}>
              {totalMasrof.toFixed(2)} EGP
            </span>
          </div>
        </div>

        {/* Search Box */}
        {!active && (
          <div className={styles.searchBox}>
            <div className={styles.searchContainer}>
              <CiSearch className={styles.searchIcon} />
              <input
                type="text"
                placeholder="ابحث عن السبب..."
                value={searchReason}
                onChange={(e) => setSearchReason(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>
        )}

        {/* Form for adding new masrof */}
        {active && (
          <div className={styles.addContainer}>
            <div className={styles.inputBox}>
              <div className="inputContainer">
                <label>
                  <GiReceiveMoney />
                </label>
                <input
                  type="number"
                  placeholder="المبلغ"
                  value={masrof}
                  onChange={(e) => setMasrof(e.target.value)}
                />
              </div>
              {!isReturnExpense && (
                <div className="inputContainer">
                  <label>
                    <FaQuestion />
                  </label>
                  <input
                    type="text"
                    placeholder="السبب"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </div>
              )}
              {isReturnExpense && (
                <div className="inputContainer">
                  <label>
                    <FaQuestion />
                  </label>
                  <input
                    type="text"
                    placeholder="السبب"
                    value="فاتورة مرتجع"
                    disabled
                    style={{ opacity: 0.7, cursor: "not-allowed" }}
                  />
                </div>
              )}
            </div>
            <div className={styles.actionButtonsContainer}>
              <button className={styles.addBtn} onClick={handleAddMasrof}>
                {isReturnExpense ? "إضافة مصروف مرتجع" : "إضافة المصروف"}
              </button>
              {isReturnExpense && (
                <button
                  className={styles.cancelBtn}
                  onClick={() => {
                    setActive(false);
                    setIsReturnExpense(false);
                    setMasrof("");
                    setReason("");
                  }}
                >
                  إلغاء
                </button>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        {!active && (
          <div className={styles.tableWrapper}>
            <table className={styles.masrofatTable}>
              <thead>
                <tr>
                  <th className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isIndeterminate;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className={styles.checkbox}
                    />
                  </th>
                  <th>المصروف</th>
                  <th>السبب</th>
                  <th>التاريخ</th>
                  <th>خيارات</th>
                </tr>
              </thead>
              <tbody>
                {filteredMasrofat.length === 0 ? (
                  <tr>
                    <td colSpan={5} className={styles.emptyCell}>
                      <div className={styles.emptyState}>
                        <p>❌ لا توجد مصروفات</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredMasrofat.map((item, index) => {
                  const uniqueKey = item.id 
                    ? `${item.id}-${item.name || index}`
                    : `masrof-${item.name}-${item.masrof}-${index}`;
                    
                    return (
                    <tr
                      key={uniqueKey}
                      className={selectedIds.has(item.id) ? styles.selectedRow : ""}
                    >
                      <td className={styles.checkboxCell}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={(e) => handleSelectItem(item.id, e.target.checked)}
                          className={styles.checkbox}
                        />
                      </td>
                      <td className={styles.amountCell}>
                        {item.masrof} EGP
                      </td>
                      <td className={styles.reasonCell}>{item.reason}</td>
                      <td className={styles.dateCell}>{item.date}</td>
                      <td className={styles.actionsCell}>
                        <div className={styles.actionButtons}>
                          {isAdmin && (
                            <button
                              className={styles.editBtn}
                              onClick={() => handleOpenEdit(item)}
                              title="تعديل"
                            >
                              <MdOutlineEdit />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              className={styles.deleteBtn}
                              onClick={() => handleDeleteSingle(item.id)}
                              disabled={isDeleting}
                              title="حذف"
                            >
                              <FaRegTrashAlt />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingMasrof && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>تعديل المصروف</h3>
              <button
                className={styles.closeBtn}
                onClick={() => {
                  setShowEditModal(false);
                  setEditingMasrof(null);
                  setEditAmount("");
                }}
              >
                ×
              </button>
            </div>
            <div className={styles.modalContent}>
              <div className={styles.editInfo}>
                <p><strong>المصروف الحالي:</strong> {editingMasrof.masrof} EGP</p>
                <p><strong>السبب:</strong> {editingMasrof.reason}</p>
              </div>
              <div className={styles.editModeSelector}>
                <button
                  className={`${styles.modeBtn} ${editMode === "add" ? styles.modeBtnActive : ""}`}
                  onClick={() => setEditMode("add")}
                >
                  <FaPlus />
                  زيادة
                </button>
                <button
                  className={`${styles.modeBtn} ${editMode === "subtract" ? styles.modeBtnActive : ""}`}
                  onClick={() => setEditMode("subtract")}
                >
                  <FaMinus />
                  خصم
                </button>
              </div>
              <div className={styles.inputBox}>
                <div className="inputContainer">
                  <label>
                    <GiReceiveMoney />
                  </label>
                  <input
                    type="number"
                    placeholder="المبلغ"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
              {editAmount && (
                <div className={styles.preview}>
                  <p>
                    المبلغ الجديد:{" "}
                    <strong>
                      {editMode === "add"
                        ? Number(editingMasrof.masrof || 0) + Number(editAmount || 0)
                        : Math.max(0, Number(editingMasrof.masrof || 0) - Number(editAmount || 0))}{" "}
                      EGP
                    </strong>
                  </p>
                </div>
              )}
              <div className={styles.modalActions}>
                <button
                  className={styles.cancelBtn}
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingMasrof(null);
                    setEditAmount("");
                  }}
                >
                  إلغاء
                </button>
                <button
                  className={styles.confirmBtn}
                  onClick={handleConfirmEdit}
                >
                  تأكيد التعديل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          if (selectedIds.size === 1) {
            setSelectedIds(new Set());
          }
        }}
        title="تأكيد الحذف"
        message={
          selectedIds.size === 1
            ? "هل أنت متأكد أنك تريد حذف هذا المصروف؟"
            : `هل أنت متأكد أنك تريد حذف ${selectedIds.size} مصروف؟`
        }
        onConfirm={confirmDelete}
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
      />
    </div>
  );
}

export default function Masrofat() {
  return (
    <NotificationProvider>
      <MasrofatContent />
    </NotificationProvider>
  );
}
