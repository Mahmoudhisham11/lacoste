"use client";
import styles from "../styles.module.css";
import { useState, useEffect, useRef } from "react";
import { getAvailableQuantity } from "@/utils/productHelpers";
import { useNotification } from "@/contexts/NotificationContext";
import dataReader from "@/lib/DataReader";

export default function VariantModal({
  isOpen,
  onClose,
  product,
  onAddToCart,
  cart = [],
}) {
  const { error: showError } = useNotification();
  const [selectedColor, setSelectedColor] = useState("");
  const [colorSizeMap, setColorSizeMap] = useState({});
  const [price, setPrice] = useState(0);
  const cartRef = useRef(cart);
  cartRef.current = cart;

  useEffect(() => {
    if (product) {
      setPrice(product.sellPrice ?? product.finalPrice ?? 0);
      const colors = product.colors || [];
      const firstColor = colors.length ? colors[0].color : "";

      // Build sizeMap for ALL colors so switching is seamless
      const fullMap = {};
      colors.forEach((c) => {
        const sizes = c.sizes || [];
        fullMap[c.color] = {};
        sizes.forEach((sz) => {
          fullMap[c.color][sz.size] = fullMap[c.color][sz.size] || 0;
        });
      });
      // Handle products without colors (just sizes)
      if (!colors.length && product.sizes) {
        fullMap[""] = {};
        product.sizes.forEach((sz) => {
          fullMap[""][sz.size] = 0;
        });
      }

      setColorSizeMap(fullMap);
      setSelectedColor(firstColor);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleColorSelect = (color) => {
    setSelectedColor(color);
  };

  const updateQty = (color, size, value) => {
    setColorSizeMap((prev) => {
      const next = { ...prev };
      if (!next[color]) next[color] = {};
      next[color] = { ...next[color], [size]: Math.max(0, Number(value || 0)) };
      return next;
    });
  };

  const collectAllEntries = () => {
    const entries = [];
    Object.entries(colorSizeMap).forEach(([color, sizes]) => {
      Object.entries(sizes).forEach(([size, qty]) => {
        if (Number(qty) > 0) {
          entries.push({ color, size, qty: Number(qty) });
        }
      });
    });
    return entries;
  };

  const proceedWithAdd = async (priceNum) => {
    const allEntries = collectAllEntries();

    if (!allEntries.length) {
      showError("اختر كمية على الأقل لمقاس واحد");
      return;
    }

    // Check all entries upfront with current cart to avoid stale-data issues
    const currentCart = cartRef.current;

    for (const e of allEntries) {
      const available = getAvailableQuantity(product, e.color, e.size);

      const existingInCart = currentCart
        .filter(item =>
          item.originalProductId === product.id &&
          (item.color || "") === (e.color || "") &&
          (item.size || "") === (e.size || "")
        )
        .reduce((sum, item) => sum + (item.quantity || 0), 0);

      const totalRequested = existingInCart + e.qty;
      if (totalRequested > available) {
        const canAdd = available - existingInCart;
        showError(
          `⚠️ الكمية المطلوبة للمقاس ${e.size} (${totalRequested}) أكبر من المتاح (${available})\n` +
          `اللون: ${e.color}\n` +
          `الكمية في السلة: ${existingInCart}\n` +
          `الكمية المتاحة: ${available}\n` +
          `يمكن إضافة: ${canAdd > 0 ? canAdd : 0}`
        );
        return;
      }
    }

    // All checks passed — add all entries
    for (const e of allEntries) {
      await onAddToCart(product, {
        color: e.color,
        size: e.size,
        quantity: e.qty,
        price: priceNum,
      });
    }

    onClose();
  };

  const handleAdd = async () => {
    if (!price) {
      showError("من فضلك أدخل السعر");
      return;
    }

    const priceNum = Number(price);
    const role = typeof window !== "undefined" ? localStorage.getItem("role") : "";

    if (role !== "admin") {
      const sellPrice = Number(product.sellPrice);
      const finalPrice = Number(product.finalPrice);

      if (priceNum > sellPrice) {
        showError(`السعر أكبر من السعر الافتراضي: ${sellPrice}`);
        return;
      }

      if (priceNum < finalPrice) {
        showError(`السعر أقل من السعر النهائي: ${finalPrice}`);
        return;
      }
    }

    await proceedWithAdd(priceNum);
  };

  const colors = product.colors || [];
  const hasColors = colors.length > 0;
  const noColorKey = "";

  // Sizes to display for the currently selected color (or global sizes if no colors)
  const sizesArr = hasColors
    ? (() => {
        const co = colors.find((c) => c.color === selectedColor);
        return co && co.sizes ? co.sizes : [];
      })()
    : product.sizes || [];

  return (
    <div className={styles.popupOverlay} onClick={onClose}>
      <div className={styles.popupBox} onClick={(e) => e.stopPropagation()}>
        <h3>اختر اللون والمقاسات — {product.name}</h3>

        <div className={styles.popupBoxContent}>
          {hasColors && (
            <div>
              <label>الألوان المتاحة:</label>
              <div className={styles.colorButtons}>
                {colors.map((c, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleColorSelect(c.color)}
                    className={`${styles.colorBtn} ${
                      selectedColor === c.color ? styles.active : ""
                    }`}
                  >
                    {c.color} (
                    {Array.isArray(c.sizes)
                      ? c.sizes.reduce(
                          (s, it) => s + Number(it.qty || it.quantity || 0),
                          0
                        )
                      : c.quantity || 0}
                    )
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label>المقاسات للون: {hasColors ? selectedColor || "—" : "الكل"}</label>
            <div className={styles.sizesContainer}>
              {sizesArr.length === 0 ? (
                <div className={styles.emptyMessage}>
                  {selectedColor
                    ? "لا توجد مقاسات لهذا اللون"
                    : "اختر لونًا أولًا"}
                </div>
              ) : (
                sizesArr.map((s, si) => {
                  const available = getAvailableQuantity(
                    product,
                    selectedColor,
                    s.size
                  );
                  const colorKey = hasColors ? selectedColor : noColorKey;
                  const current = Number(
                    (colorSizeMap[colorKey] || {})[s.size] || 0
                  );

                  return (
                    <div key={si} className={styles.sizeRow}>
                      <div className={styles.sizeName}>{s.size}</div>
                      <div className={styles.sizeControls}>
                        <span className={styles.available}>
                          متاح: {available}
                        </span>
                        <div className={styles.qtyControls}>
                          <button
                            onClick={() =>
                              updateQty(colorKey, s.size, current - 1)
                            }
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={current}
                            onChange={(e) => {
                              const v = Math.max(0, Number(e.target.value || 0));
                              setColorSizeMap((prev) => {
                                const next = { ...prev };
                                if (!next[colorKey]) next[colorKey] = {};
                                next[colorKey] = {
                                  ...next[colorKey],
                                  [s.size]: Math.min(v, available),
                                };
                                return next;
                              });
                            }}
                            min="0"
                            max={available}
                          />
                          <button
                            onClick={() =>
                              updateQty(colorKey, s.size, current + 1)
                            }
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Summary of all selected items across colors */}
          {hasColors && (() => {
            const totalSelected = collectAllEntries().length;
            if (totalSelected === 0) return null;
            return (
              <div style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "center", padding: 4 }}>
                تم اختيار {totalSelected} مقاس
                {totalSelected > 1 ? "" : ""}
              </div>
            );
          })()}

          <div className={styles.priceInput}>
            <label>السعر:</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={`أدخل سعر ≥ ${product.finalPrice}`}
            />
          </div>
        </div>

        <div className={styles.popupBoxFooter}>
          <div className={styles.popupBtns}>
            <button onClick={onClose} className={styles.cancelBtn}>
              إلغاء
            </button>
            <button onClick={handleAdd} className={styles.addBtn}>
              أضف للسلة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
