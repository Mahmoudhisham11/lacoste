"use client";
import Nav from "../components/Nav/page";
import styles from "./styles.module.css";
import Image from "next/image";
import logo from "../../public/images/blackLogo.png"
import { useEffect, useState } from "react";
import { collection, deleteDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useRouter } from "next/navigation";

function Print() {
    const [openNav, setOpenNav] = useState(false)
    const [cartdb, setCartdb] = useState([])
    const cartCollection = collection(db, "cart")
    const router = useRouter()

    const handlePrint = () => {
        window.print()
    }

    const handleDeleteAll = async() => {
        const querySnapshot = await getDocs(cartCollection)
        const delPromises = querySnapshot.docs.map(document => (deleteDoc(document.ref)))
        await Promise.all(delPromises)
        router.push("/Sale")
    }


    // GET DATA FROM RESETE COLLECTION
    useEffect(() => {
        const getAllData = async() => {
            const querySnapshot = await getDocs(cartCollection)
            const reseteList = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id}))
            setCartdb(reseteList)
        }
        getAllData()
    }, [cartCollection])


    return(
        <div className="main">
            <Nav openNav={openNav} setOpenNav={setOpenNav}/>
            {
                cartdb.map(resete => {
                    return(
                        <div key={resete.id} className={styles.card}>
                            <div className={styles.cardTitle}>
                                <Image src={logo} className={styles.logo} alt="logo"/>
                                <p>لا توجد مرتجعات</p>
                            </div>
                            <div className={styles.cardInfo}>
                                <p><strong>اسم العميل: </strong> {resete.userName}</p>
                                <p><strong>رقم الهاتف: </strong> {resete.phone}</p>
                                <p><strong>الخصم: </strong> {resete.discount}</p>
                            </div>
                            <div className={styles.productsTable}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>الاسم</th>
                                            <th>السعر</th>
                                            <th>الكمية</th>
                                            <th>السعر النهائي</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {resete.products.map(product => {
                                            return(
                                                <tr key={product.id}>
                                                    <th>{product.name}</th>
                                                    <th>{product.price}</th>
                                                    <th>{product.qty}</th>
                                                    <th>{product.totalPrice}</th>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan="5">الاجمالي: {resete.total}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            <button onClick={handlePrint} className={styles.printBtn}>طباعة</button>
                            <button onClick={handleDeleteAll} className={styles.delBtn}>فاتورة جديدة</button>
                        </div>
                    )
                })
            }
            
        </div>
    )
}

export default Print;