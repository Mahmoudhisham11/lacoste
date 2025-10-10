'use client';
import SideBar from '@/components/SideBar/page';
import styles from './styles.module.css';
import { useState, useEffect } from 'react';
import { CiSearch } from 'react-icons/ci';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/app/firebase';

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [searchCode, setSearchCode] = useState('');
  const shop = typeof window !== 'undefined' ? localStorage.getItem('shop') : '';

  useEffect(() => {
    if (!shop) return;

    const q = query(collection(db, 'customers'), where('shop', '==', shop));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCustomers(data);
    });

    return () => unsubscribe();
  }, [shop]);

  const handleDeleteCustomer = async (id) => {
    if (!confirm('هل تريد حذف هذا العميل؟')) return;
    await deleteDoc(doc(db, 'customers', id));
  };

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchCode.toLowerCase())
  );

  return (
    <div className={styles.customers}>
      <SideBar />
      <div className={styles.content}>
        <div className={styles.searchBox}>
          <div className="inputContainer">
            <label><CiSearch /></label>
            <input
              type="text"
              list="code"
              placeholder="ابحث بالاسم"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
            />
            <datalist id="code">
              {customers.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </div>
        </div>

        <div className={styles.tabelContainer}>
          <table>
            <thead>
              <tr>
                <th>الاسم</th>
                <th>رقم الهاتف</th>
                <th>عدد الفواتير</th>
                <th>حذف</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.phone}</td>
                  <td>{c.invoices || 0}</td>
                  <td>
                    <button onClick={() => handleDeleteCustomer(c.id)}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
