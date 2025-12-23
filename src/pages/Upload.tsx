import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload as UploadIcon, X, Loader2, Image as ImageIcon, Shield, ShieldAlert, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIDetectionResult {
  isAI: boolean;
  confidence: number;
  reason: string;
}

export default function UploadPage() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [aiDetection, setAiDetection] = useState<AIDetectionResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    if (data) setProfile(data);
  };

  const detectAIImage = async (imageFile: File) => {
    setDetecting(true);
    setAiDetection(null);

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      const { data, error } = await supabase.functions.invoke("detect-ai-image", {
        body: { imageBase64: base64 },
      });

      if (error) throw error;

      setAiDetection(data);

      if (data.isAI && data.confidence > 70) {
        toast({
          title: "AI-Generated Image Detected",
          description: data.reason,
          variant: "destructive",
        });
      } else if (!data.isAI && data.confidence > 70) {
        toast({
          title: "Real Image Verified",
          description: "This appears to be a genuine photograph.",
        });
      }
    } catch (error: any) {
      console.error("AI detection error:", error);
      toast({
        title: "Detection Error",
        description: "Could not analyze image. You can still upload.",
        variant: "destructive",
      });
    } finally {
      setDetecting(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB", variant: "destructive" });
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    
    // Automatically run AI detection
    await detectAIImage(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    if (!title.trim()) {
      toast({ title: "Title required", description: "Please add a title for your photo", variant: "destructive" });
      return;
    }

    // Warn if image is detected as AI-generated
    if (aiDetection?.isAI && aiDetection.confidence > 70) {
      toast({
        title: "Warning",
        description: "This image appears to be AI-generated. Uploading anyway...",
      });
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("images")
        .getPublicUrl(fileName);

      const { error: insertError } = await supabase.from("images").insert({
        user_id: user.id,
        image_url: publicUrl,
        title: title.trim(),
        description: description.trim() || null,
        caption: caption.trim() || null,
        ai_detected: aiDetection?.isAI ?? null,
        ai_confidence: aiDetection?.confidence ?? null,
        ai_detection_reason: aiDetection?.reason ?? null,
      });

      if (insertError) throw insertError;

      toast({ title: "Success!", description: "Your photo has been uploaded" });
      navigate("/");
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setAiDetection(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const getDetectionBadge = () => {
    if (detecting) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Analyzing image...</span>
        </div>
      );
    }

    if (!aiDetection) return null;

    const { isAI, confidence, reason } = aiDetection;

    if (isAI && confidence > 70) {
      return (
        <div className="flex items-start gap-2 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg">
          <ShieldAlert className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-destructive">AI-Generated ({confidence}% confidence)</p>
            <p className="text-xs text-muted-foreground mt-0.5">{reason}</p>
          </div>
        </div>
      );
    }

    if (!isAI && confidence > 70) {
      return (
        <div className="flex items-start gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
          <ShieldCheck className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-500">Real Photo ({confidence}% confidence)</p>
            <p className="text-xs text-muted-foreground mt-0.5">{reason}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-start gap-2 px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <Shield className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-yellow-500">Uncertain ({confidence}% confidence)</p>
          <p className="text-xs text-muted-foreground mt-0.5">{reason}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={profile ? { id: profile.id, username: profile.username, avatarUrl: profile.avatar_url } : null} />

      <main className="container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-foreground mb-2">
            Upload Your <span className="text-gold">Best Shot</span>
          </h1>
          <p className="text-muted-foreground">
            Share your photography with the community
          </p>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-6">
          {/* File upload area */}
          <div className="space-y-2">
            <Label>Image</Label>
            {preview ? (
              <div className="relative rounded-xl overflow-hidden">
                <img src={preview} alt="Preview" className="w-full max-h-96 object-contain bg-secondary" />
                <button
                  onClick={clearFile}
                  className="absolute top-3 right-3 p-2 bg-background/80 backdrop-blur-sm rounded-full hover:bg-background transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-muted-foreground transition-colors"
              >
                <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">Click to select an image</p>
                <p className="text-xs text-muted-foreground/70">PNG, JPG, WEBP up to 10MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* AI Detection Badge */}
          {(detecting || aiDetection) && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                AI Detection
              </Label>
              {getDetectionBadge()}
            </div>
          )}

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Give your photo a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground text-right">{title.length}/100</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Tell the story behind this photo..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={4}
            />
            <p className="text-xs text-muted-foreground text-right">{description.length}/1000</p>
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption">Short Caption (optional)</Label>
            <Input
              id="caption"
              placeholder="A short caption for quick viewing..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={150}
            />
            <p className="text-xs text-muted-foreground text-right">{caption.length}/150</p>
          </div>

          {/* Upload button */}
          <Button
            onClick={handleUpload}
            disabled={!file || !title.trim() || uploading || detecting}
            className={cn(
              "w-full",
              aiDetection?.isAI && aiDetection.confidence > 70 && "bg-destructive hover:bg-destructive/90"
            )}
            size="lg"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : detecting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : aiDetection?.isAI && aiDetection.confidence > 70 ? (
              <>
                <ShieldAlert className="w-4 h-4" />
                Upload Anyway (AI Detected)
              </>
            ) : (
              <>
                <UploadIcon className="w-4 h-4" />
                Upload Photo
              </>
            )}
          </Button>
        </div>
      </main>
    </div>
  );
}
