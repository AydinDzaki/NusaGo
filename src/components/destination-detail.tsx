import { ArrowLeft, Heart, Share2, MapPin, Calendar, Users, Star, Tag } from "./icons";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { ReviewSection, Review } from "./review-section";
import { Destination } from "./destination-card";
import { RealMap } from "./real-map"; 

interface DestinationDetailProps {
  destination: Destination;
  reviews: Review[];
  onBack: () => void;
  onLike: (id: string) => void;
  onAddReview: (rating: number, comment: string) => void;
  onMarkHelpful: (reviewId: string) => void;
  isLiked: boolean;
  userLocation?: { lat: number; lng: number } | null;
}

export function DestinationDetail({
  destination,
  reviews,
  onBack,
  onLike,
  onAddReview,
  onMarkHelpful,
  isLiked,
  userLocation
}: DestinationDetailProps) {
  
  // === DEBUGGING Stuff ===
  console.log("=== DEBUG DESTINATION DETAIL ===");
  console.log("Nama Destinasi:", destination.name);
  console.log("Data Koordinat:", destination.coordinates);
  console.log("Data Lokasi User:", userLocation);
  // === DEBUGGING stuff ===

  const hasValidCoordinates = destination.coordinates && 
                              typeof destination.coordinates.lat === 'number' && 
                              typeof destination.coordinates.lng === 'number';

  console.log("Apakah Koordinat Valid?", hasValidCoordinates);

  const handleShare = async () => {
    const shareData = {
      title: `NusaGo - ${destination.name}`,
      text: `Cek destinasi wisata ini: ${destination.name}. ${destination.description.substring(0, 100)}...`,
      url: window.location.origin 
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } 
      else {
        await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
        alert("Link dan info wisata berhasil disalin ke clipboard! 📋");
      }
    } catch (err) {
      console.error("Gagal membagikan:", err);
    }
  };

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
          <Button variant="outline" size="sm" className="h-8 sm:h-9" onClick={handleShare}>
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

      <Card className="overflow-hidden">
        <div className="relative">
          <img
            src={destination.image}
            alt={destination.name}
            className="w-full h-48 sm:h-64 md:h-96 object-cover"
          />
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
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <Star className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400 mx-auto mb-1 sm:mb-2" />
            <p className="text-lg sm:text-2xl">{destination.rating}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">{destination.reviews} ulasan</p>
          </CardContent>
        </Card>
        
<Card>
          <CardContent className="p-3 sm:p-4 text-center">
            <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 fill-current mx-auto mb-1 sm:mb-2" />
            <p className="text-lg sm:text-2xl">{destination.likes}</p>
            <p className="text-xs sm:text-sm text-muted-foreground">suka</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
            {destination.type === "event" ? (
              <>
                <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mx-auto mb-1 sm:mb-2" />
                <p className="text-xs sm:text-sm line-clamp-1">{destination.date ? new Date(destination.date).toLocaleDateString('id-ID') : "TBA"}</p>
                <p className="text-xs sm:text-sm text-muted-foreground">tanggal acara</p>
              </>
            ) : (
              <>
                <MapPin className="h-6 w-6 sm:h-8 sm:w-8 text-green-500 mx-auto mb-1 sm:mb-2" />
                <p className="text-xs sm:text-sm">Buka</p>
                <p className="text-xs sm:text-sm text-muted-foreground">setiap hari</p>
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
            {userLocation 
              ? "Posisi destinasi (Marker Biru) relatif terhadap lokasi Anda (Marker Merah)." 
              : "Menampilkan lokasi destinasi di peta."}
          </p>
          
          {hasValidCoordinates ? (
            <RealMap 
              destinations={[destination]} 
              userLocation={userLocation || null} 
              customCenter={destination.coordinates} 
            />
          ) : (
            <div className="h-[200px] w-full bg-muted/20 rounded-lg flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed">
              <MapPin className="h-8 w-8 mb-2 opacity-50" />
              <p>Maaf, data koordinat peta untuk lokasi ini belum tersedia.</p>
              <p className="text-xs mt-1">(Lat/Lng Kosong atau Invalid)</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reviews */}
      <ReviewSection
        reviews={reviews}
        onAddReview={onAddReview}
        onMarkHelpful={onMarkHelpful}
        destinationName={destination.name}
      />
    </div>
  );
}