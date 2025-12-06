import { useState, useCallback } from "react";

export interface GeolocationPosition {
  lat: number;
  lng: number;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export interface UseGeolocationReturn {
  location: GeolocationPosition | null;
  isLoading: boolean;
  error: string | null;
  getCurrentPosition: (options?: GeolocationOptions) => void;
}

export function useGeolocation(): UseGeolocationReturn {
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentPosition = useCallback(
    (options?: GeolocationOptions) => {
      if (!navigator.geolocation) {
        setError("Geolocation is not supported by this browser.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: options?.enableHighAccuracy ?? true,
        timeout: options?.timeout ?? 10000,
        maximumAge: options?.maximumAge ?? 0,
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });
          setIsLoading(false);
          setError(null);
        },
        (err) => {
          let errorMessage = "Failed to get your location.";

          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage =
                "Location access denied. Please enable location permissions in your browser settings.";
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = "Location information is unavailable.";
              break;
            case err.TIMEOUT:
              errorMessage =
                "Location request timed out. Please try again.";
              break;
            default:
              errorMessage = `An unknown error occurred: ${err.message}`;
          }

          setError(errorMessage);
          setIsLoading(false);
        },
        defaultOptions
      );
    },
    []
  );

  return {
    location,
    isLoading,
    error,
    getCurrentPosition,
  };
}

