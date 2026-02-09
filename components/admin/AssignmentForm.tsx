'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Store = {
  id: string
  number: number
  name: string
}

type Staff = {
  id: string
  name: string
}

type Props = {
  stores: Store[]
  staff: Staff[]
}

export default function AssignmentForm({ stores, staff }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [staffId, setStaffId] = useState('')
  const [storeId, setStoreId] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staffId, storeId })
      })

      if (!response.ok) {
        const data = await response.json()
        alert(data.error || '할당에 실패했습니다.')
        return
      }

      alert('점포가 할당되었습니다!')
      setStaffId('')
      setStoreId('')
      router.refresh()
    } catch (error) {
      console.error('Error assigning store:', error)
      alert('할당 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            스태프 선택 *
          </label>
          <select
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            required
          >
            <option value="">선택하세요</option>
            {staff.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            점포 선택 *
          </label>
          <select
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            required
          >
            <option value="">선택하세요</option>
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                #{store.number} - {store.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !staffId || !storeId}
        className="w-full bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
      >
        {loading ? '할당 중...' : '점포 할당'}
      </button>
    </form>
  )
}
