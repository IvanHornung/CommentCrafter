"use client";

import { useEffect, useState } from 'react';
import { fetchUserRequestSummary, UserSummary } from '../utilities/generation_history_fetching';
import styles from "./page.module.css";

const mockData = [
    {
      productName: "Gravity Zero Recliner - Outdoor Folding Adjustable Zero Gravity Chair",
      totalGenerations: 120,
      totalRequests: 15,
    },
    {
      productName: "Product B",
      totalGenerations: 85,
      totalRequests: 10,
    },
    {
      productName: "Product C",
      totalGenerations: 230,
      totalRequests: 25,
    },
    {
      productName: "Product D",
      totalGenerations: 150,
      totalRequests: 20,
    },
  ];


function GenerationHistoryPage() {
    const [userSummary, setUserSummary] = useState<UserSummary | null>(null);
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
          <h1>Generation History</h1>
          <div className={styles.cardContainer}>
            {mockData.map((product, index) => (
              <div key={index} className={styles.card}>
                <h2>{product.productName}</h2>
                <p>Total Generations: {product.totalGenerations}</p>
                <p>Total Requests: {product.totalRequests}</p>
              </div>
            ))}
          </div>
        </div>
      );
}

export default GenerationHistoryPage;
