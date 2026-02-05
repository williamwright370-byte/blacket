import { useResource } from "@stores/ResourceStore/index";
import { useUser } from "@stores/UserStore/index";
import styles from "./subscription.module.scss";

import { SubscriptionProps } from "../../store.d";
import { Button, Markdown, Textfit } from "@components/index";

export default function Subscription({ subscription }: SubscriptionProps) {
    const { resourceIdToPath } = useResource();
    const { user } = useUser();

    if (!user) return null;

    const GRADIENT = {
        normal: `linear-gradient(${subscription.color1} 0%, ${subscription.color2} 100%)`,
        reverse: `linear-gradient(${subscription.color2} 0%, ${subscription.color1} 100%)`
    };

    return (
        <div className={styles.subscription}>
            <div className={styles.topContainer}>
                <div
                    className={styles.top}
                    style={{
                        background: GRADIENT.reverse
                    }}
                />

                <img
                    className={styles.image}
                    src={resourceIdToPath(subscription.imageId)}
                    draggable={false}
                />
            </div>

            <Textfit min={0} max={50} mode="single" className={styles.name}>
                {subscription.name}
            </Textfit>

            <div className={styles.description}>
                <Markdown>
                    {subscription.description}
                </Markdown>
            </div>

            <div className={styles.bottom}>
                <Button.ClearButton
                    className={styles.subscribeButton}
                >
                    $9.99 / month
                </Button.ClearButton>
            </div>

            <div
                className={styles.boxShadow}
                style={{
                    boxShadow: `inset 0 0 0 4px ${subscription.color2}`
                }}
            />

            <div
                className={styles.background}
                style={{
                    background: GRADIENT.normal
                }}
            >
                <div className={styles.backgroundBlooks} style={{
                    backgroundImage: `url("${window.constructCDNUrl("/content/background.svg")}")`
                }} />
            </div>
        </div>
    );
}
