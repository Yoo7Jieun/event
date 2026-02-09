// 고정된 체크 항목들
export const CHECK_TYPES = [
  '사업자등록증',
  '교육이수확인증',
  '이행각서',
  '어플로그인',
  '어플설치'
] as const

export type CheckType = typeof CHECK_TYPES[number]

export const CHECK_TYPE_LABELS: Record<CheckType, string> = {
  '사업자등록증': '사업자등록증',
  '교육이수확인증': '교육이수확인증',
  '이행각서': '이행각서',
  '어플로그인': '어플 로그인',
  '어플설치': '어플 설치'
}
