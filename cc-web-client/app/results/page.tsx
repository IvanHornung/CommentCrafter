"use client";

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CommentData, fetchInitialComments, pollForRemainingComments } from '../utilities/comment_fetching';
import CommentList from './components/comment-list';
import Pagination from './components/pagination';
import { User } from "firebase/auth";
import { getCurrentUser } from '../utilities/firebase/firebase';

export default function ResultPage() {
    const searchParams = useSearchParams();
    const productLink = searchParams.get('productLink');
    const commentCount = searchParams.get('commentCount');
    const pollutionLevel = searchParams.get('pollutionLevel');
    
    const [user, setUser] = useState<User | null>(null);
    const [comments, setComments] = useState<CommentData[]>([]); // state to hold the comments
    const [loading, setLoading] = useState(true); // manage loading status
    const [error, setError] = useState<string | null>(null); // manage errors
    const [currentPage, setCurrentPage] = useState(1); // manage current page (for pagination)
    const [productID, setProductID] = useState<string | null>(null); // manage product ID for polling (effectively job ID)
    
    const MAX_COMMENTS_PER_PAGE = 50;
    const totalPages = Math.ceil(parseInt(commentCount || '0', 10) / MAX_COMMENTS_PER_PAGE);

    const fetchCommentsForPage = async (page: number) => {

        // Only check if comments for this page are already loaded
        if (page <= comments.length / MAX_COMMENTS_PER_PAGE) {
            // If comments for this page are already loaded, no need to fetch or poll, just return
            return;
        }
    
        // If we're here, it means we're still loading comments in the background.
        // Either get first page comments or continue polling until all comments are loaded
        try {
            setLoading(true);            

            let currentUser = user;
    
            // If user is not set, get the current user
            if (!currentUser) {
                currentUser = await getCurrentUser();
                setUser(currentUser);
                console.log(`Current user: ${currentUser ? currentUser.uid : "NULL"}`)
            }

                // If user is still not available after attempting to fetch, exit the function
            if (!currentUser) {
                console.error("User not logged in.");
                setError("User not logged in.");
                return;
            }

            if (!productID) {
                console.log("ProductID not found, fetching initial comments...")

                // Fetch initial comments and product ID only if not already done
                const { comments: initialComments, productID: newProductID } = await fetchInitialComments({
                    user_id: currentUser.uid,
                    link: productLink || '',
                    numRequestedComments: parseInt(commentCount || '50', 10),
                    pollutionLevel: pollutionLevel || '',
                });

                // Update the state with initial comments and product ID
                setComments(initialComments);
                setProductID(newProductID);
            } else { // If still more comments are needed, start polling
                const remainingComments = await pollForRemainingComments(
                    user? user.uid : "",
                    productID,
                    comments.length > 0 ? comments[comments.length - 1].timestamp : null
                );
                // Append remaining comments to the state
                setComments(prevComments => [...prevComments, ...remainingComments]);
            }
        } catch (error) {
            console.error('Failed to fetch comments for page:', error);
            setError('Failed to load comments');
        } finally {
            setLoading(false);
        }
    };

    // Effect Hook to Trigger Data Fetching - This hook is used to trigger side effects.
    //   Here, it runs fetchCommentsForPage whenever currentPage changes.

    useEffect(() => {
        fetchCommentsForPage(currentPage); // Fetch comments for the current page when component mounts or page changes
    }, [currentPage]);

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


    if (loading && currentPage === 1) {
        return <div>Loading comments...</div>;
    } if (error) {
        return <div>Error: {error}</div>;
    }

    // Calculate the range of comments to display based on current page
    const indexOfLastComment = currentPage * MAX_COMMENTS_PER_PAGE;
    const indexOfFirstComment = indexOfLastComment - MAX_COMMENTS_PER_PAGE;
    const currentComments = comments.slice(indexOfFirstComment, indexOfLastComment);

    return (
        // TODO: make CSS files
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#F8F4E3' }}>
            <h1>Result Page</h1>
            <p>Product Link: <a href={decodeURIComponent(productLink || '')} target="_blank" rel="noopener noreferrer">{decodeURIComponent(productLink || '')}</a></p>
            <p>Number of Comments: {commentCount}</p>
            <p>Pollution Level: {pollutionLevel}</p>

            {/* TODO */}
            <CommentList comments={currentComments} /> {/* Display the current subset of comments */}

            {/* TODO */}
            <Pagination 
                currentPage={currentPage} 
                totalPages={totalPages} 
                handleNextPage={handleNextPage} 
                handlePreviousPage={handlePreviousPage} 
            />
        </div>
    );
}
