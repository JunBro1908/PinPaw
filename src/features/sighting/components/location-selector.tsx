"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, MapPin, RefreshCw } from "lucide-react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MapLocation } from "../../map/store/use-map-store";
import { useGeolocation } from "@/shared/hooks/use-geolocation";

interface LocationSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (location: MapLocation, address?: string) => void;
  initialLocation?: MapLocation;
}

export function LocationSelector({
  isOpen,
  onClose,
  onSelect,
  initialLocation,
}: LocationSelectorProps) {
  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(
    initialLocation || null
  );
  const [address, setAddress] = useState<string>("");

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<naver.maps.Map | null>(null);
  const markerRef = useRef<naver.maps.Marker | null>(null);
  const clickListenerRef = useRef<naver.maps.MapEventListener | null>(null);
  const dragendListenerRef = useRef<naver.maps.MapEventListener | null>(null);

  // Geolocation 훅
  const {
    location: geolocation,
    isLoading: isGeolocationLoading,
    getCurrentPosition,
  } = useGeolocation();

  // Geolocation 옵션 (MapContainer와 동일)
  const GEOLOCATION_OPTIONS = {
    enableHighAccuracy: false,
    timeout: 15000,
    maximumAge: 300000,
  };

  // 위치 업데이트 및 주소 조회
  const updateLocation = useCallback((lat: number, lng: number) => {
    setSelectedLocation({ lat, lng });

    if (
      typeof window === "undefined" ||
      !window.naver ||
      !window.naver.maps ||
      !window.naver.maps.Service
    ) {
      return;
    }

    // 좌표를 주소로 변환 (reverse geocoding)
    window.naver.maps.Service.reverseGeocode(
      {
        coords: new window.naver.maps.LatLng(lat, lng),
        orders: [
          window.naver.maps.Service.OrderType.ROAD_ADDR,
          window.naver.maps.Service.OrderType.ADDR,
        ].join(","),
      },
      (status: any, response: any) => {
        if (status === window.naver.maps.Service.Status.OK) {
          const result = response.v2;
          const addr =
            result.results[0]?.roadAddress?.address ||
            result.results[0]?.jibunAddress?.address ||
            "";
          setAddress(addr);
        } else {
          setAddress("");
        }
      }
    );
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    if (
      typeof window === "undefined" ||
      !window.naver ||
      !window.naver.maps ||
      !window.naver.maps.Map
    ) {
      console.warn("[LocationSelector] 네이버 맵 API가 로드되지 않았습니다.");
      return;
    }

    try {
      const initialCenter = initialLocation || {
        lat: 37.5665,
        lng: 126.978,
      };

      const map = new window.naver.maps.Map(mapRef.current, {
        center: new window.naver.maps.LatLng(
          initialCenter.lat,
          initialCenter.lng
        ),
        zoom: 15,
        scaleControl: false,
        logoControl: false,
        mapDataControl: false,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // 마커 생성
      const marker = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(
          initialCenter.lat,
          initialCenter.lng
        ),
        map,
        draggable: true,
      });

      markerRef.current = marker;

      // 초기 위치 설정
      if (initialLocation) {
        setSelectedLocation(initialLocation);
        updateLocation(initialLocation.lat, initialLocation.lng);
      } else {
        setSelectedLocation(initialCenter);
        updateLocation(initialCenter.lat, initialCenter.lng);
      }

      // 지도 클릭 시 마커 이동
      clickListenerRef.current = window.naver.maps.Event.addListener(
        map,
        "click",
        (e: any) => {
          const latlng = e.coord;
          marker.setPosition(latlng);
          updateLocation(latlng.lat(), latlng.lng());
        }
      );

      // 마커 드래그 시 위치 업데이트
      dragendListenerRef.current = window.naver.maps.Event.addListener(
        marker,
        "dragend",
        () => {
          const position = marker.getPosition() as naver.maps.LatLng;
          updateLocation(position.lat(), position.lng());
        }
      );
    } catch (error) {
      console.error("[LocationSelector] 지도 초기화 실패:", error);
      // 에러 발생 시 모달을 닫고 사용자에게 알림
      // (필요시 에러 상태를 추가하여 UI에 표시할 수 있음)
    }

    return () => {
      // 이벤트 리스너 제거 (window.naver.maps가 존재하는지 확인)
      if (typeof window !== "undefined" && window.naver?.maps?.Event) {
        if (clickListenerRef.current) {
          window.naver.maps.Event.removeListener(clickListenerRef.current);
          clickListenerRef.current = null;
        }
        if (dragendListenerRef.current) {
          window.naver.maps.Event.removeListener(dragendListenerRef.current);
          dragendListenerRef.current = null;
        }
      }
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
      mapInstanceRef.current = null;
    };
  }, [isOpen, initialLocation, updateLocation]);

  // 현재 위치로 이동
  const handleMoveToMyLocation = useCallback(() => {
    if (isGeolocationLoading) return;

    getCurrentPosition(GEOLOCATION_OPTIONS);
  }, [isGeolocationLoading, getCurrentPosition]);

  // Geolocation 위치가 업데이트되면 지도와 마커 이동
  useEffect(() => {
    if (
      !geolocation ||
      !mapInstanceRef.current ||
      !markerRef.current ||
      typeof window === "undefined" ||
      !window.naver?.maps
    ) {
      return;
    }

    const latlng = new window.naver.maps.LatLng(
      geolocation.lat,
      geolocation.lng
    );

    // 지도 중심 이동
    mapInstanceRef.current.panTo(latlng);
    mapInstanceRef.current.setZoom(17);

    // 마커 위치 업데이트
    markerRef.current.setPosition(latlng);

    // 위치 및 주소 업데이트
    updateLocation(geolocation.lat, geolocation.lng);
  }, [geolocation, updateLocation]);

  // 위치 선택 완료
  const handleConfirm = useCallback(() => {
    if (selectedLocation) {
      onSelect(selectedLocation, address);
      onClose();
    }
  }, [selectedLocation, address, onSelect, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-[480px] mx-auto bg-white rounded-t-2xl shadow-xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">위치 선택</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="닫기"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <div ref={mapRef} className="w-full h-full" />

          {/* 현재 위치로 이동 버튼 */}
          <button
            onClick={handleMoveToMyLocation}
            disabled={isGeolocationLoading}
            className={`absolute top-4 right-4 w-12 h-12 rounded-full shadow-lg flex items-center justify-center z-50 transition-all ${
              isGeolocationLoading
                ? "bg-blue-50 cursor-wait"
                : "bg-white hover:bg-gray-50"
            }`}
            aria-label="현재 위치로 이동"
          >
            {isGeolocationLoading ? (
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            ) : (
              <RefreshCw className="w-6 h-6 text-blue-600" />
            )}
          </button>
        </div>

        {/* Selected Location Info */}
        {selectedLocation ? (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-start gap-2 mb-3">
              <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                {address ? (
                  <p className="text-sm text-gray-900 font-medium">{address}</p>
                ) : (
                  <p className="text-sm text-gray-500">선택한 주소</p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {selectedLocation.lat.toFixed(6)},{" "}
                  {selectedLocation.lng.toFixed(6)}
                </p>
              </div>
            </div>
            <button
              onClick={handleConfirm}
              className="w-full py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
            >
              이 위치로 선택
            </button>
          </div>
        ) : (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-500 text-center">
              지도를 클릭하여 위치를 선택해주세요
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
