import {
  Connection,
  PublicKey,
  Transaction,
  LAMPORTS_PER_SOL,
  SystemProgram,
  Keypair
} from '@solana/web3.js'
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  getAccount,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync
} from '@solana/spl-token'
import { Wallet as WalletType } from '@/utils/wallet'

import bs58 from 'bs58'
import nacl from 'tweetnacl'
import * as anchor from '@coral-xyz/anchor'
import { AnchorProvider, BN, Program } from '@coral-xyz/anchor'
import { sha256 } from 'js-sha256'

import { InstantSendProgram } from '../utils/program/types'
import IDL from '@/utils/program/idl.json'

const ESCROW_SEED_SOL = Buffer.from('escrow_sol')
const ESCROW_SEED_SPL = Buffer.from('escrow_spl')
const PROGRAM_ID = new PublicKey('BCLTR5fuCWrMUWc75yKnG35mtrvXt6t2eLuPwCXA93oY')

function hashSecret(secret: string): number[] {
  const hash = sha256.array(secret)
  return Array.from(hash.slice(0, 32)).map((num) => Number(num))
}

export type Token = {
  symbol: string
  balance?: number
  icon: JSX.Element
  mintAddress: string
}

export type TokenWithPrice = Token & {
  usdPrice?: number
}

type BinancePrice = {
  symbol: string
  price: string
}

export async function fetchTokenPrices(symbols: string[]): Promise<Record<string, number>> {
  const binanceSymbols: Record<string, string> = {
    SOL: 'SOLUSDT',
    BONK: 'BONKUSDT'
  }

  try {
    const response = await fetch('https://api.binance.com/api/v3/ticker/price')
    if (!response.ok) {
      throw new Error('Failed to fetch prices')
    }

    const data: BinancePrice[] = await response.json()

    const prices: Record<string, number> = {}
    symbols.forEach((symbol) => {
      prices[symbol] = 0
    })

    symbols.forEach((symbol) => {
      if (symbol === 'USDC') {
        prices[symbol] = 1 // USDC is always $1
        return
      }
      if ((symbol = 'SOL')) {
        console.log('SOL Price', prices[symbol])
      }

      const binanceSymbol = binanceSymbols[symbol]
      if (binanceSymbol) {
        const price = data.find((p) => p.symbol === binanceSymbol)
        if (price) {
          prices[symbol] = parseFloat(price.price)
        }
      }
    })

    return prices
  } catch (error) {
    console.error('Error fetching token prices:', error)
    return symbols.reduce(
      (acc, symbol) => ({
        ...acc,
        [symbol]: symbol === 'USDC' ? 1 : 0
      }),
      {}
    )
  }
}

const PRICE_CACHE_DURATION = 30000 // 30 seconds

let priceCache: Record<string, number> = {}
let lastPriceFetch = 0

export const fetchTokenBalances = async (
  connection: Connection,
  walletPublicKey: string,
  tokenList: Omit<Token, 'balance'>[]
): Promise<TokenWithPrice[]> => {
  const userPublicKey = new PublicKey(walletPublicKey)

  const balances = await Promise.all(
    tokenList.map(async (token) => {
      if (token.symbol === 'SOL') {
        const balance = await connection.getBalance(userPublicKey)
        return { ...token, balance: balance / LAMPORTS_PER_SOL }
      } else {
        const mintPublicKey = new PublicKey(token.mintAddress)
        const tokenAccount = await getAssociatedTokenAddress(mintPublicKey, userPublicKey)
        try {
          let accountInfo
          try {
            accountInfo = await getAccount(connection, tokenAccount)
          } catch (error) {
            if (error instanceof Error && error.message.includes('could not find account')) {
              const transaction = new Transaction().add(
                createAssociatedTokenAccountInstruction(
                  userPublicKey,
                  tokenAccount,
                  userPublicKey,
                  mintPublicKey
                )
              )
              const signature = await sendTransaction(transaction, connection, walletPublicKey)
              await connection.confirmTransaction(signature, 'confirmed')
              accountInfo = await getAccount(connection, tokenAccount)
            } else {
              throw error
            }
          }
          return {
            ...token,
            balance: Number(accountInfo.amount) / 1e6
          }
        } catch (error) {
          console.error(`Error fetching balance for ${token.symbol}:`, error)
          return { ...token, balance: 0 }
        }
      }
    })
  )

  // Check if we need to refresh prices
  const now = Date.now()
  if (now - lastPriceFetch > PRICE_CACHE_DURATION) {
    priceCache = await fetchTokenPrices(tokenList.map((t) => t.symbol))
    lastPriceFetch = now
  }

  return balances.map((token) => ({
    ...token,
    usdPrice: priceCache[token.symbol]
  }))
}

