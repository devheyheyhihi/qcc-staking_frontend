import { RawTransaction, Transaction, TransactionData } from "@/api/types";

export const parseTransactionData = (rawData: string): TransactionData => {
  try {
    const parsed = JSON.parse(rawData);

    return { ...parsed, amount: (Number(parsed.amount) / 1e18).toFixed(6) };
  } catch (error) {
    console.error("Failed to parse transaction data:", error);
    return {
      type: "Unknown",
      to: "",
      amount: "0",
      from: "",
      timestamp: 0,
    };
  }
};

export const parseTransaction = (raw: RawTransaction): Transaction => {
  return {
    ...raw,
    parsedData: parseTransactionData(raw.data),
  };
};

export const parseTransactions = (
  rawTransactions: RawTransaction[],
): Transaction[] => {
  return rawTransactions.map(parseTransaction);
};
