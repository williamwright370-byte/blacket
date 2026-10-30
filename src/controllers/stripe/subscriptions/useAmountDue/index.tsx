import { StripeSubscriptionAmountDueEntity } from "@blacket/types";

type Response = Fetch2Response & { data: StripeSubscriptionAmountDueEntity };

export function useSubscriptionAmountDue() {
    const getAmountDue = () => new Promise<Response>((resolve, reject) => window.fetch2.get("/api/stripe/subscription/amount-due")
        .then((res: Response) => resolve(res))
        .catch(reject));

    return { getAmountDue };
}
