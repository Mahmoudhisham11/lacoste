'use client';
import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import Image from "next/image";
import resetImage from "../../public/images/logo.png";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/app/firebase";

function Resete() {
  const router = useRouter();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        const stored = localStorage.getItem("lastInvoice");
        if (stored) {
          const parsed = JSON.parse(stored);
          setInvoice(parsed);
          setLoading(false);
          return;
        }

        const storedInvoiceNum = localStorage.getItem("lastInvoiceNumber");
        const shop = localStorage.getItem("shop");
        if (storedInvoiceNum && shop) {
          const q = query(
            collection(db, "dailySales"),
            where("invoiceNumber", "==", Number(storedInvoiceNum)),
            where("shop", "==", shop)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const data = { id: snap.docs[0].id, ...snap.docs[0].data() };
            setInvoice(data);
          }
        }
      } catch (err) {
        console.error("Error loading invoice:", err);
      } finally {
        setLoading(false);
      }
    };
    loadInvoice();
  }, []);

  const handlePrint = () => {
    if (!invoice) {
      alert("لا توجد فاتورة للطباعة.");
      return;
    }
    window.print();
  };

  if (loading) return <div className={styles.resete}><p>جاري تحميل الفاتورة...</p></div>;
  if (!invoice) return <div className={styles.resete}><p>لا توجد فاتورة لعرضها.</p></div>;

  const invoiceDate = invoice.date?.seconds
    ? new Date(invoice.date.seconds * 1000).toLocaleDateString("ar-EG")
    : invoice.date
    ? new Date(invoice.date).toLocaleDateString("ar-EG")
    : new Date().toLocaleDateString("ar-EG");

  const itemCount = invoice.cart?.length || 0;

  return (
    <div className={styles.resete}>
      <div className={styles.invoice}>
        <div className={styles.headerRow}>
          <button onClick={() => router.push('/')} className={styles.btnBack}>رجوع</button>
          <div className={styles.logoWrap}>
            <div className={styles.imageContainer}>
              <Image src={resetImage} fill style={{ objectFit: 'cover' }} alt="logo" />
            </div>
          </div>
        </div>

        <div className={styles.divider}></div>

        <div className={styles.info}>
          <p><strong>التاريخ:</strong> {invoiceDate}</p>
          <p><strong>رقم الفاتورة:</strong> {invoice.invoiceNumber}</p>
          <p><strong>العميل:</strong> {invoice.clientName || "بدون اسم"}</p>
          <p><strong>الهاتف:</strong> {invoice.phone || "-"}</p>
          {invoice.employee && <p><strong>الموظف:</strong> {invoice.employee}</p>}
          <p><strong>طريقة الدفع:</strong> {invoice.paymentMethod === "wallet" ? "محفظة" : "نقدي"}{invoice.paymentMethod === "wallet" && invoice.walletNumber ? ` (${invoice.walletNumber})` : ""}</p>
        </div>

        <div className={styles.divider}></div>

        <table>
          <thead>
            <tr>
              <th>الرمز</th>
              <th>المنتج</th>
              <th>الكمية</th>
              <th>السعر</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {invoice.cart?.map((item, idx) => (
              <tr key={item.code ? item.code + idx : idx}>
                <td>{item.code || "-"}</td>
                <td>{item.name}{item.color ? ` - ${item.color}` : ""}{item.size ? ` - ${item.size}` : ""}</td>
                <td>{item.quantity}</td>
                <td>{Number(item.sellPrice).toFixed(2)}</td>
                <td>{(item.total || item.sellPrice * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className={styles.totalRow}>
              <td colSpan={4} style={{ textAlign: 'left' }}>الإجمالي:</td>
              <td>{Number(invoice.total).toFixed(2)}</td>
            </tr>
            {invoice.discount > 0 && (
              <>
                <tr>
                  <td colSpan={4} style={{ textAlign: 'left' }}>الخصم:</td>
                  <td>{Number(invoice.discount).toFixed(2)}</td>
                </tr>
                <tr>
                  <td colSpan={4} style={{ textAlign: 'left' }}>الإجمالي بعد الخصم:</td>
                  <td>{(Number(invoice.total) - Number(invoice.discount)).toFixed(2)}</td>
                </tr>
              </>
            )}
          </tfoot>
        </table>

        <div className={styles.summary}>
          <p>عدد الأصناف: {itemCount}</p>
          <p>العنوان: 1 جول جمال الف مسكن</p>
        </div>

        {invoice.invoiceNumber && (
          <div className={styles.qrWrap}>
            <QRCodeCanvas value={String(invoice.invoiceNumber)} size={60} />
          </div>
        )}

        <p style={{ textAlign: 'center', margin: '4px 0', fontSize: '10px' }}>شكراً لتعاملكم معنا!</p>

        <div className={styles.divider}></div>

        <div className={styles.footer}>
          <strong>تم التوجيه بواسطة: Devoria</strong>
        </div>

        <div className={styles.btn}>
          <button onClick={handlePrint}>طباعة الفاتورة</button>
        </div>
      </div>
    </div>
  );
}

export default Resete;
