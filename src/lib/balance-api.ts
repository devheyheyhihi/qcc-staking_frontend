import { api } from "./api-client";

export const getAddressBalance = async (addressHash: string): Promise<string> => {
  try {
    const balanceRes = await api.post<string>("/rawrequest/", {
      type: "GetBalance",
      address: addressHash,
    });

    // 18자리 소수점을 6자리로 변환
    return (Number(balanceRes.data) / 1e18).toFixed(6);
  } catch (error) {
    console.error('Failed to fetch balance:', error);
    throw error;
  }
}; 