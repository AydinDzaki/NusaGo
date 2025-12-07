import { useState } from "react";
import { MapPin, Navigation } from "./icons";
import { Button } from "./ui/button";
import { Destination } from "./destination-card";

interface MiniMapProps {
  destination: Destination;
  onViewFullMap?: () => void;
  height?: string;
}

export function MiniMap({ destination, onViewFullMap, height = "h-32" }: MiniMapProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getPinPosition = () => {
    const lat = destination.coordinates.lat;
    const lng = destination.coordinates.lng;
    
    const x = ((lng + 180) / 360) * 100;
    const y = ((90 - lat) / 180) * 100;
    
    const constrainedX = Math.max(10, Math.min(90, x));
    const constrainedY = Math.max(15, Math.min(85, y));
    
    return { x: constrainedX, y: constrainedY };
  };

  const pinPosition = getPinPosition();

  return (
    <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
      {/* Mini Map Container */}
      <div 
        className={`relative ${height} w-full ${onViewFullMap ? 'cursor-pointer' : ''} transition-all duration-200 ${
          isHovered && onViewFullMap ? "bg-gradient-to-br from-blue-100 to-green-100" : "bg-gradient-to-br from-blue-50 to-green-50"
        }`}
        onMouseEnter={() => onViewFullMap && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onViewFullMap}
      >
        {/* Map Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full">
            <defs>
              <pattern id={`grid-${destination.id}`} width="24" height="24" patternUnits="userSpaceOnUse">
                <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#9ca3af" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#grid-${destination.id})`} />
          </svg>
        </div>

        {/* Map Features */}
        <div className="absolute inset-0">
          {/* Main roads */}
          <div className="absolute top-1/3 left-0 right-0 h-0.5 bg-gray-400 opacity-60"></div>
          <div className="absolute top-2/3 left-0 right-0 h-0.5 bg-gray-400 opacity-60"></div>
          <div className="absolute left-1/4 top-0 bottom-0 w-0.5 bg-gray-400 opacity-60"></div>
          <div className="absolute left-3/4 top-0 bottom-0 w-0.5 bg-gray-400 opacity-60"></div>
          
          {/* Curved road */}
          <svg className="absolute inset-0 w-full h-full">
            <path 
              d="M 10 20 Q 50 10 90 30" 
              fill="none" 
              stroke="#9ca3af" 
              strokeWidth="1" 
              opacity="0.5"
            />
          </svg>

          {/* Geographic features */}
          <div className="absolute top-1 left-1 w-12 h-8 bg-green-300 opacity-40 rounded-sm"></div>
          <div className="absolute bottom-1 right-1 w-16 h-6 bg-blue-300 opacity-40 rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-yellow-200 opacity-50 rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
        </div>

        {/* Destination Pin */}
        <div
          className={`absolute transform -translate-x-1/2 -translate-y-full transition-all duration-200 ${
            isHovered && onViewFullMap ? "scale-110" : "scale-100"
          }`}
          style={{ 
            left: `${pinPosition.x}%`, 
            top: `${pinPosition.y}%`,
            zIndex: 10
          }}
        >
          <div className={`relative ${
            destination.type === "event" ? "text-red-500" : "text-blue-600"
          }`}>
            <svg width="18" height="22" viewBox="0 0 24 32" className="drop-shadow-md">
              <path
                d="M12 0C7.6 0 4 3.6 4 8c0 5.4 8 16 8 16s8-10.6 8-16c0-4.4-3.6-8-8-8z"
                fill="currentColor"
              />
              <circle cx="12" cy="8" r="3" fill="white" />
            </svg>
            {/* Pulse animation for the pin */}
            <div className={`absolute top-1 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full ${
              destination.type === "event" ? "bg-red-500" : "bg-blue-600"
            } opacity-20 animate-ping`}></div>
          </div>
        </div>

        {/* Hover overlay */}
        {isHovered && onViewFullMap && (
          <div className="absolute inset-0 bg-blue-600 bg-opacity-5 flex items-center justify-center">
            <div className="bg-white bg-opacity-95 rounded-md px-3 py-1.5 text-xs text-gray-700 shadow-md font-medium">
              <Navigation className="h-3 w-3 inline mr-1" />
              Lihat peta lengkap
            </div>
          </div>
        )}

        {/* Map type indicator */}
        <div className="absolute top-1 left-1 text-xs text-gray-600 bg-white bg-opacity-90 px-1.5 py-0.5 rounded shadow-sm">
          Peta
        </div>

        {/* Scale indicator */}
        <div className="absolute bottom-1 right-1 flex items-center gap-1 text-xs text-gray-600 bg-white bg-opacity-90 px-1.5 py-0.5 rounded shadow-sm">
          <div className="w-4 h-0.5 bg-gray-600"></div>
          <span>1km</span>
        </div>
      </div>

      {/* View Full Map Button */}
      {onViewFullMap && (
        <div className="p-2.5 bg-white border-t border-gray-200">
          <Button
            variant="outline"
            size="sm"
            className="w-full h-8 text-xs font-medium hover:bg-blue-50 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onViewFullMap?.();
            }}
          >
            <Navigation className="h-3 w-3 mr-1.5" />
            Lihat Peta Lengkap
          </Button>
        </div>
      )}
    </div>
  );
}