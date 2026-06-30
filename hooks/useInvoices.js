"use client";
import { useState, useEffect, useCallback } from "react";
import { collection, query, where } from "firebase/firestore";
import { db } from "@/app/firebase";
import dataReader from "@/lib/DataReader";

export function useInvoices(shop) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shop) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, "dailySales"), where("shop", "==", shop));

    const unsubscribe = dataReader.onSnapshot(q, (data, err) => {
      if (err) {
        console.error("Error fetching invoices:", err);
        setError(err);
        setLoading(false);
        return;
      }

      const firebaseArr = Array.isArray(data) ? data : [];
      firebaseArr.sort(
        (a, b) => Number(b.invoiceNumber || 0) - Number(a.invoiceNumber || 0)
      );

      setInvoices(firebaseArr);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [shop]);

  const filterInvoices = useCallback(
    (searchTerm) => {
      if (!searchTerm) return invoices;
      return invoices.filter((inv) =>
        inv.invoiceNumber?.toString().includes(searchTerm)
      );
    },
    [invoices]
  );

  const formatDate = useCallback((date) => {
    if (!date) return "";
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleString("ar-EG", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }, []);

  return {
    invoices,
    loading,
    error,
    filterInvoices,
    formatDate,
  };
}
