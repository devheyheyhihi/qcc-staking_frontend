import CryptoJS from "crypto-js";
import nacl from "tweetnacl";

const HEX_TIME_SIZE = 14;
const KEY_SIZE = 64;

type Hashable = string | number | object;

const timeHash = (obj: Hashable, utime: number): string => {
  return hextime(utime) + hash(obj);
};

const utime = (): number => {
  return Date.now() * 1000;
};

const hextime = (_utime?: number): string => {
  let time = _utime;
  if (typeof time !== "number") {
    time = utime();
  }

  return time.toString(16).padStart(HEX_TIME_SIZE, "0").slice(0, HEX_TIME_SIZE);
};

const cryptoHash = (
  algo: keyof typeof CryptoJS,
  stringData: string,
): string => {
  // 'algo'가 실제 해시 함수임을 보장하기 위해 타입 단언 추가
  const hashFunction = CryptoJS[algo] as (
    data: string,
  ) => CryptoJS.lib.WordArray;
  return hashFunction(stringData).toString(CryptoJS.enc.Hex);
};

const stringToUnicode = (str: string): string => {
  if (!str) {
    return "";
  }

  return Array.prototype.map
    .call(str, function (char: string) {
      let c = char.charCodeAt(0).toString(16);

      if (c.length > 2) {
        return "\\u" + c;
      }

      return char;
    })
    .join("");
};

const toString = (input: any): string => {
  let s: string;

  if (typeof input === "object" && input !== null) {
    s = JSON.stringify(input);
  } else {
    s = String(input);
  }

  return stringToUnicode(s.replace(/\//g, "\\/"));
};

const hash = (obj: Hashable): string => {
  return cryptoHash("SHA256", toString(obj));
};

const txHash = (tx: { [key: string]: any; timestamp: number }): string => {
  return timeHash(hash(tx), tx.timestamp);
};

interface KeyPair {
  private_key: string;
  public_key: string;
  address: string;
}

const checksum = (h: string): string => {
  return hash(hash(h)).slice(0, 4);
};

const shortHash = (obj: Hashable): string => {
  return cryptoHash("RIPEMD160", hash(obj));
};

const idHash = (obj: Hashable): string => {
  const short_hash = shortHash(obj);
  return short_hash + checksum(short_hash);
};

const stringToByte = (str: string): Uint8Array => {
  const byte_array = new Uint8Array(str.length);

  for (let i = 0; i < str.length; i++) {
    byte_array[i] = str.charCodeAt(i);
  }

  return byte_array;
};

const hexToByte = (hex: string): Uint8Array => {
  if (!hex) {
    return new Uint8Array();
  }

  const bytes: number[] = [];

  for (let i = 0, length = hex.length; i < length; i += 2) {
    bytes.push(parseInt(hex.slice(i, i + 2), 16));
  }

  return new Uint8Array(bytes);
};

const byteToHex = (byte_array: Uint8Array): string => {
  if (!byte_array) {
    return "";
  }

  return Array.prototype.map
    .call(byte_array, function (byte: number) {
      return ("0" + (byte & 0xff).toString(16)).slice(-2);
    })
    .join("")
    .toLowerCase();
};

// Private Key to Public Key
const publicKey = (private_key: string): string => {
  return byteToHex(
    nacl.sign.keyPair.fromSeed(hexToByte(private_key)).publicKey,
  );
};

const address = (public_key: string): string => {
  return idHash(public_key);
};

const signature = (obj: Hashable, private_key: string): string => {
  return byteToHex(
    nacl.sign.detached(
      stringToByte(toString(obj)),
      hexToByte(private_key + publicKey(private_key)),
    ),
  );
};

const keyValidity = (key: string): boolean => {
  return /^[a-fA-F0-9]{64}$/.test(key);
};

// 개인키 유효성 검사 함수를 export
export const validatePrivateKey = (key: string): boolean => {
  return keyValidity(key);
};

interface SignedData {
  [key: string]: any;
  public_key: string;
  signature: string;
}

const signedData = (
  item: { [key: string]: any; timestamp?: number },
  private_key: string,
  type: string = "transaction",
): SignedData => {
  if (!keyValidity(private_key)) {
    console.error("Invalid private key: " + private_key);
    return { public_key: "", signature: "" };
  }

  const data: SignedData = { public_key: "", signature: "" };

  item.from = address(publicKey(private_key));

  if (typeof item.timestamp !== "number") {
    item.timestamp = utime() + (type === "transaction" ? 2000000 : 0);
  }

  data[type] = item;
  data.public_key = publicKey(private_key);
  data.signature = signature(
    txHash(item as { [key: string]: any; timestamp: number }),
    private_key,
  );

  return data;
};

function convertObjectToString(input: Record<string, any>): string {
  for (const key in input) {
    if (typeof input[key] === "object") {
      input[key] = JSON.stringify(input[key]);
    }
  }
  return JSON.stringify(input);
}

export const buildTransferTokenRequestData = (
  private_key: string,
  to: string,
  amount: string,
  token_address: string,
  timestamp: number,
): string => {
  const data = { type: "Transfer", to, amount, token_address, timestamp };
  const d = signedData(data, private_key);
  return JSON.stringify(d);
};

export const buildSendRequestData = (
  private_key: string,
  to: string,
  amount: string,
  timestamp: number,
): string => {
  const data = { type: "Send", to, amount, timestamp };
  const d = signedData(data, private_key);
  return JSON.stringify(d);
};

// use for import wallet
export const generateKeyPairFromSeed = (seed: Uint8Array) => {
  let pair = nacl.sign.keyPair.fromSeed(seed);

  const private_key = byteToHex(pair.secretKey).slice(0, KEY_SIZE);
  const public_key = byteToHex(pair.publicKey);
  const new_address = address(public_key);

  return { private_key, public_key, address: new_address };
};