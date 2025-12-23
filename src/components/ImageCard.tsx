import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { StarRating } from "./StarRating";
import { BadgeRank } from "./BadgeRank";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cn } from "@/lib/utils";

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
}: ImageCardProps) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="masonry-item group">
      <div className="glass-card rounded-xl overflow-hidden hover-lift">
        {/* Image */}
        <div 
          className="relative cursor-pointer"
          onClick={() => navigate(`/image/${id}`)}
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

          {/* Show existing user rating */}
          {userRating && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Your rating:</span>
              <StarRating rating={userRating} size="sm" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
