import {
  SUPPORTED_MNEMONIC_LENGTH,
  SupportedMnemonicLength,
} from "@/constants/wallet";
import type { Wallet } from "@/types";
import axios from "axios";
import * as bip39 from "bip39";
import { buildSendRequestData, generateKeyPairFromSeed } from "../lib/crypto";
import { unscientificNotation } from "@/lib/utils";
import Decimal from "decimal.js";
const cryptotutil = require("crypto");

interface SendTransactionParams {
  privateKey: string;
  toAddress: string;
  amount: string;
}

export const createWallet = (
  mnemonicLength: SupportedMnemonicLength,
): Wallet => {
  if (!SUPPORTED_MNEMONIC_LENGTH.includes(mnemonicLength)) {
    throw new Error("Invalid mnemonic length");
  }

  const strength = (mnemonicLength / 3) * 32;
  const mnemonic = bip39.generateMnemonic(strength);

  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const khash = cryptotutil.createHash("sha256").update(seed).digest();
  const keyPair = generateKeyPairFromSeed(khash);

  return {
    privateKey: keyPair.private_key,
    publicKey: keyPair.public_key,
    address: keyPair.address,
    mnemonic,
  };
};

export const restoreWallet = (mnemonic: string): Wallet => {
  if (!bip39.validateMnemonic(mnemonic)) {
    throw new Error("Invalid mnemonic phrase");
  }

  const seed = bip39.mnemonicToSeedSync(mnemonic);
  const khash = cryptotutil.createHash("sha256").update(seed).digest();
  const keyPair = generateKeyPairFromSeed(khash);

  return {
    privateKey: keyPair.private_key,
    publicKey: keyPair.public_key,
    address: keyPair.address,
    mnemonic,
  };
};
