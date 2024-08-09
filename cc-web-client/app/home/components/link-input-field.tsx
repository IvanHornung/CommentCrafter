import styles from "./link-input-field.module.css";

type LinkInputFieldProps = {
    productLink: string;
    setProductLink: (url: string) => void;
}

export default function LinkInputField({ productLink, setProductLink }: LinkInputFieldProps) {
    return (
        <div className={styles.inputLinkContainer}>
            <p>Enter Product Link:</p>
            <label className={styles.label}>
                <input
                    type="text"
                    className={styles.linkInput}
                    value={productLink}
                    onChange={(e) => setProductLink(e.target.value)}
                />
            </label>
        </div>
    );
}
