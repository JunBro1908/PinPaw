"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, Crosshair, MapPin } from "lucide-react";
import { useMapStore } from "../store/use-map-store";
import { useGeolocation } from "../../../shared/hooks/use-geolocation";
import { LocationSettingModal } from "./location-setting-modal";
import type { MapLocation } from "../store/use-map-store";

// Constants
const NAVER_HQ: MapLocation = {
  lat: 37.356697,
  lng: 127.104838,
};

const MAP_CONFIG = {
  defaultZoom: 16,
  minDistanceForMove: 50, // meters
  initDelay: 500, // ms
  geolocationTimeout: 15000, // ms
  naverMapsCheckInterval: 100, // ms
} as const;

const GEOLOCATION_OPTIONS = {
  enableHighAccuracy: false,
  timeout: MAP_CONFIG.geolocationTimeout,
  maximumAge: 0,
} as const;

export function MapContainer() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const markerRef = useRef<naver.maps.Marker | null>(null);
  const isMapInitialized = useRef(false);
  const dragendListenerRef = useRef<naver.maps.MapEventListener | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const {
    mapInstance,
    center,
    myLocation,
    setMapInstance,
    setCenter,
    setMyLocation,
  } = useMapStore();

  const {
    location,
    isLoading: isGeolocationLoading,
    error: geolocationError,
    getCurrentPosition,
  } = useGeolocation();

  // Helper: Create marker icon HTML
  const createMarkerIcon = useCallback(() => {
    return `
      <div style="position: relative;">
        <div style="width: 20px; height: 20px; background: #3B82F6; border: 3px solid white; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>
        <div style="position: absolute; top: -10px; left: -10px; width: 40px; height: 40px; background: #3B82F6; opacity: 0.2; border-radius: 50%; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      </div>
      <style>
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      </style>
    `;
  }, []);

  // Helper: Update or create marker
  const updateMarker = useCallback(
    (map: naver.maps.Map, position: naver.maps.LatLng) => {
      if (markerRef.current) {
        markerRef.current.setPosition(position);
      } else {
        markerRef.current = new window.naver.maps.Marker({
          position,
          map,
          icon: {
            content: createMarkerIcon(),
            anchor: new window.naver.maps.Point(10, 10),
          },
        });
      }
    },
    [createMarkerIcon]
  );

  const moveMapToLocation = useCallback(
    (map: naver.maps.Map, targetLatLng: naver.maps.LatLng) => {
      const currentCenter = map.getCenter();
      const distance = map
        .getProjection()
        .getDistance(currentCenter, targetLatLng);

      if (distance > MAP_CONFIG.minDistanceForMove) {
        map.morph(targetLatLng, MAP_CONFIG.defaultZoom);
      }
    },
    []
  );

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) {
      return;
    }

    // 스토어에서 최신 상태 확인
    const currentMapInstance = useMapStore.getState().mapInstance;

    // mapInstance가 있고 DOM에도 지도가 렌더링되어 있으면 재생성하지 않음
    if (currentMapInstance && mapRef.current.children.length > 0) {
      return;
    }

    // mapInstance가 null이지만 DOM에 지도가 남아있으면 정리 (zombie DOM)
    if (currentMapInstance === null && mapRef.current.children.length > 0) {
      while (mapRef.current.firstChild) {
        mapRef.current.removeChild(mapRef.current.firstChild);
      }
    }

    // mapInstance가 null이 아니면 재생성하지 않음
    if (currentMapInstance !== null) {
      return;
    }

    // 이미 초기화 중이면 재생성하지 않음
    if (isMapInitialized.current) {
      return;
    }

    let timeoutId: NodeJS.Timeout | null = null;
    let isMounted = true;

    const initMap = () => {
      if (!isMounted || !mapRef.current) {
        return;
      }

      // 스토어에서 최신 mapInstance 상태 확인
      const latestMapInstance = useMapStore.getState().mapInstance;
      if (latestMapInstance !== null) {
        return;
      }

      if (
        typeof window === "undefined" ||
        !window.naver ||
        !window.naver.maps
      ) {
        timeoutId = setTimeout(initMap, MAP_CONFIG.naverMapsCheckInterval);
        return;
      }

      // 다시 한번 체크 (비동기 실행 중 상태 변경 가능)
      const finalMapInstance = useMapStore.getState().mapInstance;
      if (
        isMapInitialized.current ||
        mapRef.current.children.length > 0 ||
        finalMapInstance !== null
      ) {
        return;
      }

      isMapInitialized.current = true;

      const initialCenter = myLocation || center || NAVER_HQ;
      const map = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(
          initialCenter.lat,
          initialCenter.lng
        ),
        zoom: MAP_CONFIG.defaultZoom,
        scaleControl: false,
        logoControl: false,
        mapDataControl: false,
        zoomControl: false,
      });

      mapInstanceRef.current = map;
      setMapInstance(map);

      // dragend 이벤트 리스너는 한 번만 등록되도록 ref로 관리
      dragendListenerRef.current = window.naver.maps.Event.addListener(
        map,
        "dragend",
        () => {
          const mapCenter = map.getCenter() as naver.maps.LatLng;
          const newCenter = {
            lat: mapCenter.lat(),
            lng: mapCenter.lng(),
          };
          // 현재 center와 다를 때만 업데이트
          const currentCenter = useMapStore.getState().center;
          if (
            currentCenter.lat !== newCenter.lat ||
            currentCenter.lng !== newCenter.lng
          ) {
            setCenter(newCenter);
          }
        }
      );
    };

    initMap();

    // Cleanup: 컴포넌트 언마운트 시 지도 인스턴스 정리
    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // ⭐️ 핵심: DOM도 완전히 정리해야 함
      if (mapRef.current) {
        // DOM의 모든 자식 요소 제거
        while (mapRef.current.firstChild) {
          mapRef.current.removeChild(mapRef.current.firstChild);
        }
      }

      // dragend 리스너 제거
      if (dragendListenerRef.current) {
        window.naver.maps.Event.removeListener(dragendListenerRef.current);
        dragendListenerRef.current = null;
      }

      // 스토어에서 mapInstance 제거
      setMapInstance(null);
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
      isMapInitialized.current = false;

      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 의존성 배열을 비워서 마운트 시 한 번만 실행

  // Request location on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      getCurrentPosition(GEOLOCATION_OPTIONS);
    }, MAP_CONFIG.initDelay);

    return () => clearTimeout(timer);
  }, [getCurrentPosition]);

  // Handle location updates (success or failure)
  useEffect(() => {
    if (!mapInstance || !window.naver || !window.naver.maps) return;

    let targetLocation: MapLocation | null = null;
    let shouldUpdateMyLocation = false;

    if (location) {
      // Success: use actual location
      targetLocation = location;
      shouldUpdateMyLocation = true;
      setIsFallbackMode(false);
    } else if (geolocationError) {
      // Failure: fallback to default location (don't update myLocation)
      targetLocation = NAVER_HQ;
      shouldUpdateMyLocation = false;
      setIsFallbackMode(true);
      // 위치 권한 거부 시 모달 표시
      if (
        geolocationError.includes("denied") ||
        geolocationError.includes("권한")
      ) {
        setShowLocationModal(true);
      }
    }

    if (!targetLocation) return;

    const targetLatLng = new window.naver.maps.LatLng(
      targetLocation.lat,
      targetLocation.lng
    );

    moveMapToLocation(mapInstance, targetLatLng);
    updateMarker(mapInstance, targetLatLng);
    
    // setCenter와 setMyLocation은 ref를 통해 최신 상태 확인 후 업데이트
    const currentCenter = useMapStore.getState().center;
    const currentMyLocation = useMapStore.getState().myLocation;
    
    // center가 다를 때만 업데이트
    if (
      currentCenter.lat !== targetLocation.lat ||
      currentCenter.lng !== targetLocation.lng
    ) {
      setCenter(targetLocation);
    }

    // myLocation이 다를 때만 업데이트
    if (shouldUpdateMyLocation) {
      if (
        !currentMyLocation ||
        currentMyLocation.lat !== targetLocation.lat ||
        currentMyLocation.lng !== targetLocation.lng
      ) {
        setMyLocation(targetLocation);
      }
    }
  }, [location, geolocationError, mapInstance, moveMapToLocation, updateMarker]);

  // Handle location button click
  const handleMoveToMyLocation = useCallback(() => {
    // Retry if in fallback mode
    if (isFallbackMode) {
      getCurrentPosition(GEOLOCATION_OPTIONS);
      return;
    }

    // Move to known location if available
    if (myLocation && mapInstance && window.naver && window.naver.maps) {
      const latLng = new window.naver.maps.LatLng(
        myLocation.lat,
        myLocation.lng
      );
      mapInstance.morph(latLng, MAP_CONFIG.defaultZoom);
      setCenter(myLocation);
      return;
    }

    // Request location if unknown
    getCurrentPosition({
      ...GEOLOCATION_OPTIONS,
      enableHighAccuracy: true,
    });
  }, [isFallbackMode, myLocation, mapInstance, setCenter, getCurrentPosition]);

  const isMapLoading = !mapInstance;
  const buttonIconColor =
    !isFallbackMode && myLocation ? "text-blue-600" : "text-gray-500";

  return (
    <div className="relative w-full h-[100dvh]">
      <div ref={mapRef} className="w-full h-full" />

      {isMapLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-50">
          <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
        </div>
      )}

      {!isMapLoading && (
        <button
          onClick={handleMoveToMyLocation}
          disabled={isGeolocationLoading}
          className={`absolute bottom-20 right-4 w-12 h-12 rounded-full shadow-lg flex items-center justify-center z-50 transition-all ${
            isGeolocationLoading
              ? "bg-blue-50 cursor-wait"
              : "bg-white hover:bg-gray-50"
          }`}
          aria-label={
            isFallbackMode
              ? "위치 재시도"
              : myLocation
              ? "내 위치로 이동"
              : "위치 찾기"
          }
        >
          {isGeolocationLoading ? (
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          ) : (
            <Crosshair className={`w-6 h-6 ${buttonIconColor}`} />
          )}
        </button>
      )}

      <div className="absolute top-4 left-0 right-0 flex flex-col items-center gap-2 z-40 pointer-events-none">
        {isGeolocationLoading && (
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-md text-sm text-gray-700 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>위치 확인 중...</span>
          </div>
        )}

        {isFallbackMode && !isGeolocationLoading && (
          <div className="pointer-events-auto bg-gray-50 border border-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm shadow-md animate-in fade-in slide-in-from-top-2 text-center">
            <p className="font-medium flex items-center justify-center gap-1">
              <MapPin className="w-4 h-4 text-gray-500" />
              위치 정보를 가져올 수 없습니다.
            </p>
            <p className="text-xs mt-1 opacity-80">
              초기 위치를 <strong>네이버 본사</strong>로 설정했습니다.
              <br />
              우측 하단 버튼을 눌러 다시 시도해보세요.
            </p>
          </div>
        )}
      </div>

      {/* Location Setting Modal */}
      <LocationSettingModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        onRetry={() => {
          setShowLocationModal(false);
          getCurrentPosition(GEOLOCATION_OPTIONS);
        }}
      />
    </div>
  );
}
