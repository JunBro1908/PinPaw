"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSightings } from "../hooks/use-sightings";
import { useMapStore } from "../store/use-map-store";
import type { SightingListItem } from "../hooks/use-sightings";

const MARKER_SIZE = 48;
const MARKER_HEIGHT = 64;
const IMAGE_SIZE = 40;
const IMAGE_OFFSET = 4;
const NAVER_GREEN = "#03C75A";

/**
 * 지도에 sightings 마커를 렌더링하는 컴포넌트
 * 데이터가 변경될 때만 마커를 새로 그리고, 기존 마커는 정리
 */
export function MapMarkers() {
  const { mapInstance } = useMapStore();
  const { data: sightings, isLoading } = useSightings();
  const markersRef = useRef<naver.maps.Marker[]>([]);

  // 기존 마커 정리
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current = [];
  }, []);

  // 마커 아이콘 생성 (핀 모양에 강아지 이미지)
  const createMarkerIcon = useCallback((imageUrl: string): naver.maps.HtmlIcon => {
    return {
      content: `
        <div style="position: relative; width: 0; height: 0;">
          <svg width="${MARKER_SIZE}" height="${MARKER_HEIGHT}" viewBox="0 0 ${MARKER_SIZE} ${MARKER_HEIGHT}" style="position: absolute; top: 0; left: 0; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
            <path d="M24 0C10.745 0 0 10.745 0 24c0 12 24 40 24 40s24-28 24-40C48 10.745 37.255 0 24 0z" fill="${NAVER_GREEN}"/>
            <path d="M24 0C10.745 0 0 10.745 0 24c0 12 24 40 24 40s24-28 24-40C48 10.745 37.255 0 24 0z" fill="none" stroke="#fff" stroke-width="2"/>
          </svg>
          <div style="
            position: absolute;
            top: ${IMAGE_OFFSET}px;
            left: ${IMAGE_OFFSET}px;
            width: ${IMAGE_SIZE}px;
            height: ${IMAGE_SIZE}px;
            border-radius: 50%;
            overflow: hidden;
            border: 3px solid white;
            background: #f3f4f6;
            box-sizing: border-box;
          ">
            <img 
              src="${imageUrl}" 
              alt="목격 제보"
              style="width: 100%; height: 100%; object-fit: cover;"
              onerror="this.style.display='none'; this.parentElement.style.background='${NAVER_GREEN}';"
            />
          </div>
        </div>
      `,
      anchor: new window.naver.maps.Point(MARKER_SIZE / 2, MARKER_HEIGHT),
    };
  }, []);

  // 마커 렌더링
  useEffect(() => {
    if (!mapInstance || !window.naver?.maps) {
      return;
    }

    // 로딩 중이거나 데이터가 없으면 기존 마커만 정리
    if (isLoading || !sightings?.length) {
      clearMarkers();
      return;
    }

    // 기존 마커 정리
    clearMarkers();

    // 새 마커 생성
    sightings.forEach((sighting: SightingListItem) => {
      const position = new window.naver.maps.LatLng(
        sighting.latitude,
        sighting.longitude
      );

      const marker = new window.naver.maps.Marker({
        position,
        map: mapInstance,
        icon: createMarkerIcon(sighting.image_url),
        title: sighting.breed || "목격 제보",
      });

      // 마커 클릭 이벤트
      window.naver.maps.Event.addListener(marker, "click", () => {
        useMapStore.getState().setSelectedSighting(sighting);
      });

      markersRef.current.push(marker);
    });

    // Cleanup: 컴포넌트 언마운트 시 마커 정리
    return clearMarkers;
  }, [mapInstance, sightings, isLoading, clearMarkers, createMarkerIcon]);

  return null;
}
