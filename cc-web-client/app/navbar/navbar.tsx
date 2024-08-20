"use client";
// Specify this is a client-side component
// We also don't want a route for the navbar, so the file name is not `page.tsx` 


import Link from "next/link";
import styles from "./navbar.module.css";
import Image from "next/image";
import SignInButton from "./sign-in-button";
import { onAuthStateChangedHelper } from "../utilities/firebase/firebase";
import { useEffect, useState } from "react";
import { User } from "firebase/auth";
import GenerationHistoryButton from "./generation-history-button";



export default function NavBar() {
    // maintaining state within function in js is called Closure
    
    // use state hook
    const [user, setUser] = useState<User | null>(null); // init user state to null

    useEffect(() => { // hooks into the lifecycle of NavBar component
        const unsubscribe = onAuthStateChangedHelper((user) => {
            setUser(user);
        });

        // clean up to unmount
        return () => unsubscribe(); //return, not call
    });

    return (
        <nav className={styles.nav}>
            <Link href="/">
                <Image width={270} height={60}
                    src="/cc-logo.svg" alt="CC Logo"/>
            </Link>
            <div className={styles.rightButtons}>
                <GenerationHistoryButton user={user}/>
                <SignInButton user={user}/>
            </div>
        </nav>
    );
}