'use client';

import { useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { useStore } from '@/store/useStore';
import { formatEther } from 'viem';

export default function ContractsPage() {
  const { contracts, loading, error, fetchContracts } = useStore();
  const publicClient = usePublicClient();

  useEffect(() => {
    if (publicClient) {
      fetchContracts(publicClient);
    }
  }, [fetchContracts, publicClient]);

  if (loading) {
    return <div className="p-8">로딩 중...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-8">오류: {error}</div>;
  }

  if (!contracts || contracts.length === 0) {
    return <div className="p-8">계약이 없습니다.</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">계약 목록</h1>
      <div className="grid gap-6">
        {contracts.map((contract, index) => (
          <div key={index} className="border p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-2xl font-semibold mb-4">계약 #{Number(contract.id)}</h2>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-600">제안 ID:</span>
                    <span className="ml-2">{Number(contract.proposalId)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">입찰 ID:</span>
                    <span className="ml-2">{Number(contract.bidId)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">제안자:</span>
                    <span className="ml-2 font-mono">{contract.proposer}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">보험사:</span>
                    <span className="ml-2 font-mono">{contract.insuranceCompany}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-600">보험료:</span>
                  <span className="ml-2">{formatEther(contract.premium)} ETH</span>
                </div>
                <div>
                  <span className="text-gray-600">보장 금액:</span>
                  <span className="ml-2">{formatEther(contract.coverage)} ETH</span>
                </div>
                <div>
                  <span className="text-gray-600">시작일:</span>
                  <span className="ml-2">
                    {new Date(Number(contract.startDate) * 1000).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">종료일:</span>
                  <span className="ml-2">
                    {new Date(Number(contract.endDate) * 1000).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">상태:</span>
                  <span className={`ml-2 ${contract.active ? 'text-green-600' : 'text-red-600'}`}>
                    {contract.active ? '활성' : '비활성'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">청구 여부:</span>
                  <span className={`ml-2 ${contract.claimed ? 'text-yellow-600' : 'text-gray-600'}`}>
                    {contract.claimed ? '청구됨' : '청구 없음'}
                  </span>
                </div>
              </div>
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold mb-2">계약 조건</h3>
                <p className="whitespace-pre-wrap text-gray-700">{contract.terms}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 