import { useEffect, useState } from 'react';
import styles from './aggregate-export-dropdown.module.css';
import { downloadCSV, downloadJSON, downloadXML } from '@/app/utilities/export_utils';
import { CommentData, fetchAggregateCommentsForProduct, ProductRecordData } from '@/app/utilities/comment_fetching';

interface ExportDropdownProps {
    userID: string | null;
    productID: string | null;
    productData: ProductRecordData | null;
}


export default function AggregateExportDropdown({ userID, productID, productData }: ExportDropdownProps) {
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [aggregateComments, setAggregateComments] = useState<CommentData[]>([]);

    useEffect(() => {
        fetchAggregateCommentsForProduct(
            userID as string,
            productID as string,
            setAggregateComments
        )
    }, []);


    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    const handleExportClick = (format: string) => {
        setDropdownOpen(false); // Close dropdown after selection

        const productLink = productData?.canonicalized_url
        const productName = productData?.product_name
        const productDescription = productData?.description


        switch (format) {
            case 'JSON':
                downloadJSON(aggregateComments, decodeURIComponent(productLink || ''), productName || '', productDescription || '');
                break;
            case 'XML':
                downloadXML(aggregateComments, decodeURIComponent(productLink || ''), productName || '', productDescription || '');
                break;
            case 'CSV':
                downloadCSV(aggregateComments, decodeURIComponent(productLink || ''), productName || '', productDescription || '');
                break;
            default:
                console.error('Unknown format:', format);
        }
    };

    return (
        <div className={styles.dropdownContainer}>
            <button 
                onClick={toggleDropdown} 
                className={styles.exportButton}
            >
                Export
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