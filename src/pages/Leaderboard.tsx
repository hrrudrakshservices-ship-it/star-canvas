import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { LeaderboardItem } from "@/components/LeaderboardItem";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Trophy, Globe, MapPin } from "lucide-react";

interface Profile {
  id: string;
  username: string;
  avatar_url?: string;
  country?: string;
  country_code?: string;
  state?: string;
  city?: string;
  badge_rank?: number;
  total_images: number;
  followers_count: number;
  average_rating: number;
  total_ratings_received: number;
}

type FilterType = "global" | "country" | "state" | "city";

export default function LeaderboardPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filter, setFilter] = useState<FilterType>("global");
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
  }, [filter, currentProfile]);

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

    let query = supabase
      .from("profiles")
      .select("*")
      .gt("total_images", 0)
      .order("average_rating", { ascending: false })
      .order("total_ratings_received", { ascending: false })
      .limit(100);

    // Apply filters based on current user's location
    if (filter !== "global" && currentProfile) {
      if (filter === "country" && currentProfile.country) {
        query = query.eq("country", currentProfile.country);
      } else if (filter === "state" && currentProfile.state) {
        query = query.eq("state", currentProfile.state);
      } else if (filter === "city" && currentProfile.city) {
        query = query.eq("city", currentProfile.city);
      }
    }

    const { data, error } = await query;

    if (error) {
      toast({ title: "Error", description: "Failed to load leaderboard", variant: "destructive" });
    } else {
      setProfiles(data || []);
    }
    setLoading(false);
  };

  const filterOptions = [
    { value: "global", label: "Global", icon: Globe },
    { value: "country", label: currentProfile?.country || "Country", icon: MapPin },
    { value: "state", label: currentProfile?.state || "State", icon: MapPin },
    { value: "city", label: currentProfile?.city || "City", icon: MapPin },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={currentProfile ? { id: currentProfile.id, username: currentProfile.username, avatarUrl: currentProfile.avatar_url, isAdmin } : null} />

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <Trophy className="w-10 h-10 text-gold" />
            <h1 className="text-4xl font-serif font-bold text-foreground">
              Leaderboard
            </h1>
          </div>
          <p className="text-muted-foreground">
            Top rated photographers ranked by average rating and total ratings
          </p>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              variant={filter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(option.value as FilterType)}
              disabled={option.value !== "global" && !currentProfile}
            >
              <option.icon className="w-4 h-4 mr-1" />
              {option.label}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-20 glass-card rounded-xl">
            <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No photographers found for this filter</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Try a different filter or check back later
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {profiles.map((profile, index) => (
              <LeaderboardItem
                key={profile.id}
                rank={index + 1}
                id={profile.id}
                username={profile.username}
                avatarUrl={profile.avatar_url}
                country={profile.country}
                city={profile.city}
                totalImages={profile.total_images}
                followersCount={profile.followers_count}
                averageRating={Number(profile.average_rating) || 0}
                totalRatingsReceived={profile.total_ratings_received}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
