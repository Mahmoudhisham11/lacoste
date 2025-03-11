"use client";
import Nav from "../components/Nav/page";
import styles from "./styles.module.css";
import Image from "next/image";
import logo from "../../public/images/blackLogo.png"
import { FaSearch } from "react-icons/fa";
import { FaBars } from "react-icons/fa";
import { FaPlusCircle } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import { IoSaveSharp } from "react-icons/io5";
import { IoIosCloseCircle } from "react-icons/io";
import { useEffect, useState } from "react";
import { collection, deleteDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

function Gard() {
    const [openNav, setOpenNav] = useState(false)
    const [search, setSearch] = useState('')
    const [reseteDb, setReseteDb] = useState([])
    const gardCollection = collection(db, "gard")

    const handleOpenNav = () => {
        if(openNav) {
            setOpenNav(false)
        }else {
            setOpenNav(true)
        }
    }

    // GET DATA FROM RESETE COLLECTION
    useEffect(() => {
        if(search === "") {
            const getAllData = async() => {
                const querySnapshot = await getDocs(gardCollection)
                const reseteList = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id}))
                setReseteDb(reseteList)
            }
            getAllData()
        }else {
            const getFilteredReset = async() => {
                const q = query(gardCollection, where("userName", "==", search))
                const querySnapshot = await getDocs(q)
                const filteredReset = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id}))
                setReseteDb(filteredReset)
            }
            getFilteredReset()
        }
    }, [gardCollection, search])

    // DELETE ALL DAY
    const handleDeleteAll = async() => {
        const querySnapshot = await getDocs(gardCollection)
        const delPromises = querySnapshot.docs.map(document => (deleteDoc(document.ref)))
        await Promise.all(delPromises)
    }

    return(
        <div className="main">
            <Nav openNav={openNav} setOpenNav={setOpenNav}/>
            <section className="container">
                <div className="header">
                    <button onClick={handleDeleteAll}>
                        <span>تقفيل الجرد</span>
                        <span><FaRegTrashCan /></span>
                    </button>
                    <div className="searchContainer">
                        <input list="products" placeholder="بحث" onChange={(e) => setSearch(e.target.value)}/>
                        <datalist id="products">
                            {reseteDb.map(resete => {
                                return(
                                    <option key={resete.id} value={resete.phone}/>
                                )
                            })}
                        </datalist>
                        <p>| <FaSearch /></p>
                    </div>
                    <div className="menuBtn">
                        <button onClick={handleOpenNav}><FaBars /></button>
                    </div>
                </div>
                <div className="title">
                    <h2>صفحة الجرد</h2>
                </div>
                <div className={styles.content}>
                    {
                        reseteDb.map(resete => {
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
                                </div>
                            )
                        })
                    }
                </div>
            </section>
        </div>
    )
}

export default Gard;