"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, MapPin, X, Edit2, Loader2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { LocationSelector } from "./location-selector";
import { useGeolocation } from "@/shared/hooks/use-geolocation";
import { useImageUpload } from "../hooks/use-image-upload";
import { submitSighting } from "../actions/submit-sighting";
import { useToast } from "@/shared/hooks/use-toast";
import { Toast } from "@/shared/components/toast";
import type { MapLocation } from "../../map/store/use-map-store";
import { FEATURE_TAGS, BREED_OPTIONS, COLOR_OPTIONS } from "../constants";
import {
  formatDateForDisplay,
  getCurrentDateTimeLocal,
  getCurrentDate,
  getCurrentTime,
  getDatePart,
  getTimePart,
  combineDateTime,
} from "../utils/date-time";

/**
 * 목격 제보 폼 컴포넌트
 *
 * 주요 기능:
 * - 이미지 업로드 및 압축
 * - 위치 정보 자동 감지 및 수동 선택
 * - 날짜/시간 선택 (날짜: 피커, 시간: 직접 입력)
 * - 품종, 색상, 특징 태그 선택
 * - 상세 설명 입력
 * - Supabase Storage 및 DB 저장
 */
export function SightingForm() {
  // Form state
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [breed, setBreed] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<MapLocation | null>(null);
  const [address, setAddress] = useState<string>("");
  const [isLocationAutoDetected, setIsLocationAutoDetected] = useState(false);
  const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSightedAtAutoSet, setIsSightedAtAutoSet] = useState(true);

  // 제보 시간 (기본값: 현재 시간)
  const [sightedAt, setSightedAt] = useState(() => getCurrentDateTimeLocal());

  // Refs
  const dateInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const { toast, showToast, hideToast } = useToast();
  const {
    previewUrl,
    file: imageFile,
    isCompressing,
    handleImageChange,
    handleRemoveImage,
  } = useImageUpload();
  const {
    location: geolocation,
    isLoading: isGeolocationLoading,
    error: geolocationError,
    getCurrentPosition,
  } = useGeolocation();

  // 자동 위치 가져오기 시도
  useEffect(() => {
    getCurrentPosition({
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000,
    });
  }, [getCurrentPosition]);

  // 자동 위치 가져오기 성공 시
  useEffect(() => {
    if (geolocation) {
      if (!location) {
        setLocation(geolocation);
        setIsLocationAutoDetected(true);
      } else {
        // location이 이미 있지만 geolocation과 같으면 자동 감지로 설정
        const isSameLocation =
          Math.abs(geolocation.lat - location.lat) < 0.0001 &&
          Math.abs(geolocation.lng - location.lng) < 0.0001;
        if (isSameLocation) {
          setIsLocationAutoDetected(true);
        }
      }
    }
  }, [geolocation, location]);

  // 이미지 제거 핸들러
  const handleImageRemoveClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      handleRemoveImage();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleRemoveImage]
  );

  // 이미지 업로드 영역 클릭 핸들러
  const handleImageAreaClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // 태그 토글 핸들러
  const handleTagToggle = useCallback((tagId: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }, []);

  // 위치 선택 핸들러
  const handleLocationSelect = useCallback(
    (selectedLocation: MapLocation, selectedAddress?: string) => {
      setLocation(selectedLocation);
      setIsLocationAutoDetected(false);
      if (selectedAddress) {
        setAddress(selectedAddress);
      }
    },
    []
  );

  // 날짜 피커 열기 핸들러
  const handleDatePickerOpen = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const input = dateInputRef.current;
    if (!input) return;

    if (
      "showPicker" in input &&
      typeof (input as any).showPicker === "function"
    ) {
      try {
        const pickerResult = (input as any).showPicker();
        if (pickerResult && typeof pickerResult.catch === "function") {
          pickerResult.catch(() => {
            input.focus();
            input.click();
          });
        }
      } catch {
        input.focus();
        input.click();
      }
    } else {
      input.focus();
      setTimeout(() => {
        input.click();
      }, 10);
    }
  }, []);

  // 날짜 변경 핸들러
  const handleDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedDate = e.target.value;
      if (!selectedDate) return;

      const currentTime = getTimePart(sightedAt) || getCurrentTime();
      const newDateTime = combineDateTime(selectedDate, currentTime);
      const selectedTime = new Date(newDateTime);
      const now = new Date();

      if (selectedTime > now) {
        const currentDateTime = getCurrentDateTimeLocal();
        setSightedAt(currentDateTime);
        setIsSightedAtAutoSet(true);
        showToast("미래 시간은 선택할 수 없습니다.", "error");
      } else {
        setSightedAt(newDateTime);
        setIsSightedAtAutoSet(false);
      }
    },
    [sightedAt, showToast]
  );

  // 시간 변경 핸들러
  const handleTimeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedTime = e.target.value;
      if (!selectedTime) return;

      const currentDate = getDatePart(sightedAt) || getCurrentDate();
      const newDateTime = combineDateTime(currentDate, selectedTime);
      const selectedDateTime = new Date(newDateTime);
      const now = new Date();

      if (selectedDateTime > now) {
        const currentDateTime = getCurrentDateTimeLocal();
        setSightedAt(currentDateTime);
        setIsSightedAtAutoSet(true);
        showToast("미래 시간은 선택할 수 없습니다.", "error");
      } else {
        setSightedAt(newDateTime);
        setIsSightedAtAutoSet(false);
      }
    },
    [sightedAt, showToast]
  );

  // 폼 초기화
  const resetForm = useCallback(() => {
    handleRemoveImage();
    setSelectedTags(new Set());
    setBreed("");
    setColor("");
    setDescription("");
    setLocation(null);
    setAddress("");
    setIsLocationAutoDetected(false);
    setSightedAt(getCurrentDateTimeLocal());
    setIsSightedAtAutoSet(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [handleRemoveImage]);

  // 제보하기 버튼 핸들러
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!location) {
        showToast("위치를 선택해주세요.", "error");
        return;
      }

      if (!imageFile) {
        showToast("사진을 업로드해주세요.", "error");
        return;
      }

      if (isSubmitting) {
        return;
      }

      setIsSubmitting(true);

      try {
        const features = Array.from(selectedTags);
        const sightedAtISO = new Date(sightedAt).toISOString();

        const result = await submitSighting({
          imageFile,
          latitude: location.lat,
          longitude: location.lng,
          breed: breed || null,
          color: color || null,
          features: features.length > 0 ? features : null,
          description: description || null,
          sightedAt: sightedAtISO,
        });

        if (result.success) {
          showToast("제보되었습니다!", "success");
          resetForm();
        } else {
          showToast(result.error || "제보 제출에 실패했습니다.", "error");
        }
      } catch (error) {
        console.error("[SightingForm] 제출 오류:", error);
        showToast("제보 제출 중 오류가 발생했습니다.", "error");
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      location,
      imageFile,
      selectedTags,
      breed,
      color,
      description,
      sightedAt,
      isSubmitting,
      showToast,
      resetForm,
    ]
  );

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {/* Header */}
        <div className="px-4 pt-6 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">목격 제보</h1>
        </div>

        <div className="px-4 space-y-6 pb-6">
          {/* Section 1: 사진 업로드 */}
          <section>
            <div
              onClick={handleImageAreaClick}
              className={cn(
                "relative w-full rounded-lg overflow-hidden cursor-pointer transition-all",
                "h-[300px] flex items-center justify-center",
                previewUrl || isCompressing
                  ? "bg-gray-200"
                  : "bg-gray-50 border-2 border-dashed border-gray-300 hover:border-blue-400"
              )}
              style={{ minHeight: "300px", maxHeight: "300px" }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={isCompressing}
              />

              {isCompressing ? (
                <div className="flex flex-col items-center justify-center gap-3 py-8">
                  <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                  <span className="text-gray-600 font-medium">
                    이미지 압축 중...
                  </span>
                </div>
              ) : previewUrl ? (
                <>
                  <img
                    src={previewUrl}
                    alt="업로드된 사진"
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                    style={{ maxWidth: "100%", maxHeight: "300px" }}
                  />
                  <button
                    type="button"
                    onClick={handleImageRemoveClick}
                    className="absolute top-2 right-2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors z-10"
                    aria-label="사진 제거"
                  >
                    <X className="w-5 h-5 text-white" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-8">
                  <Camera className="w-12 h-12 text-gray-400" />
                  <span className="text-gray-600 font-medium">
                    사진 촬영/업로드
                  </span>
                </div>
              )}
            </div>
          </section>

          {/* Section 2: 위치 정보 */}
          <section>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              위치 정보
              {isLocationAutoDetected && location && (
                <span className="ml-1 text-xs font-normal text-blue-600">
                  (현재 위치로 자동 설정)
                </span>
              )}
              {!isLocationAutoDetected && location && (
                <span className="ml-1 text-xs font-normal text-gray-500">
                  (수동 선택)
                </span>
              )}
            </label>
            <button
              type="button"
              onClick={() => setIsLocationSelectorOpen(true)}
              className={cn(
                "w-full px-4 py-3 border rounded-lg text-left transition-all min-h-[44px]",
                location
                  ? "border-gray-300 bg-white hover:border-blue-400"
                  : "border-gray-300 bg-gray-50 hover:border-blue-400"
              )}
            >
              <div className="flex items-center gap-2">
                <MapPin
                  className={cn(
                    "w-5 h-5 flex-shrink-0",
                    location ? "text-blue-500" : "text-gray-400"
                  )}
                />
                <div className="flex-1 min-w-0">
                  {isGeolocationLoading && !location ? (
                    <span className="text-sm text-gray-500">
                      현재 위치를 불러오는 중...
                    </span>
                  ) : geolocationError && !location ? (
                    <span className="text-sm text-gray-500">
                      위치를 가져올 수 없습니다. 클릭하여 지정해주세요.
                    </span>
                  ) : isLocationAutoDetected && location ? (
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                          현재 위치
                        </span>
                      </div>
                      {address ? (
                        <span className="text-sm text-gray-900 font-medium truncate">
                          {address}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">
                          {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                        </span>
                      )}
                    </div>
                  ) : address ? (
                    <span className="text-sm text-gray-900 font-medium truncate">
                      {address}
                    </span>
                  ) : location ? (
                    <span className="text-sm text-gray-900">
                      {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-500">
                      위치를 선택해주세요
                    </span>
                  )}
                </div>
                <Edit2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </div>
            </button>
          </section>

          {/* Section 3: 제보 시간 */}
          <section>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              목격 시간
              {isSightedAtAutoSet && (
                <span className="ml-1 text-xs font-normal text-blue-600">
                  (현재 시간으로 자동 설정)
                </span>
              )}
              {!isSightedAtAutoSet && (
                <span className="ml-1 text-xs font-normal text-gray-500">
                  (수동 선택)
                </span>
              )}
            </label>
            <div className="flex gap-2">
              {/* 날짜 선택 (피커) */}
              <button
                type="button"
                onClick={handleDatePickerOpen}
                className={cn(
                  "flex-1 px-4 py-3 border rounded-lg text-left transition-all min-h-[44px]",
                  "border-gray-300 bg-white hover:border-blue-400"
                )}
              >
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 flex-shrink-0 text-blue-500" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-900 font-medium">
                      {formatDateForDisplay(sightedAt)}
                    </span>
                  </div>
                  <Edit2 className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              </button>
              {/* 숨겨진 date input */}
              <input
                ref={dateInputRef}
                type="date"
                id="sightedAtDate"
                value={getDatePart(sightedAt)}
                max={getCurrentDate()}
                onChange={handleDateChange}
                className="sr-only"
                style={{
                  position: "absolute",
                  opacity: 0,
                  pointerEvents: "none",
                  width: 0,
                  height: 0,
                }}
              />

              {/* 시간 입력 (직접 숫자 입력) */}
              <input
                ref={timeInputRef}
                type="time"
                id="sightedAtTime"
                value={getTimePart(sightedAt)}
                onChange={handleTimeChange}
                className={cn(
                  "flex-1 px-4 py-3 border rounded-lg text-left transition-all min-h-[44px]",
                  "border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
                  "text-sm text-gray-900 font-medium"
                )}
              />
            </div>
          </section>

          {/* Section 4: 품종 */}
          <section>
            <label
              htmlFor="breed"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              품종 (선택사항)
            </label>
            <div className="relative">
              <select
                id="breed"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                className="w-full px-4 py-3 pr-10 appearance-none border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white min-h-[44px] transition-all cursor-pointer hover:border-gray-400"
              >
                <option value="" className="text-gray-500">
                  품종을 선택해주세요
                </option>
                {BREED_OPTIONS.map((option) => (
                  <option
                    key={option}
                    value={option}
                    className="text-gray-900 py-2"
                  >
                    {option}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </section>

          {/* Section 5: 색상 */}
          <section>
            <label
              htmlFor="color"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              색상 (선택사항)
            </label>
            <div className="relative">
              <select
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-4 py-3 pr-10 appearance-none border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white min-h-[44px] transition-all cursor-pointer hover:border-gray-400"
              >
                <option value="" className="text-gray-500">
                  색상을 선택해주세요
                </option>
                {COLOR_OPTIONS.map((option) => (
                  <option
                    key={option}
                    value={option}
                    className="text-gray-900 py-2"
                  >
                    {option}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>
          </section>

          {/* Section 6: 특징 태그 */}
          <section>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              특징 (선택사항)
            </label>
            <div className="flex flex-wrap gap-2">
              {FEATURE_TAGS.map((tag) => {
                const isSelected = selectedTags.has(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all min-h-[44px]",
                      isSelected
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    )}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Section 7: 상세 설명 */}
          <section>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              상세 설명 (선택사항)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="추가적인 특징이 있다면 적어주세요"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
            />
          </section>

          {/* Section 8: 제보하기 버튼 */}
          <section className="pt-4 pb-4">
            <button
              type="submit"
              disabled={!location || !imageFile || isSubmitting}
              className="w-full h-14 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>제보 중...</span>
                </>
              ) : (
                "제보하기"
              )}
            </button>
          </section>
        </div>
      </div>

      {/* Location Selector Modal */}
      <LocationSelector
        isOpen={isLocationSelectorOpen}
        onClose={() => setIsLocationSelectorOpen(false)}
        onSelect={handleLocationSelect}
        initialLocation={location || undefined}
      />

      {/* Toast Notification */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </form>
  );
}
