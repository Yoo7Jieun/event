'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CHECK_TYPES, CHECK_TYPE_LABELS } from '@/lib/constants'

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
  checkItems: Array<{
    checkType: string
    checked: boolean
  }>
}

type Props = {
  stores: Store[]
}

type SortField = 'serialNumber' | 'name'
type SortDirection = 'asc' | 'desc'

export default function StoreTable({ stores }: Props) {
  const [sortField, setSortField] = useState<SortField>('serialNumber')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedStores = [...stores].sort((a, b) => {
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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                onClick={() => handleSort('serialNumber')}
                className="px-3 py-3 text-left text-xs font-medium text-gray-700 uppercase sticky left-0 bg-gray-50 z-10 border-r border-gray-300 min-w-[60px] cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center">
                  번호
                  <SortIcon field="serialNumber" />
                </div>
              </th>
              <th 
                onClick={() => handleSort('name')}
                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase sticky left-[60px] bg-gray-50 z-10 border-r-2 border-gray-400 min-w-[180px] cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center">
                  점포명
                  <SortIcon field="name" />
                </div>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase whitespace-nowrap">
                대표자
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase whitespace-nowrap">
                연락처
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase whitespace-nowrap">
                사업자번호
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase whitespace-nowrap">
                주소
              </th>
              {CHECK_TYPES.map(checkType => (
                <th key={checkType} className="px-4 py-3 text-center text-xs font-medium text-gray-700 uppercase whitespace-nowrap">
                  {CHECK_TYPE_LABELS[checkType]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedStores.map((store) => (
              <tr key={store.id} className="hover:bg-gray-50">
                <td className="px-3 py-3 sticky left-0 bg-white z-10 border-r border-gray-300 hover:bg-gray-50">
                  <span className="text-sm font-bold text-gray-700">
                    {store.serialNumber}
                  </span>
                </td>
                <td className="px-4 py-3 sticky left-[60px] bg-white z-10 border-r-2 border-gray-400 hover:bg-gray-50">
                  <Link 
                    href={`/stores/${store.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {store.name}
                  </Link>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {store.ownerName}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <a href={`tel:${store.ownerPhone}`} className="text-sm text-blue-600 hover:underline">
                    {store.ownerPhone}
                  </a>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {store.businessNumber}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className="text-sm text-gray-900">
                    {store.address}
                  </span>
                </td>
                {CHECK_TYPES.map(checkType => {
                  const checked = getCheckStatus(store, checkType)
                  return (
                    <td key={checkType} className="px-4 py-3">
                      <div className="flex justify-center">
                        <div className={`w-8 h-8 rounded border-2 flex items-center justify-center ${
                          checked
                            ? 'bg-blue-500 border-blue-500'
                            : 'bg-yellow-100 border-yellow-400'
                        }`}>
                          {checked && (
                            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
