import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingInputProps {
  initialRating?: number;
  onRate: (rating: number) => void;
  disabled?: boolean;
}

export const RatingInput = ({ initialRating = 0, onRate, disabled = false }: RatingInputProps) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [selectedRating, setSelectedRating] = useState(initialRating);

  const totalStars = 5;
  const displayRating = hoverRating !== null ? hoverRating : selectedRating;

  const handleMouseMove = (starIndex: number, event: React.MouseEvent) => {
    if (disabled) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const isHalf = event.clientX - rect.left < rect.width / 2;
    // Convert to 1-10 scale
    const rating = isHalf ? starIndex * 2 + 1 : (starIndex + 1) * 2;
    setHoverRating(rating);
  };

  const handleClick = () => {
    if (disabled || hoverRating === null) return;
    setSelectedRating(hoverRating);
    onRate(hoverRating);
  };

  return (
    <div 
      className={cn(
        "flex gap-1",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onMouseLeave={() => setHoverRating(null)}
    >
      {Array.from({ length: totalStars }).map((_, index) => {
        const starValue = displayRating / 2;
        const filled = starValue >= index + 1;
        const halfFilled = !filled && starValue > index && starValue < index + 1;

        return (
          <div
            key={index}
            className={cn(
              "relative cursor-pointer transition-transform hover:scale-110",
              disabled && "pointer-events-none"
            )}
            onMouseMove={(e) => handleMouseMove(index, e)}
            onClick={handleClick}
          >
            {/* Empty star background */}
            <Star className="w-8 h-8 text-muted-foreground/30 stroke-[1.5]" />
            
            {/* Filled portion */}
            {(filled || halfFilled) && (
              <div
                className="absolute inset-0 overflow-hidden transition-all"
                style={{ width: halfFilled ? "50%" : "100%" }}
              >
                <Star className="w-8 h-8 text-gold fill-gold stroke-gold-dark stroke-[1.5]" />
              </div>
            )}
          </div>
        );
      })}
      
      {displayRating > 0 && (
        <span className="ml-2 text-lg font-medium text-foreground/80">
          {displayRating}/10
        </span>
      )}
    </div>
  );
};
