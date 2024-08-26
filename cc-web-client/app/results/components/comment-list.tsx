import { CommentData } from "@/app/utilities/comment_fetching";
import styles from "../page.module.css"

type CommentListProps = {
    comments: CommentData[];
}

export default function CommentList({ comments }: CommentListProps) {
    return (
        <ul className={styles.commentList}>
            {comments.map((commentData, index) => (
                <li key={index} className={styles.commentItem}>
                    <p className={styles.commentText}>{commentData.comment}</p>
                    <p className={styles.score}>Relevancy Score: {commentData.relevancy_score}</p>
                    <p className={styles.score}>Offensivity Score: {commentData.offensivity_score}</p>
                </li>
            ))}
        </ul>
    );
}