import styles from "./comment-count-input.module.css";

type CommentCountInputProps = {
    commentCount: number;
    setCommentCount: (requested_comments: number) => void;
};

export default function CommentCountInput({ commentCount, setCommentCount }: CommentCountInputProps) {
    return (
        <div className={styles.commentInputContainer}>
            <label>
                <p>Number of Comments:</p>
                <input 
                    type="number" 
                    min="1" 
                    max="300" 
                    value={commentCount} 
                    onChange={(e) => setCommentCount(parseInt(e.target.value, 10))}
                    className={styles.numberInput}
                />
            </label>
        </div>
    );
}
