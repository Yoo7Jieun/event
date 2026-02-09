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
  createdAt: Date
}

type Props = {
  users: User[]
}

export default function UserManagement({ users: initialUsers }: Props) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    number: '',
    name: '',
    password: '0000',
    role: 'staff',
    phone: '',
    daouId: '',
    daouPw: '',
    refundAppId: '',
    refundAppPw: '',
    memo: ''
  })

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || '사용자 추가에 실패했습니다.')
        return
      }

      alert('사용자가 추가되었습니다!')
      setFormData({
        number: '',
        name: '',
        password: '0000',
        role: 'staff',
        phone: '',
        daouId: '',
        daouPw: '',
        refundAppId: '',
        refundAppPw: '',
        memo: ''
      })
      setIsAddingUser(false)
      router.refresh()
    } catch (error) {
      console.error('Error adding user:', error)
      alert('사용자 추가 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    setLoading(true)

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingUser.id,
          ...formData
        })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || '사용자 수정에 실패했습니다.')
        return
      }

      alert('사용자가 수정되었습니다!')
      setEditingUser(null)
      router.refresh()
    } catch (error) {
      console.error('Error updating user:', error)
      alert('사용자 수정 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`${userName} 사용자를 삭제하시겠습니까?`)) return
    setLoading(true)

    try {
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || '사용자 삭제에 실패했습니다.')
        return
      }

      alert('사용자가 삭제되었습니다!')
      router.refresh()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('사용자 삭제 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      number: user.number?.toString() || '',
      name: user.name,
      password: '',
      role: user.role,
      phone: user.phone || '',
      daouId: user.daouId || '',
      daouPw: user.daouPw || '',
      refundAppId: user.refundAppId || '',
      refundAppPw: user.refundAppPw || '',
      memo: user.memo || ''
    })
  }

  return (
    <div className="space-y-6">
      {/* 사용자 추가 버튼 */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">
          전체 사용자 ({users.length}명)
        </h2>
        <button
          onClick={() => setIsAddingUser(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          + 사용자 추가
        </button>
      </div>

      {/* 사용자 추가/수정 폼 */}
      {(isAddingUser || editingUser) && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingUser ? '사용자 수정' : '새 사용자 추가'}
          </h3>
          <form onSubmit={editingUser ? handleUpdate : handleAdd} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">번호</label>
                <input
                  type="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black"
                  placeholder="선택사항"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  비밀번호 {editingUser ? '(변경시만 입력)' : '*'}
                </label>
                <input
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black"
                  required={!editingUser}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">역할 *</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black"
                  required
                >
                  <option value="staff">스태프</option>
                  <option value="manager">매니저</option>
                  <option value="admin">관리자</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">휴대폰번호</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black"
                  placeholder="010-1234-5678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">다우오피스4.0 ID</label>
                <input
                  type="text"
                  value={formData.daouId}
                  onChange={(e) => setFormData({ ...formData, daouId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">다우오피스4.0 PW</label>
                <input
                  type="text"
                  value={formData.daouPw}
                  onChange={(e) => setFormData({ ...formData, daouPw: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">환급관리자어플 ID</label>
                <input
                  type="text"
                  value={formData.refundAppId}
                  onChange={(e) => setFormData({ ...formData, refundAppId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">환급관리자어플 PW</label>
                <input
                  type="text"
                  value={formData.refundAppPw}
                  onChange={(e) => setFormData({ ...formData, refundAppPw: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">메모(비고)</label>
              <textarea
                value={formData.memo}
                onChange={(e) => setFormData({ ...formData, memo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-black"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {loading ? '처리 중...' : editingUser ? '수정' : '추가'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingUser(false)
                  setEditingUser(null)
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 사용자 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">번호</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">이름</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">역할</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">연락처</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">다우오피스</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">환급앱</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">메모</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">관리</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">{user.number || '-'}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.name}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'manager' ? 'bg-purple-100 text-purple-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role === 'admin' ? '관리자' : user.role === 'manager' ? '매니저' : '스태프'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {user.phone ? (
                      <a href={`tel:${user.phone}`} className="text-blue-600 hover:underline">
                        {user.phone}
                      </a>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {user.daouId ? `${user.daouId}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {user.refundAppId ? `${user.refundAppId}` : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                    {user.memo || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(user)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        수정
                      </button>
                      {user.name !== 'admin' && (
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
