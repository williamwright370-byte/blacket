import { useState } from "react";
import { useModal } from "@stores/ModalStore/index";
import { useResource } from "@stores/ResourceStore/index";
import { useData } from "@stores/DataStore/index";
import { useUser } from "@stores/UserStore/index";
import { Modal, Button, Markdown, ErrorContainer, ImageOrVideo } from "@components/index";
import styles from "./productModal.module.scss";

import { ProductModalProps } from "../../store.d";
import { BillingIntervalEnum, Forbidden, SubscriptionSwitchType, UserSubscriptionStatusEnum } from "@blacket/types";
import { getSubscriptionIntervalRank, getSubscriptionSwitchType, calculateFinalPrice, calculateSubscriptionDisplayPrice } from "@blacket/common";

export default function ProductModal({ product, subscription }: ProductModalProps) {
    const { user } = useUser();
    if (!user) return null;

    const { subscriptions } = useData();

    if (!product && !subscription) return null;

    let name, description, price, discount, imageId;

    if (subscription) {
        name = subscription.name;
        description = subscription.description;
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

    const FINAL_PRICE = calculateFinalPrice(price ?? 0, 1, discount ?? 0, product?.isPriceUsingCrystals ?? false);

    const currentIntervalSubscription = user.intervalSubscription
        ? subscriptions.find((s) => s.id === user.intervalSubscription!.subscriptionId)
        : undefined;

    const currentLifetimePlan = user.lifetimeSubscription
        ? subscriptions.find((s) => s.id === user.lifetimeSubscription!.subscriptionId)
        : undefined;

    const canSwitchTo = (interval: BillingIntervalEnum) => {
        if (!subscription) return false;
        if (currentLifetimePlan && currentLifetimePlan.priority >= subscription.priority) return false;
        if (!user.intervalSubscription) return true;

        const switchType = getSubscriptionSwitchType({
            priority: currentIntervalSubscription?.priority ?? 0,
            billingInterval: user.intervalSubscription.billingInterval
        }, {
            priority: subscription.priority,
            billingInterval: interval
        });

        switch (switchType) {
            case SubscriptionSwitchType.DOWNGRADE:
            case SubscriptionSwitchType.UPGRADE:
                return true;
            case SubscriptionSwitchType.LATERAL:
                return false;
            default:
                return false;
        }
    };

    const subscriptionPrice = (price: number, interval: BillingIntervalEnum) =>
        subscription ? calculateSubscriptionDisplayPrice(user.lifetimeSubscription, currentLifetimePlan, subscription, price, interval) : price;

    const subscriptionOnClick = (interval: BillingIntervalEnum) => {
        if (!subscription) return;

        if (interval === BillingIntervalEnum.LIFETIME && (currentIntervalSubscription?.priority ?? 0) > subscription.priority) {
            closeModal();
            createModal(<Modal.ErrorModal>{Forbidden.STRIPE_SUBSCRIPTION_NOT_ALLOWED}</Modal.ErrorModal>);

            return;
        }

        const pO = subscriptionPrice(
            interval === BillingIntervalEnum.MONTHLY ? subscription.monthlyPrice ?? 0 :
                interval === BillingIntervalEnum.YEARLY ? subscription.yearlyPrice ?? 0 :
                    interval === BillingIntervalEnum.LIFETIME ? subscription.lifetimePrice ?? 0 : 0,
            interval
        );

        closeModal();
        createModal(<Modal.PurchaseProductModal
            subscription={subscription}
            subscriptionInterval={interval}
            priceOverride={pO}
        />);
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
                            ${subscriptionPrice(subscription.monthlyPrice, BillingIntervalEnum.MONTHLY)} USD / month
                        </div>
                    </Button.GenericButton>}

                    {subscription.yearlyPrice && canSwitchTo(BillingIntervalEnum.YEARLY) && <Button.GenericButton onClick={() => subscriptionOnClick(BillingIntervalEnum.YEARLY)} type="submit">
                        <div className={styles.productPrice}>
                            ${subscriptionPrice(subscription.yearlyPrice, BillingIntervalEnum.YEARLY)} USD / year
                        </div>
                    </Button.GenericButton>}

                    {subscription.lifetimePrice && canSwitchTo(BillingIntervalEnum.LIFETIME) && <Button.GenericButton onClick={() => subscriptionOnClick(BillingIntervalEnum.LIFETIME)} type="submit">
                        <div className={styles.productPrice}>
                            ${subscriptionPrice(subscription.lifetimePrice, BillingIntervalEnum.LIFETIME)} USD one time
                        </div>
                    </Button.GenericButton>}
                </>}

                <Button.GenericButton onClick={closeModal}>Close</Button.GenericButton>
            </Modal.ModalButtonContainer>
        </>
    );
}
