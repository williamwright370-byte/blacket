import { StripeSubscriptionProrationEntity } from "@blacket/types";

export function useSubscriptionProration() {
    const getSubscriptionProration = (id: number) => new Promise<StripeSubscriptionProrationEntity>((resolve, reject) => window.fetch2.get(`/api/stripe/subscriptions/proration/${id}`)
        .then((res: Fetch2Response & { data: StripeSubscriptionProrationEntity }) => resolve(res.data))
        .catch(reject));

    return { getSubscriptionProration };
}
