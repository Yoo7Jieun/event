'use client'

import { useState } from 'react'
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
    createdAt: Date
    author: {
      name: string
    }
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

type StoreFormData = {
  serialNumber: string
  name: string
  businessNumber: string
  ownerName: string
  ownerPhone: string
  address: string
  mapLink: string
  products: string
}

export default function StoreManagement({ stores, checklists }: Props) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<StoreFormData>({
    serialNumber: '',
    name: '',
    businessNumber: '',
    ownerName: '',
    ownerPhone: '',
    address: '',
    mapLink: '',
    products: ''
  })
  const router = useRouter()

  const resetForm = () => {
    setFormData({
      serialNumber: '',
      name: '',
      businessNumber: '',
      ownerName: '',
      ownerPhone: '',
      address: '',
      mapLink: '',
      products: ''
    })
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/admin/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serialNumber: parseInt(formData.serialNumber),
          name: formData.name,
          businessNumber: formData.businessNumber,
          ownerName: formData.ownerName,
          ownerPhone: formData.ownerPhone,
          address: formData.address,
          mapLink: formData.mapLink,
          products: formData.products
        })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '점포 추가 실패')
        return
      }

      resetForm()
      setIsAdding(false)
      router.refresh()
    } catch (error) {
      alert('점포 추가 실패')
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return

    try {
      const response = await fetch('/api/admin/stores', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          serialNumber: parseInt(formData.serialNumber),
          name: formData.name,
          businessNumber: formData.businessNumber,
          ownerName: formData.ownerName,
          ownerPhone: formData.ownerPhone,
          address: formData.address,
          mapLink: formData.mapLink,
          products: formData.products
        })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '점포 수정 실패')
        return
      }

      resetForm()
      setEditingId(null)
      router.refresh()
    } catch (error) {
      alert('점포 수정 실패')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 점포를 삭제하시겠습니까?`)) return

    try {
      const response = await fetch('/api/admin/stores', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '점포 삭제 실패')
        return
      }

      router.refresh()
    } catch (error) {
      alert('점포 삭제 실패')
    }
  }

  const startEdit = (store: Store) => {
    setFormData({
      serialNumber: store.serialNumber.toString(),
      name: store.name,
      businessNumber: store.businessNumber,
      ownerName: store.ownerName,
      ownerPhone: store.ownerPhone,
      address: store.address,
      mapLink: store.mapLink,
      products: store.products
    })
    setEditingId(store.id)
    setIsAdding(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setIsAdding(false)
    resetForm()
  }

  const getCheckStatus = (store: Store, checkType: string) => {
    const item = store.checkItems.find(item => item.checkType === checkType)
    return item?.checked || false
  }

  return (
    <div className="space-y-6">
      {/* 추가/수정 폼 */}
      {(isAdding || editingId) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingId ? '점포 수정' : '점포 추가'}
          </h2>
          <form onSubmit={editingId ? handleEdit : handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  일련번호 *
                </label>
                <input
                  type="number"
                  required
                  value={formData.serialNumber}
                  onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  점포명 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  사업자번호 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.businessNumber}
                  onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  대표자명 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  대표자 연락처 *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.ownerPhone}
                  onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  품목 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.products}
                  onChange={(e) => setFormData({ ...formData, products: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                주소 *
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                지도 링크 *
              </label>
              <input
                type="url"
                required
                value={formData.mapLink}
                onChange={(e) => setFormData({ ...formData, mapLink: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="https://..."
              />
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
          + 점포 추가
        </button>
      )}

      {/* 점포 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-10">
                  번호
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  점포명
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  대표자
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  연락처
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  품목
                </th>
                {checklists.map(checklist => (
                  <th key={checklist.id} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    <div className="whitespace-pre-wrap leading-tight">
                      {checklist.name.split(' ').join('\n')}
                    </div>
                  </th>
                ))}
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase min-w-[200px]">
                  메모 (최근 3개)
                </th>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase sticky right-0 bg-gray-50 z-10">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stores.map((store) => (
                <tr key={store.id} className="hover:bg-gray-50">
                  <td className="px-3 py-3 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white group-hover:bg-gray-50">
                    {store.serialNumber}
                  </td>
                  <td className="px-3 py-3">
                    <Link 
                      href={`/stores/${store.id}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {store.name}
                    </Link>
                    <div className="text-xs text-gray-500">{store.businessNumber}</div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                    {store.ownerName}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                    <a href={`tel:${store.ownerPhone}`} className="text-blue-600 hover:underline">
                      {store.ownerPhone}
                    </a>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900">
                    {store.products}
                  </td>
                  {checklists.map(checklist => {
                    const checked = getCheckStatus(store, checklist.name)
                    return (
                      <td key={checklist.id} className="px-2 py-3 text-center">
                        <span className={`inline-block text-lg ${checked ? 'text-green-600' : 'text-gray-300'}`}>
                          {checked ? '✓' : '○'}
                        </span>
                      </td>
                    )
                  })}
                  <td className="px-3 py-3 min-w-[200px] max-w-[300px]">
                    {store.comments.length === 0 ? (
                      <span className="text-xs text-gray-400">-</span>
                    ) : (
                      <div className="space-y-1">
                        {store.comments.map((comment) => (
                          <div key={comment.id} className="text-xs border-l-2 border-gray-200 pl-2 py-1">
                            <div className="flex items-center gap-1 text-gray-500">
                              <span className="font-medium">{comment.author.name}</span>
                              <span>·</span>
                              <span>{new Date(comment.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}</span>
                            </div>
                            <div className="text-gray-700 line-clamp-2">{comment.content}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center text-sm font-medium sticky right-0 bg-white group-hover:bg-gray-50">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => startEdit(store)}
                        className="text-blue-600 hover:text-blue-900 text-xs"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(store.id, store.name)}
                        className="text-red-600 hover:text-red-900 text-xs"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {stores.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          아직 등록된 점포가 없습니다.
        </div>
      )}
    </div>
  )
}
