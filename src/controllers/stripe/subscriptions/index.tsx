export function useSubscription() {
    const cancelSubscription = () => new Promise<Fetch2Response>((resolve, reject) => window.fetch2.delete("/api/stripe/subscription", {})
        .then((res: Fetch2Response) => resolve(res))
        .catch(reject));

    const restoreSubscription = () => new Promise<Fetch2Response>((resolve, reject) => window.fetch2.put("/api/stripe/subscription", {})
        .then((res: Fetch2Response) => resolve(res))
        .catch(reject));

    return {
        cancelSubscription,
        restoreSubscription
    };
}
