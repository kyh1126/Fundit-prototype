import { ConnectButton } from '@rainbow-me/rainbowkit'
import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-gray-800">
              Fundit
            </Link>
            <div className="ml-10 flex items-baseline space-x-4">
              <Link href="/proposals" className="text-gray-600 hover:text-gray-900">
                보험 제안
              </Link>
              <Link href="/contracts" className="text-gray-600 hover:text-gray-900">
                계약 목록
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    </nav>
  )
} 