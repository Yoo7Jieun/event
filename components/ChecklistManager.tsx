'use client'

import { useState, useOptimistic } from 'react'
import { useRouter } from 'next/navigation'

type CheckItem = {
  id: string
  title: string
  description: string | null
  category: string | null
  order: number
  entry: {
    id: string
    checked: boolean
    notes: string | null
    checkedAt: Date | null
  } | null
}

type Props = {
  staffId: string
  storeId: string
  checkItems: CheckItem[]
}

export default function ChecklistManager({ staffId, storeId, checkItems }: Props) {
  const router = useRouter()
  const [optimisticItems, setOptimisticItems] = useOptimistic(checkItems)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesValue, setNotesValue] = useState('')

  const handleToggle = async (checkItemId: string, currentChecked: boolean) => {
    // Optimistic update
    setOptimisticItems((items) =>
      items.map((item) =>
        item.id === checkItemId
          ? {
              ...item,
              entry: {
                id: item.entry?.id || '',
                checked: !currentChecked,
                notes: item.entry?.notes || null,
                checkedAt: !currentChecked ? new Date() : null
              }
            }
          : item
      )
    )

    try {
      const response = await fetch('/api/checklist/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          storeId,
          checkItemId
        })
      })

      if (!response.ok) {
        throw new Error('Failed to toggle checklist item')
      }

      router.refresh()
    } catch (error) {
      console.error('Error toggling checklist item:', error)
      router.refresh()
    }
  }

  const handleSaveNotes = async (checkItemId: string) => {
    try {
      const response = await fetch('/api/checklist/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId,
          storeId,
          checkItemId,
          notes: notesValue.trim() || null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save notes')
      }

      setEditingNotes(null)
      setNotesValue('')
      router.refresh()
    } catch (error) {
      console.error('Error saving notes:', error)
    }
  }

  const startEditingNotes = (checkItemId: string, currentNotes: string | null) => {
    setEditingNotes(checkItemId)
    setNotesValue(currentNotes || '')
  }

  const cancelEditingNotes = () => {
    setEditingNotes(null)
    setNotesValue('')
  }

  // Group by category
  const groupedItems = optimisticItems.reduce((acc, item) => {
    const category = item.category || '기타'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as Record<string, CheckItem[]>)

  const categories = Object.keys(groupedItems).sort()

  if (checkItems.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg">아직 체크 항목이 없습니다.</p>
        <p className="text-sm mt-2">관리자에게 문의하여 체크 항목을 추가하세요.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {categories.map((category) => (
        <div key={category}>
          <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="bg-gray-200 w-1 h-6 rounded"></span>
            {category}
          </h3>
          <div className="space-y-3">
            {groupedItems[category].map((item) => {
              const isChecked = item.entry?.checked || false
              const isEditing = editingNotes === item.id

              return (
                <div
                  key={item.id}
                  className={`border rounded-lg p-4 transition-all ${
                    isChecked
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggle(item.id, isChecked)}
                      className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                        isChecked
                          ? 'bg-green-600 border-green-600'
                          : 'bg-white border-gray-300 hover:border-blue-500'
                      }`}
                    >
                      {isChecked && (
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7"></path>
                        </svg>
                      )}
                    </button>
                    <div className="flex-1">
                      <h4
                        className={`font-medium ${
                          isChecked ? 'text-gray-600 line-through' : 'text-gray-900'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {item.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {item.description}
                        </p>
                      )}
                      
                      {/* Notes section */}
                      <div className="mt-3">
                        {isEditing ? (
                          <div className="space-y-2">
                            <textarea
                              value={notesValue}
                              onChange={(e) => setNotesValue(e.target.value)}
                              placeholder="메모를 입력하세요..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSaveNotes(item.id)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                              >
                                저장
                              </button>
                              <button
                                onClick={cancelEditingNotes}
                                className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {item.entry?.notes ? (
                              <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm">
                                <p className="text-gray-700 whitespace-pre-wrap">
                                  {item.entry.notes}
                                </p>
                                <button
                                  onClick={() => startEditingNotes(item.id, item.entry?.notes || null)}
                                  className="text-blue-600 text-xs mt-1 hover:underline"
                                >
                                  수정
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEditingNotes(item.id, null)}
                                className="text-sm text-gray-500 hover:text-blue-600"
                              >
                                + 메모 추가
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {item.entry?.checkedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          체크됨: {new Date(item.entry.checkedAt).toLocaleString('ko-KR')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
