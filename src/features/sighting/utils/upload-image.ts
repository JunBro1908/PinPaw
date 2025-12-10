import { getSupabaseClient } from "@/lib/supabase";

/**
 * 고유한 UUID 생성 (모바일 환경 호환)
 * crypto.randomUUID가 지원되지 않는 경우 대체 방법 사용
 */
function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: 간단한 UUID v4 생성
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Supabase Storage에 이미지 업로드
 * @param file - 업로드할 이미지 파일
 * @returns 업로드된 파일의 public URL
 */
export async function uploadImage(file: File): Promise<string> {
  const supabase = getSupabaseClient();

  // 고유한 파일명 생성: sightings/{uuid}.{확장자}
  const fileExtension = file.name.split(".").pop() || "jpg";
  const uuid = generateUUID();
  const fileName = `sightings/${uuid}.${fileExtension}`;

  // Storage에 업로드
  const { data, error } = await supabase.storage
    .from("images")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("[uploadImage] 업로드 실패:", error);
    throw new Error(`이미지 업로드 실패: ${error.message}`);
  }

  // Public URL 생성
  const {
    data: { publicUrl },
  } = supabase.storage.from("images").getPublicUrl(data.path);

  return publicUrl;
}
