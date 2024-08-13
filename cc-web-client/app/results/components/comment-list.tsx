import { CommentData } from "@/app/utilities/comment_fetching";

type CommentListProps = {
    comments: CommentData[];
}

export default function CommentList({ comments }: CommentListProps) {
    return (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
            {comments.map((commentData, index) => (
                <li key={index} style={{ padding: '10px', backgroundColor: '#FFF', marginBottom: '10px', borderRadius: '5px' }}>
                    <p style={{ margin: 0, fontWeight: 'bold' }}>{commentData.comment}</p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.9em' }}>Relevancy Score: {commentData.relevancy_score}</p>
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.9em' }}>Offensivity Score: {commentData.offensivity_score}</p>
                </li>
            ))}
        </ul>
    );
}