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

export default function ClaimsPage() {
  const { publicClient, walletClient, address } = useStore()
  const [claims, setClaims] = useState<{ proposalId: number; claimInfo: ClaimInfo }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  // 청구 제출
  const handleSubmitClaim = async (proposalId: number, description: string, amount: string, evidence: string) => {
    if (!walletClient || !address) {
      setError('지갑이 연결되지 않았습니다.')
      return
    }

    try {
      const hash = await walletClient.writeContract({
        address: process.env.NEXT_PUBLIC_FUNDIT_ADDRESS as `0x${string}`,
        abi: FUNDIT_ABI,
        functionName: 'submitClaim',
        args: [BigInt(proposalId), description, parseEther(amount), evidence]
      })

      console.log('청구가 제출되었습니다:', hash)
      // 청구 목록 새로고침
      window.location.reload()
    } catch (err) {
      console.error('청구 제출 중 오류 발생:', err)
      setError('청구 제출 중 오류가 발생했습니다.')
    }
  }

  // 증거 추가
  const handleAddEvidence = async (proposalId: number, evidence: string) => {
    if (!walletClient || !address) {
      setError('지갑이 연결되지 않았습니다.')
      return
    }

    try {
      const hash = await walletClient.writeContract({
        address: process.env.NEXT_PUBLIC_FUNDIT_ADDRESS as `0x${string}`,
        abi: FUNDIT_ABI,
        functionName: 'addClaimEvidence',
        args: [BigInt(proposalId), evidence]
      })

      console.log('증거가 추가되었습니다:', hash)
      // 청구 목록 새로고침
      window.location.reload()
    } catch (err) {
      console.error('증거 추가 중 오류 발생:', err)
      setError('증거 추가 중 오류가 발생했습니다.')
    }
  }

  if (loading) return <div>로딩 중...</div>
  if (error) return <div className="text-red-500">{error}</div>

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">보험 청구</h1>
      
      <div className="grid gap-6">
        {claims.map(({ proposalId, claimInfo }) => (
          <div key={proposalId} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">청구 #{proposalId}</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium">청구 금액:</p>
                <p>{claimInfo.amount ? `${Number(claimInfo.amount) / 1e18} ETH` : 'N/A'}</p>
              </div>
              <div>
                <p className="font-medium">설명:</p>
                <p>{claimInfo.description}</p>
              </div>
              <div>
                <p className="font-medium">증거:</p>
                <ul className="list-disc list-inside">
                  {claimInfo.evidences.map((evidence, index) => (
                    <li key={index}>{evidence}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium">상태:</p>
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
              <div>
                <p className="font-medium">검증 횟수:</p>
                <p>{Number(claimInfo.verificationCount)}</p>
              </div>
              <div>
                <p className="font-medium">거절 횟수:</p>
                <p>{Number(claimInfo.rejectionCount)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 