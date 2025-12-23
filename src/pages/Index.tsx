import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { ImageCard } from "@/components/ImageCard";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

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
  profile?: UserProfile;
}

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);
  const [userRatings, setUserRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      // Delay profile fetch slightly to ensure profile is created after signup
      const timer = setTimeout(() => {
        fetchProfile();
        fetchUserRatings();
        checkAdminRole();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (data) setProfile(data);
  };

  const checkAdminRole = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
  };

  const fetchImages = async () => {
    setLoading(true);
    
    // Fetch images first
    const { data: imagesData, error: imagesError } = await supabase
      .from("images")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (imagesError) {
      toast({ title: "Error", description: "Failed to load images", variant: "destructive" });
      setLoading(false);
      return;
    }

    if (!imagesData || imagesData.length === 0) {
      setImages([]);
      setLoading(false);
      return;
    }

    // Get unique user IDs
    const userIds = [...new Set(imagesData.map(img => img.user_id))];

    // Fetch profiles for those users
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, badge_rank")
      .in("id", userIds);

    // Create a map of profiles by user ID
    const profilesMap: Record<string, UserProfile> = {};
    if (profilesData) {
      profilesData.forEach(p => {
        profilesMap[p.id] = p;
      });
    }

    // Combine images with profiles
    const imagesWithProfiles: ImageData[] = imagesData.map(img => ({
      id: img.id,
      image_url: img.image_url,
      caption: img.caption,
      average_rating: Number(img.average_rating) || 0,
      total_ratings: img.total_ratings || 0,
      user_id: img.user_id,
      profile: profilesMap[img.user_id],
    }));

    setImages(imagesWithProfiles);
    setLoading(false);
  };

  const fetchUserRatings = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ratings")
      .select("image_id, rating")
      .eq("user_id", user.id);

    if (data) {
      const ratingsMap: Record<string, number> = {};
      data.forEach((r) => (ratingsMap[r.image_id] = r.rating));
      setUserRatings(ratingsMap);
    }
  };

  const handleRate = async (imageId: string, rating: number) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const existing = userRatings[imageId];
    const { error } = existing
      ? await supabase.from("ratings").update({ rating }).eq("image_id", imageId).eq("user_id", user.id)
      : await supabase.from("ratings").insert({ image_id: imageId, user_id: user.id, rating });

    if (error) {
      toast({ title: "Error", description: "Failed to submit rating", variant: "destructive" });
    } else {
      setUserRatings((prev) => ({ ...prev, [imageId]: rating }));
      toast({ title: "Rated!", description: `You gave ${rating}/10 stars` });
      fetchImages();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile ? { id: profile.id, username: profile.username, avatarUrl: profile.avatar_url, isAdmin } : null} />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4 animate-fade-in">
            Discover & Rate <span className="text-gold">Amazing</span> Photography
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-slide-up">
            Share your best shots, get rated by the community, and climb the leaderboard.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-4">No images yet. Be the first to upload!</p>
          </div>
        ) : (
          <div className="masonry-grid">
            {images.map((image) => (
              <ImageCard
                key={image.id}
                id={image.id}
                imageUrl={image.image_url}
                caption={image.caption}
                averageRating={image.average_rating}
                totalRatings={image.total_ratings}
                user={{
                  id: image.user_id,
                  username: image.profile?.username || "Unknown",
                  avatarUrl: image.profile?.avatar_url,
                  badgeRank: image.profile?.badge_rank,
                }}
                userRating={userRatings[image.id]}
                canRate={!!user && image.user_id !== user.id}
                currentUserId={user?.id}
                onRate={(rating) => handleRate(image.id, rating)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
