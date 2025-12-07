/**
 * 목격 제보 관련 상수 정의
 */

export const FEATURE_TAGS = [
  { id: "collar", label: "목줄 있음" },
  { id: "clothes", label: "옷 입음" },
  { id: "scared", label: "겁이 많음" },
  { id: "friendly", label: "사람을 반김" },
] as const;

export const BREED_OPTIONS = [
  "믹스견",
  "골든 리트리버",
  "래브라도 리트리버",
  "비글",
  "불독",
  "치와와",
  "포메라니안",
  "푸들",
  "시츄",
  "요크셔 테리어",
  "허스키",
  "기타",
] as const;

export const COLOR_OPTIONS = [
  "갈색",
  "검정",
  "흰색",
  "크림색",
  "회색",
  "황금색",
  "빨강/레드",
  "기타",
] as const;
