import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Shield, Users, Image, AlertTriangle, Trash2, Eye, Ban, Check } from "lucide-react";
import { StarRating } from "@/components/StarRating";

interface Profile {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  country?: string;
  total_images: number;
  average_rating: number;
  created_at: string;
}

interface ImageData {
  id: string;
  image_url: string;
  caption?: string;
  is_flagged: boolean;
  flag_reason?: string;
  user_id: string;
  created_at: string;
  average_rating: number;
  profile?: Profile;
}

interface Notification {
  id: string;
  image_id?: string;
  user_id?: string;
  notification_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<Profile[]>([]);
  const [images, setImages] = useState<ImageData[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState("users");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setCurrentUser(session.user);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setCurrentUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (currentUser) {
      checkAdminAccess();
    }
  }, [currentUser]);

  const checkAdminAccess = async () => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", currentUser.id)
      .maybeSingle();
    
    if (profileData) setCurrentProfile(profileData);

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      toast({ title: "Access Denied", description: "You don't have admin permissions", variant: "destructive" });
      navigate("/");
      return;
    }

    setIsAdmin(true);
    setLoading(false);
    fetchData();
  };

  const fetchData = async () => {
    // Fetch users
    const { data: usersData } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setUsers(usersData || []);

    // Fetch flagged images
    const { data: imagesData } = await supabase
      .from("images")
      .select("*")
      .eq("is_flagged", true)
      .order("created_at", { ascending: false });

    if (imagesData) {
      const userIds = [...new Set(imagesData.map(img => img.user_id))];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .in("id", userIds);

      const profilesMap: Record<string, Profile> = {};
      if (profilesData) {
        profilesData.forEach(p => profilesMap[p.id] = p);
      }

      setImages(imagesData.map(img => ({
        ...img,
        profile: profilesMap[img.user_id],
      })));
    }

    // Fetch notifications
    const { data: notifData } = await supabase
      .from("admin_notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications(notifData || []);
  };

  const handleDeleteImage = async (imageId: string) => {
    const { error } = await supabase.from("images").delete().eq("id", imageId);
    if (error) {
      toast({ title: "Error", description: "Failed to delete image", variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Image has been removed" });
      fetchData();
    }
  };

  const handleUnflagImage = async (imageId: string) => {
    const { error } = await supabase
      .from("images")
      .update({ is_flagged: false, flag_reason: null })
      .eq("id", imageId);
    if (error) {
      toast({ title: "Error", description: "Failed to unflag image", variant: "destructive" });
    } else {
      toast({ title: "Unflagged", description: "Image has been approved" });
      fetchData();
    }
  };

  const handleMarkNotificationRead = async (notifId: string) => {
    await supabase.from("admin_notifications").update({ is_read: true }).eq("id", notifId);
    fetchData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={currentProfile ? { id: currentProfile.id, username: currentProfile.username, avatarUrl: currentProfile.avatar_url, isAdmin: true } : null} />

      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-gold" />
          <h1 className="text-3xl font-serif font-bold text-foreground">Admin Panel</h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="flagged" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Flagged ({images.length})
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Notifications ({notifications.filter(n => !n.is_read).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">User</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Email</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Country</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Images</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Rating</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Joined</th>
                      <th className="text-right p-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t border-border hover:bg-secondary/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={user.avatar_url} />
                              <AvatarFallback>{user.username.slice(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{user.username}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{user.email}</td>
                        <td className="p-4 text-sm">{user.country || "-"}</td>
                        <td className="p-4 text-sm">{user.total_images}</td>
                        <td className="p-4">
                          <StarRating rating={Number(user.average_rating) || 0} size="sm" />
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="p-4 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/profile/${user.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="flagged">
            {images.length === 0 ? (
              <div className="text-center py-12 glass-card rounded-xl">
                <Check className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <p className="text-muted-foreground">No flagged images</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {images.map((image) => (
                  <div key={image.id} className="glass-card rounded-xl overflow-hidden">
                    <img
                      src={image.image_url}
                      alt="Flagged"
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={image.profile?.avatar_url} />
                          <AvatarFallback>{image.profile?.username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{image.profile?.username}</span>
                      </div>
                      {image.flag_reason && (
                        <Badge variant="destructive" className="text-xs">
                          {image.flag_reason}
                        </Badge>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleUnflagImage(image.id)}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                          onClick={() => handleDeleteImage(image.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notifications">
            {notifications.length === 0 ? (
              <div className="text-center py-12 glass-card rounded-xl">
                <p className="text-muted-foreground">No notifications</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`glass-card rounded-xl p-4 flex items-start gap-4 ${
                      notif.is_read ? "opacity-60" : ""
                    }`}
                  >
                    <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                      notif.notification_type === "flagged_image" ? "text-destructive" : "text-gold"
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(notif.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!notif.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkNotificationRead(notif.id)}
                      >
                        Mark read
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
