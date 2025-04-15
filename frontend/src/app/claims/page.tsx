'use client'

import { useState, useEffect } from 'react'
import { useStore } from '@/store/useStore'
import { FUNDIT_ABI } from '@/contracts/abi'
import { parseEther } from 'viem'

interface ClaimInfo {
  amount: bigint
  description: string
  evidences: string[]
  processed: boolean
  approved: boolean
  autoRejected: boolean
  verificationCount: bigint
  rejectionCount: bigint
}

interface FormData {
  proposalId: string
  description: string
  amount: string
  evidence: string
}

export default function ClaimsPage() {
  const { publicClient, walletClient, address } = useStore()
  const [claims, setClaims] = useState<{ proposalId: number; claimInfo: ClaimInfo }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    proposalId: '',
    description: '',
    amount: '',
    evidence: ''
  })

  // 청구 정보 로드
  useEffect(() => {
    const loadClaims = async () => {
      if (!publicClient || !address) return

      try {
        const proposalCount = await publicClient.readContract({
          address: process.env.NEXT_PUBLIC_FUNDIT_ADDRESS as `0x${string}`,
          abi: FUNDIT_ABI,
          functionName: 'getProposalCount'
        })

        const claimsData = []
        for (let i = 0; i < Number(proposalCount); i++) {
          try {
            const claimInfo = await publicClient.readContract({
              address: process.env.NEXT_PUBLIC_FUNDIT_ADDRESS as `0x${string}`,
              abi: FUNDIT_ABI,
              functionName: 'getClaimInfo',
              args: [BigInt(i)]
            }) as ClaimInfo

            if (claimInfo) {
              claimsData.push({ proposalId: i, claimInfo })
            }
          } catch (err) {
            console.error(`청구 정보 로드 중 오류 발생 (제안 ${i}):`, err)
          }
        }

        setClaims(claimsData)
      } catch (err) {
        console.error('청구 정보 로드 중 오류 발생:', err)
        setError('청구 정보를 불러오는 중 오류가 발생했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadClaims()
  }, [publicClient, address])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!walletClient || !address) {
      setError('지갑이 연결되지 않았습니다.')
      return
    }

    try {
      const hash = await walletClient.writeContract({
        address: process.env.NEXT_PUBLIC_FUNDIT_ADDRESS as `0x${string}`,
        abi: FUNDIT_ABI,
        functionName: 'submitClaim',
        args: [
          BigInt(formData.proposalId),
          formData.description,
          parseEther(formData.amount),
          formData.evidence
        ]
      })

      console.log('청구가 제출되었습니다:', hash)
      // 폼 초기화
      setFormData({
        proposalId: '',
        description: '',
        amount: '',
        evidence: ''
      })
      // 청구 목록 새로고침
      window.location.reload()
    } catch (err) {
      console.error('청구 제출 중 오류 발생:', err)
      setError('청구 제출 중 오류가 발생했습니다.')
    }
  }

  if (!address) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">보험금 청구</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            보험금 청구를 위해 지갑을 연결해주세요.
          </p>
        </div>
      </div>
    )
  }

  if (loading) return <div className="text-center py-8">로딩 중...</div>
  if (error) return <div className="text-red-500 text-center py-8">{error}</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">보험금 청구</h1>
          <p className="text-gray-600 dark:text-gray-400">
            가입한 보험의 보험금을 청구하고 진행 상황을 확인할 수 있습니다.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">보험금 청구 신청</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                계약 선택
              </label>
              <select
                name="proposalId"
                value={formData.proposalId}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                required
              >
                <option value="">계약을 선택하세요</option>
                {claims.map(({ proposalId }) => (
                  <option key={proposalId} value={proposalId}>
                    계약 #{proposalId}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                청구 사유
              </label>
              <textarea 
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                rows={4}
                placeholder="보험금 청구 사유를 입력하세요"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                청구 금액 (ETH)
              </label>
              <input 
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                placeholder="청구할 보험금 금액을 입력하세요"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                증거 자료
              </label>
              <input 
                type="text"
                name="evidence"
                value={formData.evidence}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700"
                placeholder="증거 자료 링크나 설명을 입력하세요"
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
            >
              청구 신청
            </button>
          </div>
        </form>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">청구 내역</h2>
          {claims.length > 0 ? (
            <div className="space-y-4">
              {claims.map(({ proposalId, claimInfo }) => (
                <div key={proposalId} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                  <h3 className="font-semibold mb-2">청구 #{proposalId}</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">청구 금액</p>
                      <p>{Number(claimInfo.amount) / 1e18} ETH</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">상태</p>
                      <p>
                        {claimInfo.processed
                          ? claimInfo.approved
                            ? '승인됨'
                            : claimInfo.autoRejected
                            ? '자동 거절됨'
                            : '거절됨'
                          : '처리 중'}
                      </p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-gray-600 dark:text-gray-400">청구 사유</p>
                      <p>{claimInfo.description}</p>
                    </div>
                    {claimInfo.evidences.length > 0 && (
                      <div className="col-span-2">
                        <p className="text-gray-600 dark:text-gray-400">증거 자료</p>
                        <ul className="list-disc list-inside">
                          {claimInfo.evidences.map((evidence, index) => (
                            <li key={index}>{evidence}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-600 dark:text-gray-400 text-center py-8">
              청구 내역이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 