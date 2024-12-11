import { TokenSOL, TokenUSDC } from '@web3icons/react'
import { Token } from './solanaUtils'

// Update the USDCWithSolanaIcon component
const USDCWithSolanaIcon = () => (
  <div className="relative inline-block h-8 w-8">
    <TokenUSDC variant="branded" className="h-full w-full" />
    <div className="absolute -bottom-1 -right-1 rounded-full p-0.5">
      <TokenSOL variant="branded" className="h-3 w-3" />
    </div>
  </div>
)

export const tokenList: Omit<Token, 'balance'>[] = [
  {
    symbol: 'SOL',
    icon: <TokenSOL variant="branded" className="h-7 w-7" />,
    mintAddress: 'So11111111111111111111111111111111111111112'
  },
  {
    symbol: 'USDC',
    icon: <USDCWithSolanaIcon />,
    mintAddress: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
  }
]
