"use client";
import Nav from "../components/Nav/page";
import styles from "./styles.module.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { FaBars } from "react-icons/fa";
import { FaPlusCircle } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import { FaPen } from "react-icons/fa";
import { IoIosCloseCircle } from "react-icons/io";
import { db } from "../firebase";
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";

function Stock() {
    const [openNav, setOpenNav] = useState(false)
    const [openMenu, setOpenMenu] = useState(false)
    const [update, setUpdate] = useState(false)
    const [headerTitle, setHaderTitle] = useState('اضف منتج جديد')
    const [name, setName] = useState('')
    const [price, setPrice] = useState('')
    const [gomla, setGomla] = useState('')
    const [qty, setQty] = useState('')
    const [id, setId] = useState('')
    const [search, setSearch] = useState('')
    const [products, setProducts] = useState([])
    const stockCollection = collection(db, "stockProducts")

    const handleOpenNav = () => {
        if(openNav) {
            setOpenNav(false)
        }else {
            setOpenNav(true)
        }
    }
    const handleOpenMenu = () => {
        setOpenMenu(true)
        setHaderTitle("اضف منتج جديد")
        setUpdate(false)
        setName("")
        setPrice("")
        setGomla("")
        setQty("")
    }
    const handleCloseMenu = () => {
        setOpenMenu(false)
    }

    // UPLOAD DTAT TO DATABASE
    const handleAddData = async () => {
        if(name !== "" && price > 0 && gomla > 0 && qty > 0) {
            const q = query(stockCollection, where("name", "==", name))
            const querySnapshot = await getDocs(q)
            if(!querySnapshot.empty) {
                alert("هذا المنتج موجود بالفعل")
            }else {
                await addDoc(stockCollection, {
                    name,
                    price,
                    gomla,
                    qty,
                })
                alert("تم اضفافة المنتج بنجاج")
                setName("")
                setPrice("")
                setGomla("")
                setQty("")
            }
        }
    }

    // DELETE PRODUCT FROM DATABASE
    const handleDelete = async(id) => {
        const delValue = doc(stockCollection, id)
        await deleteDoc(delValue)
    }

    // EDIT PRODUCT FROM DATABASE
    const handleEdit = (name, price, gomla, qty, id) => {
        setOpenMenu(true)
        setHaderTitle("تعديل المنتج")
        setUpdate(true)
        setName(name)
        setPrice(price)
        setGomla(gomla)
        setQty(qty)
        setId(id)
    }
    // UPDATE PRODUCT FROM DATABASE
    const handleUpdate = async() => {
        const updateVal = doc(stockCollection, id)
        await updateDoc(updateVal, {
            name,
            price,
            gomla,
            qty
        })
        alert("تم تعديل المنتج بنجاج")
        setName("")
        setPrice("")
        setGomla("")
        setQty("")
        
    }

    // GET DATA FROM DATABASE
    useEffect(() => {
        if(search === "") {
            const getAllData = async () => {
                const querySnapshot = await getDocs(stockCollection)
                const productsList = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id}))
                setProducts(productsList)
            }
            getAllData()
        }else {
            const getFilteredData = async () => {
                const q = query(stockCollection, where("name", "==", search))
                const querySnapshot = await getDocs(q)
                const searchRes = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id}))
                setProducts(searchRes)
            }
            getFilteredData()
        }
    }, [search, stockCollection])

    return(
        <div className="main">
            <Nav openNav={openNav} setOpenNav={setOpenNav}/>
            <div className={openMenu ? "shadowBox open" : "shadowBox"}>
                <div className={styles.addContainer}>
                    <div className={styles.header}>
                        <h2>{headerTitle}</h2>
                        <button onClick={handleCloseMenu}><IoIosCloseCircle /></button>
                    </div>
                    <div className={styles.addContent}>
                        <div className={styles.inputContainer}>
                            <label>اسم المنتج: </label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)}/>
                        </div>
                        <div className={styles.inputContainer}>
                            <label>سعر المنتج : </label>
                            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}/>
                        </div>
                        <div className={styles.inputContainer}>
                            <label>سعر الجملة  :</label>
                            <input type="number" value={gomla} onChange={(e) => setGomla(e.target.value)}/>
                        </div>
                        <div className={styles.inputContainer}>
                            <label>الكمية :</label>
                            <input type="number" value={qty} onChange={(e) => setQty(e.target.value)}/>
                        </div>
                        {update ? <button onClick={handleUpdate}>تعديل المنتج</button> : <button onClick={handleAddData}>اضف المنتج</button>}
                    </div>
                </div>
            </div>
            <section className="container">
                <div className="header">
                    <button onClick={handleOpenMenu}>
                        <span>اضف منتج جديد</span>
                        <span><FaPlusCircle /></span>
                    </button>
                    <div className="searchContainer">
                        <input list="products" placeholder="بحث" onChange={(e) => setSearch(e.target.value)}/>
                        <datalist id="products">
                            {
                                products.map(product => {
                                    return (
                                        <option key={product.id} value={product.name}/>
                                    )
                                })
                            }
                        </datalist>
                        <p>| <FaSearch /></p>
                    </div>
                    <div className="menuBtn">
                        <button onClick={handleOpenNav}><FaBars /></button>
                    </div>
                </div>
                <div className="title">
                    <h2>صفحة المخزن</h2>
                </div>
                <div className="content">
                    <table>
                        <thead>
                            <tr>
                                <th>الاسم</th>
                                <th>السعر</th>
                                <th>الجملة</th>
                                <th>الكمية</th>
                                <th>التعديلات</th>
                            </tr>
                        </thead>
                        <tbody> 
                            {
                                products.map(product => {
                                    return(
                                        <tr key={product.id}>
                                            <td>{product.name}</td>
                                            <td>{product.price}</td>
                                            <td>{product.gomla}</td>
                                            <td>{product.qty}</td>
                                            <td>
                                                <button onClick={() => handleDelete(product.id)}><FaRegTrashCan /></button>
                                                <button onClick={() => handleEdit(product.name, product.price, product.gomla, product.qty, product.id)}><FaPen /></button>
                                            </td>
                                        </tr>
                                    )
                                })
                            }
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}

export default Stock;