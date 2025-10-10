'use client';
import SideBar from "@/components/SideBar/page";
import styles from "./styles.module.css";
import { useState, useEffect } from "react";
import {
    collection,
    query,
    where,
    onSnapshot,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    updateDoc,
    addDoc,
} from "firebase/firestore";
import { db } from "@/app/firebase";
import { TfiReload } from "react-icons/tfi";

function Reports() {
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [filterType, setFilterType] = useState("all");
    const [reports, setReports] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false); 
    const [source, setSource] = useState("dailySales");   
    const [searchPhone, setSearchPhone] = useState(""); 
    const shop = typeof window !== "undefined" ? localStorage.getItem("shop") : "";

    useEffect(() => {
        if (!shop) return;

        let unsubscribe;

        const applyFilters = (allReports) => {
            // فلترة التاريخ
            let filteredByDate = allReports;
            if (fromDate || toDate) {
                filteredByDate = allReports.filter((report) => {
                    if (!report.date) return false;
                    const reportTime = new Date(report.date.seconds * 1000).getTime();

                    let fromTime = fromDate ? new Date(fromDate) : null;
                    let toTime = toDate ? new Date(toDate) : null;

                    if (fromTime) {
                        fromTime.setHours(0, 0, 0, 0);
                        fromTime = fromTime.getTime();
                    }

                    if (toTime) {
                        toTime.setHours(23, 59, 59, 999);
                        toTime = toTime.getTime();
                    }

                    if (fromTime && toTime) return reportTime >= fromTime && reportTime <= toTime;
                    if (fromTime) return reportTime >= fromTime;

                    return true;
                });
            }

            // فلترة رقم الهاتف
            let filteredByPhone = filteredByDate;
            if (searchPhone.trim()) {
                filteredByPhone = filteredByDate.filter((report) =>
                    report.phone?.toString().includes(searchPhone.trim())
                );
            }

            // فلترة النوع
            const filteredReports = filteredByPhone.map((report) => {
                if (filterType === "all") return report;
                return {
                    ...report,
                    cart: report.cart?.filter((item) => item.type === filterType)
                };
            }).filter(report => report.cart?.length);

            // حساب الإجمالي
            let total = 0;
            filteredReports.forEach((report) => {
                report.cart?.forEach((item) => {
                    total += item.sellPrice * item.quantity;
                });
            });

            setReports(filteredReports);
            setTotalAmount(total);
        };

        if (fromDate || toDate) {
            setSource("reports");
            const q = query(collection(db, "reports"), where("shop", "==", shop));
            unsubscribe = onSnapshot(q, (snapshot) => {
                const allReports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                applyFilters(allReports);
            });
        } else {
            setSource("dailySales");
            const q = query(collection(db, "dailySales"), where("shop", "==", shop));
            unsubscribe = onSnapshot(q, (snapshot) => {
                const allReports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                applyFilters(allReports);
            });
        }

        return () => unsubscribe && unsubscribe();
    }, [fromDate, toDate, filterType, shop, searchPhone]);

    // ✅ دالة المرتجع بعد التعديل
    const handleDeleteSingleProduct = async (reportId, productCode) => {
        if (isDeleting) return; 
        setIsDeleting(true);

        try {
            const reportRef = doc(db, source, reportId);
            const reportSnap = await getDoc(reportRef);

            if (!reportSnap.exists()) {
                alert("هذا التقرير غير موجود");
                setIsDeleting(false);
                return;
            }

            const reportData = reportSnap.data();
            const cartItems = reportData.cart;
            const shop = reportData.shop;

            const updatedCart = cartItems.filter((item) => item.code !== productCode);
            const deletedItem = cartItems.find((item) => item.code === productCode);

            if (!deletedItem) {
                alert("هذا المنتج غير موجود في التقرير");
                setIsDeleting(false);
                return;
            }

            // ✅ استرجاع الكمية حسب المقاس أو بدون مقاسات مع اللون
            const q = query(
                collection(db, "products"),
                where("code", "==", deletedItem.code),
                where("shop", "==", shop)
            );
            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                const productDoc = snapshot.docs[0];
                const productData = productDoc.data();

                if (deletedItem.size && productData.sizes?.length) {
                    // ✅ المنتج له مقاسات
                    let sizes = productData.sizes;
                    const existingSize = sizes.find((s) => s.size === deletedItem.size);

                    if (existingSize) {
                        existingSize.quantity += deletedItem.quantity;
                    } else {
                        sizes.push({ size: deletedItem.size, quantity: deletedItem.quantity });
                    }

                    const newTotalQty = sizes.reduce((sum, s) => sum + Number(s.quantity || 0), 0);

                    await updateDoc(productDoc.ref, {
                        sizes,
                        quantity: newTotalQty,
                        ...(deletedItem.color && { color: deletedItem.color }),
                    });
                } else {
                    // ✅ منتج بدون مقاسات
                    const currentQty = productData.quantity || 0;
                    await updateDoc(productDoc.ref, {
                        quantity: currentQty + deletedItem.quantity,
                        ...(deletedItem.color && { color: deletedItem.color }),
                    });
                }
            } else {
                // ✅ لو المنتج مش موجود في المخزون نرجعه مع اللون
                const newProduct = {
                    name: deletedItem.name ?? "بدون اسم",
                    code: deletedItem.code ?? 0,
                    sellPrice: deletedItem.sellPrice ?? deletedItem.price ?? 0,
                    buyPrice: deletedItem.buyPrice ?? 0,
                    type: deletedItem.type ?? "product",
                    date: new Date(),
                    shop,
                    quantity: deletedItem.quantity,
                };

                // ✅ إضافة اللون لو موجود
                if (deletedItem.color) {
                    newProduct.color = deletedItem.color;
                }

                if (deletedItem.size) {
                    newProduct.sizes = [
                        {
                            size: deletedItem.size,
                            quantity: deletedItem.quantity,
                            ...(deletedItem.color && { color: deletedItem.color }),
                        },
                    ];
                    newProduct.quantity = deletedItem.quantity;
                }

                await addDoc(collection(db, "products"), newProduct);
            }

            // ✅ حذف المنتج من التقرير أو حذف التقرير بالكامل إن فاضي
            if (updatedCart.length === 0) {
                await deleteDoc(reportRef);
                alert("تم حذف التقرير لأنه لم يتبق فيه منتجات");
            } else {
                await updateDoc(reportRef, { cart: updatedCart });
                alert("تم حذف المنتج من التقرير واسترجاعه إلى المخزون");
            }

        } catch (error) {
            console.error("خطأ أثناء الحذف:", error);
            alert("حدث خطأ أثناء حذف المنتج");
        }

        setIsDeleting(false);
    };

    return (
        <div className={styles.reports}>
            <SideBar />
            <div className={styles.content}>
                <div className={styles.filterBar}>
                    <div className={styles.inputBox}>
                        <div className="inputContainer">
                            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                        </div>
                        <div className="inputContainer">
                            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />    
                        </div>
                    </div>
                    <div className={styles.inputBox}>
                        <div className="inputContainer">
                            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                <option value="all">الكل</option>
                                <option value="product">المنتجات</option>
                                <option value="phone">الموبايلات</option>
                            </select>
                        </div>
                        <div className="inputContainer">
                            <input 
                                type="text" 
                                placeholder="بحث برقم العميل" 
                                value={searchPhone} 
                                onChange={(e) => setSearchPhone(e.target.value)} 
                            />
                        </div>
                    </div>
                </div>

                <div className={styles.totalContainer}>
                    <h2>الاجمالي: {totalAmount} EGP</h2>
                </div>

                <div className={styles.tableContainer}>
                    <table>
                        <thead>
                            <tr>
                            <th>المنتج</th>
                            <th>السعر</th>
                            <th>الكمية</th>
                            <th>المقاس</th>
                            <th>اسم العميل</th>
                            <th>رقم الهاتف</th>
                            <th>طريقة الدفع</th>
                            <th>مرتجع</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reports.map((report) =>
                            report.cart?.map((item, index) => (
                                <tr key={`${report.id}-${index}`}>
                                <td>{item.name}</td>
                                <td>{item.sellPrice} EGP</td>
                                <td>{item.quantity}</td>
                                <td>{item.size || "-"}</td>
                                <td>{report.clientName}</td>
                                <td>{report.phone}</td>
                                <td>{report.paymentMethod || "-"}</td>
                                <td>
                                    <button 
                                    className={styles.delBtn} 
                                    onClick={() => handleDeleteSingleProduct(report.id, item.code)}
                                    >
                                    <TfiReload />
                                    </button>
                                </td>
                                </tr>
                            ))
                            )}
                        </tbody>
                        <tfoot>
                            <tr>
                            <td colSpan={8} style={{ textAlign: "right", fontWeight: "bold" }}>
                                الاجمالي: {totalAmount} EGP
                            </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default Reports;
