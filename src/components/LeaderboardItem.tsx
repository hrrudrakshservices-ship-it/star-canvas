import { Link } from "react-router-dom";
import { StarRating } from "./StarRating";
import { BadgeRank } from "./BadgeRank";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { MapPin, Image, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface LeaderboardItemProps {
  rank: number;
  id: string;
  username: string;
  avatarUrl?: string;
  country?: string;
  city?: string;
  totalImages: number;
  followersCount: number;
  averageRating: number;
  totalRatingsReceived: number;
}

export const LeaderboardItem = ({
  rank,
  id,
  username,
  avatarUrl,
  country,
  city,
  totalImages,
  followersCount,
  averageRating,
  totalRatingsReceived,
}: LeaderboardItemProps) => {
  const isTopThree = rank <= 3;

  return (
    <Link
      to={`/profile/${id}`}
      className={cn(
        "glass-card rounded-xl p-4 hover-lift flex items-center gap-4 transition-all",
        isTopThree && "border-2",
        rank === 1 && "border-gold/50 bg-gold/5",
        rank === 2 && "border-silver/50 bg-silver/5",
        rank === 3 && "border-bronze/50 bg-bronze/5"
      )}
    >
      {/* Rank */}
      <div className="w-12 flex-shrink-0 flex items-center justify-center">
        {isTopThree ? (
          <BadgeRank rank={rank} size="lg" />
        ) : (
          <span className="text-xl font-bold text-muted-foreground">#{rank}</span>
        )}
      </div>

      {/* Avatar */}
      <Avatar className={cn(
        "w-14 h-14 border-2",
        rank === 1 && "border-gold",
        rank === 2 && "border-silver",
        rank === 3 && "border-bronze",
        !isTopThree && "border-border"
      )}>
        <AvatarImage src={avatarUrl} alt={username} />
        <AvatarFallback className="bg-secondary">
          {username.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "font-semibold truncate",
            isTopThree ? "text-lg" : "text-base"
          )}>
            {username}
          </span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
          <MapPin className="w-3 h-3" />
          {city && <span>{city},</span>}
          {country && <span>{country}</span>}
        </div>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-6 text-sm">
        <div className="text-center">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Image className="w-4 h-4" />
            <span className="font-medium text-foreground">{totalImages}</span>
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="font-medium text-foreground">{followersCount}</span>
          </div>
        </div>
      </div>

      {/* Rating */}
      <div className="flex flex-col items-end gap-1">
        <StarRating rating={averageRating} size="sm" />
        <span className="text-xs text-muted-foreground">
          {totalRatingsReceived} ratings
        </span>
      </div>
    </Link>
  );
};
