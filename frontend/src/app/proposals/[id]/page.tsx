'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useStore } from '@/store/useStore'
import { formatEther } from 'viem'
import { Bid } from '@/store/useStore'

export default function ProposalDetailPage() {
  const { id } = useParams()
  const { proposals, loading, error } = useStore()
  const [bidAmount, setBidAmount] = useState('')
  const [bidDescription, setBidDescription] = useState('')

  const proposal = proposals.find(p => p.id === Number(id))

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implement bid submission
  }

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  if (!proposal) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          Proposal not found
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{proposal.title}</h1>
        
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-gray-700">{proposal.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold">Premium</h3>
              <p className="text-gray-700">{formatEther(proposal.premium)} ETH</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Coverage</h3>
              <p className="text-gray-700">{formatEther(proposal.coverage)} ETH</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Duration</h3>
              <p className="text-gray-700">{proposal.duration} days</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Status</h3>
              <p className="text-gray-700">{proposal.status}</p>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Bids</h2>
            {proposal.bids && proposal.bids.length > 0 ? (
              <div className="space-y-4">
                {proposal.bids.map((bid: Bid, index: number) => (
                  <div key={index} className="bg-white p-4 rounded-lg shadow">
                    <p className="text-gray-600">Amount: {formatEther(bid.amount)} ETH</p>
                    <p className="text-gray-600">Description: {bid.description}</p>
                    <p className="text-gray-600">Bidder: {bid.bidder}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-700">No bids yet</p>
            )}
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Place a Bid</h2>
            <form onSubmit={handleBid} className="space-y-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bidAmount">
                  Bid Amount (ETH)
                </label>
                <input
                  type="number"
                  id="bidAmount"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  step="0.001"
                  min="0"
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="bidDescription">
                  Bid Description
                </label>
                <textarea
                  id="bidDescription"
                  value={bidDescription}
                  onChange={(e) => setBidDescription(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows={4}
                  required
                />
              </div>

              <button
                type="submit"
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Submit Bid
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
} 