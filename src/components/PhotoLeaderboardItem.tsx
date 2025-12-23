import { Link } from "react-router-dom";
import { StarRating } from "./StarRating";
import { BadgeRank } from "./BadgeRank";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Trophy, Image as ImageIcon, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoLeaderboardItemProps {
  rank: number;
  imageId: string;
  imageUrl: string;
  title?: string;
  caption?: string;
  averageRating: number;
  totalRatings: number;
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
    badgeRank?: number;
  };
  streak?: number;
}

export const PhotoLeaderboardItem = ({
  rank,
  imageId,
  imageUrl,
  title,
  caption,
  averageRating,
  totalRatings,
  user,
  streak,
}: PhotoLeaderboardItemProps) => {
  const isTopThree = rank <= 3;
  
  const getRankColor = () => {
    switch (rank) {
      case 1: return "text-gold bg-gold/20 border-gold";
      case 2: return "text-silver bg-silver/20 border-silver";
      case 3: return "text-bronze bg-bronze/20 border-bronze";
      default: return "text-muted-foreground bg-secondary border-border";
    }
  };

  return (
    <div className={cn(
      "glass-card rounded-xl p-4 transition-all hover:scale-[1.01]",
      isTopThree && "border-2",
      rank === 1 && "border-gold/50",
      rank === 2 && "border-silver/50",
      rank === 3 && "border-bronze/50"
    )}>
      <div className="flex items-center gap-4">
        {/* Rank */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold",
          getRankColor()
        )}>
          {isTopThree ? (
            <Trophy className="w-5 h-5" />
          ) : (
            <span className="text-sm">{rank}</span>
          )}
        </div>

        {/* Image thumbnail */}
        <Link to={`/image/${imageId}`} className="shrink-0">
          <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary">
            <img
              src={imageUrl}
              alt={title || caption || "Photo"}
              className="w-full h-full object-cover hover:scale-110 transition-transform"
            />
          </div>
        </Link>

        {/* Photo info */}
        <div className="flex-1 min-w-0">
          <Link to={`/image/${imageId}`} className="hover:underline">
            <h3 className="font-medium text-foreground truncate">
              {title || caption || "Untitled"}
            </h3>
          </Link>
          
          {/* User */}
          <Link 
            to={`/profile/${user.id}`}
            className="flex items-center gap-2 mt-1 hover:opacity-80"
          >
            <Avatar className="w-5 h-5">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="text-[10px]">
                {user.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{user.username}</span>
            {user.badgeRank && <BadgeRank rank={user.badgeRank} size="sm" />}
          </Link>
        </div>

        {/* Streak badge */}
        {streak && streak > 0 && (
          <div className="hidden sm:flex items-center gap-1 px-2 py-1 bg-orange-500/20 text-orange-500 rounded-full text-xs font-medium">
            <Flame className="w-3 h-3" />
            {streak}d
          </div>
        )}

        {/* Rating */}
        <div className="text-right">
          <div className="flex items-center gap-1">
            <StarRating rating={averageRating} size="sm" />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {totalRatings} ratings
          </p>
        </div>
      </div>
    </div>
  );
};
