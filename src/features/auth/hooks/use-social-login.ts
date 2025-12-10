"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase";

type SocialProvider = "kakao";

interface UseSocialLoginReturn {
  signInWithKakao: () => Promise<void>;
  isLoading: boolean;
  error: Error | null;
}

const LOGIN_TIMEOUT = 20000; // 30초

// 소셜 로그인을 처리하는 커스텀 훅
export function useSocialLogin(): UseSocialLoginReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 컴포넌트 언마운트 시 타임아웃 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const signInWithKakao = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    // 기존 타임아웃이 있으면 정리
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 타임아웃 설정: 일정 시간 후 자동 취소
    timeoutRef.current = setTimeout(() => {
      setIsLoading(false);
      setError(
        new Error("로그인 요청 시간이 초과되었습니다. 다시 시도해주세요.")
      );
      timeoutRef.current = null;
    }, LOGIN_TIMEOUT);

    try {
      const supabase = getSupabaseClient();
      const redirectTo = `${window.location.origin}/auth/callback`;

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo,
          // profile_image 스코프 제거, 필요한 스코프만 명시
          scopes: "profile_nickname",
        },
      });

      // 타임아웃 정리 (성공적으로 요청이 시작되면)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      if (signInError) {
        throw signInError;
      }
      // OAuth 리다이렉트가 자동으로 발생하므로 여기서는 아무것도 하지 않음
      // 리다이렉트가 발생하면 페이지가 이동하므로 isLoading은 자동으로 해제됨
    } catch (err) {
      // 타임아웃 정리
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      const error =
        err instanceof Error ? err : new Error("로그인에 실패했습니다.");
      setError(error);
      setIsLoading(false);
      throw error;
    }
  }, []);

  return {
    signInWithKakao,
    isLoading,
    error,
  };
}
