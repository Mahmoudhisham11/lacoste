"use client"; 
import styles from "./page.module.css";
import Link from "next/link";
import Nav from "./components/Nav/page";
import { FaSearch } from "react-icons/fa";
import { FaBars } from "react-icons/fa";
import { useState } from "react";
import { CiMoneyBill } from "react-icons/ci";
import { FaUsers } from "react-icons/fa";
import { RiNewspaperLine } from "react-icons/ri";

function Home() {
    const [openNav, setOpenNav] = useState(false)
    const handleOpenNav = () => {
        if(openNav) {
            setOpenNav(false)
        }else {
            setOpenNav(true)
        }
    }
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
                            <p>50</p>
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



