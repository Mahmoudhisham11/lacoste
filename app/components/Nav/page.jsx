"use client"; 
import styles from "./styles.module.css";
import Link from "next/link";
import Image from "next/image";
import logo from "../../../public/images/logo.png"
import { IoHomeSharp } from "react-icons/io5";
import { SiHomeassistantcommunitystore } from "react-icons/si";
import { MdOutlinePointOfSale } from "react-icons/md";
import { FaToiletPaper } from "react-icons/fa";
import { BsPersonLinesFill } from "react-icons/bs";
import { IoIosCloseCircle } from "react-icons/io";

function Nav({openNav, setOpenNav}) {
    const handleCloseNav = () => {
        setOpenNav(false)
    }
    return (
        <nav className={openNav ? `${styles.nav} ${styles.open}` : `${styles.nav}`}>
            <button onClick={handleCloseNav} className={styles.closeBtn}><IoIosCloseCircle/></button>
            <div className={styles.title}>
                <Image src={logo} className={styles.logo} alt="logo-image"/>
            </div>
            <div className={styles.linkContainer}>
                <ul>
                    <li>
                        <Link href="/" className={styles.navLink}>
                            <span><MdOutlinePointOfSale/></span>
                            <span>المبيعات</span>
                        </Link>
                    </li>
                    <li>
                        <Link href="/Stock" className={styles.navLink}>
                            <span><SiHomeassistantcommunitystore/></span>
                            <span>المخزن</span>
                        </Link>
                    </li>
                    <li>
                        <Link href="/Users" className={styles.navLink}>
                            <span><BsPersonLinesFill/></span>
                            <span>العملاء</span>
                        </Link>
                    </li>
                    <li>
                        <Link href="/" className={styles.navLink}>
                            <span><FaToiletPaper/></span>
                            <span>الفواتير</span>
                        </Link>
                    </li>
                </ul>
            </div>
        </nav>
    )
}

export default Nav;