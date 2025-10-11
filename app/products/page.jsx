'use client';
import SideBar from "@/components/SideBar/page";
import styles from "./styles.module.css";
import { useState, useEffect } from "react";
import { MdDriveFileRenameOutline } from "react-icons/md";
import { GiMoneyStack } from "react-icons/gi";
import { CiSearch } from "react-icons/ci";
import { FaRegTrashAlt } from "react-icons/fa";
import { MdOutlineEdit } from "react-icons/md";
import { FaPalette, FaRuler } from "react-icons/fa";
import { FaPlus, FaMinus, FaTrash } from "react-icons/fa6";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  onSnapshot,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

function Products() {
  const [active, setActive] = useState(false);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchCode, setSearchCode] = useState("");
  const [totalBuy, setTotalBuy] = useState(0);
  const [totalSell, setTotalSell] = useState(0);
  const [form, setForm] = useState({
    name: "",
    buyPrice: "",
    sellPrice: "",
    color: "",
    sizeType: "",
    quantity: "",
    category: "",
  });
  const [sizes, setSizes] = useState([]);
  const [editId, setEditId] = useState(null);

  // مجموعات المقاسات
  const sizeGroups = {
    "شبابي": ["36", "37", "38", "39", "40", "41"],
    "رجالي": ["40", "41", "42", "43", "44", "45"],
    "تيشيرت": ["M", "L", "XL", "2XL"]
  };

  useEffect(() => {
    const shop = localStorage.getItem("shop");
    if (!shop) return;

    const q = query(
      collection(db, "products"),
      where("shop", "==", shop),
      where("type", "==", "product")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(data);

      let totalBuyAmount = 0;
      let totalSellAmount = 0;
      data.forEach((product) => {
        totalBuyAmount += (product.buyPrice || 0) * (product.quantity || 1);
        totalSellAmount += (product.sellPrice || 0) * (product.quantity || 1);
      });
      setTotalBuy(totalBuyAmount);
      setTotalSell(totalSellAmount);

      if (searchCode.trim()) {
        const filtered = data.filter((p) =>
          p.code?.toString().includes(searchCode.trim())
        );
        setFilteredProducts(filtered);
      } else {
        setFilteredProducts(data);
      }
    });

    return () => unsubscribe();
  }, [searchCode]);

  const getNextCode = async () => {
    const shop = localStorage.getItem("shop");
    const q = query(collection(db, "products"), where("shop", "==", shop));
    const snapshot = await getDocs(q);
    if (snapshot.empty) return 1000;

    const codes = snapshot.docs
      .map((doc) => Number(doc.data().code))
      .filter((code) => !isNaN(code));

    const maxCode = Math.max(...codes);
    return maxCode + 1;
  };

  const handleAddProduct = async () => {
    const shop = localStorage.getItem("shop");
    const newCode = await getNextCode();
    const totalQty =
      sizes.length > 0
        ? sizes.reduce((acc, s) => acc + Number(s.quantity || 0), 0)
        : Number(form.quantity) || 0;

    await addDoc(collection(db, "products"), {
      code: newCode,
      name: form.name || "",
      buyPrice: Number(form.buyPrice) || 0,
      sellPrice: Number(form.sellPrice) || 0,
      quantity: totalQty,
      color: form.color || "",
      sizes: sizes || [],
      sizeType: form.sizeType || "",
      category: form.category || "",
      date: Timestamp.now(),
      shop: shop,
      type: "product",
    });

    alert("✅ تم إضافة المنتج بنجاح");
    setForm({
      name: "",
      buyPrice: "",
      sellPrice: "",
      color: "",
      sizeType: "",
      quantity: "",
      category: "",
    });
    setSizes([]);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "products", id));
    } catch (err) {
      console.error("❌ خطأ أثناء الحذف:", err);
    }
  };

  const handleEdit = (product) => {
    setEditId(product.id);
    setForm({
      name: product.name,
      buyPrice: product.buyPrice,
      sellPrice: product.sellPrice,
      color: product.color || "",
      sizeType: product.sizeType || "",
      quantity: product.quantity || "",
      category: product.category || "",
    });
    setSizes(product.sizes || []);
    setActive("edit");
  };

  const handleUpdateProduct = async () => {
    if (!editId) return;
    try {
      const totalQty =
        sizes.length > 0
          ? sizes.reduce((acc, s) => acc + Number(s.quantity || 0), 0)
          : Number(form.quantity) || 0;

      const productRef = doc(db, "products", editId);
      await updateDoc(productRef, {
        name: form.name || "",
        buyPrice: Number(form.buyPrice) || 0,
        sellPrice: Number(form.sellPrice) || 0,
        quantity: totalQty,
        color: form.color || "",
        sizes: sizes || [],
        sizeType: form.sizeType || "",
        category: form.category || "",
      });
      alert("✅ تم تحديث المنتج");
      setEditId(null);
      setForm({
        name: "",
        buyPrice: "",
        sellPrice: "",
        color: "",
        sizeType: "",
        quantity: "",
        category: "",
      });
      setSizes([]);
      setActive(false);
    } catch (err) {
      console.error("❌ خطأ أثناء التحديث:", err);
    }
  };

  const handleCategorySelect = (category) => {
    setForm({ ...form, category, sizeType: "", quantity: "" });
    if (category === "شبشب") {
      setSizes([]);
    } else if (category === "تيشيرت") {
      const newSizes = sizeGroups["تيشيرت"].map((s) => ({ size: s, quantity: 1 }));
      setSizes(newSizes);
      setForm((prev) => ({ ...prev, sizeType: "تيشيرت" }));
    } else if (category === "حزام") {
      setSizes([]);
    } else {
      setSizes([]);
    }
  };

  const handleSizeTypeSelect = (type) => {
    setForm({ ...form, sizeType: type });
    if (type === "شبابي" || type === "رجالي") {
      const newSizes = sizeGroups[type].map((s) => ({ size: s, quantity: 1 }));
      setSizes(newSizes);
    } else {
      setSizes([]);
    }
  };

  const updateSizeQuantity = (size, change) => {
    setSizes((prev) =>
      prev
        .map((s) =>
          s.size === size
            ? { ...s, quantity: Math.max(1, Number(s.quantity) + change) }
            : s
        )
        .filter((s) => s.quantity > 0)
    );
  };

  const deleteSize = (size) => {
    setSizes((prev) => prev.filter((s) => s.size !== size));
  };

  const addSizeRow = () => {
    const newSize = prompt("اكتب المقاس الجديد:");
    if (!newSize) return;
    setSizes((prev) => {
      const existing = prev.find((s) => s.size === newSize);
      if (existing) {
        return prev.map((s) =>
          s.size === newSize ? { ...s, quantity: Number(s.quantity) + 1 } : s
        );
      } else {
        return [...prev, { size: newSize, quantity: 1 }];
      }
    });
  };

  const handlePrintLabel = (product) => {
    const printWindow = window.open('', '', 'width=400,height=300');
    const htmlContent = `
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <style>
            @media print {
              @page { size: auto; margin: 0; }
              body { margin: 0; padding: 0; }
            }
            .label {
              width: 100%;
              height: 100%;
              box-sizing: border-box;
              padding: 2mm;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              font-family: Arial, sans-serif;
              font-size: 8pt;
              gap: 1mm;
              page-break-inside: avoid;
              overflow: hidden;
              text-align: center;
            }
            .name {
              max-width: 100%;
              font-weight: 600;
              line-height: 1.1;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .content {
              display: flex;
              gap: 2mm;
              flex-wrap: wrap;
              justify-content: center;
              align-items: center;
              font-size: 7pt;
            }
          </style>
        </head>
        <body>
          <div class="label">
            <div class="name">${product.name ?? ''}</div>
            <div class="content">
              <div><strong>الكود:</strong> ${product.code ?? ''}</div>
            </div>
          </div>

          <script>
            window.onload = function () {
              setTimeout(() => {
                window.print();
                window.onafterprint = () => window.close();
              }, 100);
            };
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };


  return (
    <div className={styles.products}>
      <SideBar />
      <div className={styles.content}>
        <div className={styles.btns}>
          <button onClick={() => { setActive(false); setEditId(null); }}>كل المنتجات</button>
          <button onClick={() => { setActive(true); setEditId(null); }}>اضف منتج جديد</button>
        </div>

        {!active && (
          <div className={styles.phoneContainer}>
            <div className={styles.searchBox}>
              <div className="inputContainer">
                <label><CiSearch /></label>
                <input
                  type="text"
                  list="codesList"
                  placeholder="ابحث بالكود"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                />
                <datalist id="codesList">
                  {products.map((p) => (
                    <option key={p.id} value={p.code} />
                  ))}
                </datalist>
              </div>
            </div>

            <div className={styles.totals}>
              <p>اجمالي الشراء: {totalBuy} EGP</p>
              <p>اجمالي البيع: {totalSell} EGP</p>
            </div>

            <div className={styles.tableContainer}>
              <table>
                <thead>
                  <tr>
                    <th>الكود</th>
                    <th>الاسم</th>
                    <th>سعر الشراء</th>
                    <th>سعر البيع</th>
                    <th>الكمية</th>
                    <th>اللون</th>
                    <th>المقاسات المتاحة</th>
                    <th>التاريخ</th>
                    <th>خيارات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>{product.code}</td>
                      <td>{product.name || "-"}</td>
                      <td>{product.buyPrice || 0} EGP</td>
                      <td>{product.sellPrice || 0} EGP</td>
                      <td>
                        {product.sizes?.length
                          ? product.sizes.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0)
                          : product.quantity || 0}
                      </td>
                      <td>{product.color || "-"}</td>
                      <td>
                        {product.sizes?.map((s) => `${s.size}(${s.quantity})`).join(" - ") || "-"}
                      </td>
                      <td>{product.date?.toDate().toLocaleDateString("ar-EG")}</td>
                      <td className={styles.actions}>
                        <button onClick={() => handleDelete(product.id)}><FaRegTrashAlt /></button>
                        <button onClick={() => handleEdit(product)}><MdOutlineEdit /></button>
                        <button onClick={() => handlePrintLabel(product)}>🖨️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(active === true || active === "edit") && (
          <div className={styles.addContainer}>
            <div className={styles.inputBox}>
              <div className="inputContainer">
                <label><MdDriveFileRenameOutline /></label>
                <input
                  type="text"
                  placeholder="اسم المنتج"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
            </div>

            <div className={styles.inputBox}>
              <div className="inputContainer">
                <label><GiMoneyStack /></label>
                <input
                  type="number"
                  placeholder="سعر الشراء"
                  value={form.buyPrice}
                  onChange={(e) => setForm({ ...form, buyPrice: e.target.value })}
                />
              </div>
              <div className="inputContainer">
                <label><GiMoneyStack /></label>
                <input
                  type="number"
                  placeholder="سعر البيع"
                  value={form.sellPrice}
                  onChange={(e) => setForm({ ...form, sellPrice: e.target.value })}
                />
              </div>
            </div>

            <div className={styles.inputBox}>
              <div className="inputContainer">
                <label>الصنف</label>
                <select
                  value={form.category}
                  onChange={(e) => handleCategorySelect(e.target.value)}
                >
                  <option value="">اختر الصنف</option>
                  <option value="شبشب">شبشب</option>
                  <option value="تيشيرت">تيشيرت</option>
                  <option value="حزام">حزام</option>
                </select>
              </div>
            </div>

            {(form.category === "شبشب") && (
              <div className={styles.inputBox}>
                <div className="inputContainer">
                  <label><FaRuler /></label>
                  <select
                    value={form.sizeType}
                    onChange={(e) => handleSizeTypeSelect(e.target.value)}
                  >
                    <option value="">اختر نوع المقاس</option>
                    <option value="شبابي">شبابي</option>
                    <option value="رجالي">رجالي</option>
                  </select>
                </div>
                <div className="inputContainer">
                  <button type="button" onClick={addSizeRow}>➕ أضف مقاس يدوي</button>
                </div>
              </div>
            )}

            {((form.category === "تيشيرت") || (form.category === "شبشب" && sizes.length > 0)) && sizes.length > 0 && (
              <div className={styles.sizesBox}>
                {sizes.map((s, i) => (
                  <div key={i} className={styles.sizeRow}>
                    <span>{s.size}</span>
                    <div className={styles.sizeBtns}>
                      <button onClick={() => updateSizeQuantity(s.size, -1)}><FaMinus /></button>
                      <span>{s.quantity}</span>
                      <button onClick={() => updateSizeQuantity(s.size, +1)}><FaPlus /></button>
                      <button onClick={() => deleteSize(s.size)}><FaTrash /></button>
                    </div>
                  </div>
                ))}
                <button className={styles.addSizeBtn} onClick={addSizeRow}>➕ أضف مقاس يدوي</button>
              </div>
            )}

            {(form.category === "حزام") && (
              <div className={styles.inputBox}>
                <div className="inputContainer">
                  <label><FaPlus /></label>
                  <input
                    type="number"
                    placeholder="الكمية"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  />
                </div>
              </div>
            )}

            <div className={styles.inputBox}>
              <div className="inputContainer">
                <label><FaPalette /></label>
                <input
                  type="text"
                  placeholder="اللون"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
              </div>
            </div>

            {active === "edit" ? (
              <button className={styles.addBtn} onClick={handleUpdateProduct}>تحديث المنتج</button>
            ) : (
              <button className={styles.addBtn} onClick={handleAddProduct}>اضف المنتج</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;
