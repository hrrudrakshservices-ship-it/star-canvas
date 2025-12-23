import { Crown, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgeRankProps {
  rank: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export const BadgeRank = ({ rank, size = "md", showLabel = false }: BadgeRankProps) => {
  if (rank < 1 || rank > 3) return null;

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const badgeClasses = {
    sm: "p-1",
    md: "p-1.5",
    lg: "p-2",
  };

  const config = {
    1: {
      icon: Crown,
      label: "1st Place",
      bgClass: "badge-gold",
      iconClass: "text-amber-900",
    },
    2: {
      icon: Medal,
      label: "2nd Place",
      bgClass: "badge-silver",
      iconClass: "text-gray-700",
    },
    3: {
      icon: Award,
      label: "3rd Place",
      bgClass: "badge-bronze",
      iconClass: "text-amber-100",
    },
  }[rank];

  if (!config) return null;

  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "rounded-full flex items-center justify-center",
          badgeClasses[size],
          config.bgClass
        )}
      >
        <Icon className={cn(sizeClasses[size], config.iconClass)} />
      </div>
      {showLabel && (
        <span className="text-sm font-medium text-foreground/80">
          {config.label}
        </span>
      )}
    </div>
  );
};
