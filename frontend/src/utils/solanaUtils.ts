import {
  Connection,
  PublicKey,
  Transaction,
  LAMPORTS_PER_SOL,
  SystemProgram
} from '@solana/web3.js'
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
  getAccount,
  createAssociatedTokenAccountInstruction,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token'
import { Wallet } from '@/utils/wallet'
import bs58 from 'bs58'
import nacl from 'tweetnacl'

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

async function fetchTokenPrices(symbols: string[]): Promise<Record<string, number>> {
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
  wallet: Wallet,
  selectedToken: Token,
  sendAmount: string,
  recipient: string
): Promise<string> => {
  if (selectedToken.symbol === 'SOL' && selectedToken.balance !== undefined) {
    const recipientPubkey = new PublicKey(recipient)
    const lamports = parseFloat(sendAmount) * LAMPORTS_PER_SOL

    if (lamports > selectedToken.balance * LAMPORTS_PER_SOL) {
      throw new Error('Insufficient SOL balance for this transfer')
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

const signTransaction = async (transaction: Transaction, wallet: Wallet): Promise<Transaction> => {
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
