import {
  collection,
  query,
  where,
  getDocs,
  doc,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/app/firebase";

export const closeDayService = {
  async closeDay(shop, userName) {
    try {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, "0");
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const year = today.getFullYear();
      const todayStr = `${day}/${month}/${year}`;

      let allSales = [];
      let allMasrofat = [];

      const salesQuery = query(
        collection(db, "dailySales"),
        where("shop", "==", shop)
      );
      const salesSnapshot = await getDocs(salesQuery);
      salesSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        allSales.push({ id: docSnap.id, ...data });
      });

      if (allSales.length === 0) {
        return { success: false, message: "لا يوجد عمليات لتقفيلها اليوم" };
      }

      const masrofatQuery = query(
        collection(db, "masrofat"),
        where("shop", "==", shop)
      );
      const masrofatSnapshot = await getDocs(masrofatQuery);
      masrofatSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        allMasrofat.push({ id: docSnap.id, ...data });
      });

      let totalSales = 0;
      allSales.forEach((sale) => {
        totalSales += sale.total || 0;
      });

      let totalMasrofat = 0;
      let returnedProfit = 0;
      let netMasrof = 0;

      allMasrofat.forEach((masrof) => {
        netMasrof += masrof.masrof || 0;
        if (masrof.date === todayStr) {
          if (masrof.reason === "فاتورة مرتجع") {
            returnedProfit += masrof.profit || 0;
          } else if (masrof.reason === "سداد فاتورة بضاعة") {
          } else {
            if (masrof.source !== "خزنة") {
              totalMasrofat += masrof.masrof || 0;
            }
          }
        }
      });

      const closeSessionId = `${todayStr}_${Date.now()}`;
      const batch = writeBatch(db);

      // Move dailySales → reports
      for (const sale of allSales) {
        const saleRef = doc(db, "dailySales", sale.id);
        const reportRef = doc(collection(db, "reports"));
        batch.set(reportRef, {
          ...sale,
          closedBy: userName,
          closedAt: todayStr,
          closeSessionId,
          closedAtTimestamp: Timestamp.now(),
        });
        batch.delete(saleRef);
      }

      // Move masrofat → expensesReports
      for (const masrof of allMasrofat) {
        const masrofRef = doc(db, "masrofat", masrof.id);
        const expenseRef = doc(collection(db, "expensesReports"));
        batch.set(expenseRef, {
          ...masrof,
          closedBy: userName,
          closedAt: todayStr,
          closeSessionId,
          closedAtTimestamp: Timestamp.now(),
        });
        batch.delete(masrofRef);
      }

      const profitData = {
        shop,
        date: todayStr,
        totalSales,
        totalMasrofat: Number(netMasrof),
        returnedProfit,
        createdAt: Timestamp.now(),
        closedBy: userName,
      };
      const profitRef = doc(collection(db, "dailyProfit"));
      batch.set(profitRef, profitData);

      await batch.commit();

      return { success: true, message: "تم تقفيل اليوم بنجاح" };
    } catch (error) {
      console.error("Error closing day:", error);
      return { success: false, error };
    }
  },
};
