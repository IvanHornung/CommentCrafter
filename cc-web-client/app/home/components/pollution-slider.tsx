"use client";

// import { useState } from "react";
import styles from "./pollution-slider.module.css";

type PollutionSliderProps = {
    pollutionLevel: string;
    setPollutionLevel: (level: string) => void;
};

export default function PollutionSlider({ pollutionLevel, setPollutionLevel }: PollutionSliderProps) {
    // const [pollutionLevel, setPollutionLevel] = useState("Low");

    return (
        <div className={styles.sliderContainer}>
            <p>Pollution Level:</p>
            <div className={styles.sliderValuesContainer}>
                <input type="range"
                    className={styles.slider}
                    min="1" 
                    max="3" 
                    value={pollutionLevel === "Low" ? 1 : pollutionLevel === "Moderate" ? 2 : 3} 
                    onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setPollutionLevel(value === 1 ? "Low" : value === 2 ? "Moderate" : "High");
                    }}
                />
                <div>{pollutionLevel}</div>
            </div>
        </div>
    );
}
