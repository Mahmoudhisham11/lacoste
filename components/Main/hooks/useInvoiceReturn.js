"use client";
import { useState, useRef } from "react";
import { invoiceService } from "../services/invoiceService";
import { stockService } from "../services/stockService";
import { useNotification } from "@/contexts/NotificationContext";
import dataReader from "@/lib/DataReader";

export function useInvoiceReturn() {
  const [returningItemsState, setReturningItemsState] = useState({});
  const processingRef = useRef({});
  const { success, error: showError } = useNotification();

  const returnProduct = async (item, invoiceId, onUpdateInvoice) => {
    const itemKey = `${item.code}_${item.color || ""}_${item.size || ""}`;

    if (processingRef.current[itemKey]) {
      return;
    }

    processingRef.current[itemKey] = true;
    setReturningItemsState((prev) => ({ ...prev, [itemKey]: true }));

    const safetyTimer = setTimeout(() => {
      delete processingRef.current[itemKey];
      setReturningItemsState((prev) => {
        if (!prev[itemKey]) return prev;
        const newState = { ...prev };
        delete newState[itemKey];
        return newState;
      });
    }, 30000);

    let stockRestored = false;

    try {
      // Pre-check: verify item exists in invoice
      let invoiceData = null;
      try {
        invoiceData = await dataReader.getById("dailySales", invoiceId);
      } catch (err) {
        console.warn("Could not fetch invoice from Firebase:", err);
      }

      if (!invoiceData) {
        showError("الفاتورة غير موجودة");
        return;
      }

      const foundItem = (invoiceData.cart || []).find(
        (p) =>
          p.code === item.code &&
          (p.color || "") === (item.color || "") &&
          (p.size || "") === (item.size || "")
      );

      if (!foundItem) {
        showError("المنتج غير موجود في الفاتورة");
        return;
      }

      if (item.quantity > foundItem.quantity) {
        showError(
          `⚠️ الكمية المطلوبة (${item.quantity}) أكبر من الكمية في الفاتورة (${foundItem.quantity})`
        );
        return;
      }

      await stockService.restoreStock(item);
      stockRestored = true;

      const result = await invoiceService.returnProduct(item, invoiceId);

      if (result.success) {
        if (onUpdateInvoice) {
          if (result.deleted) {
            onUpdateInvoice(null);
          } else {
            onUpdateInvoice({
              ...invoiceData,
              cart: result.cart,
              total: result.total,
              profit: result.profit,
            });
          }
        }

        success(result.message || "تم إرجاع المنتج بنجاح");
      } else {
        if (stockRestored) {
          try {
            await stockService.updateStockAfterSale([item]);
          } catch (rollbackErr) {
            console.error("Error rolling back stock:", rollbackErr);
            showError("⚠️ تم إرجاع المخزون لكن حدث خطأ في تحديث الفاتورة. يرجى التحقق يدوياً");
          }
        }
        showError(result.message || "حدث خطأ أثناء إرجاع المنتج");
      }
    } catch (err) {
      console.error("Error returning product:", err);

      if (stockRestored) {
        try {
          await stockService.updateStockAfterSale([item]);
        } catch (rollbackErr) {
          console.error("Error rolling back stock:", rollbackErr);
        }
      }

      const errorMessage = err.message || err.toString() || "خطأ غير معروف";
      showError(`❌ حدث خطأ أثناء إرجاع المنتج: ${errorMessage}`);
    } finally {
      clearTimeout(safetyTimer);
      delete processingRef.current[itemKey];
      setReturningItemsState((prev) => {
        const newState = { ...prev };
        delete newState[itemKey];
        return newState;
      });
    }
  };

  return { returnProduct, returningItemsState };
}
