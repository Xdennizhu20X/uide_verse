
'use client';

import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';
import L from 'leaflet';
import { useEffect } from 'react';

interface Location {
  id: string;
  name: string;
  position: [number, number];
  description: string;
}

interface MapProps {
  locations: Location[];
  selectedPosition: [number, number] | null;
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, zoom);
    }, [center, zoom, map]);
    return null;
}

export function Map({ locations, selectedPosition }: MapProps) {
  return (
    <MapContainer center={[-4.0076, -79.2019]} zoom={14} scrollWheelZoom={false} className="w-full h-[600px] rounded-l-lg">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((location) => (
        <Marker key={location.id} position={location.position}>
          <Popup>
            <h3 className="font-semibold">{location.name}</h3>
            <p>{location.description}</p>
          </Popup>
        </Marker>
      ))}
      {selectedPosition && <ChangeView center={selectedPosition} zoom={16} />}
    </MapContainer>
  );
}
