import styles from "./generation-button.module.css";

type GenerationButtonProps = {
    handleGenerate: () => void;
};

export default function GenerationButton({ handleGenerate }: GenerationButtonProps) {
    return (
        <div className={styles.generateButtonContainer}>
            <button className={styles.generateButton} onClick={handleGenerate}>
                <b>Generate</b>
            </button>
        </div>
    );
}
