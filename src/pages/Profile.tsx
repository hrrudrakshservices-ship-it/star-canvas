import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { ProfileCard } from "@/components/ProfileCard";
import { ImageCard } from "@/components/ImageCard";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={currentProfile ? { id: currentProfile.id, username: currentProfile.username, avatarUrl: currentProfile.avatar_url, isAdmin } : null} />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          {viewedProfile && (
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
              onFollow={handleFollow}
              onUnfollow={handleUnfollow}
            />
          )}

          <div className="mt-8">
            <h2 className="text-xl font-serif font-semibold text-foreground mb-6">
              Images ({images.length})
            </h2>

            {images.length === 0 ? (
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
