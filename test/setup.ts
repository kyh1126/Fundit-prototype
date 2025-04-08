import { createPublicClient, createTestClient, createWalletClient, http } from 'viem';
import { hardhat } from 'viem/chains';

export const publicClient = createPublicClient({
  chain: hardhat,
  transport: http()
});

export const testClient = createTestClient({
  chain: hardhat,
  mode: 'anvil',
  transport: http()
});

export const walletClient = createWalletClient({
  chain: hardhat,
  transport: http()
}); 