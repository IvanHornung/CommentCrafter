// we don't want a route for the navbar, so the file name is not `page.tsx` 
import Link from "next/link";
import styles from "../page.module.css";
import Image from "next/image";

export default function NavBar() {
    return (
        <nav className={styles.nav}>
            <Link href="/">
                <Image width={270} height={60}
                    src="/cc-logo.svg" alt="CC Logo"/>
            </Link>
        </nav>
    );
}