import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type TopLimit = 10 | 100 | 1000;

interface TopLimitToggleProps {
  activeLimit: TopLimit;
  onLimitChange: (limit: TopLimit) => void;
  className?: string;
}

const LIMITS: TopLimit[] = [10, 100, 1000];

export const TopLimitToggle = ({
  activeLimit,
  onLimitChange,
  className,
}: TopLimitToggleProps) => {
  return (
    <div className={cn("flex items-center gap-1 bg-secondary/50 rounded-lg p-1", className)}>
      {LIMITS.map((limit) => (
        <Button
          key={limit}
          variant={activeLimit === limit ? "default" : "ghost"}
          size="sm"
          onClick={() => onLimitChange(limit)}
          className={cn(
            "min-w-[60px]",
            activeLimit !== limit && "hover:bg-secondary"
          )}
        >
          Top {limit}
        </Button>
      ))}
    </div>
  );
};
