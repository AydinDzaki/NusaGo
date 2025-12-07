import { Heart, MapPin, Star, Users, Navigation } from "./icons";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import * as React from "react";

export interface Destination {
  id: string;
  name: string;
  location: string;
  image: string;
  type: "destination" | "event";
  rating: number;
  reviews: number;
  likes: number;
  price?: string;
  date?: string;
  description: string;
  tags: string[];
  coordinates: { lat: number; lng: number };
  island?: string; 
}

interface DestinationCardProps {
  destination: Destination;
  onLike: (id: string) => void;
  onViewDetails: (id: string) => void;
  isLiked: boolean;
  distance?: number;
  featured?: boolean;
}

export function DestinationCard({ destination, onLike, onViewDetails, isLiked, distance, featured = false }: DestinationCardProps) {
  return (
    <Card className={`overflow-hidden hover:shadow-lg transition-shadow duration-200 cursor-pointer active:scale-95 transition-transform h-full`}>
      <div className="relative"> 
        <img
          src={destination.image}
          alt={destination.name}
          className={`w-full object-cover h-40 sm:h-48`} 
        />
        
        <Badge 
          variant={destination.type === "event" ? "default" : "secondary"}
          className="absolute top-2 left-2 text-xs"
        >
          {destination.type === "event" ? "Acara" : "Destinasi"}
        </Badge>

        {/* TAMPILKAN PULAU JIKA ADA */}
        {destination.island && (
           <Badge className="absolute top-2 left-20 text-xs bg-black/50 hover:bg-black/70 backdrop-blur-sm border-none text-white">
             🏝️ {destination.island}
           </Badge>
        )}

        <Button
          variant="ghost"
          size="sm"
          className={`absolute top-2 right-2 bg-white/90 hover:bg-white h-8 w-8 p-0 rounded-full ${ 
            isLiked ? "text-red-500" : "text-gray-600"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            onLike(destination.id);
          }}
        >
          <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
        </Button>

        {distance !== undefined && (
          <Badge 
            variant="outline"
            className="absolute bottom-2 left-2 text-xs bg-white/90 backdrop-blur-sm flex items-center gap-1"
          >
            <Navigation className="h-3 w-3" />
            {distance < 1 
              ? `${(distance * 1000).toFixed(0)}m` 
              : `${distance.toFixed(1)}km`
            }
          </Badge>
        )}
        {featured && (
          <Badge className="absolute bottom-2 right-2 text-xs bg-primary text-primary-foreground">⭐ Terdekat</Badge>
        )}
      </div>
      
      <CardContent className="p-3 sm:p-4 flex flex-col flex-1" onClick={() => onViewDetails(destination.id)}>
        <div className="space-y-2 sm:space-y-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className={`line-clamp-1 flex-1 text-sm sm:text-base`}>{destination.name}</h3>
            {destination.price && (
              <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">{destination.price}</span>
            )}
          </div>
          
          <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="line-clamp-1">{destination.location}</span>
          </div>
          
          <div className="text-xs sm:text-sm text-muted-foreground min-h-[1.25rem]"> 
            {destination.date && (new Date(destination.date).toLocaleDateString())}
          </div>
          
          <p className={`text-xs sm:text-sm text-muted-foreground line-clamp-2`}>{destination.description}</p>
        </div>
        
        <div className="flex items-center justify-between pt-2 mt-auto">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 sm:h-4 sm:w-4 fill-yellow-400 text-yellow-400" />
              <span className="text-xs sm:text-sm">{destination.rating}</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">({destination.reviews})</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <span className="text-xs sm:text-sm">{destination.likes}</span>
            </div>
          </div>
          
          <div className="flex gap-1">
            {destination.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-[10px] sm:text-xs px-1 sm:px-2">{tag}</Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}