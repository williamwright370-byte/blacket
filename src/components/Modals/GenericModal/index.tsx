import { useEffect } from "react";
import { useAudio } from "@stores/AudioStore/index";
import styles from "./genericModal.module.scss";

import { GenericModalProps } from "./genericModal.d";

export default function GenericModal({ closing = false, noAnimation = false, children, outside, fullscreen }: GenericModalProps) {
    const { playSound } = useAudio();

    useEffect(() => {
        if (closing) playSound("modal-close");
        else playSound("modal-open");
    }, [closing]);

    return (
        <div data-closing={closing} data-animated={noAnimation ? false : true} className={styles.modal}>
            {outside && outside}

            <div data-closing={closing} data-animated={noAnimation ? false : true} className={styles.content}>
                <div data-closing={closing} data-animated={noAnimation ? false : true} data-fullscreen={fullscreen} className={styles.container}>
                    {children}
                </div>
            </div>
        </div>
    );
}
