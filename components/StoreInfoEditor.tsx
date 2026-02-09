'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
}

type Props = {
  store: Store
  canEdit: boolean
}

export default function StoreInfoEditor({ store, canEdit }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: store.name,
    businessNumber: store.businessNumber,
    ownerName: store.ownerName,
    ownerPhone: store.ownerPhone,
    address: store.address,
    mapLink: store.mapLink,
    products: store.products,
    isMarketDayOnly: store.isMarketDayOnly
  })
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.checked
    })
  }

  const handleSave = async () => {
    if (!formData.name || !formData.businessNumber || !formData.ownerName || 
        !formData.ownerPhone || !formData.address) {
      alert('필수 항목을 모두 입력해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/stores/${store.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        alert(error.error || '수정 실패')
        return
      }

      alert('수정되었습니다.')
      setIsEditing(false)
      router.refresh()
    } catch (error) {
      alert('수정 실패')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      name: store.name,
      businessNumber: store.businessNumber,
      ownerName: store.ownerName,
      ownerPhone: store.ownerPhone,
      address: store.address,
      mapLink: store.mapLink,
      products: store.products,
      isMarketDayOnly: store.isMarketDayOnly
    })
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-1 sm:mb-2">
          <span className="text-xs sm:text-sm text-gray-500">점포 #{store.serialNumber}</span>
          {canEdit && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              수정
            </button>
          )}
        </div>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">{store.name}</h1>
        
        <div className="space-y-1 text-xs sm:text-sm text-gray-600">
          <p><span className="font-medium">사업자번호:</span> {store.businessNumber}</p>
          <p><span className="font-medium">대표자:</span> {store.ownerName}</p>
          <p>
            <span className="font-medium">연락처:</span>{' '}
            <a href={`tel:${store.ownerPhone}`} className="text-blue-600 hover:underline font-medium">
              {store.ownerPhone}
            </a>
          </p>
          <p><span className="font-medium">품목:</span> {store.products}</p>
          {store.isMarketDayOnly && (
            <p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500 text-white">
                🔶 장날 점포
              </span>
            </p>
          )}
          <p className="break-all"><span className="font-medium">주소:</span> {store.address}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-1 sm:mb-2">
        <span className="text-xs sm:text-sm text-gray-500">점포 #{store.serialNumber}</span>
        <span className="text-xs text-orange-600 font-medium">편집 중</span>
      </div>
      
      <div className="space-y-3 sm:space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            점포명 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            사업자번호 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="businessNumber"
            value={formData.businessNumber}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            대표자 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="ownerName"
            value={formData.ownerName}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            연락처 <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="ownerPhone"
            value={formData.ownerPhone}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            품목
          </label>
          <input
            type="text"
            name="products"
            value={formData.products}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            disabled={isSubmitting}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isMarketDayOnly"
            name="isMarketDayOnly"
            checked={formData.isMarketDayOnly}
            onChange={handleCheckboxChange}
            className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            disabled={isSubmitting}
          />
          <label htmlFor="isMarketDayOnly" className="text-sm font-medium text-gray-700">
            🔶 장날 점포
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            주소 <span className="text-red-500">*</span>
          </label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            지도 링크
          </label>
          <input
            type="url"
            name="mapLink"
            value={formData.mapLink}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
            disabled={isSubmitting}
            placeholder="네이버 지도 또는 카카오맵 링크"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
          >
            저장
          </button>
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-400"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}
