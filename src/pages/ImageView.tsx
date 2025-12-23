import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { StarRating } from "@/components/StarRating";
import { RatingInput } from "@/components/RatingInput";
import { BadgeRank } from "@/components/BadgeRank";
import { ReportDialog } from "@/components/ReportDialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Flag, Loader2 } from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
  badge_rank?: number;
}

interface ImageData {
  id: string;
  image_url: string;
  caption?: string;
  average_rating: number;
  total_ratings: number;
  user_id: string;
  created_at: string;
}

export default function ImageView() {
  const { imageId } = useParams<{ imageId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [image, setImage] = useState<ImageData | null>(null);
  const [imageOwner, setImageOwner] = useState<UserProfile | null>(null);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [showRatingInput, setShowRatingInput] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setCurrentUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchCurrentProfile();
      checkAdminRole();
    }
  }, [currentUser]);

  useEffect(() => {
    if (imageId) {
      fetchImage();
    }
  }, [imageId]);

  useEffect(() => {
    if (currentUser && imageId) {
      fetchUserRating();
    }
  }, [currentUser, imageId]);

  const fetchCurrentProfile = async () => {
    if (!currentUser) return;
    const { data } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, badge_rank")
      .eq("id", currentUser.id)
      .maybeSingle();
    if (data) setCurrentProfile(data);
  };

  const checkAdminRole = async () => {
    if (!currentUser) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const fetchImage = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("images")
      .select("*")
      .eq("id", imageId)
      .maybeSingle();

    if (error || !data) {
      toast({ title: "Error", description: "Image not found", variant: "destructive" });
      navigate("/");
      return;
    }

    setImage({
      ...data,
      average_rating: Number(data.average_rating) || 0,
      total_ratings: data.total_ratings || 0,
    });

    // Fetch image owner profile
    const { data: ownerData } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, badge_rank")
      .eq("id", data.user_id)
      .maybeSingle();

    if (ownerData) setImageOwner(ownerData);
    setLoading(false);
  };

  const fetchUserRating = async () => {
    if (!currentUser || !imageId) return;
    const { data } = await supabase
      .from("ratings")
      .select("rating")
      .eq("image_id", imageId)
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (data) setUserRating(data.rating);
  };

  const handleRate = async (rating: number) => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }

    const existing = userRating !== null;
    const { error } = existing
      ? await supabase.from("ratings").update({ rating }).eq("image_id", imageId).eq("user_id", currentUser.id)
      : await supabase.from("ratings").insert({ image_id: imageId, user_id: currentUser.id, rating });

    if (error) {
      toast({ title: "Error", description: "Failed to submit rating", variant: "destructive" });
    } else {
      setUserRating(rating);
      setShowRatingInput(false);
      toast({ title: "Rated!", description: `You gave ${rating}/10 stars` });
      fetchImage(); // Refresh to get updated average
    }
  };

  const canRate = currentUser && image && image.user_id !== currentUser.id;
  const canReport = currentUser && image && image.user_id !== currentUser.id;

  // Create navbar user from profile or fallback to auth user
  const navbarUser = currentProfile 
    ? { id: currentProfile.id, username: currentProfile.username, avatarUrl: currentProfile.avatar_url, isAdmin }
    : currentUser 
      ? { id: currentUser.id, username: currentUser.user_metadata?.username || currentUser.email?.split('@')[0] || 'User', isAdmin }
      : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={navbarUser} />
        <div className="flex items-center justify-center pt-24 min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!image || !imageOwner) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar user={navbarUser} />
        <div className="flex items-center justify-center pt-24 min-h-screen">
          <p className="text-muted-foreground">Image not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={navbarUser} />

      <main className="pt-16">
        {/* Header */}
        <div className="border-b border-border bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Link 
                  to={`/profile/${imageOwner.id}`}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <Avatar className="w-10 h-10 border border-border">
                    <AvatarImage src={imageOwner.avatar_url} alt={imageOwner.username} />
                    <AvatarFallback className="text-sm bg-secondary">
                      {imageOwner.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">
                      {imageOwner.username}
                    </span>
                    {imageOwner.badge_rank && <BadgeRank rank={imageOwner.badge_rank} size="sm" />}
                  </div>
                </Link>
              </div>

              {canReport && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setShowReportDialog(true)}
                >
                  <Flag className="w-4 h-4 mr-2" />
                  Report
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Image Section */}
        <div className="flex flex-col lg:flex-row min-h-[calc(100vh-8rem)]">
          {/* Image */}
          <div className="flex-1 flex items-center justify-center bg-muted/30 p-4">
            <img
              src={image.image_url}
              alt={image.caption || "Image"}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>

          {/* Sidebar */}
          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-border bg-card p-6 space-y-6">
            {/* Caption */}
            {image.caption && (
              <div>
                <h2 className="text-lg font-medium text-foreground mb-2">Caption</h2>
                <p className="text-muted-foreground">{image.caption}</p>
              </div>
            )}

            {/* Rating Display */}
            <div className="space-y-3">
              <h2 className="text-lg font-medium text-foreground">Rating</h2>
              <div className="flex items-center gap-3">
                <StarRating rating={image.average_rating} size="lg" />
                <span className="text-muted-foreground">
                  ({image.total_ratings} {image.total_ratings === 1 ? "rating" : "ratings"})
                </span>
              </div>

              {/* User's rating */}
              {userRating && !showRatingInput && (
                <p className="text-sm text-muted-foreground">
                  Your rating: <span className="text-foreground font-medium">{userRating}/10</span>
                </p>
              )}
            </div>

            {/* Rating Input */}
            {canRate && (
              <div className="space-y-3">
                {!showRatingInput ? (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowRatingInput(true)}
                  >
                    {userRating ? "Update Rating" : "Rate This Image"}
                  </Button>
                ) : (
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <p className="text-sm font-medium">
                      {userRating ? "Update your rating" : "Rate this image"}
                    </p>
                    <RatingInput
                      initialRating={userRating || 0}
                      onRate={handleRate}
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setShowRatingInput(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Not logged in prompt */}
            {!currentUser && (
              <div className="p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Sign in to rate this image
                </p>
                <Button onClick={() => navigate("/auth")} size="sm">
                  Sign In
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Report Dialog */}
      {currentUser && image && (
        <ReportDialog
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
          imageId={image.id}
          imageOwnerId={image.user_id}
          currentUserId={currentUser.id}
        />
      )}
    </div>
  );
}
