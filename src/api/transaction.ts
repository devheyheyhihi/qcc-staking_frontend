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

  // 에러 체크 - 다양한 에러 상황 처리
  if (response.data?.error) {
    throw new Error(response.data.error);
  }

  // 안전한 에러 체크
  const output = response.data?.output || '';
  // 다양한 해시 필드 확인
  const txHash = response.data?.txhash || response.data?.txHash || response.data?.txid || response.data?.data?.txid;

  if (typeof output === 'string' && output.includes("error")) {
    throw new Error("Failed to send transaction: " + output);
  }

  // 트랜잭션 해시가 없는 경우도 에러로 처리
  if (!txHash) {
    throw new Error("트랜잭션 해시를 받지 못했습니다. 전송에 실패했을 수 있습니다.");
  }

  return {
    txHash: txHash, // 실제 해시 값
    success: true,
    output: output,
    data: response.data // 전체 응답 데이터도 포함
  };
};