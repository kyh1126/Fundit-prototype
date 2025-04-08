import Link from 'next/link'

export default function Home() {
  return (
    <div className="relative isolate">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Fundit
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            사용자가 직접 보험 상품을 제안하고 보험사가 입찰할 수 있는 혁신적인 Web3 크라우드펀딩 플랫폼입니다.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/proposals/new"
              className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              보험 제안하기
            </Link>
            <Link href="/proposals" className="text-sm font-semibold leading-6 text-gray-900">
              제안 목록 보기 <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">주요 기능</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            사용자 중심의 보험 플랫폼
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Fundit은 기존의 보험 시장과 달리 사용자가 직접 보험 상품을 제안하고 보험사가 입찰할 수 있는 혁신적인 플랫폼입니다.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            <div className="flex flex-col">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                사용자 주도형 보험 제안
              </dt>
              <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">사용자가 원하는 보험 상품의 세부 조건을 직접 제안할 수 있습니다.</p>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                보험사 경쟁 입찰
              </dt>
              <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">보험사들이 제안된 상품에 대해 경쟁 입찰을 통해 최적의 조건을 제시합니다.</p>
              </dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-base font-semibold leading-7 text-gray-900">
                자동화된 계약 및 보험금 지급
              </dt>
              <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                <p className="flex-auto">스마트 컨트랙트를 통한 자동 계약 체결 및 Chainlink 오라클을 활용한 자동화된 보험금 지급 시스템을 제공합니다.</p>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
