"use client";

import { useEffect, useState } from 'react';
import { fetchProductRequests as fetchUserProductRequests, fetchUserRequestSummary, ProductItem, UserSummary } from '../utilities/generation_history_fetching';
import styles from "./page.module.css";
import ProductCardList from './product-card-list';
import ViewRequestSummaryModal from './view-request-summary-modal';



export default function GenerationHistoryPage() {
    const [userSummary, setUserSummary] = useState<UserSummary | null>(null);
    const [productList, setProductList] = useState<ProductItem[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const userIDParam = queryParams.get('userID')?.replace(/['"]+/g, '');

        if (userIDParam) {
            fetchUserRequestSummary(
                userIDParam,
                setUserSummary
            );

            fetchUserProductRequests(
               userIDParam,
               setProductList
            )
        } else {
            setError('No userID provided in the URL');
        }
        setLoading(false);
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    return (
        <div className={styles.container}>
          <div className={styles.header}>
            <h1>Generation History</h1>
            <ViewRequestSummaryModal total_comment_generations={userSummary?.total_comment_generations} total_gen_requests={userSummary?.total_gen_requests}/>
          </div>
          <ProductCardList />
        </div>
      );
}
