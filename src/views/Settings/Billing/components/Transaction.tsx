import Textfit from "react-textfit";
import { useData } from "@stores/DataStore/index";
import { useResource } from "@stores/ResourceStore/index";
import { ImageOrVideo, PaymentMethodText } from "@components/index";
import styles from "../billing.module.scss";

import { TransactionProps } from "../billing.d";
import { CurrencyTypeEnum, TransactionStatusEnum } from "@blacket/types";

export default function Transaction({ transaction, selected, ...props }: TransactionProps) {
    const { products, subscriptions } = useData();
    const { resourceIdToPath } = useResource();

    const product = {
        ...products.find((p) => p.id === transaction.productId),
        ...subscriptions.find((s) => s.id === transaction.subscriptionId)
    };
    if (!product) return null;

    const getCurrencyString = (amount: number = transaction.amount) => {
        switch (transaction.currency) {
            case CurrencyTypeEnum.USD:
                return <>${amount} USD</>;
            case CurrencyTypeEnum.CRYSTAL:
                return <>{amount}</>;
            default:
                return <>{amount} {transaction.currency}</>;
        }
    };

    const getStatusColor = () => {
        switch (transaction.status) {
            case TransactionStatusEnum.COMPLETED:
                return "green";
            case TransactionStatusEnum.PENDING:
                return "grey";
            case TransactionStatusEnum.FAILED:
                return "red";
            case TransactionStatusEnum.REFUNDED:
                return "orange";
            case TransactionStatusEnum.DISPUTED:
                return "black";
            default:
                return "grey";
        }
    };

    return (
        <div className={styles.transaction} {...props}>
            <div className={styles.transactionTopRow}>
                <Textfit className={styles.transactionDate} mode="single" min={0} max={16}>
                    {new Date(transaction.createdAt).toLocaleDateString()}
                </Textfit>

                <div className={styles.transactionDescriptionContainer}>
                    {window.innerWidth > 768 && <ImageOrVideo src={resourceIdToPath(product.imageId)} className={styles.transactionImage} />}

                    <Textfit className={styles.transactionDescription} mode="single" min={0} max={16}>
                        {product.isQuantityCapped === false ? `x${transaction.quantity} ` : ""}{product.name}
                    </Textfit>
                </div>

                <div className={styles.transactionStatus} style={{
                    backgroundColor: getStatusColor()
                }}>
                    {window.innerWidth > 768 ? transaction.status : transaction.status.charAt(0)}
                </div>

                <div className={styles.transactionAmountContainer}>
                    <Textfit className={styles.transactionAmount} mode="single" min={0} max={16}>
                        {transaction.refundAmount ? "-" : ""}
                        {getCurrencyString(transaction.refundAmount ?? transaction.amount)}
                    </Textfit>

                    {transaction.currency === CurrencyTypeEnum.CRYSTAL && (
                        <img src={window.constructCDNUrl("/content/crystal.png")} className={styles.transactionAmountImage} />
                    )}
                </div>

                <i className={`fa-solid fa-chevron-${selected ? "up" : "down"}`} />
            </div>

            {selected && (
                <div className={styles.transactionDetails}>
                    <div className={styles.transactionDetailsRow}>
                        <span>Payment Method</span>
                        {transaction.paymentMethod
                            ? <PaymentMethodText paymentMethod={transaction.paymentMethod} />
                            : <span>{transaction.currency === CurrencyTypeEnum.CRYSTAL ? "Crystals" : "N/A"}</span>}
                    </div>

                    <div className={styles.transactionDetailsRow}>
                        <span>Total</span>
                        <span>
                            {transaction.refundAmount ? "-" : ""}{getCurrencyString(transaction.refundAmount ?? transaction.amount)}
                        </span>
                    </div>

                    <div className={styles.transactionDetailsRow}>
                        <span>Transaction ID</span>
                        <span>{transaction.id}</span>
                    </div>

                    <div className={styles.transactionDetailsDivider} />

                    Having issues with your transaction? Please contact support.
                </div>
            )}
        </div>
    );
}
