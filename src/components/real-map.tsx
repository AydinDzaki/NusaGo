import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from './ui/button';
import { Navigation } from './icons';
import L from 'leaflet';

const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

interface RealMapProps {
    destinations: any[];
    userLocation: { lat: number, lng: number } | null;
    onViewDetail?: (id: string) => void;
    customCenter?: { lat: number; lng: number }; 
}

export function RealMap({ destinations, userLocation, onViewDetail, customCenter }: RealMapProps) {
    // VALIDASI LOKASI USER
    const isUserValid = userLocation && 
                        typeof userLocation.lat === 'number' && 
                        typeof userLocation.lng === 'number';

    // VALIDASI CUSTOM CENTER
    const isCustomCenterValid = customCenter && 
                                typeof customCenter.lat === 'number' && 
                                typeof customCenter.lng === 'number';

    // TENTUKAN PUSAT PETA (CENTER)
    const defaultCenter: [number, number] = [-6.1754, 106.827153];
    
    let centerPosition: [number, number] = defaultCenter;

    if (isCustomCenterValid) {
        centerPosition = [customCenter!.lat, customCenter!.lng];
    } else if (isUserValid) {
        centerPosition = [userLocation!.lat, userLocation!.lng];
    }

    return (
        <div 
            className="w-full rounded-lg overflow-hidden shadow-lg border relative z-0 isolate"
            style={{ height: '400px', minHeight: '400px' }} 
        >
            <MapContainer 
                key={`map-${centerPosition[0]}-${centerPosition[1]}`}
                center={centerPosition} 
                zoom={13} 
                scrollWheelZoom={false} 
                className="h-full w-full z-0"
                style={{ height: '100%', width: '100%' }} // Pastikan container peta memenuhi parent
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {isUserValid && (
                    <Marker position={[userLocation!.lat, userLocation!.lng]} icon={defaultIcon}>
                        <Popup><div className="font-bold text-sm">📍 Lokasi Kamu</div></Popup>
                    </Marker>
                )}

                {Array.isArray(destinations) && destinations.map((dest) => {
                    if (!dest) return null;

                    let lat = dest.lat;
                    let lng = dest.lng;

                    if (dest.coordinates) {
                        if (lat === undefined || lat === null) lat = dest.coordinates.lat;
                        if (lng === undefined || lng === null) lng = dest.coordinates.lng;
                    }

                    if (typeof lat !== 'number' || typeof lng !== 'number') return null; 

                    return (
                        <Marker key={dest.id} position={[lat, lng]} icon={defaultIcon}>
                            <Popup>
                                <div className="min-w-[150px]">
                                    <div className="font-bold text-sm mb-1">{dest.name}</div>
                                    <div className="text-xs text-gray-600 mb-2 capitalize">{dest.type}</div>
                                    {dest.image && (
                                        <img src={dest.image} alt={dest.name} className="w-full h-20 object-cover rounded mb-2" />
                                    )}
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-semibold text-yellow-600">⭐ {dest.rating}</span>
                                        {dest.distance_km && (
                                            <span className="text-xs text-blue-600 font-medium">
                                                {dest.distance_km.toFixed(1)} km
                                            </span>
                                        )}
                                    </div>
                                    {onViewDetail && (
                                        <Button size="sm" className="w-full mt-2 h-7 text-xs" onClick={() => onViewDetail(dest.id)}>
                                            Lihat Detail
                                        </Button>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    );
                })}
            </MapContainer>
            
            <div className="absolute bottom-4 left-4 z-[400] bg-white/90 backdrop-blur px-3 py-2 rounded-lg shadow border text-xs">
                <div className="flex items-center gap-2">
                    <Navigation className="h-3 w-3 text-blue-600" />
                    <span>Peta Lokasi</span>
                </div>
            </div>
        </div>
    );
}