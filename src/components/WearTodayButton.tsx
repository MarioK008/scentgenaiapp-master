import { CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WearTodayButtonProps {
  count: number;
  wornToday: boolean;
  onClick: () => void;
}

export const WearTodayButton = ({ count, wornToday, onClick }: WearTodayButtonProps) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant={wornToday ? "default" : "outline"}
        size="icon"
        className={cn(
          "h-9 w-9 rounded-full transition-smooth",
          wornToday && "bg-emerald-500 hover:bg-emerald-500 text-white"
        )}
        onClick={(e) => {
          e.stopPropagation();
          if (!wornToday) onClick();
        }}
        title={wornToday ? "Already worn today" : "Mark worn today"}
      >
        <CalendarCheck className="h-4 w-4" strokeWidth={1.5} />
      </Button>
      <span className="text-xs text-muted-foreground">
        {count > 0 ? `Worn ${count} ${count === 1 ? "time" : "times"}` : "Not worn yet"}
      </span>
    </div>
  );
};
