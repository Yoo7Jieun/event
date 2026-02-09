'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type User = {
  id: string
  number: number | null
  name: string
  role: string
  phone: string | null
  daouId: string | null
  daouPw: string | null
  refundAppId: string | null
  refundAppPw: string | null
  memo: string | null
}

type Props = {
  user: User
}

export default function ProfileForm({ user }: Props) {
  const [phone, setPhone] = useState(user.phone || '')
  const [memo, setMemo] = useState(user.memo || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, memo })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '정보 수정 실패')
        return
      }

      alert('정보가 수정되었습니다!')
      router.refresh()
    } catch (error) {
      alert('정보 수정 실패')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">내 정보</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            번호
          </label>
          <input
            type="text"
            value={user.number || '-'}
            disabled
            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            이름
          </label>
          <input
            type="text"
            value={user.name}
            disabled
            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            역할
          </label>
          <input
            type="text"
            value={user.role === 'admin' ? '관리자' : user.role === 'manager' ? '매니저' : '스태프'}
            disabled
            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            휴대폰번호
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-1234-5678"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            다우오피스4.0 ID
          </label>
          <input
            type="text"
            value={user.daouId || '-'}
            disabled
            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            다우오피스4.0 PW
          </label>
          <input
            type="text"
            value={user.daouPw || '-'}
            disabled
            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            환급관리자어플 ID
          </label>
          <input
            type="text"
            value={user.refundAppId || '-'}
            disabled
            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            환급관리자어플 PW
          </label>
          <input
            type="text"
            value={user.refundAppPw || '-'}
            disabled
            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          메모(비고)
        </label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="개인 메모를 입력하세요..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-black"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:bg-gray-300 font-medium"
      >
        {isSubmitting ? '저장 중...' : '저장'}
      </button>
    </form>
  )
}
