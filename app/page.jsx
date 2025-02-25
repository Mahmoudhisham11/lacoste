"use client"; 
import styles from "./page.module.css";
import { IoMdCloseCircle } from "react-icons/io";
import { IoSaveSharp } from "react-icons/io5";
import { HiMiniBars3BottomRight } from "react-icons/hi2";
import { db } from "./firebase";
import { useEffect,useState } from "react";
import { addDoc, collection, doc, getDoc, getDocs, increment, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import Nav from "./components/Nav/page";

function Home() {
    const [openNav, setOpenNav] = useState(false)
    const [products, setProducts] = useState([])
    const [fileterd, setFileterd] = useState([])
    const [search, setSearch] = useState("")
    const [userName, setUserName] = useState('')
    const [userPhone, setUserPhone] = useState('')
    const [qty, setQty] = useState({})
    const [total, setTotal] = useState(0)
    const [userInfo, setUserInfo] = useState(false)
    const collectiondb = collection(db, "stockProduct")

    // GET DATA FROM FIRESTORE
    useEffect(() => {
        const getAllProducts = async () => {
            const querySnapshot = await getDocs(collectiondb)
            const productsList = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id}))
            setProducts(productsList)
        }
        const getFileterdProducts = async () => {
            if(!search) return;
            const q = query(collectiondb, where("name", "==", search))
            const querySnapshot = await getDocs(q)
            const fileterdProducts = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id}))
            setFileterd(prev => {
                const newProducts = fileterdProducts.filter(
                    newProd => !prev.some(prevProd => prevProd.id === newProd.id)
                )
                return [...prev, ...newProducts]
            })
        }
        getAllProducts()
        getFileterdProducts()
        // GET SUBTOTAL \\
        const total = fileterd.reduce((acc, product) => {
            const productQty = qty[product.id]?.itemQty || 1
            return acc + product.price * productQty
        }, 0)
        setTotal(total)
    }, [collectiondb, search, fileterd, qty])

    // UPLOAD RESET \\
    const handleReset = async () => {
        const collectionSales = collection(db, "salse")
        if(fileterd.length === 0) {
            alert("لا يوجد منتجات لحفظها في الفاتورة")
        }else {
            await addDoc(collectionSales, {
                userName,
                userPhone,
                total,
                time: serverTimestamp(),
                products: fileterd.map(item => ({...item, qty: qty[item.id]?.itemQty || 1, totalPrice: Number(qty[item.id]?.itemQty || 1) * Number(item.price) })),
            })
            for(const product of fileterd) {
                if(!product) {
                    console.error(`Product id is undefiend! ${product}`)
                    continue;
                }
                console.log(`Updating stock for product: ${product}`)
                const productRef = doc(collectiondb, product.id)
                const productSnap = await getDoc(productRef)
                const stockQty =  Math.max(0, productSnap.data()?.qty || 1)
                let productQty = Math.abs(qty[product.id]?.itemQty || 1)
                if(productQty > stockQty) {
                    alert(`لا يوجد كمية كافية في المخزن من: ${product.name}, الكمية المتاحة هي: ${productQty}`)
                    continue;
                }
                const newStockQty = stockQty - productQty
                await updateDoc(productRef, {
                    qty: newStockQty
                })
            }
        }
    }
    
    // DELETE ITEM FORM ARRAY 
    const handleDelete = (id) => {
        const newFileterd = [...fileterd]
        newFileterd.splice(id, 1)
        setFileterd(newFileterd)
    }

    // GET TOTAL PRICE
    const handleQtyChane = (id, value) => {
        const qtyValue = Math.max(1, Number(value))
        setQty(prev => ({...prev, [id] : {id, itemQty: Number(qtyValue)}}))
    }

    const handleOpenUserInfo = () => {
        setUserInfo(true)
    }
    const handleCloseUserInfo = () => {
        setUserInfo(false)
    }
    const handleOpenNav = () => {
        setOpenNav(true)
    }

    return (
        <main className="main">
            <Nav openNav={openNav} setOpenNav={setOpenNav}/>
            <div className={userInfo ? `${styles.shadowBox} ${styles.open}` : `${styles.shadowBox}`}>
                <div className={styles.addContainer}>
                    <div className={styles.title}>
                        <h2>ادخل بيانات العميل</h2>
                    </div>
                    <div className={styles.addContent}>
                        <div className={styles.addInputs}>
                            <label htmlFor="">اسم العميل :</label>
                            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)}/>
                        </div>
                        <div className={styles.addInputs}>
                            <label htmlFor=""> رقم الهاتف :</label>
                            <input type="number" value={userPhone} onChange={(e) => setUserPhone(e.target.value)}/>
                        </div>
                        <button className={styles.containerBtn} onClick={handleReset}>حفظ الفاتورة</button> 
                        <button className={styles.closeBtn} onClick={handleCloseUserInfo}><IoMdCloseCircle/></button>
                    </div>
                </div>
            </div>
            <section className="container">
                <div className="header">
                    <h2>
                        <span>
                            <button onClick={handleOpenNav}><HiMiniBars3BottomRight/></button>
                        </span>
                        <span>المبيعات</span>
                    </h2>
                    <div className="inputContainer">
                        <input list="products" placeholder="ابحث عن منتج" onChange={(e) => setSearch(e.target.value)}/>
                        <datalist id="products">
                            {
                                products.map(product => {
                                    return (
                                        <option key={product.id} value={product.name}/>
                                    )
                                })
                            }
                        </datalist>
                        <button onClick={handleOpenUserInfo}>
                            <span><IoSaveSharp/></span>
                            <span>حفظ</span>
                        </button>
                    </div>
                </div>
                <div className="content">
                    <table>
                        <thead>
                            <tr>
                                <th>اسم المنتج</th>
                                <th>السعر</th>
                                <th>الكمية</th>
                                <th>السعر النهائي</th>
                                <th>حذف</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                fileterd.map(product => {
                                    return (
                                        <tr key={product.id}>
                                            <td>{product.name}</td>
                                            <td>{product.price}</td>
                                            <td><input type="number" placeholder="الكمية" value={Number(qty[product.id]?.itemQty) || ""} onChange={(e) => handleQtyChane(product.id, e.target.value)}/></td>
                                            <td>{(product.price * (Number(qty[product.id]?.itemQty) || 1))}</td>
                                            <td>
                                                <button onClick={() => handleDelete(product.id)}>حذف</button>
                                            </td>
                                        </tr>
                                    )
                                })
                            }
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colSpan={5}><span>الاجمالي:</span> <span>{total.toFixed(2)}</span></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </section>
        </main>
    )
}

export default Home;



