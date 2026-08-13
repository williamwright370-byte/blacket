import { BillingIntervalEnum, StripeProductEntity, StripeSubscriptionEntity } from "@blacket/types";

export interface ProductPurchaseModalProps {
    product?: StripeProductEntity;
    subscription?: StripeSubscriptionEntity;
    subscriptionInterval?: BillingIntervalEnum;
}

export interface ProductSuccessModalProps {
    product?: StripeProductEntity;
    subscription?: StripeSubscriptionEntity;
    quantity: number;
    priceOverride?: number;
}
