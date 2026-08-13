import { useResource } from "@stores/ResourceStore/index";
import { useUser } from "@stores/UserStore/index";
import { useModal } from "@stores/ModalStore/index";
import { Button, Markdown, Textfit } from "@components/index";
import { ProductModal } from "../index";
import styles from "./subscription.module.scss";

import { BillingIntervalEnum } from "@blacket/types";
import { SubscriptionProps } from "../../store.d";

export default function Subscription({ subscription, interval = BillingIntervalEnum.MONTHLY }: SubscriptionProps) {
    const { resourceIdToPath } = useResource();
    const { user } = useUser();
    const { createModal } = useModal();

    if (!user) return null;

    const GRADIENT = {
        normal: `linear-gradient(${subscription.color1} 0%, ${subscription.color2} 100%)`,
        reverse: `linear-gradient(${subscription.color2} 0%, ${subscription.color1} 100%)`
    };

    const PRICE_TEXT = {
        [BillingIntervalEnum.MONTHLY]: subscription.monthlyPrice ? `$${subscription.monthlyPrice} / month` : null,
        [BillingIntervalEnum.YEARLY]: subscription.yearlyPrice ? `$${subscription.yearlyPrice} / year` : null,
        [BillingIntervalEnum.LIFETIME]: subscription.lifetimePrice ? `$${subscription.lifetimePrice} one time` : null
    };
    if (!PRICE_TEXT[interval]) return null;

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
                    onClick={() => createModal(<ProductModal subscription={subscription} />)}
                >
                    {PRICE_TEXT[interval]}
                    <div className={styles.lifetimeText}>
                        {subscription.lifetimePrice && PRICE_TEXT[BillingIntervalEnum.LIFETIME]}
                    </div>
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
