import { useState } from "react";
import { useModal } from "@stores/ModalStore/index";
import { useResource } from "@stores/ResourceStore/index";
import { useData } from "@stores/DataStore/index";
import { useUser } from "@stores/UserStore/index";
import { Modal, Button, Markdown, ErrorContainer } from "@components/index";
import styles from "./productModal.module.scss";

import { ProductModalProps } from "../../store.d";
import { Forbidden, InternalServerError } from "@blacket/types";

export default function ProductModal({ product }: ProductModalProps) {
    const { user } = useUser();
    if (!user) return null;
    if (!product) return null;
    if (!product.description) product.description = "No description available.";

    const { closeModal, createModal } = useModal();
    const { resourceIdToPath } = useResource();
    const { fontIdToName } = useData();

    const [error, setError] = useState<string>("");

    const FINAL_PRICE = !product.discount ? product.price :
        (product.price * (1 - (product.discount / 100))).toFixed(product.isPriceUsingCrystals ? 0 : 2);

    return (
        <>
            <Modal.ModalHeader>
                <span style={{
                    fontFamily: product.fontId ? fontIdToName(product.fontId) : ""
                }}>
                    {product.name}
                </span>
            </Modal.ModalHeader >

            <Modal.ModalBody>
                <div className={styles.productInformationContainer}>
                    <div className={styles.productLeft}>
                        <Markdown user={{
                            ...user,
                            fontId: product.fontId ?? user.fontId
                        }}>
                            {product.description}
                        </Markdown>
                    </div>

                    <div className={styles.productRight}>
                        <div className={styles.productImageContainer}>
                            <img className={styles.productImage} src={resourceIdToPath(product.imageId)} alt={product.name} />
                        </div>
                    </div>
                </div>
            </Modal.ModalBody>

            {error !== "" && <ErrorContainer>{error}</ErrorContainer>}

            <Modal.ModalButtonContainer>
                <Button.GenericButton onClick={() => {
                    if (product.isPriceUsingCrystals && (user.crystals < Number(FINAL_PRICE))) return setError(Forbidden.STRIPE_NOT_ENOUGH_CRYSTALS);

                    closeModal();

                    createModal(<Modal.PurchaseProductModal product={product} />);
                }} type="submit">
                    <div className={styles.productPrice}>
                        {product.isPriceUsingCrystals && <img className={styles.productCurrencyImage} src={window.constructCDNUrl("/content/crystal.png")} />}
                        {product.isPriceUsingCrystals ? `${FINAL_PRICE} Crystals` : `$${FINAL_PRICE} USD`} {product.isSubscription && product.price > 0 ? "lifetime" : ""}
                    </div>
                </Button.GenericButton>
                {product.isSubscription && (
                    <Button.GenericButton onClick={() => {
                        if (product.isPriceUsingCrystals) return setError(InternalServerError.STRIPE_SUBSCRIPTION_USING_CRYSTALS);

                        closeModal();

                        createModal(<Modal.PurchaseProductModal product={product} subscription={true} />);
                    }}>
                        ${product.subscriptionPrice} USD monthly
                    </Button.GenericButton>
                )}
                <Button.GenericButton onClick={closeModal}>Close</Button.GenericButton>
            </Modal.ModalButtonContainer>
        </>
    );
}
