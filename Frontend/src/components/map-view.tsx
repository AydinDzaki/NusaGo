import { useState } from "react";
import { MapPin, Navigation, Plus, Minus, Layers, Target, Search, X } from "./icons";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Destination } from "./destination-card";

interface MapViewProps {
  destinations: Destination[];
  selectedDestination?: string;
  onDestinationSelect: (id: string) => void;
}

interface InfoWindow {
  destinationId: string;
  x: number;
  y: number;
}

export function MapView({ destinations, selectedDestination, onDestinationSelect }: MapViewProps) {
  const [zoomLevel, setZoomLevel] = useState(12);
  const [mapType, setMapType] = useState("roadmap");
  const [infoWindow, setInfoWindow] = useState<InfoWindow | null>(null);
  const [mapSearch, setMapSearch] = useState("");

  const handlePinClick = (destination: Destination, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const container = event.currentTarget.closest('.map-container');
    const containerRect = container?.getBoundingClientRect();
    
    if (containerRect) {
      setInfoWindow({
        destinationId: destination.id,
        x: rect.left - containerRect.left + rect.width / 2,
        y: rect.top - containerRect.top - 10
      });
    }
    onDestinationSelect(destination.id);
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 1, 20));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 1, 1));

  const getMapBackground = () => {
    switch (mapType) {
      case "satellite":
        return "bg-gradient-to-br from-emerald-900 via-green-800 to-blue-900";
      case "terrain":
        return "bg-gradient-to-br from-amber-100 via-green-200 to-blue-200";
      case "hybrid":
        return "bg-gradient-to-br from-slate-800 via-green-900 to-blue-900";
      default:
        return "bg-gradient-to-br from-blue-50 via-green-50 to-amber-50";
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Google Maps-style Container */}
      <div className="relative bg-white rounded-lg border shadow-lg overflow-hidden min-h-[400px] sm:min-h-[500px]">
        {/* Map Search Bar */}
        <div className="absolute top-3 left-3 right-3 z-30">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search this area"
              value={mapSearch}
              onChange={(e) => setMapSearch(e.target.value)}
              className="pl-10 bg-white shadow-md border-0 h-10 text-sm"
            />
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute top-3 right-3 z-30 flex flex-col gap-2">
          {/* Map Type Selector */}
          <Select value={mapType} onValueChange={setMapType}>
            <SelectTrigger className="w-32 h-9 bg-white shadow-md border-0 text-xs">
              <Layers className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="roadmap">Roadmap</SelectItem>
              <SelectItem value="satellite">Satellite</SelectItem>
              <SelectItem value="terrain">Terrain</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>

          {/* Zoom Controls */}
          <div className="bg-white shadow-md rounded flex flex-col">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="h-8 w-8 p-0 rounded-none rounded-t hover:bg-gray-100"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <div className="border-t border-gray-200" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="h-8 w-8 p-0 rounded-none rounded-b hover:bg-gray-100"
            >
              <Minus className="h-4 w-4" />
            </Button>
          </div>

          {/* Current Location */}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 bg-white shadow-md hover:bg-gray-100"
          >
            <Target className="h-4 w-4" />
          </Button>
        </div>

        {/* Mock Google Maps Interface */}
        <div className={`map-container relative w-full h-full ${getMapBackground()} overflow-hidden`}>
          {/* Detailed Mock Map */}
          <div className="absolute inset-0">
            {mapType === "roadmap" && (
              <>
                {/* Street Grid System */}
                {/* Major Highways */}
                <div className="absolute top-[20%] left-0 right-0 h-2 bg-orange-400 opacity-80 transform rotate-2"></div>
                <div className="absolute top-[75%] left-0 right-0 h-2 bg-orange-400 opacity-80 transform -rotate-1"></div>
                
                {/* Major Streets */}
                <div className="absolute top-[35%] left-0 right-0 h-1 bg-yellow-300"></div>
                <div className="absolute top-[50%] left-0 right-0 h-1 bg-yellow-300"></div>
                <div className="absolute top-[65%] left-0 right-0 h-1 bg-yellow-300"></div>
                
                {/* Vertical Streets */}
                <div className="absolute left-[15%] top-0 bottom-0 w-1 bg-yellow-300"></div>
                <div className="absolute left-[30%] top-0 bottom-0 w-1 bg-yellow-300"></div>
                <div className="absolute left-[45%] top-0 bottom-0 w-1 bg-yellow-300"></div>
                <div className="absolute left-[60%] top-0 bottom-0 w-1 bg-yellow-300"></div>
                <div className="absolute left-[75%] top-0 bottom-0 w-1 bg-yellow-300"></div>
                <div className="absolute left-[85%] top-0 bottom-0 w-1 bg-yellow-300"></div>
                
                {/* Neighborhoods & Areas */}
                <div className="absolute top-[5%] left-[5%] w-24 h-20 bg-green-300 opacity-60 rounded-md">
                  <div className="text-xs p-1 text-green-800 font-medium">Central Park</div>
                </div>
                
                <div className="absolute top-[10%] right-[10%] w-20 h-16 bg-blue-200 opacity-70 rounded">
                  <div className="text-xs p-1 text-blue-800">Harbor View</div>
                </div>
                
                <div className="absolute bottom-[15%] left-[20%] w-32 h-24 bg-purple-200 opacity-50 rounded-lg">
                  <div className="text-xs p-1 text-purple-800">Arts District</div>
                </div>
                
                <div className="absolute top-[40%] right-[5%] w-28 h-20 bg-orange-200 opacity-60 rounded">
                  <div className="text-xs p-1 text-orange-800">Shopping Center</div>
                </div>
                
                {/* River/Water Feature */}
                <div className="absolute bottom-[5%] left-0 right-0 h-8 bg-blue-400 opacity-70 transform -rotate-3">
                  <div className="text-xs p-1 text-blue-900">Riverside</div>
                </div>
                
                {/* Building Blocks */}
                <div className="absolute top-[25%] left-[35%] w-3 h-3 bg-gray-400 rounded-sm"></div>
                <div className="absolute top-[28%] left-[38%] w-2 h-2 bg-gray-400 rounded-sm"></div>
                <div className="absolute top-[55%] left-[65%] w-4 h-4 bg-gray-500 rounded-sm"></div>
                <div className="absolute top-[70%] left-[40%] w-3 h-3 bg-gray-400 rounded-sm"></div>
                
                {/* Street Labels */}
                <div className="absolute top-[33%] left-[2%] text-xs text-gray-700 font-medium transform -rotate-90">
                  Main St
                </div>
                <div className="absolute top-[48%] left-[2%] text-xs text-gray-700 font-medium transform -rotate-90">
                  Oak Ave
                </div>
                <div className="absolute top-[18%] left-[16%] text-xs text-gray-700 font-medium">
                  Broadway
                </div>
              </>
            )}
            
            {mapType === "satellite" && (
              <>
                {/* Satellite View Elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-green-800 to-blue-900">
                  {/* Forest areas */}
                  <div className="absolute top-[10%] left-[10%] w-32 h-24 bg-green-900 opacity-80 rounded-lg"></div>
                  <div className="absolute bottom-[20%] right-[15%] w-28 h-20 bg-green-800 opacity-70 rounded"></div>
                  
                  {/* Urban areas */}
                  <div className="absolute top-[30%] left-[40%] w-24 h-32 bg-gray-800 opacity-60 rounded-sm"></div>
                  <div className="absolute top-[50%] right-[30%] w-20 h-20 bg-gray-700 opacity-70 rounded-sm"></div>
                  
                  {/* Water bodies */}
                  <div className="absolute bottom-[10%] left-[20%] w-40 h-12 bg-blue-900 opacity-90 rounded-full"></div>
                </div>
              </>
            )}
            
            {mapType === "terrain" && (
              <>
                {/* Terrain View Elements */}
                <div className="absolute inset-0">
                  {/* Mountain ranges */}
                  <div className="absolute top-[15%] left-[10%] w-48 h-16 bg-amber-600 opacity-70 rounded-full transform rotate-12"></div>
                  <div className="absolute top-[20%] left-[15%] w-40 h-12 bg-amber-700 opacity-80 rounded-full transform rotate-12"></div>
                  
                  {/* Valleys */}
                  <div className="absolute top-[40%] left-[30%] w-32 h-24 bg-green-400 opacity-60 rounded-lg"></div>
                  
                  {/* Rivers */}
                  <div className="absolute top-[60%] left-0 right-0 h-3 bg-blue-500 opacity-80 transform rotate-6"></div>
                  
                  {/* Forest coverage */}
                  <div className="absolute bottom-[25%] right-[20%] w-36 h-28 bg-green-500 opacity-50 rounded-lg"></div>
                </div>
              </>
            )}
            
            {mapType === "hybrid" && (
              <>
                {/* Hybrid View - Combination of satellite and road overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-green-900 to-blue-900">
                  {/* Satellite base with road overlay */}
                  <div className="absolute top-[30%] left-0 right-0 h-1 bg-yellow-400 opacity-80"></div>
                  <div className="absolute top-[60%] left-0 right-0 h-1 bg-yellow-400 opacity-80"></div>
                  <div className="absolute left-[40%] top-0 bottom-0 w-1 bg-yellow-400 opacity-80"></div>
                  
                  {/* Labeled areas on satellite */}
                  <div className="absolute top-[20%] left-[20%] w-24 h-16 bg-green-800 opacity-70 rounded">
                    <div className="text-xs p-1 text-white">Park</div>
                  </div>
                  <div className="absolute bottom-[30%] right-[25%] w-20 h-20 bg-gray-800 opacity-80 rounded-sm">
                    <div className="text-xs p-1 text-white">Downtown</div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Landmarks and POIs */}
          <div className="absolute inset-0 z-10">
            {/* Airports */}
            <div className="absolute top-[15%] right-[20%] flex items-center">
              <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
              <span className="text-xs ml-1 text-gray-700">✈️</span>
            </div>
            
            {/* Train Stations */}
            <div className="absolute top-[45%] left-[25%] flex items-center">
              <div className="w-2 h-2 bg-blue-600 rounded-sm"></div>
              <span className="text-xs ml-1 text-gray-700">🚉</span>
            </div>
            
            {/* Hospitals */}
            <div className="absolute top-[35%] right-[40%] flex items-center">
              <div className="w-2 h-2 bg-red-600 rounded-full"></div>
              <span className="text-xs ml-1 text-gray-700">🏥</span>
            </div>
            
            {/* Schools */}
            <div className="absolute bottom-[40%] left-[35%] flex items-center">
              <div className="w-2 h-2 bg-orange-600 rounded-sm"></div>
              <span className="text-xs ml-1 text-gray-700">🏫</span>
            </div>
            
            {/* Gas Stations */}
            <div className="absolute top-[60%] left-[15%] w-1 h-1 bg-green-600 rounded-full"></div>
            <div className="absolute bottom-[30%] right-[35%] w-1 h-1 bg-green-600 rounded-full"></div>
            
            {/* Shopping Centers */}
            <div className="absolute top-[25%] left-[50%] w-2 h-2 bg-purple-600 rounded-sm"></div>
          </div>

          {/* Google-style Map Pins */}
          {destinations.map((destination, index) => {
            // More realistic positioning based on map areas
            const positions = [
              { x: 120, y: 80 },   // Central Park area
              { x: 200, y: 150 },  // Arts District
              { x: 80, y: 180 },   // Near river
              { x: 280, y: 100 },  // Harbor View
              { x: 160, y: 120 },  // Downtown
              { x: 240, y: 200 },  // Shopping Center
              { x: 320, y: 140 },  // Residential
              { x: 60, y: 100 }    // Park area
            ];
            
            const position = positions[index] || { x: 150, y: 150 };
            
            return (
              <button
                key={destination.id}
                className="absolute transform -translate-x-1/2 -translate-y-full z-20 hover:z-25 transition-all duration-200 hover:scale-110"
                style={{ left: `${position.x}px`, top: `${position.y}px` }}
                onClick={(e) => handlePinClick(destination, e)}
              >
                {/* Google Maps style pin */}
                <div className={`relative ${
                  destination.type === "event" ? "text-red-500" : "text-blue-500"
                }`}>
                  <svg width="24" height="32" viewBox="0 0 24 32" className="drop-shadow-lg">
                    <path
                      d="M12 0C7.6 0 4 3.6 4 8c0 5.4 8 16 8 16s8-10.6 8-16c0-4.4-3.6-8-8-8z"
                      fill="currentColor"
                    />
                    <circle cx="12" cy="8" r="3" fill="white" />
                  </svg>
                  {/* Pin inner icon */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
                    {destination.type === "event" ? (
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    ) : (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Info Window */}
          {infoWindow && (() => {
            const destination = destinations.find(d => d.id === infoWindow.destinationId);
            if (!destination) return null;

            return (
              <div
                className="absolute z-30 transform -translate-x-1/2"
                style={{ left: `${infoWindow.x}px`, top: `${infoWindow.y}px` }}
              >
                <div className="bg-white rounded-lg shadow-lg border p-3 max-w-xs relative">
                  {/* Info window arrow */}
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                  
                  <button
                    onClick={() => setInfoWindow(null)}
                    className="absolute top-1 right-1 p-1 hover:bg-gray-100 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2 pr-6">
                      <h4 className="text-sm font-medium line-clamp-2">{destination.name}</h4>
                    </div>
                    
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">{destination.location}</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="text-yellow-500">★</span>
                        <span>{destination.rating}</span>
                      </div>
                      <span className="text-muted-foreground">({destination.reviews} reviews)</span>
                    </div>
                    
                    <Button 
                      size="sm" 
                      className="w-full h-7 text-xs"
                      onClick={() => {
                        onDestinationSelect("");
                        setInfoWindow(null);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Map Scale */}
        <div className="absolute bottom-16 left-4 bg-white bg-opacity-90 p-2 rounded shadow-md">
          <div className="flex items-center gap-2 text-xs">
            <div className="border-b-2 border-l-2 border-gray-600 w-8 h-2"></div>
            <span className="text-gray-600">500m</span>
          </div>
        </div>

        {/* Compass */}
        <div className="absolute top-16 right-3 bg-white rounded-full p-2 shadow-md w-12 h-12 flex items-center justify-center">
          <div className="relative">
            <div className="text-red-500 text-xl transform rotate-0">N</div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-xs text-gray-600">
              ↑
            </div>
          </div>
        </div>

        {/* Google Maps Attribution */}
        <div className="absolute bottom-0 left-0 right-0 bg-white bg-opacity-90 text-xs text-gray-600 p-2 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span>© 2025 NusaGo Maps</span>
            <span>Implementasi Simulasi</span>
            <div className="flex items-center gap-1">
              <span>📡</span>
              <span className="hidden sm:inline">Imagery ©2024 Google</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span>Zoom: {zoomLevel}</span>
            <span className="hidden sm:inline">|</span>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              Terms
            </Button>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              Report
            </Button>
          </div>
        </div>
      </div>

      {/* Selected destination info card (mobile-friendly) */}
      {selectedDestination && !infoWindow && (
        <Card>
          <CardContent className="p-3 sm:p-4">
            {(() => {
              const destination = destinations.find(d => d.id === selectedDestination);
              if (!destination) return null;
              
              return (
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm sm:text-base line-clamp-2 flex-1">{destination.name}</h4>
                    <Badge 
                      variant={destination.type === "event" ? "default" : "secondary"}
                      className="text-xs flex-shrink-0"
                    >
                      {destination.type}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="line-clamp-1">{destination.location}</span>
                  </p>
                  <p className="text-xs sm:text-sm line-clamp-3">{destination.description}</p>
                  <Button 
                    size="sm" 
                    onClick={() => onDestinationSelect("")}
                    className="w-full h-8 sm:h-9 text-xs sm:text-sm"
                  >
                    View Full Details
                  </Button>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}