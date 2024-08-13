
type PaginationProps = {
    currentPage: number;
    totalPages: number;
    handleNextPage: () => void;
    handlePreviousPage: () => void;
};


export default function Pagination({ currentPage, totalPages, handleNextPage, handlePreviousPage }: PaginationProps) {
    return (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
            <button 
                onClick={handlePreviousPage} 
                disabled={currentPage === 1}
                style={{ marginRight: '10px', padding: '10px', backgroundColor: '#00BFFF', color: '#FFF', border: 'none', borderRadius: '5px' }}
            >
                Previous
            </button>
            <span>Page {currentPage} of {totalPages}</span>
            <button 
                onClick={handleNextPage} 
                disabled={currentPage === totalPages}
                style={{ marginLeft: '10px', padding: '10px', backgroundColor: '#00BFFF', color: '#FFF', border: 'none', borderRadius: '5px' }}
            >
                Next
            </button>
        </div>
    );
}