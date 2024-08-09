"use client";

import { useSearchParams } from 'next/navigation';

export default function ResultPage() {
    const searchParams = useSearchParams();
    const productLink = searchParams.get('productLink');
    const commentCount = searchParams.get('commentCount');
    const pollutionLevel = searchParams.get('pollutionLevel');

    return (
        <div>
            <h1>Result Page</h1>
            <p>Product Link: {decodeURIComponent(productLink || '')}</p>
            <p>Number of Comments: {commentCount}</p>
            <p>Pollution Level: {pollutionLevel}</p>
        </div>
    );
}