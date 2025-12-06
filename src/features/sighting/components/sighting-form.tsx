"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, MapPin, X, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LocationSelector } from "./location-selector";
import { useGeolocation } from "../../../shared/hooks/use-geolocation";
import type { MapLocation } from "../../map/store/use-map-store";

// 특징 태그 옵션 (JSONB features 필드에 저장될 값들)
const FEATURE_TAGS = [
  { id: "collar", label: "목줄 있음" },
  { id: "clothes", label: "옷 입음" },
  { id: "scared", label: "겁이 많음" },
  { id: "friendly", label: "사람을 반김" },
] as const;

// 품종 옵션 (일반적인 강아지 품종)
const BREED_OPTIONS = [
  "믹스견",
  "골든 리트리버",
  "래브라도 리트리버",
  "비글",
  "불독",
  "치와와",
  "포메라니안",
  "푸들",
  "시츄",
  "요크셔 테리어",
  "허스키",
  "기타",
] as const;

// 색상 옵션
const COLOR_OPTIONS = [
  "갈색",
  "검정",
  "흰색",
  "크림색",
  "회색",
  "황금색",
  "빨강/레드",
  "기타",
] as const;

export function SightingForm() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [breed, setBreed] = useState<string>("");
  const [color, setColor] = useState<string>("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState<MapLocation | null>(null);
  const [address, setAddress] = useState<string>("");
  const [isLocationAutoDetected, setIsLocationAutoDetected] = useState(false);
  const [isLocationSelectorOpen, setIsLocationSelectorOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // location이 없거나 geolocation과 다른 경우에만 업데이트
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

  // 이미지 선택 핸들러
  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setSelectedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    []
  );

  // 이미지 제거 핸들러
  const handleImageRemove = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

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
      setIsLocationAutoDetected(false); // 수동 선택 시 자동 감지 플래그 해제
      if (selectedAddress) {
        setAddress(selectedAddress);
      }
    },
    []
  );

  // 제보하기 버튼 핸들러
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!location) {
        alert("위치를 선택해주세요.");
        return;
      }
      // TODO: API 연동
      // features는 JSONB 형식으로 저장 (선택된 태그들의 배열)
      const features = Array.from(selectedTags);
      console.log("제보 데이터:", {
        image_url: selectedImage, // 실제로는 업로드 후 URL이 들어감
        latitude: location.lat,
        longitude: location.lng,
        breed: breed || null,
        color: color || null,
        features: features.length > 0 ? features : null, // JSONB 형식
        description: description || null,
      });
    },
    [selectedImage, selectedTags, breed, color, description, location]
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
                selectedImage
                  ? "bg-gray-200"
                  : "bg-gray-50 border-2 border-dashed border-gray-300 hover:border-blue-400"
              )}
              style={{ minHeight: "300px", maxHeight: "300px" }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />

              {selectedImage ? (
                <>
                  <img
                    src={selectedImage}
                    alt="업로드된 사진"
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                    style={{ maxWidth: "100%", maxHeight: "300px" }}
                  />
                  <button
                    type="button"
                    onClick={handleImageRemove}
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

          {/* Section 3: 품종 */}
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

          {/* Section 4: 색상 */}
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

          {/* Section 5: 특징 태그 */}
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

          {/* Section 6: 상세 설명 */}
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
        </div>
      </div>

      {/* Footer: 제보하기 버튼 */}
      <div className="px-4 py-4 border-t border-gray-200 bg-white">
        <button
          type="submit"
          disabled={!location}
          className="w-full h-14 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors"
        >
          제보하기
        </button>
      </div>

      {/* Location Selector Modal */}
      <LocationSelector
        isOpen={isLocationSelectorOpen}
        onClose={() => setIsLocationSelectorOpen(false)}
        onSelect={handleLocationSelect}
        initialLocation={location || undefined}
      />
    </form>
  );
}
