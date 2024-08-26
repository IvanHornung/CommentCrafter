import React, { useState } from 'react';
import styles from './view-request-summary-modal.module.css';


interface ViewRequestSummaryModalProps {
    total_comment_generations: number | null | undefined;
    total_gen_requests: number | null | undefined;
}

export default function ViewRequestSummaryModal({total_comment_generations, total_gen_requests} : ViewRequestSummaryModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    const openModal = () => {
        setIsOpen(true);
    };

    const closeModal = () => {
        setIsOpen(false);
    };

    return (
        <div>
            <button onClick={openModal} className={styles.btn}>
                View Requests Summary
            </button>

            {isOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>User Request Summary</h2>
                        <p><strong>Total Comments Generated:</strong> {total_comment_generations}</p>
                        <p><strong>Total Generation Requests Made:</strong> {total_gen_requests}</p>
                        <button onClick={closeModal} className={styles.closeButton}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}
