'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Checklist = {
  id: string
  name: string
  displayOrder: number
  isActive: boolean
}

type Stat = {
  id: string
  name: string
  completed: number
  uncompleted: number
  total: number
}

type Props = {
  checklists: Checklist[]
  stats: Stat[]
}

export default function ChecklistManager({ checklists, stats }: Props) {
  const [newItemName, setNewItemName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleAdd = async () => {
    if (!newItemName.trim()) {
      alert('체크리스트 항목 이름을 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/checklists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newItemName.trim() })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '추가 실패')
        return
      }

      alert('체크리스트 항목이 추가되었습니다.\n모든 점포에 자동으로 추가되었습니다.')
      setNewItemName('')
      router.refresh()
    } catch (error) {
      alert('추가 실패')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 항목을 삭제하시겠습니까?\n모든 점포에서 해당 체크 항목이 삭제됩니다.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/checklists/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '삭제 실패')
        return
      }

      alert('삭제되었습니다.')
      router.refresh()
    } catch (error) {
      alert('삭제 실패')
    }
  }

  const getStatForChecklist = (checklistId: string) => {
    return stats.find(s => s.id === checklistId)
  }

  return (
    <div className="space-y-6">
      {/* 새 항목 추가 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">새 체크리스트 항목 추가</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="예: 통장사본"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            disabled={isSubmitting}
          />
          <button
            onClick={handleAdd}
            disabled={isSubmitting || !newItemName.trim()}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            추가
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          * 새 항목을 추가하면 모든 점포에 자동으로 추가됩니다.
        </p>
      </div>

      {/* 현재 체크리스트 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900">현재 체크리스트 항목</h2>
        </div>
        
        {checklists.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            체크리스트 항목이 없습니다.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">순서</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">항목명</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">완료</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">미완료</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">완료율</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">작업</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {checklists.map((checklist) => {
                  const stat = getStatForChecklist(checklist.id)
                  const completionRate = stat ? Math.round((stat.completed / stat.total) * 100) : 0
                  
                  return (
                    <tr key={checklist.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {checklist.displayOrder}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{checklist.name}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-semibold text-blue-600">
                          {stat?.completed || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-semibold text-red-600">
                          {stat?.uncompleted || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${completionRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">{completionRate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleDelete(checklist.id, checklist.name)}
                          className="text-sm text-red-600 hover:text-red-800 font-medium"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
