import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, User, Globe, LockKeyhole } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";

const signUpSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(20),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{country?: string; countryCode?: string; state?: string; city?: string}>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auto-detect location
  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        setLocation({
          country: data.country_name,
          countryCode: data.country_code,
          state: data.region,
          city: data.city,
        });
      })
      .catch(() => {});
  }, []);

  // Check if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/");
    });
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
        const validation = signUpSchema.safeParse({ username, email, password });
        if (!validation.success) {
          throw new Error(validation.error.errors[0].message);
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { username },
          },
        });

        if (error) throw error;

        if (data.user) {
          const { error: profileError } = await supabase.from("profiles").insert({
            id: data.user.id,
            username,
            email,
            country: location.country,
            country_code: location.countryCode,
            state: location.state,
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
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
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
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
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

            {/* Account Type Selection - Only show during signup */}
            {!isLogin && (
              <div className="space-y-3">
                <Label>Account Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPublic(true)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-left",
                      isPublic
                        ? "border-gold bg-gold/10"
                        : "border-border hover:border-muted-foreground"
                    )}
                  >
                    <Globe className={cn(
                      "w-6 h-6 mb-2",
                      isPublic ? "text-gold" : "text-muted-foreground"
                    )} />
                    <p className="font-medium text-foreground">Public</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Everyone can see your profile and images
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPublic(false)}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all text-left",
                      !isPublic
                        ? "border-gold bg-gold/10"
                        : "border-border hover:border-muted-foreground"
                    )}
                  >
                    <LockKeyhole className={cn(
                      "w-6 h-6 mb-2",
                      !isPublic ? "text-gold" : "text-muted-foreground"
                    )} />
                    <p className="font-medium text-foreground">Private</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Only followers can see your content
                    </p>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Note: Private accounts can switch to public later, but public accounts cannot become private.
                </p>
              </div>
            )}

            {!isLogin && location.country && (
              <div className="p-3 rounded-lg bg-secondary/50 text-sm">
                <p className="text-muted-foreground">
                  Location detected: <span className="text-foreground font-medium">{location.city}, {location.state}, {location.country}</span>
                </p>
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
  );
}
