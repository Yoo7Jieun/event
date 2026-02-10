'use client'

import { useState, useOptimistic, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Store = {
  id: string
  serialNumber: number
  name: string
  businessNumber: string
  ownerName: string
  ownerPhone: string
  address: string
  mapLink: string
  products: string
  isMarketDayOnly: boolean
  checkItems: Array<{
    checkType: string
    checked: boolean
  }>
  comments: Array<{
    id: string
    content: string
  }>
}

type Checklist = {
  id: string
  name: string
  displayOrder: number
  isActive: boolean
}

type Props = {
  stores: Store[]
  checklists: Checklist[]
}

type SortField = 'serialNumber' | 'name'
type SortDirection = 'asc' | 'desc'

export default function StoreTable({ stores: initialStores, checklists }: Props) {
  const [sortField, setSortField] = useState<SortField>('serialNumber')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [checkFilters, setCheckFilters] = useState<Record<string, boolean>>({})
  const [marketDayFilter, setMarketDayFilter] = useState<boolean | null>(null) // null: 전체, true: 장날만, false: 일반만
  const [optimisticStores, setOptimisticStores] = useOptimistic(
    initialStores,
    (state, { storeId, checkType }: { storeId: string; checkType: string }) => {
      return state.map(store => 
        store.id === storeId 
          ? {
              ...store,
              checkItems: store.checkItems.map(item =>
                item.checkType === checkType
                  ? { ...item, checked: !item.checked }
                  : item
              )
            }
          : store
      )
    }
  )
  const router = useRouter()

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleToggleCheck = async (storeId: string, checkType: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Optimistic update wrapped in startTransition
    startTransition(() => {
      setOptimisticStores({ storeId, checkType })
    })

    try {
      const response = await fetch(`/api/stores/${storeId}/checks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkType })
      })

      if (!response.ok) {
        // Revert on error
        startTransition(() => {
          setOptimisticStores({ storeId, checkType })
        })
        const error = await response.json()
        alert(error.error || '체크 업데이트 실패')
        return
      }

      router.refresh()
    } catch (error) {
      // Revert on error
      startTransition(() => {
        setOptimisticStores({ storeId, checkType })
      })
      alert('체크 업데이트 실패')
    }
  }

  const handleToggleFilter = (checkType: string) => {
    setCheckFilters(prev => ({
      ...prev,
      [checkType]: !prev[checkType]
    }))
  }

  // 미완료 개수 계산
  const getUncheckedCount = (checkType: string) => {
    return optimisticStores.filter(store => {
      const item = store.checkItems.find(item => item.checkType === checkType)
      return !item?.checked
    }).length
  }

  // 장날 점포 개수 계산
  const marketDayStoreCount = optimisticStores.filter(store => store.isMarketDayOnly).length
  const regularStoreCount = optimisticStores.length - marketDayStoreCount

  // 필터링된 점포 목록
  const filteredStores = optimisticStores.filter(store => {
    // 장날 필터 적용
    if (marketDayFilter !== null && store.isMarketDayOnly !== marketDayFilter) {
      return false
    }

    // 활성화된 필터가 없으면 모든 점포 표시
    const activeFilters = Object.entries(checkFilters).filter(([_, isActive]) => isActive)
    if (activeFilters.length === 0) return true

    // 모든 활성화된 필터에 대해 미체크 상태여야 함
    return activeFilters.every(([checkType, _]) => {
      const item = store.checkItems.find(item => item.checkType === checkType)
      return !item?.checked // 미체크된 것만
    })
  })

  const sortedStores = [...filteredStores].sort((a, b) => {
    let compareResult = 0
    
    if (sortField === 'serialNumber') {
      compareResult = a.serialNumber - b.serialNumber
    } else if (sortField === 'name') {
      compareResult = a.name.localeCompare(b.name, 'ko-KR')
    }
    
    return sortDirection === 'asc' ? compareResult : -compareResult
  })

  const getCheckStatus = (store: Store, checkType: string) => {
    const item = store.checkItems.find(item => item.checkType === checkType)
    return item?.checked || false
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-gray-400 ml-1">↕</span>
    }
    return <span className="text-blue-600 ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* 장날 필터 버튼 */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-2 items-center">
        <span className="text-xs sm:text-sm font-medium text-gray-700">필터:</span>
        <button
          onClick={() => setMarketDayFilter(marketDayFilter === true ? null : true)}
          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition ${
            marketDayFilter === true
              ? 'bg-orange-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          🔶 장날 점포만 ({marketDayStoreCount})
        </button>
        <button
          onClick={() => setMarketDayFilter(marketDayFilter === false ? null : false)}
          className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition ${
            marketDayFilter === false
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          일반 점포만 ({regularStoreCount})
        </button>
        {marketDayFilter !== null && (
          <button
            onClick={() => setMarketDayFilter(null)}
            className="px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
          >
            전체 보기
          </button>
        )}
        <span className="text-xs text-gray-500 ml-auto">
          {filteredStores.length}개 점포
        </span>
      </div>
      
      <div className="overflow-x-auto max-h-[calc(100vh-200px)] overflow-y-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                onClick={() => handleSort('serialNumber')}
                className="px-2 sm:px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase sticky left-0 top-0 bg-gray-50 z-20 border-r border-gray-300 w-[50px] sm:min-w-[60px] cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center">
                  번호
                  <SortIcon field="serialNumber" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('name')}
                className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase sticky left-[50px] sm:left-[60px] top-0 bg-gray-50 z-20 border-r-2 border-gray-400 w-[120px] sm:min-w-[180px] cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center">
                  점포명
                  <SortIcon field="name" />
                </div>
              </th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase whitespace-nowrap sticky top-0 bg-gray-50 z-10">
                대표자
              </th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase whitespace-nowrap sticky top-0 bg-gray-50 z-10">
                연락처
              </th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase whitespace-nowrap sticky top-0 bg-gray-50 z-10">
                사업자번호
              </th>
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase whitespace-nowrap sticky top-0 bg-gray-50 z-10">
                주소
              </th>
              {checklists.map(checklist => {
                const uncheckedCount = getUncheckedCount(checklist.name)
                const isFilterActive = checkFilters[checklist.name] || false
                return (
                  <th key={checklist.id} className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase sticky top-0 bg-gray-50 z-10">
                    <div className="flex flex-col items-center gap-1">
                      <div className="flex items-center gap-1">
                        <span className="hidden sm:inline">{checklist.name}</span>
                        <span className="sm:hidden">{checklist.name.substring(0, 2)}</span>
                        <span className="text-red-600 font-bold">({uncheckedCount})</span>
                      </div>
                      <button
                        onClick={() => handleToggleFilter(checklist.name)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                          isFilterActive
                            ? 'bg-red-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}
                      >
                        {isFilterActive ? 'ON' : 'OFF'}
                      </button>
                    </div>
                  </th>
                )
              })}
              <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase whitespace-nowrap min-w-[120px] sm:min-w-[200px] sticky top-0 bg-gray-50 z-10">
                메모
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedStores.map((store) => (
              <tr key={store.id} className={store.isMarketDayOnly ? 'bg-orange-50 hover:bg-orange-100' : 'hover:bg-gray-50'}>
                <td className={`px-2 sm:px-3 py-3 sticky left-0 z-[5] border-r border-gray-300 w-[50px] sm:w-[60px] ${store.isMarketDayOnly ? 'bg-orange-50 hover:bg-orange-100' : 'bg-white hover:bg-gray-50'}`}>
                  <span className="text-xs sm:text-sm font-bold text-gray-700">
                    {store.serialNumber}
                  </span>
                </td>
                <td className={`px-2 sm:px-4 py-3 sticky left-[50px] sm:left-[60px] z-[5] border-r-2 border-gray-400 w-[120px] sm:w-auto ${store.isMarketDayOnly ? 'bg-orange-50 hover:bg-orange-100' : 'bg-white hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Link 
                      href={`/stores/${store.id}`}
                      className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline truncate"
                    >
                      {store.name}
                    </Link>
                    {store.isMarketDayOnly && (
                      <span className="inline-flex items-center px-1 sm:px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500 text-white whitespace-nowrap">
                        <span className="sm:hidden">🔶</span>
                        <span className="hidden sm:inline">🔶 장날</span>
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                  <span className="text-xs sm:text-sm text-gray-900">
                    {store.ownerName}
                  </span>
                </td>
                <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                  <a href={`tel:${store.ownerPhone}`} className="text-xs sm:text-sm text-blue-600 hover:underline">
                    {store.ownerPhone}
                  </a>
                </td>
                <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                  <span className="text-xs sm:text-sm text-gray-900">
                    {store.businessNumber}
                  </span>
                </td>
                <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                  <span className="text-xs sm:text-sm text-gray-900 line-clamp-2">
                    {store.address}
                  </span>
                </td>
                {checklists.map(checklist => {
                  const checked = getCheckStatus(store, checklist.name)
                  return (
                    <td key={checklist.id} className="px-2 sm:px-4 py-3">
                      <div className="flex justify-center">
                        <button
                          onClick={(e) => handleToggleCheck(store.id, checklist.name, e)}
                          className={`w-6 h-6 sm:w-8 sm:h-8 rounded border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${
                            checked
                              ? 'bg-blue-500 border-blue-500 hover:bg-blue-600'
                              : 'bg-yellow-100 border-yellow-400 hover:bg-yellow-200'
                          }`}
                        >
                          {checked && (
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </td>
                  )
                })}
                <td className="px-2 sm:px-4 py-3 max-w-[120px] sm:max-w-[200px]">
                  {store.comments.length > 0 ? (
                    <div className="space-y-0.5">
                      {store.comments.slice(0, 3).map((comment, index) => (
                        <p key={comment.id || index} className="text-xs text-gray-700 truncate">
                          {comment.content.length > 20 
                            ? `${comment.content.substring(0, 20)}...` 
                            : comment.content}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
