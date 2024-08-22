"use client";

import { useEffect, useState } from 'react';
import { fetchUserRequestSummary, UserSummary } from '../utilities/generation_history_fetching';

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
        <div>
            <h1>Generation History</h1>
            {userSummary?.total_comment_generations ? (
                <div>
                    <p>Total Comments Generated: {userSummary.total_comment_generations}</p>
                    <p>Total Generation Requests Made: {userSummary.total_gen_requests}</p>
                </div>
            ) : (
                <p>No user information available.</p>
            )}
        </div>
    );
}

export default GenerationHistoryPage;
