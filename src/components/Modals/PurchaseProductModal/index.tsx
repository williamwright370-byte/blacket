import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStripe } from "@stripe/react-stripe-js";
import { useUser } from "@stores/UserStore/index";
import { useModal } from "@stores/ModalStore/index";
import { useResource } from "@stores/ResourceStore/index";
import { useData } from "@stores/DataStore/index";
import { useSound } from "@stores/SoundStore/index";
import { useSubscriptionProration } from "@controllers/stripe/subscriptions/useProration/index";
import { Modal, ErrorContainer, Button, StripeElementsWrapper, ImageOrVideo, Dropdown, Toggle, ParticleCanvas, Input } from "@components/index";
import { ParticleCanvasRef } from "@components/ParticleCanvas/particleCanvas";
import styles from "./purchaseProductModal.module.scss";

import { ProductPurchaseModalProps, ProductSuccessModalProps } from "./productPurchaseModal.d";
import { BillingIntervalEnum, Forbidden, SubscriptionSwitchType, InternalServerError, PaymentMethodTypeEnum, RarityAnimationTypeEnum, StripeProductEntity, StripeSubscriptionEntity, StripeSubscriptionProrationEntity, UserPaymentMethod, BadRequest } from "@blacket/types";
import { calculateFinalPrice, getSubscriptionSwitchType } from "@blacket/common";

function SuccessModalOutside() {
    const particleCanvasRef = useRef<ParticleCanvasRef>(null);

    const { playSound, playSounds, stopSounds } = useSound();

    useEffect(() => {
        if (!particleCanvasRef.current) return;

        particleCanvasRef.current.start();

        setTimeout(() => {
            playSound("party-popper");
        }, 100);

        setTimeout(() => {
            playSounds(["cha-ching", "token-shower"]);
        }, 400);

        const stopTimeout = setTimeout(() => {
            if (particleCanvasRef.current) particleCanvasRef.current.stop();
        }, 2500);

        return () => {
            stopSounds(["cha-ching", "token-shower"]);
            clearTimeout(stopTimeout);
        };
    }, []);

    return (
        <ParticleCanvas
            ref={particleCanvasRef}
            width={window.innerWidth}
            height={window.innerHeight}
            style={{
                position: "absolute",
                width: "100%",
                height: "100%",
                zIndex: -1
            }}
            images={[
                window.constructCDNUrl("/content/token.png"),
                window.constructCDNUrl("/content/diamond.png"),
                window.constructCDNUrl("/content/crystal.png")
            ]}
            particleWidth={50}
            particleHeight={50}
            particleCount={800}
            animationType={RarityAnimationTypeEnum.LEGENDARY}
        />
    );
}

function SuccessModal({ product, subscription, quantity, priceOverride }: ProductSuccessModalProps) {
    if (!product && !subscription) return null;

    const { closeModal } = useModal();
    const { resourceIdToPath } = useResource();

    const item: StripeProductEntity | StripeSubscriptionEntity | undefined = product ?? subscription;

    let FINAL_PRICE: number | undefined;

    if (product) {
        const i = item as StripeProductEntity;

        FINAL_PRICE = calculateFinalPrice(i.price, Number(quantity), i.discount, i.isPriceUsingCrystals);
    } else if (subscription) {
        FINAL_PRICE = priceOverride ?? 0;
    } else return null;

    if (FINAL_PRICE === undefined) return null;

    return (
        <>
            <Modal.ModalHeader>🎉 Purchase Successful!</Modal.ModalHeader>

            <Modal.ModalBody>
                You have received the following product:
            </Modal.ModalBody>

            <Modal.ModalBody>
                <div className={styles.purchaseDetailsContainer}>
                    <span className={styles.purchaseDetailsText}>Purchase Details</span>

                    <div className={styles.purchaseDetails}>
                        <span style={{ display: "flex", alignItems: "center" }}>
                            <ImageOrVideo
                                src={resourceIdToPath(item?.imageId)}
                                className={styles.productImage}
                            />
                            {product && !(item as StripeProductEntity).isQuantityCapped ? `x${quantity} ` : ""}{item?.name}
                        </span>
                        <span className={styles.productPrice}>
                            {product && (item as StripeProductEntity).isPriceUsingCrystals ? <>
                                <img className={styles.productCurrencyImage} src={window.constructCDNUrl("/content/crystal.png")} />
                                {FINAL_PRICE} Crystals
                            </> : <>
                                ${FINAL_PRICE} USD
                            </>}
                        </span>
                    </div>
                </div>

                Thank you for supporting {import.meta.env.VITE_INFORMATION_NAME} ❤️
            </Modal.ModalBody>

            <Modal.ModalButtonContainer>
                <Button.GenericButton onClick={closeModal}>Close</Button.GenericButton>
            </Modal.ModalButtonContainer>
        </>
    );
}

