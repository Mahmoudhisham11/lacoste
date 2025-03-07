"use client"; 
import styles from "./page.module.css";
import Link from "next/link";
import Nav from "./components/Nav/page";
import { FaSearch } from "react-icons/fa";
import { FaBars } from "react-icons/fa";
import { useEffect, useState } from "react";
import { CiMoneyBill } from "react-icons/ci";
import { FaUsers } from "react-icons/fa";
import { RiNewspaperLine } from "react-icons/ri";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

function Home() {
    const [openNav, setOpenNav] = useState(false)
    const [users, setUsers] = useState([])

    const handleOpenNav = () => {
        if(openNav) {
            setOpenNav(false)
        }else {
            setOpenNav(true)
        }
    }
    useEffect(() => {
        const getAllUsers = async() => {
            const usersCollection = collection(db, 'users')
            const querySnapshot = await getDocs(usersCollection)
            const usersList = querySnapshot.docs.map(doc => ({...doc.data(), id: doc.id}))
            setUsers(usersList)
        }
        getAllUsers()
    }, [])
    return (
        <main className="main">
            <Nav openNav={openNav} setOpenNav={setOpenNav}/>
            <section className="container">
                <div className="header">
                    <Link href="/Stock" className="headerLink">المخزن</Link>
                    <div className="searchContainer">
                        <input list="products" placeholder="بحث"/>
                        <p>| <FaSearch /></p>
                    </div>
                    <div className="menuBtn">
                        <button onClick={handleOpenNav}><FaBars /></button>
                    </div>
                </div>
                <div className="title">
                    <h2>الصفحة الرئيسية</h2>
                </div>
                <div className="mainContent">
                    <div className="card">
                        <div className="cardInfo">
                            <p>2000$</p>
                            <p>المبيعات</p>
                        </div>
                        <div className="cardIcon">
                            <p><CiMoneyBill /></p>
                        </div>
                    </div>
                    <div className="card">
                        <div className="cardInfo">
                            <p>{users.length}</p>
                            <p>العملاء</p>
                        </div>
                        <div className="cardIcon">
                            <p><FaUsers /></p>
                        </div>
                    </div>
                    <div className="card">
                        <div className="cardInfo">
                            <p>20</p>
                            <p>الفواتير</p>
                        </div>
                        <div className="cardIcon">
                            <p><RiNewspaperLine  /></p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    )
}

export default Home;



