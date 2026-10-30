import { HTMLAttributes } from "react";

import { PublicTransaction, StripeSubscriptionEntity } from "@blacket/types";

export interface TransactionProps extends HTMLAttributes<HTMLDivElement> {
    transaction: PublicTransaction;
    selected?: boolean;
}

export interface PlanContainerProps extends HTMLAttributes<HTMLDivElement> {
    subscription?: StripeSubscriptionEntity;
}

export interface CancelModalProps extends HTMLAttributes<HTMLDivElement> {
    onCancel: () => void;
}
