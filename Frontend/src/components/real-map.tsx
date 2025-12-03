import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from './ui/button';
import { Navigation } from './icons';
import L from 'leaflet';

// Gunakan CDN Icon agar tidak error saat build di Vite
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
}

export function RealMap({ destinations, userLocation, onViewDetail }: RealMapProps) {
    // 1. VALIDASI LOKASI USER
    // Pastikan userLocation ada DAN isinya benar-benar angka
    const isUserValid = userLocation && 
                        typeof userLocation.lat === 'number' && 
                        typeof userLocation.lng === 'number';

    // Default ke Monas (Jakarta) kalau user invalid, supaya peta tidak crash
    const centerPosition: [number, number] = isUserValid 
        ? [userLocation!.lat, userLocation!.lng] 
        : [-6.1754, 106.8272]; 

    return (
        <div className="h-[400px] w-full rounded-lg overflow-hidden shadow-lg border relative z-0 isolate">
            <MapContainer 
                // Key unik penting untuk reset map saat lokasi berubah
                key={isUserValid ? `user-${centerPosition[0]}` : 'default-map'}
                center={centerPosition} 
                zoom={13} 
                scrollWheelZoom={false} 
                className="h-full w-full z-0"
            >
                <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Marker User (Hanya render jika valid) */}
                {isUserValid && (
                    <Marker position={centerPosition} icon={defaultIcon}>
                        <Popup><div className="font-bold text-sm">📍 Lokasi Kamu</div></Popup>
                    </Marker>
                )}

                {/* Marker Destinasi (Looping dengan Validasi Ketat) */}
                {Array.isArray(destinations) && destinations.map((dest) => {
                    // Cek berbagai kemungkinan struktur data 
                    // (Handle beda struktur antara Supabase flat vs Mock Data nested)
                    let lat = dest.lat;
                    let lng = dest.lng;

                    // Fallback jika struktur data nested di properti 'coordinates'
                    if (typeof lat !== 'number' && dest.coordinates) {
                        lat = dest.coordinates.lat;
                    }
                    if (typeof lng !== 'number' && dest.coordinates) {
                        lng = dest.coordinates.lng;
                    }

                    // PENGECEKAN FINAL: Jika masih bukan angka, JANGAN RENDER (Return null)
                    // Baris inilah yang mencegah error "Invalid LatLng" penyebab layar putih
                    if (typeof lat !== 'number' || typeof lng !== 'number') {
                        return null; 
                    }

                    return (
                        <Marker 
                            key={dest.id} 
                            position={[lat, lng]}
                            icon={defaultIcon}
                        >
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
                                        <Button 
                                            size="sm" 
                                            className="w-full mt-2 h-7 text-xs"
                                            onClick={() => onViewDetail(dest.id)}
                                        >
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
                    <span>Peta Interaktif</span>
                </div>
            </div>
        </div>
    );
}