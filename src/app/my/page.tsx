"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  LogOut,
  FileText,
  Search,
  CheckCircle,
  Calendar,
} from "lucide-react";
import { useAuth } from "../../features/auth/hooks/use-auth";
import { useUserProfile } from "../../features/auth/hooks/use-user-profile";
import { useUserStats } from "../../features/user/hooks/use-user-stats";
import { useLogout } from "../../features/auth/hooks/use-logout";
import { AuthRequired } from "../../features/auth/components/auth-required";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 날짜를 포맷팅하는 헬퍼 함수
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}.${month}.${day}`;
}

export default function MyPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const { profile, isLoading: isProfileLoading } = useUserProfile();
  const { data: stats, isLoading: isStatsLoading } = useUserStats();
  const { logout } = useLogout();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    if (!confirm("정말 로그아웃 하시겠습니까?")) {
      return;
    }

    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("[MyPage] 로그아웃 실패:", error);
      alert("로그아웃에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthRequired description="마이페이지를 보려면 로그인이 필요합니다" />
    );
  }

  const isLoading = isProfileLoading || isStatsLoading;

  return (
    <div className="h-full overflow-y-auto pb-20">
      <div className="max-w-[480px] mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">마이페이지</h1>
        </div>

        {/* User Info Section */}
        <div className="bg-white px-4 py-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <User className="w-8 h-8 text-blue-600" />
            </div>

            {/* User Details */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="space-y-2">
                  <div className="h-5 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                </div>
              ) : (
                <>
                  <h2 className="text-lg font-semibold text-gray-900 truncate">
                    {profile?.nickname || "사용자"}
                  </h2>
                  {profile?.createdAt && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="text-sm text-gray-500">
                        가입일: {formatDate(profile.createdAt)}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white px-4 py-6 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-4">
            내 활동
          </h3>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-gray-200 rounded-lg animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {/* 전체 실종 신고 */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    실종 신고
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.lostPostsCount || 0}
                </p>
              </div>

              {/* 찾는 중 */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    찾는 중
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-900">
                  {stats?.searchingCount || 0}
                </p>
              </div>

              {/* 찾음 */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-700">
                    찾음
                  </span>
                </div>
                <p className="text-2xl font-bold text-green-900">
                  {stats?.foundCount || 0}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Actions Section */}
        <div className="bg-white px-4 py-6">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-3",
              "bg-white border border-gray-300 rounded-lg",
              "text-gray-700 font-medium",
              "hover:bg-gray-50 active:bg-gray-100",
              "transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>로그아웃 중...</span>
              </>
            ) : (
              <>
                <LogOut className="w-5 h-5" />
                <span>로그아웃</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
