import {
  collection,
  query,
  where,
  doc,
  setDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/app/firebase";
import dataLayer from "@/lib/DataLayer";
import dataReader from "@/lib/DataReader";
import { calculateSubtotal, calculateProfit } from "@/utils/cartHelpers";

const getNextInvoiceNumber = async (shop) => {
  try {
    let maxInvoiceNumber = 0;

    const q = shop
      ? query(collection(db, "dailySales"), where("shop", "==", shop))
      : collection(db, "dailySales");
    const firebaseInvoices = await dataReader.get(q);

    firebaseInvoices.forEach(inv => {
      const invNumber = Number(inv.invoiceNumber || 0);
      if (invNumber > maxInvoiceNumber) {
        maxInvoiceNumber = invNumber;
      }
    });

    const nextInvoiceNumber = maxInvoiceNumber + 1;

    setDoc(
      doc(db, "counters", "invoiceCounter"),
      { lastInvoiceNumber: nextInvoiceNumber },
      { merge: true }
    ).catch((error) => {
      console.error("Error syncing invoice number to Firebase:", error);
    });

    return nextInvoiceNumber;
  } catch (error) {
    console.error("Error getting invoice number:", error);
    return 1;
  }
};

export const invoiceService = {
  async createInvoice(cart, clientData, shop, employee) {
    try {
      const invoiceNumber = await getNextInvoiceNumber(shop);

      const total = calculateSubtotal(cart);
      const profit = calculateProfit(cart);

      const saleData = {
        invoiceNumber,
        cart,
        clientName: clientData.clientName || "",
        phone: clientData.phone || "",
        date: new Date(),
        shop,
        total,
        profit,
        employee: employee || "غير محدد",
        discount: clientData.discount || 0,
        discountNotes: clientData.discountNotes || "",
        paymentMethod: clientData.paymentMethod || "cash",
        walletNumber: clientData.walletNumber || "",
      };

      const result = await dataLayer.add("dailySales", saleData);
      return {
        success: true,
        invoice: { id: result.id, ...saleData },
      };
    } catch (error) {
      console.error("Error creating invoice:", error);
      return { success: false, error };
    }
  },

  async getInvoiceByNumber(invoiceNumber) {
    try {
      const q = query(
        collection(db, "dailySales"),
        where("invoiceNumber", "==", Number(invoiceNumber))
      );
      const invoices = await dataReader.get(q);

      if (invoices.length === 0) {
        return { success: false, message: "الفاتورة غير موجودة" };
      }

      const invoiceData = invoices[0];
      return { success: true, invoice: invoiceData };
    } catch (error) {
      console.error("Error getting invoice:", error);
      return { success: false, error };
    }
  },

  async returnProduct(item, invoiceId) {
    try {
      let invoiceData = null;

      try {
        invoiceData = await dataReader.getById("dailySales", invoiceId);
      } catch (err) {
        console.warn("Could not fetch invoice from Firebase:", err);
      }

      if (!invoiceData) {
        return { success: false, message: "الفاتورة غير موجودة" };
      }

      if (!Array.isArray(invoiceData.cart) || invoiceData.cart.length === 0) {
        return { success: false, message: "الفاتورة فارغة" };
      }

      let itemFound = false;
      let itemIndex = -1;

      for (let i = 0; i < invoiceData.cart.length; i++) {
        const p = invoiceData.cart[i];
        const matchesCode = p.code === item.code;
        const matchesColor = (p.color || "") === (item.color || "");
        const matchesSize = (p.size || "") === (item.size || "");

        if (matchesCode && matchesColor && matchesSize) {
          itemIndex = i;
          itemFound = true;
          break;
        }
      }

      if (!itemFound) {
        return { success: false, message: "المنتج غير موجود في الفاتورة" };
      }

      const foundItem = invoiceData.cart[itemIndex];

      if (foundItem.quantity < item.quantity) {
        return {
          success: false,
          message: `الكمية المطلوبة (${item.quantity}) أكبر من الكمية في الفاتورة (${foundItem.quantity})`
        };
      }

      const updatedCart = [...invoiceData.cart];

      if (foundItem.quantity === item.quantity) {
        updatedCart.splice(itemIndex, 1);
      } else {
        updatedCart[itemIndex] = {
          ...foundItem,
          quantity: foundItem.quantity - item.quantity,
        };
      }

      if (updatedCart.length > 0) {
        const newTotal = calculateSubtotal(updatedCart);
        const newProfit = calculateProfit(updatedCart);

        await dataLayer.update("dailySales", invoiceId, {
          cart: updatedCart,
          total: newTotal,
          profit: newProfit,
        });

        return {
          success: true,
          message: "تم إرجاع المنتج بنجاح",
          cart: updatedCart,
          total: newTotal,
          profit: newProfit,
        };
      } else {
        await dataLayer.delete("dailySales", invoiceId);
        return { success: true, message: "تم إرجاع المنتج وحذف الفاتورة", deleted: true };
      }
    } catch (error) {
      console.error("Error returning product:", error);
      return {
        success: false,
        message: error.message || "حدث خطأ أثناء إرجاع المنتج",
        error
      };
    }
  },
};
