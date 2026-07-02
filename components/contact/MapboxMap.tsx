'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface MapboxMapProps {
  centerLatLon: [number, number];
  zoom: number;
}

export default function MapboxMap({ centerLatLon, zoom }: MapboxMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Set Mapbox access token
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: centerLatLon,
      zoom: zoom
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add marker
    new mapboxgl.Marker({ color: '#FF5722' })
      .setLngLat(centerLatLon)
      .setPopup(
        new mapboxgl.Popup({ offset: 25 }).setHTML(
          '<h3 style="margin:0;font-size:14px;font-weight:bold;">Shanghai Kairong Information Technology Co., Lt</h3><p style="margin:5px 0 0 0;font-size:12px;">601 Yunling Lu, Shanghai, China, 200062</p>'
        )
      )
      .addTo(map.current);

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [centerLatLon, zoom]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-96 phone:h-64"
      style={{ minHeight: '400px' }}
    />
  );
}
