import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "@stores/UserStore/index";
import { useData } from "@stores/DataStore/index";
import { useLoading } from "@stores/LoadingStore/index";
import { useModal } from "@stores/ModalStore/index";
import { Button, Modal, PaymentMethodText } from "@components/index";
import { PlanContainer, Transaction, CancelModal } from "./components";
import { usePortal } from "@controllers/stripe/usePortal/index";
import { useTransactions } from "@controllers/users/useTransactions";
import { useSubscription } from "@controllers/stripe/subscriptions";
import { useSubscriptionAmountDue } from "@controllers/stripe/subscriptions/useAmountDue/index";
import { useSubscriptionPendingChange } from "@controllers/stripe/subscriptions/usePendingChange/index";
import { PublicTransaction, UserSubscriptionStatusEnum, UserTransactionsEntity } from "@blacket/types";
import styles from "./billing.module.scss";

export default function SettingsBilling() {
    const { user } = useUser();
    if (!user) return null;

    const { subscriptions } = useData();
    const { setLoading } = useLoading();
    const { createModal, closeModal } = useModal();
    const { createPortal } = usePortal();
    const { getTransactions } = useTransactions();
    const {
        cancelSubscription: cancelSubscriptionRequest,
        restoreSubscription: restoreSubscriptionRequest
    } = useSubscription();
    const { getAmountDue } = useSubscriptionAmountDue();
    const { cancelPendingChange } = useSubscriptionPendingChange();

    const navigate = useNavigate();

    const [amountDue, setAmountDue] = useState<number | null>(null);
    const [transactions, setTransactions] = useState<UserTransactionsEntity>();
    const [selectedTransaction, setSelectedTransaction] = useState<PublicTransaction | null>(null);
    const [page, setPage] = useState<number>(1);
    const [pageLoading, setPageLoading] = useState<boolean>(false);

    const intervalSubscription = subscriptions.find((s) => s.id === user.intervalSubscription?.subscriptionId);
    const lifetimeSubscription = subscriptions.find((s) => s.id === user.lifetimeSubscription?.subscriptionId);

    const pendingSubscription = subscriptions.find((s) => s.id === user.intervalSubscription?.pendingChangeToSubscriptionId);
    const isCancellationScheduled = user.intervalSubscription?.status === UserSubscriptionStatusEnum.PENDING_CANCELLATION;

    useEffect(() => {
        getAmountDue().then((res) => setAmountDue(res.data.amount));
    }, [user]);

    useEffect(() => {
        getTransactions(page).then((res) => {
            setTransactions(res.data);
            setPageLoading(false);
        });
    }, [page]);

    const switchPlan = () => {
        navigate("/store");
    };

    const openPortal = async () => {
        setLoading(true);

        const width = 1000;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        const popup = window.open(
            "about:blank",
            "stripe-portal",
            `width=${width},height=${height},left=${left},top=${top},popup=yes,scrollbars=yes`
        );

        createPortal()
            .then((res) => {
                if (!popup) {
                    setLoading(false);
                    window.location.assign(res.url);
                    return;
                }

                popup.location.href = res.url;
                popup.focus();

                setTimeout(function check() {
                    if (popup.closed) setLoading(false);
                    else setTimeout(check, 500);
                }, 1000);
            })
            .catch(() => {
                popup?.close();
                setLoading(false);
            });
    };

    const cancelSubscription = async () => {
        closeModal();
        setLoading(true);

        cancelSubscriptionRequest()
            .catch((res) => createModal(<Modal.ErrorModal>{res.data?.message}</Modal.ErrorModal>))
            .finally(() => setLoading(false));
    };

    const restoreSubscription = async () => {
        setLoading(true);

        restoreSubscriptionRequest()
            .catch((res) => createModal(<Modal.ErrorModal>{res.data?.message}</Modal.ErrorModal>))
            .finally(() => setLoading(false));
    };

    const goToPreviousPage = () => {
        if (pageLoading) return;
        if (page === 1) return;

        setPageLoading(true);
        setPage(page - 1);
    };

    const goToNextPage = () => {
        if (pageLoading) return;
        if (page >= (transactions?.totalPages ?? 0)) return;

        setPageLoading(true);
        setPage(page + 1);
    };

    return (
        <div className={styles.container}>
            <div className={styles.plans}>
                {pendingSubscription && <div className={styles.changePendingContainer}>
                    <div className={styles.changePendingMessage}>
                        <i className="fas fa-exclamation-circle" />
                        Your subscription change is pending.{" "}
                        {pendingSubscription.name} {user.intervalSubscription?.pendingChangeToBillingInterval} will take effect on your next billing cycle.
                    </div>

                    <Button.LittleButton
                        onClick={() => {
                            setLoading(true);

                            cancelPendingChange()
                                .catch((res) => createModal(<Modal.ErrorModal>{res.data?.message}</Modal.ErrorModal>))
                                .finally(() => setLoading(false));
                        }}
                    >
                        Cancel
                    </Button.LittleButton>
                </div>}

                {lifetimeSubscription && <PlanContainer subscription={lifetimeSubscription} />}

                {(intervalSubscription || !lifetimeSubscription) && <PlanContainer subscription={intervalSubscription}>
                    {user.intervalSubscription && <>
                        {!isCancellationScheduled ? (
                            <Button.ClearButton
                                onClick={() => createModal(<CancelModal onCancel={cancelSubscription} />)}
                            >
                                Cancel
                            </Button.ClearButton>
                        ) : (
                            <Button.ClearButton
                                onClick={restoreSubscription}
                            >
                                Restore
                            </Button.ClearButton>
                        )}

                        <Button.ClearButton
                            onClick={switchPlan}
                        >
                            Switch Plans
                        </Button.ClearButton>
                    </>}
                </PlanContainer>}
            </div>

            <div className={styles.header}>
                Payments
            </div>

            <div className={styles.paymentsContainer}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>Billing Information</div>

                    <div>
                        {user.intervalSubscription && user.intervalSubscription.expiresAt ?
                            <>
                                {isCancellationScheduled ? <>
                                    Your subscription will end on {new Date(user.intervalSubscription.expiresAt).toLocaleDateString()} and you will not be charged again.
                                </> : <>
                                    Your plan will automatically renew on {new Date(user.intervalSubscription.expiresAt!).toLocaleDateString()} and you will be charged ${amountDue ?? "X.XX"} USD.
                                </>}
                            </>
                            : user.lifetimeSubscription ? <>
                                You will not be charged again, as your subscription never expires!
                            </> : <>
                                You are currently not subscribed to any plan.
                            </>
                        }
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardHeader}>Payment Method</div>

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
                    {transactions?.transactions.map((transaction) => (
                        <Transaction
                            key={transaction.id}
                            transaction={transaction}
                            selected={selectedTransaction?.id === transaction.id}
                            onClick={() => setSelectedTransaction(selectedTransaction?.id === transaction.id ? null : transaction)}
                        />
                    ))}
                </div>

                <div className={styles.transactionHistoryBottomRow}>
                    <div
                        className={styles.transactionHistoryNavigationContainer}
                    >
                        <i
                            className={`fas fa-chevron-left ${styles.transactionHistoryNavigationButton}`}
                            onClick={goToPreviousPage}
                            data-disabled={transactions?.page === 1 || pageLoading}
                        />
                        Page {transactions?.page} / {transactions?.totalPages}
                        <i
                            className={`fas fa-chevron-right ${styles.transactionHistoryNavigationButton}`}
                            onClick={goToNextPage}
                            data-disabled={transactions?.page === transactions?.totalPages || pageLoading}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
