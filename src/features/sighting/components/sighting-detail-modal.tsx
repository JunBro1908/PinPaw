"use client";

import { X, Calendar, MapPin, Tag } from "lucide-react";
import Image from "next/image";
import { useMapStore } from "../../map/store/use-map-store";
import { cn } from "@/lib/utils";
import { FEATURE_TAGS } from "../constants";
import { formatDateTimeForDisplay } from "../utils/date-time";

const NO_INFO_TEXT = "정보 없음";

interface SightingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 목격 제보 상세 정보를 보여주는 모달 컴포넌트
 * 마커 클릭 시 표시됨
 */
export function SightingDetailModal({
  isOpen,
  onClose,
}: SightingDetailModalProps) {
  const { selectedSighting } = useMapStore();

  if (!isOpen || !selectedSighting) {
    return null;
  }

  const features = selectedSighting.features;
  const featureArray = Array.isArray(features) ? features : [];
  const validFeatures = featureArray.filter((tag) =>
    FEATURE_TAGS.some((ft) => ft.value === tag)
  );

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-end",
        "bg-black/50 backdrop-blur-sm",
        "transition-opacity duration-300",
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      )}
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full max-w-[400px] mx-auto max-h-[85vh] bg-white rounded-t-2xl",
          "overflow-y-auto",
          "transform transition-transform duration-300",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold text-gray-900">
            목격 제보 상세
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-4 space-y-5">
          {/* 이미지 */}
          {selectedSighting.image_url && (
            <div className="relative w-full h-[300px] rounded-lg overflow-hidden bg-gray-100">
              <Image
                src={selectedSighting.image_url}
                alt="목격 제보 이미지"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 768px"
              />
            </div>
          )}

          {/* 구분선 */}
          <div className="border-t border-gray-200" />

          {/* 목격 시간 */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 mb-1">
                목격 시간
              </p>
              <p className="text-sm text-gray-900 font-medium">
                {formatDateTimeForDisplay(selectedSighting.sighted_at)}
              </p>
            </div>
          </div>

          {/* 위치 정보 */}
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-500 mb-1">위치</p>
              <p className="text-sm text-gray-600">
                {selectedSighting.latitude.toFixed(4)},{" "}
                {selectedSighting.longitude.toFixed(4)}
              </p>
            </div>
          </div>

          {/* 구분선 */}
          <div className="border-t border-gray-200" />

          {/* 품종 */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">품종</p>
            <p className="text-base text-gray-900 font-semibold">
              {selectedSighting.breed || (
                <span className="text-gray-400 font-normal">{NO_INFO_TEXT}</span>
              )}
            </p>
          </div>

          {/* 색상 */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">색상</p>
            <p className="text-base text-gray-900 font-semibold">
              {selectedSighting.color || (
                <span className="text-gray-400 font-normal">{NO_INFO_TEXT}</span>
              )}
            </p>
          </div>

          {/* 구분선 */}
          <div className="border-t border-gray-200" />

          {/* 특징 태그 */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-5 h-5 text-gray-400" />
              <p className="text-sm font-semibold text-gray-900">특징</p>
            </div>
            {validFeatures.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {validFeatures.map((tag) => {
                  const featureTag = FEATURE_TAGS.find(
                    (ft) => ft.value === tag
                  );
                  return (
                    <span
                      key={tag}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {featureTag?.label || tag}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400">{NO_INFO_TEXT}</p>
            )}
          </div>

          {/* 구분선 */}
          <div className="border-t border-gray-200" />

          {/* 상세 설명 */}
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-3">
              상세 설명
            </p>
            {selectedSighting.description ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedSighting.description}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">{NO_INFO_TEXT}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
