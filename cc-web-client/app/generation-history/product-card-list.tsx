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

export default function ProductCardList() {
    return (
        <div className={styles.cardContainer}>
            {mockData.map((product, index) => (
            <a
            key={index} 
            href={`https://github.com/IvanHornung`}  // Assuming you have a route for each product
            className={styles.cardLink}      // Add this class for additional styling if needed
            >
                <div key={index} className={styles.card}>
                    <h2>{product.productName}</h2>
                    <p><b>Total Generations:</b> {product.totalGenerations}</p>
                    <p><b>Total Requests:</b> {product.totalRequests}</p>
                </div>
            </a>
            ))}
          </div>
    );
}