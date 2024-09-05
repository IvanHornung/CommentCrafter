"use client";

import { useSearchParams } from "next/navigation";
import styles from "./page.module.css";
import { useEffect, useState } from "react";
import { fetchProductInformation, ProductRecordData } from "../utilities/comment_fetching";
import AggregateExportDropdown from "./aggregate-export-dropdown";

export default function ProductRecordPage() {
    const searchParams = useSearchParams();
    const userID = searchParams.get("userID");
    const productID = searchParams.get("productID");

    const [productData, setProductData] = useState<ProductRecordData | null>(null);

    useEffect(() => {
        fetchProductInformation(
            userID || "",
            productID || "",
            setProductData
        );
    }, []);

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
            <AggregateExportDropdown userID={userID} productID={productID} productData={productData}/>
        </div>
    );
}


// next up:
// add to fetchProductData to  including #comments, #req, & list of gen_req
// list gen_req 