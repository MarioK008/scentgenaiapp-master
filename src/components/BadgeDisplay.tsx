import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Award } from "lucide-react";

interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earned?: boolean;
  earned_at?: string;
}

interface BadgeDisplayProps {
  badges: BadgeItem[];
  title?: string;
  description?: string;
  showProgress?: boolean;
  maxDisplay?: number;
}

export const BadgeDisplay = ({ 
  badges, 
  title = "Badges", 
  description = "Achievements earned",
  showProgress = false,
  maxDisplay 
}: BadgeDisplayProps) => {
  const earnedBadges = badges.filter(b => b.earned);
  const displayBadges = maxDisplay ? earnedBadges.slice(0, maxDisplay) : earnedBadges;
  
  if (earnedBadges.length === 0 && !showProgress) {
    return null;
  }

  const categoryGroups = badges.reduce((acc, badge) => {
    if (!acc[badge.category]) {
      acc[badge.category] = [];
    }
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, BadgeItem[]>);

  const categoryNames: Record<string, string> = {
    collection: "Collection",
    wishlist: "Wishlist",
    engagement: "Engagement",
    discovery: "Discovery",
    social: "Social",
  };

  if (showProgress) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <CardTitle>{title}</CardTitle>
          </div>
          <CardDescription>
            {earnedBadges.length} of {badges.length} badges earned
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(categoryGroups).map(([category, categoryBadges]) => (
            <div key={category} className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase">
                {categoryNames[category] || category}
              </h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {categoryBadges.map((badge) => (
                  <TooltipProvider key={badge.id}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className={`
                            flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all cursor-help
                            ${
                              badge.earned
                                ? "border-primary bg-primary/5 hover:bg-primary/10"
                                : "border-muted bg-muted/30 opacity-50"
                            }
                          `}
                        >
                          <span className="text-2xl">{badge.icon}</span>
                          <span className="text-[10px] text-center font-medium line-clamp-1">
                            {badge.name}
                          </span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="space-y-1">
                          <p className="font-semibold">{badge.icon} {badge.name}</p>
                          <p className="text-sm">{badge.description}</p>
                          {badge.earned && badge.earned_at && (
                            <p className="text-xs text-muted-foreground">
                              Earned {new Date(badge.earned_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <CardTitle>{title}</CardTitle>
          </div>
          <Badge variant="secondary">{earnedBadges.length}</Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {displayBadges.map((badge) => (
            <TooltipProvider key={badge.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-full cursor-help hover:bg-primary/20 transition-colors">
                    <span className="text-lg">{badge.icon}</span>
                    <span className="text-sm font-medium">{badge.name}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{badge.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {maxDisplay && earnedBadges.length > maxDisplay && (
            <div className="flex items-center px-3 py-1.5 bg-muted rounded-full">
              <span className="text-sm text-muted-foreground">
                +{earnedBadges.length - maxDisplay} more
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
