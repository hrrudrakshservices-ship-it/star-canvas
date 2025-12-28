import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, User, Globe, LockKeyhole, UserCircle, MapPin, Calendar, Loader2 } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  username: z.string().min(3, "Username must be at least 3 characters").max(20).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  age: z.number().min(13, "Must be at least 13 years old").max(120, "Invalid age").optional(),
});

const CONTINENTS = [
  "Africa", "Antarctica", "Asia", "Europe", "North America", "Oceania", "South America"
];

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [location, setLocation] = useState<{
    continent?: string;
    country?: string;
    countryCode?: string;
    state?: string;
    district?: string;
    city?: string;
  }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auto-detect location
  useEffect(() => {
    setDetectingLocation(true);
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        // Map country to continent
        const continent = getContinent(data.country_code);
        setLocation({
          continent,
          country: data.country_name,
          countryCode: data.country_code,
          state: data.region,
          district: data.region, // Use region as district if not available
          city: data.city,
        });
      })
      .catch(() => {})
      .finally(() => setDetectingLocation(false));
  }, []);

  const getContinent = (countryCode: string): string => {
    const continentMap: Record<string, string> = {
      // Asia
      IN: "Asia", PK: "Asia", BD: "Asia", LK: "Asia", NP: "Asia", CN: "Asia", JP: "Asia", KR: "Asia",
      ID: "Asia", MY: "Asia", TH: "Asia", VN: "Asia", PH: "Asia", SG: "Asia", AE: "Asia", SA: "Asia",
      // Europe
      GB: "Europe", DE: "Europe", FR: "Europe", IT: "Europe", ES: "Europe", NL: "Europe", BE: "Europe",
      CH: "Europe", AT: "Europe", PL: "Europe", SE: "Europe", NO: "Europe", DK: "Europe", FI: "Europe",
      // North America
      US: "North America", CA: "North America", MX: "North America",
      // South America
      BR: "South America", AR: "South America", CL: "South America", CO: "South America", PE: "South America",
      // Africa
      ZA: "Africa", NG: "Africa", EG: "Africa", KE: "Africa", MA: "Africa",
      // Oceania
      AU: "Oceania", NZ: "Oceania",
    };
    return continentMap[countryCode] || "Asia";
  };

  // Listen for auth state changes and redirect when logged in
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setTimeout(() => {
          navigate("/");
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate("/");
      } else {
        const ageNum = age ? parseInt(age) : undefined;
        const validation = signUpSchema.safeParse({ name, username, email, password, age: ageNum });
        if (!validation.success) {
          throw new Error(validation.error.errors[0].message);
        }

        // Check if username already exists
        const { data: existingUsername } = await supabase
          .from("profiles")
          .select("username")
          .eq("username", username.toLowerCase())
          .maybeSingle();

        if (existingUsername) {
          throw new Error("This username is already taken. Please choose another.");
        }

        // Check if email already exists
        const { data: existingEmail } = await supabase
          .from("profiles")
          .select("email")
          .eq("email", email.toLowerCase())
          .maybeSingle();

        if (existingEmail) {
          throw new Error("An account with this email already exists. Try signing in.");
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { username, name },
          },
        });

        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase.from("profiles").insert({
            id: data.user.id,
            name,
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            age: ageNum || null,
            continent: location.continent,
            country: location.country,
            country_code: location.countryCode,
            state: location.state,
            district: location.district,
            city: location.city,
            is_public: isPublic,
          });

          if (profileError && !profileError.message.includes("duplicate")) {
            throw profileError;
          }
        }

        toast({ title: "Account created!", description: "Welcome to RateGallery" });
        navigate("/");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={null} />
      <div className="flex items-center justify-center p-4 pt-24 min-h-screen">
        <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-foreground mb-2">
            Rate<span className="text-gold">Gallery</span>
          </h1>
          <p className="text-muted-foreground">
            {isLogin ? "Welcome back" : "Create your account"}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="age"
                        type="number"
                        placeholder="Your age"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className="pl-10"
                        min={13}
                        max={120}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Choose a unique username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Location fields - only during signup */}
            {!isLogin && (
              <div className="space-y-4 p-4 rounded-lg bg-secondary/30">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>Location (editable)</span>
                  {detectingLocation && <Loader2 className="w-3 h-3 animate-spin" />}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Continent</Label>
                    <Select value={location.continent} onValueChange={(v) => setLocation(prev => ({ ...prev, continent: v }))}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTINENTS.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Country</Label>
                    <Input
                      value={location.country || ""}
                      onChange={(e) => setLocation(prev => ({ ...prev, country: e.target.value }))}
                      className="h-9"
                      placeholder="Country"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">State</Label>
                    <Input
                      value={location.state || ""}
                      onChange={(e) => setLocation(prev => ({ ...prev, state: e.target.value }))}
                      className="h-9"
                      placeholder="State"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">District</Label>
                    <Input
                      value={location.district || ""}
                      onChange={(e) => setLocation(prev => ({ ...prev, district: e.target.value }))}
                      className="h-9"
                      placeholder="District"
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">City</Label>
                    <Input
                      value={location.city || ""}
                      onChange={(e) => setLocation(prev => ({ ...prev, city: e.target.value }))}
                      className="h-9"
                      placeholder="City"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Account Type Selection - Only show during signup */}
            {!isLogin && (
              <div className="space-y-3">
                <Label>Account Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all text-left",
                      isPublic
                        ? "border-gold bg-gold/10"
                        : "border-border hover:border-muted-foreground"
                    )}
                  >
                    <Globe className={cn(
                      "w-5 h-5 mb-1",
                      isPublic ? "text-gold" : "text-muted-foreground"
                    )} />
                    <p className="font-medium text-foreground text-sm">Public</p>
                    <p className="text-xs text-muted-foreground">Everyone can see</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all text-left",
                      !isPublic
                        ? "border-gold bg-gold/10"
                        : "border-border hover:border-muted-foreground"
                    )}
                  >
                    <LockKeyhole className={cn(
                      "w-5 h-5 mb-1",
                      !isPublic ? "text-gold" : "text-muted-foreground"
                    )} />
                    <p className="font-medium text-foreground text-sm">Private</p>
                    <p className="text-xs text-muted-foreground">Followers only</p>
                  </button>
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Loading..." : isLogin ? "Sign In" : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
