import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";

interface FollowButtonProps {
  targetUserId: string;
  currentUserId?: string;
  isFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "outline" | "ghost";
}

export const FollowButton = ({
  targetUserId,
  currentUserId,
  isFollowing,
  onFollowChange,
  size = "sm",
  variant = "outline",
}: FollowButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleFollowToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUserId) {
      toast({ title: "Please sign in to follow users", variant: "destructive" });
      return;
    }

    if (currentUserId === targetUserId) return;

    setLoading(true);

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", targetUserId);

        if (error) throw error;
        onFollowChange?.(false);
        toast({ title: "Unfollowed" });
      } else {
        const { error } = await supabase.from("follows").insert({
          follower_id: currentUserId,
          following_id: targetUserId,
        });

        if (error) throw error;
        onFollowChange?.(true);
        toast({ title: "Following!" });
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (currentUserId === targetUserId) return null;

  return (
    <Button
      variant={isFollowing ? "outline" : variant}
      size={size}
      onClick={handleFollowToggle}
      disabled={loading || !currentUserId}
      className={isFollowing ? "hover:bg-destructive/10 hover:text-destructive hover:border-destructive" : ""}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">Unfollow</span>
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline ml-1">Follow</span>
        </>
      )}
    </Button>
  );
};
