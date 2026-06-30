"use client";
import { useState, useEffect } from "react";
import styles from "./styles.module.css";
import { IoIosCloseCircle } from "react-icons/io";

export default function InvoiceDetails({
  invoice,
  onClose,
  onPrint,
  onReturn,
  returningItemsState,
}) {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsAdmin(localStorage.getItem("role") === "admin");
    }
  }, []);
  const [returnQtys, setReturnQtys] = useState({});
  if (!invoice) return null;

  const formatDate = (date) => {
    if (!date) return "";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString("ar-EG", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  return (
    <div className={styles.invoiceSidebar}>
      <div className={styles.sidebarHeader}>
        <h4>فاتورة العميل</h4>
        <button onClick={onClose} className={styles.closeBtn}>
          <IoIosCloseCircle size={22} />
        </button>
      </div>

      <button
        onClick={() => onPrint(invoice.invoiceNumber)}
        className={styles.printBtn}
      >
        🖨️ طباعة فاتورة
      </button>

      <div className={styles.sidebarInfo}>
        <p>
          <strong>👤 العميل:</strong> {invoice.clientName || "بدون اسم"}
        </p>
        <p>
          <strong>📞 الهاتف:</strong> {invoice.phone || "-"}
        </p>
        <p>
          <strong>💳 طريقة الدفع:</strong>{" "}
          {invoice.paymentMethod === "wallet" ? "محفظة" : "نقدي"}
        </p>
        {invoice.paymentMethod === "wallet" && invoice.walletNumber && (
          <p>
            <strong>🔢 رقم المحفظة:</strong> {invoice.walletNumber}
          </p>
        )}
        <p>
          <strong>💼 الموظف:</strong> {invoice.employee || "غير محدد"}
        </p>
        <p>
          <strong>🕒 التاريخ:</strong> {formatDate(invoice.date)}
        </p>

        {isAdmin && invoice.profit !== undefined && (
          <p>
            <strong>📈 ربح الفاتورة:</strong> {invoice.profit} جنيه
          </p>
        )}

        {invoice.discount > 0 && (
          <p>
            <strong>🔖 الخصم:</strong> {invoice.discount} جنيه
            {invoice.discountNotes ? ` (ملاحظة: ${invoice.discountNotes})` : ""}
          </p>
        )}

        <p>
          <strong>💰 الإجمالي:</strong> {invoice.total} جنيه
        </p>
      </div>

      <div className={styles.sidebarProducts}>
        <h5>المنتجات</h5>
        <table>
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
            {invoice.cart?.map((item, idx) => {
              const itemKey = `${item.code}_${item.color || ""}_${
                item.size || ""
              }`;
              const isReturning = returningItemsState[itemKey];

              return (
                <tr key={idx}>
                  <td>{item.code}</td>
                  <td>
                    {item.name}
                    {item.color ? ` - ${item.color}` : ""}{" "}
                    {item.size ? ` - ${item.size}` : ""}
                  </td>
                  <td>{item.sellPrice}</td>
                  <td>{item.quantity}</td>
                  <td>
                    <div className={styles.returnCell}>
                      {item.quantity > 1 && (
                        <input
                          type="number"
                          min="1"
                          max={item.quantity}
                          value={Math.min(
                            returnQtys[itemKey] ?? item.quantity,
                            item.quantity
                          )}
                          onChange={(e) => {
                            const val = Math.min(
                              Math.max(1, Number(e.target.value) || 1),
                              item.quantity
                            );
                            setReturnQtys((prev) => ({
                              ...prev,
                              [itemKey]: val,
                            }));
                          }}
                          className={styles.returnQtyInput}
                          disabled={isReturning}
                        />
                      )}
                      <button
                        className={styles.returnBtn}
                        disabled={isReturning}
                        onClick={() => {
                          const qty =
                            returnQtys[itemKey] || item.quantity;
                          onReturn({ ...item, quantity: qty });
                        }}
                      >
                        {isReturning ? "جاري التنفيذ..." : "مرتجع"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
