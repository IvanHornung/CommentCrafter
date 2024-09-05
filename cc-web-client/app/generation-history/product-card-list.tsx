import { ProductItem } from "../utilities/generation_history_fetching";
import styles from "./page.module.css";


export interface ProductCardListProps {
    userID: string;
    productList: ProductItem[];
}  

export default function ProductCardList({ userID, productList }: ProductCardListProps) {
    return (
        <div className={styles.cardContainer}>
            {productList && productList.length > 0 ? (
                productList.map((product, index) => (
                    <a
                        key={index} 
                        href={`/product-record?userID=${encodeURIComponent(userID)}&productID=${encodeURIComponent(product.product_id)}`}
                        className={styles.cardLink}      // Add this class for additional styling if needed
                    >
                        <div key={index} className={styles.card}>
                            <h2>{product.product_name}</h2>
                            <p><b>Total Generations:</b> {product.total_comments}</p>
                            <p><b>Total Requests:</b> {product.total_gen_requests}</p>
                        </div>
                    </a>
                ))
            ) : (
                <p>No products available.</p> // Optional: Add a fallback if the list is empty or undefined
            )}
        </div>
    );
}