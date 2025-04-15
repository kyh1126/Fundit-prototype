import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-8 md:p-24">
      <div className="z-10 max-w-5xl w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            Fundit
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300">
            블록체인 기반 보험 플랫폼
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/proposals" className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-semibold mb-2">보험 제안</h2>
            <p className="text-gray-600 dark:text-gray-400">새로운 보험 상품을 제안하거나 기존 제안을 확인하세요.</p>
          </Link>

          <Link href="/contracts" className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-semibold mb-2">계약 관리</h2>
            <p className="text-gray-600 dark:text-gray-400">체결된 보험 계약을 관리하고 상태를 확인하세요.</p>
          </Link>

          <Link href="/claims" className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-shadow">
            <h2 className="text-2xl font-semibold mb-2">보험금 청구</h2>
            <p className="text-gray-600 dark:text-gray-400">보험금 청구를 신청하고 진행 상황을 확인하세요.</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
