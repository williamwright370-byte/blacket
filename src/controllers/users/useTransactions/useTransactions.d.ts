import { UserTransactionsEntity } from "@blacket/types";

export interface GetTransactionsResponse extends Fetch2Response {
    data: UserTransactionsEntity;
}
