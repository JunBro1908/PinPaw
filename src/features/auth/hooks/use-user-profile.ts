"use client";

import { useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabase";
import type { Database } from "@/types/supabase";
import { getUserNickname } from "../utils/user-defaults";
import { useAuth } from "./use-auth";

interface UserProfile {
  id: string;
  nickname: string;
  createdAt: string;
}

interface UseUserProfileReturn {
  profile: UserProfile | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * 사용자 프로필을 가져오는 커스텀 훅
 * 닉네임이 없으면 기본값(랜덤 강아지 이름)을 사용
 */
export function useUserProfile(): UseUserProfileReturn {
  const { user, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = async () => {
    if (!isAuthenticated || !user) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();

      // users 테이블에서 프로필 조회
      const { data, error: fetchError } = await (supabase as any)
        .from("users")
        .select("id, nickname, created_at")
        .eq("id", user.id)
        .single();

      if (fetchError) {
        // 프로필이 없으면 생성
        if (fetchError.code === "PGRST116") {
          // 기본 닉네임으로 프로필 생성
          const defaultNickname = getUserNickname(null, user.id);
          const { data: newProfile, error: insertError } = await (
            supabase as any
          )
            .from("users")
            .insert({
              id: user.id,
              nickname: defaultNickname,
            })
            .select("id, nickname, created_at")
            .single();

          if (insertError) {
            throw insertError;
          }

          setProfile({
            id: newProfile.id,
            nickname: getUserNickname(newProfile.nickname, newProfile.id),
            createdAt: newProfile.created_at,
          });
        } else {
          throw fetchError;
        }
      } else {
        setProfile({
          id: data.id,
          nickname: getUserNickname(data.nickname, data.id),
          createdAt: data.created_at,
        });
      }
    } catch (err) {
      const error =
        err instanceof Error
          ? err
          : new Error("프로필을 불러오는데 실패했습니다.");
      setError(error);
      console.error("[useUserProfile] 프로필 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [isAuthenticated, user?.id]);

  return {
    profile,
    isLoading,
    error,
    refetch: fetchProfile,
  };
}
