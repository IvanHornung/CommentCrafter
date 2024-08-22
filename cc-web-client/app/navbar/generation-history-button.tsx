import styles from './generation-history-button.module.css';

import { Fragment } from "react";
import { User } from 'firebase/auth';

interface SignInProps {
    user: User | null;
}

export default function GenerationHistoryButton({ user }: SignInProps) {
    return (
        <Fragment>
            { user ? // ternary logic for deciding which component to render based off User state
                (
                    <button
                        className={styles.generationHistoryButton}
                        onClick={async () => {
                            const queryParams = new URLSearchParams({ userID: JSON.stringify(user.uid) });
                            window.location.href = `/generation-history?${queryParams.toString()}`;
                        }}                        
                    >
                        <b>Generation History</b>
                    </button>
                ) : (
                    <p></p>
                )
            }
        </Fragment>
    );
}