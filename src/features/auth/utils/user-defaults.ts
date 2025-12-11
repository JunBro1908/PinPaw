/**
 * 사용자 기본값 관련 유틸리티 함수
 */

// 랜덤 강아지 이름 목록
const DOG_NAMES = [
  "뽀삐",
  "초코",
  "몽이",
  "루이",
  "코코",
  "뭉이",
  "별이",
  "하늘이",
  "구름이",
  "바둑이",
  "나비",
  "토토",
  "미미",
  "똘이",
  "복실이",
  "까미",
  "두리",
  "또리",
  "보리",
  "누리",
  "막내",
  "마루",
  "방울이",
  "하트",
] as const;

/**
 * 랜덤 강아지 이름 생성 (고유성을 위해 랜덤 숫자 추가)
 * @param userId - 사용자 ID (일관된 이름 생성을 위해 사용)
 * @returns 랜덤 강아지 이름 + 랜덤 숫자 (예: "뽀삐123")
 */
export function generateRandomDogName(userId?: string): string {
  let baseName: string;

  if (userId) {
    // userId를 기반으로 일관된 이름 생성
    const hash = userId.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    const index = Math.abs(hash) % DOG_NAMES.length;
    baseName = DOG_NAMES[index];
  } else {
    // userId가 없으면 완전 랜덤
    baseName = DOG_NAMES[Math.floor(Math.random() * DOG_NAMES.length)];
  }

  // 고유성을 위한 랜덤 숫자 생성 (100-999)
  const randomNumber = Math.floor(Math.random() * 900) + 100;

  return `${baseName}${randomNumber}`;
}

/**
 * 사용자 닉네임 반환 (없으면 랜덤 강아지 이름)
 * @param nickname - 사용자 닉네임 (선택사항)
 * @param userId - 사용자 ID (일관된 이름 생성을 위해 사용)
 * @returns 닉네임 또는 랜덤 강아지 이름
 */
export function getUserNickname(
  nickname?: string | null,
  userId?: string
): string {
  return nickname || generateRandomDogName(userId);
}
