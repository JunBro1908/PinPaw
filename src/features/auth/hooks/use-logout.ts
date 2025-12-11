"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

interface UseLogoutReturn {
  logout: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * 로그아웃을 처리하는 커스텀 훅
 */
export function useLogout(): UseLogoutReturn {
  const router = useRouter();

  const logout = useCallback(async () => {
    try {
      const supabase = getSupabaseClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      // 로그아웃 성공 시 지도 페이지로 리다이렉트
      router.push("/map");
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error("로그아웃에 실패했습니다.");
      throw error;
    }
  }, [router]);

  return {
    logout,
    isLoading: false,
    error: null,
  };
}
