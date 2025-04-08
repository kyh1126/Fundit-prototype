'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/store/useStore'
import Link from 'next/link'
import { formatEther } from 'viem'

type SortField = 'premium' | 'coverage' | 'duration'
type SortOrder = 'asc' | 'desc'

export default function ProposalsPage() {
  const { proposals, loading, error, fetchProposals } = useStore()
  const [showActiveOnly, setShowActiveOnly] = useState(true)
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc')

  useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const filteredAndSortedProposals = proposals
    .filter(proposal => !showActiveOnly || proposal.isActive)
    .sort((a, b) => {
      const multiplier = sortOrder === 'asc' ? 1 : -1
      if (sortField === 'createdAt') {
        return (Number(a.createdAt) - Number(b.createdAt)) * multiplier
      }
      return (Number(a[sortField]) - Number(b[sortField])) * multiplier
    })

  if (loading) return <div className="flex justify-center p-8">Loading...</div>
  if (error) return <div className="text-red-500 p-8">Error: {error}</div>

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Insurance Proposals</h1>
        <Link
          href="/proposals/new"
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create New Proposal
        </Link>
      </div>

      <div className="mb-4">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showActiveOnly}
            onChange={(e) => setShowActiveOnly(e.target.checked)}
            className="form-checkbox h-5 w-5 text-blue-500"
          />
          <span>Show active proposals only</span>
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('premium')}
              >
                Premium (ETH) {sortField === 'premium' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('coverage')}
              >
                Coverage (ETH) {sortField === 'coverage' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('duration')}
              >
                Duration (days) {sortField === 'duration' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAndSortedProposals.map((proposal) => (
              <tr key={proposal.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{proposal.title}</div>
                  <div className="text-sm text-gray-500">{proposal.proposer}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatEther(proposal.premium)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatEther(proposal.coverage)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {proposal.duration}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    proposal.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {proposal.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <Link
                    href={`/proposals/${proposal.id}`}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 