import { ProductItem } from "../utilities/generation_history_fetching";
import styles from "./page.module.css";

const mockData = [
    {
      productName: "Gravity Zero Recliner - Outdoor Folding Adjustable Zero Gravity Chair",
      totalGenerations: 120,
      totalRequests: 15,
    },
    {
      productName: "Product B",
      totalGenerations: 85,
      totalRequests: 10,
    },
    {
      productName: "Product C",
      totalGenerations: 230,
      totalRequests: 25,
    },
    {
      productName: "Product D",
      totalGenerations: 150,
      totalRequests: 20,
    },
    {
        productName: "Product D",
        totalGenerations: 150,
        totalRequests: 20,
      },
      {
        productName: "Product D",
        totalGenerations: 150,
        totalRequests: 20,
      },
  ];


export interface ProductCardListProps {
    productList: ProductItem[];
}  

export default function ProductCardList({ productList }: ProductCardListProps) {
    console.log(productList)
    return (
        <div className={styles.cardContainer}>
            {productList && productList.length > 0 ? (
                productList.map((product, index) => (
                    <a
                        key={index} 
                        href={`https://github.com/IvanHornung`}  // Assuming you have a route for each product
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