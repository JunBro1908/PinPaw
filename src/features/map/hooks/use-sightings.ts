"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase";
import type { Database } from "@/types/supabase";

type SightingFeatures = Database["public"]["Tables"]["sightings"]["Row"]["features"];

export interface SightingListItem {
  id: string;
  latitude: number;
  longitude: number;
  image_url: string;
  breed: string | null;
  color: string | null;
  features: SightingFeatures;
  description: string | null;
  sighted_at: string;
}

const DAYS_TO_FETCH = 30;
const STALE_TIME_MS = 1000 * 60 * 5; // 5분
const GC_TIME_MS = 1000 * 60 * 30; // 30분

/**
 * 최근 30일 이내의 sightings 데이터를 가져오는 커스텀 훅
 * TanStack Query를 사용하여 데이터 페칭 및 캐싱
 */
export function useSightings() {
  return useQuery({
    queryKey: ["sightings"],
    queryFn: async (): Promise<SightingListItem[]> => {
      const supabase = getSupabaseClient();

      // 최근 30일 이내 데이터만 가져오기
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - DAYS_TO_FETCH);

      const { data, error } = await (supabase as any)
        .from("sightings")
        .select(
          "id, latitude, longitude, image_url, breed, color, features, description, sighted_at"
        )
        .gte("sighted_at", cutoffDate.toISOString())
        .order("sighted_at", { ascending: false });

      if (error) {
        console.error("[useSightings] 데이터 조회 실패:", error);
        throw error;
      }

      return (data || []) as SightingListItem[];
    },
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
  });
}
