"use client";
import styles from "./styles.module.css";
import Image from "next/image";
import Link from "next/link";
import logo from "../../../public/images/logo.png"
import { IoHomeSharp } from "react-icons/io5";
import { SiHomeassistantcommunitystore } from "react-icons/si";
import { MdOutlinePointOfSale } from "react-icons/md";
import { FaUsers } from "react-icons/fa";
import { RiNewspaperLine } from "react-icons/ri";
import { TbZoomMoney } from "react-icons/tb";
import { useEffect, useState } from "react";

function Nav({openNav, setOpenNav}) {
    const [hiddenLogo, setHiddenLogo] = useState(true)
    useEffect(() => {
        if(openNav) {
            setHiddenLogo(false)
        }else {
            setHiddenLogo(true)
        }
    }, [hiddenLogo, openNav])
    return(
        <nav className={openNav ? `${styles.nav} ${styles.open}` : `${styles.nav}`}>
            <div className={styles.title}>
                <Image src={logo} className={hiddenLogo ? `${styles.logo} ${styles.hide}`: `${styles.logo}`} alt="logo_image" />
            </div>
            <ul className={styles.ul}>
                <li>
                    <Link href="/" className={styles.navLinks}>
                        <span><IoHomeSharp /></span>
                        <span>الصفحة الرئيسية</span>
                    </Link>
                </li>
                <li>
                    <Link href="/Sale" className={styles.navLinks}>
                        <span><MdOutlinePointOfSale /></span>
                        <span>المبيعات</span>
                    </Link>
                </li>
                <li>
                    <Link href="/Stock" className={styles.navLinks}>
                        <span><SiHomeassistantcommunitystore/></span>
                        <span>المخزن</span>
                    </Link>
                </li>
                <li>
                    <Link href="/Users" className={styles.navLinks}>
                        <span><FaUsers /></span>
                        <span>العملاء</span>
                    </Link>
                </li>
                <li>
                    <Link href="Resete" className={styles.navLinks}>
                        <span><RiNewspaperLine /></span>
                        <span>الفواتير</span>
                    </Link>
                </li>
                <li>
                    <Link href="/Gard" className={styles.navLinks}>
                        <span><TbZoomMoney /></span>
                        <span>الجرد</span>
                    </Link>
                </li>
            </ul>
        </nav>
    )
}

export default Nav;