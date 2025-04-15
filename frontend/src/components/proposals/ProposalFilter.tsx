'use client'

import { useState } from 'react'
import { ProposalFilter as FilterType } from '@/types/proposal'

interface FilterInputProps {
  label: string
  value: number | undefined
  onChange: (value: number) => void
  unit?: string
}

const FilterInput = ({ label, value, onChange, unit }: FilterInputProps) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {unit && `(${unit})`}
    </label>
    <input
      type="number"
      className="w-full border rounded p-2"
      value={value || ''}
      onChange={(e) => onChange(Number(e.target.value))}
      min={0}
    />
  </div>
)

export function ProposalFilter() {
  const [filters, setFilters] = useState<FilterType>({
    status: 'active'
  })

  const handleFilterChange = (key: keyof FilterType, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <h2 className="text-lg font-semibold mb-4">필터</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
          <select
            className="w-full border rounded p-2"
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="all">전체</option>
            <option value="active">진행중</option>
          </select>
        </div>

        <FilterInput
          label="최소 보험료"
          value={filters.minPremium}
          onChange={(value) => handleFilterChange('minPremium', value)}
          unit="ETH"
        />
        <FilterInput
          label="최대 보험료"
          value={filters.maxPremium}
          onChange={(value) => handleFilterChange('maxPremium', value)}
          unit="ETH"
        />
        <FilterInput
          label="최소 보장금액"
          value={filters.minCoverage}
          onChange={(value) => handleFilterChange('minCoverage', value)}
          unit="ETH"
        />
        <FilterInput
          label="최대 보장금액"
          value={filters.maxCoverage}
          onChange={(value) => handleFilterChange('maxCoverage', value)}
          unit="ETH"
        />
        <FilterInput
          label="최소 기간"
          value={filters.minDuration}
          onChange={(value) => handleFilterChange('minDuration', value)}
          unit="일"
        />
        <FilterInput
          label="최대 기간"
          value={filters.maxDuration}
          onChange={(value) => handleFilterChange('maxDuration', value)}
          unit="일"
        />
      </div>
    </div>
  )
} 