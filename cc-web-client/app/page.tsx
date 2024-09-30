import styles from "./page.module.css";
import HomePage from "./home/home-page";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <HomePage />
      </div>
    </main>
  );
}

// time period in seconds that we are going to refetch all http requests
export const revalidate = 30;
 
