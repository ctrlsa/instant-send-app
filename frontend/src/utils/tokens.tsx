import { TokenSOL, TokenUSDC } from '@web3icons/react'
import { Token } from './solanaUtils'

// Custom component for USDC with Solana logo overlay
const USDCWithSolanaIcon = () => (
  <div className="relative inline-block">
    <TokenUSDC variant="branded" className="h-6 w-6" />
    <div className="absolute -bottom-2 -right-2 rounded-full ">
      <TokenSOL variant="branded" className="h-4 w-4" />
    </div>
  </div>
)

export const tokenList: Omit<Token, 'balance'>[] = [
  {
    symbol: 'SOL',
    icon: <TokenSOL variant="branded" className="h-8 w-8" />,
    mintAddress: 'So11111111111111111111111111111111111111112'
  },
  {
    symbol: 'USDC',
    icon: <USDCWithSolanaIcon />,
    mintAddress: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
  }
]
