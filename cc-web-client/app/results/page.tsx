"use client";

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from "./page.module.css";
import { CommentData, triggerCommentsGen, pollForGeneratedComments, ProductData, pollForProductInformation } from '../utilities/comment_fetching';
import CommentList from './components/comment-list';
import Pagination from './components/pagination';
import { User } from "firebase/auth";
import { getCurrentUser } from '../utilities/firebase/firebase';
import ExportDropdown from './components/export-dropdown';
import ViewInputModal from "./components/input-view-modal";

function ResultPageContent() {
    const searchParams = useSearchParams();
    const productLink = searchParams.get('productLink');
    const commentCountString = searchParams.get('commentCount');
    const commentCount = commentCountString ? parseInt(commentCountString, 10) : 25;
    const pollutionLevel = searchParams.get('pollutionLevel');
    
    const [user, setUser] = useState<User | null>(null);
    const [comments, setComments] = useState<CommentData[]>([]); // state to hold the comments
    const [loading, setLoading] = useState(true); // manage loading status
    const [error, setError] = useState<string | null>(null); // manage errors
    const [currentPage, setCurrentPage] = useState(1); // manage current page (for pagination)
    const [productID, setProductID] = useState<string | null>(null); // manage product ID for polling (effectively job ID)
    const [genRequestID, setGenRequestID] = useState<string | null>(null); // manage product ID for polling (effectively job ID)
    const [productData, setProductData] = useState<ProductData | null>(null);

    const MAX_COMMENTS_PER_PAGE = 50;
    const totalPages = Math.ceil(commentCount / MAX_COMMENTS_PER_PAGE);

    const fetchCommentsForPage = async (page: number) => {

        // Only check if comments for this page are already loaded
        if (page <= comments.length / MAX_COMMENTS_PER_PAGE) {
            // If comments for this page are already loaded, no need to fetch or poll, just return
            return;
        }
    
        try {
            setLoading(true);            

            let currentUser = user;
    
            // If user is not set, get the current user
            if (!currentUser) {
                currentUser = await getCurrentUser();
                setUser(currentUser);
                console.log(`Current user: ${currentUser ? currentUser.uid : "NULL"}`)
            }

            if (!currentUser) {
                console.error("User not logged in.");
                setError("User not logged in.");
                return;
            }

            if (!productID) { 
                console.log("Triggering comment generation...");

                const {
                    comments: initialComments,
                    productID: newProductID,
                    genRequestID: newGenRequestID
                } = await triggerCommentsGen({
                    user_id: currentUser.uid,
                    link: productLink || '',
                    numRequestedComments: commentCount,
                    pollutionLevel: pollutionLevel || '',
                });

                setProductID(newProductID);
                setGenRequestID(newGenRequestID);
                
                pollForProductInformation(
                    currentUser ? currentUser.uid : "",
                    newProductID as string,
                    5000, 20,
                    setProductData
                );

                pollForGeneratedComments(
                    currentUser ? currentUser.uid : "",
                    newProductID as string,
                    newGenRequestID as string,
                    initialComments.length > 0 ? initialComments[initialComments.length - 1].timestamp : null,
                    5000, 20,
                    (newComments) => {
                        setComments(prevComments => [...prevComments, ...newComments]);
                        console.log('UI Updated with comments:', newComments);
                    }
                );
            } 
        } catch (error) {
            console.error('Failed to fetch comments for page:', error);
            setError('Failed to load comments');
        } finally {
            setLoading(false);
        }
    };

    // Trigger data fetching when currentPage changes
    useEffect(() => {
        fetchCommentsForPage(currentPage);
    }, [currentPage, productLink, commentCount, pollutionLevel, productID, user]);

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleExport = (format: string) => {
        console.log(`Exporting data as ${format}`);
    };

    if (loading) {
        return <div>Loading comments...</div>;
    } 
    if (error) {
        return <div>Error: {error}</div>;
    }

    const indexFirstComment = (currentPage - 1) * MAX_COMMENTS_PER_PAGE;
    const indexLastComment = indexFirstComment + ((currentPage == totalPages) ? 
        comments.length % MAX_COMMENTS_PER_PAGE || MAX_COMMENTS_PER_PAGE : 
        MAX_COMMENTS_PER_PAGE
    );
    const commentsForCurrentPage = comments.length > 0 ? comments.slice(indexFirstComment, indexLastComment) : [];

    return (
        <div className={styles.container}>
            <h1 className={styles.productTitle}>{productData?.product_name}</h1>
            <p className={styles.productDescription}>
                {productData?.description}
            </p>
            <div className={styles.buttonGroup}>
                <ViewInputModal productCanonicalizedURL={productData?.canonicalized_url} commentCount={commentCount} pollutionLevel={pollutionLevel}/>
                <ExportDropdown onExport={handleExport} comments={comments} productLink={productLink} productName={productData?.product_name} productDescription={productData?.description}/>
            </div>
            <h1 className={styles.resultsTitle}>Generation Results</h1>
            <CommentList comments={commentsForCurrentPage} />
            <Pagination
                currentPage={currentPage} 
                totalPages={totalPages} 
                handleNextPage={handleNextPage} 
                handlePreviousPage={handlePreviousPage} 
            />
        </div>
    );
}

export default function ResultPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResultPageContent />
        </Suspense>
    );
}
