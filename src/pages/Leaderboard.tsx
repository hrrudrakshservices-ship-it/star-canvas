import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { PhotoLeaderboardItem } from "@/components/PhotoLeaderboardItem";
import { LocationFilter, LocationLevel } from "@/components/LocationFilter";
import { TopLimitToggle, TopLimit } from "@/components/TopLimitToggle";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trophy, Image as ImageIcon } from "lucide-react";

interface Profile {
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
  average_rating: number;
  total_ratings: number;
  user_id: string;
  profile?: Profile;
  streak?: number;
}

export default function LeaderboardPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [images, setImages] = useState<ImageData[]>([]);
  const [filter, setFilter] = useState<LocationLevel>("continent");
  const [topLimit, setTopLimit] = useState<TopLimit>(10);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
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
    if (currentUser) {
      fetchCurrentProfile();
      checkAdminRole();
    }
  }, [currentUser]);

  useEffect(() => {
    fetchLeaderboard();
  }, [filter, topLimit, currentProfile]);

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

  const fetchLeaderboard = async () => {
    setLoading(true);

    // First get user IDs that match the location filter
    let profileQuery = supabase.from("profiles").select("id, username, avatar_url, badge_rank, continent, country, state, district, city");
    
    if (currentProfile) {
      switch (filter) {
        case "continent":
          if (currentProfile.continent) profileQuery = profileQuery.eq("continent", currentProfile.continent);
          break;
        case "country":
          if (currentProfile.country) profileQuery = profileQuery.eq("country", currentProfile.country);
          break;
        case "state":
          if (currentProfile.state) profileQuery = profileQuery.eq("state", currentProfile.state);
          break;
        case "district":
          if (currentProfile.district) profileQuery = profileQuery.eq("district", currentProfile.district);
          break;
        case "city":
          if (currentProfile.city) profileQuery = profileQuery.eq("city", currentProfile.city);
          break;
      }
    }

    const { data: matchingProfiles } = await profileQuery;
    const profilesMap: Record<string, Profile> = {};
    const matchingUserIds: string[] = [];
    
    if (matchingProfiles) {
      matchingProfiles.forEach(p => {
        profilesMap[p.id] = p;
        matchingUserIds.push(p.id);
      });
    }

    // Fetch top-rated images from matching users
    let imagesQuery = supabase
      .from("images")
      .select("*")
      .gt("total_ratings", 0)
      .order("average_rating", { ascending: false })
      .order("total_ratings", { ascending: false })
      .limit(topLimit);

    if (matchingUserIds.length > 0 && currentProfile) {
      imagesQuery = imagesQuery.in("user_id", matchingUserIds);
    }

    const { data: imagesData, error } = await imagesQuery;

    if (error) {
      toast({ title: "Error", description: "Failed to load leaderboard", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Fetch streaks for these images
    const imageIds = imagesData?.map(img => img.id) || [];
    let streaksMap: Record<string, number> = {};
    
    if (imageIds.length > 0) {
      const { data: streaksData } = await supabase
        .from("streaks")
        .select("image_id, current_streak")
        .in("image_id", imageIds)
        .eq("streak_type", filter);
      
      if (streaksData) {
        streaksData.forEach(s => {
          streaksMap[s.image_id] = s.current_streak || 0;
        });
      }
    }

    // Combine images with profiles and streaks
    const imagesWithData: ImageData[] = (imagesData || []).map(img => ({
      id: img.id,
      image_url: img.image_url,
      title: img.title,
      caption: img.caption,
      average_rating: Number(img.average_rating) || 0,
      total_ratings: img.total_ratings || 0,
      user_id: img.user_id,
      profile: profilesMap[img.user_id],
      streak: streaksMap[img.id] || 0,
    }));

    setImages(imagesWithData);
    setLoading(false);
  };

  const getFilterTitle = () => {
    if (!currentProfile) return "";
    switch (filter) {
      case "continent": return currentProfile.continent || "Continent";
      case "country": return currentProfile.country || "Country";
      case "state": return currentProfile.state || "State";
      case "district": return currentProfile.district || "District";
      case "city": return currentProfile.city || "City";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={currentProfile ? { id: currentProfile.id, username: currentProfile.username, avatarUrl: currentProfile.avatar_url, isAdmin } : null} />

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Trophy className="w-10 h-10 text-gold" />
            <h1 className="text-4xl font-serif font-bold text-foreground">
              Photo Leaderboard
            </h1>
          </div>
          <p className="text-muted-foreground mb-6">
            Top rated photos ranked by average rating and total ratings
          </p>

          {/* Top limit toggle */}
          <div className="flex justify-center mb-4">
            <TopLimitToggle
              activeLimit={topLimit}
              onLimitChange={setTopLimit}
            />
          </div>

          {/* Location filter */}
          <LocationFilter
            activeFilter={filter}
            onFilterChange={setFilter}
            userLocation={currentProfile ? {
              continent: currentProfile.continent,
              country: currentProfile.country,
              state: currentProfile.state,
              district: currentProfile.district,
              city: currentProfile.city,
            } : undefined}
          />
        </div>

        {/* Section title */}
        {currentProfile && (
          <div className="flex items-center gap-2 mb-4">
            <ImageIcon className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-medium text-foreground">
              Top {topLimit} in {getFilterTitle()}
            </h2>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-xl">
            <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No photos found for this filter</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Try a different filter or check back later
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {images.map((image, index) => (
              <PhotoLeaderboardItem
                key={image.id}
                rank={index + 1}
                imageId={image.id}
                imageUrl={image.image_url}
                title={image.title}
                caption={image.caption}
                averageRating={image.average_rating}
                totalRatings={image.total_ratings}
                user={{
                  id: image.user_id,
                  username: image.profile?.username || "Unknown",
                  avatarUrl: image.profile?.avatar_url,
                  badgeRank: image.profile?.badge_rank,
                }}
                streak={image.streak}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
