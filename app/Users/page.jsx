"use client";
import { useState } from "react";
import Nav from "../components/Nav/page";
import styles from "./styles.module.css";
import { IoSaveSharp } from "react-icons/io5";
import { IoMdCloseCircle } from "react-icons/io";
import { HiMiniBars3BottomRight } from "react-icons/hi2";

function Users() {
    const [userInfo, setUserInfo] = useState(false)
    const [openNav, setOpenNav] = useState(false)

    const handleOpen = () => {
        setUserInfo(true)
    }
    const handleClose = () => {
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
                            <input type="text"/>
                        </div>
                        <div className={styles.addInputs}>
                            <label htmlFor=""> رقم الهاتف :</label>
                            <input type="number"/>
                        </div>
                        <button className={styles.containerBtn}>اضف العميل</button> 
                        <button className={styles.closeBtn} onClick={handleClose}><IoMdCloseCircle/></button>
                    </div>
                </div>
            </div>
            <section className="container">
                <div className="header">
                    <h2>
                        <span>
                            <button onClick={handleOpenNav}><HiMiniBars3BottomRight/></button>
                        </span>
                        <span>صفحة العملاء</span>
                    </h2>
                    <div className="inputContainer">
                        <input type="text" placeholder="ابحث عن العميل"/>
                        <button onClick={handleOpen}>
                            <span><IoSaveSharp/></span>
                            <span>اضف عميل جديد</span>
                        </button>
                    </div>
                </div>
                <div className="content">
                    <table>
                        <thead>
                            <tr>
                                <th>اسم العميل</th>
                                <th>رقم الهاتف</th>
                                <th>تعديلات</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>محمود هشام</td>
                                <td>01124514331</td>
                                <td>
                                    <button>حذف</button>
                                    <button>تعديل</button>
                                </td>
                            </tr>
                            <tr>
                                <td>محمود هشام</td>
                                <td>01124514331</td>
                                <td>
                                    <button>حذف</button>
                                    <button>تعديل</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    )
}

export default Users;