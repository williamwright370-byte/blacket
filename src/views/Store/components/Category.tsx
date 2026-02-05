import styles from "../store.module.scss";

import { CategoryProps } from "../store.d";

export default function Category({ title, subTitle, spaceEvenly = false, children }: CategoryProps) {
    return (
        <div className={styles.category}>
            <div className={styles.categoryTitle}>{title}</div>
            <div className={styles.categorySubTitle}>{subTitle}</div>
            <div className={styles.categoryDivider} />
            <div className={styles.categoryProducts} style={spaceEvenly ? { justifyContent: "space-evenly" } : {}}>
                {children}
            </div>
        </div>
    );
}
