/**
 * TransactionType — union of all valid transaction_type values
 * used in the `transactions` table.
 *
 * Single source of truth — import from here instead of using raw strings.
 */
export type TransactionType =
    | "LOAN"
    | "RETURN"
    | "CONSUMED_BULK"
    | "RETURN_HABIS"
    | "LOST"
    | "ADMIN_SO";
