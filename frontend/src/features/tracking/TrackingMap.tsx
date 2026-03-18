'use client';

import { useEffect, useRef } from 'react';
import type { DriverLocation } from '@/types';

interface TrackingMapProps {
  driverLocation?: DriverLocation;
  deliveryAddress: string;
}

export function TrackingMap({ driverLocation, deliveryAddress }: TrackingMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // TODO: Initialize map (OpenStreetMap with Leaflet)
    // import L from 'leaflet';
    
    // if (!mapRef.current) return;
    
    // const map = L.map(mapRef.current).setView([51.505, -0.09], 13);
    
    // L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //   attribution: '© OpenStreetMap contributors'
    // }).addTo(map);
    
    // if (driverLocation) {
    //   L.marker([driverLocation.lat, driverLocation.lng]).addTo(map);
    // }
    
    // return () => {
    //   map.remove();
    // };
  }, [driverLocation]);

  return (
    <div className="relative w-full h-96 bg-gray-200 rounded-lg overflow-hidden">
      <div ref={mapRef} className="absolute inset-0" />
      
      {/* Placeholder until map is implemented */}
      <div className="absolute inset-0 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <p className="text-4xl mb-2">🗺️</p>
          <p className="font-medium">Map View</p>
          <p className="text-sm">Tracking: {deliveryAddress}</p>
          {driverLocation && (
            <p className="text-sm mt-2">
              Driver at: {driverLocation.lat.toFixed(4)}, {driverLocation.lng.toFixed(4)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
