"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

/**
 * OAuth 인증 콜백 페이지
 * 클라이언트 사이드에서 code를 세션으로 교환
 */
export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const errorParam = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      // 에러가 있는 경우
      if (errorParam) {
        console.error(
          "[AuthCallback] OAuth 에러:",
          errorParam,
          errorDescription
        );
        setError(errorDescription || errorParam);
        setTimeout(() => {
          router.push("/map?error=" + encodeURIComponent(errorParam));
        }, 2000);
        return;
      }

      // code가 없는 경우 (직접 접근 또는 잘못된 리다이렉트)
      if (!code) {
        // 사용자가 직접 접근한 경우이므로 에러 로그 대신 조용히 리다이렉트
        router.replace("/map");
        return;
      }

      try {
        const supabase = getSupabaseClient();

        // code를 세션으로 교환
        const { data, error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(code);

        if (exchangeError) {
          console.error("[AuthCallback] 세션 교환 실패:", exchangeError);
          setError(exchangeError.message);
          setTimeout(() => {
            router.push(
              "/map?error=" + encodeURIComponent(exchangeError.message)
            );
          }, 2000);
          return;
        }

        console.log("[AuthCallback] 세션 교환 성공:", data?.session?.user?.id);

        // 성공 시 지도 페이지로 리다이렉트
        router.push("/map");
      } catch (err) {
        console.error("[AuthCallback] 예상치 못한 오류:", err);
        const errorMessage =
          err instanceof Error ? err.message : "알 수 없는 오류";
        setError(errorMessage);
        setTimeout(() => {
          router.push("/map?error=" + encodeURIComponent(errorMessage));
        }, 2000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="h-full flex flex-col items-center justify-center px-4">
      {error ? (
        <>
          <div className="text-red-600 text-center mb-4">
            <p className="font-medium">로그인 실패</p>
            <p className="text-sm mt-2">{error}</p>
          </div>
          <p className="text-gray-500 text-sm">
            잠시 후 지도 페이지로 이동합니다...
          </p>
        </>
      ) : (
        <>
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
          <p className="text-gray-600">로그인 처리 중...</p>
        </>
      )}
    </div>
  );
}
