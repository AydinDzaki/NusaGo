import { useState, useEffect, useMemo } from "react";
import { Star, ThumbsUp, MessageSquare, User } from "./icons";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { supabase } from "../lib/supabase"; 

export interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
  isHelpful?: boolean; 
}

interface ReviewSectionProps {
  reviews: Review[];
  onAddReview: (rating: number, comment: string) => void;
  destinationName: string;
}

const useAuth = () => {
    const [user, setUser] = useState(supabase.auth.getUser());
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => setUser(data));
    }, []);
    return user?.user;
};

export function ReviewSection({ reviews: initialReviews, onAddReview, destinationName }: ReviewSectionProps) {
  const [newRating, setNewRating] = useState(0);
  const [newComment, setNewComment] = useState("");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [showAddReview, setShowAddReview] = useState(false);
  const [userHelpful, setUserHelpful] = useState<Set<string>>(new Set()); 
  const [localReviews, setLocalReviews] = useState(initialReviews);

  const user = useAuth();
  const userId = user?.id;

  useEffect(() => {
      setLocalReviews(initialReviews);
  }, [initialReviews]);


  useEffect(() => {
    if (!userId) {
      setUserHelpful(new Set());
      return;
    }
    const fetchHelpfulStatus = async () => {
      const reviewIds = initialReviews.map(r => r.id);
      if (reviewIds.length === 0) return;

      const { data, error } = await supabase
        .from('review_helpful')
        .select('review_id')
        .eq('user_id', userId)
        .in('review_id', reviewIds);

      if (!error && data) {
        setUserHelpful(new Set(data.map((item: any) => item.review_id)));
      }
    };
    fetchHelpfulStatus();
  }, [userId, initialReviews.length]);

  const handleMarkHelpful = async (reviewId: string, isCurrentlyHelpful: boolean) => {
    if (!userId) {
        alert("Silakan login untuk memberikan penilaian 'Membantu'.");
        return;
    }

    const increment = isCurrentlyHelpful ? -1 : 1;
    const newHelpful = new Set(userHelpful);
    if (isCurrentlyHelpful) {
      newHelpful.delete(reviewId);
    } else {
      newHelpful.add(reviewId);
    }
    setUserHelpful(newHelpful);
    setLocalReviews(prev => prev.map(review => {
        if (review.id === reviewId) {
            return {
                ...review,
                helpful: Math.max(0, review.helpful + increment) 
            }
        }
        return review;
    }));

    try {
      if (isCurrentlyHelpful) {
        await supabase.from('review_helpful').delete().eq('user_id', userId).eq('review_id', reviewId);
        await supabase.rpc('update_review_helpful', { rev_id: reviewId, increment: -1 });
      } else {
        await supabase.from('review_helpful').insert({ user_id: userId, review_id: reviewId });
        await supabase.rpc('update_review_helpful', { rev_id: reviewId, increment: 1 });
      }
    } catch (error) {
      console.error("Gagal update helpful status:", error);

      setUserHelpful(userHelpful); 
      setLocalReviews(initialReviews); 
      alert("Gagal menyimpan status helpful. Coba lagi.");
    }
  };

  const handleSubmitReview = () => {
    if (newRating > 0 && newComment.trim()) {
      onAddReview(newRating, newComment.trim());
      setNewRating(0);
      setNewComment("");
      setShowAddReview(false);
    }
  };

  const averageRating = localReviews.length > 0 
    ? localReviews.reduce((sum, review) => sum + review.rating, 0) / localReviews.length 
    : 0;
    
  const reviewsWithStatus = useMemo(() => {
    return localReviews.map(review => ({
      ...review,
      isHelpful: userHelpful.has(review.id)
    }));
  }, [localReviews, userHelpful]);


  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Review Summary */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="line-clamp-1">Ulasan untuk {destinationName}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="text-center sm:text-left flex-shrink-0">
              <div className="flex items-center justify-center sm:justify-start gap-1 mb-1">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg sm:text-xl">{averageRating.toFixed(1)}</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">{reviewsWithStatus.length} ulasan</p>
            </div>
            
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = reviewsWithStatus.filter(r => r.rating === rating).length;
                const percentage = reviewsWithStatus.length > 0 ? (count / reviewsWithStatus.length) * 100 : 0;
                
                return (
                  <div key={rating} className="flex items-center gap-2 text-xs sm:text-sm">
                    <span className="w-6 sm:w-8 text-xs">{rating}★</span>
                    <div className="flex-1 bg-muted rounded-full h-1.5 sm:h-2">
                      <div 
                        className="bg-yellow-400 h-1.5 sm:h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-6 sm:w-8 text-muted-foreground text-xs">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Review */}
      <Card>
        <CardHeader className="pb-3 sm:pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg">Tulis Ulasan</CardTitle>
            <Button 
              variant={showAddReview ? "outline" : "default"}
              size="sm"
              onClick={() => setShowAddReview(!showAddReview)}
              className="sm:hidden"
            >
              {showAddReview ? "Batal" : "Tambah Ulasan"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className={`space-y-3 sm:space-y-4 pt-0 ${!showAddReview ? "hidden sm:block" : ""}`}>
          <div>
            <label className="block text-sm mb-2">Penilaian</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onClick={() => setNewRating(star)}
                  className="p-1 hover:scale-110 transition-transform touch-manipulation"
                >
                  <Star 
                    className={`h-5 w-5 sm:h-6 sm:w-6 ${
                      star <= (hoveredStar || newRating) 
                        ? "fill-yellow-400 text-yellow-400" 
                        : "text-muted-foreground"
                    }`} 
                  />
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm mb-2">Ulasan Anda</label>
            <Textarea
              placeholder="Bagikan pengalaman Anda..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              rows={3}
              className="text-sm sm:text-base"
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleSubmitReview}
              disabled={newRating === 0 || !newComment.trim()}
              className="flex-1 sm:flex-none"
            >
              Kirim Ulasan
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setNewRating(0);
                setNewComment("");
                setShowAddReview(false);
              }}
              className="sm:hidden"
            >
              Batal
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-3 sm:space-y-4">
        {reviewsWithStatus.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start gap-2 sm:gap-3">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                  <AvatarFallback>
                    <User className="h-3 w-3 sm:h-4 sm:w-4" />
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 space-y-1 sm:space-y-2 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                    <div className="min-w-0">
                      <p className="text-sm sm:text-base truncate">{review.userName}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star}
                              className={`h-3 w-3 sm:h-4 sm:w-4 ${
                                star <= review.rating 
                                  ? "fill-yellow-400 text-yellow-400" 
                                  : "text-muted-foreground"
                              }`} 
                            />
                          ))}
                        </div>
                        <span className="text-xs sm:text-sm text-muted-foreground">
                          {new Date(review.date).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs sm:text-sm text-muted-foreground">{review.comment}</p>
                  
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkHelpful(review.id, review.isHelpful!)}
                      className={`h-7 text-xs ${review.isHelpful ? "text-blue-600 font-semibold" : "text-muted-foreground hover:text-blue-600"}`}
                    >
                      <ThumbsUp className={`h-3 w-3 mr-1 ${review.isHelpful ? "fill-blue-600" : ""}`} />
                      <span className="hidden xs:inline">Membantu</span> ({review.helpful})
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {reviewsWithStatus.length === 0 && (
          <Card>
            <CardContent className="p-6 sm:p-8 text-center">
              <MessageSquare className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground">Belum ada ulasan. Jadilah yang pertama berbagi pengalaman Anda!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}