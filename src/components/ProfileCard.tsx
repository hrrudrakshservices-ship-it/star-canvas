import { Link } from "react-router-dom";
import { StarRating } from "./StarRating";
import { BadgeRank } from "./BadgeRank";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { MapPin, Users, Image, Star, Globe, LockKeyhole } from "lucide-react";

interface ProfileCardProps {
  id: string;
  username: string;
  avatarUrl?: string;
  country?: string;
  city?: string;
  badgeRank?: number;
  totalImages: number;
  followersCount: number;
  averageRating: number;
  totalRatingsReceived: number;
  isFollowing?: boolean;
  isOwnProfile?: boolean;
  isPublic?: boolean;
  onFollow?: () => void;
  onUnfollow?: () => void;
  compact?: boolean;
}

export const ProfileCard = ({
  id,
  username,
  avatarUrl,
  country,
  city,
  badgeRank,
  totalImages,
  followersCount,
  averageRating,
  totalRatingsReceived,
  isFollowing,
  isOwnProfile,
  isPublic = true,
  onFollow,
  onUnfollow,
  compact = false,
}: ProfileCardProps) => {
  if (compact) {
    return (
      <Link
        to={`/profile/${id}`}
        className="glass-card rounded-xl p-4 hover-lift flex items-center gap-4"
      >
        <div className="relative">
          <Avatar className="w-12 h-12 border-2 border-border">
            <AvatarImage src={avatarUrl} alt={username} />
            <AvatarFallback className="bg-secondary text-sm">
              {username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {badgeRank && (
            <div className="absolute -bottom-1 -right-1">
              <BadgeRank rank={badgeRank} size="sm" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground truncate">{username}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
            <span className="flex items-center gap-1">
              <Image className="w-3 h-3" />
              {totalImages}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {followersCount}
            </span>
            <StarRating rating={averageRating} size="sm" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="relative">
          <Avatar className="w-20 h-20 border-2 border-border">
            <AvatarImage src={avatarUrl} alt={username} />
            <AvatarFallback className="bg-secondary text-xl">
              {username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {badgeRank && (
            <div className="absolute -bottom-2 -right-2">
              <BadgeRank rank={badgeRank} size="md" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-serif font-semibold text-foreground">
              {username}
            </h2>
            {isPublic ? (
              <Globe className="w-4 h-4 text-gold" />
            ) : (
              <LockKeyhole className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          {(country || city) && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="w-3 h-3" />
              {city && <span>{city},</span>}
              {country && <span>{country}</span>}
            </div>
          )}
        </div>

        {!isOwnProfile && (
          <Button
            variant={isFollowing ? "outline" : "default"}
            size="sm"
            onClick={isFollowing ? onUnfollow : onFollow}
          >
            {isFollowing ? "Unfollow" : "Follow"}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 rounded-lg bg-secondary/50">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Image className="w-4 h-4" />
          </div>
          <p className="text-lg font-semibold text-foreground">{totalImages}</p>
          <p className="text-xs text-muted-foreground">Images</p>
        </div>

        <div className="text-center p-3 rounded-lg bg-secondary/50">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Users className="w-4 h-4" />
          </div>
          <p className="text-lg font-semibold text-foreground">{followersCount}</p>
          <p className="text-xs text-muted-foreground">Followers</p>
        </div>

        <div className="text-center p-3 rounded-lg bg-secondary/50">
          <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
            <Star className="w-4 h-4" />
          </div>
          <p className="text-lg font-semibold text-foreground">
            {averageRating.toFixed(1)}
          </p>
          <p className="text-xs text-muted-foreground">Avg Rating</p>
        </div>
      </div>

      {/* Rating display */}
      <div className="flex items-center justify-center gap-3 p-4 rounded-lg bg-secondary/30">
        <StarRating rating={averageRating} size="lg" />
        <span className="text-sm text-muted-foreground">
          ({totalRatingsReceived} ratings)
        </span>
      </div>
    </div>
  );
};
