import * as bip39 from "bip39";
import crypto from "crypto";
import CryptoJS from "crypto-js";
import nacl from "tweetnacl";
import type { WalletState } from "./wallet-types";

const ENCRYPTION_KEY = "secret_key";

// 지갑의 핵심 타입은 실제 .qcc 파일 구조에 맞게 수정
interface Wallet {
  private_key: string;
  public_key: string;
  address: string;
  mnemonic: string;
  symbol?: string; // 선택적 필드로 변경
}

// 실제 .qcc 파일의 구조에 맞게 수정
export interface EncryptInfo {
  wallet: Wallet;
  recipients: any[];
  timestamp: number;
}

/**
 * 키파일에서 지갑 정보를 가져오는 함수
 * @param file .qcc 확장자의 키파일
 * @returns 복호화된 지갑 정보 또는 null
 */
export const importWallet = async (file: File): Promise<EncryptInfo | null> => {
  console.group("Wallet Import Process");
  console.log("Input file:", file.name);

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const encryptedWallet = e.target?.result as string;
        console.log("Encrypted wallet data length:", encryptedWallet.length);

        const decryptedWallet = CryptoJS.AES.decrypt(
          encryptedWallet,
          ENCRYPTION_KEY,
        ).toString(CryptoJS.enc.Utf8);
        console.log("Decrypted wallet data length:", decryptedWallet.length);

        const parsed = JSON.parse(decryptedWallet);
        console.log("Parsed wallet structure:", Object.keys(parsed));

        // 기본 지갑 필드 검증
        if (!parsed.wallet?.address || !parsed.wallet?.private_key) {
          console.error("Invalid wallet format - missing required fields");
          throw new Error("Invalid wallet format");
        }

        let result: EncryptInfo;

        // 실제 .qcc 파일 구조에 맞게 처리
        if (parsed.wallet && parsed.recipients !== undefined && parsed.timestamp) {
          console.log("Processing wallet with .qcc format");
          result = {
            wallet: parsed.wallet,
            recipients: parsed.recipients || [],
            timestamp: parsed.timestamp,
          };
        } else if (parsed.wallet) {
          console.log("Processing wallet with new format");
          result = {
            wallet: parsed.wallet,
            recipients: [],
            timestamp: parsed.timestamp || Date.now(),
          };
        } else {
          console.log("Processing wallet with legacy format");
          result = {
            wallet: parsed as Wallet,
            recipients: [],
            timestamp: Date.now(),
          };
        }

        console.log("Import result:", {
          ...result,
          wallet: { ...result.wallet, private_key: "***hidden***" },
        });
        console.groupEnd();
        resolve(result);
      } catch (error) {
        console.error("Failed to get wallet:", error);
        console.groupEnd();
        resolve(null);
      }
    };
    reader.readAsText(file);
  });
};

// crypto.ts에서 필요한 함수들 가져오기
const byteToHex = (byte_array: Uint8Array): string => {
  if (!byte_array) return "";
  return Array.prototype.map
    .call(byte_array, (byte: number) => {
      return ("0" + (byte & 0xff).toString(16)).slice(-2);
    })
    .join("")
    .toLowerCase();
};

const publicKey = (private_key: string): string => {
  return byteToHex(
    nacl.sign.keyPair.fromSeed(hexToByte(private_key)).publicKey,
  );
};

const hexToByte = (hex: string): Uint8Array => {
  if (!hex) return new Uint8Array();
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }
  return new Uint8Array(bytes);
};

const idHash = (obj: any): string => {
  const short_hash = cryptoHash("RIPEMD160", hash(obj));
  return short_hash + checksum(short_hash);
};

const address = (public_key: string): string => {
  return idHash(public_key);
};

const hash = (obj: any): string => {
  return cryptoHash("SHA256", toString(obj));
};

const checksum = (h: string): string => {
  return hash(hash(h)).slice(0, 4);
};

const cryptoHash = (
  algo: keyof typeof CryptoJS,
  stringData: string,
): string => {
  const hashFunction = CryptoJS[algo] as (
    data: string,
  ) => CryptoJS.lib.WordArray;
  return hashFunction(stringData).toString(CryptoJS.enc.Hex);
};

const toString = (input: any): string => {
  const s: string =
    typeof input === "object" && input !== null
      ? JSON.stringify(input)
      : String(input);
  return stringToUnicode(s.replace(/\//g, "\\/"));
};

const stringToUnicode = (str: string): string => {
  if (!str) return "";
  return Array.prototype.map
    .call(str, (char: string) => {
      const c = char.charCodeAt(0).toString(16);
      return c.length > 2 ? "\\u" + c : char;
    })
    .join("");
};

/**
 * 복구 구문으로 지갑을 복구하는 함수
 */
export const restoreWalletFromMnemonic = async (
  mnemonic: string,
): Promise<EncryptInfo> => {
  try {
    console.group("Wallet Restore Process");
    console.log("Input mnemonic:", mnemonic);

    // 복구 구문 유효성 검증
    const isValid = bip39.validateMnemonic(mnemonic);
    console.log("Mnemonic validation:", isValid);

    if (!isValid) {
      throw new Error("Invalid mnemonic phrase");
    }

    // 시드 생성
    const seed = bip39.mnemonicToSeedSync(mnemonic);
    console.log("Generated seed:", seed.toString("hex"));

    const private_key = crypto.createHash("sha256").update(seed).digest("hex");
    console.log("Private key:", private_key);

    const public_key = publicKey(private_key);
    console.log("Public key:", public_key);

    const wallet_address = address(public_key);
    console.log("Wallet address:", wallet_address);

    const wallet: Wallet = {
      private_key,
      public_key,
      address: wallet_address,
      mnemonic,
      symbol: "QCC",
    };
    console.log("Created wallet:", { ...wallet });

    const result = {
      wallet,
      recipients: [],
      timestamp: Date.now(),
    };

    console.log("Final result:", {
      ...result,
      wallet: { ...result.wallet },
    });
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("Failed to restore wallet:", error);
    console.groupEnd();
    throw new Error("Failed to restore wallet from mnemonic");
  }
};

// 지갑 상태 저장
export const saveWalletToStorage = (wallet: WalletState) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("wallet", JSON.stringify(wallet));
};

// 지갑 상태 불러오기
export const loadWalletFromStorage = (): WalletState | null => {
  if (typeof window === "undefined") return null;
  const saved = localStorage.getItem("wallet");
  return saved ? JSON.parse(saved) : null;
};

// 지갑 상태 초기화
export const clearWalletFromStorage = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("wallet");
};