function TheModal({ product, subscription, subscriptionInterval, priceOverride }: ProductPurchaseModalProps) {
    if (!product && !subscription) return null;
    if (subscription && !subscriptionInterval) return null;

    const stripe = useStripe();
    const { user } = useUser();
    if (!user) return null;

    const { createModal, closeModal } = useModal();
    const { resourceIdToPath } = useResource();

    const { subscriptions } = useData();
    const { getSubscriptionProration } = useSubscriptionProration();

    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<UserPaymentMethod | null>(
        user?.paymentMethods.find((method) => method.primary) ?? null
    );
    const [quantity, setQuantity] = useState<string>("1");
    const [accepted, setAccepted] = useState<boolean>(false);
    const [finalPrice, setFinalPrice] = useState<number>(priceOverride ?? product?.price ?? 0);
    const [proration, setProration] = useState<StripeSubscriptionProrationEntity | null>(null);

    const prorationPrice = proration && (
        subscriptionInterval === BillingIntervalEnum.MONTHLY ? proration.monthly :
            subscriptionInterval === BillingIntervalEnum.YEARLY ? proration.yearly :
                proration.lifetime
    );

    const currentIntervalPlan = user.intervalSubscription
        ? subscriptions.find((s) => s.id === user.intervalSubscription!.subscriptionId)
        : undefined;
    const isDowngrade = !!subscription && !!subscriptionInterval && !!user.intervalSubscription
        && subscriptionInterval !== BillingIntervalEnum.LIFETIME
        && getSubscriptionSwitchType({
            priority: currentIntervalPlan?.priority ?? 0,
            billingInterval: user.intervalSubscription.billingInterval
        }, {
            priority: subscription.priority,
            billingInterval: subscriptionInterval
        }) === SubscriptionSwitchType.DOWNGRADE;

    const showProration = !isDowngrade && proration && Number(prorationPrice) !== Number(finalPrice);

    const navigate = useNavigate();

    const showSuccessModal = () => {
        createModal(<SuccessModal
            product={product}
            subscription={subscription}
            quantity={parseInt(quantity)}
            priceOverride={prorationPrice ?? priceOverride}
        />, { outsideModal: <SuccessModalOutside /> }
        );
        closeModal();
    };

    const setErrorAndStopLoading = (message: string) => {
        setError(message);
        setLoading(false);
    };

    useEffect(() => {
        if (subscription) {
            const i = subscription as StripeSubscriptionEntity;

            if (!priceOverride) switch (subscriptionInterval) {
                case BillingIntervalEnum.MONTHLY:
                    setFinalPrice(i.monthlyPrice ?? 0);
                    break;
                case BillingIntervalEnum.YEARLY:
                    setFinalPrice(i.yearlyPrice ?? 0);
                    break;
                case BillingIntervalEnum.LIFETIME:
                    setFinalPrice(i.lifetimePrice ?? 0);

                    break;
            }

            getSubscriptionProration(subscription.id).then(setProration);
        }

        if (priceOverride) return setFinalPrice(calculateFinalPrice(priceOverride, Number(quantity), 0, false));

        if (product) {
            const i = product as StripeProductEntity;

            setFinalPrice(calculateFinalPrice(i.price, Number(quantity), i.discount, i.isPriceUsingCrystals));
        }
    }, [product, quantity, subscription, subscriptionInterval]);

    const item: StripeProductEntity | StripeSubscriptionEntity | undefined = product ?? subscription;

    if (!stripe || !user) return null;

    return (
        <>
            <Modal.ModalHeader>Review {product ? "Purchase" : "Subscription"}</Modal.ModalHeader>

            <Modal.ModalBody>
                Please review your {product ? "purchase" : "subscription"} below.
            </Modal.ModalBody>

            <Modal.ModalBody style={{ minWidth: 500 }}>
                <div className={styles.purchaseDetailsContainer}>
                    <span className={styles.purchaseDetailsText}>{
                        product ? "Product" : "Subscription"
                    } Details</span>

                    <div className={styles.purchaseDetails}>
                        <span style={{ display: "flex", alignItems: "center" }}>
                            <ImageOrVideo
                                src={resourceIdToPath(item?.imageId)}
                                className={styles.productImage}
                            />
                            {product && !product?.isQuantityCapped && <>x<Input
                                value={quantity.toString()}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    const parsedValue = parseInt(value);

                                    if (value.match(/[^0-9]/)) return;
                                    if (parsedValue < 1 && value !== "") return;
                                    if (parsedValue > 100) return setQuantity("100");

                                    if (value === "") return setQuantity("");
                                    setQuantity(parsedValue.toString());
                                    setError("");
                                }}
                                containerProps={{ style: { width: 35, height: 20, margin: "0 10px 0 0", border: "unset", borderRadius: 7 } }}
                                style={{ height: 20, width: 30, margin: "unset", borderRadius: 7 }}
                                autoComplete="off"
                            />{" "}</>}{item?.name}
                        </span>
                        <span className={styles.productPrice}>
                            {product && product?.isPriceUsingCrystals ? <>
                                <img className={styles.productCurrencyImage} src={window.constructCDNUrl("/content/crystal.png")} />
                                {finalPrice} Crystals
                            </> : <div>
                                <span style={{
                                    textDecoration: showProration ? "line-through" : "unset"
                                }}>${finalPrice.toFixed(2)} USD</span> {
                                    subscription && subscriptionInterval &&
                                        subscriptionInterval === BillingIntervalEnum.MONTHLY ? "/ month" :
                                        subscriptionInterval === BillingIntervalEnum.YEARLY ? "/ year" : ""
                                }
                                {showProration && <div className={styles.prorationPrice}>
                                    Proration: ${prorationPrice} USD
                                </div>}
                                {isDowngrade && <div className={styles.prorationPrice}>
                                    Will be charged on next interval
                                </div>}
                            </div>}
                        </span>
                    </div>
                </div>

                {!product?.isPriceUsingCrystals && <Dropdown
                    options={[
                        ...user.paymentMethods.map((method) => ({
                            label: method.value, value: method.id
                        })),
                        { label: "Add Payment Method", value: null }
                    ]}
                    onChange={(value: number | null) => {
                        if (value === null) {
                            closeModal();

                            navigate("/settings/billing");
                        } else {
                            if (subscription) {
                                closeModal();

                                navigate("/settings/billing");
                            }
                            setSelectedPaymentMethod(user.paymentMethods.find((method) => method.id === value) ?? null);
                        }
                    }}
                    className={styles.paymentMethodDropdown}
                >
                    {selectedPaymentMethod ? selectedPaymentMethod.value : "Select a payment method..."}
                </Dropdown>}
            </Modal.ModalBody>

            <Modal.ModalBody>
                <Toggle
                    checked={accepted}
                    onClick={() => {
                        if (loading) return;
                        setAccepted(!accepted);
                    }}
                >
                    <div style={{ marginLeft: 5, fontSize: "0.8rem", textAlign: "left" }}>
                        I agree to the <Link to="/terms">Terms of Service</Link> and I understand that I
                        <br />
                        {product ? "waive the right to withdrawal from this purchase." :
                            "will be charged on an interval basis until I cancel."}
                    </div>
                </Toggle>
            </Modal.ModalBody>

            {error !== "" && <ErrorContainer>{error}</ErrorContainer>}

            <Modal.ModalButtonContainer loading={loading}>
                <Button.GenericButton
                    onClick={async () => {
                        if (!accepted) return setError("You must agree to the Terms of Service and Purchase Policy.");
                        if (!subscription && (quantity === "" || parseInt(quantity) < 1)) return setError("You must select a quantity of at least 1.");

                        if (product && product.isPriceUsingCrystals) {
                            if (user.crystals < finalPrice) return setError(Forbidden.STRIPE_NOT_ENOUGH_CRYSTALS);

                            setLoading(true);

                            window.fetch2.post(`/api/stripe/purchase-with-crystals/${product.id}`, {
                                quantity: parseInt(quantity)
                            })
                                .then(() => {
                                    showSuccessModal();
                                })
                                .catch((err) => {
                                    setError(err?.data?.message ?? InternalServerError.DEFAULT);
                                    setLoading(false);
                                });
                        } else if (product && !subscription) {
                            if (!selectedPaymentMethod) return setError(BadRequest.STRIPE_PAYMENT_METHOD_REQUIRED);

                            setLoading(true);

                            window.fetch2.post(`/api/stripe/payment-intent/${product.id}`, {
                                quantity: parseInt(quantity),
                                paymentMethodId: selectedPaymentMethod.paymentMethodId
                            })
                                .then(async (res) => {
                                    switch (selectedPaymentMethod?.type) {
                                        case PaymentMethodTypeEnum.CARD: {
                                            const { error: verifyError } = await stripe.confirmCardPayment(res.data.client_secret);
                                            if (verifyError) return setErrorAndStopLoading(verifyError?.message ?? InternalServerError.DEFAULT);
                                            break;
                                        }
                                        default:
                                            // TODO: implement other payment method types (everything works except stuff like paypal)
                                            return setErrorAndStopLoading(BadRequest.STRIPE_PAYMENT_METHOD_REQUIRED);
                                    }

                                    showSuccessModal();
                                })
                                .catch((err) => {
                                    setError(err?.data?.message ?? InternalServerError.DEFAULT);
                                    setLoading(false);
                                });
                        } else if (subscription) {
                            if (!selectedPaymentMethod) return setError(BadRequest.STRIPE_PAYMENT_METHOD_REQUIRED);
                            if (selectedPaymentMethod.type !== PaymentMethodTypeEnum.CARD) return setError("Only card payments are supported right now.");

                            setLoading(true);
                            setError("");

                            if (user.intervalSubscription && subscriptionInterval !== BillingIntervalEnum.LIFETIME) {
                                window.fetch2.post(`/api/stripe/subscription/${subscription.id}/switch`, {
                                    interval: subscriptionInterval
                                })
                                    .then(async (res) => {
                                        const clientSecret = res?.data?.clientSecret;

                                        if (clientSecret) {
                                            const { error: stripeError } = await stripe.confirmCardPayment(clientSecret);

                                            if (stripeError) return setErrorAndStopLoading(stripeError?.message ?? InternalServerError.DEFAULT);
                                        }

                                        if (isDowngrade) {
                                            closeModal();
                                            navigate("/settings/billing");
                                        } else showSuccessModal();
                                    })
                                    .catch((err) => setErrorAndStopLoading(err?.data?.message ?? InternalServerError.DEFAULT));
                            } else window.fetch2.post(`/api/stripe/subscription/${subscription.id}`, {
                                interval: subscriptionInterval
                            })
                                .then(async (res) => {
                                    const clientSecret = res?.data.clientSecret;

                                    if (clientSecret) {
                                        const { error: stripeError } = await stripe.confirmCardPayment(clientSecret);

                                        if (stripeError) return setErrorAndStopLoading(stripeError?.message ?? InternalServerError.DEFAULT);
                                    } else {
                                        return setErrorAndStopLoading(InternalServerError.DEFAULT);
                                    }

                                    showSuccessModal();
                                })
                                .catch((err) => setErrorAndStopLoading(err?.data?.message ?? InternalServerError.DEFAULT));
                        }
                    }}
                >
                    {product ? "Purchase" : "Subscribe"}
                </Button.GenericButton>

                <Button.GenericButton onClick={closeModal}>Cancel</Button.GenericButton>
            </Modal.ModalButtonContainer>
        </>
    );
}

export default function PurchaseProductModal({ product, subscription, subscriptionInterval, priceOverride }: ProductPurchaseModalProps) {
    return (
        <StripeElementsWrapper>
            <TheModal product={product} subscription={subscription} subscriptionInterval={subscriptionInterval} priceOverride={priceOverride} />
        </StripeElementsWrapper>
    );
}
