import { create } from "zustand";

// naver.maps.Map 타입 사용
type NaverMap = naver.maps.Map;

export interface MapLocation {
  lat: number;
  lng: number;
}

interface MapState {
  mapInstance: NaverMap | null;
  center: MapLocation;
  myLocation: MapLocation | null;
  zoom: number;
  isMapLoaded: boolean;
}

interface MapActions {
  setMapInstance: (map: NaverMap | null) => void;
  setCenter: (location: MapLocation) => void;
  setMyLocation: (location: MapLocation | null) => void;
  setZoom: (zoom: number) => void;
  initializeMap: (map: NaverMap) => void;
}

type MapStore = MapState & MapActions;

const defaultCenter: MapLocation = {
  lat: 37.3595, // 네이버 본사 좌표
  lng: 127.1051,
};

export const useMapStore = create<MapStore>((set, get) => ({
  // State
  mapInstance: null,
  center: defaultCenter,
  myLocation: null,
  zoom: 16,
  isMapLoaded: false,

  // Actions
  setMapInstance: (map) => {
    set({ mapInstance: map, isMapLoaded: map !== null });
  },

  setCenter: (location) => {
    set({ center: location });
    // 지도 인스턴스가 있으면 실제 지도 중심점도 업데이트
    const { mapInstance } = get();
    if (mapInstance) {
      mapInstance.setCenter(new window.naver.maps.LatLng(location.lat, location.lng));
    }
  },

  setMyLocation: (location) => {
    set({ myLocation: location });
  },

  setZoom: (zoom) => {
    set({ zoom });
    // 지도 인스턴스가 있으면 실제 지도 줌도 업데이트
    const { mapInstance } = get();
    if (mapInstance) {
      mapInstance.setZoom(zoom);
    }
  },

  initializeMap: (map) => {
    const { myLocation } = get();
    
    set({
      mapInstance: map,
      isMapLoaded: true,
    });

    // 내 위치가 있으면 그곳으로 중심점 설정
    if (myLocation) {
      const center = new window.naver.maps.LatLng(myLocation.lat, myLocation.lng);
      map.setCenter(center);
      set({ center: myLocation });
    }
  },
}));

