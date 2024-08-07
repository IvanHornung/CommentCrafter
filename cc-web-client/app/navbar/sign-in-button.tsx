import styles from './sign-in-button.module.css';

import { Fragment } from "react";
import { signUserInWithGoogle, signUserOut } from '../utilities/firebase/firebase';
import { User } from 'firebase/auth';

interface SignInProps {
    user: User | null;
}

export default function SignInButton({ user }: SignInProps) {
    return (
        <Fragment>
            { user ? // ternary logic for deciding which component to render based off User state
                (
                    <button className={styles.signinbutton} onClick={signUserOut}>
                        Sign Out
                    </button>
                ) : (
                    <button className={styles.signinbutton} onClick={signUserInWithGoogle}>
                        Sign In
                    </button> 
                )
            }
        </Fragment>
    );
}