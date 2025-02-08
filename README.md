

# Self-custodial Solana wallet integrated in [Telegram](https://telegram.org/) 

- Open-source self-custodial wallet natively integrated in [Telegram Mini App](https://core.telegram.org/bots/webapps) (aka "Web App"), focused on [Solana](https://solana.org/) ecosystem 
- This non-profit project received open-source grant & support from [Solana Foundation](https://solana.org/)


- ? [Technology stack](https://docs.google.com/document/d/1Pu1EfcJXpTwt6qpT4_J8EyxcadXzZ1eKophB-sXNDhg/edit?tab=t.0#heading=h.2mxkq8s3nl0w)

- {?} Instant Send is a Telegram Mini App with a frontend using Next.js, Tailwind CSS, and ShadCN UI, and a backend with Node.js, Grammyjs Telegram Bot API, Prisma, and PostgreSQL. It generates Solana wallets by converting a mnemonic to a seed (BIP39) and deriving an HD path (BIP44) to create keypairs via NaCl, encoding the private key in Base58. Wallets (public/private keys, mnemonic) are shown for 60 seconds, then removed, with events logged to the backend. Circle’s USDC stablecoin facilitates transactions, potentially using CCTP for cross-chain transfers. If a user sends USDC to another without a CTRL wallet, an escrow smart contract in Rust is set up for later redemption. The frontend and backend are on Vercel, and the Grammy bot runs on a custom server. Telegram contacts are shared manually, storing only names and UIDs in PostgreSQL.
For testing, Vitest along with @testing-library/react is used.
Further, for product analytics, it uses PostHog, a platform to analyze, test, observe, and deploy new features.
