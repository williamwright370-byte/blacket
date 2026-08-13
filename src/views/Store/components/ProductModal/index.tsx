import { useState } from "react";
import { useModal } from "@stores/ModalStore/index";
import { useResource } from "@stores/ResourceStore/index";
import { useData } from "@stores/DataStore/index";
import { useUser } from "@stores/UserStore/index";
import { Modal, Button, Markdown, ErrorContainer, ImageOrVideo } from "@components/index";
import styles from "./productModal.module.scss";

import { ProductModalProps } from "../../store.d";
import { BillingIntervalEnum, Forbidden, UserSubscriptionStatusEnum } from "@blacket/types";
import { getSubscriptionIntervalRank, getSubscriptionSwitchType } from "@blacket/common";

export default function ProductModal({ product, subscription }: ProductModalProps) {
    const { user } = useUser();
    if (!user) return null;
    if (!product && !subscription) return null;

    let name, description, price, discount, imageId;

    if (subscription) {
        name = subscription.name;
        description = subscription.description;
        price = 0;
        imageId = subscription.imageId;
    } else if (product) {
        name = product.name;
        description = product.description;
        price = product.price;
        discount = product.discount;
        imageId = product.imageId;
    } else return;

    if (!description) description = "No description available.";

    const { closeModal, createModal } = useModal();
    const { resourceIdToPath } = useResource();
    const { fontIdToName } = useData();

    const [error, setError] = useState<string>("");

    const FINAL_PRICE = !discount ? price :
        (price * (1 - (discount / 100))).toFixed(product?.isPriceUsingCrystals ? 0 : 2);

    const activeUserSubscription = user.subscriptions
        .filter((userSubscription) =>
            [UserSubscriptionStatusEnum.ACTIVE, UserSubscriptionStatusEnum.PENDING_CANCELLATION].includes(userSubscription.status as UserSubscriptionStatusEnum) &&
            (!userSubscription.expiresAt || new Date(userSubscription.expiresAt) > new Date())
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

    const canSwitchTo = (interval: BillingIntervalEnum) => {
        if (!subscription) return false;
        if (activeUserSubscription?.billingInterval === BillingIntervalEnum.LIFETIME) return false;

        return true;
    };

    const subscriptionOnClick = (interval: BillingIntervalEnum) => {
        if (!subscription) return;

        closeModal();
        createModal(<Modal.PurchaseProductModal subscription={subscription} subscriptionInterval={interval} />);
    };

    return (
        <>
            <Modal.ModalHeader>
                <span style={{
                    fontFamily: product?.fontId ? fontIdToName(product.fontId) : ""
                }}>
                    {name}
                </span>
            </Modal.ModalHeader >

            <Modal.ModalBody>
                <div className={styles.productInformationContainer}>
                    <div className={styles.productLeft}>
                        <Markdown userOverride={{
                            ...user,
                            fontId: product?.fontId ?? user.fontId
                        }}>
                            {description}
                        </Markdown>
                    </div>

                    <div className={styles.productRight}>
                        <div className={styles.productImageContainer}>
                            <ImageOrVideo className={styles.productImage} src={resourceIdToPath(imageId)} draggable={false} />
                        </div>
                    </div>
                </div>
            </Modal.ModalBody>

            {error !== "" && <ErrorContainer>{error}</ErrorContainer>}

            <Modal.ModalButtonContainer>
                {product && <Button.GenericButton onClick={() => {
                    if (product.isPriceUsingCrystals && (user.crystals < Number(FINAL_PRICE))) return setError(Forbidden.STRIPE_NOT_ENOUGH_CRYSTALS);

                    closeModal();

                    createModal(<Modal.PurchaseProductModal product={product} />);
                }} type="submit">
                    <div className={styles.productPrice}>
                        {product.isPriceUsingCrystals && <img className={styles.productCurrencyImage} src={window.constructCDNUrl("/content/crystal.png")} />}
                        {product.isPriceUsingCrystals ? `${FINAL_PRICE} Crystals` : `$${FINAL_PRICE} USD`}
                    </div>
                </Button.GenericButton>}

                {subscription && <>
                    {subscription.monthlyPrice && canSwitchTo(BillingIntervalEnum.MONTHLY) && <Button.GenericButton onClick={() => subscriptionOnClick(BillingIntervalEnum.MONTHLY)} type="submit">
                        <div className={styles.productPrice}>
                            ${subscription.monthlyPrice} USD / month
                        </div>
                    </Button.GenericButton>}

                    {subscription.yearlyPrice && canSwitchTo(BillingIntervalEnum.YEARLY) && <Button.GenericButton onClick={() => subscriptionOnClick(BillingIntervalEnum.YEARLY)} type="submit">
                        <div className={styles.productPrice}>
                            ${subscription.yearlyPrice} USD / year
                        </div>
                    </Button.GenericButton>}

                    {subscription.lifetimePrice && canSwitchTo(BillingIntervalEnum.LIFETIME) && <Button.GenericButton onClick={() => subscriptionOnClick(BillingIntervalEnum.LIFETIME)} type="submit">
                        <div className={styles.productPrice}>
                            ${subscription.lifetimePrice} USD one time
                        </div>
                    </Button.GenericButton>}
                </>}

                <Button.GenericButton onClick={closeModal}>Close</Button.GenericButton>
            </Modal.ModalButtonContainer>
        </>
    );
}
