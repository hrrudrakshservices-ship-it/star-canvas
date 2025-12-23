import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number; // 1-10 scale
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export const StarRating = ({
  rating,
  maxRating = 10,
  size = "md",
  interactive = false,
  onRatingChange,
}: StarRatingProps) => {
  // Convert 1-10 rating to 5 stars (each star = 2 points)
  const starValue = rating / 2;
  const totalStars = 5;

  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-5 h-5",
    lg: "w-7 h-7",
  };

  const handleClick = (starIndex: number, isHalf: boolean) => {
    if (!interactive || !onRatingChange) return;
    // Convert star click to 1-10 scale
    const newRating = isHalf ? starIndex * 2 + 1 : (starIndex + 1) * 2;
    onRatingChange(Math.min(newRating, maxRating));
  };

  return (
    <div className="star-rating">
      {Array.from({ length: totalStars }).map((_, index) => {
        const filled = starValue >= index + 1;
        const halfFilled = !filled && starValue > index && starValue < index + 1;

        return (
          <div
            key={index}
            className={cn(
              "relative",
              interactive && "cursor-pointer hover:scale-110 transition-transform"
            )}
            onClick={() => handleClick(index, false)}
          >
            {/* Background star (empty) */}
            <Star
              className={cn(
                sizeClasses[size],
                "text-muted-foreground/30 stroke-[1.5]"
              )}
            />
            
            {/* Filled star overlay */}
            {(filled || halfFilled) && (
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: halfFilled ? "50%" : "100%" }}
              >
                <Star
                  className={cn(
                    sizeClasses[size],
                    "text-gold fill-gold stroke-gold-dark stroke-[1.5]"
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
