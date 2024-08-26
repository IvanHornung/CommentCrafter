import React, { useState } from 'react';
import styles from './input-view-modal.module.css';


interface ViewInputModalProps {
    productCanonicalizedURL: string | null | undefined;
    commentCount: number | null;
    pollutionLevel: string | null;
}

export default function ViewInputModal({productCanonicalizedURL, commentCount, pollutionLevel} : ViewInputModalProps) {
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
                View Input
            </button>

            {isOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2>Input Data</h2>
                        <p><strong>Product Link:</strong></p>
                        <p><a href={decodeURIComponent(productCanonicalizedURL || '')} target="_blank" rel="noopener noreferrer">{decodeURIComponent(productCanonicalizedURL || '')}</a></p>
                        <p><strong>Number Comments Requested:</strong></p>
                        <p>{commentCount}</p>
                        <p><strong>Requested Pollution Level:</strong></p>
                        <p>{pollutionLevel}</p>
                        <button onClick={closeModal} className={styles.closeButton}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}
