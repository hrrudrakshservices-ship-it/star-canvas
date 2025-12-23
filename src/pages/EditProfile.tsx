import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save, MapPin, User } from "lucide-react";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().max(100, "Name must be less than 100 characters").optional(),
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username must be less than 30 characters"),
  age: z.number().min(13, "Must be at least 13 years old").max(120, "Invalid age").optional().nullable(),
  continent: z.string().max(50, "Continent must be less than 50 characters").optional(),
  country: z.string().max(100, "Country must be less than 100 characters").optional(),
  state: z.string().max(100, "State must be less than 100 characters").optional(),
  district: z.string().max(100, "District must be less than 100 characters").optional(),
  city: z.string().max(100, "City must be less than 100 characters").optional(),
});

interface Profile {
  id: string;
  username: string;
  email: string;
  name?: string;
  avatar_url?: string;
  age?: number;
  continent?: string;
  country?: string;
  state?: string;
  district?: string;
  city?: string;
}

export default function EditProfile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Form fields
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const [continent, setContinent] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState("");
  const [district, setDistrict] = useState("");
  const [city, setCity] = useState("");
  
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      checkAdminRole();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      toast({ title: "Error", description: "Failed to load profile", variant: "destructive" });
      setLoading(false);
      return;
    }

    if (data) {
      setProfile(data);
      setName(data.name || "");
      setUsername(data.username || "");
      setAge(data.age?.toString() || "");
      setContinent(data.continent || "");
      setCountry(data.country || "");
      setState(data.state || "");
      setDistrict(data.district || "");
      setCity(data.city || "");
    }
    
    setLoading(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    const formData = {
      name: name.trim() || undefined,
      username: username.trim(),
      age: age ? parseInt(age) : null,
      continent: continent.trim() || undefined,
      country: country.trim() || undefined,
      state: state.trim() || undefined,
      district: district.trim() || undefined,
      city: city.trim() || undefined,
    };

    const result = profileSchema.safeParse(formData);
    
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as string;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);

    // Check if username is already taken (if changed)
    if (formData.username !== profile?.username) {
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", formData.username)
        .neq("id", user.id)
        .maybeSingle();

      if (existingUser) {
        setErrors({ username: "Username is already taken" });
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        name: formData.name,
        username: formData.username,
        age: formData.age,
        continent: formData.continent,
        country: formData.country,
        state: formData.state,
        district: formData.district,
        city: formData.city,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Profile updated successfully" });
      navigate(`/profile/${user.id}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const navbarUser = profile 
    ? { id: profile.id, username: profile.username, avatarUrl: profile.avatar_url, isAdmin }
    : null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={navbarUser} />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="glass-card rounded-xl p-6 md:p-8">
            <h1 className="text-2xl font-serif font-bold text-foreground mb-6">Edit Profile</h1>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-foreground mb-2">
                  <User className="w-5 h-5 text-gold" />
                  <h2 className="font-semibold">Personal Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className={errors.name ? "border-destructive" : ""}
                    />
                    {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Username *</Label>
                    <Input
                      id="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      className={errors.username ? "border-destructive" : ""}
                    />
                    {errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      placeholder="Your age"
                      min={13}
                      max={120}
                      className={errors.age ? "border-destructive" : ""}
                    />
                    {errors.age && <p className="text-xs text-destructive">{errors.age}</p>}
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-foreground mb-2">
                  <MapPin className="w-5 h-5 text-gold" />
                  <h2 className="font-semibold">Location Information</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Your location helps show your photos to people in your area.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="continent">Continent</Label>
                    <Input
                      id="continent"
                      value={continent}
                      onChange={(e) => setContinent(e.target.value)}
                      placeholder="e.g., Asia, Europe, Africa"
                      className={errors.continent ? "border-destructive" : ""}
                    />
                    {errors.continent && <p className="text-xs text-destructive">{errors.continent}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g., India, USA, UK"
                      className={errors.country ? "border-destructive" : ""}
                    />
                    {errors.country && <p className="text-xs text-destructive">{errors.country}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state">State / Province</Label>
                    <Input
                      id="state"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g., Bihar, California"
                      className={errors.state ? "border-destructive" : ""}
                    />
                    {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="district">District</Label>
                    <Input
                      id="district"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g., Patna, Los Angeles"
                      className={errors.district ? "border-destructive" : ""}
                    />
                    {errors.district && <p className="text-xs text-destructive">{errors.district}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g., Patna, San Francisco"
                      className={errors.city ? "border-destructive" : ""}
                    />
                    {errors.city && <p className="text-xs text-destructive">{errors.city}</p>}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/profile/${user?.id}`)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="flex-1">
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
