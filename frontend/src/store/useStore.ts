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
  active: boolean;
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

export const useStore = create<StoreState>((set) => ({
  contractAddress: process.env.NEXT_PUBLIC_FUNDIT_CONTRACT_ADDRESS || null,
  proposals: null,
  contracts: null,
  loading: false,
  error: null,
  fetchProposals: async (publicClient: PublicClient) => {
    const contractAddress = process.env.NEXT_PUBLIC_FUNDIT_CONTRACT_ADDRESS;
    if (!contractAddress) {
      set({ error: '컨트랙트 주소가 설정되지 않았습니다' });
      return;
    }

    set({ loading: true, error: null });

    try {
      // 제안 수 가져오기
      const count = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: FUNDIT_ABI,
        functionName: 'getProposalCount',
      }) as bigint;

      // 각 제안 정보 가져오기
      const proposalPromises = Array.from({ length: Number(count) }, (_, i) =>
        publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: FUNDIT_ABI,
          functionName: 'getProposal',
          args: [BigInt(i + 1)],
        })
      );

      const proposalResults = await Promise.all(proposalPromises);
      
      // 결과를 Proposal 인터페이스에 맞게 변환
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
    const contractAddress = process.env.NEXT_PUBLIC_FUNDIT_CONTRACT_ADDRESS;
    if (!contractAddress) {
      set({ error: '컨트랙트 주소가 설정되지 않았습니다' });
      return;
    }

    set({ loading: true, error: null });

    try {
      // 계약 수 가져오기
      const count = await publicClient.readContract({
        address: contractAddress as `0x${string}`,
        abi: FUNDIT_ABI,
        functionName: 'getContractCount',
      });

      // 각 계약 정보 가져오기
      const contractPromises = Array.from({ length: Number(count) }, (_, i) =>
        publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: FUNDIT_ABI,
          functionName: 'getContract',
          args: [BigInt(i + 1)],
        })
      );

      const contractData = await Promise.all(contractPromises);
      set({ contracts: contractData });
    } catch (error) {
      console.error('계약 목록 로드 중 오류:', error);
      set({ error: '계약 목록을 불러오는 중 오류가 발생했습니다' });
    } finally {
      set({ loading: false });
    }
  },
})); 