export const sendTokens = async (
  connection: Connection,
  wallet: WalletType,
  selectedToken: Token,
  sendAmount: string,
  recipient: string
): Promise<string> => {
  if (selectedToken.symbol === 'SOL') {
    const balance = await connection.getBalance(new PublicKey(wallet.publicKey))
    selectedToken.balance = balance / LAMPORTS_PER_SOL
    if (selectedToken.balance === undefined) {
      throw new Error('Insufficient balance. Please, top up')
    }
    const recipientPubkey = new PublicKey(recipient)
    const lamports = parseFloat(sendAmount) * LAMPORTS_PER_SOL

    if (lamports > selectedToken.balance * LAMPORTS_PER_SOL) {
      throw new Error('Insufficient balance. Please, top up')
    }

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(wallet.publicKey),
        toPubkey: recipientPubkey,
        lamports
      })
    )
    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = new PublicKey(wallet.publicKey)
    const signedTransaction = await signTransaction(transaction, wallet)
    const signature = await connection.sendRawTransaction(signedTransaction.serialize())
    await connection.confirmTransaction(signature, 'confirmed')
    console.log(signature)
    return signature
  } else {
    const recipientPubkey = new PublicKey(recipient)
    const amountInDecimals = parseFloat(sendAmount) * 10 ** 6
    if (selectedToken.balance) {
      if (amountInDecimals > selectedToken.balance * 1e6) {
        throw new Error(`Insufficient ${selectedToken.symbol} balance for this transfer`)
      }
    }

    const fromPubkey = new PublicKey(wallet.publicKey)
    const mintPubkey = new PublicKey(selectedToken.mintAddress)

    const fromTokenAccount = await getAssociatedTokenAddress(mintPubkey, fromPubkey)
    const toTokenAccount = await getAssociatedTokenAddress(mintPubkey, recipientPubkey)

    let transaction = new Transaction()

    // Check if the sender's token account exists
    const fromTokenAccountInfo = await connection.getAccountInfo(fromTokenAccount)
    if (!fromTokenAccountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          fromPubkey,
          fromTokenAccount,
          fromPubkey,
          mintPubkey
        )
      )
    }

    // Check if the recipient's token account exists
    const toTokenAccountInfo = await connection.getAccountInfo(toTokenAccount)
    if (!toTokenAccountInfo) {
      transaction.add(
        createAssociatedTokenAccountInstruction(
          fromPubkey,
          toTokenAccount,
          recipientPubkey,
          mintPubkey
        )
      )
    }

    // Add transfer instruction
    transaction.add(
      createTransferInstruction(
        fromTokenAccount,
        toTokenAccount,
        fromPubkey,
        BigInt(amountInDecimals),
        [],
        TOKEN_PROGRAM_ID
      )
    )

    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash()
    transaction.recentBlockhash = blockhash
    transaction.feePayer = fromPubkey

    // Sign and send transaction
    const signedTransaction = await signTransaction(transaction, wallet)
    const signature = await connection.sendRawTransaction(signedTransaction.serialize())
    await connection.confirmTransaction(signature, 'confirmed')

    return signature
  }
}

