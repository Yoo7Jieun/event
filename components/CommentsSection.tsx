'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Comment = {
  id: string
  content: string
  createdBy: string
  createdAt: Date
  lastModifiedAt: Date | null
  author: {
    id: string
    name: string
  }
}

type Props = {
  currentUser: {
    id: string
    name: string
  }
  storeId: string
  comments: Comment[]
}

export default function CommentsSection({ currentUser, storeId, comments }: Props) {
  const [content, setContent] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/stores/${storeId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '댓글 추가 실패')
        return
      }

      setContent('')
      router.refresh()
    } catch (error) {
      alert('댓글 추가 실패')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      const response = await fetch(`/api/stores/${storeId}/comments`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, content: editContent })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '댓글 수정 실패')
        return
      }

      setEditingId(null)
      setEditContent('')
      router.refresh()
    } catch (error) {
      alert('댓글 수정 실패')
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('이 댓글을 삭제하시겠습니까?')) return

    try {
      const response = await fetch(`/api/stores/${storeId}/comments`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '댓글 삭제 실패')
        return
      }

      router.refresh()
    } catch (error) {
      alert('댓글 삭제 실패')
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 댓글 입력 폼 */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="메모를 입력하세요..."
          className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-black"
          rows={3}
        />
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium text-sm sm:text-base"
        >
          {isSubmitting ? '추가 중...' : '메모 추가'}
        </button>
      </form>

      {/* 댓글 목록 */}
      <div className="space-y-3 sm:space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 text-center py-6 sm:py-8 text-sm sm:text-base">아직 메모가 없습니다.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="border rounded-lg p-3 sm:p-4 bg-gray-50">
              <div className="flex items-start justify-between mb-2 gap-2">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-gray-900 text-sm sm:text-base">{comment.author.name}</span>
                  <span className="text-xs text-gray-500 ml-2 block sm:inline sm:ml-2">
                    {new Date(comment.createdAt).toLocaleString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {comment.lastModifiedAt && (
                    <span className="text-xs text-gray-400 block sm:inline sm:ml-2">
                      (수정됨)
                    </span>
                  )}
                </div>
                {comment.createdBy === currentUser.id && (
                  <div className="flex gap-2 flex-shrink-0">
                    {editingId !== comment.id && (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(comment.id)
                            setEditContent(comment.content)
                          }}
                          className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 px-2 py-1"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-xs sm:text-sm text-red-600 hover:text-red-800 px-2 py-1"
                        >
                          삭제
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {editingId === comment.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-black"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(comment.id)}
                      className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 active:bg-blue-800"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null)
                        setEditContent('')
                      }}
                      className="px-4 py-2 text-sm bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 whitespace-pre-wrap text-sm sm:text-base break-words">{comment.content}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
