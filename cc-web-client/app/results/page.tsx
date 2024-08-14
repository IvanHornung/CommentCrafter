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
    const commentCountString = searchParams.get('commentCount');
    const commentCount = commentCountString ? parseInt(commentCountString, 10) : 25;
    const pollutionLevel = searchParams.get('pollutionLevel');
    
    const [user, setUser] = useState<User | null>(null);
    const [comments, setComments] = useState<CommentData[]>([]); // state to hold the comments
    const [loading, setLoading] = useState(true); // manage loading status
    const [error, setError] = useState<string | null>(null); // manage errors
    const [currentPage, setCurrentPage] = useState(1); // manage current page (for pagination)
    const [productID, setProductID] = useState<string | null>(null); // manage product ID for polling (effectively job ID)
    
    const MAX_COMMENTS_PER_PAGE = 50;
    const totalPages = Math.ceil(commentCount / MAX_COMMENTS_PER_PAGE);

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

                //TODO: fix bug where first 50 commenst are stored duplicately

                // Fetch initial comments and product ID only if not already done
                const { comments: initialComments, productID: newProductID } = await fetchInitialComments({
                    user_id: currentUser.uid,
                    link: productLink || '',
                    numRequestedComments: commentCount,
                    pollutionLevel: pollutionLevel || '',
                });

                // Update the state with initial comments and product ID
                console.log("Initial Comments Fetched:", initialComments);
                // setComments(initialComments);
                setProductID(newProductID);

                // start polling in the background without block (note: no await keyword)
                pollForRemainingComments(
                    currentUser? currentUser.uid : "",
                    newProductID as string,
                    initialComments.length > 0 ? initialComments[initialComments.length - 1].timestamp : null,
                    5000, 20,
                    (newComments) => {
                        setComments(prevComments => [...prevComments, ...newComments]);
                        console.log('UI Updated with comments:', newComments);
                    }
                );
            } 
            // else { // If still more comments are needed, start polling
            //     const remainingComments = await pollForRemainingComments(
            //         user? user.uid : "",
            //         productID,
            //         comments.length > 0 ? comments[comments.length - 1].timestamp : null,
            //         5000, 20,
            //         (newComments) => {
            //             setComments(prevComments => [...prevComments, ...newComments]);
            //             console.log('UI Updated with comments:', newComments);
            //         }
            //     );
            //     console.log("Remaining Comments Fetched:", remainingComments);
            // }
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


    if (loading) { // && currentPage === 1) {
        return <div>Loading comments...</div>;
    } if (error) {
        return <div>Error: {error}</div>;
    }

    // Calculate the range of comments to display based on current page
    const indexFirstComment = (currentPage - 1) * MAX_COMMENTS_PER_PAGE;
    const indexLastComment = indexFirstComment + ((currentPage == totalPages) ? 
        comments.length % MAX_COMMENTS_PER_PAGE || MAX_COMMENTS_PER_PAGE : 
        MAX_COMMENTS_PER_PAGE
    );
    const commentsForCurrentPage = comments.length > 0 ? comments.slice(indexFirstComment, indexLastComment) : [];

    console.log(`Loading UI with ${comments.length} comments locally stored...`);

    return (
        // TODO: make CSS files
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', backgroundColor: '#F8F4E3' }}>
            <h1>Result Page</h1>
            <p>Product Link: <a href={decodeURIComponent(productLink || '')} target="_blank" rel="noopener noreferrer">{decodeURIComponent(productLink || '')}</a></p>
            <p>Number of Comments: {commentCount}</p>
            <p>Pollution Level: {pollutionLevel}</p>

            {/* Only display comments if they are available */}
            {commentsForCurrentPage.length > 0 ? (
                <CommentList comments={commentsForCurrentPage} />
            ) : (
                <div>Loading...</div>
            )}

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

/* Slicing test
// Note: please restart the page if syntax highlighting works bad.
let commentCount = 151
let max_per = 50
let total_pages = Math.ceil(commentCount/max_per)

let current_page = 4

let indexFirst = (current_page - 1) * max_per
console.log()
let output = (current_page == total_pages) ? indexFirst + (commentCount % max_per || max_per)
: indexFirst + max_per

console.log(output)
*/