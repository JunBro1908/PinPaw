"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabaseClient } from "@/lib/supabase";
import { useAuth } from "../../auth/hooks/use-auth";

interface UserStats {
  lostPostsCount: number;
  searchingCount: number;
  foundCount: number;
  closedCount: number;
}

const STALE_TIME_MS = 0; // 즉시 stale 처리하여 항상 최신 데이터 가져오기
const GC_TIME_MS = 1000 * 60 * 30; // 30분

/**
 * 사용자 통계를 가져오는 커스텀 훅
 * lost_posts 테이블의 데이터를 기반으로 통계 제공
 */
export function useUserStats() {
  const { user, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ["user-stats", user?.id],
    queryFn: async (): Promise<UserStats> => {
      if (!isAuthenticated || !user) {
        return {
          lostPostsCount: 0,
          searchingCount: 0,
          foundCount: 0,
          closedCount: 0,
        };
      }

      const supabase = getSupabaseClient();

      // 전체 lost_posts 수
      const { count: totalCount, error: totalError } = await (supabase as any)
        .from("lost_posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (totalError) {
        console.error("[useUserStats] 전체 통계 조회 실패:", totalError);
        throw totalError;
      }

      // 상태별 통계
      const { count: searchingCount, error: searchingError } = await (
        supabase as any
      )
        .from("lost_posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "searching");

      if (searchingError) {
        console.error(
          "[useUserStats] searching 통계 조회 실패:",
          searchingError
        );
      }

      const { count: foundCount, error: foundError } = await (supabase as any)
        .from("lost_posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "found");

      if (foundError) {
        console.error("[useUserStats] found 통계 조회 실패:", foundError);
      }

      const { count: closedCount, error: closedError } = await (supabase as any)
        .from("lost_posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "closed");

      if (closedError) {
        console.error("[useUserStats] closed 통계 조회 실패:", closedError);
      }

      return {
        lostPostsCount: totalCount || 0,
        searchingCount: searchingCount || 0,
        foundCount: foundCount || 0,
        closedCount: closedCount || 0,
      };
    },
    enabled: isAuthenticated && !!user,
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
    refetchOnWindowFocus: true, // 창 포커스 시 자동 refetch
    refetchOnMount: true, // 컴포넌트 마운트 시 항상 refetch
  });
}
