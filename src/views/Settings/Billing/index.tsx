import { useEffect, useState } from "react";
import { useUser } from "@stores/UserStore/index";
import { useData } from "@stores/DataStore/index";
import { useResource } from "@stores/ResourceStore/index";
import { useLoading } from "@stores/LoadingStore/index";
import { Button, PaymentMethodText } from "@components/index";
import { Transaction } from "./components";
import { usePortal } from "@controllers/stripe/portal";
import { useTransactions } from "@controllers/users/useTransactions";
import { StripeProductEntity, Transaction as TransactionType } from "@blacket/types";
import styles from "./billing.module.scss";

export default function SettingsBilling() {
    const { user } = useUser();
    if (!user) return null;

    const { products } = useData();
    const { resourceIdToPath } = useResource();
    const { setLoading } = useLoading();
    const { createPortal } = usePortal();
    const { getTransactions } = useTransactions();

    const [transactions, setTransactions] = useState<TransactionType[]>([]);
    const [selectedTransaction, setSelectedTransaction] = useState<TransactionType | null>(null);
    const [planProduct, setPlanProduct] = useState<StripeProductEntity | null>(null);

    useEffect(() => {
        if (user.subscription) {
            const product = products.find((p) => p.id === user.subscription!.productId);
            if (!product) return;

            if (product) setPlanProduct(product);
        }

        getTransactions()
            .then((res) => setTransactions(res.data));
    }, [user]);

    const openPortal = async () => {
        setLoading(true);

        createPortal()
            .then((res) => {
                const width = 1000;
                const height = 700;
                const left = window.screenX + (window.outerWidth - width) / 2;
                const top = window.screenY + (window.outerHeight - height) / 2;

                const popup = window.open(
                    res.url,
                    "stripe-portal",
                    `width=${width},height=${height},left=${left},top=${top},popup=yes,scrollbars=yes`
                );

                if (!popup) {
                    setLoading(false);
                    window.open(res.url, "_blank");
                    return;
                }

                setTimeout(function check() {
                    if (popup.closed) setLoading(false);
                    else setTimeout(check, 500);
                }, 1000);
            })
            .catch(() => setLoading(false));
    };

    return (
        <div className={styles.container}>
            <div className={styles.planContainer} style={{
                background: planProduct ? `
                    linear-gradient(135deg, ${planProduct.color1} 0%, ${planProduct.color2} 100%)`
                    : undefined
            }}>
                <div className={styles.planDetailsContainer}>
                    {/* <img src={window.constructCDNUrl("/content/logo.png")} className={styles.planLogo} /> */}
                    <img src={planProduct ? resourceIdToPath(planProduct.imageId) : window.constructCDNUrl("/content/logo.png")} className={styles.planLogo} />

                    <div className={styles.planDetails}>
                        <div className={styles.planName}>
                            {planProduct ? planProduct.name : `${import.meta.env.VITE_INFORMATION_NAME} Basic`}
                        </div>

                        <div className={styles.planDescription}>
                            {/* You are currently not subscribed to any plan. */}
                            {planProduct ? planProduct.description : "You are currently not subscribed to any plan."}
                        </div>
                    </div>
                </div>

                <div className={styles.planActions}>
                    <Button.ClearButton
                    >
                        Cancel
                    </Button.ClearButton>

                    <Button.ClearButton
                    >
                        Switch Plans
                    </Button.ClearButton>
                </div>
            </div>

            <div className={styles.header}>
                Payments
            </div>

            <div className={styles.paymentsContainer}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>Billing Information</div>

                    {/* <div>Your plan will automatically renew on 06/08/2025 and you will be charged $99.99 USD</div> */}
                    <div>
                        {user.subscription ? <>
                            {!user.subscription.expiresAt ? <>
                                You will not be charged again, as your subscription never expires!
                            </> : <>Your plan will automatically renew on {new Date(user.subscription.expiresAt!).toLocaleDateString()} and you will be charged ${planProduct?.subscriptionPrice} USD.</>}
                        </> : <>You are currently not subscribed to any plan.</>}
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>Payment Method</div>

                    {/* todo */}
                    <Button.ClearButton className={styles.paymentMethodButton} onClick={openPortal}>
                        <PaymentMethodText paymentMethod={user.paymentMethods.find((method) => method.primary)} />
                    </Button.ClearButton>
                </div>
            </div>

            <div className={styles.header}>
                Transaction History
            </div>

            <div className={styles.transactionHistoryContainer}>
                <div className={styles.transactionHistoryTopRow}>
                    <div className={styles.transactionHistoryDate}>Date</div>
                    <div className={styles.transactionHistoryDescription}>Description</div>
                    <div className={styles.transactionHistoryAmount}>Amount</div>
                </div>

                <div className={styles.transactionHistory}>
                    {/* <div className={styles.transaction} onClick={() => setSelectedTransaction(selectedTransaction ? null : {} as Transaction)}>
                        <Textfit className={styles.transactionDate} mode="single" min={0} max={16}>
                            06/08/2025
                        </Textfit>

                        <Textfit className={styles.transactionDescription} mode="single" min={0} max={16}>
                            Blacket Basic
                        </Textfit>

                        <Textfit className={styles.transactionAmount} mode="single" min={0} max={16}>
                            $99.99 USD
                        </Textfit>

                        <i className="fa-solid fa-chevron-down" />

                        {selectedTransaction && (
                            <div className={styles.transactionDetails}>
                                todo later
                            </div>
                        )}
                    </div> */}
                    {transactions.map((transaction) => (
                        <Transaction
                            key={transaction.id}
                            transaction={transaction}
                            selected={selectedTransaction?.id === transaction.id}
                            onClick={() => setSelectedTransaction(selectedTransaction?.id === transaction.id ? null : transaction)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
