import { Button } from "@/components/ui/button";
import { Globe, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export type LocationLevel = "continent" | "country" | "state" | "district" | "city";

interface LocationFilterProps {
  activeFilter: LocationLevel;
  onFilterChange: (filter: LocationLevel) => void;
  userLocation?: {
    continent?: string;
    country?: string;
    state?: string;
    district?: string;
    city?: string;
  };
  className?: string;
}

const FILTER_OPTIONS: { value: LocationLevel; label: string; icon: typeof Globe }[] = [
  { value: "continent", label: "Continent", icon: Globe },
  { value: "country", label: "Country", icon: MapPin },
  { value: "state", label: "State", icon: MapPin },
  { value: "district", label: "District", icon: MapPin },
  { value: "city", label: "City", icon: MapPin },
];

export const LocationFilter = ({
  activeFilter,
  onFilterChange,
  userLocation,
  className,
}: LocationFilterProps) => {
  const getFilterLabel = (option: typeof FILTER_OPTIONS[0]) => {
    if (userLocation) {
      const locationValue = userLocation[option.value];
      if (locationValue) return locationValue;
    }
    return option.label;
  };

  return (
    <div className={cn("flex flex-wrap justify-center gap-2", className)}>
      {FILTER_OPTIONS.map((option) => {
        const Icon = option.icon;
        
        return (
          <Button
            key={option.value}
            variant={activeFilter === option.value ? "default" : "outline"}
            size="sm"
            onClick={() => onFilterChange(option.value)}
            className="transition-all"
          >
            <Icon className="w-4 h-4 mr-1" />
            {getFilterLabel(option)}
          </Button>
        );
      })}
    </div>
  );
};
