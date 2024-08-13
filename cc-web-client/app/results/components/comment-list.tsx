type CommentListProps = {
    comments: string[];
}

export default function CommentList({ comments }: CommentListProps) {
    return (
        <ul style={{ listStyleType: 'none', padding: 0 }}>
            {comments.map((comment, index) => (
                <li key={index} style={{ padding: '10px', backgroundColor: '#FFF', marginBottom: '10px', borderRadius: '5px' }}>
                    {comment}
                </li>
            ))}
        </ul>
    );
}