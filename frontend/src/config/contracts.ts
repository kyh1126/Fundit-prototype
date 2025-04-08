import { FunditABI } from './abis/Fundit'
import { FunditTokenABI } from './abis/FunditToken'

export const CONTRACT_ADDRESSES = {
  FUNDIT: process.env.NEXT_PUBLIC_FUNDIT_ADDRESS || '',
  FUNDIT_TOKEN: process.env.NEXT_PUBLIC_FUNDIT_TOKEN_ADDRESS || '',
}

export const CONTRACT_ABIS = {
  FUNDIT: FunditABI,
  FUNDIT_TOKEN: FunditTokenABI,
} 