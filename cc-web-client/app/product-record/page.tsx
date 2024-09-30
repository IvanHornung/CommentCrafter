"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import { fetchProductInformation, ProductRecordData } from "../utilities/comment_fetching";
import AggregateExportDropdown from "./aggregate-export-dropdown";

function ProductRecordPageContent() {
    const searchParams = useSearchParams();
    const userID = searchParams.get("userID");
    const productID = searchParams.get("productID");

    const [productData, setProductData] = useState<ProductRecordData | null>(null);

    useEffect(() => {
        if (userID && productID) {
            fetchProductInformation(userID, productID, setProductData);
        }
    }, [userID, productID]); // Added userID and productID as dependencies

    return (
        <div className={styles.container}>
            <h1 className={styles.productTitle}> {productData?.product_name}</h1>
            <p className={styles.productDescription}>
                {productData?.description}
            </p>
            <div className={styles.stats}>
                <h4 className={styles.statBox}><b>Comments Generated: {productData?.total_comments}</b></h4>
                <h4 className={styles.statBox}>Requests Made: {productData?.total_gen_requests}</h4>
            </div>
            <div className={styles.buttonWrapper}>
                <AggregateExportDropdown userID={userID} productID={productID} productData={productData} />
            </div>
            <div className={styles.buttonWrapper}>
                <h1>Past Generations Requests</h1>
            </div>
        </div>
    );
}

export default function ProductRecordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProductRecordPageContent />
        </Suspense>
    );
}
