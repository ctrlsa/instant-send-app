import { TokenBZR, TokenSOL, TokenUSDC } from '@web3icons/react'
import { Token } from './solanaUtils'

export const tokenList: Omit<Token, 'balance'>[] = [
  {
    symbol: 'SOL',
    icon: <TokenSOL variant="branded" />,
    mintAddress: 'So11111111111111111111111111111111111111112'
  },
  {
    symbol: 'USDC',
    icon: <TokenUSDC variant="branded" />,
    mintAddress: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
  },
  {
    symbol: 'BRZ',
    icon: <TokenBZR variant="branded" />,
    mintAddress: 'FtgGSFADXBtroxq8VCausXRr2of47QBf5AS1NtZCu4GD'
  }
]
