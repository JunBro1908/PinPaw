"use client";

import { useEffect } from "react";
import { MapContainer } from "../../features/map/components/map-container";
import { useAuth } from "../../features/auth/hooks/use-auth";
import { AuthRequired } from "../../features/auth/components/auth-required";

export default function MapPage() {
  const { isAuthenticated, isLoading, user } = useAuth();

  // URL 쿼리 파라미터에서 에러 확인 및 정리
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const error = params.get("error");
      if (error) {
        // 에러 파라미터가 있으면 조용히 제거 (이미 AuthCallback에서 처리됨)
        window.history.replaceState({}, "", "/map");
      }
    }
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthRequired />;
  }

  return <MapContainer />;
}
