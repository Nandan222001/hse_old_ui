import { useEffect, useState } from 'react';
import Geolocation from '@react-native-community/geolocation';

type GPSStatus = 'acquiring' | 'ok' | 'unavailable';

export function useGPS() {
  const [gpsLat, setGpsLat] = useState<string | undefined>();
  const [gpsLon, setGpsLon] = useState<string | undefined>();
  const [gpsStatus, setGpsStatus] = useState<GPSStatus>('acquiring');

  useEffect(() => {
    let cancelled = false;
    Geolocation.getCurrentPosition(
      (pos) => {
        if (cancelled) return;
        setGpsLat(String(pos.coords.latitude));
        setGpsLon(String(pos.coords.longitude));
        setGpsStatus('ok');
      },
      () => {
        if (!cancelled) setGpsStatus('unavailable');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
    return () => { cancelled = true; };
  }, []);

  return { gpsLat, gpsLon, gpsStatus };
}
