import { api } from "./client";
import { buildSendRequestData } from "./crypto";
import { unscientificNotation } from "./utils";
import Decimal from "decimal.js";

export const sendTransaction = async ({
  privateKey,
  toAddress,
  amount,
}: {
  privateKey: string;
  toAddress: string;
  amount: string;
}) => {
  const amountWithDecimals = unscientificNotation(
    new Decimal(amount.toString()).times(1e18),
  );

  const sTime = await api.get("/api/ts");

  const data = buildSendRequestData(
    privateKey,
    toAddress,
    amountWithDecimals,
    sTime.data,
  );

  const response = await api.post("/broadcast/", data);

  if (response.data.output.includes("error")) {
    throw new Error("Failed to send transaction: " + response.data.output);
  } else {
    return {
      txHash: response.data.txhash,
      output: response.data.output
    };
  }
};