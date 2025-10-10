'use client';
import styles from "./styles.module.css";
import Image from "next/image";
import Link from "next/link";
import logo from "../../public/images/logo.png"
import { IoHomeOutline } from "react-icons/io5";
import { IoIosPhonePortrait } from "react-icons/io";
import { TbMoneybag } from "react-icons/tb";
import { HiOutlineWallet } from "react-icons/hi2";
import { BiLogOutCircle } from "react-icons/bi";
import { TbReportSearch } from "react-icons/tb";
import { TbReportMoney } from "react-icons/tb";
import { IoPersonSharp } from "react-icons/io5";
import { IoIosCloseCircle } from "react-icons/io";

function SideBar({openSideBar, setOpenSideBar}) {
    const handleLogout = () => {
        if(typeof window !== 'undefined') {
            localStorage.clear()
            window.location.reload()
        }
    }
    return(
        <div className={openSideBar ? `${styles.sideBar} ${styles.active}` : `${styles.sideBar}`}>
            <div className={styles.title}>
                <h2>Lacoste</h2>
                <div className={styles.imageContainer}>
                    <Image src={logo} fill style={{objectFit: 'cove'}} alt="logoImage"/>
                </div>
                <button className={styles.closeBtn} onClick={() => setOpenSideBar(false)}><IoIosCloseCircle/></button>
            </div>
            <div className={styles.actions}>
                <Link href={'/'} className={styles.actionLinks}>
                    <span><IoHomeOutline/></span>
                    <span>الصفحة الرئيسية</span>
                </Link>
                <Link href={'/products'} className={styles.actionLinks}>
                    <span><HiOutlineWallet/></span>
                    <span>المنتجات</span>
                </Link>
                <Link href={'/customers'} className={styles.actionLinks}>
                    <span><IoPersonSharp/></span>
                    <span>الزباين</span>
                </Link>
                <Link href={'/masrofat'} className={styles.actionLinks}>
                    <span><TbMoneybag/></span>
                    <span>المصاريف</span>
                </Link>
                <Link href={'/employees'} className={styles.actionLinks}>
                    <span><IoPersonSharp/></span>
                    <span>الموظفين</span>
                </Link>
                <Link href={'/debts'} className={styles.actionLinks}>
                    <span><TbReportMoney/></span>
                    <span>الديون</span>
                </Link>
                <Link href={'/reports'} className={styles.actionLinks}>
                    <span><TbReportSearch/></span>
                    <span>التقارير</span>
                </Link>
            </div>
            <div className={styles.actions}>
                <Link href={'/'} className={styles.actionLinks} onClick={handleLogout}>
                    <span><BiLogOutCircle/></span>
                    <span>تسجيل الخروج</span>
                </Link>
            </div>
        </div>
    )
}

export default SideBar;