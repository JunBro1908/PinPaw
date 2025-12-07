"use client";

import { getSupabaseClient } from "@/lib/supabase";
import type { Database } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import { uploadImage } from "../utils/upload-image";

export interface SubmitSightingParams {
  imageFile: File | null;
  latitude: number;
  longitude: number;
  breed: string | null;
  color: string | null;
  features: string[] | null;
  description: string | null;
  sightedAt: string;
}

export interface SubmitSightingResult {
  success: boolean;
  error?: string;
  id?: string;
}

type SightingInsert = Database["public"]["Tables"]["sightings"]["Insert"];

/**
 * 목격 제보 제출
 * @param params - 제보 데이터
 * @returns 제출 결과
 */
export async function submitSighting(
  params: SubmitSightingParams
): Promise<SubmitSightingResult> {
  try {
    const supabase: SupabaseClient<Database> = getSupabaseClient();

    // Step 1: 이미지 업로드
    let imageUrl: string | null = null;
    if (params.imageFile) {
      try {
        imageUrl = await uploadImage(params.imageFile);
      } catch (error) {
        console.error("[submitSighting] 이미지 업로드 실패:", error);
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "이미지 업로드에 실패했습니다.",
        };
      }
    }

    // 이미지 URL이 필수이므로 체크
    if (!imageUrl) {
      return {
        success: false,
        error: "이미지를 업로드해주세요.",
      };
    }

    // Step 2: DB에 제보 저장
    // Note: anon 역할은 SELECT 권한이 없으므로 .select() 호출 없이 insert만 수행
    const insertData: SightingInsert = {
      image_url: imageUrl,
      latitude: params.latitude,
      longitude: params.longitude,
      breed: params.breed || null,
      color: params.color || null,
      features:
        params.features && params.features.length > 0 ? params.features : null,
      description: params.description || null,
      sighted_at: params.sightedAt,
    };

    // TypeScript 타입 추론 이슈로 인해 타입 단언 필요
    // getSupabaseClient()는 SupabaseClient<Database>를 반환하지만
    // Supabase의 타입 시스템이 제대로 추론하지 못하는 경우가 있음
    const { error } = await (supabase as any)
      .from("sightings")
      .insert(insertData);

    if (error) {
      console.error("[submitSighting] DB 저장 실패:", error.message);
      return {
        success: false,
        error: error.message || "제보 저장에 실패했습니다.",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("[submitSighting] 예상치 못한 오류:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "제보 제출 중 오류가 발생했습니다.",
    };
  }
}
