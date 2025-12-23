import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { ImageCard } from "@/components/ImageCard";
import { LocationFilter, LocationLevel } from "@/components/LocationFilter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp } from "lucide-react";

interface UserProfile {
  id: string;
  username: string;
  avatar_url?: string;
  badge_rank?: number;
  continent?: string;
  country?: string;
  state?: string;
  district?: string;
  city?: string;
}

interface ImageData {
  id: string;
  image_url: string;
  title?: string;
  caption?: string;
  description?: string;
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
  const [locationFilter, setLocationFilter] = useState<LocationLevel>("continent");
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
      fetchProfile();
      fetchUserRatings();
      checkAdminRole();
    } else {
      setProfile(null);
      setIsAdmin(false);
    }
  }, [user]);

  useEffect(() => {
    fetchImages();
  }, [locationFilter, profile]);

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
    
    // First get user IDs that match the location filter
    let profileQuery = supabase.from("profiles").select("id");
    
    if (profile) {
      switch (locationFilter) {
        case "continent":
          if (profile.continent) profileQuery = profileQuery.eq("continent", profile.continent);
          break;
        case "country":
          if (profile.country) profileQuery = profileQuery.eq("country", profile.country);
          break;
        case "state":
          if (profile.state) profileQuery = profileQuery.eq("state", profile.state);
          break;
        case "district":
          if (profile.district) profileQuery = profileQuery.eq("district", profile.district);
          break;
        case "city":
          if (profile.city) profileQuery = profileQuery.eq("city", profile.city);
          break;
      }
    }

    const { data: matchingProfiles } = await profileQuery;
    const matchingUserIds = matchingProfiles?.map(p => p.id) || [];

    // Fetch top-rated images
    let imagesQuery = supabase
      .from("images")
      .select("*")
      .order("average_rating", { ascending: false })
      .order("total_ratings", { ascending: false })
      .limit(50);

    if (matchingUserIds.length > 0 && profile) {
      imagesQuery = imagesQuery.in("user_id", matchingUserIds);
    }

    const { data: imagesData, error: imagesError } = await imagesQuery;

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
      .select("id, username, avatar_url, badge_rank, continent, country, state, district, city")
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
      title: img.title,
      caption: img.caption,
      description: img.description,
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

  // Create navbar user from profile or fallback to auth user
  const navbarUser = profile 
    ? { id: profile.id, username: profile.username, avatarUrl: profile.avatar_url, isAdmin }
    : user 
      ? { id: user.id, username: user.user_metadata?.username || user.email?.split('@')[0] || 'User', isAdmin }
      : null;

  const getFilterTitle = () => {
    if (!profile) return "Top Rated Photos";
    switch (locationFilter) {
      case "continent": return `Top in ${profile.continent || "Your Continent"}`;
      case "country": return `Top in ${profile.country || "Your Country"}`;
      case "state": return `Top in ${profile.state || "Your State"}`;
      case "district": return `Top in ${profile.district || "Your District"}`;
      case "city": return `Top in ${profile.city || "Your City"}`;
      default: return "Top Rated Photos";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={navbarUser} />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4 animate-fade-in">
            Discover & Rate <span className="text-gold">Amazing</span> Photography
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-slide-up mb-6">
            Share your best shots, get rated by the community, and climb the leaderboard.
          </p>

          {/* Location Filter */}
          <LocationFilter
            activeFilter={locationFilter}
            onFilterChange={setLocationFilter}
            userLocation={profile ? {
              continent: profile.continent,
              country: profile.country,
              state: profile.state,
              district: profile.district,
              city: profile.city,
            } : undefined}
          />
        </div>

        {/* Section Title */}
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-gold" />
          <h2 className="text-xl font-semibold text-foreground">{getFilterTitle()}</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-xl">
            <p className="text-muted-foreground mb-4">No photos found in this area. Be the first to upload!</p>
          </div>
        ) : (
          <div className="masonry-grid">
            {images.map((image) => (
              <ImageCard
                key={image.id}
                id={image.id}
                imageUrl={image.image_url}
                caption={image.title || image.caption}
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
