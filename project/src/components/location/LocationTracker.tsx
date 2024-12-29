import { useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface LocationError {
  message: string;
  timestamp: Date;
}

export function LocationTracker() {
  const watchIdRef = useRef<number | null>(null);
  const [error, setError] = useState<LocationError | null>(null);

  useEffect(() => {
    const startTracking = async () => {
      if (!navigator.geolocation) {
        setError({
          message: 'Geolocation is not supported by this browser.',
          timestamp: new Date()
        });
        return;
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          
          try {
            const { error: locationError } = await supabase
              .from('locations')
              .insert({ latitude, longitude, accuracy });

            if (locationError) {
              throw locationError;
            }
          } catch (err) {
            setError({
              message: 'Failed to update location',
              timestamp: new Date()
            });
          }
        },
        (error) => {
          setError({
            message: `Location error: ${error.message}`,
            timestamp: new Date()
          });
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

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-50 text-red-600 p-3 rounded-md shadow-lg">
        {error.message}
      </div>
    );
  }

  return null;
}