"use client";
import { useState, useEffect, useCallback } from "react";
import { collection, query, where } from "firebase/firestore";
import { db } from "@/app/firebase";
import dataReader from "@/lib/DataReader";

export function useProducts(shop) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!shop) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "lacosteProducts"),
      where("shop", "==", shop),
      where("type", "==", "product")
    );

    const unsubscribe = dataReader.onSnapshot(q, (firebaseData, err) => {
      if (err) {
        console.error("Error fetching products:", err);
        setError(err);
        setProducts([]);
        setLoading(false);
        return;
      }

      const firebaseArr = Array.isArray(firebaseData)
        ? firebaseData.filter((p) => p.type === "product")
        : [];

      setProducts(firebaseArr);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [shop]);

  const filterProducts = useCallback(
    (searchCode, filterType = "all") => {
      return products.filter((p) => {
        const search = searchCode.trim().toLowerCase();
        const matchName =
          search === "" ||
          (p.code && p.code.toString().toLowerCase().includes(search));
        const matchType =
          filterType === "all"
            ? true
            : filterType === "phone"
            ? p.type === "phone"
            : p.type !== "phone";
        return matchName && matchType;
      });
    },
    [products]
  );

  return {
    products,
    loading,
    error,
    filterProducts,
  };
}
