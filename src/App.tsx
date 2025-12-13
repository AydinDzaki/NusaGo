import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase"; 
import type { UserRole } from "./lib/supabase";

// Import Icons
import { 
  MapPin, 
  Search, 
  Heart, 
  Home, 
  LogOut, 
  User, 
  Navigation, 
  Target, 
  Settings, 
  ChevronDown, 
  LogIn, 
  UserPlus,
  Shield,
  Briefcase
} from "./components/icons";

import { Button } from "./components/ui/button";
import { Badge } from "./components/ui/badge";
import { DestinationCard, Destination } from "./components/destination-card";
import { SearchFilter } from "./components/search-filter";
import { DestinationDetail } from "./components/destination-detail";
import { Auth } from "./components/auth";
import { ForgotPassword } from "./components/forgot-password";
import { Settings as SettingsPage } from "./components/settings";
import { AdminDashboard } from "./components/admin-dashboard";
import { EODashboard } from "./components/eo-dashboard";
import { availableTags } from "./data/mock-data"; 
import { Review } from "./components/review-section";
import { toast } from "sonner";
import { Toaster } from "./components/ui/sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";

type View = "home" | "destination-detail" | "favorites" | "login" | "signup" | "forgot-password" | "settings" | "admin-dashboard" | "eo-dashboard";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar_url?: string | null;
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
  
  const [allDestinations, setAllDestinations] = useState<any[]>([]);
  const [nearbyDestinations, setNearbyDestinations] = useState<Destination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>("");
  const [likedDestinations, setLikedDestinations] = useState<Set<string>>(new Set());
  const [reviews, setReviews] = useState<{ [key: string]: Review[] }>({});
  
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // State Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedIsland, setSelectedIsland] = useState("all"); 
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // --- LOGIKA TAG TOGGLE ---
  const handleTagToggle = (tag: string) => {
    setSelectedTags((prevTags) => {
      if (prevTags.includes(tag)) {
        return prevTags.filter((t) => t !== tag);
      } else {
        return [...prevTags, tag];
      }
    });
  };

  // 1. AUTH LISTENER WITH ROLE CHECK
  // 1. AUTH LISTENER (Perbaikan Nama Tabel)
