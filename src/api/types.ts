export interface BlockInfo {
  height: number;
  s_timestamp: string;
  previous_blockhash: string;
  blockhash: string;
  difficulty: string;
  transaction_count: string;
}

export interface BlockListParams {
  page: number;
  count: number;
}

export interface PaginationParams {
  page: number;
  count: number;
}

export interface RawTransaction {
  txto: string;
  data: string;
  txtimestamp: string;
  txhash: string;
  txfrom: string;
  txtype: string;
  block_height: number;
}

export interface TransactionData {
  type: string;
  to: string;
  amount: string;
  from: string;
  timestamp: number;
}

export interface Transaction extends Omit<RawTransaction, "data"> {
  parsedData: TransactionData;
}

export interface TransactionListResponse {
  transactions: RawTransaction[];
  total_count: number;
}
