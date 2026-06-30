"use client";
import styles from "../styles.module.css";
import { useState, useEffect } from "react";
import { FaUser, FaPhone, FaWallet, FaMoneyBillWave } from "react-icons/fa";

export default function ClientModal({
  isOpen,
  onClose,
  onSave,
  isSaving,
}) {
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [walletNumber, setWalletNumber] = useState("");

  useEffect(() => {
    if (isOpen) {
      setClientName("");
      setPhone("");
      setPaymentMethod("cash");
      setWalletNumber("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({ clientName, phone, paymentMethod, walletNumber });
  };

  return (
    <div className={styles.popupOverlay} onClick={onClose}>
      <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
        <h3>إضافة بيانات العميل</h3>
        
        <div className={styles.popupBoxContent}>
          <div className={styles.priceInput}>
            <label>
              <FaUser style={{ marginLeft: "8px", color: "var(--main-color)" }} />
              اسم العميل
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="اكتب اسم العميل"
              className={styles.modalInput}
              disabled={isSaving}
            />
          </div>

          <div className={styles.priceInput}>
            <label>
              <FaPhone style={{ marginLeft: "8px", color: "var(--main-color)" }} />
              رقم الهاتف
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="اكتب رقم الهاتف"
              className={styles.modalInput}
              disabled={isSaving}
            />
          </div>

          <div className={styles.priceInput}>
            <label>
              <FaMoneyBillWave style={{ marginLeft: "8px", color: "var(--main-color)" }} />
              طريقة الدفع
            </label>
            <div className={styles.paymentMethods}>
              <label className={styles.paymentLabel}>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "cash"}
                  onChange={() => setPaymentMethod("cash")}
                  disabled={isSaving}
                />
                <span>نقدي</span>
              </label>
              <label className={styles.paymentLabel}>
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "wallet"}
                  onChange={() => setPaymentMethod("wallet")}
                  disabled={isSaving}
                />
                <FaWallet style={{ marginLeft: 4 }} />
                <span>محفظة</span>
              </label>
            </div>
          </div>

          {paymentMethod === "wallet" && (
            <div className={styles.priceInput}>
              <label>
                <FaWallet style={{ marginLeft: "8px", color: "var(--main-color)" }} />
                رقم المحفظة
              </label>
              <input
                type="text"
                value={walletNumber}
                onChange={(e) => setWalletNumber(e.target.value)}
                placeholder="اكتب رقم المحفظة"
                className={styles.modalInput}
                disabled={isSaving}
              />
            </div>
          )}
        </div>

        <div className={styles.popupBoxFooter}>
          <div className={styles.popupBtns}>
            <button 
              onClick={onClose} 
              disabled={isSaving}
              className={styles.cancelBtn}
            >
              إلغاء
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className={styles.addBtn}
            >
              {isSaving ? (
                <>
                  <span className={styles.spinner}></span>
                  جاري الحفظ...
                </>
              ) : (
                "حفظ"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
