"use client";

import styles from "../page.module.css";
import CommentCountInput from "./components/comment-count-input";
import GenerationButton from "./components/generation-button";
import LinkInputField from "./components/link-input-field";
import PollutionSlider from "./components/pollution-slider";
import { useState } from "react";
import { useRouter } from 'next/navigation';


export default function HomePage() {
    const router = useRouter();

    const [productLink, setProductLink] = useState("");
    const [pollutionLevel, setPollutionLevel] = useState("Low");
    const [commentCount, setCommentCount] = useState(50);

    const handleGenerate = () => {
        console.log("Product Link:", productLink);
        console.log("Number of Comments:", commentCount);
        console.log("Pollution Level:", pollutionLevel);
        //TODO: add restrictions and error handling
        const queryString = new URLSearchParams({
            commentCount: commentCount.toString(),
            pollutionLevel: pollutionLevel,
            productLink: encodeURIComponent(productLink)
        }).toString();
        // navigate to new page with params
        router.push(`/results?${queryString}`);
    };

    return (
        <main className={styles.main}>
            {/* TODO: Consider moving this to navbar */}
            <h1 className={styles.title}>CommentCrafter</h1>
            <div className={styles.formContainer}>
                <LinkInputField productLink={productLink} setProductLink={setProductLink} />
                <div className={styles.userParametersContainer}>
                    <CommentCountInput commentCount={commentCount} setCommentCount={setCommentCount}/>
                    <PollutionSlider pollutionLevel={pollutionLevel} setPollutionLevel={setPollutionLevel}/>
                    <GenerationButton handleGenerate={handleGenerate} />
                </div>
            </div>
        </main>
    );
}