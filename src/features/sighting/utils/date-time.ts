/**
 * 날짜/시간 관련 유틸리티 함수
 */

/**
 * 날짜/시간을 읽기 쉬운 형식으로 변환
 * @param dateTimeString - ISO 형식의 날짜/시간 문자열
 * @returns 포맷된 날짜/시간 문자열 (예: "오늘 14:30", "2024년 1월 1일 14:30")
 */
export function formatDateTimeForDisplay(dateTimeString: string): string {
  const date = new Date(dateTimeString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const inputDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const isToday = inputDate.getTime() === today.getTime();
  const isYesterday = inputDate.getTime() === today.getTime() - 86400000;

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();

  const timeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;

  if (isToday) {
    return `오늘 ${timeStr}`;
  } else if (isYesterday) {
    return `어제 ${timeStr}`;
  } else {
    return `${year}년 ${month}월 ${day}일 ${timeStr}`;
  }
}

/**
 * 날짜만 읽기 쉬운 형식으로 변환
 * @param dateTimeString - ISO 형식의 날짜/시간 문자열
 * @returns 포맷된 날짜 문자열 (예: "오늘", "어제", "2024년 1월 1일")
 */
export function formatDateForDisplay(dateTimeString: string): string {
  const date = new Date(dateTimeString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const inputDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

  const isToday = inputDate.getTime() === today.getTime();
  const isYesterday = inputDate.getTime() === today.getTime() - 86400000;

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (isToday) {
    return "오늘";
  } else if (isYesterday) {
    return "어제";
  } else {
    return `${year}년 ${month}월 ${day}일`;
  }
}

/**
 * 현재 시간을 datetime-local 형식(YYYY-MM-DDTHH:mm)으로 반환
 */
export function getCurrentDateTimeLocal(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * 현재 날짜를 YYYY-MM-DD 형식으로 반환
 */
export function getCurrentDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * 현재 시간을 HH:mm 형식으로 반환
 */
export function getCurrentTime(): string {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * datetime-local 형식에서 날짜 부분 추출 (YYYY-MM-DD)
 */
export function getDatePart(dateTime: string): string {
  return dateTime.split("T")[0] || "";
}

/**
 * datetime-local 형식에서 시간 부분 추출 (HH:mm)
 */
export function getTimePart(dateTime: string): string {
  return dateTime.split("T")[1] || "";
}

/**
 * 날짜와 시간을 합쳐서 datetime-local 형식으로 반환
 */
export function combineDateTime(date: string, time: string): string {
  if (!date || !time) return getCurrentDateTimeLocal();
  return `${date}T${time}`;
}
