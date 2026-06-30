"use client";
import { useState, useEffect, useMemo } from "react";
import { collection, query, where } from "firebase/firestore";
import { db } from "@/app/firebase";
import dataReader from "@/lib/DataReader";

export function useMasrofat(shop) {
  const [masrofat, setMasrofat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shop) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, "masrofat"), where("shop", "==", shop));

    const unsubscribe = dataReader.onSnapshot(q, (data, err) => {
      if (err) {
        console.error("Error fetching masrofat:", err);
        setError(err);
        setMasrofat([]);
        setLoading(false);
        return;
      }

      const arr = Array.isArray(data) ? data : [];
      arr.sort((a, b) => {
        const da = a?.date?.toDate ? a.date.toDate() : new Date(a?.date || 0);
        const dbb = b?.date?.toDate ? b.date.toDate() : new Date(b?.date || 0);
        return dbb.getTime() - da.getTime();
      });

      setMasrofat(arr);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [shop]);

  const totalMasrofat = useMemo(
    () =>
      masrofat.reduce((sum, item) => {
        if (item.reason === "فاتورة مرتجع" || item.reason === "سداد فاتورة بضاعة") return sum;
        return sum + Number(item.masrof || 0);
      }, 0),
    [masrofat]
  );

  const totalMasrofatWithReturn = useMemo(
    () =>
      masrofat.reduce(
        (sum, item) => sum + Number(item.masrof || 0),
        0
      ),
    [masrofat]
  );

  return {
    masrofat,
    loading,
    error,
    totalMasrofat,
    totalMasrofatWithReturn,
  };
}
