import { useResource } from "@stores/ResourceStore/index";
import { PlanContainerProps } from "../billing.d";
import styles from "../billing.module.scss";

export default function PlanContainer({ subscription, children }: PlanContainerProps) {
    const { resourceIdToPath } = useResource();

    return (
        <div className={styles.planContainer} style={{
            background: subscription ? `linear-gradient(135deg, ${subscription.color1} 0%, ${subscription.color2} 100%)` : undefined
        }}>
            <div className={styles.planDetailsContainer}>
                <img src={subscription ? resourceIdToPath(subscription.imageId) : window.constructCDNUrl("/content/logo.png")} className={styles.planLogo} />

                <div className={styles.planDetails}>
                    <div className={styles.planName}>
                        {subscription ? subscription.name : `${import.meta.env.VITE_INFORMATION_NAME} Basic`}
                    </div>

                    <div className={styles.planDescription}>
                        {subscription ? subscription.shortDescription : "You are currently not subscribed to any plan."}
                    </div>
                </div>
            </div>

            <div className={styles.planActions}>
                {children}
            </div>
        </div>
    );
}
