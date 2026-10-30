export function useSubscriptionPendingChange() {
    const cancelPendingChange = () => new Promise<Fetch2Response>((resolve, reject) => window.fetch2.delete("/api/stripe/subscription/pending-change", {})
        .then((res: Fetch2Response) => resolve(res))
        .catch(reject));

    return { cancelPendingChange };
}
