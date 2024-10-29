import bs58 from "bs58";
import { generateMnemonic, mnemonicToSeedSync, validateMnemonic } from "bip39";
import { derivePath } from "ed25519-hd-key";
import { Keypair } from "@solana/web3.js";
import { toast } from "sonner";
import nacl from "tweetnacl";

export interface Wallet {
  publicKey: string;
  privateKey: string;
  mnemonic: string;
  path: string;
}

export const generateWalletFromMnemonic = (
  pathType: string,
  mnemonic: string,
  accountIndex: number
): Wallet | null => {
  try {
    if (pathType !== "501") {
      toast.error("Unsupported path type.");
      return null;
    }

    const seedBuffer = mnemonicToSeedSync(mnemonic);
    const path = `m/44'/501'/0'/${accountIndex}'`;
    const { key: derivedSeed } = derivePath(path, seedBuffer.toString("hex"));

    // Generate Solana keypair
    const { secretKey } = nacl.sign.keyPair.fromSeed(derivedSeed);
    const keypair = Keypair.fromSecretKey(secretKey);

    const privateKeyEncoded = bs58.encode(secretKey);
    const publicKeyEncoded = keypair.publicKey.toBase58();

    return {
      publicKey: publicKeyEncoded,
      privateKey: privateKeyEncoded,
      mnemonic,
      path,
    };
  } catch (error) {
    toast.error("Failed to generate wallet. Please try again.");
    return null;
  }
};

export const createMnemonic = () => generateMnemonic();

export const validateWalletMnemonic = (mnemonic: string) =>
  validateMnemonic(mnemonic);
