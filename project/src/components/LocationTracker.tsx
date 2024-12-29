import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';

export function LocationTracker() {
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const startTracking = async () => {
      if (!navigator.geolocation) {
        console.error('Geolocation is not supported by this browser.');
        return;
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          
          try {
            await supabase.from('locations').insert({
              latitude,
              longitude,
              accuracy
            });
          } catch (error) {
            console.error('Error sending location:', error);
          }
        },
        (error) => {
          console.error('Error getting location:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    };

    startTracking();

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return null;
}