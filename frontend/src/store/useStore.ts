'use client';

import { create } from 'zustand';
import { PublicClient } from 'viem';
import { FUNDIT_ABI } from '@/contracts/abi';

interface Proposal {
  id: bigint;
  proposer: `0x${string}`;
  title: string;
  description: string;
  premium: bigint;
  coverage: bigint;
  duration: bigint;
  isActive: boolean;
  hasContract: boolean;
}

interface Contract {
  id: bigint;
  proposalId: bigint;
  bidId: bigint;
  proposer: `0x${string}`;
  insuranceCompany: `0x${string}`;
  premium: bigint;
  coverage: bigint;
  terms: string;
  startDate: bigint;
  endDate: bigint;
  status: number;
  claimed: boolean;
}

interface StoreState {
  contractAddress: string | null;
  proposals: Proposal[] | null;
  contracts: Contract[] | null;
  loading: boolean;
  error: string | null;
  fetchProposals: (publicClient: PublicClient) => Promise<void>;
  fetchContracts: (publicClient: PublicClient) => Promise<void>;
}

// 컨트랙트 함수 타입
type ContractFunction = 'getProposalCount' | 'getProposal' | 'getContractCount' | 'getContract';

// 컨트랙트 읽기 함수
const readContract = async (
  publicClient: PublicClient,
  functionName: ContractFunction,
  args: readonly [] | readonly [bigint] = []
) => {
  const contractAddress = process.env.NEXT_PUBLIC_FUNDIT_CONTRACT_ADDRESS;
  if (!contractAddress) {
    throw new Error('컨트랙트 주소가 설정되지 않았습니다');
  }

  return publicClient.readContract({
    address: contractAddress as `0x${string}`,
    abi: FUNDIT_ABI,
    functionName,
    args,
  });
};

export const useStore = create<StoreState>((set) => ({
  contractAddress: process.env.NEXT_PUBLIC_FUNDIT_CONTRACT_ADDRESS || null,
  proposals: null,
  contracts: null,
  loading: false,
  error: null,
  fetchProposals: async (publicClient: PublicClient) => {
    set({ loading: true, error: null });

    try {
      const count = (await readContract(publicClient, 'getProposalCount')) as bigint;
      
      const proposalPromises = Array.from({ length: Number(count) }, (_, i) =>
        readContract(publicClient, 'getProposal', [BigInt(i + 1)])
      );

      const proposalResults = await Promise.all(proposalPromises);
      
      const proposals = proposalResults.map((result: any) => ({
        id: result[0],
        proposer: result[1],
        title: result[2],
        description: result[3],
        premium: result[4],
        coverage: result[5],
        duration: result[6],
        isActive: result[7],
        hasContract: result[8]
      }));

      set({ proposals });
    } catch (error) {
      console.error('제안 목록 로드 중 오류:', error);
      set({ error: '제안 목록을 불러오는 중 오류가 발생했습니다' });
    } finally {
      set({ loading: false });
    }
  },
  fetchContracts: async (publicClient: PublicClient) => {
    set({ loading: true, error: null });

    try {
      const count = (await readContract(publicClient, 'getContractCount')) as bigint;

      const contractPromises = Array.from({ length: Number(count) }, (_, i) =>
        readContract(publicClient, 'getContract', [BigInt(i + 1)])
      );

      const contractResults = await Promise.all(contractPromises);
      
      const contracts = contractResults.map((result: any) => ({
        id: result[0],
        proposalId: result[1],
        bidId: result[2],
        proposer: result[3],
        insuranceCompany: result[4],
        premium: result[5],
        coverage: result[6],
        terms: result[7],
        startDate: result[8],
        endDate: result[9],
        status: result[10],
        claimed: result[11]
      }));

      set({ contracts });
    } catch (error) {
      console.error('계약 목록 로드 중 오류:', error);
      set({ error: '계약 목록을 불러오는 중 오류가 발생했습니다' });
    } finally {
      set({ loading: false });
    }
  },
})); 