useEffect(() => {
  const initAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      // GANTI DARI 'profiles' KE 'user_profiles'
      const { data: profile, error } = await supabase
        .from('user_profiles') // <--- PERUBAHAN DI SINI
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error || !profile) {
        console.warn("Sesi ditemukan tapi profil rusak/hilang. Melakukan Logout otomatis.....");
        await supabase.auth.signOut();
        setIsAuthenticated(false);
        setCurrentUser(null);
        return;
      }
      if (profile) {
        setIsAuthenticated(true);
        setCurrentUser({
          id: profile.id,
          name: profile.name || "Pengguna",
          email: profile.email,
          role: profile.role as UserRole,
          avatar_url: profile.avatar_url
        });
      }
    }
  };

  initAuth();

  const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
    if (session) {
      // GANTI DARI 'profiles' KE 'user_profiles'
      const { data: profile } = await supabase
        .from('user_profiles') // <--- PERUBAHAN DI SINI
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (profile) {
        setIsAuthenticated(true);
        setCurrentUser({
          id: profile.id,
          name: profile.name || "Pengguna",
          email: profile.email,
          role: profile.role as UserRole,
          avatar_url: profile.avatar_url
        });
        
        // Pindah ke halaman Home jika sedang di login/signup
        if (currentView === "login" || currentView === "signup") {
          setCurrentView("home");
        }
      }
    } else {
      setIsAuthenticated(false);
      setCurrentUser(null);
    }
  });

  return () => subscription.unsubscribe();
}, [currentView]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentView("home");
    setSelectedDestinationId("");
    setLikedDestinations(new Set()); 
    toast.success("Berhasil keluar dari akun");
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
      toast.success("Akun Anda telah berhasil dihapus secara permanen.");
      window.location.reload(); 
    } catch (error: any) {
      console.error("Gagal hapus akun:", error);
      toast.error("Gagal menghapus akun: " + error.message);
    }
  };

  // 2. FETCH DESTINATIONS & REALTIME
  useEffect(() => {
    const fetchDestinations = async () => {
      setIsLoading(true);

      try {
        // 1. Ambil data dari Supabase
        const { data, error } = await supabase
          .from('destinations')
          .select(`
            *,
            created_by_profile:user_profiles (
              name,
              avatar_url
            )
          `)
          .order('name'); // Bisa diganti 'created_at', { ascending: false }

        if (error) throw error;

        // 2. Format Data (Mapping)
        // Kita pakai 'data: any[]' biar TS tidak rewel
        const safeData = (data || []).map((item: any) => {
          
          // Parsing Koordinat (Safety First)
          let lat = 0;
          let lng = 0;
          try {
            if (item.coordinates) {
               const coords = typeof item.coordinates === 'string' 
                 ? JSON.parse(item.coordinates) 
                 : item.coordinates;
               lat = Number(coords.lat) || 0;
               lng = Number(coords.lng) || 0;
            }
          } catch (e) {
            console.log("Error parsing coords", e);
          }

          // Return Object yang PASTI AMAN
          return {
            id: item.id,
            name: item.name,
            location: item.location || "Lokasi tidak diketahui",
            description: item.description || "",
            
            // MAPPING: Kita sediakan semua variasi nama biar Frontend senang
            image: item.image || item.image_url || "https://placehold.co/600x400", 
            image_url: item.image || item.image_url || "https://placehold.co/600x400",
            
            date: item.date || item.event_date || new Date().toISOString(),
            event_date: item.date || item.event_date || new Date().toISOString(),
            
            // Angka-angka
            reviews: Number(item.reviews_count) || 0,
            likes: Number(item.likes_count) || 0,
            rating: Number(item.rating) || 0,
            price: item.price || "Gratis",
            
            type: item.type === 'event' ? 'event' : 'destination',
            
            tags: Array.isArray(item.tags) ? item.tags : [],
            coordinates: { lat, lng },
            
            // Default Value
            island: item.island || "Indonesia",

            // Uploader
            created_by_name: item.created_by_profile?.name || 'Admin',
            created_by_avatar: item.created_by_profile?.avatar_url
          };
        });

        // 3. Masukkan ke state
        // Karena state sudah diubah jadi <any[]>, ini pasti masuk!
        setAllDestinations(safeData);

      } catch (err) {
        console.error("Error fetching:", err);
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

  // 3. FETCH LIKES
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

  // 4. FETCH REVIEWS
  const fetchAllReviews = async (destId: string) => {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id, 
        rating, 
        comment, 
        created_at, 
        helpful:helpful_count, 
        profiles!reviews_user_id_fkey ( name )
      `)
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
      console.log("Error details:", error?.message, error?.details); 
      
      setReviews(prev => ({ ...prev, [destId]: [] }));
      return [];
    }
  };

  useEffect(() => {
    if (selectedDestinationId) {
      fetchAllReviews(selectedDestinationId);
    }
  }, [selectedDestinationId]); 

  // 5. GEOLOCATION
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

  // FILTERING LOGIC
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

  // HANDLERS
  const handleLike = async (destinationId: string) => {
    if (!currentUser) { 
      toast.error("Silakan login untuk menyimpan favorit!");
      setCurrentView("login"); 
      return; 
    }
    
    const isLiked = likedDestinations.has(destinationId);
    const newLiked = new Set(likedDestinations);
    if (isLiked) newLiked.delete(destinationId); else newLiked.add(destinationId);
    setLikedDestinations(newLiked);

    setAllDestinations(prev => prev.map(d => {
        if (d.id === destinationId) {
            return { ...d, likes: isLiked ? Math.max(0, d.likes - 1) : d.likes + 1 }
        }
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
      toast.error("Gagal mengupdate favorit");
    }
  };

  const handleViewDetails = (id: string) => { 
    setSelectedDestinationId(id); 
    setCurrentView("destination-detail"); 
  };

  const handleAddReview = async (rating: number, comment: string) => {
    if (!currentUser) { 
      toast.error("Silakan login untuk memberi ulasan!");
      return; 
    }
    
    // Optimistic Update
    const tempId = `temp-${Date.now()}`;
    const newReview: Review = { 
        id: tempId, 
        userName: currentUser.name, 
        rating: rating, 
        comment: comment, 
        date: new Date().toISOString(), 
        helpful: 0, 
        isHelpful: false 
    };

    setReviews(prev => ({ 
        ...prev, 
        [selectedDestinationId]: [newReview, ...(prev[selectedDestinationId] || [])] 
    }));

    // Update rata-rata rating (Optimistic)
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
          user_id: currentUser.id, 
          destination_id: selectedDestinationId, 
          rating: rating, 
          comment: comment 
      }).select().single();
      
      if (error) throw error;
      
      await fetchAllReviews(selectedDestinationId);
      await supabase.rpc('update_destination_rating', { dest_id: selectedDestinationId, new_rating: rating });
      
      toast.success("Ulasan berhasil ditambahkan!");

    } catch (error) { 
      console.error("Gagal kirim review:", error); 
      toast.error("Gagal mengirim ulasan.");
      setReviews(prev => ({
          ...prev,
          [selectedDestinationId]: (prev[selectedDestinationId] || []).filter(r => r.id !== tempId)
      }));
    }
  };

  const handleMarkHelpful = (id: string) => { /* Logic akan dihandle di component review-section */ };
  const handleBackToHome = () => { setCurrentView("home"); setSelectedDestinationId(""); };
  const handleFavoritesClick = () => { setCurrentView("favorites"); };
  const selectedDestination = allDestinations.find(d => d.id === selectedDestinationId);

  // ROLE-BASED MENU ITEMS
  const getRoleBasedMenuItems = () => {
    if (!currentUser) return null;
    
    if (currentUser.role === 'admin') {
      return (
        <DropdownMenuItem onClick={() => setCurrentView("admin-dashboard")}>
          <Shield className="mr-2 h-4 w-4 text-purple-500" />
          Admin Dashboard
        </DropdownMenuItem>
      );
    }
    
    if (currentUser.role === 'event_organizer') {
      return (
        <DropdownMenuItem onClick={() => setCurrentView("eo-dashboard")}>
          <Briefcase className="mr-2 h-4 w-4 text-blue-500" />
          EO Dashboard
        </DropdownMenuItem>
      );
    }
    
    return null;
  };

  // RENDER VIEWS
  if (currentView === "forgot-password") {
    return <ForgotPassword onBack={() => setCurrentView("login")} onResetPassword={() => {}} />;
  }
  
  if (currentView === "login" || currentView === "signup") {
    return (
      <>
        <Auth 
          initialMode={currentView} 
          onLogin={() => {}} 
          onSignup={() => {}} 
          onForgotPassword={() => setCurrentView("forgot-password")} 
          onBack={() => setCurrentView("home")} 
        />
        <Toaster />
      </>
    );
  }

  if (currentView === "admin-dashboard") {
    if (currentUser?.role !== 'admin') {
      toast.error("Anda tidak memiliki akses ke halaman ini");
      setCurrentView("home");
      return null;
    }
    return (
      <>
        <AdminDashboard 
          currentUser={{
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            role: currentUser.role
          }}
          onBack={handleBackToHome} 
        />
        <Toaster />
      </>
    );
  }

  if (currentView === "eo-dashboard") {
    if (currentUser?.role !== 'event_organizer' && currentUser?.role !== 'admin') {
      toast.error("Anda tidak memiliki akses ke halaman ini");
      setCurrentView("home");
      return null;
    }
    return (
      <>
        <EODashboard 
          currentUser={{
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            role: currentUser.role
          }}
          onBack={handleBackToHome} 
        />
        <Toaster />
      </>
    );
  }
  
  if (currentView === "destination-detail" && selectedDestination) {
    return (
      <>
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
        <Toaster />
      </>
    );
  }

  if (currentView === "settings") {
    if (!isAuthenticated) return null;
    
    const handleAvatarUpdate = async (newAvatarUrl: string) => {
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          avatar_url: newAvatarUrl
        });
        toast.success("Foto profil berhasil diperbarui!");
      }
    };
    
    const handleUpdateProfile = async (name: string, email: string) => {
      if (!currentUser) return false;
      
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ name, email })
          .eq('id', currentUser.id);
        
        if (error) throw error;
        
        setCurrentUser({ ...currentUser, name, email });
        toast.success("Profil berhasil diperbarui!");
        return true;
      } catch (error: any) {
        toast.error("Gagal memperbarui profil: " + error.message);
        return false;
      }
    };
    
    const handleUpdatePreferences = async (updates: any) => {
      if (!currentUser) return false;
      
      try {
        const { error } = await supabase
          .from('profiles')
          .update({ preferences: updates })
          .eq('id', currentUser.id);
        
        if (error) throw error;
        
        return true;
      } catch (error: any) {
        console.error("Gagal update preferensi:", error);
        return false;
      }
    };
    
    return (
      <>
        <SettingsPage 
          onBack={handleBackToHome} 
          user={currentUser!} 
          onUpdateProfile={handleUpdateProfile} 
          onDeleteAccount={handleDeleteAccount} 
          onUpdatePreferences={handleUpdatePreferences}
          onAvatarUpdate={handleAvatarUpdate}
        />
        <Toaster />
      </>
    );
  }
  
  if (currentView === "favorites") {
    const favoriteDestinations = allDestinations.filter(d => likedDestinations.has(d.id));
    return (
      <>
        <div className="min-h-screen bg-background">
          <header className="border-b bg-card sticky top-0 z-50">
              <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center">
                  <div className="flex items-center gap-2 cursor-pointer" onClick={handleBackToHome}>
                      <MapPin className="h-5 w-5 text-primary" />
                      <h1 className="text-xl">NusaGo</h1>
                      <Badge variant="secondary" className="text-xs">Beta</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleBackToHome}>
                      <Home className="h-4 w-4 mr-2"/>Beranda
                  </Button>
              </div>
          </header>
          <main className="container mx-auto px-3 sm:px-4 py-6">
            <h2 className="text-2xl flex items-center gap-2 mb-6">
              <Heart className="h-8 w-8 text-red-500 fill-current" /> Favorit Anda
            </h2>
            {favoriteDestinations.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favoriteDestinations.map(dest => (
                      <DestinationCard 
                        key={dest.id} 
                        destination={dest} 
                        onLike={handleLike} 
                        onViewDetails={handleViewDetails} 
                        isLiked={true} 
                      />
                  ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Belum ada tempat favorit.
              </div>
            )}
          </main>
        </div>
        <Toaster />
      </>
    );
  }

  // HOME VIEW
  return (
    <>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card sticky top-0 z-50">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex justify-between items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={handleBackToHome}>
              <MapPin className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">NusaGo</h1>
              <Badge variant="secondary" className="text-xs">Beta</Badge>
            </div>
            <div className="flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-2">
                      {isAuthenticated ? (
                          <>
                              <Avatar className="h-7 w-7">
                                <AvatarFallback>{currentUser?.name?.charAt(0) || "U"}</AvatarFallback>
                                {currentUser?.avatar_url && <AvatarImage src={currentUser.avatar_url} />}
                              </Avatar>
                              <span className="hidden sm:inline text-sm">{currentUser?.name}</span>
                              <ChevronDown className="h-4 w-4" />
                          </>
                      ) : (
                          <>
                              <User className="h-5 w-5" />
                              <span className="hidden sm:inline">Akun</span>
                              <ChevronDown className="h-4 w-4" />
                          </>
                      )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {isAuthenticated ? (
                      <>
                          <DropdownMenuLabel>
                            {currentUser?.name}
                            {currentUser?.role === 'admin' && (
                              <Badge variant="secondary" className="ml-2 text-xs">Admin</Badge>
                            )}
                            {currentUser?.role === 'event_organizer' && (
                              <Badge variant="secondary" className="ml-2 text-xs">EO</Badge>
                            )}
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {getRoleBasedMenuItems()}
                          {getRoleBasedMenuItems() && <DropdownMenuSeparator />}
                          <DropdownMenuItem onClick={handleFavoritesClick}>
                            <Heart className="mr-2 h-4 w-4" />Favorit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setCurrentView("settings")}>
                            <Settings className="mr-2 h-4 w-4" />Setelan
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                            <LogOut className="mr-2 h-4 w-4" />Keluar
                          </DropdownMenuItem>
                      </>
                  ) : (
                      <>
                          <DropdownMenuItem onClick={() => setCurrentView("login")}>
                            <LogIn className="mr-2 h-4 w-4" />Sign In
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setCurrentView("signup")}>
                            <UserPlus className="mr-2 h-4 w-4" />Sign Up
                          </DropdownMenuItem>
                      </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-3 sm:px-4 py-6 space-y-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">Memuat data wisata...</p>
            </div>
          ) : (
            <>
              {!isSearching && isAuthenticated && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold flex gap-2">
                        <Target className="text-primary" /> Rekomendasi Sekitarmu
                      </h2>
                      <Badge variant="outline">
                        <Navigation className="h-3 w-3 mr-1" /> Terdekat
                      </Badge>
                  </div>
                  {nearbyDestinations.length > 0 ? (
                      <div className="overflow-x-auto pb-4 -mx-3 px-3 scrollbar-hide">
                          <div className="flex gap-4">
                              {nearbyDestinations.map(dest => (
                                  <div key={dest.id} className="w-[280px] flex-shrink-0">
                                      <DestinationCard 
                                        destination={dest} 
                                        onLike={handleLike} 
                                        onViewDetails={handleViewDetails} 
                                        isLiked={likedDestinations.has(dest.id)} 
                                        distance={dest.distance} 
                                        featured={true} 
                                      />
                                  </div>
                              ))}
                          </div>
                      </div>
                  ) : (
                      <div className="text-center py-4 bg-muted/20 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            Belum ada destinasi di database yang dekat dengan lokasimu.
                          </p>
                      </div>
                  )}
                </div>
              )}
              
              {!isAuthenticated && !isSearching && (
                <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 rounded-lg p-8 text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Target className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold">Lihat Peta Wisata di Sekitarmu!</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Login sekarang untuk mengaktifkan GPS dan melihat rekomendasi personal.
                  </p>
                  <div className="flex justify-center gap-2">
                      <Button onClick={() => setCurrentView("login")}>Sign In</Button>
                      <Button variant="outline" onClick={() => setCurrentView("signup")}>Sign Up</Button>
                  </div>
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
                onTagToggle={handleTagToggle} 
                availableTags={availableTags} 
                availableLocations={availableIslands} 
              />
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">
                    {isSearching ? "Hasil Pencarian" : "Jelajahi Semua"}
                  </h3>
                  <span className="text-sm text-muted-foreground">
                    {filteredDestinations.length} destinasi
                  </span>
                </div>
                
                {filteredDestinations.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {filteredDestinations.map(dest => (
                          <div key={dest.id} className="h-full">
                              <DestinationCard 
                                destination={dest} 
                                onLike={handleLike} 
                                onViewDetails={handleViewDetails} 
                                isLiked={likedDestinations.has(dest.id)} 
                                featured={false} 
                              />
                          </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                      <Search className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground">Tidak ada destinasi yang cocok.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </main>
        
        <footer className="border-t bg-muted/50 mt-8 py-8">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
              <p>© 2025 NusaGo. Dibuat dengan ❤️ untuk wisatawan Indonesia.</p>
          </div>
        </footer>
      </div>
      <Toaster />
    </>
  );
}