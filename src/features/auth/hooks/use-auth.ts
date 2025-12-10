"use client";

import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

interface UseAuthReturn {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// 인증 상태를 관리하는 커스텀 훅
export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = getSupabaseClient();

    // 초기 세션 확인
    const checkSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("[useAuth] 세션 확인 실패:", error);
          setUser(null);
          setIsLoading(false);
          return;
        }

        console.log("[useAuth] 세션 확인:", session?.user?.id || "없음");
        setUser(session?.user ?? null);
        setIsLoading(false);
      } catch (err) {
        console.error("[useAuth] 세션 확인 중 오류:", err);
        setUser(null);
        setIsLoading(false);
      }
    };

    checkSession();

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(
        "[useAuth] 인증 상태 변경:",
        event,
        session?.user?.id || "없음"
      );
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}
