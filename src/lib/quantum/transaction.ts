import { buildSendRequestData } from './crypto';
import { unscientificNotation } from './utils';
import Decimal from 'decimal.js';

// 퀀텀체인 API 베이스 URL
const QUANTUM_API_BASE = 'https://qcc-backend.com';

interface SendTransactionParams {
  privateKey: string;
  toAddress: string;
  amount: string;
}

export const sendTransaction = async ({
  privateKey,
  toAddress,
  amount,
}: SendTransactionParams) => {
  try {
    // 1. 금액을 18자리 소수점으로 변환 (1e18 곱하기)
    const amountWithDecimals = unscientificNotation(
      new Decimal(amount.toString()).times(1e18),
    );

    // 2. 서버에서 타임스탬프 가져오기
    const timestampResponse = await fetch(`${QUANTUM_API_BASE}/api/ts`);
    if (!timestampResponse.ok) {
      throw new Error('타임스탬프 조회 실패');
    }
    const timestamp = await timestampResponse.json();

    // 3. 트랜잭션 데이터 구성 및 서명
    const signedData = buildSendRequestData(
      privateKey,
      toAddress,
      amountWithDecimals,
      timestamp,
    );

    // 4. 블록체인에 브로드캐스트
    const broadcastResponse = await fetch(`${QUANTUM_API_BASE}/broadcast/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: signedData,
    });

    if (!broadcastResponse.ok) {
      throw new Error('트랜잭션 브로드캐스트 실패');
    }

    const result = await broadcastResponse.json();

    // 5. 에러 체크
    if (result.output && result.output.includes('error')) {
      throw new Error('트랜잭션 실패: ' + result.output);
    }

    return {
      success: true,
      data: result,
      txHash: result.txhash || result.hash,
    };
  } catch (error) {
    console.error('sendTransaction 오류:', error);
    throw error;
  }
};