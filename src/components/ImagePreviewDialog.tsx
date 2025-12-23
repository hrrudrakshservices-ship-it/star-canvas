import { useState } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StarRating } from "./StarRating";
import { RatingInput } from "./RatingInput";
import { BadgeRank } from "./BadgeRank";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Flag, X } from "lucide-react";
import { Link } from "react-router-dom";

interface ImagePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  caption?: string;
  averageRating: number;
  totalRatings: number;
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
    badgeRank?: number;
  };
  userRating?: number;
  canRate?: boolean;
  canReport?: boolean;
  onRate?: (rating: number) => void;
  onReport?: () => void;
}

export const ImagePreviewDialog = ({
  isOpen,
  onClose,
  imageUrl,
  caption,
  averageRating,
  totalRatings,
  user,
  userRating,
  canRate = false,
  canReport = false,
  onRate,
  onReport,
}: ImagePreviewDialogProps) => {
  const [showRatingInput, setShowRatingInput] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card">
        <div className="flex flex-col lg:flex-row">
          {/* Image Section */}
          <div className="relative flex-1 bg-muted flex items-center justify-center min-h-[300px] lg:min-h-[500px]">
            <img
              src={imageUrl}
              alt={caption || "Image preview"}
              className="max-w-full max-h-[70vh] object-contain"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Details Section */}
          <div className="w-full lg:w-80 p-6 space-y-6 border-t lg:border-t-0 lg:border-l border-border">
            {/* User info */}
            <Link 
              to={`/profile/${user.id}`}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity"
              onClick={onClose}
            >
              <Avatar className="w-10 h-10 border border-border">
                <AvatarImage src={user.avatarUrl} alt={user.username} />
                <AvatarFallback className="text-sm bg-secondary">
                  {user.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">
                  {user.username}
                </span>
                {user.badgeRank && <BadgeRank rank={user.badgeRank} size="sm" />}
              </div>
            </Link>

            {/* Caption */}
            {caption && (
              <p className="text-muted-foreground">
                {caption}
              </p>
            )}

            {/* Rating Display */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <StarRating rating={averageRating} size="md" />
                <span className="text-sm text-muted-foreground">
                  ({totalRatings} {totalRatings === 1 ? "rating" : "ratings"})
                </span>
              </div>

              {/* User's rating */}
              {userRating && !showRatingInput && (
                <p className="text-sm text-muted-foreground">
                  Your rating: <span className="text-foreground font-medium">{userRating}/10</span>
                </p>
              )}
            </div>

            {/* Rating Input */}
            {canRate && (
              <div className="space-y-2">
                {!showRatingInput ? (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowRatingInput(true)}
                  >
                    {userRating ? "Update Rating" : "Rate This Image"}
                  </Button>
                ) : (
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <p className="text-sm font-medium">
                      {userRating ? "Update your rating" : "Rate this image"}
                    </p>
                    <RatingInput
                      initialRating={userRating || 0}
                      onRate={(rating) => {
                        onRate?.(rating);
                        setShowRatingInput(false);
                      }}
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setShowRatingInput(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Report Button */}
            {canReport && (
              <Button 
                variant="ghost" 
                className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={onReport}
              >
                <Flag className="w-4 h-4 mr-2" />
                Report Image
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
