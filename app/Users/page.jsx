"use client";
import styles from "./styles.module.css";
import { useState } from "react";
import Nav from "../components/Nav/page";
import { FaSearch } from "react-icons/fa";
import { FaBars } from "react-icons/fa";
import { FaPlusCircle } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import { FaPen } from "react-icons/fa";
import { IoIosCloseCircle } from "react-icons/io";

function Users() {
    const [openNav, setOpenNav] = useState(false)
    const [openMenu, setOpenMenu] = useState(false)
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
    return(
        <div className="main">
            <Nav openNav={openNav} setOpenNav={setOpenNav}/>
            <div className={openMenu ? "shadowBox open" : "shadowBox"}>
                <div className={styles.addContainer}>
                    <div className={styles.header}>
                        <h2>اضف عميل جديد</h2>
                        <button onClick={handleCloseMenu}><IoIosCloseCircle /></button>
                    </div>
                    <div className={styles.addContent}>
                        <div className={styles.inputContainer}>
                            <label>اسم العميل: </label>
                            <input type="text"/>
                        </div>
                        <div className={styles.inputContainer}>
                            <label>رقم الهاتف : </label>
                            <input type="number"/>
                        </div>
                        <button>اضف العميل</button>
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
                        <input list="products" placeholder="بحث"/>
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
                            <tr>
                                <td>محمود هشام</td>
                                <td>01124514331</td>
                                <td>
                                    <button><FaRegTrashCan /></button>
                                    <button><FaPen /></button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    )
}

export default Users;