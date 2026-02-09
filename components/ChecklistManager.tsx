'use client'

import { useState, useOptimistic } from 'react'
import { CHECK_TYPES, CHECK_TYPE_LABELS } from '@/lib/constants'

type CheckItem = {
  id: string
  checkType: string
  checked: boolean
  lastModifiedBy: string | null
  lastModifiedAt: Date | null
  lastModifier: {
    id: string
    name: string
  } | null
}

type Props = {
  currentUser: {
    id: string
    name: string
    role: string
  }
  storeId: string
  checkItems: CheckItem[]
}

export default function ChecklistManager({ currentUser, storeId, checkItems }: Props) {
  const [optimisticItems, setOptimisticItems] = useOptimistic(
    checkItems,
    (state, { checkType, checked }: { checkType: string; checked: boolean }) => {
      return state.map(item =>
        item.checkType === checkType
          ? {
              ...item,
              checked,
              lastModifiedBy: currentUser.id,
              lastModifiedAt: new Date(),
              lastModifier: { id: currentUser.id, name: currentUser.name }
            }
          : item
      )
    }
  )

  const handleToggle = async (checkType: string, currentChecked: boolean) => {
    // Optimistic update
    setOptimisticItems({ checkType, checked: !currentChecked })

    try {
      const response = await fetch(`/api/stores/${storeId}/checks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkType })
      })

      if (!response.ok) {
        // Revert on error
        setOptimisticItems({ checkType, checked: currentChecked })
        const error = await response.json()
        alert(error.error || '체크 업데이트 실패')
      }
    } catch (error) {
      // Revert on error
      setOptimisticItems({ checkType, checked: currentChecked })
      alert('체크 업데이트 실패')
    }
  }

  // 체크 항목을 맵으로 변환
  const itemsMap = new Map(optimisticItems.map(item => [item.checkType, item]))

  return (
    <div className="space-y-4">
      {CHECK_TYPES.map(checkType => {
        const item = itemsMap.get(checkType)
        const checked = item?.checked || false
        const lastModifier = item?.lastModifier
        const lastModifiedAt = item?.lastModifiedAt

        return (
          <div key={checkType} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => handleToggle(checkType, checked)}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-1"
            />
            <div className="flex-1">
              <label className="text-base font-medium text-gray-900 cursor-pointer">
                {CHECK_TYPE_LABELS[checkType as keyof typeof CHECK_TYPE_LABELS]}
              </label>
              {lastModifier && lastModifiedAt && (
                <p className="text-xs text-gray-500 mt-1">
                  최종 수정: {lastModifier.name} ({new Date(lastModifiedAt).toLocaleString('ko-KR')})
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
