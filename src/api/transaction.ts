import { api } from "./client";
import { buildSendRequestData } from "../lib/crypto";
import { unscientificNotation } from "../lib/utils";
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

  // 응답 구조 디버깅
  console.log('API Response:', response.data);

  // 안전한 에러 체크
  const output = response.data?.output || '';
  // 다양한 해시 필드 확인
  const txHash = response.data?.txhash || response.data?.txHash || response.data?.txid || response.data?.data?.txid;

  if (typeof output === 'string' && output.includes("error")) {
    throw new Error("Failed to send transaction: " + output);
  } else {
    return {
      txHash: txHash, // 실제 해시 값
      success: true,
      output: output,
      data: response.data // 전체 응답 데이터도 포함
    };
  }
};