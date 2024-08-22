import { useState } from 'react';
import styles from './export-dropdown.module.css';
import { downloadCSV, downloadJSON, downloadXML } from '@/app/utilities/export_utils';
import { CommentData } from '@/app/utilities/comment_fetching';

interface ExportDropdownProps {
    onExport: (format: string) => void;
    comments: CommentData[];
    productLink: string | null;
    productName: string | undefined;
    productDescription: string | undefined;
}

export default function ExportDropdown({ onExport, comments, productLink, productName, productDescription }: ExportDropdownProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    const handleExportClick = (format: string) => {
        setDropdownOpen(false); // Close dropdown after selection

        switch (format) {
            case 'JSON':
                downloadJSON(comments, decodeURIComponent(productLink || ''), productName || '', productDescription || '');
                break;
            case 'XML':
                downloadXML(comments, decodeURIComponent(productLink || ''), productName || '', productDescription || '');
                break;
            case 'CSV':
                downloadCSV(comments, decodeURIComponent(productLink || ''), productName || '', productDescription || '');
                break;
            default:
                console.error('Unknown format:', format);
        }

        onExport(format); // Call the onExport prop with the selected format
    };

    return (
        <div className={styles.dropdownContainer}>
            <button 
                onClick={toggleDropdown} 
                className={styles.exportButton}
            >
                <b>Export</b>
            </button>
            {dropdownOpen && (
                <div className={styles.dropdownMenu}>
                    <button 
                        onClick={() => handleExportClick('JSON')} 
                        className={styles.dropdownItem}
                    >
                        Export JSON
                    </button>
                    <button 
                        onClick={() => handleExportClick('XML')} 
                        className={styles.dropdownItem}
                    >
                        Export XML
                    </button>
                    <button 
                        onClick={() => handleExportClick('CSV')} 
                        className={styles.dropdownItem}
                    >
                        Export CSV
                    </button>
                </div>
            )}
        </div>
    );
}