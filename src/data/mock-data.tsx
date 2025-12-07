import { Destination } from "../components/destination-card";
import { Review } from "../components/review-section";

export const mockDestinations: Destination[] = [
  {
    id: "1",
    name: "Monumen Nasional (Monas)",
    location: "Jakarta Pusat, DKI Jakarta",
    image: "https://images.unsplash.com/photo-1555899434-94d1368d7vd6?q=80&w=1000&auto=format&fit=crop", 
    type: "destination",
    rating: 4.7,
    reviews: 1240,
    likes: 5432,
    description: "Ikon kebanggaan Indonesia yang terletak di pusat kota Jakarta. Nikmati pemandangan kota dari puncak tugu dan pelajari sejarah di museum nasional.",
    tags: ["Sejarah", "Budaya", "Keluarga", "Fotografi"],
    coordinates: { lat: -6.175392, lng: 106.827153 } 
  },
  {
    id: "2",
    name: "Dufan (Dunia Fantasi)",
    location: "Ancol, Jakarta Utara",
    image: "https://images.unsplash.com/photo-1626027871239-2c67e91122a2?q=80&w=1000",
    type: "destination",
    rating: 4.6,
    reviews: 3892,
    likes: 8247,
    price: "Rp 250.000",
    description: "Taman hiburan tematik terbesar di Jakarta dengan berbagai wahana seru yang memacu adrenalin. Cocok untuk liburan keluarga dan teman.",
    tags: ["Hiburan", "Wahana", "Keluarga", "Seru"],
    coordinates: { lat: -6.125312, lng: 106.833543 }
  },
  {
    id: "3",
    name: "Museum Macan",
    location: "Kebon Jeruk, Jakarta Barat",
    image: "https://images.unsplash.com/photo-1545959967-73d706536b33?q=80&w=1000",
    type: "event",
    rating: 4.8,
    reviews: 1567,
    likes: 4890,
    price: "Rp 100.000",
    date: "2025-06-20T10:00:00Z",
    description: "Museum seni modern dan kontemporer yang menampilkan karya seniman lokal dan internasional. Pameran seni rupa yang instagramable.",
    tags: ["Seni", "Museum", "Indoor", "Instagramable"],
    coordinates: { lat: -6.190696, lng: 106.766347 }
  },
  {
    id: "4",
    name: "Candi Borobudur",
    location: "Magelang, Jawa Tengah",
    image: "https://images.unsplash.com/photo-1596402184320-417e7178b2cd?q=80&w=1000",
    type: "destination",
    rating: 4.9,
    reviews: 8456,
    likes: 23456,
    description: "Candi Buddha terbesar di dunia dan Situs Warisan Dunia UNESCO. Saksikan matahari terbit yang magis dari puncak stupa.",
    tags: ["Sejarah", "Budaya", "Alam", "UNESCO"],
    coordinates: { lat: -7.607873, lng: 110.203751 }
  },
  {
    id: "5",
    name: "Pantai Kuta",
    location: "Badung, Bali",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=1000",
    type: "destination",
    rating: 4.5,
    reviews: 9987,
    likes: 14321,
    description: "Pantai paling ikonik di Bali dengan pasir putih dan ombak yang cocok untuk berselancar. Nikmati pemandangan matahari terbenam yang memukau.",
    tags: ["Pantai", "Surfing", "Sunset", "Santai"],
    coordinates: { lat: -8.718463, lng: 115.168637 }
  },
  {
    id: "6",
    name: "Gedung Sate",
    location: "Bandung, Jawa Barat",
    image: "https://images.unsplash.com/photo-1603785669736-2316e3c3b036?q=80&w=1000",
    type: "destination",
    rating: 4.6,
    reviews: 2134,
    likes: 6765,
    description: "Bangunan bersejarah dengan arsitektur ikonik tusuk sate. Pusat pemerintahan provinsi Jawa Barat dan salah satu landmark kota Bandung.",
    tags: ["Sejarah", "Arsitektur", "Kota", "Foto"],
    coordinates: { lat: -6.902481, lng: 107.618810 }
  }
];

export const mockReviews: { [destinationId: string]: Review[] } = {
  "1": [
    {
      id: "r1",
      userName: "Budi Santoso",
      rating: 5,
      comment: "Pemandangan dari puncak Monas sangat indah! Wajib dikunjungi kalau ke Jakarta.",
      date: "2024-03-15T10:30:00Z",
      helpful: 24,
      isHelpful: false
    }
  ]
};

export const availableTags = [
  "Alam", "Sejarah", "Budaya", "Keluarga", "Fotografi", "Hiburan", 
  "Wahana", "Seni", "Museum", "Indoor", "Instagramable", "Pantai", 
  "Surfing", "Sunset", "Santai", "Arsitektur", "Kota"
];

export const availableLocations = [
  "Jakarta Pusat, DKI Jakarta", "Ancol, Jakarta Utara", "Kebon Jeruk, Jakarta Barat",
  "Magelang, Jawa Tengah", "Badung, Bali", "Bandung, Jawa Barat"
];