const signTransaction = async (
  transaction: Transaction,
  wallet: WalletType
): Promise<Transaction> => {
  const message = transaction.serializeMessage()
  const secretKey = bs58.decode(wallet.privateKey)
  const signature = nacl.sign.detached(message, secretKey)
  transaction.addSignature(new PublicKey(wallet.publicKey), Buffer.from(signature))
  return transaction
}

const sendTransaction = async (
  transaction: Transaction,
  connection: Connection,
  walletPublicKey: string
): Promise<string> => {
  const { blockhash } = await connection.getLatestBlockhash()
  transaction.recentBlockhash = blockhash
  transaction.feePayer = new PublicKey(walletPublicKey)
  const rawTransaction = transaction.serialize()
  const signature = await connection.sendRawTransaction(rawTransaction)
  return signature
}

export const withdrawToExternalWallet = async (
  connection: Connection,
  wallet: WalletType,
  selectedToken: Token,
  sendAmount: string,
  recipient: string
): Promise<string> => {
  return sendTokens(connection, wallet, selectedToken, sendAmount, recipient)
}

export const retrieveMnemonic = (userId: string): string => {
  const wallet = localStorage.getItem(`Solana_wallet_${userId}`)
  if (!wallet) {
    throw new Error('No wallet found')
  }
  const walletParsed = JSON.parse(wallet)
  const mnemonic = walletParsed.mnemonic
  return mnemonic
}

export const deleteMnemonic = (userId: string): void => {
  const wallet = localStorage.getItem(`Solana_wallet_${userId}`)
  if (!wallet) {
    throw new Error('No wallet found')
  }
  const walletParsed = JSON.parse(wallet)
  walletParsed.mnemonic = ''
  localStorage.setItem(`Solana_wallet_${userId}`, JSON.stringify(walletParsed))
}

export const hasMnemonic = (userId: string): boolean => {
  const wallet = localStorage.getItem(`Solana_wallet_${userId}`)
  if (!wallet) {
    return false
  }
  const walletParsed = JSON.parse(wallet)
  return walletParsed.mnemonic !== ''
}

