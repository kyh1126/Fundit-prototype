import '@rainbow-me/rainbowkit/styles.css'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Navbar from '@/components/layout/Navbar'
import type { Metadata } from 'next'

// Inter 폰트 설정
const inter = Inter({ subsets: ['latin'] })

// 메타데이터 설정
export const metadata: Metadata = {
  title: 'Fundit - 블록체인 기반 보험 플랫폼',
  description: '보험 상품을 제안하고, 입찰하고, 계약을 체결하세요.',
}

// 루트 레이아웃 컴포넌트
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className={inter.className}>
        <Providers>
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
