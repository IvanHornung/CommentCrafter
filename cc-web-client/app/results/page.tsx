"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { generateComments } from '../utilities/generation';


export default function ResultPage() {
    const searchParams = useSearchParams();
    const productLink = searchParams.get('productLink');
    const commentCount = searchParams.get('commentCount');
    const pollutionLevel = searchParams.get('pollutionLevel');

    const [comments, setComments] = useState<string[]>([]); // state to hold the comments
    const [loading, setLoading] = useState(true); // manage loading status
    const [error, setError] = useState<string | null>(null); // manage errors

    useEffect(() => {
        const fetchComments = async () => {
            try {
                if (productLink && commentCount && pollutionLevel) {
                    const comments = await generateComments(
                        decodeURIComponent(productLink),
                        parseInt(commentCount, 10),
                        pollutionLevel
                    );
                    console.log(comments)
                    setComments(comments); // set the comments from the API response
                }
                comments.forEach(c => console.log(c))
                // console.log(comments)
            } catch (error) {
                console.error('Failed to fetch comments:', error);
                setError('Failed to load comments');
            } finally {
                setLoading(false); // set loading to false after request completes
            }
        };

        fetchComments(); // trigger the fetch function when component mounts
    }, [productLink, commentCount, pollutionLevel]);

    if (loading) {
        return <div>Loading comments...</div>;
    } if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <div>
            <h1>Result Page</h1>
            <p>Product Link: {decodeURIComponent(productLink || '')}</p>
            <p>Number of Comments: {commentCount}</p>
            <p>Pollution Level: {pollutionLevel}</p>
        </div>
    );
}