export async function initializeEscrow(
  connection: Connection,
  senderWallet: WalletType,
  tokenMint: PublicKey | null,
  amount: anchor.BN,
  expirationTime: anchor.BN,
  secret: string,
  isSol: boolean
): Promise<string> {
  const keypair = Keypair.fromSecretKey(bs58.decode(senderWallet.privateKey))
  const wallet = {
    publicKey: keypair.publicKey,
    signTransaction: async <T extends Transaction | anchor.web3.VersionedTransaction>(
      tx: T
    ): Promise<T> => {
      if (tx instanceof Transaction) {
        tx.partialSign(keypair)
      } else {
        // Handle VersionedTransaction if needed
        tx.sign([keypair])
      }
      return tx
    },
    signAllTransactions: async <T extends Transaction | anchor.web3.VersionedTransaction>(
      txs: T[]
    ): Promise<T[]> => {
      return txs.map((tx) => {
        if (tx instanceof Transaction) {
          tx.partialSign(keypair)
        } else {
          // Handle VersionedTransaction if needed
          tx.sign([keypair])
        }
        return tx
      })
    }
  }

  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: 'processed'
  })

  const program = new Program<InstantSendProgram>(IDL as InstantSendProgram, provider)
  console.log('Program ID:', program.programId.toBase58())
  const secretHash = hashSecret(secret)

  // Derive escrow PDA
  const [escrowAccount] = await PublicKey.findProgramAddress(
    [Buffer.from(isSol ? ESCROW_SEED_SOL : ESCROW_SEED_SPL), Buffer.from(secretHash)],
    PROGRAM_ID
  )

  console.log('Escrow PDA:', escrowAccount.toBase58())
  const signer = Keypair.fromSecretKey(bs58.decode(senderWallet.privateKey))

  let tx: string
  if (isSol) {
    tx = await program.methods
      .initializeTransferSol(new BN(amount * LAMPORTS_PER_SOL), new BN(expirationTime), secretHash)
      .accounts({
        sender: new PublicKey(senderWallet.publicKey),
        escrowAccount
      })
      .signers([signer])
      .rpc()
  } else {
    tx = await program.methods
      .initializeTransferSpl(
        new BN(parseFloat(amount) * 10 ** 6),
        new BN(expirationTime),
        secretHash
      )
      .accounts({
        sender: new PublicKey(senderWallet.publicKey),
        escrowAccount,
        tokenMint: tokenMint!,
        senderTokenAccount: getAssociatedTokenAddressSync(
          tokenMint!,
          new PublicKey(senderWallet.publicKey)
        )
      })
      .signers([signer])
      .rpc()
  }

  console.log('Transaction:', tx)
  return tx
}
export async function redeemEscrow(
  connection: Connection,
  redeemerWallet: WalletType,
  tokenMint: anchor.Address | null,
  sender: anchor.Address,
  secret: string,
  isSol: boolean
): Promise<void> {
  const keypair = Keypair.fromSecretKey(bs58.decode(redeemerWallet.privateKey))

  const wallet = {
    publicKey: keypair.publicKey,
    signTransaction: async <T extends Transaction | anchor.web3.VersionedTransaction>(
      tx: T
    ): Promise<T> => {
      if (tx instanceof Transaction) {
        tx.partialSign(keypair)
      } else {
        // Handle VersionedTransaction if needed
        tx.sign([keypair])
      }
      return tx
    },
    signAllTransactions: async <T extends Transaction | anchor.web3.VersionedTransaction>(
      txs: T[]
    ): Promise<T[]> => {
      return txs.map((tx) => {
        if (tx instanceof Transaction) {
          tx.partialSign(keypair)
        } else {
          // Handle VersionedTransaction if needed
          tx.sign([keypair])
        }
        return tx
      })
    }
  }
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: 'processed'
  })
  const program = new Program<InstantSendProgram>(IDL as InstantSendProgram, provider)

  const secretHash = hashSecret(secret)

  // Derive escrow PDA
  const [escrowAccount] = await PublicKey.findProgramAddress(
    [isSol ? ESCROW_SEED_SOL : ESCROW_SEED_SPL, new Uint8Array(secretHash)],
    program.programId
  )

  console.log('Escrow PDA:', escrowAccount.toBase58())

  const tx = isSol
    ? program.methods
        .redeemFundsSol(secret)
        .accounts({
          signer: redeemerWallet.publicKey,
          sender: new PublicKey(sender),
          escrowAccount,
          recipient: new PublicKey(redeemerWallet.publicKey)
        })
        .signers([keypair])
    : program.methods
        .redeemFundsSpl(secret)
        .accounts({
          signer: redeemerWallet.publicKey,
          sender: new PublicKey(sender),
          escrowAccount,
          escrowTokenAccount: getAssociatedTokenAddressSync(
            new PublicKey(tokenMint!),
            escrowAccount,
            true
          ),
          recipient: new PublicKey(redeemerWallet.publicKey),
          tokenMint: new PublicKey(tokenMint!)
        })
        .signers([keypair])

  const txSignature = await tx.rpc()
  console.log('Transaction Signature:', txSignature)
}

type StoredEscrow = {
  secret: string
  sender: string
  token: string
  amount: string
  timestamp: number
  tx: string
}

export const storeEscrowLink = (escrowData: StoredEscrow) => {
  const existingEscrows = JSON.parse(localStorage.getItem('escrowLinks') || '[]')
  existingEscrows.push(escrowData)
  localStorage.setItem('escrowLinks', JSON.stringify(existingEscrows))
}

export const getStoredEscrows = (): StoredEscrow[] => {
  return JSON.parse(localStorage.getItem('escrowLinks') || '[]')
}

export const removeEscrowLink = (secret: string) => {
  const existingEscrows = getStoredEscrows()
  const filteredEscrows = existingEscrows.filter((escrow) => escrow.secret !== secret)
  localStorage.setItem('escrowLinks', JSON.stringify(filteredEscrows))
}
