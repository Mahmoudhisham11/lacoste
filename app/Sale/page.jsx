"use client";
import { useEffect, useState } from "react";
import styles from "./styles.module.css";
import Nav from "../components/Nav/page";
import { FaSearch } from "react-icons/fa";
import { FaBars } from "react-icons/fa";
import { FaPlusCircle } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import { IoSaveSharp } from "react-icons/io5";
import { IoIosCloseCircle } from "react-icons/io";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

function Sale() {
    const [openNav, setOpenNav] = useState(false)
    const [openMenu, setOpenMenu] = useState(false)
    const [userName, setUserName] = useState('')
    const [phone, setPhone] = useState('')
    const [search, setSearch] = useState('')
    const [total, setTotal] = useState("")
    const [qty, setQty] = useState({})
    const [products, setProducts] = useState([])
    const [filtered, setFiltered] = useState([])
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
    }
    const handleCloseMenu = () => {
        setOpenMenu(false)
    }

    // DELETE PRODUCT FROM ARRAY
    const handleDelet = (id) => {
        setFiltered(prev => prev.filter(product => product.id !== id))
    }

    // GET DATA FROM DATABASE
    useEffect(() => {
        const getAllData = async() => {
            const querySnapshot = await getDocs(stockCollection)
            const productsList = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id}))
            setProducts(productsList)
        }
        getAllData()
        const filteredProducts = async() => {
            const q = query(stockCollection, where("name", "==", search))
            const querySnapshot = await getDocs(q)
            const filteredProduct = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id}))
            setFiltered(prev => {
                const newProducts = filteredProduct.filter(newItem => 
                    !prev.some(existingItem => existingItem.id === newItem.id)
                )
                return [...prev, ...newProducts]
            })
        }
        filteredProducts()
        const totalPrice = filtered.reduce((acc, product) => {
            return acc + (Number(qty[product.id]?.itemQty || 1) * Number(product.price))
        }, 0)
        setTotal(totalPrice)
    }, [search, stockCollection, qty, filtered])

    // SET QTY FOR PRODUCTS
    const handleQtyChange = (id, value) => {
        setQty(prev => {
            const newQty = Math.max(1, Number(value) || 1)
            return {
                ...prev, [id]: {itemQty: newQty}
            }
        })
        console.log(qty)
    }

    return(
        <div className="main">
            <Nav openNav={openNav} setOpenNav={setOpenNav}/>
            <div className={openMenu ? "shadowBox open" : "shadowBox"}>
                <div className={styles.addContainer}>
                    <div className={styles.header}>
                        <h2>اضف بيانات العميل</h2>
                        <button onClick={handleCloseMenu}><IoIosCloseCircle /></button>
                    </div>
                    <div className={styles.addContent}>
                        <div className={styles.inputContainer}>
                            <label>اسم العميل: </label>
                            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)}/>
                        </div>
                        <div className={styles.inputContainer}>
                            <label> رقم الهاتف : </label>
                            <input type="number" value={phone} onChange={(e) => setPhone(e.target.value)}/>
                        </div>
                        <button>اضف بيانات العميل</button>
                    </div>
                </div>
            </div>
            <section className="container">
                <div className="header">
                    <button onClick={handleOpenMenu}>
                        <span>حفظ</span>
                        <span><IoSaveSharp /></span>
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
                    <h2>صفحة المبيعات</h2>
                </div>
                <div className="content">
                    <table>
                        <thead>
                            <tr>
                                <th>الاسم</th>
                                <th>السعر</th>
                                <th>الكمية</th>
                                <th>السعر النهائي</th>
                                <th>التعديلات</th>
                            </tr>
                        </thead>
                        <tbody> 
                            {
                                filtered.map(product => {
                                    return(
                                        <tr key={product.id}>
                                            <td>{product.name}</td>
                                            <td>{product.price}</td>
                                            <td>
                                                <input type="number" value={qty[product.id]?.itemQty || 1} placeholder="الكمية" onChange={(e) => handleQtyChange(product.id, e.target.value)}/>
                                            </td>
                                            <td>{product.price * (qty[product.id]?.itemQty || 1)}</td>
                                            <td>
                                                <button className="delBtn" onClick={() => handleDelet(product.id)}><FaRegTrashCan /></button>
                                            </td>
                                        </tr>
                                    )
                                })
                            }
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan="5">الاجمالي : {total}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </section>
        </div>
    )
}

export default Sale;