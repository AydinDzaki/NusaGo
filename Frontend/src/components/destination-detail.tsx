import { ArrowLeft, Heart, Share2, MapPin, Calendar, Users, Star, Tag } from "./icons";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ReviewSection, Review } from "./review-section";
import { Destination } from "./destination-card";
import { MiniMap } from "./mini-map";

interface DestinationDetailProps {
  destination: Destination;
  reviews: Review[];
  onBack: () => void;
  onLike: (id: string) => void;
  onAddReview: (rating: number, comment: string) => void;
  onMarkHelpful: (reviewId: string) => void;
  isLiked: boolean;
}

export function DestinationDetail({
  destination,
  reviews,
  onBack,
  onLike,
  onAddReview,
  onMarkHelpful,
  isLiked
}: DestinationDetailProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="flex-shrink-0">
          <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
          <span className="hidden xs:inline">Kembali</span>
        </Button>
        <h1 className="flex-1 text-lg sm:text-xl lg:text-2xl line-clamp-2">{destination.name}</h1>
        <div className="flex gap-1 sm:gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" className="h-8 sm:h-9">
            <Share2 className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
            <span className="hidden sm:inline">Bagikan</span>
          </Button>
          <Button 
            variant={isLiked ? "default" : "outline"} 
            size="sm"
            className="h-8 sm:h-9"
            onClick={() => onLike(destination.id)}
          >
            <Heart className={`h-3 w-3 sm:h-4 sm:w-4 ${isLiked ? "fill-current" : ""} sm:mr-2`} />
            <span className="hidden sm:inline">{isLiked ? "Disukai" : "Suka"}</span>
          </Button>
        </div>
      </div>

      {/* Hero Image */}
      <Card className="overflow-hidden">
        <div className="relative">
          {/* PERBAIKAN: Ganti ImageWithFallback dengan <img> */}
          <img
            src={destination.image}
            alt={destination.name}
            className="w-full h-48 sm:h-64 md:h-96 object-cover"
          />
          {/* Akhir Perbaikan */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 text-white">
            <Badge 
              variant={destination.type === "event" ? "default" : "secondary"}
              className="mb-2 text-xs"
            >
              {destination.type === "event" ? "Acara" : "Destinasi"}
            </Badge>
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="line-clamp-1">{destination.location}</span>
            </div>
          </div>
          {destination.price && (
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 bg-white text-black px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm">
              {destination.price}
            </div>
          )}
        </div>
      </Card>

      {/* Quick Info */}
      <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <Star className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400 mx-auto mb-1 sm:mb-2" />
            <p className="text-lg sm:text-2xl">{destination.rating}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">{destination.reviews} ulasan</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 mx-auto mb-1 sm:mb-2" />
            <p className="text-lg sm:text-2xl">{destination.likes}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">suka</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            {destination.type === "event" ? (
              <>
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mx-auto mb-1 sm:mb-2" />
                <p className="text-xs sm:text-sm line-clamp-1">{destination.date ? new Date(destination.date).toLocaleDateString('id-ID') : "Akan diumumkan"}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">tanggal acara</p>
              </>
            ) : (
              <>
                <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mx-auto mb-1 sm:mb-2" />
                <p className="text-xs sm:text-sm">Sepanjang Tahun</p>
                <p className="text-xs sm:text-sm text-muted-foreground">tersedia</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Description */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl">Tentang {destination.name}</h2>
          <p className="text-sm sm:text-base">{destination.description}</p>
          
          <Separator />
          
          <div>
            <h3 className="mb-2 sm:mb-3 flex items-center gap-2 text-base sm:text-lg">
              <Tag className="h-4 w-4" />
              Tag
            </h3>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {destination.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs sm:text-sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <h4 className="mb-2 text-sm sm:text-base">Detail Lokasi</h4>
              <div className="space-y-1 text-muted-foreground">
                <p>📍 {destination.location}</p>
                {/* Perbaikan Encoding */}
                <p className="break-all">🌐 {destination.coordinates.lat}, {destination.coordinates.lng}</p>
              </div>
            </div>
            
            {destination.type === "event" && destination.date && (
              <div>
                <h4 className="mb-2 text-sm sm:text-base">Informasi Acara</h4>
                <div className="space-y-1 text-muted-foreground">
                  {/* Perbaikan Encoding */}
                  <p>📅 {new Date(destination.date).toLocaleDateString('id-ID')}</p>
                  <p>⏰ {new Date(destination.date).toLocaleTimeString('id-ID')}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Map Section */}
      <Card>
        <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <h2 className="text-lg sm:text-xl flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Peta Lokasi
          </h2>
          <p className="text-sm text-muted-foreground">
            Temukan {destination.name} di lokasi yang ditampilkan di bawah
          </p>
          <MiniMap 
            destination={destination}
            height="h-64 sm:h-80"
          />
        </CardContent>
      </Card>

      {/* Reviews Section */}
      <ReviewSection
        reviews={reviews}
        onAddReview={onAddReview}
        onMarkHelpful={onMarkHelpful}
        destinationName={destination.name}
      />
    </div>
  );
}