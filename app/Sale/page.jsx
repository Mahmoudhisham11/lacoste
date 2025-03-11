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
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase";
import { useRouter } from "next/navigation";

function Sale() {
    const [openNav, setOpenNav] = useState(false)
    const [openMenu, setOpenMenu] = useState(false)
    const [userName, setUserName] = useState('')
    const [phone, setPhone] = useState('')
    const [search, setSearch] = useState('')
    const [total, setTotal] = useState("")
    const [discount, setDiscount] = useState(0)
    const [qty, setQty] = useState({})
    const [products, setProducts] = useState([])
    const [filtered, setFiltered] = useState([])
    const router = useRouter()
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
    }, [search, stockCollection, qty])

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

    // HANDLE RESETE 
    const handleResete = async() => {
        const cartCollection = collection(db, "cart")
        const reseteCollection = collection(db, "resete")
        const gardCollection = collection(db, "gard")
        const usersCollection = collection(db, "users")
        if(userName !== "" && phone !== "") {
            // ADD PRODUCTS TO CART
            await addDoc(cartCollection, {
                userName,
                phone,
                total: Number(total) - Number(discount),
                discount,
                products: filtered.map(item => ({...item, qty: qty[item.id]?.itemQty || 1, totalPrice: (qty[item.id]?.itemQty || 1 ) * Number(item.price)})),
            })
            // ADD PRODUCTS TO RESETE COLLECTION
            await addDoc(reseteCollection, {
                userName,
                phone,
                total: Number(total) - Number(discount),
                discount,
                products: filtered.map(item => ({...item, qty: qty[item.id]?.itemQty || 1, totalPrice: (qty[item.id]?.itemQty || 1 ) * Number(item.price)})),
            })
            // ADD PRODUCTS TO GARD COLLECTION
            await addDoc(gardCollection, {
                userName,
                phone,
                total: Number(total) - Number(discount),
                discount,
                products: filtered.map(item => ({...item, qty: qty[item.id]?.itemQty || 1, totalPrice: (qty[item.id]?.itemQty || 1 ) * Number(item.price)})),
            })
            // ADD USER TO USERS COLLECTION
            const q = query(usersCollection, where("userName", "==", userName))
            const querySnapshot = await getDocs(q)
            if(!querySnapshot.empty) {
                console.log("User is already exsist")
            }else {
                await addDoc(usersCollection, {userName, phone})
            }
            alert('تم حفظ الفاتورة')
            setUserName('')
            setPhone('')
            setDiscount(0)
            router.push("/Print")
        }
        // FILTER THE STOCK
        for(const product of filtered) {
            const productRef = doc(db, "stockProducts", product.id)
            const productSnapshot = await getDoc(productRef)
            const stockQty = Math.abs(productSnapshot.data()?.qty || 0)
            let productQty = Math.abs(qty[product.id]?.itemQty || 0)
            if(productQty > stockQty) {
                console.log(`لا توج كمية كافية من ${product.name} الكمية المتاحة ${stockQty}`)
                continue;
            }
            const newStockQty = Math.max(0, stockQty - productQty)
            await updateDoc(productRef, {qty: newStockQty})
        }

    }

    return(
        <div className="main">
            <Nav openNav={openNav} setOpenNav={setOpenNav}/>
            <div className={openMenu ? "shadowBox open" : "shadowBox"}>
                <div className={styles.addContainer}>
                    <div className={styles.header}>
                        <h2>حفظ الفاتورة</h2>
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
                        <div className={styles.inputContainer}>
                            <label> الخصم : </label>
                            <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)}/>
                        </div>
                        <button onClick={handleResete}>حفظ الفاتورة</button>
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