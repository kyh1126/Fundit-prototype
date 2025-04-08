import '@rainbow-me/rainbowkit/styles.css'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Navbar from '@/components/layout/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Fundit - Web3 보험 크라우드펀딩 플랫폼',
  description: '사용자가 직접 보험 상품을 제안하고 보험사가 입찰할 수 있는 혁신적인 플랫폼',
}

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
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  )
}
