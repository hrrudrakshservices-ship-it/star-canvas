import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { ProfileCard } from "@/components/ProfileCard";
import { ImageCard } from "@/components/ImageCard";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LockKeyhole, Globe } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  country?: string;
  city?: string;
  state?: string;
  badge_rank?: number;
  total_images: number;
  followers_count: number;
  following_count: number;
  average_rating: number;
  total_ratings_received: number;
  is_public: boolean;
}

interface ImageData {
  id: string;
  image_url: string;
  caption?: string;
  average_rating: number;
  total_ratings: number;
  user_id: string;
}

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [viewedProfile, setViewedProfile] = useState<Profile | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

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
    if (userId) {
      fetchViewedProfile();
      fetchUserImages();
    }
  }, [userId]);

  useEffect(() => {
    if (currentUser) {
      fetchCurrentProfile();
      fetchUserRatings();
      checkFollowStatus();
      checkAdminRole();
    }
  }, [currentUser, userId]);

  const fetchCurrentProfile = async () => {
    if (!currentUser) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
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

  const fetchViewedProfile = async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) {
      toast({ title: "Error", description: "Profile not found", variant: "destructive" });
      navigate("/");
      return;
    }
    setViewedProfile(data);
    setLoading(false);
  };

  const fetchUserImages = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("images")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setImages(data || []);
  };

  const fetchUserRatings = async () => {
    if (!currentUser) return;
    const { data } = await supabase
      .from("ratings")
      .select("image_id, rating")
      .eq("user_id", currentUser.id);

    if (data) {
      const ratingsMap: Record<string, number> = {};
      data.forEach((r) => (ratingsMap[r.image_id] = r.rating));
      setUserRatings(ratingsMap);
    }
  };

  const checkFollowStatus = async () => {
    if (!currentUser || !userId || currentUser.id === userId) return;
    const { data } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUser.id)
      .eq("following_id", userId)
      .maybeSingle();
    setIsFollowing(!!data);
  };

  const handleFollow = async () => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }
    const { error } = await supabase.from("follows").insert({
      follower_id: currentUser.id,
      following_id: userId,
    });
    if (!error) {
      setIsFollowing(true);
      toast({ title: "Followed!", description: `You are now following ${viewedProfile?.username}` });
      fetchViewedProfile();
    }
  };

  const handleUnfollow = async () => {
    if (!currentUser || !userId) return;
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", currentUser.id)
      .eq("following_id", userId);
    if (!error) {
      setIsFollowing(false);
      toast({ title: "Unfollowed", description: `You unfollowed ${viewedProfile?.username}` });
      fetchViewedProfile();
    }
  };

  const handleMakePublic = async () => {
    if (!currentUser || !viewedProfile) return;
    
    const { error } = await supabase
      .from("profiles")
      .update({ is_public: true })
      .eq("id", currentUser.id);

    if (error) {
      toast({ title: "Error", description: "Failed to update account", variant: "destructive" });
    } else {
      toast({ title: "Account Updated", description: "Your account is now public. This cannot be undone." });
      fetchViewedProfile();
      fetchCurrentProfile();
    }
  };

  const handleRate = async (imageId: string, rating: number) => {
    if (!currentUser) {
      navigate("/auth");
      return;
    }

    const existing = userRatings[imageId];
    const { error } = existing
      ? await supabase.from("ratings").update({ rating }).eq("image_id", imageId).eq("user_id", currentUser.id)
      : await supabase.from("ratings").insert({ image_id: imageId, user_id: currentUser.id, rating });

    if (!error) {
      setUserRatings((prev) => ({ ...prev, [imageId]: rating }));
      toast({ title: "Rated!", description: `You gave ${rating}/10 stars` });
      fetchUserImages();
      fetchViewedProfile();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userId;
  const canViewContent = viewedProfile?.is_public || isOwnProfile || isFollowing;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={currentProfile ? { id: currentProfile.id, username: currentProfile.username, avatarUrl: currentProfile.avatar_url, isAdmin } : null} />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          {viewedProfile && (
            <>
              <ProfileCard
                id={viewedProfile.id}
                username={viewedProfile.username}
                avatarUrl={viewedProfile.avatar_url}
                country={viewedProfile.country}
                city={viewedProfile.city}
                badgeRank={viewedProfile.badge_rank}
                totalImages={viewedProfile.total_images}
                followersCount={viewedProfile.followers_count}
                averageRating={Number(viewedProfile.average_rating) || 0}
                totalRatingsReceived={viewedProfile.total_ratings_received}
                isFollowing={isFollowing}
                isOwnProfile={isOwnProfile}
                isPublic={viewedProfile.is_public}
                onFollow={handleFollow}
                onUnfollow={handleUnfollow}
              />

              {/* Account Type Banner for Own Profile */}
              {isOwnProfile && (
                <div className="mt-4 glass-card rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {viewedProfile.is_public ? (
                        <>
                          <Globe className="w-5 h-5 text-gold" />
                          <div>
                            <p className="font-medium text-foreground">Public Account</p>
                            <p className="text-xs text-muted-foreground">Everyone can see your profile and images</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <LockKeyhole className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-foreground">Private Account</p>
                            <p className="text-xs text-muted-foreground">Only followers can see your content</p>
                          </div>
                        </>
                      )}
                    </div>
                    
                    {!viewedProfile.is_public && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleMakePublic}
                      >
                        <Globe className="w-4 h-4 mr-1" />
                        Make Public
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="mt-8">
            <h2 className="text-xl font-serif font-semibold text-foreground mb-6">
              Images ({images.length})
            </h2>

            {!canViewContent ? (
              <div className="text-center py-12 glass-card rounded-xl">
                <LockKeyhole className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-foreground font-medium mb-2">This account is private</p>
                <p className="text-sm text-muted-foreground mb-4">Follow this account to see their photos</p>
                <Button onClick={handleFollow}>
                  Follow to View
                </Button>
              </div>
            ) : images.length === 0 ? (
              <div className="text-center py-12 glass-card rounded-xl">
                <p className="text-muted-foreground">No images uploaded yet</p>
              </div>
            ) : (
              <div className="masonry-grid">
                {images.map((image) => (
                  <ImageCard
                    key={image.id}
                    id={image.id}
                    imageUrl={image.image_url}
                    caption={image.caption}
                    averageRating={Number(image.average_rating) || 0}
                    totalRatings={image.total_ratings || 0}
                    user={{
                      id: viewedProfile!.id,
                      username: viewedProfile!.username,
                      avatarUrl: viewedProfile!.avatar_url,
                      badgeRank: viewedProfile!.badge_rank,
                    }}
                    userRating={userRatings[image.id]}
                    canRate={!!currentUser && !isOwnProfile}
                    currentUserId={currentUser?.id}
                    onRate={(rating) => handleRate(image.id, rating)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
