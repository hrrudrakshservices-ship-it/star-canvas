import { useState } from "react";
import { Link } from "react-router-dom";
import { StarRating } from "./StarRating";
import { RatingInput } from "./RatingInput";
import { BadgeRank } from "./BadgeRank";
import { ReportDialog } from "./ReportDialog";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";
import { Flag, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface ImageCardProps {
  id: string;
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
  currentUserId?: string;
  onRate?: (rating: number) => void;
}

export const ImageCard = ({
  id,
  imageUrl,
  caption,
  averageRating,
  totalRatings,
  user,
  userRating,
  canRate = false,
  currentUserId,
  onRate,
}: ImageCardProps) => {
  const [showRating, setShowRating] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);

  const canReport = currentUserId && currentUserId !== user.id;

  return (
    <div className="masonry-item group">
      <div className="glass-card rounded-xl overflow-hidden hover-lift">
        {/* Image */}
        <div 
          className="relative cursor-pointer"
          onClick={() => canRate && setShowRating(!showRating)}
        >
          <div className={cn(
            "bg-muted animate-pulse aspect-[4/3]",
            isImageLoaded && "hidden"
          )} />
          <img
            src={imageUrl}
            alt={caption || "User uploaded image"}
            className={cn(
              "w-full object-cover transition-opacity duration-300",
              !isImageLoaded && "opacity-0 absolute inset-0"
            )}
            onLoad={() => setIsImageLoaded(true)}
          />
          
          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Rating badge */}
          <div className="absolute top-3 right-3 bg-background/80 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1.5">
            <StarRating rating={averageRating} size="sm" />
            <span className="text-xs font-medium text-foreground/80">
              ({totalRatings})
            </span>
          </div>

          {/* More options menu */}
          {canReport && (
            <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowReportDialog(true);
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Report Image
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Info section */}
        <div className="p-4 space-y-3">
          {/* User info */}
          <Link 
            to={`/profile/${user.id}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Avatar className="w-8 h-8 border border-border">
              <AvatarImage src={user.avatarUrl} alt={user.username} />
              <AvatarFallback className="text-xs bg-secondary">
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {user.username}
              </span>
              {user.badgeRank && <BadgeRank rank={user.badgeRank} size="sm" />}
            </div>
          </Link>

          {/* Caption */}
          {caption && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {caption}
            </p>
          )}

          {/* Rating input */}
          {showRating && canRate && (
            <div className="pt-2 border-t border-border animate-fade-in">
              <p className="text-xs text-muted-foreground mb-2">
                {userRating ? "Update your rating" : "Rate this image"}
              </p>
              <RatingInput
                initialRating={userRating || 0}
                onRate={(rating) => {
                  onRate?.(rating);
                  setShowRating(false);
                }}
              />
            </div>
          )}

          {/* Show existing user rating */}
          {userRating && !showRating && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Your rating:</span>
              <StarRating rating={userRating} size="sm" />
            </div>
          )}
        </div>
      </div>

      {/* Report Dialog */}
      {currentUserId && (
        <ReportDialog
          isOpen={showReportDialog}
          onClose={() => setShowReportDialog(false)}
          imageId={id}
          imageOwnerId={user.id}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
};
