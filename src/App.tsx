import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase"; 

// Import Icons
import { MapPin, Search, Heart, Home, LogOut, User, Navigation, Target, Settings, ChevronDown, LogIn, UserPlus } from "./components/icons";

import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { DestinationCard, Destination } from "./components/destination-card";
import { SearchFilter } from "./components/search-filter";
import { DestinationDetail } from "./components/destination-detail";
import { Auth } from "./components/auth";
import { ForgotPassword } from "./components/forgot-password";
import { Settings as SettingsPage } from "./components/settings";
import { availableTags } from "./data/mock-data"; 
import { Review } from "./components/review-section";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";

// HAPUS AvatarImage, gunakan komponen dasar saja untuk keamanan
import { Avatar, AvatarFallback } from "./components/ui/avatar";

type View = "home" | "destination-detail" | "favorites" | "login" | "signup" | "forgot-password" | "settings";

// 1. UPDATE INTERFACE
interface UserData {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null; // Tambahkan ini
}

const availableIslands = [
  "Sumatera",
  "Jawa",
  "Kalimantan",
  "Sulawesi",
  "Bali & Nusa Tenggara",
  "Maluku & Papua"
];

export default function App() {
  const [currentView, setCurrentView] = useState<View>("home");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserData | null>(null);
  
  const [allDestinations, setAllDestinations] = useState<Destination[]>([]);
  const [nearbyDestinations, setNearbyDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>("");
  const [likedDestinations, setLikedDestinations] = useState<Set<string>>(new Set());
  const [reviews, setReviews] = useState<{ [key: string]: Review[] }>({});
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedIsland, setSelectedIsland] = useState("all"); 
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // 2. AUTH LISTENER (DENGAN FETCH AVATAR)
  useEffect(() => {
    const getProfile = async (session: any) => {
      if (!session?.user) return null;
      // Ambil data lengkap termasuk avatar dari tabel profiles
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
        
      return {
        id: session.user.id,
        name: data?.name || session.user.user_metadata.name || "Pengguna",
        email: session.user.email || "",
        avatar_url: data?.avatar_url || null // Simpan URL avatar
      };
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const userData = await getProfile(session);
        if (userData) {
          setIsAuthenticated(true);
          setCurrentUser(userData);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const userData = await getProfile(session);
        if (userData) {
            setIsAuthenticated(true);
            setCurrentUser(userData);
        }
        if (currentView === "login" || currentView === "signup") {
          setCurrentView("home");
        }
      } else {
        setIsAuthenticated(false);
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [currentView]); // Kita kembalikan dependency ini karena kode lama Anda jalan dengan ini

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentView("home");
    setSelectedDestinationId("");
    setLikedDestinations(new Set()); 
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    try {
      const { error } = await supabase.rpc('delete_own_account');
      if (error) throw error;
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setCurrentUser(null);
      setLikedDestinations(new Set());
      setCurrentView("home");
      alert("Akun Anda telah berhasil dihapus secara permanen.");
      window.location.reload(); 
    } catch (error: any) {
      console.error("Gagal hapus akun:", error);
      alert("Gagal menghapus akun: " + error.message);
    }
  };

  // 3. FETCH DATA (LOGIKA LAMA YANG AMAN)
  useEffect(() => {
    const fetchDestinations = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('destinations').select('*').order('name');
        if (error) throw error;
        if (data && data.length > 0) {
          const formattedData: Destination[] = data.map(item => ({
            id: item.id,
            name: item.name,
            location: item.location || "Unknown",
            image: item.image_url,
            type: item.type as "destination" | "event",
            rating: item.rating || 0,
            reviews: item.reviews_count || 0,
            likes: item.likes_count || 0,
            price: item.price,
            date: item.event_date,
            description: item.description,
            tags: item.tags || [],
            coordinates: { lat: item.lat, lng: item.lng },
            island: item.island
          }));
          setAllDestinations(formattedData);
        } else {
          setAllDestinations([]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDestinations();

    const subscription = supabase
      .channel('public:destinations')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'destinations' }, (payload) => {
        const newData = payload.new;
        setAllDestinations((prev) => prev.map((dest) => {
          if (dest.id === newData.id) {
            return {
              ...dest,
              likes: newData.likes_count,
              reviews: newData.reviews_count,
              rating: newData.rating
            };
          }
          return dest;
        }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const fetchLikes = async () => {
      const { data, error } = await supabase.from('likes').select('destination_id').eq('user_id', currentUser.id);
      if (!error && data) {
        setLikedDestinations(new Set(data.map((item: any) => item.destination_id)));
      }
    };
    fetchLikes();
  }, [currentUser]);

  // 4. FETCH REVIEWS (FIXED: Foreign Key Explisit)
  const fetchAllReviews = async (destId: string) => {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
            id, rating, comment, created_at, helpful:helpful_count, 
            profiles!reviews_user_id_fkey ( name )
        `) // <--- PERBAIKAN PENTING DISINI
        .eq('destination_id', destId)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        const formattedReviews: Review[] = data.map((item: any) => ({
          id: item.id, 
          userName: item.profiles?.name || "Pengguna", 
          rating: item.rating, 
          comment: item.comment, 
          date: item.created_at, 
          helpful: item.helpful, 
          isHelpful: false
        }));
        setReviews(prev => ({ ...prev, [destId]: formattedReviews }));
        return formattedReviews;
      } else {
          console.error("ERROR FETCH REVIEWS:", error);
          setReviews(prev => ({ ...prev, [destId]: [] }));
          return [];
      }
  };

  useEffect(() => {
    if (selectedDestinationId) fetchAllReviews(selectedDestinationId);
  }, [selectedDestinationId]); 

  useEffect(() => {
    const calculateNearby = (lat: number, lng: number) => {
      if (allDestinations.length === 0) return;
      const nearby = allDestinations
        .map(dest => {
          const R = 6371; 
          const dLat = (dest.coordinates.lat - lat) * Math.PI / 180;
          const dLon = (dest.coordinates.lng - lng) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat * Math.PI / 180) * Math.cos(dest.coordinates.lat * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return { ...dest, distance: R * c }; 
        })
        .sort((a, b) => a.distance - b.distance) 
        .slice(0, 6); 
      setNearbyDestinations(nearby);
    };

    let watchId: number;
    if (isAuthenticated && "geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          calculateNearby(latitude, longitude);
        },
        (error) => { console.log(error); },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [isAuthenticated, allDestinations]); 

  const filteredDestinations = allDestinations.filter((destination) => {
    const matchesSearch = destination.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         destination.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || destination.type === selectedType;
    const matchesIsland = selectedIsland === "all" || 
                         (destination.island && destination.island.toLowerCase() === selectedIsland.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.some(tag => destination.tags.includes(tag));
    return matchesSearch && matchesType && matchesIsland && matchesTags;
  });

  const isSearching = searchTerm !== "" || selectedType !== "all" || 
                     selectedIsland !== "all" || selectedTags.length > 0;

  const handleLike = async (destinationId: string) => {
    if (!currentUser) { alert("Silakan login untuk menyimpan favorit!"); setCurrentView("login"); return; }
    
    const isLiked = likedDestinations.has(destinationId);
    const newLiked = new Set(likedDestinations);
    if (isLiked) newLiked.delete(destinationId); else newLiked.add(destinationId);
    setLikedDestinations(newLiked);

    setAllDestinations(prev => prev.map(d => {
        if (d.id === destinationId) return { ...d, likes: isLiked ? Math.max(0, d.likes - 1) : d.likes + 1 }
        return d;
    }));

    try {
      if (isLiked) { 
        await supabase.from('likes').delete().eq('user_id', currentUser.id).eq('destination_id', destinationId);
        await supabase.rpc('decrement_likes', { row_id: destinationId });
      } else { 
        await supabase.from('likes').insert({ user_id: currentUser.id, destination_id: destinationId });
        await supabase.rpc('increment_likes', { row_id: destinationId });
      }
    } catch (error) { 
      console.error("Gagal update like:", error); 
      setLikedDestinations(likedDestinations); 
    }
  };

  const handleViewDetails = (id: string) => { setSelectedDestinationId(id); setCurrentView("destination-detail"); };

  const handleAddReview = async (rating: number, comment: string) => {
    if (!currentUser) { alert("Silakan login untuk memberi ulasan!"); return; }
    
    const tempId = `temp-${Date.now()}`;
    const newReview: Review = { 
        id: tempId, userName: currentUser.name, rating, comment, date: new Date().toISOString(), helpful: 0, isHelpful: false 
    };

    setReviews(prev => ({ ...prev, [selectedDestinationId]: [newReview, ...(prev[selectedDestinationId] || [])] }));

    setAllDestinations(prev => prev.map(d => {
        if (d.id === selectedDestinationId) {
            const oldTotal = d.rating * d.reviews;
            const newCount = d.reviews + 1;
            const newAvg = (oldTotal + rating) / newCount;
            return { ...d, reviews: newCount, rating: parseFloat(newAvg.toFixed(1)) }
        }
        return d;
    }));

    try {
      const { error } = await supabase.from('reviews').insert({ 
          user_id: currentUser.id, destination_id: selectedDestinationId, rating, comment 
      }).select().single();
      
      if (error) throw error;
      
      await fetchAllReviews(selectedDestinationId);
      await supabase.rpc('update_destination_rating', { dest_id: selectedDestinationId, new_rating: rating });

    } catch (error) { 
      console.error("Gagal kirim review:", error); 
      alert("Gagal mengirim ulasan.");
      setReviews(prev => ({
          ...prev,
          [selectedDestinationId]: (prev[selectedDestinationId] || []).filter(r => r.id !== tempId)
      }));
    }
  };

  const handleMarkHelpful = (id: string) => { };
  const handleBackToHome = () => { setCurrentView("home"); setSelectedDestinationId(""); };
  const handleFavoritesClick = () => { setCurrentView("favorites"); };
  const selectedDestination = allDestinations.find(d => d.id === selectedDestinationId);

  if (currentView === "forgot-password") return <ForgotPassword onBack={() => setCurrentView("login")} onResetPassword={() => {}} />;
  if (currentView === "login" || currentView === "signup") return <Auth initialMode={currentView} onLogin={() => {}} onSignup={() => {}} onForgotPassword={() => setCurrentView("forgot-password")} onBack={() => setCurrentView("home")} />;
  
  if (currentView === "destination-detail" && selectedDestination) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <DestinationDetail 
            destination={selectedDestination} 
            reviews={reviews[selectedDestinationId] || []} 
            onBack={handleBackToHome} 
            onLike={handleLike} 
            onAddReview={handleAddReview} 
            onMarkHelpful={handleMarkHelpful} 
            isLiked={likedDestinations.has(selectedDestinationId)} 
            userLocation={userLocation}
            currentUserId={currentUser?.id}
          />
        </div>
      </div>
    );
  }

  // 5. SETTINGS: HANDLE AVATAR UPDATE
  if (currentView === "settings") return isAuthenticated ? <SettingsPage 
      onBack={handleBackToHome} 
      user={currentUser!} 
      onUpdateProfile={async (name, email) => {
          setCurrentUser(prev => prev ? { ...prev, name, email } : null);
          return true;
      }} 
      onDeleteAccount={handleDeleteAccount} 
      onUpdatePreferences={async () => true}
      // CALLBACK PENTING: Update state App.tsx saat foto diupload di settings
      onAvatarUpdate={(newUrl) => {
        setCurrentUser(prev => prev ? { ...prev, avatar_url: newUrl } : null);
      }} 
  /> : null;
  
  if (currentView === "favorites") {
    const favoriteDestinations = allDestinations.filter(d => likedDestinations.has(d.id));
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-50">
            <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center">
                <div className="flex items-center gap-2" onClick={handleBackToHome}><MapPin className="h-5 w-5 text-primary" /><h1 className="text-xl">NusaGo</h1><Badge variant="secondary" className="text-xs">Beta</Badge></div><Button variant="ghost" size="sm" onClick={handleBackToHome}><Home className="h-4 w-4 mr-2"/>Beranda</Button></div></header>
        <main className="container mx-auto px-3 sm:px-4 py-6">
          <h2 className="text-2xl flex items-center gap-2 mb-6"><Heart className="h-8 w-8 text-red-500 fill-current" /> Favorit Anda</h2>
          {favoriteDestinations.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{favoriteDestinations.map(dest => <DestinationCard key={dest.id} destination={dest} onLike={handleLike} onViewDetails={handleViewDetails} isLiked={true} />)}</div> : <div className="text-center py-12 text-muted-foreground">Belum ada tempat favorit.</div>}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleBackToHome}><MapPin className="h-5 w-5 text-primary" /><h1 className="text-xl font-bold">NusaGo</h1><Badge variant="secondary" className="text-xs">Beta</Badge></div>
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                    {isAuthenticated ? (
                        <>
                            {/* 6. RENDER AVATAR (SAFE MODE) */}
                            <Avatar className="h-7 w-7 overflow-hidden">
                                {currentUser?.avatar_url ? (
                                    <img 
                                        src={currentUser.avatar_url} 
                                        alt="Profile" 
                                        className="h-full w-full object-cover" 
                                    />
                                ) : (
                                    <AvatarFallback>{currentUser?.name?.charAt(0) || "U"}</AvatarFallback>
                                )}
                            </Avatar>
                            <span className="hidden sm:inline text-sm">{currentUser?.name}</span>
                            <ChevronDown className="h-4 w-4" />
                        </>
                    ) : (
                        <><User className="h-5 w-5" /><span className="hidden sm:inline">Akun</span><ChevronDown className="h-4 w-4" /></>
                    )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {isAuthenticated ? (
                    <>
                        <DropdownMenuLabel>{currentUser?.name}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleFavoritesClick}><Heart className="mr-2 h-4 w-4" />Favorit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setCurrentView("settings")}><Settings className="mr-2 h-4 w-4" />Setelan</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-600"><LogOut className="mr-2 h-4 w-4" />Keluar</DropdownMenuItem>
                    </>
                ) : (
                    <>
                        <DropdownMenuItem onClick={() => setCurrentView("login")}><LogIn className="mr-2 h-4 w-4" />Sign In</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setCurrentView("signup")}><UserPlus className="mr-2 h-4 w-4" />Sign Up</DropdownMenuItem>
                    </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 py-6 space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div><p className="text-muted-foreground">Memuat data wisata...</p></div>
        ) : (
          <>
            {!isSearching && isAuthenticated && (
              <div className="space-y-4">
                <div className="flex justify-between items-center"><h2 className="text-xl font-semibold flex gap-2"><Target className="text-primary" /> Rekomendasi Sekitarmu</h2><Badge variant="outline"><Navigation className="h-3 w-3 mr-1" /> Terdekat</Badge></div>
                {nearbyDestinations.length > 0 ? <div className="overflow-x-auto pb-4 -mx-3 px-3 scrollbar-hide"><div className="flex gap-4">{nearbyDestinations.map(dest => <div key={dest.id} className="w-[280px] flex-shrink-0"><DestinationCard destination={dest} onLike={handleLike} onViewDetails={handleViewDetails} isLiked={likedDestinations.has(dest.id)} distance={dest.distance} featured={true} /></div>)}</div></div> : <div className="text-center py-4 bg-muted/20 rounded-lg"><p className="text-sm text-muted-foreground">Belum ada destinasi di database yang dekat dengan lokasimu.</p></div>}
              </div>
            )}

            {!isAuthenticated && !isSearching && (
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 rounded-lg p-8 text-center space-y-4">
                <div className="flex justify-center"><div className="bg-primary/10 p-3 rounded-full"><Target className="h-8 w-8 text-primary" /></div></div><h3 className="text-xl font-semibold">Lihat Peta Wisata di Sekitarmu!</h3><p className="text-sm text-muted-foreground max-w-md mx-auto">Login sekarang untuk mengaktifkan GPS.</p><div className="flex justify-center gap-2"><Button onClick={() => setCurrentView("login")}>Sign In</Button><Button variant="outline" onClick={() => setCurrentView("signup")}>Sign Up</Button></div>
              </div>
            )}

            <SearchFilter 
              searchTerm={searchTerm} 
              onSearchChange={setSearchTerm} 
              selectedType={selectedType} 
              onTypeChange={setSelectedType} 
              selectedLocation={selectedIsland} 
              onLocationChange={setSelectedIsland} 
              selectedTags={selectedTags} 
              availableTags={availableTags} 
              availableLocations={availableIslands} 
            />
            
            <div>
              <div className="flex items-center justify-between mb-4"><h3 className="text-xl font-semibold">{isSearching ? "Hasil Pencarian" : "Jelajahi Semua"}</h3><span className="text-sm text-muted-foreground">{filteredDestinations.length} destinasi</span></div>
              {filteredDestinations.length > 0 ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{filteredDestinations.map(dest => <div key={dest.id} className="h-full"><DestinationCard destination={dest} onLike={handleLike} onViewDetails={handleViewDetails} isLiked={likedDestinations.has(dest.id)} featured={false} /></div>)}</div> : <div className="text-center py-12"><Search className="h-12 w-12 text-muted-foreground mx-auto mb-2" /><p className="text-muted-foreground">Tidak ada destinasi yang cocok.</p></div>}
            </div>
          </>
        )}
      </main>
      <footer className="border-t bg-muted/50 mt-8 py-8"><div className="container mx-auto px-4 text-center text-sm text-muted-foreground"><p>© 2025 NusaGo. Dibuat dengan ❤️ untuk wisatawan Indonesia.</p></div></footer>
    </div>
  );
}