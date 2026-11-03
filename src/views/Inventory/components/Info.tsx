import styles from "../inventory.module.scss";

import { InfoProps } from "../inventory.d";

export default function Info({ name, icon, mobile = false, children, ...props }: InfoProps) {
    return (
        <div className={styles.info} data-mobile={mobile} {...props}>
            <div className={styles.infoText}>
                <i className={icon} />
                {name}
            </div>

            <span style={{ fontWeight: "bold" }}>{children}</span>
        </div>
    );
}
