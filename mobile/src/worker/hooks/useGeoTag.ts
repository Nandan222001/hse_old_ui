import { useCallback, useEffect, useState } from 'react';

export interface GeoTag {
  gps_latitude?: number;
  gps_longitude?: number;
}

/**
 * Auto-captures the GPS fix that incident/near-miss/hazard reports are specced to
 * carry. The app has no native geolocation module installed yet, so this resolves
 * to an empty tag rather than throwing — add `@react-native-community/geolocation`
 * and the reports start carrying coordinates with no change to the callers.
 */
export function useGeoTag(): { geo: GeoTag; refresh: () => void } {
  const [geo, setGeo] = useState<GeoTag>({});

  const refresh = useCallback(() => {
    const provider = (global as any)?.navigator?.geolocation;
    if (!provider?.getCurrentPosition) return;

    provider.getCurrentPosition(
      (pos: any) => {
        setGeo({
          gps_latitude: pos?.coords?.latitude,
          gps_longitude: pos?.coords?.longitude,
        });
      },
      () => setGeo({}),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 },
    );
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { geo, refresh };
}
