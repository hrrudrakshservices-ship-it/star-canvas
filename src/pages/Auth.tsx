import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Mail, User, Globe, LockKeyhole, UserCircle, MapPin, Calendar, Loader2, KeyRound, ArrowLeft } from "lucide-react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  username: z.string().min(3, "Username must be at least 3 characters").max(20).regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  age: z.number().min(13, "Must be at least 13 years old").max(120, "Invalid age").optional(),
});

const CONTINENTS = [
  "Africa", "Antarctica", "Asia", "Europe", "North America", "Oceania", "South America"
];

type AuthStep = "email" | "otp" | "profile";

export default function Auth() {
  const [step, setStep] = useState<AuthStep>("email");
  const [isNewUser, setIsNewUser] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
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
        const continent = getContinent(data.country_code);
        setLocation({
          continent,
          country: data.country_name,
          countryCode: data.country_code,
          state: data.region,
          district: data.region,
          city: data.city,
        });
      })
      .catch(() => {})
      .finally(() => setDetectingLocation(false));
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const getContinent = (countryCode: string): string => {
    const continentMap: Record<string, string> = {
      IN: "Asia", PK: "Asia", BD: "Asia", LK: "Asia", NP: "Asia", CN: "Asia", JP: "Asia", KR: "Asia",
      ID: "Asia", MY: "Asia", TH: "Asia", VN: "Asia", PH: "Asia", SG: "Asia", AE: "Asia", SA: "Asia",
      GB: "Europe", DE: "Europe", FR: "Europe", IT: "Europe", ES: "Europe", NL: "Europe", BE: "Europe",
      CH: "Europe", AT: "Europe", PL: "Europe", SE: "Europe", NO: "Europe", DK: "Europe", FI: "Europe",
      US: "North America", CA: "North America", MX: "North America",
      BR: "South America", AR: "South America", CL: "South America", CO: "South America", PE: "South America",
      ZA: "Africa", NG: "Africa", EG: "Africa", KE: "Africa", MA: "Africa",
      AU: "Oceania", NZ: "Oceania",
    };
    return continentMap[countryCode] || "Asia";
  };

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && step !== "profile") {
        // Check if user has a profile
        setTimeout(async () => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id")
            .eq("id", session.user.id)
            .maybeSingle();

          if (profile) {
            navigate("/");
          } else {
            setIsNewUser(true);
            setStep("profile");
          }
        }, 0);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        supabase.from("profiles").select("id").eq("id", session.user.id).maybeSingle()
          .then(({ data: profile }) => {
            if (profile) {
              navigate("/");
            } else {
              setIsNewUser(true);
              setStep("profile");
            }
          });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, step]);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      toast({
        title: "OTP Sent!",
        description: "Check your email for the verification code",
      });
      setStep("otp");
      setResendCooldown(60);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) throw error;

      if (data.user) {
        // Check if profile exists
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("id", data.user.id)
          .maybeSingle();

        if (existingProfile) {
          toast({ title: "Welcome back!", description: "Successfully logged in" });
          navigate("/");
        } else {
          setIsNewUser(true);
          setStep("profile");
        }
      }
    } catch (error: any) {
      toast({
        title: "Invalid OTP",
        description: error.message || "Please check the code and try again",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const ageNum = age ? parseInt(age) : undefined;
      const validation = signUpSchema.safeParse({ name, username, email, age: ageNum });
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

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
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

      toast({ title: "Welcome!", description: "Your profile has been created" });
      navigate("/");
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to sign in with Google",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      toast({
        title: "OTP Resent!",
        description: "Check your email for the new code",
      });
      setResendCooldown(60);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === "otp") {
      setStep("email");
      setOtp("");
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
              {step === "email" && "Sign in or create an account"}
              {step === "otp" && "Enter verification code"}
              {step === "profile" && "Complete your profile"}
            </p>
          </div>

          <div className="glass-card rounded-2xl p-8">
            {/* Email Step */}
            {step === "email" && (
              <form onSubmit={handleSendOTP} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
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
                  <p className="text-xs text-muted-foreground">
                    We'll send you a one-time verification code
                  </p>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading || !email}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4 mr-2" />
                      Send OTP
                    </>
                  )}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </form>
            )}

            {/* OTP Verification Step */}
            {step === "otp" && (
              <form onSubmit={handleVerifyOTP} className="space-y-6">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>

                <div className="text-center space-y-2">
                  <div className="w-16 h-16 mx-auto bg-gold/10 rounded-full flex items-center justify-center mb-4">
                    <Mail className="w-8 h-8 text-gold" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Enter the 6-digit code sent to
                  </p>
                  <p className="font-medium text-foreground">{email}</p>
                </div>

                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={(value) => setOtp(value)}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button type="submit" className="w-full" size="lg" disabled={loading || otp.length !== 6}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Continue"
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resendCooldown > 0 || loading}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {resendCooldown > 0 
                      ? `Resend code in ${resendCooldown}s` 
                      : "Didn't receive code? Resend"}
                  </button>
                </div>
              </form>
            )}

            {/* Profile Setup Step */}
            {step === "profile" && (
              <form onSubmit={handleCreateProfile} className="space-y-4">
                <div className="text-center mb-4">
                  <div className="w-16 h-16 mx-auto bg-gold/10 rounded-full flex items-center justify-center mb-2">
                    <UserCircle className="w-8 h-8 text-gold" />
                  </div>
                  <p className="text-sm text-muted-foreground">Set up your profile</p>
                </div>

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

                {/* Location fields */}
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

                {/* Account Type Selection */}
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

                <Button type="submit" className="w-full" size="lg" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Create Profile"
                  )}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
