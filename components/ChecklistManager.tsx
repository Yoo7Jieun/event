'use client'

import { useState, useOptimistic } from 'react'

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

  // 체크 항목을 checkType으로 정렬 (알파벳순)
  const sortedItems = [...optimisticItems].sort((a, b) => 
    a.checkType.localeCompare(b.checkType, 'ko-KR')
  )

  return (
    <div className="space-y-3 sm:space-y-4">
      {sortedItems.map(item => {
        const checked = item.checked
        const lastModifier = item.lastModifier
        const lastModifiedAt = item.lastModifiedAt

        return (
          <div key={item.id} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 active:bg-gray-100 transition">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => handleToggle(item.checkType, checked)}
              className="w-6 h-6 sm:w-5 sm:h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 mt-0.5 sm:mt-1 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <label className="text-sm sm:text-base font-medium text-gray-900 cursor-pointer block">
                {item.checkType}
              </label>
              {lastModifier && lastModifiedAt && (
                <p className="text-xs text-gray-500 mt-1 break-all">
                  최종 수정: {lastModifier.name} ({new Date(lastModifiedAt).toLocaleString('ko-KR', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })})
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
