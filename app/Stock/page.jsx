"use client";
import { useEffect, useState } from "react";
import Nav from "../components/Nav/page";
import styles from "./styles.module.css";
import { IoMdCloseCircle } from "react-icons/io";
import { IoSaveSharp } from "react-icons/io5";
import { HiMiniBars3BottomRight } from "react-icons/hi2";
import { db } from "../firebase";
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";

function Stock() {
    const [addContainer, setAddContainer] = useState(false)
    const [updateBtn, setUpdateBtn] = useState(false)
    const [openNav, setOpenNav] = useState(false)
    const [done, setDone] = useState(false)
    const [name, setName] = useState('')
    const [price, setprice] = useState(0)
    const [gomla, setGomla] = useState(0)
    const [qty, setQty] = useState(0)
    const [id, setId] = useState('')
    const [products, setProducts] = useState([])
    const [filterd, setFilterd] = useState([])
    const [searchTerm, setSearchTerm] = useState('')
    const [title, setTitle] = useState('اضف منتج جديد')
    const collectiondb = collection(db, "stockProduct")
    // CONTROL ADDCONTAINER \\
    const handleOpenAdd = () => {
        if(updateBtn) {
            setUpdateBtn(false)
            setName("")
            setprice("")
            setGomla("")
            setQty("")
        }
        setAddContainer(true)
    }
    const handleCloseAdd = () => {
        setAddContainer(false)
        setDone(false)
    }

    // ADD PRODUCT FUNCTION \\
    const handleAddProduct = async () => {
        if(name !== "" && price > 0 && gomla > 0 && qty > 0) {
            await addDoc (collectiondb, {
                name,
                price,
                gomla,
                qty,
            })
            setDone(true)
            setName('')
            setprice('')
            setGomla('')
            setQty('')
        }
    }

    // GET DATA FROM FIRESTORE \\
    useEffect(() => {
        if(searchTerm === "") {
            const fetchProducts = async () => {
                const querySnapshot = await getDocs(collectiondb)
                const productsList = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id}))
                setProducts(productsList)
                setFilterd(productsList)
            }
            fetchProducts()
        }else {
            const searchdata = async() => {
                const q = query(collectiondb, where("name", "==", searchTerm))
                const querySnapshot = await getDocs(q)
                const searchRes = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id}))
                setProducts(searchRes)
                setFilterd(searchRes)
            }
            searchdata()
        }

        if(updateBtn) {
            setTitle("تعديل المنتج")
        }else {
            setTitle("اضف منتج جديد")
        }

    }, [collectiondb, searchTerm, products, title, updateBtn])

    // DELETE FUNCTION \\
    const handleDelete = async (id) => {
        const deleteRes = doc(collectiondb, id)
        await deleteDoc(deleteRes)
    }

    // UPDATE FUNCTION \\
    const handleEdit = async(id,name,price,gomla,qty) => {
        setAddContainer(true)
        setUpdateBtn(true)
        setId(id)
        setName(name)
        setprice(price)
        setGomla(gomla)
        setQty(qty)
    }
    const handleUpdate = async() => {
        const updateRes = doc(collectiondb, id)
        await updateDoc(updateRes, {name, price, gomla, qty})
        setName('')
        setprice('')
        setGomla('')
        setQty('')
    }
    
    const handleOpenNav = () => {
        setOpenNav(true)
    }
    return(
        <main className="main">
            <Nav openNav={openNav} setOpenNav={setOpenNav}/>
            <div className={addContainer ? `${styles.shadowBox} ${styles.open}` : `${styles.shadowBox}`}>
                <div className={styles.addContainer}>
                    <div className={styles.title}>
                        <h2>{title}</h2>
                        <p className={done ? `${styles.done}` : ""}>تمت اضافة المنتج بنجاح</p>
                    </div>
                    <div className={styles.addContent}>
                        <div className={styles.addInputs}>
                            <label htmlFor="">اسم المنتج :</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)}/>
                        </div>
                        <div className={styles.addInputs}>
                            <label htmlFor=""> سعر المنتج :</label>
                            <input type="number" value={price} onChange={(e) => setprice(e.target.value)}/>
                        </div>
                        <div className={styles.addInputs}>
                            <label htmlFor=""> سعر الجملة :</label>
                            <input type="number" value={gomla} onChange={(e) => setGomla(e.target.value)}/>
                        </div>
                        <div className={styles.addInputs}>
                            <label htmlFor=""> الكمية :</label>
                            <input type="number" value={qty} onChange={(e) => setQty(e.target.value)}/>
                        </div>
                        {
                            updateBtn ? 
                            <button className={styles.containerBtn} onClick={handleUpdate}>تعديل المنتج</button> :
                            <button className={styles.containerBtn} onClick={handleAddProduct}>اضف المنتج</button> 

                        }
                        <button className={styles.closeBtn} onClick={handleCloseAdd}><IoMdCloseCircle/></button>
                    </div>
                </div>
            </div>
            <section className="container">
                <div className="header">
                    <h2>
                        <span>
                            <button onClick={handleOpenNav}><HiMiniBars3BottomRight/></button>
                        </span>
                        <span>صفحة المخزن</span>
                    </h2>
                    <div className="inputContainer">
                        <input list="products" placeholder="ابحث عن المنتج" onChange={(e) => setSearchTerm(e.target.value)} />
                        <datalist id="products">
                            {
                                products.map(product => {
                                    return (
                                        <option key={product.id} value={product.name}/>
                                    )
                                })
                            }
                        </datalist>
                        <button onClick={handleOpenAdd}>
                            <span><IoSaveSharp/></span>
                            <span>اضف منتج جديد</span>
                        </button> 
                    </div>
                </div>
                <div className="content">
                    <table>
                        <thead>
                            <tr>
                                <th>اسم المنتج</th>
                                <th>السعر</th>
                                <th>سعر الجملة</th>
                                <th>الكمية</th>
                                <th>تعديلات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                filterd.map(product => {
                                    return (
                                        <tr key={product.id}>
                                            <td>{product.name}</td>
                                            <td>{product.price}</td>
                                            <td>{product.gomla}</td>
                                            <td>{product.qty}</td>
                                            <td>
                                                <button onClick={() => handleDelete(product.id)}>حذف</button>
                                                <button onClick={() => handleEdit(product.id,product.name,product.price,product.gomla,product.qty)}>تعديل</button>
                                            </td>
                                        </tr>
                                    )
                                })
                            }
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    )
}

export default Stock;