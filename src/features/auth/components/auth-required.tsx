"use client";

import Image from "next/image";
import { Loader2 } from "lucide-react";
import { useSocialLogin } from "../hooks/use-social-login";
import { cn } from "@/lib/utils";

interface AuthRequiredProps {
  title?: string;
  description?: string;
}

/**
 * 인증이 필요한 경우 표시되는 UI 컴포넌트
 */
export function AuthRequired({
  title = "PinPaw",
  description = "반려동물을 찾으려면 로그인이 필요해요",
}: AuthRequiredProps) {
  const { signInWithKakao, isLoading, error } = useSocialLogin();

  const handleKakaoLogin = async () => {
    try {
      await signInWithKakao();
    } catch (error) {
      console.error("[AuthRequired] 카카오 로그인 실패:", error);
      // 에러는 useSocialLogin에서 처리되므로 여기서는 로그만 남김
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{title}</h1>
        <p className="text-gray-600 text-base">{description}</p>
      </div>

      {/* Login Buttons */}
      <div className="w-full max-w-sm space-y-3">
        {/* 에러 메시지 */}
        {error && (
          <div className="w-full p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-sm text-red-600 text-center">{error.message}</p>
          </div>
        )}

        {/* 카카오 로그인 */}
        {isLoading ? (
          <div className="w-full flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
            <span className="text-gray-600 font-medium text-sm">
              로그인 중...
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleKakaoLogin}
            className={cn(
              "w-full h-12 rounded-lg transition-all overflow-hidden",
              "hover:opacity-90 active:opacity-80",
              "focus:outline-none focus:ring-2 focus:ring-[#FEE500] focus:ring-offset-2"
            )}
          >
            <Image
              src="/images/kakao-login.png"
              alt="카카오 로그인"
              width={300}
              height={48}
              className="w-full h-full object-contain"
              priority
            />
          </button>
        )}
      </div>
    </div>
  );
}
