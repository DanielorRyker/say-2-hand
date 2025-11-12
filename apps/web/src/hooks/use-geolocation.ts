import { useState, useEffect } from "react";
import { getUserLocation } from "@/lib/geolocation";

interface UserLocation {
  lat: number;
  lng: number;
}

/**
 * Hook để lấy vị trí người dùng
 * @returns {userLocation, isLoading, error}
 */
export function useUserLocation() {
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getUserLocation()
      .then((location) => {
        if (location) {
          setUserLocation(location);
        } else {
          setError("Không thể lấy vị trí người dùng");
        }
      })
      .catch((err) => {
        setError(err.message || "Lỗi khi lấy vị trí");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return { userLocation, isLoading, error };
}
