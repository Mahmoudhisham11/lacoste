"use client";
import styles from "./styles.module.css";
import { useEffect, useState } from "react";
import Nav from "../components/Nav/page";
import { FaSearch } from "react-icons/fa";
import { FaBars } from "react-icons/fa";
import { FaPlusCircle } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import { FaPen } from "react-icons/fa";
import { IoIosCloseCircle } from "react-icons/io";
import { addDoc, collection, deleteDoc, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "../firebase";

function Users() {
    const [openNav, setOpenNav] = useState(false)
    const [openMenu, setOpenMenu] = useState(false)
    const [update, setUpdate] = useState(false)
    const [haderTitle, setHeaderTitle] = useState("اضف عميل جديد")
    const [userName, setUserName] = useState('')
    const [phone, setPhone] = useState('')
    const [search, setSearch] = useState('')
    const [id, setId] = useState('')
    const [users, setUsers] = useState([])
    const usersCollection = collection(db, "users")

    const handleOpenNav = () => {
        if(openNav) {
            setOpenNav(false)
        }else {
            setOpenNav(true)
        }
    }
    const handleOpenMenu = () => {
        setOpenMenu(true)
        setUpdate(false)
        setHeaderTitle("اضف عميل جديد")
        setUserName('')
        setPhone('')
    }
    const handleCloseMenu = () => {
        setOpenMenu(false)
    }

    // ADD USER TO DATABASE
    const handleAddUser = async() => {
        if(userName !== "" && phone !== "") {
            const q = query(usersCollection, where("userName", "==", userName))
            const querySnapshot = await getDocs(q)
            if(!querySnapshot.empty) {
                alert("هذا المستخدم موجود بالفعل")
            }else {
                await addDoc(usersCollection, {userName, phone})
                alert("تم اضافة العميل بنجاح")
                setUserName("")
                setPhone("")
            }
        }
    }
    // DELETE USER FROM DATABASE
    const handleDelete = async(id) => {
        const delValue = doc(usersCollection, id)
        await deleteDoc(delValue)
    }

    // EDIT USER FROM DATABASE
    const handleEdit = (userName, phone, id) => {
        setOpenMenu(true)
        setUpdate(true)
        setHeaderTitle('تعديل العميل')
        setUserName(userName)
        setPhone(phone)
        setId(id)
    }
    // UPDATE USER FROM DATABASE
    const handleUpdate = async() => {
        const updateVal = doc(usersCollection, id)
        await updateDoc(updateVal, {userName, phone})
        alert("تم تعديل بيانات العميل بنجاح")
        setUserName('')
        setPhone('')
    }

    // GET USERS FROM DATABASE 
    useEffect(() => {
        if(search === "") {
            const getAllUsers = async() => {
                const querySnapshot = await getDocs(usersCollection)
                const usersList = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id}))
                setUsers(usersList)
            }
            getAllUsers()
        }else {
            const getFilteredUser = async() => {
                const q = query(usersCollection, where("userName", "==", search))
                const querySnapshot = await getDocs(q)
                const filteredUser = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id}))
                setUsers(filteredUser)
            }
            getFilteredUser()
        }
    }, [search, usersCollection])

    return(
        <div className="main">
            <Nav openNav={openNav} setOpenNav={setOpenNav}/>
            <div className={openMenu ? "shadowBox open" : "shadowBox"}>
                <div className={styles.addContainer}>
                    <div className={styles.header}>
                        <h2>{haderTitle}</h2>
                        <button onClick={handleCloseMenu}><IoIosCloseCircle /></button>
                    </div>
                    <div className={styles.addContent}>
                        <div className={styles.inputContainer}>
                            <label>اسم العميل: </label>
                            <input type="text" value={userName} onChange={(e) => setUserName(e.target.value)}/>
                        </div>
                        <div className={styles.inputContainer}>
                            <label>رقم الهاتف : </label>
                            <input type="number" value={phone} onChange={(e) => setPhone(e.target.value)}/>
                        </div>
                        {update ? <button onClick={handleUpdate}>تعديل العميل</button> : <button onClick={handleAddUser}>اضف العميل</button>}
                    </div>
                </div>
            </div>
            <section className="container">
                <div className="header">
                    <button onClick={handleOpenMenu}>
                        <span>اضف عميل جديد</span>
                        <span><FaPlusCircle /></span>
                    </button>
                    <div className="searchContainer">
                        <input list="products" placeholder="بحث" onChange={(e) => setSearch(e.target.value)}/>
                        <datalist id="products">
                            {users.map(user => {
                                return(
                                    <option key={user.id} value={user.userName}/>
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
                    <h2>صفحة العملاء</h2>
                </div>
                <div className="content">
                    <table>
                        <thead>
                            <tr>
                                <th>الاسم</th>
                                <th>رقم الهاتف</th>
                                <th>تعديلات</th>
                            </tr>
                        </thead>
                        <tbody> 
                            {users.map(user => {
                                return(
                                    <tr key={user.id}>
                                        <td>{user.userName}</td>
                                        <td>{user.phone}</td>
                                        <td>
                                            <button className="delBtn" onClick={() => handleDelete(user.id)}><FaRegTrashCan /></button>
                                            <button className="addBtn" onClick={() => handleEdit(user.userName, user.phone, user.id)}><FaPen /></button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}

export default Users;