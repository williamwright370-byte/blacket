import { GetTransactionsResponse } from "./useTransactions";

export function useTransactions() {
    const getTransactions = (page?: number) => new Promise<GetTransactionsResponse>((resolve, reject) => window.fetch2.get(`/api/users/transactions?page=${page ?? 1}`)
        .then((res: GetTransactionsResponse) => resolve(res))
        .catch(reject));

    return { getTransactions };
}
