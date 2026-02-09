'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Notice = {
  id: string
  title: string
  content: string
  isPinned: boolean
  createdAt: Date
  author: {
    name: string
  }
}

type Props = {
  notices: Notice[]
}

type NoticeFormData = {
  title: string
  content: string
  isPinned: boolean
}

export default function NoticeManagement({ notices }: Props) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<NoticeFormData>({
    title: '',
    content: '',
    isPinned: false
  })
  const router = useRouter()

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      isPinned: false
    })
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/notices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '공지사항 추가 실패')
        return
      }

      resetForm()
      setIsAdding(false)
      router.refresh()
    } catch (error) {
      alert('공지사항 추가 실패')
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return

    try {
      const response = await fetch('/api/notices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          ...formData
        })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '공지사항 수정 실패')
        return
      }

      resetForm()
      setEditingId(null)
      router.refresh()
    } catch (error) {
      alert('공지사항 수정 실패')
    }
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`"${title}" 공지사항을 삭제하시겠습니까?`)) return

    try {
      const response = await fetch('/api/notices', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '공지사항 삭제 실패')
        return
      }

      router.refresh()
    } catch (error) {
      alert('공지사항 삭제 실패')
    }
  }

  const startEdit = (notice: Notice) => {
    setFormData({
      title: notice.title,
      content: notice.content,
      isPinned: notice.isPinned
    })
    setEditingId(notice.id)
    setIsAdding(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsAdding(false)
    resetForm()
  }

  return (
    <div className="space-y-6">
      {/* 추가/수정 폼 */}
      {(isAdding || editingId) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingId ? '공지사항 수정' : '공지사항 추가'}
          </h2>
          <form onSubmit={editingId ? handleEdit : handleAdd} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제목 *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="공지사항 제목"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                내용 *
              </label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-black"
                placeholder="공지사항 내용"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPinned"
                checked={formData.isPinned}
                onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="isPinned" className="text-sm font-medium text-gray-700">
                상단 고정
              </label>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                {editingId ? '수정' : '추가'}
              </button>
              <button
                type="button"
                onClick={cancelEdit}
                className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 추가 버튼 */}
      {!isAdding && !editingId && (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + 공지사항 추가
        </button>
      )}

      {/* 공지사항 목록 */}
      <div className="space-y-4">
        {notices.map((notice) => (
          <div 
            key={notice.id} 
            className={`bg-white rounded-lg shadow p-6 ${
              notice.isPinned ? 'border-2 border-blue-500' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1">
                {notice.isPinned && (
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded mb-2">
                    📌 상단 고정
                  </span>
                )}
                <h3 className="text-lg font-bold text-gray-900">{notice.title}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                  <span>{notice.author.name}</span>
                  <span>·</span>
                  <span>
                    {new Date(notice.createdAt).toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(notice)}
                  className="text-blue-600 hover:text-blue-900 text-sm"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(notice.id, notice.title)}
                  className="text-red-600 hover:text-red-900 text-sm"
                >
                  삭제
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{notice.content}</p>
          </div>
        ))}
      </div>

      {notices.length === 0 && !isAdding && (
        <div className="text-center py-12 text-gray-500">
          아직 등록된 공지사항이 없습니다.
        </div>
      )}
    </div>
  )
}
